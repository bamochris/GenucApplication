import React from 'react';

export default function LoadingSpinner({ size = 'medium', color = '#185FA5', fullPage = false, message = '' }) {
  const sizes = {
    small: { width: 24, height: 24, borderWidth: 3 },
    medium: { width: 48, height: 48, borderWidth: 4 },
    large: { width: 64, height: 64, borderWidth: 5 },
  };

  const style = sizes[size] || sizes.medium;

  const spinnerStyle = {
    width: style.width,
    height: style.height,
    border: `${style.borderWidth}px solid var(--border-color)`,
    borderTopColor: color,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    ...(fullPage && {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(255,255,255,0.8)',
      zIndex: 9999,
    }),
    ...(!fullPage && { padding: '40px 20px' }),
  };

  return (
    <div style={containerStyle}>
      <div style={spinnerStyle} />
      {message && <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>{message}</p>}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}