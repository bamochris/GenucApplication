// src/components/deliberation/FiltresRapides.jsx
import React from 'react';
import StatutBadge from './StatutBadge';

const FILTRES = [
  { valeur: '', label: 'Tous' },
  { valeur: 'PA', label: 'PA', couleur: '#1D9E75' },
  { valeur: 'PD', label: 'PD', couleur: '#F39C12' },
  { valeur: 'PP', label: 'PP', couleur: '#E74C3C' },
  { valeur: 'CJ', label: 'CJ', couleur: '#3498DB' },
];

export default function FiltresRapides({ filtreActif, onFiltreChange, className = '' }) {
  return (
    <div className={`filtres-rapides ${className}`}>
      {FILTRES.map((filtre) => (
        <button
          key={filtre.valeur || 'tous'}
          className={`filtre-btn ${filtreActif === filtre.valeur ? 'active' : ''}`}
          onClick={() => onFiltreChange(filtre.valeur)}
          style={{
            borderColor: filtreActif === filtre.valeur ? filtre.couleur : '#ddd',
            backgroundColor: filtreActif === filtre.valeur ? filtre.couleur : 'transparent',
            color: filtreActif === filtre.valeur ? '#fff' : filtre.couleur || '#333',
          }}
        >
          {filtre.valeur ? <StatutBadge statut={filtre.valeur} size="sm" /> : filtre.label}
        </button>
      ))}
    </div>
  );
}