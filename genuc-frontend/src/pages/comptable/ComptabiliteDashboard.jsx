// src/pages/comptable/ComptabiliteDashboard.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDesign } from '../../context/DesignContext';
import api from '../../api/axios';
import '../Dashboard.css';
import ComptabiliteDashboardPremium from './ComptabiliteDashboardPremium';

export default function ComptabiliteDashboard() {
  const { user } = useAuth();
  const { design } = useDesign();
  const [balance, setBalance] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const universiteId = user?.universiteId;

  useEffect(() => {
    if (universiteId) loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [universiteId]);

  const loadData = async () => {
    try {
      const [balanceRes, budgetsRes] = await Promise.all([
        api.get(`/api/comptabilite/balance/${universiteId}`),
        api.get(`/api/comptabilite/budgets/${universiteId}/${new Date().getFullYear()}`)
      ]);
      setBalance(balanceRes.data);
      setBudgets(budgetsRes.data || []);
    } catch (err) {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  // ── Variante « premium » (opt-in, réversible) ──────────────────────────
  if (design === 'premium') {
    return <ComptabiliteDashboardPremium balance={balance} budgets={budgets} error={error} />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">💰 Comptabilité générale</h1>
        <p className="page-sub">Balance, grand livre, budget</p>
      </div>

      {error && <div className="alert-erreur">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{balance?._totalDebit?.toFixed(2) || 0} USD</div>
          <div className="stat-label">Total Débit</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{balance?._totalCredit?.toFixed(2) || 0} USD</div>
          <div className="stat-label">Total Crédit</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{balance?._solde?.toFixed(2) || 0} USD</div>
          <div className="stat-label">Solde</div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">📊 Balance comptable</h2>
        <table className="data-table">
          <thead>
            <tr><th>Compte</th><th>Montant (USD)</th></tr>
          </thead>
          <tbody>
            {balance && Object.entries(balance)
              .filter(([key]) => !key.startsWith('_'))
              .map(([key, value]) => (
                <tr key={key}><td>{key}</td><td>{value}</td></tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2 className="card-title">📋 Budgets {new Date().getFullYear()}</h2>
        <table className="data-table">
          <thead>
            <tr><th>Libellé</th><th>Catégorie</th><th>Total</th><th>Utilisé</th><th>Restant</th></tr>
          </thead>
          <tbody>
            {budgets.map(b => (
              <tr key={b.id}>
                <td>{b.libelle}</td>
                <td>{b.categorie}</td>
                <td>{b.montantTotal} USD</td>
                <td>{b.montantUtilise} USD</td>
                <td style={{ color: b.montantTotal - b.montantUtilise < 0 ? '#cc0000' : '#1D9E75' }}>
                  {b.montantTotal - b.montantUtilise} USD
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}