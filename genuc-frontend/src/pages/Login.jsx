//src/pages/Login.jsx - VERSION SÉCURISÉE (CAPTCHA + LIMITATION TENTATIVES) + CARROUSEL FOND

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';
// Exemple : src/images/
// À adapter selon votre structure
const hecemeImg = '/assets/HECEME.png';
const dashImg = '/assets/dash.jpg';
const upnImg = '/assets/upn-rectorat.jpg';
const upnsImg = '/assets/upn.jpg';
const unikImg = '/assets/unikinv.jpg';
const hecarbrekImg = '/assets/hecarbre.jpg';
const heccourImg = '/assets/heccour.jpg';
const UNILUpaysageImg = '/assets/UNILUpaysage.jpg';


// ─── Images du carrousel ────────────────────────────────────────────
const CAROUSEL_IMAGES = [
  { id: 1, src: hecemeImg, alt: 'Campus HECEME' },
  { id: 2, src: dashImg, alt: 'Campus moderne' },
  { id: 3, src: upnImg, alt: 'Campus rectorat' },
  { id: 4, src: upnsImg, alt: 'Campus upn' },
  { id: 5, src: unikImg, alt: 'Campus unikinv' },
  { id: 6, src: hecarbrekImg, alt: 'Campus heccour' },
  { id: 7, src: heccourImg, alt: 'Campus heccour' },
  {id: 8, src: UNILUpaysageImg, alt: 'Campus UNILUpaysage'},
  
  
  
  
];

// ─── Comptes de test organisés par catégorie (mots de passe
//     volontairement omis côté frontend : ils sont définis côté backend
//     et ne doivent pas être exposés dans le bundle JS). ─────────────
const TEST_ACCOUNTS = {
  'Administration': [
    { label: 'Super Admin', email: 'admin@genuc.cd', role: 'SUPER_ADMIN' },
    { label: 'Admin UNIKIN', email: 'admin@unikin.cd', role: 'ADMIN_UNIVERSITE' },
    { label: 'Admin UNILU', email: 'admin@unilu.cd', role: 'ADMIN_UNIVERSITE' },
  ],
  'Direction': [
    { label: 'Recteur', email: 'recteur@unikin.cd', role: 'RECTEUR' },
    { label: 'Doyen', email: 'doyen@unikin.cd', role: 'DOYEN' },
    { label: 'Chef Département', email: 'chef@unikin.cd', role: 'CHEF_DEPARTEMENT' },
  ],
  'Académique': [
    { label: 'Professeur', email: 'professeur@unikin.cd', role: 'PROFESSEUR' },
    { label: 'Secrétaire Académique', email: 'secretaire@unikin.cd', role: 'SECRETAIRE_ACADEMIQUE' },
  ],
  'Soutien': [
    { label: 'Caissier', email: 'caissier@unikin.cd', role: 'CAISSIER' },
    { label: 'Comptable', email: 'comptable@unikin.cd', role: 'COMPTABLE' },
    { label: 'RH', email: 'rh@unikin.cd', role: 'RH' },
    { label: 'Bibliothécaire', email: 'bibliothecaire@unikin.cd', role: 'BIBLIOTHECAIRE' },
    { label: 'Appariteur', email: 'appariteur@unikin.cd', role: 'APPARITEUR' },
    { label: 'Service Social', email: 'social@unikin.cd', role: 'SERVICE_SOCIAL' },
  ],
  'Utilisateurs': [
    { label: 'Étudiant', email: 'etudiant@unikin.cd', role: 'ETUDIANT' },
  ],
};

const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // Sans « @ », l'identifiant est un matricule étudiant (ex: HEC-2024-001) —
  // alphanumérique/tirets, sans espace, résolu vers l'email côté backend
  // (AuthService.resoudreIdentifiant).
  MATRICULE_REGEX: /^[^\s@]{3,}$/,
  MIN_PASSWORD_LENGTH: 6,
  MAX_ATTEMPTS: 10,        // 🔐 Nombre de tentatives avant blocage
  BLOCK_DURATION_MINUTES: 5, // 🔐 Durée de blocage en minutes
};

