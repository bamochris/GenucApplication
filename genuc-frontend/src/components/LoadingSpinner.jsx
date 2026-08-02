/**
 * ⏳ Loading Spinner - Composant loader réutilisable
 * Plusieurs variantes: skeleton, spinner, dots
 */
import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({
  variant = 'spinner', // 'spinner' | 'skeleton' | 'dots'
  size = 'medium', // 'small' | 'medium' | 'large'
  message = 'Chargement...',
  fullscreen = false,
}) => {
  const sizes = {
    small: { spinner: 24, height: 40 },
    medium: { spinner: 40, height: 80 },
    large: { spinner: 60, height: 120 },
  };

  const currentSize = sizes[size] || sizes.medium;

  if (fullscreen) {
    return (
      <div className="loading-fullscreen">
        <div className="loading-container">
          {variant === 'spinner' && (
            <div className="spinner" style={{ width: currentSize.spinner, height: currentSize.spinner }} />
          )}
          {variant === 'dots' && <div className="dots-loader" />}
          {variant === 'skeleton' && (
            <div className="skeleton" style={{ height: currentSize.height, width: '100%' }} />
          )}
          {message && <p className="loading-message">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="loading-inline">
      {variant === 'spinner' && (
        <div className="spinner" style={{ width: currentSize.spinner, height: currentSize.spinner }} />
      )}
      {variant === 'dots' && <div className="dots-loader" />}
      {variant === 'skeleton' && (
        <div className="skeleton" style={{ height: currentSize.height, width: '100%' }} />
      )}
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
