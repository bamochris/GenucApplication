// src/components/etudiant/WidgetNotes.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import WidgetBase from './WidgetBase';

const WidgetNotes = ({ notes, loading, onRefresh, moyenneGenerale }) => {
  return (
    <WidgetBase title="📝 Mes notes" icon="📝" onRefresh={onRefresh} loading={loading}>
      {notes && notes.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune note publiée.</p>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Moyenne générale</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: moyenneGenerale >= 10 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
              {moyenneGenerale?.toFixed(2) || '-'}/20
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {notes?.slice(0, 3).map((n, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--border-color, #f5f5f5)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{n.cours}</span>
                <span style={{ fontWeight: 600, color: n.noteFinale >= 10 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                  {n.noteFinale}/20
                </span>
              </div>
            ))}
          </div>
          <Link to="/etudiant/mes-notes" style={{ display: 'block', textAlign: 'center', fontSize: 12, color: '#185FA5', marginTop: 8 }}>
            Voir toutes mes notes →
          </Link>
        </>
      )}
    </WidgetBase>
  );
};

export default WidgetNotes;