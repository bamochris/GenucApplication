// src/components/deliberation/StatutBadge.jsx
import React from 'react';
import './StatutBadge.css';

const STATUT_CONFIG = {
  PA: { label: 'PA', color: '#1D9E75', bg: '#E6F9F1', fullLabel: 'Passage Automatique' },
  PD: { label: 'PD', color: '#F39C12', bg: '#FEF5E7', fullLabel: 'Passage avec Dette' },
  PP: { label: 'PP', color: '#E74C3C', bg: '#FDEDEC', fullLabel: 'Ne Passe Pas' },
  CJ: { label: 'CJ', color: '#3498DB', bg: '#EBF5FB', fullLabel: 'Cas Jury' },
};

export default function StatutBadge({ statut, size = 'md', showLabel = false }) {
  const config = STATUT_CONFIG[statut];
  if (!config) return <span className="badge badge-neutral">{statut}</span>;

  const sizeClass = size === 'sm' ? 'badge-sm' : size === 'lg' ? 'badge-lg' : 'badge-md';

  return (
    <span
      className={`statut-badge ${sizeClass}`}
      style={{
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.color}`,
      }}
    >
      <span className="statut-code">{config.label}</span>
      {showLabel && <span className="statut-label">{config.fullLabel}</span>}
    </span>
  );
}