// src/pages/admin/deliberation/Consolidation.jsx
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import deliberationService from '../../../services/deliberationService';
import '../../Dashboard.css';

export default function Consolidation() {
  const { user } = useAuth();
  const [, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | running | success | error
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [jobId, setJobId] = useState(null);
  const [confirmerModal, setConfirmerModal] = useState(false);

  const handleConsolider = () => setConfirmerModal(true);

  const lancerConsolidation = async () => {
    setConfirmerModal(false);
    setLoading(true);
    setProgress(0);
    setStatus('running');
    setMessage('');
    setError('');
    setLogs([]);

    try {
      // Lancer la consolidation asynchrone
      const response = await deliberationService.lancerConsolidation(
        user.universiteId,
        `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
      );
      setJobId(response.jobId);

      // Simuler une progression
      const interval = setInterval(async () => {
        try {
          const statusData = await deliberationService.getConsolidationStatus(response.jobId);
          setProgress(statusData.progress || 0);
          if (statusData.status === 'TERMINE') {
            clearInterval(interval);
            setProgress(100);
            setStatus('success');
            setMessage('✅ Consolidation terminée avec succès');
            setLogs(statusData.result?.erreurs || ['Toutes les opérations ont été exécutées avec succès.']);
            setLoading(false);
          } else if (statusData.status === 'ERREUR') {
            clearInterval(interval);
            setStatus('error');
            setError(statusData.message || 'Erreur lors de la consolidation');
            setLoading(false);
          }
        } catch (err) {
          clearInterval(interval);
          setStatus('error');
          setError('Erreur lors du suivi de la progression');
          setLoading(false);
        }
      }, 1000);

    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.erreur || 'Erreur lors de la consolidation');
      setLogs(['Une erreur est survenue.']);
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔄 Consolidation Automatique</h1>
          <p className="page-sub">Génération des bulletins, relevés et palmarès</p>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <h2 style={{ marginBottom: 8 }}>Consolidation des résultats</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
            Cette opération va générer automatiquement :<br />
            • Bulletins semestriels et annuels<br />
            • Relevés de cotes<br />
            • Palmarès par promotion<br />
            • Statistiques de délibération
          </p>

          {status === 'idle' && (
            <button className="btn-primary" onClick={handleConsolider} style={{ fontSize: 16, padding: '10px 30px' }}>
              🚀 Lancer la consolidation
            </button>
          )}

          {status === 'running' && (
            <div>
              <div style={{ 
                width: '100%', 
                height: 20, 
                background: 'var(--bg-secondary)', 
                borderRadius: 10, 
                overflow: 'hidden',
                marginBottom: 12
              }}>
                <div style={{ 
                  width: `${progress}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #007bff, #28a745)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <p style={{ color: 'var(--text-muted)' }}>Traitement en cours... {progress}%</p>
              {jobId && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Job ID: {jobId}</p>}
            </div>
          )}

          {status === 'success' && (
            <div>
              <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
              <p style={{ color: '#28a745', fontWeight: 600 }}>Consolidation réussie !</p>
              <button className="btn-outline" onClick={() => setStatus('idle')} style={{ marginTop: 12 }}>
                🔄 Recommencer
              </button>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div style={{ fontSize: 48, marginBottom: 8 }}>❌</div>
              <p style={{ color: '#dc3545', fontWeight: 600 }}>Erreur lors de la consolidation</p>
              <button className="btn-outline" onClick={() => setStatus('idle')} style={{ marginTop: 12 }}>
                🔄 Réessayer
              </button>
            </div>
          )}
        </div>

        {/* Logs */}
        {logs.length > 0 && (
          <div style={{ marginTop: 20, borderTop: '1px solid #e9ecef', paddingTop: 16 }}>
            <h4 style={{ marginBottom: 8 }}>📋 Journal d'exécution</h4>
            <div style={{ 
              background: 'var(--bg-secondary)', 
              padding: 12, 
              borderRadius: 6, 
              maxHeight: 200, 
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: 13,
              color: 'var(--text-secondary)'
            }}>
              {logs.map((log, index) => (
                <div key={index} style={{ padding: '2px 0', borderBottom: '1px solid #e9ecef' }}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {confirmerModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 420, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>🔄 Lancer la consolidation</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>
              Lancer la consolidation automatique ? Cette action générera bulletins, relevés et palmarès. Elle est irréversible.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setConfirmerModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={lancerConsolidation}>🚀 Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}