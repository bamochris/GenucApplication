// src/pages/securite/SecurityMonitor.jsx
// Tableau de bord de sécurité — surveillance des activités, signalements, alertes.
// API : AuditLogController, AuthController (diagnostiquer), NotificationController
import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import '../Dashboard.css';

export default function SecurityMonitor() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('connexions');

  const [connexions, setConnexions] = useState([]);
  const [statsConnexions, setStatsConnexions] = useState({});
  const [alertes, setAlertes] = useState([]);
  const [limit, setLimit] = useState(50);

  const tabs = [
    { id: 'connexions', label: 'Connexions & Authentification', icon: '🔑' },
    { id: 'alertes', label: 'Alertes de sécurité', icon: '⚠️' },
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, connexionsRes] = await Promise.all([
        api.get('/api/audit/logs/stats').catch(() => ({ data: {} })),
        api.get(`/api/audit/logs/connexions?limit=${limit}`).catch(() => ({ data: [] })),
      ]);
      setStatsConnexions(statsRes.data || {});
      setConnexions(connexionsRes.data || []);

      // Simuler les alertes de sécurité depuis les logs
      const alertesGenerees = connexionsRes.data
        ?.filter(l => !l.success)
        .map(l => ({
          id: l.id,
          type: 'Échec de connexion',
          email: l.userEmail || 'Inconnu',
          ip: l.ipAddress || 'Inconnue',
          date: l.createdAt,
          gravite: 'moyenne',
        })) || [];
      setAlertes(alertesGenerees);
    } catch (err) {
      setError('Erreur lors du chargement des données de sécurité');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getGraviteBadge = (gravite) => {
    const map = {
      critique: 'badge-danger',
      moyenne: 'badge-warning',
      faible: 'badge-neutral',
    };
    return map[gravite] || 'badge-neutral';
  };

  if (loading) return (
    <div className="page">
      <div className="loading">Chargement du tableau de bord de sécurité...</div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🛡️ Surveillance de Sécurité</h1>
          <p className="page-sub">
            Monitoring des connexions, alertes et événements de sécurité
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
          <button className="btn-outline" onClick={loadData} style={{ fontSize: 12 }}>🔄 Actualiser</button>
        </div>
      </div>

      {error && <div className="alert-erreur">{error}</div>}

      {/* Onglets */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'btn-primary' : 'btn-outline'}
              onClick={() => setActiveTab(tab.id)}
              style={{ fontSize: 12 }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Onglet Connexions */}
      {activeTab === 'connexions' && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#E6F1FB' }}>📊</div>
              <div>
                <div className="stat-value">{statsConnexions.totalLogs || 0}</div>
                <div className="stat-label">Total logs</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#E1F5EE' }}>🔑</div>
              <div>
                <div className="stat-value" style={{ color: '#1D9E75' }}>{statsConnexions.totalConnexions || 0}</div>
                <div className="stat-label">Connexions réussies</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#FDEBD0' }}>⚠️</div>
              <div>
                <div className="stat-value" style={{ color: '#cc0000' }}>{statsConnexions.echecsConnexion || 0}</div>
                <div className="stat-label">Connexions échouées</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#FBEAF0' }}>📈</div>
              <div>
                <div className="stat-value" style={{
                  color: (statsConnexions.tauxEchec || 0) > 10 ? '#cc0000' : '#1D9E75'
                }}>
                  {statsConnexions.tauxEchec || 0}%
                </div>
                <div className="stat-label">Taux d'échec</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">
              Dernières connexions ({connexions.length})
            </h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date / Heure</th>
                  <th>Email</th>
                  <th>Adresse IP</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {connexions.map(log => (
                  <tr key={log.id}>
                    <td>{log.createdAt ? new Date(log.createdAt).toLocaleString('fr-FR') : '-'}</td>
                    <td>{log.userEmail || '-'}</td>
                    <td>{log.ipAddress || '-'}</td>
                    <td>{log.role || '-'}</td>
                    <td>
                      <span className={`badge ${log.success ? 'badge-success' : 'badge-danger'}`}>
                        {log.success ? '✅ OK' : '❌ Échec'}
                      </span>
                    </td>
                  </tr>
                ))}
                {connexions.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>
                      Aucune connexion enregistrée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Onglet Alertes */}
      {activeTab === 'alertes' && (
        <div className="card">
          <h2 className="card-title">🚨 Alertes de sécurité ({alertes.length})</h2>
          {alertes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
              Aucune alerte détectée. Tout est normal.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Utilisateur</th>
                  <th>IP</th>
                  <th>Date</th>
                  <th>Gravité</th>
                </tr>
              </thead>
              <tbody>
                {alertes.map(a => (
                  <tr key={a.id}>
                    <td>{a.type}</td>
                    <td>{a.email}</td>
                    <td className="uni-code">{a.ip}</td>
                    <td>{a.date ? new Date(a.date).toLocaleString('fr-FR') : '-'}</td>
                    <td>
                      <span className={`badge ${getGraviteBadge(a.gravite)}`}>
                        {a.gravite}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
