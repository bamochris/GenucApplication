// src/components/etudiant/WidgetNotifications.jsx
import React from 'react';
import WidgetBase from './WidgetBase';

const WidgetNotifications = ({ notifications, loading, onRefresh }) => {
  const nonLues = notifications?.filter(n => !n.lu) || [];

  return (
    <WidgetBase title={`🔔 Notifications ${nonLues.length > 0 ? `(${nonLues.length})` : ''}`} icon="🔔" onRefresh={onRefresh} loading={loading}>
      {notifications && notifications.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune notification.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications?.slice(0, 4).map((notif, idx) => (
            <div key={idx} style={{
              padding: '8px 12px',
              background: notif.lu ? 'var(--bg-secondary)' : 'rgba(24, 95, 165, 0.12)',
              borderRadius: 6,
              borderLeft: `3px solid ${notif.type === 'URGENT' ? '#cc0000' : notif.type === 'ATTENTION' ? '#ff9800' : '#185FA5'}`
            }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{notif.titre || 'Notification'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{notif.message}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                {new Date(notif.date).toLocaleDateString('fr-FR')}
                {!notif.lu && <span style={{ marginLeft: 8, color: '#185FA5', fontWeight: 600 }}>• Nouveau</span>}
              </div>
            </div>
          ))}
          {notifications && notifications.length > 4 && (
            <div style={{ textAlign: 'center', fontSize: 12, color: '#185FA5', marginTop: 4 }}>
              <span style={{ cursor: 'pointer' }}>Voir toutes les notifications →</span>
            </div>
          )}
        </div>
      )}
    </WidgetBase>
  );
};

export default WidgetNotifications;