// src/components/etudiant/WidgetPaiements.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import WidgetBase from './WidgetBase';

const WidgetPaiements = ({ situation, loading, onRefresh }) => {
  const soldeRestant = situation?.soldeRestant || 0;
  const totalPaye = situation?.totalPaye || 0;
  const montantAttendu = situation?.montantAttendu || 0;
  const pourcentage = montantAttendu > 0 ? Math.min(100, (totalPaye / montantAttendu) * 100) : 0;

  return (
    <WidgetBase title="💰 Situation financière" icon="💰" onRefresh={onRefresh} loading={loading}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Reste à payer</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: soldeRestant > 0 ? '#cc0000' : '#1D9E75' }}>
            {soldeRestant.toFixed(2)} USD
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Déjà payé</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1D9E75' }}>
            {totalPaye.toFixed(2)} USD
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Progression</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{Math.round(pourcentage)}%</span>
        </div>
        <div style={{ background: 'var(--bg-secondary)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${pourcentage}%`, background: '#1D9E75', height: '100%', transition: 'width 0.3s' }} />
        </div>
        <Link to="/etudiant/mes-paiements" style={{ display: 'block', textAlign: 'center', fontSize: 12, color: '#185FA5', marginTop: 4 }}>
          Voir mes paiements →
        </Link>
      </div>
    </WidgetBase>
  );
};

export default WidgetPaiements;