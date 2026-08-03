import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './SidebarSuperAdmin.css';
import {
  FaHome, FaUniversity,
  FaMoneyBillWave, FaVideo, FaClipboardList, FaCog, FaUserShield
} from 'react-icons/fa';

const SidebarSuperAdmin = () => {
  const location = useLocation();

  // ⚠️ Chaque `path` doit correspondre à une <Route> déclarée dans App.js.
  // Le préfixe /superadmin/* utilisé ici auparavant (universites, dossiers,
  // inscriptions, paiements, cours, notes, parametres, profil) n'a JAMAIS
  // existé : seuls /super-admin/dashboard, /super-admin/admins-universites et
  // /superadmin/enregistrement-universite sont routés. Ces liens tombaient
  // donc dans le catch-all `path="*"` → redirection muette vers /accueil.
  // Les entrées Dossiers et Inscriptions sont retirées : le SUPER_ADMIN ne
  // traite pas les dossiers (réservés à ADMIN_UNIVERSITE/SECRETAIRE_ACADEMIQUE).
  const menuItems = [
    { path: '/super-admin/dashboard', label: 'Dashboard national', icon: <FaHome /> },
    { path: '/super-admin/admins-universites', label: 'Admins Universités', icon: <FaUserShield /> },
    { path: '/universites', label: 'Universités', icon: <FaUniversity /> },
    { path: '/superadmin/enregistrement-universite', label: 'Enregistrer une université', icon: <FaUniversity /> },
    { path: '/paiements', label: 'Paiements', icon: <FaMoneyBillWave /> },
    { path: '/cours', label: 'Cours en ligne', icon: <FaVideo /> },
    { path: '/notes', label: 'Notes', icon: <FaClipboardList /> },
    { path: '/admin-systeme', label: 'Administration système', icon: <FaCog /> },
  ];

  return (
    <div className="sidebar">
      {/* UN SEUL BLOC D'EN-TÊTE */}
      <div className="sidebar-header">
        <h1>GENUC</h1>
        <p>Super Admin</p>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default SidebarSuperAdmin;