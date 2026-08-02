// src/pages/Forbidden.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Forbidden.css';

export default function Forbidden() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const homeLink = {
    ETUDIANT: '/etudiant/dashboard',
    SUPER_ADMIN: '/super-admin/dashboard',
    ADMIN_UNIVERSITE: '/admin/dashboard',
    PROFESSEUR: '/professeur/dashboard',
    CAISSIER: '/caissier/dashboard',
    CHEF_DEPARTEMENT: '/chef/dashboard',
    RECTEUR: '/recteur/dashboard',
    DOYEN: '/doyen/dashboard',
    SECRETAIRE_ACADEMIQUE: '/secretaire/dashboard',
    APPARITEUR: '/appariteur/dashboard',
    RH: '/rh/dashboard',
    COMPTABLE: '/comptable/dashboard',
    SERVICE_SOCIAL: '/social/dashboard',
    BIBLIOTHECAIRE: '/bibliothecaire/dashboard',
  }[user?.role] || '/';

  return (
    <div className="forbidden-page">
      <div className="forbidden-card">
        <div className="forbidden-code">403</div>
        <h1 className="forbidden-title">Accès refusé</h1>
        <p className="forbidden-msg">
          Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
        </p>
        {user && (
          <p className="forbidden-role">
            Rôle actuel : <strong>{user.role}</strong>
          </p>
        )}
        <div className="forbidden-actions">
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Retour
          </button>
          <Link to={homeLink} className="btn-home">
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
