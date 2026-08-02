// src/pages/rh/RHDashboard.jsx
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useDesign } from '../../context/DesignContext';
import api from '../../api/axios';
import QuickActionsGrid from '../../components/QuickActionsGrid';
import '../../pages/Dashboard.css';
import AvatarUtilisateur from '../../components/AvatarUtilisateur';
import RHDashboardPremium from './RHDashboardPremium';

export default function RHDashboard() {
  const { user } = useAuth();
  const { design } = useDesign();
  const [stats, setStats] = useState(null);
  const [employes, setEmployes] = useState([]);
  const [contratsExpirant, setContratsExpirant] = useState([]);
  const [congesEnAttente, setCongesEnAttente] = useState([]);
  const [paieEnAttente, setPaieEnAttente] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [widgetsLoading, setWidgetsLoading] = useState({
    stats: false,
    employes: false,
    contrats: false,
    conges: false,
    paie: false,
  });

  const universiteId = user?.universiteId;

  // ─── Chargement global ──────────────────────────────────────────
  const loadAllData = useCallback(async () => {
    if (!universiteId) {
      setError('Aucune université associée.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [statsRes, employesRes, contratsRes, congesRes, paieRes] = await Promise.all([
        api.get(`/api/rh/stats/${universiteId}`).catch(() => ({ data: {} })),
        api.get(`/api/rh/personnel/universite/${universiteId}`).catch(() => ({ data: [] })),
        // NOTE: il n'existe pas d'endpoint backend dédié pour les contrats arrivant à
        // échéance par université (seulement /api/rh/contrats/personnel/{id}). Ce widget
        // reste donc toujours vide tant que ce endpoint n'est pas ajouté côté backend.
        api.get(`/api/rh/contrats/expirant/${universiteId}`).catch(() => ({ data: [] })),
        api.get(`/api/conges/en-attente?universiteId=${universiteId}`).catch(() => ({ data: [] })),
        api.get(`/api/rh/paie/en-attente-validation?universiteId=${universiteId}`).catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data || {});
      setEmployes(employesRes.data || []);
      setContratsExpirant(contratsRes.data || []);
      setCongesEnAttente(congesRes.data || []);
      setPaieEnAttente(paieRes.data || []);
    } catch (err) {
      setError('Erreur chargement des données RH');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [universiteId]);

  // ─── Rechargement individuel ────────────────────────────────────
  const refreshWidget = useCallback(async (widgetName) => {
    setWidgetsLoading(prev => ({ ...prev, [widgetName]: true }));
    try {
      switch (widgetName) {
        case 'stats':
          const statsRes = await api.get(`/api/rh/stats/${universiteId}`);
          setStats(statsRes.data);
          break;
        case 'employes':
          const empRes = await api.get(`/api/rh/personnel/universite/${universiteId}`);
          setEmployes(empRes.data);
          break;
        case 'contrats':
          const ctrRes = await api.get(`/api/rh/contrats/expirant/${universiteId}`);
          setContratsExpirant(ctrRes.data);
          break;
        case 'conges':
          const cgRes = await api.get(`/api/conges/en-attente?universiteId=${universiteId}`);
          setCongesEnAttente(cgRes.data);
          break;
        case 'paie':
          const paieRes = await api.get(`/api/rh/paie/en-attente-validation?universiteId=${universiteId}`);
          setPaieEnAttente(paieRes.data);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error(`Erreur refresh ${widgetName} :`, err);
      toast.error("Impossible de rafraîchir ces données.");
    } finally {
      setWidgetsLoading(prev => ({ ...prev, [widgetName]: false }));
    }
  }, [universiteId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  if (loading) return <div className="page"><div className="loading">Chargement du tableau de bord RH...</div></div>;

  // ── Variante « premium » (opt-in, réversible) ──────────────────────────
  if (design === 'premium') {
    return (
      <RHDashboardPremium
        user={user}
        stats={stats}
        employes={employes}
        contratsExpirant={contratsExpirant}
        congesEnAttente={congesEnAttente}
        paieEnAttente={paieEnAttente}
        error={error}
        onRefresh={loadAllData}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">👨‍💼 Portail RH</h1>
          <p className="page-sub">
            <AvatarUtilisateur taille={22} style={{ marginRight: 7 }} />{user?.nomComplet || 'Ressources Humaines'} • Gestion du personnel
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/rh/employes" className="btn-primary">
            ➕ Nouvel employé
          </Link>
          <Link to="/rh/paie" className="btn-outline">
            💰 Gestion de la paie
          </Link>
        </div>
      </div>

      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {/* Statistiques générales */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E6F1FB' }}>👥</div>
          <div>
            <div className="stat-value">{stats?.totalPersonnel || 0}</div>
            <div className="stat-label">Total employés</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E1F5EE' }}>👨‍🏫</div>
          <div>
            <div className="stat-value">{stats?.totalEnseignants || 0}</div>
            <div className="stat-label">Enseignants</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FAEEDA' }}>📋</div>
          <div>
            <div className="stat-value">{stats?.totalAdministratifs || 0}</div>
            <div className="stat-label">Administratifs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FBEAF0' }}>✅</div>
          <div>
            <div className="stat-value">{stats?.totalActifs || 0}</div>
            <div className="stat-label">Employés actifs</div>
          </div>
        </div>
      </div>

      {/* Widgets RH (2 colonnes) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        {/* 📋 Derniers employés */}
        <div className="card">
          <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">📋 Derniers employés</h2>
            <button className="btn-outline" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => refreshWidget('employes')} disabled={widgetsLoading.employes}>
              {widgetsLoading.employes ? '⏳' : '🔄'}
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Matricule</th>
                <th>Nom</th>
                <th>Fonction</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {employes.slice(0, 5).map(e => (
                <tr key={e.id}>
                  <td className="uni-code">{e.matriculePersonnel}</td>
                  <td>{e.prenom} {e.nom}</td>
                  <td>{e.specialite || e.grade || '-'}</td>
                  <td>
                    <span className={`badge ${e.statut === 'ACTIF' ? 'badge-success' : 'badge-neutral'}`}>
                      {e.statut}
                    </span>
                  </td>
                </tr>
              ))}
              {employes.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucun employé</td></tr>
              )}
            </tbody>
          </table>
          <Link to="/rh/employes" style={{ marginTop: 12, display: 'block', textAlign: 'center', fontSize: 12 }}>
            Voir tous les employés →
          </Link>
        </div>

        {/* ⚠️ Contrats expirant */}
        <div className="card">
          <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">⚠️ Contrats expirant</h2>
            <button className="btn-outline" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => refreshWidget('contrats')} disabled={widgetsLoading.contrats}>
              {widgetsLoading.contrats ? '⏳' : '🔄'}
            </button>
          </div>
          {contratsExpirant.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucun contrat expirant dans les 30 jours.</p>
          ) : (
            <div className="activity-list">
              {contratsExpirant.slice(0, 4).map(c => (
                <div key={c.id} className="activity-item">
                  <div className="activity-dot" style={{ background: '#cc0000' }}></div>
                  <div style={{ flex: 1 }}>
                    <div className="activity-text">
                      {c.personnel?.prenom} {c.personnel?.nom} - {c.fonction}
                    </div>
                    <div className="activity-meta">
                      Fin: {new Date(c.dateFin).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <Link to="/rh/employes" className="btn-outline" style={{ fontSize: 11 }}>
                    Renouveler
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 📅 Congés en attente */}
        <div className="card">
          <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">📅 Congés en attente ({congesEnAttente.length})</h2>
            <button className="btn-outline" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => refreshWidget('conges')} disabled={widgetsLoading.conges}>
              {widgetsLoading.conges ? '⏳' : '🔄'}
            </button>
          </div>
          {congesEnAttente.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune demande de congé en attente.</p>
          ) : (
            <div className="activity-list">
              {congesEnAttente.slice(0, 4).map(c => (
                <div key={c.id} className="activity-item">
                  <div className="activity-dot" style={{ background: '#ff9800' }}></div>
                  <div style={{ flex: 1 }}>
                    <div className="activity-text">
                      {c.personnel?.prenom} {c.personnel?.nom} - {c.libelle}
                    </div>
                    <div className="activity-meta">
                      {c.dateDebut} → {c.dateFin} ({c.nbJoursOuvrables} jours)
                    </div>
                  </div>
                  <Link to="/rh/conges" className="btn-outline" style={{ fontSize: 11 }}>
                    Traiter
                  </Link>
                </div>
              ))}
            </div>
          )}
          <Link to="/rh/conges" style={{ marginTop: 12, display: 'block', textAlign: 'center', fontSize: 12 }}>
            Gérer tous les congés →
          </Link>
        </div>

        {/* 💰 Paie en attente */}
        <div className="card">
          <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">💰 Paie en attente ({paieEnAttente.length})</h2>
            <button className="btn-outline" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => refreshWidget('paie')} disabled={widgetsLoading.paie}>
              {widgetsLoading.paie ? '⏳' : '🔄'}
            </button>
          </div>
          {paieEnAttente.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucun bulletin en attente de validation.</p>
          ) : (
            <div className="activity-list">
              {paieEnAttente.slice(0, 4).map(p => (
                <div key={p.id} className="activity-item">
                  <div className="activity-dot" style={{ background: '#185FA5' }}></div>
                  <div style={{ flex: 1 }}>
                    <div className="activity-text">
                      {p.paie?.personnel?.prenom} {p.paie?.personnel?.nom} - {p.paie?.mois} {p.paie?.annee}
                    </div>
                    <div className="activity-meta">
                      Net: {p.paie?.netAPayer} USD
                    </div>
                  </div>
                  <Link to="/rh/paie" className="btn-outline" style={{ fontSize: 11 }}>
                    Valider
                  </Link>
                </div>
              ))}
            </div>
          )}
          <Link to="/rh/paie" style={{ marginTop: 12, display: 'block', textAlign: 'center', fontSize: 12 }}>
            Gérer la paie →
          </Link>
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
              icon: '➕', label: 'Nouvel employé', to: '/rh/employes',
              color: '#1D9E75', bg: '#E1F5EE',
              description: 'Préparez la fiche du nouvel employé : elle sera pré-remplie.',
              applyLabel: 'Créer la fiche',
              fields: [
                { name: 'nom', label: 'Nom complet', type: 'text', placeholder: 'Nom et prénom' },
                { name: 'poste', label: 'Poste', type: 'select', options: ['Enseignant', 'Administratif', 'Technique', 'Autre'] },
              ],
            },
            {
              icon: '📅', label: 'Gérer les congés', to: '/rh/conges',
              color: '#185FA5', bg: '#E6F1FB',
              description: 'Filtrez les demandes de congés à traiter.',
              applyLabel: 'Ouvrir les congés',
              fields: [
                { name: 'etat', label: 'État', type: 'select', options: ['En attente', 'Approuvés', 'Refusés', 'Tous'] },
              ],
            },
            {
              icon: '💰', label: 'Gestion de la paie', to: '/rh/paie',
              color: '#854F0B', bg: '#FAEEDA',
              description: 'Choisissez le mois de paie à traiter.',
              applyLabel: 'Ouvrir la paie',
              fields: [
                { name: 'mois', label: 'Mois', type: 'select', options: ['Mois en cours', 'Mois précédent', 'Autre période'] },
              ],
            },
            {
              icon: '📄', label: 'Contrats', to: '/rh/employes',
              color: '#6B21A8', bg: '#F3E8FF',
              description: 'Recherchez les contrats d\'un employé.',
              applyLabel: 'Ouvrir les contrats',
              fields: [
                { name: 'employe', label: 'Employé (optionnel)', type: 'text', placeholder: 'Nom de l\'employé' },
              ],
            },
            {
              icon: '🎓', label: 'Emploi étudiant', to: '/admin/rh/gestion-emploi-etudiant',
              color: '#1D9E75', bg: '#E1F5EE',
              description: 'Gérez les offres d\'emploi et candidatures étudiantes.',
              applyLabel: 'Ouvrir la gestion',
            },
          ]}
        />
      </div>
    </div>
  );
}