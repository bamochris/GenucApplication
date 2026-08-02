// src/pages/Actualites.jsx
import { Link } from 'react-router-dom';
import { FaTrophy, FaBriefcase, FaBook, FaBell } from 'react-icons/fa';
import './Dashboard.css';

const LIENS_EN_ATTENDANT = [
  { label: 'Palmarès des universités', path: '/palmares-public', icon: <FaTrophy color="#FBBF24" /> },
  { label: 'Offres d\'emploi étudiant', path: '/emploi-universitaire', icon: <FaBriefcase color="#60A5FA" /> },
  { label: 'Cours en ligne', path: '/cours-publics', icon: <FaBook color="#34D399" /> },
];

export default function Actualites() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📰 Actualités</h1>
        <p className="page-sub">Restez informé des événements et annonces du réseau universitaire</p>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <FaBell size={40} color="#6b7280" style={{ marginBottom: 16 }} />
        <h3 style={{ margin: '0 0 8px' }}>Le fil d'actualités arrive bientôt</h3>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
          Nous préparons un espace dédié aux annonces officielles, événements et communiqués du réseau GENUC.
        </p>
      </div>

      <h2 className="card-title" style={{ margin: '24px 0 12px' }}>En attendant, découvrez déjà</h2>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {LIENS_EN_ATTENDANT.map((lien) => (
          <Link
            key={lien.path}
            to={lien.path}
            className="card"
            style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <span style={{ fontSize: 22 }}>{lien.icon}</span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{lien.label}</span>
          </Link>
        ))}
      </div>

      <Link to="/" className="btn-outline" style={{ textDecoration: 'none', display: 'inline-block', marginTop: 16 }}>
        ← Retour à l'accueil
      </Link>
    </div>
  );
}
