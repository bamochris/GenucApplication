// src/layouts/SuperAdminLayout.jsx
import React, { useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LogoutModal from '../components/LogoutModal';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAuth } from '../context/AuthContext';
import './SuperAdminLayout.css';
import { FaBell, FaSignOutAlt, FaHome, FaChevronRight } from 'react-icons/fa';

const BREADCRUMB_MAP = {
  '/superadmin/dashboard': 'Tableau de bord',
  '/superadmin/universites': 'Universités',
  '/superadmin/universites/creer': 'Créer une université',
  '/superadmin/utilisateurs': 'Utilisateurs',
  '/superadmin/inscriptions': 'Inscriptions',
  '/superadmin/logs': 'Journaux système',
  '/superadmin/parametres': 'Paramètres globaux',
  '/superadmin/statistiques': 'Statistiques',
  '/superadmin/rapports': 'Rapports',
};

const SuperAdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notificationCount] = useState(0);
  const [logoutModal, setLogoutModal] = useState(false);

  const handleLogout = () => setLogoutModal(true);
  const confirmerLogout = async () => { setLogoutModal(false); await logout(); navigate('/login'); };

  const initiales = ((user?.nomComplet || user?.prenom || user?.email || 'SA'))
    .split(' ')
    .map(s => s[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const currentPage = BREADCRUMB_MAP[location.pathname] || 'Administration';

  return (
    <div className="superadmin-layout">
      <Navbar />

      <div className="superadmin-main">
        <header className="superadmin-topbar">
          <div className="topbar-left">
            <nav className="breadcrumb" aria-label="Fil d'Ariane">
              <Link to="/superadmin/dashboard" className="breadcrumb-link">
                <FaHome />
              </Link>
              <FaChevronRight className="breadcrumb-sep" />
              <span className="breadcrumb-current">{currentPage}</span>
            </nav>
          </div>

          <div className="topbar-right">
            <Link to="/superadmin/notifications" className="sa-icon-btn" title="Notifications">
              <FaBell />
              {notificationCount > 0 && <span className="sa-badge">{notificationCount}</span>}
            </Link>

            <div className="sa-profile">
              <div className="sa-avatar">
                <span>{initiales}</span>
              </div>
              <div className="sa-profile-info">
                <div className="sa-profile-name">{user?.nomComplet || 'Super Admin'}</div>
                <div className="sa-profile-role">Super Administrateur</div>
              </div>
              <button className="sa-logout" onClick={handleLogout} title="Déconnexion">
                <FaSignOutAlt />
                <span className="logout-label">Déconnexion</span>
              </button>
            </div>
          </div>
        </header>

        <main className="superadmin-content">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {logoutModal && (
        <LogoutModal onConfirm={confirmerLogout} onCancel={() => setLogoutModal(false)} />
      )}
    </div>
  );
};

export default SuperAdminLayout;
