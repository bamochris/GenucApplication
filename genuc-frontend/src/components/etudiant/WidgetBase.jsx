// src/components/etudiant/WidgetBase.jsx
import React from 'react';

const WidgetBase = ({ title, icon, children, className = '', onRefresh, loading }) => {
  return (
    <div className={`card widget ${className}`} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 className="widget-title" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          {icon && <span style={{ marginRight: 8 }}>{icon}</span>}
          {title}
        </h3>
        {onRefresh && (
          <button className="btn-outline" style={{ fontSize: 11, padding: '2px 8px' }} onClick={onRefresh} disabled={loading}>
            {loading ? '⏳' : '🔄'}
          </button>
        )}
      </div>
      <div className="widget-body" style={{ flex: 1 }}>
        {loading ? (
          <div className="loading" style={{ padding: '20px 0', fontSize: 12 }}>Chargement...</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default WidgetBase;