const STORAGE_KEY = 'genuc_remember_email';
const ATTEMPTS_KEY = 'genuc_login_attempts';
const BLOCK_KEY = 'genuc_login_block_until';

// ─── Utilitaires ────────────────────────────────────────────────────
const getLocalStorage = (key, defaultValue = null) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

const removeLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

// ─── Génération CAPTCHA ────────────────────────────────────────────
const generateCaptcha = () => {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const operators = ['+', '-'];
  const op = operators[Math.floor(Math.random() * operators.length)];
  let result;
  if (op === '+') result = num1 + num2;
  else result = num1 - num2;
  // S'assurer que le résultat est positif
  if (result < 0) {
    return generateCaptcha();
  }
  return { num1, num2, op, result };
};

// ─── Composant Select personnalisé ───────────────────────────────────
const TestAccountSelect = ({ value, onChange }) => {
  return (
    <div className="form-group">
      <label htmlFor="account-select">
        Compte de test <span style={{ color: 'var(--color-text-light)' }}>(optionnel)</span>
      </label>
      <select
        id="account-select"
        value={value}
        onChange={onChange}
        className="role-select"
        aria-label="Sélectionner un compte de test"
      >
        <option value="">-- Choisir un rôle --</option>
        {Object.entries(TEST_ACCOUNTS).map(([category, accounts]) => (
          <optgroup key={category} label={category}>
            {accounts.map((account) => (
              <option key={account.email} value={account.email}>
                {account.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
};

// ─── Composant Principal ────────────────────────────────────────────
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);

  // ─── États pour la sécurité ─────────────────────────────────────
  const [loginAttempts, setLoginAttempts] = useState(() => {
    const saved = getLocalStorage(ATTEMPTS_KEY);
    return saved || 0;
  });
  const [isBlocked, setIsBlocked] = useState(() => {
    const blockUntil = getLocalStorage(BLOCK_KEY);
    if (blockUntil && new Date(blockUntil) > new Date()) {
      return true;
    }
    return false;
  });
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);

  // ─── États pour le CAPTCHA ──────────────────────────────────────
  const [captcha, setCaptcha] = useState(() => generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [, setCaptchaError] = useState('');

  const { login, completeMfaLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // ─── États pour la 2ème étape (2FA) ──────────────────────────────
  const [mfaChallengeToken, setMfaChallengeToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  // ─── Carrousel d'images du fond ──────────────────────────────────
  useEffect(() => {
    const carouselInterval = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 15000); // Changer d'image toutes les 15 secondes

    return () => clearInterval(carouselInterval);
  }, []);

  // ─── Effet pour le compte à rebours de déblocage ────────────────
  useEffect(() => {
    if (!isBlocked) return;

    const updateBlockTime = () => {
      const blockUntil = getLocalStorage(BLOCK_KEY);
      if (blockUntil) {
        const remaining = Math.max(0, Math.floor((new Date(blockUntil) - new Date()) / 1000));
        setBlockTimeRemaining(remaining);
        if (remaining === 0) {
          setIsBlocked(false);
          removeLocalStorage(BLOCK_KEY);
          setLoginAttempts(0);
          removeLocalStorage(ATTEMPTS_KEY);
        }
      }
    };

    updateBlockTime();
    const interval = setInterval(updateBlockTime, 15000);
    return () => clearInterval(interval);
  }, [isBlocked]);

  // ─── Sauvegarde du login attempt dans localStorage ──────────────
  const updateAttempts = (newAttempts) => {
    setLoginAttempts(newAttempts);
    setLocalStorage(ATTEMPTS_KEY, newAttempts);
  };

  const blockAccount = () => {
    const blockUntil = new Date(Date.now() + VALIDATION.BLOCK_DURATION_MINUTES * 60 * 1000);
    setLocalStorage(BLOCK_KEY, blockUntil.toISOString());
    setIsBlocked(true);
    setLoginAttempts(0);
    removeLocalStorage(ATTEMPTS_KEY);
    setGeneralError(
      `🔒 Trop de tentatives échouées. Veuillez réessayer dans ${VALIDATION.BLOCK_DURATION_MINUTES} minutes.`
    );
  };

  // ─── Effet pour restaurer le remember email ─────────────────────
  useEffect(() => {
    const savedEmail = getLocalStorage(STORAGE_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // ─── Réinitialiser le CAPTCHA ────────────────────────────────────
  const resetCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
    setCaptchaError('');
  };

  const validateForm = useCallback(() => {
    const newErrors = {};

    // Validation email OU matricule (voir VALIDATION.MATRICULE_REGEX)
    const identifiant = email.trim();
    if (!identifiant) {
      newErrors.email = 'L\'email ou le matricule est requis';
    } else if (identifiant.includes('@')) {
      if (!VALIDATION.EMAIL_REGEX.test(identifiant)) {
        newErrors.email = 'Email invalide';
      }
    } else if (!VALIDATION.MATRICULE_REGEX.test(identifiant)) {
      newErrors.email = 'Matricule invalide';
    }

    // Validation mot de passe
    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
      newErrors.password = `Minimum ${VALIDATION.MIN_PASSWORD_LENGTH} caractères`;
    }

    // Validation CAPTCHA
    if (!captchaInput) {
      newErrors.captcha = 'Veuillez résoudre le CAPTCHA';
    } else if (parseInt(captchaInput) !== captcha.result) {
      newErrors.captcha = 'Réponse au CAPTCHA incorrecte';
    }

    return newErrors;
  }, [email, password, captcha, captchaInput]);

  // ─── Gestion du changement d'email ──────────────────────────────
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  // ─── Gestion du changement de mot de passe ──────────────────────
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  // ─── Gestion de la sélection de compte de test ──────────────────
  const handleAccountChange = (e) => {
    const selectedEmail = e.target.value;
    setSelectedAccount(selectedEmail);
    if (selectedEmail) {
      setEmail(selectedEmail);
      setPassword('');
      setErrors({});
      setGeneralError('');
    }
  };

  // ─── Gestion de la soumission du formulaire ─────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérification du blocage
    if (isBlocked) {
      setGeneralError(`🔒 Compte bloqué. Réessayez dans ${formatBlockTime(blockTimeRemaining)}.`);
      return;
    }

    const formErrors = validateForm();

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    setGeneralError('');

    try {
      const result = await login(email, password);
      resetCaptcha();
      if (result?.mfaRequired) {
        setMfaChallengeToken(result.mfaChallengeToken);
        setMfaError('');
        setMfaCode('');
        return;
      }
      navigate('/accueil', { replace: true });
    } catch (error) {
      const newAttempts = loginAttempts + 1;
      updateAttempts(newAttempts);

      if (newAttempts >= VALIDATION.MAX_ATTEMPTS) {
        blockAccount();
      } else {
        setGeneralError(error.message || 'Erreur de connexion');
        resetCaptcha();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Soumission du code 2FA (2ème étape) ────────────────────────
  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    if (!mfaCode.trim()) {
      setMfaError('Entrez le code à 6 chiffres de votre application d\'authentification.');
      return;
    }
    setMfaLoading(true);
    setMfaError('');
    try {
      await completeMfaLogin(mfaChallengeToken, mfaCode.trim());
      navigate('/accueil', { replace: true });
    } catch (error) {
      setMfaError(error.message || 'Code de vérification invalide');
    } finally {
      setMfaLoading(false);
    }
  };

  // ─── Formatage du temps de déblocage ────────────────────────────
  const formatBlockTime = (seconds) => {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m`;
  };

  // ─── Écran 2FA (2ème étape) ──────────────────────────────────────
  if (mfaChallengeToken) {
    return (
      <div className="login-page">
        <div className="login-right" style={{ width: '100%' }}>
          <div className="login-card">
            <div className="login-card-header">
              <img
                src="/assets/logo-genuc.png"
                alt="GENUC"
                className="login-logo"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <h2 className="form-title">🔐 Vérification en deux étapes</h2>
              <p className="form-sub">Entrez le code à 6 chiffres généré par votre application d'authentification</p>
            </div>

            {mfaError && (
              <div className="alert-erreur" role="alert">{mfaError}</div>
            )}

            <form onSubmit={handleMfaSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="mfa-code">Code de vérification</label>
                <input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  autoComplete="one-time-code"
                  autoFocus
                  disabled={mfaLoading}
                  style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '1.4rem' }}
                />
              </div>

              <button
                type="submit"
                className={`btn-login ${mfaLoading ? 'loading' : ''}`}
                disabled={mfaLoading}
                aria-busy={mfaLoading}
              >
                {mfaLoading ? 'Vérification...' : '✅ Vérifier'}
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => { setMfaChallengeToken(''); setMfaCode(''); setMfaError(''); }}
              >
                ← Retour à la connexion
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Utilisateur deja connecte (ex : bouton « retour » du navigateur apres
  // connexion) : ne jamais reafficher le formulaire — rebond vers son portail.
  if (isAuthenticated) {
    return <Navigate to="/accueil" replace />;
  }

  return (
    <div className="login-page">
      {/* ─── Carrousel de fond d'images ─────────────────────────────── */}
      <div className="carousel-background">
        {CAROUSEL_IMAGES.map((img, index) => (
          <div
            key={img.id}
            className="carousel-slide"
            style={{
              backgroundImage: `url(${img.src})`,
              opacity: index === carouselIndex ? 1 : 0
            }}
          />
        ))}
      </div>

      {/* ─── Colonne gauche (agrandie, mieux exploitée) ───────────── */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-brand">
            <div className="brand-icon">
              <img
                src="/assets/logo-genuc.png"
                alt="GENUC"
              />
            </div>

            <div className="brand-content">
              <h1 className="brand-title">GENUC</h1>
              <p className="brand-sub">
                GESTION NUMÉRIQUE UNIVERSITAIRE COMPLÈTE
              </p>
            </div>
          </div>

          <h2 className="login-heading">Portail Sécurisé</h2>

          <p className="login-desc">
            Bienvenue dans le système de gestion numérique des universités congolaises. 
            Connectez-vous pour accéder à vos services académiques et administratifs.
          </p>

          {/* Statistiques */}
          <div className="login-stats">
            <div className="login-stat">
              <div className="stat-num">5</div>
              <div className="stat-lbl">Universités</div>
            </div>
            <div className="login-stat">
              <div className="stat-num">10K+</div>
              <div className="stat-lbl">Utilisateurs</div>
            </div>
            <div className="login-stat">
              <div className="stat-num">99.9%</div>
              <div className="stat-lbl">Disponibilité</div>
            </div>
          </div>

          {/* Logos universités */}
          <div className="login-uni-logos">
            <span>UNIKIN</span>
            <span>UNILU</span>
            <span>HEC-KIN</span>
            <span>UNIKIN</span>
            <span>UPN</span>
          </div>

          {/* Section confiance */}
          <div className="login-trust-section">
            <div className="trust-title">Sécurité Premium</div>
            <div className="trust-items">
              <div className="trust-item">
                <div className="trust-icon">🛡️</div>
                <div className="trust-text"><strong>Protection anti-bruteforce</strong> - Limitation des tentatives</div>
              </div>
              <div className="trust-item">
                <div className="trust-icon">🤖</div>
                <div className="trust-text"><strong>Vérification anti-robot</strong> - CAPTCHA intégré</div>
              </div>
              <div className="trust-item">
                <div className="trust-icon">🔑</div>
                <div className="trust-text"><strong>Authentification sécurisée</strong> - Chiffrement de bout en bout</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Colonne droite ────────────────────────────────── */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <img 
              src="/assets/logo-genuc.png" 
              alt="GENUC" 
              className="login-logo"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <h2 className="form-title">Connexion</h2>
            <p className="form-sub">Entrez vos identifiants GENUC</p>
          </div>

          {generalError && (
            <div className="alert-erreur" role="alert">
              {generalError}
            </div>
          )}

          {process.env.REACT_APP_ENV === 'development' && (
            <TestAccountSelect
              value={selectedAccount}
              onChange={handleAccountChange}
            />
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email">✉️ Email ou matricule</label>
              <input
                id="email"
                type="text"
                placeholder="exemple@genuc.cd ou HEC-2024-001"
                value={email}
                onChange={handleEmailChange}
                autoComplete="username"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                disabled={isLoading || isBlocked}
              />
              {errors.email && (
                <div id="email-error" style={{ color: 'var(--color-error-text)', fontSize: '12px', marginTop: '4px' }}>
                  ❌ {errors.email}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">🔒 Mot de passe</label>
              <div className="input-password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  disabled={isLoading || isBlocked}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  disabled={isLoading || isBlocked}
                  title={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <div id="password-error" style={{ color: 'var(--color-error-text)', fontSize: '12px', marginTop: '4px' }}>
                  ❌ {errors.password}
                </div>
              )}
            </div>

            {/* 🔐 CAPTCHA */}
            <div className="form-group captcha-group">
              <label htmlFor="captcha">🤖 Vérification anti-robot</label>
              <div className="captcha-container">
                <div className="captcha-question">
                  <span className="captcha-number">{captcha.num1}</span>
                  <span className="captcha-operator">{captcha.op}</span>
                  <span className="captcha-number">{captcha.num2}</span>
                  <span className="captcha-equals">=</span>
                  <span className="captcha-question-mark">?</span>
                </div>
                <button
                  type="button"
                  className="captcha-refresh"
                  onClick={resetCaptcha}
                  title="Générer un nouveau CAPTCHA"
                  disabled={isLoading || isBlocked}
                >
                  🔄
                </button>
              </div>
              <input
                id="captcha"
                type="number"
                placeholder="Entrez le résultat"
                value={captchaInput}
                onChange={(e) => {
                  setCaptchaInput(e.target.value);
                  if (errors.captcha) {
                    setErrors(prev => ({ ...prev, captcha: '' }));
                  }
                }}
                disabled={isLoading || isBlocked}
                aria-invalid={!!errors.captcha}
                style={{ marginTop: '6px' }}
              />
              {errors.captcha && (
                <div id="captcha-error" style={{ color: 'var(--color-error-text)', fontSize: '12px', marginTop: '4px' }}>
                  ❌ {errors.captcha}
                </div>
              )}
            </div>

            {/* 🔐 Indicateur de sécurité */}
            {loginAttempts > 0 && !isBlocked && (
              <div className="security-indicator">
                <span className={`security-badge ${loginAttempts >= 3 ? 'warning' : 'info'}`}>
                  ⚠️ {VALIDATION.MAX_ATTEMPTS - loginAttempts} tentative(s) restante(s)
                </span>
              </div>
            )}

            {isBlocked && (
              <div className="security-indicator blocked">
                <span className="security-badge danger">
                  🔒 Bloqué pour {formatBlockTime(blockTimeRemaining)}
                </span>
              </div>
            )}

            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  disabled={isLoading || isBlocked}
                />
                Se souvenir de moi
              </label>
              <Link to="/mot-de-passe-oublie" className="forgot-password">
                Mot de passe oublié ?
              </Link>
            </div>

            <button 
              type="submit" 
              className={`btn-login ${isLoading ? 'loading' : ''}`}
              disabled={isLoading || isBlocked}
              aria-busy={isLoading}
            >
              {isLoading ? 'Connexion en cours...' : '🚀 Se connecter'}
            </button>
          </form>

          {process.env.REACT_APP_ENV === 'development' && (
            <div className="login-hint">
              <p>💡 Mode développement — les comptes de test sont préconfigurés côté serveur. Utilisez le sélecteur ci-dessus pour pré-remplir l'email, puis saisissez le mot de passe.</p>
            </div>
          )}

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link to="/" className="btn-outline">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}