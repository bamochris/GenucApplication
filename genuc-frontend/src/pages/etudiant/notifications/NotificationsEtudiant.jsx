// src/pages/etudiant/notifications/NotificationsEtudiant.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import axios from 'axios';
import '../EtudiantDashboard.css';

export default function NotificationsEtudiant() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [nonLuesCount, setNonLuesCount] = useState(0);

  const userId = user?.id;

  useEffect(() => {
    const abortController = new AbortController();
    if (!userId) {
      setError("Utilisateur non identifié");
      setLoading(false);
      return;
    }
    loadNotifications(abortController.signal);
    return () => abortController.abort();
  }, [userId]);

  const loadNotifications = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const [allRes, countRes] = await Promise.all([
        api.get(`/api/notifications/mes-notifications`, { signal }),
        api.get(`/api/notifications/non-lues/count`, { signal })
      ]);
      setNotifications(allRes.data || []);
      setNonLuesCount(countRes.data?.count || 0);
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('Requête annulée:', err.message);
        return;
      }
      console.error('Erreur chargement notifications:', err);
      setError('Erreur de chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  const marquerLue = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/lue`);
      // Mettre à jour localement
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, lue: true } : n)
      );
      setNonLuesCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Erreur marquage lu:', err);
    }
  };

  const marquerToutesLues = async () => {
    try {
      await api.patch('/api/notifications/tout-lire');
      setNotifications(prev =>
        prev.map(n => ({ ...n, lue: true }))
      );
      setNonLuesCount(0);
      setMessage('✅ Toutes les notifications ont été marquées comme lues');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Erreur marquage toutes lues:', err);
      setError('Erreur lors du marquage');
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

  const filtered = filterType
    ? notifications.filter(n => n.type === filterType)
    : notifications;

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de vos notifications...</p>
      </div>
    );
  }

  return (
    <div className="etudiant-dashboard">
      <div className="section-header">
        <h2 className="section-title">🔔 Notifications</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {nonLuesCount > 0 && (
            <button className="btn-primary" onClick={marquerToutesLues}>
              ✅ Tout marquer lu ({nonLuesCount})
            </button>
          )}
          <button className="btn-outline" onClick={() => loadNotifications()}>🔄 Rafraîchir</button>
        </div>
      </div>

      {message && (
        <div className="alert-success" onClick={() => setMessage('')}>{message}</div>
      )}
      {error && (
        <div className="alert-erreur" onClick={() => setError(null)}>{error}</div>
      )}

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
            {nonLuesCount > 0 && ` • ${nonLuesCount} non lue${nonLuesCount > 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
            {notifications.length === 0
              ? 'Aucune notification pour le moment.'
              : 'Aucune notification ne correspond à vos filtres.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(n => (
              <div
                key={n.id}
                style={{
                  padding: '16px',
                  background: n.lue ? 'var(--bg-secondary)' : 'rgba(24, 95, 165, 0.12)',
                  borderRadius: 8,
                  borderLeft: `4px solid ${getTypeColor(n.type)}`,
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span>{getTypeIcon(n.type)}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{n.titre || 'Notification'}</span>
                    {!n.lue && <span className="badge badge-success" style={{ fontSize: 10 }}>Nouveau</span>}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                    {new Date(n.dateEnvoi).toLocaleString('fr-FR')}
                  </div>
                  {n.lienAction && (
                    <a href={n.lienAction} className="btn-primary" style={{ fontSize: 11, padding: '4px 12px', marginTop: 8, display: 'inline-block', textDecoration: 'none' }}>
                      Voir l'action →
                    </a>
                  )}
                </div>
                {!n.lue && (
                  <button
                    className="btn-outline"
                    style={{ fontSize: 11, padding: '4px 10px', marginLeft: 12 }}
                    onClick={() => marquerLue(n.id)}
                  >
                    Marquer lu
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}