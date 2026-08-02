import React from 'react';

export default function ErrorDisplay({
  title = 'Une erreur est survenue',
  message = 'Impossible de charger les données. Veuillez réessayer.',
  onRetry = null,
}) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '40px 20px',
      color: '#993C1D',
      background: '#FAECE7',
      borderRadius: 12,
    }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
      <h3 style={{ margin: '0 0 8px', color: '#993C1D' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 14 }}>{message}</p>
      {onRetry && (
        <button
          className="btn-outline"
          onClick={onRetry}
          style={{ marginTop: 16, borderColor: '#993C1D', color: '#993C1D' }}
        >
          🔄 Réessayer
        </button>
      )}
    </div>
  );
}
