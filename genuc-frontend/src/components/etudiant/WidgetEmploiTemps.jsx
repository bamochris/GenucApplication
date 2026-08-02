// src/components/etudiant/WidgetEmploiTemps.jsx
import React from 'react';
import WidgetBase from './WidgetBase';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const WidgetEmploiTemps = ({ emploiTemps, loading, onRefresh }) => {
  const aujourdHui = new Date().getDay(); // 1=lundi, 7=dimanche
  const jourActuel = JOURS[(aujourdHui === 0 ? 6 : aujourdHui - 1)];

  return (
    <WidgetBase title="📅 Emploi du temps" icon="📅" onRefresh={onRefresh} loading={loading}>
      {!emploiTemps || emploiTemps.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucun cours planifié.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {emploiTemps.slice(0, 5).map((cours, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              background: cours.jour === jourActuel ? 'rgba(24, 95, 165, 0.12)' : 'var(--bg-secondary)',
              borderRadius: 6,
              borderLeft: `3px solid ${cours.jour === jourActuel ? '#185FA5' : 'var(--border-color, #ddd)'}`
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{cours.titre}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {cours.jour} • {cours.heureDebut} - {cours.heureFin} • Salle {cours.salle || '—'}
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#185FA5' }}>
                {cours.jour === jourActuel ? 'Aujourd\'hui' : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetBase>
  );
};

export default WidgetEmploiTemps;