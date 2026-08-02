// src/layouts/EtudiantLayout.jsx
import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import CompleterDossier from '../pages/etudiant/CompleterDossier';
import Navbar from '../components/Navbar';
import DesignSwitcher from '../components/DesignSwitcher';
import LogoutModal from '../components/LogoutModal';
import './EtudiantLayout.css';
import { FaBell, FaEnvelope, FaRobot, FaSignOutAlt, FaChevronRight, FaHome } from 'react-icons/fa';
import LanguageSelector from '../components/LanguageSelector';
import usePhotosIdentite, { urlPhoto } from '../hooks/usePhotosIdentite';

const BREADCRUMB_MAP = {
  '/etudiant/dashboard': 'Tableau de bord',
  '/etudiant/mes-cours': 'Mes cours',
  '/etudiant/resultats': 'Mes résultats',
  '/etudiant/bulletins': 'Mes bulletins',
  '/etudiant/frais': 'Paiements',
  '/etudiant/horaire': 'Mon horaire',
  '/etudiant/presences': 'Mes présences',
  '/etudiant/messagerie': 'Messagerie',
  '/etudiant/notifications': 'Notifications',
  '/etudiant/profil': 'Mon profil',
  '/etudiant/parcours': 'Mon parcours',
  '/etudiant/recours': 'Recours académiques',
  '/etudiant/equivalences-diplomes': 'Équivalences diplômes',
  '/etudiant/bibliotheque': 'Bibliothèque',
  '/etudiant/carte': 'Carte étudiant',
  '/etudiant/demander-attestation': 'Demander une attestation',
  '/etudiant/mes-jobs-universitaires': 'Mes jobs universitaires',
  '/etudiant/evaluations/enseignants': 'Évaluation des enseignants',
  '/etudiant/emploi': 'Emploi',
};

export default function EtudiantLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notificationCount] = useState(3);
  const [messageCount] = useState(2);
  const [logoutModal, setLogoutModal] = useState(false);
  const photos = usePhotosIdentite(!!user);
  const photoProfil = urlPhoto(photos.photoProfil || user?.photoProfil);

  const handleLogout = () => setLogoutModal(true);
  const confirmerLogout = async () => { setLogoutModal(false); await logout(); navigate('/login'); };

  // ── Portail restreint ────────────────────────────────────────────
  // Si le dossier de l'étudiant attend des documents (DOCUMENTS_MANQUANTS),
  // on n'affiche QUE la boîte de dialogue d'ajout, jusqu'à validation.
  const [gate, setGate] = useState('loading');
  const [dossierData, setDossierData] = useState(null);
  const verifierDossier = useCallback(() => {
    api.get('/api/etudiant/mon-dossier')
      .then(r => {
        if (r.data?.statut === 'DOCUMENTS_MANQUANTS') { setDossierData(r.data); setGate('restricted'); }
        else setGate('normal');
      })
      .catch(() => setGate('normal'));
  }, []);
  useEffect(() => { verifierDossier(); }, [verifierDossier]);

  if (gate === 'loading') {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#185FA5' }}>Chargement…</div>;
  }
  if (gate === 'restricted') {
    return <CompleterDossier dossier={dossierData} onLogout={confirmerLogout} onDone={verifierDossier} />;
  }

  const initiales = ((user?.nomComplet || user?.prenom || user?.email || 'ET'))
    .split(' ')
    .map(s => s[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const currentPage = BREADCRUMB_MAP[location.pathname] || 'Page';

  return (
    <div className="etudiant-layout">
      <Navbar />
      <DesignSwitcher />

      <div className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <nav className="breadcrumb" aria-label="Fil d'Ariane">
              <Link to="/etudiant/dashboard" className="breadcrumb-link">
                <FaHome className="breadcrumb-home" />
              </Link>
              <FaChevronRight className="breadcrumb-sep" />
              <span className="breadcrumb-current">{currentPage}</span>
            </nav>
          </div>

          <div className="top-bar-right">
            <LanguageSelector compact />
            <Link to="/etudiant/notifications" className="icon-button" title="Notifications">
              <FaBell />
              {notificationCount > 0 && <span className="badge">{notificationCount}</span>}
            </Link>
            <Link to="/etudiant/messagerie" className="icon-button" title="Messages">
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
              <Link to="/mon-compte" className="profile-avatar" title="Mon compte (photos d'identité)">
                {photoProfil ? (
                  <img
                    key={photoProfil}
                    src={photoProfil}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <span className="avatar-placeholder">{initiales}</span>
                )}
              </Link>
              <div className="profile-info">
                <div className="profile-name">{user?.nomComplet || user?.prenom || 'Étudiant'}</div>
                <div className="profile-role">Étudiant</div>
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