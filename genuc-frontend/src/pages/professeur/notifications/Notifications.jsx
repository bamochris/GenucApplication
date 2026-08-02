// src/pages/professeur/notifications/Notifications.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    loadNotifications();
  }, [user.id]);

  const loadNotifications = async () => {
    try {
      const res = await api.get(`/api/notifications/mes-notifications`);
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const marquerLue = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/lue`);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const marquerToutesLues = async () => {
    try {
      await api.patch(`/api/notifications/tout-lire`);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeIcon = (type) => {
    const map = {
      'INFO': 'ℹ️',
      'SUCCES': '✅',
      'ATTENTION': '⚠️',
      'URGENT': '🔴',
      'RAPPEL': '🔔'
    };
    return map[type] || '📌';
  };

  const getTypeColor = (type) => {
    const map = {
      'INFO': '#2196F3',
      'SUCCES': '#1D9E75',
      'ATTENTION': '#ff9800',
      'URGENT': '#f44336',
      'RAPPEL': '#185FA5'
    };
    return map[type] || '#888';
  };

  const filtered = filterType ? notifications.filter(n => n.type === filterType) : notifications;
  const nonLues = notifications.filter(n => !n.lu).length;

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">🔔 Notifications</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {nonLues > 0 && (
            <button className="btn-primary" onClick={marquerToutesLues}>
              ✅ Tout marquer lu ({nonLues})
            </button>
          )}
          <button className="btn-outline" onClick={loadNotifications}>🔄 Rafraîchir</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontWeight: 600 }}>Filtrer :</label>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          >
            <option value="">Toutes</option>
            <option value="INFO">ℹ️ Info</option>
            <option value="SUCCES">✅ Succès</option>
            <option value="ATTENTION">⚠️ Attention</option>
            <option value="URGENT">🔴 Urgent</option>
            <option value="RAPPEL">🔔 Rappel</option>
          </select>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {filtered.length} notification{filtered.length > 1 ? 's' : ''}
            {nonLues > 0 && ` • ${nonLues} non lue${nonLues > 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucune notification</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(n => (
              <div
                key={n.id}
                style={{
                  padding: '16px',
                  background: n.lu ? 'var(--bg-secondary)' : 'rgba(24, 95, 165, 0.12)',
                  borderRadius: 8,
                  borderLeft: `4px solid ${getTypeColor(n.type)}`,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span>{getTypeIcon(n.type)}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{n.titre}</span>
                      {!n.lu && <span className="badge badge-success" style={{ fontSize: 10 }}>Nouveau</span>}
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                      {new Date(n.dateEnvoi).toLocaleString('fr-FR')}
                    </div>
                  </div>
                  {!n.lu && (
                    <button
                      className="btn-outline"
                      style={{ fontSize: 11, padding: '4px 10px' }}
                      onClick={() => marquerLue(n.id)}
                    >
                      Marquer lu
                    </button>
                  )}
                </div>
                {n.lienAction && (
                  <a href={n.lienAction} className="btn-primary" style={{ fontSize: 11, padding: '4px 12px', marginTop: 8, display: 'inline-block', textDecoration: 'none' }}>
                    Voir l'action →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}