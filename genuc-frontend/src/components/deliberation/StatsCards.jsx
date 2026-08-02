// src/components/deliberation/StatsCards.jsx
import React from 'react';

export default function StatsCards({ stats }) {
  if (!stats) return null;

  const cards = [
    { label: 'Total étudiants', value: stats.total || 0, icon: '👨‍🎓', color: 'var(--text-muted)' },
    { label: 'PA', value: stats.pa || 0, icon: '🟢', color: '#28a745' },
    { label: 'PD', value: stats.pd || 0, icon: '🟠', color: '#fd7e14' },
    { label: 'PP', value: stats.pp || 0, icon: '🔴', color: '#dc3545' },
    { label: 'CJ', value: stats.cj || 0, icon: '🔵', color: '#007bff' },
    { label: 'Taux réussite', value: `${stats.tauxReussite || 0}%`, icon: '📈', color: '#6f42c1' },
  ];

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
      gap: 12, 
      marginBottom: 20 
    }}>
      {cards.map((card, idx) => (
        <div 
          key={idx} 
          className="card" 
          style={{ 
            padding: '12px 16px', 
            textAlign: 'center',
            borderLeft: `4px solid ${card.color}`,
            background: 'var(--bg-card)'
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 4 }}>{card.icon}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: card.color }}>
            {card.value}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{card.label}</div>
        </div>
      ))}
    </div>
  );
}