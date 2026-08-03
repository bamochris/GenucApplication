/**
 * 🔐 Context Authentification amélioré
 * - Gestion tokens sécurisée
 * - Refresh token automatique
 * - Role-based access control (RBAC)
 * - Validation user profile
 */
import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { viderTout as viderCacheRequetes } from '../api/requestCache';
import { activerNotificationsPush, desactiverNotificationsPush } from '../utils/pushNotifications';
import { validatePassword } from '../utils/validators';

export const AuthContext = createContext();

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const logoutRef = useRef(null);
  const etaitAuthentifieRef = useRef(false);

   // Récupère le profil COMPLET depuis /api/auth/moi : role, universiteId,
   // inscriptionId, nomComplet, photoProfil — la même forme que la réponse de
   // connexion, jetons exclus.
   //
   // C'est cet appel qui reconstitue la session à chaque chargement de page.
   // L'endpoint ne renvoyait qu'email + roles (les autorités Spring) : `role`
   // étant absent, hasRole() échouait et toute route protégée renvoyait vers
   // /forbidden dès le premier rafraîchissement, alors que la session était
   // parfaitement valide. universiteId et inscriptionId manquaient de même.
   //
   // Les cookies HttpOnly sont envoyés automatiquement par le navigateur.
   const fetchUserProfile = useCallback(async () => {
     try {
       const response = await api.get('/api/auth/moi');

       if (!response.data?.email) {
         throw new Error('Profil utilisateur invalide');
       }

       return response.data;
     } catch (err) {
       throw new Error(`Impossible de charger le profil: ${err.message}`);
     }
   }, []);

    // ✅ Initialise l'authentification au montage
    // Avec les cookies HttpOnly, le navigateur envoie automatiquement
    // le cookie genuc_token avec chaque requête (withCredentials: true).
    // Un appel GET préliminaire à un endpoint public initialise le
    // cookie CSRF (XSRF-TOKEN) nécessaire pour les requêtes POST.
    useEffect(() => {
      const initAuth = async () => {
        try {
          await api.get('/api/universites/public');
        } catch {
          // Ignorer — l'endpoint public peut ne pas être disponible
          // en mode dev sans base de données. Le cookie CSRF sera
          // quand même défini par le backend sur la réponse.
        }
        try {
          const response = await api.get('/api/auth/moi');

          if (response.data?.email) {
            setUser(response.data);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } catch {
          // 401 ou erreur réseau → pas de session valide
          setIsAuthenticated(false);
        } finally {
          setIsLoading(false);
        }
      };

      initAuth();
    }, []);

  // ✅ Login
  const login = useCallback(async (email, password) => {
    // Validation entrées : l'identifiant peut être un email OU un matricule
    // étudiant (beaucoup d'étudiants n'ont pas d'adresse email — le backend
    // résout le matricule vers le compte).
    const identifiant = (email || '').trim();
    const identifiantValide = isValidEmail(identifiant) || /^[A-Za-z0-9][A-Za-z0-9/_.-]{2,49}$/.test(identifiant);
    if (!identifiantValide || !password) {
      throw new Error('Email/matricule ou mot de passe invalide');
    }
    // NE JAMAIS appliquer la politique de mot de passe ici : à la connexion, le
    // mot de passe est déjà fixé et seul le backend peut le juger. Un contrôle
    // de complexité côté login verrouille les comptes dont le mot de passe est
    // valide mais antérieur à la politique — notamment les mots de passe
    // temporaires générés par AuthService.genererMotDePasseTemporaire(), dont
    // ~24 % ne contiennent aucun chiffre. La politique s'applique à
    // l'inscription et au changement de mot de passe, pas à la connexion.

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.post('/api/auth/login', {
        email: identifiant.includes('@') ? identifiant.toLowerCase() : identifiant,
        motDePasse: password,
      });

      // Compte avec 2FA activée : pas de token encore — l'appelant doit
      // soumettre le code TOTP via completeMfaLogin().
      if (response.data?.mfaRequired) {
        return { success: false, mfaRequired: true, mfaChallengeToken: response.data.mfaChallengeToken };
      }

      return finalizeLogin(response.data);
    } catch (err) {
      // Le backend renvoie le message d'erreur dans le champ `erreur`
      // (endpoints AuthController) ou `message` (GlobalExceptionHandler).
      // On lit les deux avant de retomber sur le message générique d'Axios
      // (« Request failed with status code 401 »), qui ne dit rien à l'utilisateur.
      const errorMsg = err.response?.data?.erreur || err.response?.data?.message || err.message || 'Connexion échouée';
      setError(errorMsg);
      setIsAuthenticated(false);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

   // Stocke le token/utilisateur une fois l'authentification complète (avec ou sans 2FA)
   const finalizeLogin = (data) => {
     const { id, nomComplet, email: userEmail, role,
             universiteId, departementId, compteActive, inscriptionId } = data;

     const userData = { id, nomComplet, email: userEmail, role,
                        universiteId, departementId, compteActive, inscriptionId };

     // Les tokens JWT sont stockés dans des cookies HttpOnly par le backend.
     // Le navigateur les envoie automatiquement avec chaque requête.
     // Le profil utilisateur est conservé en mémoire (state React).

     // Le cache de requêtes (api/requestCache) est un registre de MODULE : il
     // survit à un changement de session tant que l'onglet n'est pas rechargé.
     // On repart donc d'un registre vide, sinon la nouvelle session hériterait
     // des réponses lues avant elle — celles du visiteur anonyme, ou celles de
     // l'utilisateur précédent sur un poste partagé.
     viderCacheRequetes();

     setUser(userData);
     setIsAuthenticated(true);

     // Notifications push : best-effort, ne bloque jamais la connexion si Firebase
     // n'est pas configuré ou si le navigateur/l'utilisateur refuse la permission.
     activerNotificationsPush().catch(() => {});

     return { success: true, user: userData };
   };

  // ✅ Deuxième étape de connexion pour les comptes avec 2FA activée
  const completeMfaLogin = useCallback(async (mfaChallengeToken, code) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.post('/api/auth/2fa/login-verify', { mfaChallengeToken, code });
      return finalizeLogin(response.data);
    } catch (err) {
      const errorMsg = err.response?.data?.erreur || err.response?.data?.message || err.message || 'Code de vérification invalide';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Register
  const register = useCallback(async (userData) => {
    // Validation entrées
    if (!isValidEmail(userData.email)) {
      throw new Error('Email invalide');
    }
    const passwordValidation = validatePassword(userData.password || userData.motDePasse);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message);
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.post('/api/auth/inscrire', {
        nom: userData.nom,
        prenom: userData.prenom,
        email: userData.email.trim().toLowerCase(),
        motDePasse: userData.password || userData.motDePasse,
        telephone: userData.telephone,
        role: userData.role,
        universiteId: userData.universiteId,
        departementId: userData.departementId,
      });

       const { id, nomComplet, email: newEmail, role,
               universiteId, departementId, compteActive, inscriptionId } = response.data;

       const newUser = { id, nomComplet, email: newEmail, role,
                         universiteId, departementId, compteActive, inscriptionId };

       // Les tokens JWT sont stockés dans des cookies HttpOnly par le backend.
       // Le navigateur les envoie automatiquement avec chaque requête.

       setUser(newUser);
       setIsAuthenticated(true);

       return { success: true, user: newUser };
    } catch (err) {
      const errorMsg = err.response?.data?.erreur || err.response?.data?.message || err.message || 'Enregistrement échoué';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

   // ✅ Logout
   const logout = useCallback(async () => {
     try {
       await desactiverNotificationsPush();
       await api.post('/api/auth/logout');
     } catch (err) {
       console.warn('[Auth] Erreur logout API (ignorée):', err.message);
     } finally {
       // Les cookies HttpOnly sont effacés par le backend via Set-Cookie.
       // Le profil utilisateur est en mémoire (state React) uniquement.
       // Reste le cache de requêtes, qui n'est lié à aucun composant : sans
       // cette purge, les lectures de la session close restent servables à
       // l'occupant suivant de l'onglet. Dans le finally, donc valable aussi
       // quand l'appel /api/auth/logout échoue.
       viderCacheRequetes();
       setUser(null);
       setIsAuthenticated(false);
       setError(null);
     }
   }, []);

  // Maintenir les refs à jour pour éviter les closures périmées dans le listener
  useEffect(() => { logoutRef.current = logout; }, [logout]);
  useEffect(() => { etaitAuthentifieRef.current = isAuthenticated; }, [isAuthenticated]);

  // Écouter l'expiration de session déclenchée depuis l'intercepteur Axios
  useEffect(() => {
    const handleExpired = async () => {
      // ⚠️ N'agir QUE si une session existait réellement.
      //
      // L'intercepteur émet aussi cet événement pour un VISITEUR ANONYME : au
      // montage, AuthContext sonde GET /api/auth/moi → 401 → tentative de
      // refresh → échec (aucun cookie de refresh). Traiter cela comme une
      // expiration déclenchait un POST /api/auth/logout inutile puis une
      // redirection vers /login — ce qui éjectait le visiteur des pages
      // PUBLIQUES (/paiement-tachpay, /suivi-dossier, /paiement-inscription).
      if (!etaitAuthentifieRef.current) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }
      await logoutRef.current?.();
      navigate('/login');
    };
    window.addEventListener('genuc:session-expired', handleExpired);
    return () => window.removeEventListener('genuc:session-expired', handleExpired);
  }, [navigate]);

   // ✅ Refresh token
   // Avec les cookies HttpOnly, le navigateur envoie automatiquement
   // le refresh token via le cookie genuc_refresh_token.
   // Le backend valide le cookie et définit de nouveaux cookies HttpOnly.
   const refreshToken = useCallback(async () => {
     try {
       await api.post('/api/auth/refresh');
       // Les nouveaux tokens sont dans les cookies HttpOnly définis par le backend.
       // On vérifie que la session est toujours valide.
       const response = await api.get('/api/auth/moi');
       if (response.data?.email) {
         setUser(response.data);
         setIsAuthenticated(true);
       }
      } catch (err) {
        await logout();
        throw err;
      }
    }, [logout]);

    // ✅ Vérifier rôle
  const hasRole = useCallback((roles) => {
    if (!Array.isArray(roles)) roles = [roles];
    return user && roles.includes(user.role);
  }, [user]);

   // ✅ Mettre à jour profil
   const updateUser = useCallback((updates) => {
     setUser(prev => ({ ...prev, ...updates }));
   }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    completeMfaLogin,
    register,
    logout,
    refreshToken,
    hasRole,
    updateUser,
    fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ✅ Hook personnalisé avec validation
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthProvider;
