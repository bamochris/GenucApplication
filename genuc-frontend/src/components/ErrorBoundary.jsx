/**
 * 🛡️ Error Boundary - Gestion globale des erreurs React
 * Capture les erreurs non gérées dans l'arborescence des composants
 */
import React from 'react';
import Logger from '../utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    Logger.error('React Error Boundary', {
      errorId,
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
      errorId,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '20px',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '500px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>💥</div>
            <h1 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '28px' }}>
              Oups! Une erreur est survenue
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
              L'application a rencontré un problème inattendu.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
                textAlign: 'left',
              }}>
                <p style={{ color: '#991b1b', margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold' }}>
                  ID Erreur: {this.state.errorId}
                </p>
                <details style={{ fontSize: '12px' }}>
                  <summary style={{ color: '#991b1b', cursor: 'pointer', marginBottom: '8px' }}>
                    Détails de l'erreur (mode développement uniquement)
                  </summary>
                  <pre style={{
                    color: '#991b1b',
                    overflow: 'auto',
                    padding: '8px',
                    background: 'rgba(220,53,69,0.10)',
                    borderRadius: '4px',
                    fontSize: '11px',
                  }}>
                    {this.state.error?.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              </div>
            )}

            {/* En production, afficher uniquement l'ID d'erreur pour le support */}
            {process.env.NODE_ENV === 'production' && (
              <div style={{
                background: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                textAlign: 'center',
              }}>
                <p style={{ color: '#92400e', margin: 0, fontSize: '12px' }}>
                  ID Erreur: <code style={{ background: '#fffbeb', padding: '2px 6px', borderRadius: '4px' }}>{this.state.errorId}</code>
                </p>
                <p style={{ color: '#92400e', margin: '4px 0 0 0', fontSize: '11px' }}>
                  Veuillez contacter le support avec cet ID si le problème persiste.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '10px 24px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.background = '#5568d3'}
                onMouseLeave={(e) => e.target.style.background = '#667eea'}
              >
                🔄 Réessayer
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '10px 24px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.background = '#d1d5db'}
                onMouseLeave={(e) => e.target.style.background = '#e5e7eb'}
              >
                🏠 Accueil
              </button>
            </div>

            {/* Message de support sécurisé - ne pas afficher en double si déjà affiché ci-dessus */}
            {process.env.NODE_ENV !== 'production' && (
              <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '20px' }}>
                Si le problème persiste, contactez le support avec l'ID d'erreur: <code>{this.state.errorId}</code>
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
