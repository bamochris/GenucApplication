// src/pages/doyen/DoyenDashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDesign } from '../../context/DesignContext';
import api from '../../api/axios';
import QuickActionsGrid from '../../components/QuickActionsGrid';
import '../Dashboard.css';
import AvatarUtilisateur from '../../components/AvatarUtilisateur';
import DoyenDashboardPremium from './DoyenDashboardPremium';

export default function DoyenDashboard() {
  const { user } = useAuth();
  const { design } = useDesign();
  const [stats, setStats] = useState(null);
  const [notesEnAttente, setNotesEnAttente] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const universiteId = user?.universiteId;

  useEffect(() => {
    if (universiteId) {
      loadData();
    } else {
      setLoading(false);
      setError('Aucune université associée à votre compte.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [universiteId]);

  const loadData = async () => {
    try {
      // Récupérer les départements de l'université
      const deptsRes = await api.get(`/api/universites/public/${universiteId}/departements`);
      setDepartements(deptsRes.data || []);

      // Récupérer les notes en attente de validation (pour le doyen)
      // Endpoint à adapter selon votre backend – ici on utilise un endpoint générique
      const notesRes = await api.get(`/api/notes/universite/${universiteId}/a-valider`).catch(() => ({ data: [] }));
      setNotesEnAttente(notesRes.data || []);

      // Récupérer des statistiques (ex: via /api/universites/${universiteId}/stats)
      const statsRes = await api.get(`/api/universites/${universiteId}/stats`);
      setStats(statsRes.data);

    } catch (err) {
      console.error('Erreur chargement données doyen :', err);
      setError('Impossible de charger les données du tableau de bord.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Chargement du tableau de bord Doyen...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert-erreur">{error}</div>
      </div>
    );
  }

  // ── Variante « premium » (opt-in, réversible) ──────────────────────────
  if (design === 'premium') {
    return <DoyenDashboardPremium user={user} stats={stats} notesEnAttente={notesEnAttente} departements={departements} />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">👨‍🏫 Tableau de bord – Doyen</h1>
          <p className="page-sub">
            Bienvenue, <AvatarUtilisateur taille={22} style={{ marginRight: 7 }} />{user?.nomComplet || user?.email} – Gérez votre faculté
          </p>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          📅 {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Statistiques clés */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E6F1FB' }}>🏛️</div>
          <div>
            <div className="stat-value">{stats?.nbDepartements || 0}</div>
            <div className="stat-label">Départements</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E1F5EE' }}>👨‍🎓</div>
          <div>
            <div className="stat-value">{stats?.nbEtudiants || 0}</div>
            <div className="stat-label">Étudiants</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FAEEDA' }}>📝</div>
          <div>
            <div className="stat-value" style={{ color: notesEnAttente.length > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}>
              {notesEnAttente.length}
            </div>
            <div className="stat-label">Notes à valider</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FBEAF0' }}>⚖️</div>
          <div>
            <div className="stat-value">{stats?.nbDélibérationsEnCours || 0}</div>
            <div className="stat-label">Délibérations en cours</div>
          </div>
        </div>
      </div>

      {/* Grille principale */}
      <div className="dash-grid">
        {/* Notes en attente de validation */}
        <div className="card">
          <div className="card-head">
            <h2 className="card-title">📝 Notes en attente de validation</h2>
          </div>
          {notesEnAttente.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
              Aucune note en attente de validation.
            </p>
          ) : (
            <div className="activity-list">
              {notesEnAttente.slice(0, 5).map(note => (
                <div key={note.id} className="activity-item">
                  <div className="activity-dot" style={{ background: '#185FA5' }}></div>
                  <div style={{ flex: 1 }}>
                    <div className="activity-text">
                      <strong>{note.inscription?.etudiant?.nomComplet || note.inscriptionId}</strong> – {note.cours?.titre}
                    </div>
                    <div className="activity-meta">
                      Note : {note.noteFinale} – {note.appreciation || 'Sans appréciation'}
                    </div>
                  </div>
                  <Link to={`/doyen/notes/${note.id}/valider`} className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }}>
                    Valider
                  </Link>
                </div>
              ))}
              {notesEnAttente.length > 5 && (
                <Link to="/doyen/notes" style={{ marginTop: 12, display: 'block', textAlign: 'center', fontSize: 12 }}>
                  Voir toutes les notes ({notesEnAttente.length}) →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Départements */}
        <div className="card">
          <div className="card-head">
            <h2 className="card-title">📚 Départements de la faculté</h2>
          </div>
          {departements.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
              Aucun département.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Code</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {departements.map(dept => (
                  <tr key={dept.id}>
                    <td>{dept.nom}</td>
                    <td className="uni-code">{dept.code}</td>
                    <td><span className="badge badge-neutral">{dept.type}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Actions rapides (boîtes de dialogue) */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-head">
          <h2 className="card-title">⚡ Actions rapides</h2>
        </div>
        <QuickActionsGrid
          actions={[
            {
              icon: '📝', label: 'Valider des notes', to: '/doyen/notes/valider',
              color: '#1D9E75', bg: '#E1F5EE',
              description: 'Choisissez la session dont les notes sont à valider.',
              applyLabel: 'Ouvrir la validation',
              fields: [
                { name: 'session', label: 'Session', type: 'select', options: ['Session ordinaire', 'Session de rattrapage', 'Toutes'] },
              ],
            },
            {
              icon: '⚖️', label: 'Gérer les délibérations', to: '/doyen/deliberations',
              color: '#185FA5', bg: '#E6F1FB',
              description: 'Filtrez les délibérations par état avant d\'ouvrir la gestion.',
              applyLabel: 'Ouvrir les délibérations',
              fields: [
                { name: 'etat', label: 'État', type: 'select', options: ['En préparation', 'En cours', 'Clôturées', 'Toutes'] },
              ],
            },
            {
              icon: '🏛️', label: 'Gérer les départements', to: '/doyen/departements',
              color: '#854F0B', bg: '#FAEEDA',
              description: 'Consultez et administrez les départements de la faculté.',
              applyLabel: 'Ouvrir les départements',
            },
            {
              icon: '📊', label: 'Voir les statistiques', to: '/doyen/statistiques',
              color: '#1D9E75', bg: '#E1F5EE',
              description: 'Choisissez la période des statistiques de la faculté.',
              applyLabel: 'Afficher',
              fields: [
                { name: 'periode', label: 'Période', type: 'select', options: ['Année en cours', 'Semestre en cours', 'Année précédente'] },
              ],
            },
          ]}
        />
      </div>
    </div>
  );
}