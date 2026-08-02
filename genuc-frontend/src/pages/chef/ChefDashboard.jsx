// src/pages/chef/ChefDashboard.jsx
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useDesign } from '../../context/DesignContext';
import api from '../../api/axios';
import QuickActionsGrid from '../../components/QuickActionsGrid';
import '../Dashboard.css';
import AvatarUtilisateur from '../../components/AvatarUtilisateur';
import ChefDashboardPremium from './ChefDashboardPremium';

export default function ChefDashboard() {
  const { user } = useAuth();
  const { design } = useDesign();
  const [notesAValider, setNotesAValider] = useState([]);
  const [deliberations, setDeliberations] = useState([]);
  const [loading, setLoading] = useState(true);

  const departementId = user?.departementId;
  const universiteId = user?.universiteId;

  const showFeedback = (type, text) => {
    if (type === 'success') toast.success(text);
    else toast.error(text);
  };

  useEffect(() => {
    if (departementId && universiteId) {
      chargerDonnees();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [departementId, universiteId]);

  const chargerDonnees = async () => {
    try {
      const [notesRes, delibRes] = await Promise.all([
        api.get(`/api/notes/departement/${departementId}/a-valider`).catch(() => ({ data: [] })),
        api.get(`/api/deliberations/departement/${departementId}/en-cours`).catch(() => ({ data: [] }))
      ]);
      setNotesAValider(notesRes.data || []);
      setDeliberations(delibRes.data || []);
    } catch (err) {
      showFeedback('error', 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const validerNote = async (noteId) => {
    try {
      await api.patch(`/api/notes/${noteId}/valider`);
      showFeedback('success', 'Note validée avec succès');
      chargerDonnees();
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Erreur lors de la validation');
    }
  };

  const preparerDeliberation = async (inscriptionId, annee) => {
    try {
      await api.post(`/api/deliberations/preparer/${inscriptionId}/${annee}`);
      showFeedback('success', 'Délibération préparée avec succès');
      chargerDonnees();
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Erreur lors de la préparation');
    }
  };

  if (loading) return <div className="page"><div className="loading">Chargement...</div></div>;

  // ── Variante « premium » (opt-in, réversible) ──────────────────────────
  if (design === 'premium') {
    return (
      <ChefDashboardPremium
        user={user}
        notesAValider={notesAValider}
        deliberations={deliberations}
        departementId={departementId}
        onRefresh={chargerDonnees}
        onValiderNote={validerNote}
        onPreparerDeliberation={preparerDeliberation}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">👨‍🏫 Tableau de bord – Chef de département</h1>
          <p className="page-sub">
            <AvatarUtilisateur taille={22} style={{ marginRight: 7 }} />{user?.nomComplet} – {departementId ? `Département #${departementId}` : 'Non rattaché à un département'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-outline" onClick={chargerDonnees}>🔄 Rafraîchir</button>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E6F1FB' }}>📝</div>
          <div>
            <div className="stat-value" style={{ color: notesAValider.length > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}>
              {notesAValider.length}
            </div>
            <div className="stat-label">Notes à valider</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E1F5EE' }}>🎓</div>
          <div>
            <div className="stat-value">{deliberations.length}</div>
            <div className="stat-label">Délibérations en cours</div>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        {/* Notes à valider */}
        <div className="card">
          <h2 className="card-title">📝 Notes en attente de validation</h2>
          {notesAValider.length === 0 ? (
            <p>Aucune note en attente.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Étudiant</th><th>Cours</th><th>Note</th><th>Action</th></tr>
              </thead>
              <tbody>
                {notesAValider.map(n => (
                  <tr key={n.id}>
                    <td>{n.inscription?.etudiant?.nomComplet || n.inscriptionId}</td>
                    <td>{n.cours?.titre}</td>
                    <td>{n.noteFinale}</td>
                    <td>
                      <button className="btn-success" onClick={() => validerNote(n.id)}>Valider</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Délibérations à préparer */}
        <div className="card">
          <h2 className="card-title">🎓 Délibérations à préparer</h2>
          {deliberations.length === 0 ? (
            <p>Aucune délibération en cours.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Étudiant</th><th>Année</th><th>Action</th></tr>
              </thead>
              <tbody>
                {deliberations.map(d => (
                  <tr key={d.id}>
                    <td>{d.inscription?.etudiant?.nomComplet || d.inscriptionId}</td>
                    <td>{d.anneeAcademique}</td>
                    <td>
                      <button className="btn-primary" onClick={() => preparerDeliberation(d.inscriptionId, d.anneeAcademique)}>
                        Préparer
                      </button>
                    </td>
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
              icon: '📝', label: 'Gérer les notes', to: '/chef/notes',
              color: '#1D9E75', bg: '#E1F5EE',
              description: 'Choisissez la session dont les notes sont à gérer.',
              applyLabel: 'Ouvrir les notes',
              fields: [
                { name: 'session', label: 'Session', type: 'select', options: ['Session ordinaire', 'Session de rattrapage', 'Toutes'] },
              ],
            },
            {
              icon: '🎓', label: 'Délibérations', to: '/chef/deliberations',
              color: '#185FA5', bg: '#E6F1FB',
              description: 'Filtrez les délibérations du département par état.',
              applyLabel: 'Ouvrir les délibérations',
              fields: [
                { name: 'etat', label: 'État', type: 'select', options: ['En préparation', 'En cours', 'Clôturées', 'Toutes'] },
              ],
            },
            {
              icon: '📚', label: 'Cours du département', to: '/chef/cours',
              color: '#854F0B', bg: '#FAEEDA',
              description: 'Choisissez le semestre des cours à consulter.',
              applyLabel: 'Ouvrir les cours',
              fields: [
                { name: 'semestre', label: 'Semestre', type: 'select', options: ['Tous', 'Semestre 1', 'Semestre 2'] },
              ],
            },
            {
              icon: '👨‍🏫', label: 'Enseignants', to: '/chef/enseignants',
              color: '#6B21A8', bg: '#F3E8FF',
              description: 'Consultez et gérez les enseignants du département.',
              applyLabel: 'Ouvrir les enseignants',
            },
            {
              icon: '📊', label: 'Statistiques', to: '/chef/statistiques',
              color: '#1D9E75', bg: '#E1F5EE',
              description: 'Choisissez la période des statistiques du département.',
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