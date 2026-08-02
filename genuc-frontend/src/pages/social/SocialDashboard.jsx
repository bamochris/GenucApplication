// src/pages/social/SocialDashboard.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDesign } from '../../context/DesignContext';
import api from '../../api/axios';
import DossierDetailModal from './DossierDetailModal';
import SocialDashboardPremium from './SocialDashboardPremium';
import '../Dashboard.css';

export default function SocialDashboard() {
  const { user } = useAuth();
  const { design } = useDesign();
  const [stats, setStats] = useState(null);
  const [dossiers, setDossiers] = useState([]);
  const [bourses, setBourses] = useState([]);
  const [aides, setAides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [widgetsLoading, setWidgetsLoading] = useState({
    stats: false,
    dossiers: false,
    bourses: false,
    aides: false
  });
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [rejetModal, setRejetModal] = useState({ open: false, id: null, motif: '' });

  const universiteId = user?.universiteId;

  useEffect(() => {
    if (universiteId) loadData();
    else { setLoading(false); setError('Aucune université associée.'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universiteId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, dossiersRes, boursesRes, aidesRes] = await Promise.all([
        api.get(`/api/social/stats/${universiteId}`).catch(() => ({ data: {} })),
        api.get(`/api/social/dossiers/statut/EN_ATTENTE?universiteId=${universiteId}`).catch(() => ({ data: [] })),
        api.get(`/api/social/bourses/universite/${universiteId}`).catch(() => ({ data: [] })),
        api.get(`/api/social/aides/universite/${universiteId}`).catch(() => ({ data: [] }))
      ]);
      setStats(statsRes.data || {});
      setDossiers(dossiersRes.data || []);
      setBourses(boursesRes.data || []);
      setAides(aidesRes.data || []);
    } catch (err) {
      setError('Erreur de chargement.');
    } finally { setLoading(false); }
  };

  const refreshWidget = async (widgetName) => {
    setWidgetsLoading(prev => ({ ...prev, [widgetName]: true }));
    try {
      switch (widgetName) {
        case 'stats':
          const statsRes = await api.get(`/api/social/stats/${universiteId}`);
          setStats(statsRes.data);
          break;
        case 'dossiers':
          const dossiersRes = await api.get(`/api/social/dossiers/statut/EN_ATTENTE?universiteId=${universiteId}`);
          setDossiers(dossiersRes.data);
          break;
        case 'bourses':
          const boursesRes = await api.get(`/api/social/bourses/universite/${universiteId}`);
          setBourses(boursesRes.data);
          break;
        case 'aides':
          const aidesRes = await api.get(`/api/social/aides/universite/${universiteId}`);
          setAides(aidesRes.data);
          break;
        default: break;
      }
    } catch (err) {
      console.error(`Erreur refresh ${widgetName} :`, err);
    } finally {
      setWidgetsLoading(prev => ({ ...prev, [widgetName]: false }));
    }
  };

  // ─── Dossiers sociaux (via DossierDetailModal) ─────────────────
  const handleDossierAction = async (id, action, commentaire = '') => {
    try {
      const statut = action === 'ETUDIER' ? 'EN_ETUDE' : action === 'VALIDER' ? 'VALIDE' : 'REJETE';
      await api.patch(`/api/social/dossiers/${id}/statut`, {
        statut,
        commentaire: commentaire || undefined,
        adminId: user.id,
      });
      setMessage(`✅ Dossier ${action === 'ETUDIER' ? 'passé en étude' : action === 'VALIDER' ? 'validé' : 'rejeté'} avec succès`);
      setSelectedDossier(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors du traitement du dossier');
    }
  };

  const handleRejeterDossier = (id) => setRejetModal({ open: true, id, motif: '' });

  const confirmerRejetDossier = () => {
    if (!rejetModal.motif.trim()) { setError('Veuillez saisir un motif.'); return; }
    const id = rejetModal.id;
    setRejetModal({ open: false, id: null, motif: '' });
    handleDossierAction(id, 'REJETER', rejetModal.motif);
  };

  // ─── Aides sociales (accorder / refuser) ───────────────────────
  const traiterAide = async (id, statut) => {
    try {
      await api.patch(`/api/social/aides/${id}/traiter`, {
        statut,
        traiteParId: user.id,
      });
      setMessage(statut === 'ACCORDEE' ? '✅ Aide accordée' : '❌ Aide refusée');
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors du traitement de l\'aide');
    }
  };

  // ─── Bourses (suspendre / terminer) ────────────────────────────
  const suspendreBourse = async (id) => {
    if (!window.confirm('Suspendre cette bourse ?')) return;
    try {
      await api.patch(`/api/social/bourses/${id}/suspendre`);
      setMessage('✅ Bourse suspendue');
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la suspension');
    }
  };

  const terminerBourse = async (id) => {
    if (!window.confirm('Marquer cette bourse comme terminée ?')) return;
    try {
      await api.patch(`/api/social/bourses/${id}/terminer`);
      setMessage('✅ Bourse terminée');
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la clôture');
    }
  };

  const getStatutBadge = (statut) => {
    const map = {
      'EN_ATTENTE': 'badge-warning',
      'EN_ETUDE': 'badge-warning',
      'VALIDE': 'badge-success',
      'REJETE': 'badge-danger',
      'ACTIVE': 'badge-success',
      'SUSPENDUE': 'badge-warning',
      'TERMINEE': 'badge-neutral'
    };
    return map[statut] || 'badge-neutral';
  };

  if (loading) return <div className="page"><div className="loading">Chargement...</div></div>;
  if (!universiteId) {
    return <div className="page"><div className="alert-erreur">{error || 'Aucune université associée.'}</div></div>;
  }

  // Modales partagées par les deux designs (détail dossier social + motif de rejet).
  const modals = (
    <>
      {selectedDossier && (
        <DossierDetailModal
          dossier={selectedDossier}
          onClose={() => setSelectedDossier(null)}
          onValider={(id) => handleDossierAction(id, 'VALIDER')}
          onRejeter={(id) => handleRejeterDossier(id)}
          onEtudier={(id) => handleDossierAction(id, 'ETUDIER')}
          onRefresh={loadData}
        />
      )}
      {rejetModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 400, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>❌ Motif du rejet</h3>
            <textarea
              rows={4}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Expliquez la raison du rejet du dossier social..."
              value={rejetModal.motif}
              onChange={e => setRejetModal(m => ({ ...m, motif: e.target.value }))}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setRejetModal({ open: false, id: null, motif: '' })}>Annuler</button>
              <button className="btn-danger" onClick={confirmerRejetDossier}>Confirmer le rejet</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // ── Variante « premium » (opt-in, réversible) ──────────────────────────
  if (design === 'premium') {
    return (
      <>
        <SocialDashboardPremium
          stats={stats}
          dossiers={dossiers}
          bourses={bourses}
          aides={aides}
          message={message}
          error={error}
          onRefresh={loadData}
          onSelectDossier={setSelectedDossier}
          onTraiterAide={traiterAide}
          onSuspendreBourse={suspendreBourse}
          onTerminerBourse={terminerBourse}
        />
        {modals}
      </>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏥 Service Social</h1>
          <p className="page-sub">Gestion des dossiers sociaux, bourses et aides</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" onClick={loadData}>🔄 Rafraîchir</button>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalDossiers || 0}</div>
          <div className="stat-label">Total dossiers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--color-danger-text)' }}>{stats.enAttente || 0}</div>
          <div className="stat-label">En attente</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--color-success-text)' }}>{stats.boursesActives || 0}</div>
          <div className="stat-label">Bourses actives</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.montantTotalBourses?.toLocaleString() || 0} USD</div>
          <div className="stat-label">Montant total bourses</div>
        </div>
      </div>

      {/* Widgets 2 colonnes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        {/* Dossiers en attente */}
        <div className="card">
          <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">📋 Dossiers en attente ({dossiers.length})</h2>
            <button className="btn-outline" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => refreshWidget('dossiers')} disabled={widgetsLoading.dossiers}>
              {widgetsLoading.dossiers ? '⏳' : '🔄'}
            </button>
          </div>
          {dossiers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucun dossier en attente.</p>
          ) : (
            <div className="activity-list">
              {dossiers.slice(0, 5).map(d => (
                <div key={d.id} className="activity-item">
                  <div className="activity-dot" style={{ background: '#ff9800' }}></div>
                  <div style={{ flex: 1 }}>
                    <div className="activity-text">
                      <strong>{d.etudiant?.prenom} {d.etudiant?.nom}</strong> - {d.numeroDossier}
                    </div>
                    <div className="activity-meta">
                      {d.demandeBourse ? '💰 Demande bourse' : 'Aide sociale'} • {new Date(d.creeLe).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <button className="btn-outline" style={{ fontSize: 11 }} onClick={() => setSelectedDossier(d)}>
                    Traiter
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bourses actives */}
        <div className="card">
          <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">💰 Bourses actives ({bourses.length})</h2>
            <button className="btn-outline" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => refreshWidget('bourses')} disabled={widgetsLoading.bourses}>
              {widgetsLoading.bourses ? '⏳' : '🔄'}
            </button>
          </div>
          {bourses.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune bourse active.</p>
          ) : (
            <div className="activity-list">
              {bourses.slice(0, 5).map(b => (
                <div key={b.id} className="activity-item">
                  <div className="activity-dot" style={{ background: '#1D9E75' }}></div>
                  <div style={{ flex: 1 }}>
                    <div className="activity-text">
                      <strong>{b.dossierSocial?.etudiant?.prenom} {b.dossierSocial?.etudiant?.nom}</strong>
                    </div>
                    <div className="activity-meta">
                      {b.type} • {b.montantParMois} USD/mois • Fin {b.dateFin ? new Date(b.dateFin).toLocaleDateString('fr-FR') : '-'}
                      <span className={`badge ${getStatutBadge(b.statut)}`} style={{ marginLeft: 6 }}>{b.statut}</span>
                    </div>
                  </div>
                  {b.statut === 'ACTIVE' && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-outline" style={{ fontSize: 11 }} onClick={() => suspendreBourse(b.id)}>
                        ⏸ Suspendre
                      </button>
                      <button className="btn-success" style={{ fontSize: 11 }} onClick={() => terminerBourse(b.id)}>
                        ✅ Terminer
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Aides sociales récentes */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">🤝 Aides sociales récentes ({aides.length})</h2>
          <button className="btn-outline" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => refreshWidget('aides')} disabled={widgetsLoading.aides}>
            {widgetsLoading.aides ? '⏳' : '🔄'}
          </button>
        </div>
        {aides.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune aide sociale enregistrée.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Type</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {aides.slice(0, 5).map(a => (
                <tr key={a.id}>
                  <td>{a.etudiant?.prenom} {a.etudiant?.nom}</td>
                  <td>{a.type}</td>
                  <td>{a.montantEstime} USD</td>
                  <td><span className={`badge ${getStatutBadge(a.statut)}`}>{a.statut}</span></td>
                  <td>{new Date(a.dateDemande).toLocaleDateString('fr-FR')}</td>
                  <td>
                    {(a.statut === 'EN_ATTENTE' || a.statut === 'EN_TRAITEMENT') ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-success" style={{ fontSize: 11 }} onClick={() => traiterAide(a.id, 'ACCORDEE')}>
                          ✅ Accorder
                        </button>
                        <button className="btn-danger" style={{ fontSize: 11 }} onClick={() => traiterAide(a.id, 'REFUSEE')}>
                          ❌ Refuser
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Traité</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modals}
    </div>
  );
}
