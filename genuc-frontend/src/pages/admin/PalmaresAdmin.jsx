// src/pages/admin/PalmaresAdmin.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function PalmaresAdmin() {
  const { user } = useAuth();
  const [enAttente, setEnAttente] = useState([]);
  const [valides, setValides] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState([]);
  const [onglet, setOnglet] = useState('attente');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMention, setFilterMention] = useState('');
  const [rejetModal, setRejetModal] = useState({ open: false, id: null, motif: '' });

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [attenteRes, validesRes, statsRes] = await Promise.all([
        api.get('/api/palmares/en-attente'),
        // /public = lauréats déjà validés (visibles publiquement)
        api.get('/api/palmares/public').catch(() => ({ data: [] })),
        user?.universiteId
          ? api.get(`/api/palmares/stats/${user.universiteId}`).catch(() => ({ data: {} }))
          : Promise.resolve({ data: {} })
      ]);
      setEnAttente(attenteRes.data || []);
      setValides(validesRes.data || []);
      setStats(statsRes.data || {});
    } catch (err) {
      setError('Erreur chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const valider = async (id) => {
    try {
      await api.patch(`/api/palmares/${id}/valider`, { adminId: user.id });
      setMessage('✅ Lauréat validé');
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur');
    }
  };

  const rejeter = (id) => setRejetModal({ open: true, id, motif: '' });

  const confirmerRejet = async () => {
    if (!rejetModal.motif.trim()) { setError('Veuillez saisir un motif.'); return; }
    const id = rejetModal.id;
    setRejetModal({ open: false, id: null, motif: '' });
    try {
      await api.patch(`/api/palmares/${id}/rejeter`, { motif: rejetModal.motif });
      setMessage('❌ Lauréat rejeté');
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur');
    }
  };

  const [validerLotModal, setValiderLotModal] = useState(false);

  const validerLot = () => {
    if (selected.length === 0) return;
    setValiderLotModal(true);
  };

  const confirmerValiderLot = async () => {
    setValiderLotModal(false);
    try {
      await api.post('/api/palmares/valider-lot', { ids: selected, adminId: user.id });
      setMessage(`✅ ${selected.length} lauréats validés`);
      setSelected([]);
      loadData();
    } catch (err) {
      setError('Erreur lors de la validation du lot');
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === filteredEnAttente.length) {
      setSelected([]);
    } else {
      setSelected(filteredEnAttente.map(m => m.id));
    }
  };

  const getMentionLabel = (mention) => {
    const labels = {
      'TRES_GRANDE_DISTINCTION': 'Très Grande Distinction',
      'GRANDE_DISTINCTION': 'Grande Distinction',
      'DISTINCTION': 'Distinction',
      'SATISFACTION': 'Satisfaction',
      'REUSSITE': 'Réussite',
      'AJOURNE': 'Ajourné'
    };
    return labels[mention] || mention;
  };

  const getMentionColor = (mention) => {
    const colors = {
      'TRES_GRANDE_DISTINCTION': '#1D9E75',
      'GRANDE_DISTINCTION': '#185FA5',
      'DISTINCTION': '#854F0B',
      'SATISFACTION': '#0F6E56',
      'REUSSITE': '#0B1F4A',
      'AJOURNE': '#cc0000'
    };
    return colors[mention] || '#0B1F4A';
  };

  const filteredEnAttente = enAttente.filter(m => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return m.nomComplet?.toLowerCase().includes(search) ||
             m.filiereNom?.toLowerCase().includes(search) ||
             m.universiteNom?.toLowerCase().includes(search);
    }
    if (filterMention) {
      return m.mention === filterMention;
    }
    return true;
  });

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏆 Validation du palmarès</h1>
          <p className="page-sub">Validez ou rejetez les lauréats proposés par le système</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {selected.length > 0 && (
            <button className="btn-success" onClick={validerLot}>
              ✅ Valider la sélection ({selected.length})
            </button>
          )}
          <button className="btn-outline" onClick={loadData}>
            🔄 Rafraîchir
          </button>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      {/* Statistiques */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ff9800' }}>{stats.enAttente || enAttente.length}</div>
          <div className="stat-label">En attente</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--color-success-text)' }}>{stats.valides || valides.length}</div>
          <div className="stat-label">Validés</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.total || enAttente.length + valides.length}</div>
          <div className="stat-label">Total lauréats</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {stats.mentions ? Object.keys(stats.mentions).length : 0}
          </div>
          <div className="stat-label">Mentions différentes</div>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          className={onglet === 'attente' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setOnglet('attente')}
        >
          ⏳ En attente ({enAttente.length})
        </button>
        <button
          className={onglet === 'valides' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setOnglet('valides')}
        >
          ✅ Validés ({valides.length})
        </button>
        <button
          className={onglet === 'stats' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setOnglet('stats')}
        >
          📊 Statistiques
        </button>
      </div>

      {/* Filtres pour l'onglet En attente */}
      {onglet === 'attente' && enAttente.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
              <input
                type="text"
                placeholder="🔍 Rechercher..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', width: '100%' }}
              />
            </div>
            <div className="form-group" style={{ minWidth: 150, marginBottom: 0 }}>
              <select
                value={filterMention}
                onChange={e => setFilterMention(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd' }}
              >
                <option value="">Toutes les mentions</option>
                <option value="TRES_GRANDE_DISTINCTION">Très Grande Distinction</option>
                <option value="GRANDE_DISTINCTION">Grande Distinction</option>
                <option value="DISTINCTION">Distinction</option>
                <option value="SATISFACTION">Satisfaction</option>
                <option value="REUSSITE">Réussite</option>
              </select>
            </div>
            <button className="btn-outline" style={{ fontSize: 11 }} onClick={() => { setSearchTerm(''); setFilterMention(''); }}>
              Réinitialiser
            </button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {filteredEnAttente.length} / {enAttente.length}
            </span>
          </div>
        </div>
      )}

      {/* Onglet En attente */}
      {onglet === 'attente' && (
        <div className="card">
          <h2 className="card-title">
            Lauréats en attente ({filteredEnAttente.length})
            {filteredEnAttente.length > 0 && (
              <label style={{ marginLeft: 16, fontSize: 12, fontWeight: 400, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selected.length === filteredEnAttente.length && filteredEnAttente.length > 0}
                  onChange={toggleSelectAll}
                  style={{ marginRight: 4 }}
                />
                Tout sélectionner
              </label>
            )}
          </h2>
          {filteredEnAttente.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
              Aucun lauréat en attente de validation.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 30 }}>
                      <input
                        type="checkbox"
                        checked={selected.length === filteredEnAttente.length && filteredEnAttente.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>Rang</th>
                    <th>Nom complet</th>
                    <th>Université</th>
                    <th>Filière</th>
                    <th>Moyenne</th>
                    <th>Mention</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnAttente.map(m => (
                    <tr key={m.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.includes(m.id)}
                          onChange={() => toggleSelect(m.id)}
                        />
                      </td>
                      <td style={{ fontWeight: 700, color: '#854F0B' }}>#{m.rang}</td>
                      <td style={{ fontWeight: 600 }}>{m.nomComplet}</td>
                      <td>{m.universiteNom}</td>
                      <td>{m.filiereNom}</td>
                      <td style={{ fontWeight: 600, color: '#185FA5' }}>{m.moyenneGenerale}</td>
                      <td>
                        <span style={{
                          color: getMentionColor(m.mention),
                          background: `${getMentionColor(m.mention)}15`,
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 11
                        }}>
                          {getMentionLabel(m.mention)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <button className="btn-success" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => valider(m.id)}>
                            ✅
                          </button>
                          <button className="btn-danger" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => rejeter(m.id)}>
                            ❌
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Onglet Validés */}
      {onglet === 'valides' && (
        <div className="card">
          <h2 className="card-title">Lauréats validés ({valides.length})</h2>
          {valides.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
              Aucun lauréat validé.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rang</th>
                    <th>Nom complet</th>
                    <th>Université</th>
                    <th>Filière</th>
                    <th>Moyenne</th>
                    <th>Mention</th>
                    <th>Date validation</th>
                  </tr>
                </thead>
                <tbody>
                  {valides.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 700, color: '#854F0B' }}>#{m.rang}</td>
                      <td style={{ fontWeight: 600 }}>{m.nomComplet}</td>
                      <td>{m.universiteNom}</td>
                      <td>{m.filiereNom}</td>
                      <td style={{ fontWeight: 600, color: '#185FA5' }}>{m.moyenneGenerale}</td>
                      <td>
                        <span style={{
                          color: getMentionColor(m.mention),
                          background: `${getMentionColor(m.mention)}15`,
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 11
                        }}>
                          {getMentionLabel(m.mention)}
                        </span>
                      </td>
                      <td>{m.dateValidation ? new Date(m.dateValidation).toLocaleDateString('fr-FR') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Onglet Statistiques */}
      {onglet === 'stats' && (
        <div className="card">
          <h2 className="card-title">📊 Statistiques du palmarès</h2>
          <div className="dash-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <h4>Répartition par mention</h4>
              {stats.mentions ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  {Object.entries(stats.mentions)
                    .sort((a, b) => b[1] - a[1])
                    .map(([mention, count]) => (
                      <div key={mention} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          color: getMentionColor(mention),
                          fontWeight: 600,
                          minWidth: 120
                        }}>
                          {getMentionLabel(mention)}
                        </span>
                        <div style={{ flex: 1, background: 'var(--bg-secondary)', height: 20, borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{
                            width: `${(count / stats.total) * 100}%`,
                            background: getMentionColor(mention),
                            height: '100%',
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                        <span style={{ fontWeight: 600, minWidth: 40, textAlign: 'right' }}>{count}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Aucune donnée</p>
              )}
            </div>
            <div>
              <h4>Répartition par université</h4>
              {stats.parUniversite ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  {Object.entries(stats.parUniversite)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([universite, count]) => (
                      <div key={universite} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f5f5f5' }}>
                        <span style={{ fontSize: 13 }}>{universite}</span>
                        <span style={{ fontWeight: 600 }}>{count}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Aucune donnée</p>
              )}
              {stats.parUniversite && Object.keys(stats.parUniversite).length > 8 && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>... et {Object.keys(stats.parUniversite).length - 8} autres</p>
              )}
            </div>
          </div>
        </div>
      )}

      {validerLotModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 400, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>✅ Valider la sélection</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>
              Valider <strong>{selected.length}</strong> lauréat(s) sélectionné(s) ?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setValiderLotModal(false)}>Annuler</button>
              <button className="btn-success" onClick={confirmerValiderLot}>Valider</button>
            </div>
          </div>
        </div>
      )}

      {rejetModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 400, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>❌ Motif du rejet</h3>
            <textarea
              rows={4}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Expliquez la raison du rejet du lauréat..."
              value={rejetModal.motif}
              onChange={e => setRejetModal(m => ({ ...m, motif: e.target.value }))}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setRejetModal({ open: false, id: null, motif: '' })}>Annuler</button>
              <button className="btn-danger" onClick={confirmerRejet}>Confirmer le rejet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}