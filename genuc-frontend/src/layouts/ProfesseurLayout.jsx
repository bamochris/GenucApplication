// src/layouts/ProfesseurLayout.jsx
import { useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import usePhotosIdentite, { urlPhoto } from '../hooks/usePhotosIdentite';
import Navbar from '../components/Navbar';
import DesignSwitcher from '../components/DesignSwitcher';
import LogoutModal from '../components/LogoutModal';
import './ProfesseurLayout.css';
import { FaBell, FaEnvelope, FaRobot, FaSignOutAlt, FaHome, FaChevronRight } from 'react-icons/fa';
import LanguageSelector from '../components/LanguageSelector';

const BREADCRUMB_MAP = {
  '/professeur/dashboard': 'Tableau de bord',
  '/professeur/notes/saisie': 'Saisie des notes',
  '/professeur/notes/import': 'Import des notes',
  '/professeur/notes/export': 'Export des notes',
  '/professeur/mes-cours': 'Mes cours',
  '/professeur/presences/saisie': 'Saisir les présences',
  '/professeur/presences/historique': 'Historique des présences',
  '/professeur/deliberation': 'Délibération',
  '/professeur/messagerie': 'Messagerie',
  '/professeur/parametres': 'Paramètres',
  '/professeur/mes-etudiants': 'Mes étudiants',
};

export default function ProfesseurLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notificationCount] = useState(3);
  const [messageCount] = useState(2);
  const [logoutModal, setLogoutModal] = useState(false);

  const handleLogout = () => setLogoutModal(true);
  const confirmerLogout = async () => { setLogoutModal(false); await logout(); navigate('/login'); };

  const photosIdentite = usePhotosIdentite(!!user);
  const photoProfilUrl = urlPhoto(photosIdentite.photoProfil || user?.photoProfil);
  const initiales = ((user?.nomComplet || user?.prenom || user?.email || 'PR'))
    .split(' ')
    .map(s => s[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const currentPage = BREADCRUMB_MAP[location.pathname] || 'Page';

  return (
    <div className="professeur-layout">
      <Navbar />
      <DesignSwitcher />

      <div className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <nav className="breadcrumb" aria-label="Fil d'Ariane">
              <Link to="/professeur/dashboard" className="breadcrumb-link">
                <FaHome />
              </Link>
              <FaChevronRight className="breadcrumb-sep" />
              <span className="breadcrumb-current">{currentPage}</span>
            </nav>
          </div>

          <div className="top-bar-right">
            <LanguageSelector compact />
            <Link to="/professeur/notifications" className="icon-button" title="Notifications">
              <FaBell />
              {notificationCount > 0 && <span className="badge">{notificationCount}</span>}
            </Link>
            <Link to="/professeur/messagerie" className="icon-button" title="Messages">
              <FaEnvelope />
              {messageCount > 0 && <span className="badge">{messageCount}</span>}
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
                <div className="profile-name">{user?.nomComplet || user?.prenom || 'Professeur'}</div>
                <div className="profile-role">Enseignant</div>
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