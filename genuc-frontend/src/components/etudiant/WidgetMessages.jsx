// src/components/etudiant/WidgetMessages.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import WidgetBase from './WidgetBase';

const WidgetMessages = ({ messages, loading, onRefresh }) => {
  return (
    <WidgetBase title="💬 Messages récents" icon="💬" onRefresh={onRefresh} loading={loading}>
      {messages && messages.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucun message.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {messages?.slice(0, 3).map((msg, idx) => (
            <div key={idx} style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{msg.sujet}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{msg.contenu?.substring(0, 60)}...</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                {new Date(msg.dateEnvoi).toLocaleDateString('fr-FR')}
                {!msg.lu && <span style={{ marginLeft: 8, color: '#185FA5', fontWeight: 600 }}>• Non lu</span>}
              </div>
            </div>
          ))}
          <Link to="/etudiant/messagerie" style={{ display: 'block', textAlign: 'center', fontSize: 12, color: '#185FA5', marginTop: 4 }}>
            Voir tous mes messages →
          </Link>
        </div>
      )}
    </WidgetBase>
  );
};

export default WidgetMessages;