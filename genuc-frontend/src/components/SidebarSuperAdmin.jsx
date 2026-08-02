import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './SidebarSuperAdmin.css';
import {
  FaHome, FaUniversity, FaFolderOpen, FaUserGraduate,
  FaMoneyBillWave, FaVideo, FaClipboardList, FaCog, FaUserCog, FaUserShield
} from 'react-icons/fa';

const SidebarSuperAdmin = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/super-admin/dashboard', label: 'Dashboard national', icon: <FaHome /> },
    { path: '/super-admin/admins-universites', label: 'Admins Universités', icon: <FaUserShield /> },
    { path: '/superadmin/universites', label: 'Universités', icon: <FaUniversity /> },
    { path: '/superadmin/dossiers', label: 'Dossiers', icon: <FaFolderOpen /> },
    { path: '/superadmin/inscriptions', label: 'Inscriptions', icon: <FaUserGraduate /> },
    { path: '/superadmin/paiements', label: 'Paiements', icon: <FaMoneyBillWave /> },
    { path: '/superadmin/cours', label: 'Cours en ligne', icon: <FaVideo /> },
    { path: '/superadmin/notes', label: 'Notes', icon: <FaClipboardList /> },
    { path: '/superadmin/parametres', label: 'Définitions', icon: <FaCog /> },
    { path: '/superadmin/profil', label: 'Super Admin', icon: <FaUserCog /> },
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