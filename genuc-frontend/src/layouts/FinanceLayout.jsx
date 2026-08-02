// src/layouts/FinanceLayout.jsx
import { useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import usePhotosIdentite, { urlPhoto } from '../hooks/usePhotosIdentite';
import Navbar from '../components/Navbar';
import DesignSwitcher from '../components/DesignSwitcher';
import LogoutModal from '../components/LogoutModal';
import './FinanceLayout.css';
import { FaBell, FaRobot, FaSignOutAlt, FaHome, FaChevronRight } from 'react-icons/fa';

const BREADCRUMB_MAP = {
  '/finances/dashboard': 'Tableau de bord',
  '/finances/frais': 'Frais académiques',
  '/finances/frais/creer': 'Créer un frais',
  '/finances/echeanciers': 'Échéanciers',
  '/finances/paiements': 'Paiements',
  '/finances/rapports': 'Rapports',
  '/finances/tresorerie': 'Trésorerie',
  '/finances/etudiant/mes-frais': 'Mes frais',
  '/finances/etudiant/etat-financier': 'État financier',
  '/finances/caissier/encaissement': 'Encaissement',
  '/finances/caissier/journal': 'Journal de caisse',
  '/finances/caissier/cloture': 'Clôture de caisse',
  '/caissier/dashboard': 'Tableau de bord Caissier',
  '/comptable/dashboard': 'Tableau de bord Comptable',
};

export default function FinanceLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notificationCount] = useState(0);
  const [logoutModal, setLogoutModal] = useState(false);

  const handleLogout = () => setLogoutModal(true);
  const confirmerLogout = async () => { setLogoutModal(false); await logout(); navigate('/login'); };

  const photosIdentite = usePhotosIdentite(!!user);
  const photoProfilUrl = urlPhoto(photosIdentite.photoProfil || user?.photoProfil);
  const initiales = ((user?.nomComplet || user?.prenom || user?.email || 'FN'))
    .split(' ')
    .map(s => s[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const roleLabel = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN_UNIVERSITE: 'Administrateur',
    COMPTABLE: 'Comptable',
    CAISSIER: 'Caissier',
    ETUDIANT: 'Étudiant',
    RECTEUR: 'Recteur'
  }[user?.role] || user?.role;

  const currentPage = BREADCRUMB_MAP[location.pathname] || 'Module Finances';
  const homeLink = user?.role === 'CAISSIER' ? '/caissier/dashboard'
    : user?.role === 'COMPTABLE' ? '/comptable/dashboard'
    : '/finances/dashboard';

  return (
    <div className="finance-layout">
      <Navbar />
      <DesignSwitcher />

      <div className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <nav className="breadcrumb" aria-label="Fil d'Ariane">
              <Link to={homeLink} className="breadcrumb-link">
                <FaHome />
              </Link>
              <FaChevronRight className="breadcrumb-sep" />
              <span className="breadcrumb-current">{currentPage}</span>
            </nav>
          </div>

          <div className="top-bar-right">
            <Link to={`${homeLink.replace('/dashboard', '')}/notifications`} className="icon-button" title="Notifications">
              <FaBell />
              {notificationCount > 0 && <span className="badge">{notificationCount}</span>}
            </Link>

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
              <div className="profile-avatar">
                {photoProfilUrl ? (
                  <img key={photoProfilUrl} src={photoProfilUrl} alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <span className="avatar-placeholder">{initiales}</span>
                )}
              </div>
              <div className="profile-info">
                <div className="profile-name">{user?.nomComplet || user?.email}</div>
                <div className="profile-role">{roleLabel}</div>
              </div>
              <button className="logout-button" onClick={handleLogout} title="Déconnexion">
                <FaSignOutAlt />
                <span className="logout-label">Déconnexion</span>
              </button>
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {logoutModal && (
        <LogoutModal onConfirm={confirmerLogout} onCancel={() => setLogoutModal(false)} />
      )}
    </div>
  );
}