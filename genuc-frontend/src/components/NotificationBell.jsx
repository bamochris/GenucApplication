// src/components/NotificationBell.jsx
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import axios from 'axios';

export default function NotificationBell() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);
  const abortRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user || !hasAccess) return;

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const load = async () => {
      try {
        await loadCount(ctrl.signal);
      } catch (err) {
        // Si 403, on arrête tout
        if (err.response?.status === 403) {
          setHasAccess(false);
          clearInterval(intervalRef.current);
        } else if (err.response?.status === 401) {
          setCount(0);
        }
        // Autres erreurs : on les ignore (sauf Cancel)
      }
    };

    load();

    intervalRef.current = setInterval(load, 30000);

    return () => {
      ctrl.abort();
      clearInterval(intervalRef.current);
    };
  }, [user, hasAccess]);

  const loadCount = async (signal) => {
    try {
      const res = await api.get('/api/notifications/non-lues/count', { signal });
      setCount(res.data.count);
    } catch (err) {
      if (axios.isCancel(err) || err.name === 'CanceledError') {
        // Annulation normale, on ignore
        return;
      }
      if (err.response?.status === 401) {
        setCount(0);
        return;
      }
      // Sinon, on relance pour que le useEffect gère le 403
      throw err;
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await api.get('/api/notifications/mes-notifications/non-lues');
      setNotifications(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setNotifications([]);
        return;
      }
      if (!axios.isCancel(err) && err.name !== 'CanceledError') {
        console.error('Erreur chargement notifs:', err);
      }
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) loadNotifications();
  };

  const marquerLue = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/lue`);
      setNotifications(notifications.filter(n => n.id !== id));
      setCount(count - 1);
    } catch (err) {
      console.error(err);
    }
  };

  const marquerToutesLues = async () => {
    try {
      await api.patch('/api/notifications/tout-lire');
      setNotifications([]);
      setCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !isAuthenticated || !user || !hasAccess) return null;

  return (
    <div className="notification-bell" style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={toggleDropdown}
        style={{
          background: 'none',
          border: 'none',
          fontSize: 20,
          cursor: 'pointer',
          position: 'relative',
          padding: 4
        }}
      >
        🔔
        {count > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: '#dc3545',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: 10,
            fontWeight: 700,
            minWidth: 18,
            textAlign: 'center'
          }}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 'calc(100% + 8px)',
          width: 380,
          maxHeight: 400,
          overflowY: 'auto',
          background: 'var(--bg-card)',
          borderRadius: 12,
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          zIndex: 1000,
          padding: 8,
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)' }}>
              Notifications {count > 0 && `(${count} non lues)`}
            </h4>
            {count > 0 && (
              <button
                onClick={marquerToutesLues}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 12,
                  color: '#185FA5',
                  cursor: 'pointer'
                }}
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Aucune notification non lue
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--border-color, #f8f8f8)',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  borderRadius: 8
                }}
                onClick={() => marquerLue(notif.id)}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                      {notif.titre}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                      {notif.message}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                      {new Date(notif.dateEnvoi).toLocaleString('fr-FR')}
                    </div>
                  </div>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: notif.type === 'URGENT' ? '#dc3545' :
                               notif.type === 'ATTENTION' ? '#ff9800' : '#1D9E75',
                    flexShrink: 0,
                    marginLeft: 8,
                    marginTop: 4
                  }} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}