// src/pages/administrateur-systeme/AdministrateurSystemeDashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useDesign } from '../../context/DesignContext';
import '../Dashboard.css';
import AdministrateurSystemeDashboardPremium from './AdministrateurSystemeDashboardPremium';

export default function AdministrateurSystemeDashboard() {
  const { design } = useDesign();
  const [logs, setLogs] = useState([]);
  const [statsLogs, setStatsLogs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const statsRes = await api.get('/api/audit/logs/stats').catch(() => ({ data: {} }));
      setStatsLogs(statsRes.data || {});
      const logsRes = await api.get('/api/audit/logs/connexions?limit=10').catch(() => ({ data: [] }));
      setLogs(logsRes.data || []);
    } catch (err) {
      setError('Erreur de chargement.');
    } finally { setLoading(false); }
  };

  if (loading) return <div className="page"><div className="loading">Chargement...</div></div>;
  if (error) return <div className="page"><div className="alert-erreur">{error}</div></div>;

  // ── Variante « premium » (opt-in, réversible) ──────────────────────────
  if (design === 'premium') {
    return <AdministrateurSystemeDashboardPremium statsLogs={statsLogs} logs={logs} />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🔐 Administration Système</h1>
        <p className="page-sub">Audit, sécurité et paramètres</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-value">{statsLogs.totalLogs || 0}</div><div className="stat-label">Total logs</div></div>
        <div className="stat-card"><div className="stat-value">{statsLogs.totalConnexions || 0}</div><div className="stat-label">Connexions</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: 'var(--color-danger-text)' }}>{statsLogs.echecsConnexion || 0}</div><div className="stat-label">Échecs</div></div>
        <div className="stat-card"><div className="stat-value">{statsLogs.tauxEchec || 0}%</div><div className="stat-label">Taux d'échec</div></div>
      </div>
      <div className="card">
        <h2 className="card-title">📋 Dernières connexions</h2>
        {logs.length === 0 ? <p>Aucun log.</p> :
          <table className="data-table">
            <thead><tr><th>Date</th><th>Email</th><th>IP</th><th>Statut</th></tr></thead>
            <tbody>
              {logs.slice(0, 10).map(l => (
                <tr key={l.id}>
                  <td>{new Date(l.createdAt).toLocaleString()}</td>
                  <td>{l.userEmail || '-'}</td>
                  <td>{l.ipAddress || '-'}</td>
                  <td><span className={`badge ${l.success ? 'badge-success' : 'badge-danger'}`}>{l.success ? 'OK' : 'Échec'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-head"><h2 className="card-title">⚡ Actions</h2></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/admin-systeme/utilisateurs" className="btn-primary">👥 Utilisateurs</Link>
          <Link to="/admin-systeme/audit" className="btn-outline">📋 Audit</Link>
          <Link to="/admin-systeme/sauvegardes" className="btn-outline">💾 Sauvegardes</Link>
          <Link to="/admin-systeme/parametres" className="btn-outline">⚙️ Paramètres</Link>
        </div>
      </div>
    </div>
  );
}