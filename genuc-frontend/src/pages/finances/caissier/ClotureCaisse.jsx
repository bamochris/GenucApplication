// src/pages/finances/caissier/ClotureCaisse.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../FinanceDashboard.css';

export default function ClotureCaisse() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [caisse, setCaisse] = useState(null);
  const [soldeFinal, setSoldeFinal] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [stats, setStats] = useState({
    totalEncaissements: 0,
    totalDepenses: 0,
    soldeCalcule: 0,
    nbOperations: 0
  });
  const [operations, setOperations] = useState([]);
  const [clotureModal, setClotureModal] = useState(false);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 404 = aucune caisse ouverte, état normal (pas encore ouverte aujourd'hui)
      const caisseRes = await api.get(`/api/caisse/universite/${user.universiteId}/ouverte`)
        .catch(err => (err.status === 404 ? { data: null } : Promise.reject(err)));
      setCaisse(caisseRes.data || null);

      if (caisseRes.data) {
        // Récupérer les opérations du jour
        const opsRes = await api.get(`/api/caisse/operations/caisse/${caisseRes.data.id}`);
        const ops = opsRes.data || [];
        setOperations(ops);

        const encaissements = ops.filter(o => o.type === 'ENCAISSEMENT').reduce((sum, o) => sum + o.montant, 0);
        const depenses = ops.filter(o => o.type === 'DEPENSE' || o.type === 'REMBOURSEMENT').reduce((sum, o) => sum + o.montant, 0);
        setStats({
          totalEncaissements: encaissements,
          totalDepenses: depenses,
          soldeCalcule: caisseRes.data.soldeInitial + encaissements - depenses,
          nbOperations: ops.length
        });
      }
    } catch (err) {
      console.error('Erreur chargement caisse:', err);
      setError('Impossible de charger les données de la caisse');
    } finally {
      setLoading(false);
    }
  };

  const handleCloturer = () => {
    if (!caisse) { setError('Aucune caisse ouverte à clôturer'); return; }
    if (!soldeFinal || parseFloat(soldeFinal) < 0) { setError('Veuillez saisir un solde final valide'); return; }
    setClotureModal(true);
  };

  const confirmerCloture = async () => {
    setClotureModal(false);
    setLoading(true);
    setError(null);
    setMessage('');
    try {
      await api.patch(`/api/caisse/${caisse.id}/fermer`, {
        caissierId: user.id,
        soldeFinal: parseFloat(soldeFinal),
        commentaire: commentaire || null
      });
      setMessage('✅ Caisse clôturée avec succès');
      setCaisse(null);
      setSoldeFinal('');
      setCommentaire('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || '❌ Erreur lors de la clôture');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de la caisse...</p>
      </div>
    );
  }

  return (
    <div className="finance-dashboard">
      <div className="section-header">
        <h2 className="section-title">🔒 Clôture de caisse</h2>
      </div>

      {message && (
        <div className="alert-success" onClick={() => setMessage('')}>{message}</div>
      )}
      {error && (
        <div className="alert-erreur" onClick={() => setError(null)}>{error}</div>
      )}

      {!caisse ? (
        <div className="card">
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
            <h3 style={{ color: 'var(--text-primary)' }}>Aucune caisse ouverte</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Vous devez d'abord ouvrir la caisse avant de pouvoir la clôturer.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Résumé */}
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card" style={{ borderLeftColor: '#185FA5' }}>
              <div className="stat-icon">💵</div>
              <div className="stat-content">
                <div className="stat-value">{caisse.soldeInitial} USD</div>
                <div className="stat-label">Solde initial</div>
              </div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: '#1D9E75' }}>
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-value" style={{ color: 'var(--color-success-text)' }}>{stats.totalEncaissements.toFixed(2)} USD</div>
                <div className="stat-label">Encaissements</div>
              </div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: '#cc0000' }}>
              <div className="stat-icon">📤</div>
              <div className="stat-content">
                <div className="stat-value" style={{ color: 'var(--color-danger-text)' }}>{stats.totalDepenses.toFixed(2)} USD</div>
                <div className="stat-label">Sorties</div>
              </div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: '#185FA5' }}>
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value" style={{ color: '#185FA5' }}>{stats.soldeCalcule.toFixed(2)} USD</div>
                <div className="stat-label">Solde calculé</div>
              </div>
            </div>
          </div>

          {/* Formulaire de clôture */}
          <div className="card">
            <h3 className="card-title">Clôturer la caisse</h3>
            <div style={{ marginTop: 16 }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
                Date d'ouverture : {new Date(caisse.dateOuverture).toLocaleDateString('fr-FR')}
                <br />
                Nombre d'opérations : {stats.nbOperations}
              </p>

              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                  <label>Solde final (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Saisir le solde compté"
                    value={soldeFinal}
                    onChange={e => setSoldeFinal(e.target.value)}
                    required
                    disabled={loading}
                  />
                  {soldeFinal && parseFloat(soldeFinal) !== stats.soldeCalcule && (
                    <div style={{ fontSize: 12, color: '#ff9800', marginTop: 4 }}>
                      ⚠️ Écart de {Math.abs(parseFloat(soldeFinal) - stats.soldeCalcule).toFixed(2)} USD
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                  <label>Commentaire (optionnel)</label>
                  <textarea
                    value={commentaire}
                    onChange={e => setCommentaire(e.target.value)}
                    rows="2"
                    placeholder="Observations sur la clôture..."
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button 
                  className="btn-danger" 
                  onClick={handleCloturer}
                  disabled={loading || !soldeFinal}
                >
                  {loading ? '⏳ Clôture...' : '🔒 Clôturer la caisse'}
                </button>
                <button className="btn-outline" onClick={loadData} disabled={loading}>
                  🔄 Rafraîchir
                </button>
              </div>
            </div>
          </div>

          {/* Détail des opérations */}
          {operations.length > 0 && (
            <div className="card" style={{ marginTop: 20 }}>
              <h3 className="card-title">Détail des opérations</h3>
              <div style={{ overflowX: 'auto', maxHeight: 300, overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Heure</th>
                      <th>Type</th>
                      <th>Montant</th>
                      <th>Référence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operations.map(op => (
                      <tr key={op.id}>
                        <td>{new Date(op.dateOperation).toLocaleTimeString('fr-FR')}</td>
                        <td>
                          <span style={{ color: op.type === 'ENCAISSEMENT' ? '#1D9E75' : '#cc0000' }}>
                            {op.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {op.type === 'ENCAISSEMENT' ? '+' : '-'} {op.montant.toFixed(2)} USD
                        </td>
                        <td className="uni-code">{op.reference || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      {clotureModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 400, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>🔒 Confirmer la clôture</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>
              Clôturer la caisse avec un solde final de <strong>{soldeFinal} USD</strong> ? Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setClotureModal(false)}>Annuler</button>
              <button className="btn-danger" onClick={confirmerCloture}>Confirmer la clôture</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}