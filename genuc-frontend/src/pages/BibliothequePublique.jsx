// src/pages/BibliothequePublique.jsx
import { Link } from 'react-router-dom';
import { FaBook, FaSearch, FaGraduationCap, FaSignInAlt } from 'react-icons/fa';
import './Dashboard.css';

const FONCTIONNALITES_PREVUES = [
  { label: 'Catalogue en ligne (livres, mémoires, revues)', icon: <FaBook color="#FCD34D" /> },
  { label: 'Recherche multi-critères (titre, auteur, ISBN)', icon: <FaSearch color="#9CA3AF" /> },
  { label: 'Réservation et emprunt en ligne', icon: <FaGraduationCap color="#60A5FA" /> },
];

export default function BibliothequePublique() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📚 Bibliothèque numérique</h1>
        <p className="page-sub">Accédez aux ressources documentaires, mémoires et publications</p>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <FaBook size={40} color="#6b7280" style={{ marginBottom: 16 }} />
        <h3 style={{ margin: '0 0 8px' }}>Le catalogue public arrive bientôt</h3>
        <p style={{ margin: '0 0 20px', color: 'var(--text-muted)', fontSize: 14 }}>
          La bibliothèque numérique complète est déjà accessible aux étudiants connectés. La version publique est en préparation.
        </p>
        <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <FaSignInAlt /> Se connecter pour y accéder
        </Link>
      </div>

      <h2 className="card-title" style={{ margin: '24px 0 12px' }}>Ce que proposera la version publique</h2>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {FONCTIONNALITES_PREVUES.map((f) => (
          <div key={f.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>{f.icon}</span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{f.label}</span>
          </div>
        ))}
      </div>

      <Link to="/" className="btn-outline" style={{ textDecoration: 'none', display: 'inline-block', marginTop: 16 }}>
        ← Retour à l'accueil
      </Link>
    </div>
  );
}
