// src/pages/comptable/BalanceGenerale.jsx
// Balance générale comptable (ComptabiliteController /api/comptabilite/balance)
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function BalanceGenerale() {
  const { user } = useAuth();
  const universiteId = user?.universiteId;

  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAnnee, setSelectedAnnee] = useState(new Date().getFullYear());

  const currentYear = new Date().getFullYear();
  const annees = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    if (universiteId) loadBalance();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universiteId, selectedAnnee]);

  const loadBalance = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/comptabilite/balance/${universiteId}?annee=${selectedAnnee}`);
      setBalance(res.data || {});
    } catch (err) {
      setError('Erreur lors du chargement de la balance');
      setBalance(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="page">
      <div className="loading">Chargement de la balance générale...</div>
    </div>
  );

  const formatAmount = (amount) => {
    if (!amount) return '0,00';
    return Number(amount).toLocaleString('fr-FR', { style: 'currency', currency: 'USD' });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">⚖️ Balance Générale</h1>
          <p className="page-sub">
            États financiers de l'université — Année académique {selectedAnnee}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={selectedAnnee}
            onChange={e => setSelectedAnnee(Number(e.target.value))}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }}
          >
            {annees.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button className="btn-outline" onClick={loadBalance}>🔄 Actualiser</button>
        </div>
      </div>

      {error && <div className="alert-erreur">{error}</div>}

      {!balance && !error && (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
          Aucune donnée de balance disponible pour l'année {selectedAnnee}.
        </p>
      )}

      {balance && (
        <>
          {/* Statistiques globales */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#E6F1FB' }}>💹</div>
              <div>
                <div className="stat-value">{formatAmount(balance.actifTotal)}</div>
                <div className="stat-label">Actif total</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#E1F5EE' }}>💚</div>
              <div>
                <div className="stat-value">{formatAmount(balance.passifTotal)}</div>
                <div className="stat-label">Passif total</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#FBEAF0' }}>📊</div>
              <div>
                <div className="stat-value">{formatAmount(balance.resultatNet)} </div>
                <div className="stat-label">Résultat net</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#FDEBD0' }}>📈</div>
              <div>
                <div className="stat-value">{formatAmount(balance.capital)}</div>
                <div className="stat-label">Capital</div>
              </div>
            </div>
          </div>

          {/* Comptes par type */}
          {balance.comptesParType && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 20 }}>
              {Object.entries(balance.comptesParType).map(([type, comptes]) => (
                <div key={type} className="card">
                  <h2 className="card-title" style={{
                    color: type === 'ACTIF' ? '#185FA5'
                      : type === 'PASSIF' ? '#1D9E75'
                      : type === 'CHARGE' ? '#cc0000'
                      : '#854F0B'
                  }}>
                    {type}
                  </h2>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Numéro</th>
                        <th>Libellé</th>
                        <th style={{ textAlign: 'right' }}>Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comptes.map(c => (
                        <tr key={c.id}>
                          <td className="uni-code">{c.numero}</td>
                          <td>{c.libelle}</td>
                          <td style={{ textAlign: 'right' }}>{formatAmount(c.solde)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* Équilibre comptable */}
          <div className="card" style={{ marginTop: 20 }}>
            <h2 className="card-title">📋 Vérification d'équilibre</h2>
            <div style={{ padding: 12, background: balance.actifTotal === balance.passifTotal
              ? 'rgba(29,158,117,0.1)'
              : 'rgba(204,0,0,0.1)',
              borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>
                  Actif = {formatAmount(balance.actifTotal)}
                </span>
                <span>
                  Passif = {formatAmount(balance.passifTotal)}
                </span>
                <span style={{
                  fontWeight: 600,
                  color: balance.actifTotal === balance.passifTotal ? '#1D9E75' : '#cc0000'
                }}>
                  {balance.actifTotal === balance.passifTotal
                    ? '✅ Comptes équilibrés'
                    : '⚠️ Déséquilibre détecté'}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
