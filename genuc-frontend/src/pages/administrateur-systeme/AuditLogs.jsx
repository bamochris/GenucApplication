// src/pages/administrateur-systeme/AuditLogs.jsx
// Surveillance des logs d'audit et connexions — tableau de bord sécurité.
// API : AuditLogController (/api/audit/logs/stats, /api/audit/logs/connexions)
import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import '../Dashboard.css';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(50);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, logsRes] = await Promise.all([
        api.get('/api/audit/logs/stats').catch(() => ({ data: {} })),
        api.get(`/api/audit/logs/connexions?limit=${limit}`).catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data || {});
      setLogs(logsRes.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des logs d\'audit');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatutBadge = (success) => (
    <span className={`badge ${success ? 'badge-success' : 'badge-danger'}`}>
      {success ? 'OK' : 'Échec'}
    </span>
  );

  if (loading) return (
    <div className="page">
      <div className="loading">Chargement des logs d'audit...</div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Audit & Surveillance</h1>
          <p className="page-sub">
            Journal complet des connexions et événements de sécurité
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }}
          >
            <option value={10}>10 derniers</option>
            <option value={25}>25 derniers</option>
            <option value={50}>50 derniers</option>
            <option value={100}>100 derniers</option>
          </select>
          <button className="btn-outline" onClick={loadData}>🔄 Actualiser</button>
        </div>
      </div>

      {error && <div className="alert-erreur">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E6F1FB' }}>📊</div>
          <div>
            <div className="stat-value">{stats.totalLogs || 0}</div>
            <div className="stat-label">Total logs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E1F5EE' }}>🔑</div>
          <div>
            <div className="stat-value" style={{ color: '#1D9E75' }}>{stats.totalConnexions || 0}</div>
            <div className="stat-label">Connexions</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FAEEDA' }}>⚠️</div>
          <div>
            <div className="stat-value" style={{ color: '#cc0000' }}>{stats.echecsConnexion || 0}</div>
            <div className="stat-label">Échecs de connexion</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FBEAF0' }}>📈</div>
          <div>
            <div className="stat-value" style={{ color: stats.tauxEchec > 10 ? '#cc0000' : '#1D9E75' }}>
              {stats.tauxEchec || 0}%
            </div>
            <div className="stat-label">Taux d'échec</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">
          Dernières connexions ({logs.length})
        </h2>
        {logs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
            Aucune connexion enregistrée.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date / Heure</th>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Adresse IP</th>
                <th>Rôle</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{log.createdAt ? new Date(log.createdAt).toLocaleString('fr-FR') : '-'}</td>
                  <td>{log.userNom || '-'}</td>
                  <td>{log.userEmail || '-'}</td>
                  <td>{log.ipAddress || '-'}</td>
                  <td>{log.role || '-'}</td>
                  <td>{getStatutBadge(log.success)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
