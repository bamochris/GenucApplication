import React from 'react';

export default function EmptyState({ icon = '📭', title = 'Aucune donnée', message = 'Aucun élément à afficher pour le moment.' }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '40px 20px',
      color: 'var(--text-muted)',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ color: 'var(--text-muted)', margin: '0 0 8px' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 14 }}>{message}</p>
    </div>
  );
}