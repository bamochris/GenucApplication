// src/components/etudiant/WidgetCours.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import WidgetBase from './WidgetBase';

const WidgetCours = ({ cours, loading, onRefresh }) => {
  return (
    <WidgetBase title="📚 Mes cours" icon="📚" onRefresh={onRefresh} loading={loading}>
      {cours && cours.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucun cours disponible.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cours?.slice(0, 4).map((c, idx) => (
            <Link
              key={idx}
              to={`/etudiant/cours/${c.id}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'var(--bg-secondary)',
                borderRadius: 8,
                transition: 'background 0.2s',
                border: '1px solid var(--border-color)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-color)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{c.titre}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.code} • {c.professeur}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#185FA5' }}>
                  {c.progression || 0}%
                </div>
              </div>
            </Link>
          ))}
          {cours && cours.length > 4 && (
            <Link to="/etudiant/mes-cours" style={{ textAlign: 'center', fontSize: 12, color: '#185FA5', marginTop: 4 }}>
              Voir tous les cours →
            </Link>
          )}
        </div>
      )}
    </WidgetBase>
  );
};

export default WidgetCours;