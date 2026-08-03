// src/components/PortalTopbar.jsx
// Entête de portail permanente, sur le MÊME modèle que la top-bar du portail
// étudiant (mêmes classes CSS : top-bar, breadcrumb, user-profile…) :
// fil d'Ariane à gauche, profil du compte connecté (photo ou initiales,
// nom, rôle) et bouton Déconnexion à droite. Rendue par AppLayout : elle
// reste identique et en place quelle que soit l'option ouverte.
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaChevronRight, FaRobot, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import usePhotosIdentite, { urlPhoto } from '../hooks/usePhotosIdentite';
import LogoutModal from './LogoutModal';
import '../layouts/EtudiantLayout.css';

const ROLES_FR = {
  SUPER_ADMIN: 'Super Administrateur',
  ADMIN_UNIVERSITE: 'Administrateur d\'université',
  ETUDIANT: 'Étudiant',
  PROFESSEUR: 'Professeur',
  RECTEUR: 'Recteur',
  DOYEN: 'Doyen',
  CHEF_DEPARTEMENT: 'Chef de département',
  CHEF_PROMOTION: 'Chef de promotion',
  SECRETAIRE_ACADEMIQUE: 'Secrétaire académique',
  APPARITEUR: 'Appariteur',
  CAISSIER: 'Caissier',
  COMPTABLE: 'Comptable',
  RH: 'Ressources humaines',
  SERVICE_SOCIAL: 'Service social',
  BIBLIOTHECAIRE: 'Bibliothécaire',
  ADMINISTRATEUR_SYSTEME: 'Administrateur système',
};

// Libellés de pages communs ; tout chemin inconnu est dérivé de son dernier
// segment (tirets → espaces, première lettre en capitale).
const LIBELLES_COMMUNS = {
  dashboard: 'Tableau de bord',
  utilisateurs: 'Utilisateurs',
  migration: 'Migration',
  parametres: 'Paramètres',
  paiements: 'Paiements',
  notifications: 'Notifications',
  'mon-compte': 'Mon compte',
};

function libellePage(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  const dernier = segments[segments.length - 1] || 'dashboard';
  if (LIBELLES_COMMUNS[dernier]) return LIBELLES_COMMUNS[dernier];
  const texte = decodeURIComponent(dernier).replace(/[-_]/g, ' ');
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

function initiales(user) {
  const nom = user?.nomComplet || `${user?.prenom || ''} ${user?.nom || ''}`.trim() || user?.email || '?';
  return nom.split(/\s+/).slice(0, 2).map(m => m[0]).join('').toUpperCase();
}

export default function PortalTopbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [logoutModal, setLogoutModal] = useState(false);
  const [logoErreur, setLogoErreur] = useState(false);
  const photos = usePhotosIdentite(!!user);

  if (!user) return null;

  const photoProfil = urlPhoto(photos.photoProfil || user.photoProfil);
  const nomAffiche = user.nomComplet || `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email;
  const confirmerLogout = async () => { setLogoutModal(false); await logout(); navigate('/login'); };

  return (
    <>
      <header className="top-bar" style={{ position: 'sticky', top: 0 }}>
        <div className="top-bar-left">
          <nav className="breadcrumb" aria-label="Fil d'Ariane">
            <Link to="/accueil" className="breadcrumb-link" title="Tableau de bord">
              <FaHome className="breadcrumb-home" />
            </Link>
            <FaChevronRight className="breadcrumb-sep" />
            <span className="breadcrumb-current">{libellePage(location.pathname)}</span>
          </nav>
        </div>

        <div className="top-bar-right">
          <button
            type="button"
            className="topbar-search-trigger"
            onClick={() => window.dispatchEvent(new CustomEvent('genuc:ouvrir-palette'))}
            title="Rechercher (Ctrl+K)"
            aria-label="Ouvrir la recherche rapide (Ctrl+K)"
          >
            <span aria-hidden="true">🔍</span>
            <span className="topbar-search-label">Rechercher</span>
            <kbd className="topbar-search-kbd">Ctrl K</kbd>
          </button>

          <button
            type="button"
            className="topbar-search-trigger topbar-cleverly-trigger"
            onClick={() => window.dispatchEvent(new CustomEvent('genuc:ouvrir-cleverly'))}
            title="Ouvrir GENUC Cleverly"
            aria-label="Ouvrir GENUC Cleverly"
          >
            <FaRobot aria-hidden="true" />
            <span className="topbar-cleverly-label">Cleverly</span>
          </button>

          <div className="user-profile">
            <Link to="/mon-compte" className="profile-avatar" title="Mon compte">
              {photoProfil ? (
                <img
                  key={photoProfil}
                  src={photoProfil}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              ) : logoErreur ? (
                <span className="avatar-placeholder">{initiales(user)}</span>
              ) : (
                // Sans photo de profil, on affiche le logo GENUC plutôt que
                // l'initiale seule : sur un compte au nom d'un seul mot, celle-ci
                // se réduisait à une grosse lettre isolée collée au libellé.
                // Repli sur les initiales via l'état React (et non une mutation
                // du DOM dans onError, qui rouvrirait une boucle de rechargement).
                <img
                  src="/assets/logo-genuc.png"
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }}
                  onError={() => setLogoErreur(true)}
                />
              )}
            </Link>
            <div className="profile-info">
              <div className="profile-name">{nomAffiche}</div>
              <div className="profile-role">{ROLES_FR[user.role] || user.role}</div>
            </div>
            <button className="logout-button" onClick={() => setLogoutModal(true)} title="Déconnexion">
              <FaSignOutAlt />
              <span className="logout-label">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {logoutModal && (
        <LogoutModal onConfirm={confirmerLogout} onCancel={() => setLogoutModal(false)} />
      )}
    </>
  );
}
