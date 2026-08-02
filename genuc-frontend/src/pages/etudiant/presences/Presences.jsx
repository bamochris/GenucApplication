// src/pages/etudiant/presences/Presences.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../EtudiantDashboard.css';

export default function Presences() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [presences, setPresences] = useState([]);
  const [stats, setStats] = useState(null);
  const [coursList, setCoursList] = useState([]);
  const [filterCours, setFilterCours] = useState('');
  const [filterMois, setFilterMois] = useState('');
  const [vue, setVue] = useState('global'); // 'global' | 'cours'
  const [justifierModal, setJustifierModal] = useState({ open: false, presenceId: null });

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    if (inscriptionId) {
      loadData();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId]);

  const loadData = async () => {
    try {
      const [presRes, coursRes] = await Promise.all([
        api.get(`/api/etudiant/portal/${inscriptionId}/presences`).catch(() => ({ data: [] })),
        api.get(`/api/etudiant/portal/${inscriptionId}/cours`).catch(() => ({ data: [] }))
      ]);
      setPresences(presRes.data || []);
      setCoursList(coursRes.data || []);
      calculerStats(presRes.data || []);
    } catch (err) {
      console.error('Erreur chargement présences:', err);
      setMessage('❌ Erreur lors du chargement des présences');
    } finally {
      setLoading(false);
    }
  };

  const calculerStats = (data) => {
    const total = data.length;
    const presents = data.filter(p => p.present).length;
    const absents = data.filter(p => !p.present && !p.justifie).length;
    const justifies = data.filter(p => p.justifie).length;
    const retards = data.filter(p => p.present && p.retard).length;
    const taux = total > 0 ? Math.round((presents / total) * 100) : 0;

    setStats({
      total,
      presents,
      absents,
      justifies,
      retards,
      taux
    });
  };

  const getCoursPresences = (coursId) => {
    return presences.filter(p => p.coursId === coursId);
  };

  const getStatutBadge = (presence) => {
    if (presence.present && presence.retard) return 'badge-warning';
    if (presence.present) return 'badge-success';
    if (presence.justifie) return 'badge-neutral';
    return 'badge-danger';
  };

  const getStatutLabel = (presence) => {
    if (presence.present && presence.retard) return '⏳ En retard';
    if (presence.present) return '✅ Présent';
    if (presence.justifie) return '📋 Justifié';
    return '❌ Absent';
  };

  const getMoisOptions = () => {
    const mois = [];
    const aujourdHui = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth() - i, 1);
      mois.push({
        value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
      });
    }
    return mois;
  };

  const presencesFiltrees = presences.filter(p => {
    const matchCours = filterCours ? p.coursId === parseInt(filterCours) : true;
    const matchMois = filterMois ? p.date.startsWith(filterMois) : true;
    return matchCours && matchMois;
  });

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de vos présences...</p>
      </div>
    );
  }

  return (
    <div className="etudiant-dashboard">
      <div className="section-header">
        <h2 className="section-title">✅ Présences</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            className={vue === 'global' ? 'btn-primary' : 'btn-outline'} 
            onClick={() => setVue('global')}
          >
            📊 Global
          </button>
          <button 
            className={vue === 'cours' ? 'btn-primary' : 'btn-outline'} 
            onClick={() => setVue('cours')}
          >
            📚 Par cours
          </button>
        </div>
      </div>

      {message && (
        <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>
          {message}
        </div>
      )}

      {/* Vue globale - Statistiques */}
      {vue === 'global' && stats && (
        <>
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card" style={{ borderLeftColor: '#1D9E75' }}>
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-value" style={{ color: 'var(--color-success-text)' }}>{stats.taux}%</div>
                <div className="stat-label">Taux de présence</div>
              </div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: '#1D9E75' }}>
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <div className="stat-value">{stats.presents}</div>
                <div className="stat-label">Présences</div>
              </div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: '#cc0000' }}>
              <div className="stat-icon">❌</div>
              <div className="stat-content">
                <div className="stat-value" style={{ color: 'var(--color-danger-text)' }}>{stats.absents}</div>
                <div className="stat-label">Absences non justifiées</div>
              </div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: '#ff9800' }}>
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <div className="stat-value" style={{ color: '#ff9800' }}>{stats.justifies}</div>
                <div className="stat-label">Absences justifiées</div>
              </div>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Progression des présences</span>
              <span style={{ fontWeight: 600, color: stats.taux >= 80 ? '#1D9E75' : stats.taux >= 50 ? '#ff9800' : '#cc0000' }}>
                {stats.taux}%
              </span>
            </div>
            <div style={{ background: 'var(--bg-secondary)', height: 12, borderRadius: 6, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${stats.taux}%`,
                  background: stats.taux >= 80 ? '#1D9E75' : stats.taux >= 50 ? '#ff9800' : '#cc0000',
                  height: '100%',
                  transition: 'width 0.6s ease'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>Total séances : {stats.total}</span>
              <span>{stats.retards} retards</span>
            </div>
          </div>
        </>
      )}

      {/* Vue par cours */}
      {vue === 'cours' && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">📊 Présences par cours</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {coursList.map(c => {
              const coursPresences = getCoursPresences(c.id);
              const total = coursPresences.length;
              const presents = coursPresences.filter(p => p.present).length;
              const taux = total > 0 ? Math.round((presents / total) * 100) : 0;
              return (
                <div key={c.id} className="stat-card" style={{ 
                  borderLeftColor: taux >= 80 ? '#1D9E75' : taux >= 50 ? '#ff9800' : '#cc0000',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setFilterCours(c.id.toString());
                  setVue('global');
                }}>
                  <div className="stat-content">
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.titre}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.code}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 18, color: taux >= 80 ? '#1D9E75' : taux >= 50 ? '#ff9800' : '#cc0000' }}>
                        {taux}%
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{presents}/{total} présents</span>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', height: 4, borderRadius: 2, marginTop: 4 }}>
                      <div style={{ width: `${taux}%`, background: taux >= 80 ? '#1D9E75' : taux >= 50 ? '#ff9800' : '#cc0000', height: '100%', borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtres et liste détaillée */}
      <div className="card">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 150 }}>
            <label style={{ fontSize: 11 }}>Cours</label>
            <select
              value={filterCours}
              onChange={e => setFilterCours(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd' }}
            >
              <option value="">Tous les cours</option>
              {coursList.map(c => (
                <option key={c.id} value={c.id}>{c.code}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 150 }}>
            <label style={{ fontSize: 11 }}>Mois</label>
            <select
              value={filterMois}
              onChange={e => setFilterMois(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd' }}
            >
              <option value="">Tous les mois</option>
              {getMoisOptions().map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <button className="btn-outline" style={{ marginTop: 16 }} onClick={() => { setFilterCours(''); setFilterMois(''); }}>
            Réinitialiser
          </button>
        </div>

        <h3 className="card-title" style={{ marginBottom: 12 }}>
          Détail des présences ({presencesFiltrees.length} séances)
        </h3>
        {presencesFiltrees.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
            Aucune présence enregistrée pour cette période.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Cours</th>
                <th>Statut</th>
                <th>Heure d'arrivée</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {presencesFiltrees.map(p => (
                <tr key={p.id}>
                  <td>{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                  <td>{p.coursTitre} ({p.coursCode})</td>
                  <td>
                    <span className={`badge ${getStatutBadge(p)}`}>
                      {getStatutLabel(p)}
                    </span>
                  </td>
                  <td>{p.heureArrivee || '-'}</td>
                  <td>
                    {!p.present && !p.justifie && (
                      <button
                        className="btn-outline"
                        style={{ fontSize: 11, padding: '2px 8px' }}
                        onClick={() => setJustifierModal({ open: true, presenceId: p.id })}
                      >
                        Justifier
                      </button>
                    )}
                    {p.justifie && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>✓ Justifiée</span>}
                    {p.present && p.retard && <span style={{ fontSize: 11, color: '#ff9800' }}>⚠️ Retard</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {justifierModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 360, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>Justifier l'absence</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>Souhaitez-vous justifier cette absence ?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setJustifierModal({ open: false, presenceId: null })}>Annuler</button>
              <button className="btn-primary" onClick={async () => {
                const id = justifierModal.presenceId;
                setJustifierModal({ open: false, presenceId: null });
                try {
                  await api.patch(`/api/presences/${id}/justifier`);
                  setMessage('✅ Absence justifiée');
                  loadData();
                } catch {
                  setMessage('❌ Erreur lors de la justification');
                }
              }}>Justifier</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
