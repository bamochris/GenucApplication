// src/components/deliberation/SignatureWorkflow.jsx
import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function SignatureWorkflow({ deliberationId, onComplete }) {
  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [signModal, setSignModal] = useState({ open: false, etape: null, commentaire: '' });

  useEffect(() => {
    loadSignatures();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [deliberationId]);

  const loadSignatures = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/deliberation/${deliberationId}/signatures`);
      setSignatures(res.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des signatures');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSign = (etape) => setSignModal({ open: true, etape, commentaire: '' });

  const confirmerSignature = async () => {
    const { etape, commentaire } = signModal;
    setSignModal({ open: false, etape: null, commentaire: '' });
    try {
      await api.post(`/api/deliberation/${deliberationId}/signer`, {
        etapeId: etape.id,
        commentaire
      });
      setMessage(`✅ Signature ${etape.libelle} enregistrée`);
      loadSignatures();
      if (onComplete) onComplete();
    } catch (err) {
      setError('Erreur lors de la signature');
    }
  };

  const getEtapeStatus = (etape) => {
    if (etape.signee) return 'signee';
    if (etape.enCours) return 'en_cours';
    return 'a_venir';
  };

  const getStatusIcon = (status) => {
    const map = {
      'signee': '✅',
      'en_cours': '⏳',
      'a_venir': '⏺️'
    };
    return map[status] || '⏺️';
  };

  const getStatusColor = (status) => {
    const map = {
      'signee': '#28a745',
      'en_cours': '#ffc107',
      'a_venir': '#6c757d'
    };
    return map[status] || '#6c757d';
  };

  if (loading) {
    return <div className="loading">Chargement des signatures...</div>;
  }

  return (
    <div className="signature-workflow" style={{ padding: '16px 0' }}>
      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h4 style={{ marginBottom: 8 }}>📝 Workflow de signatures officielles</h4>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {signatures.map((etape, index) => {
            const status = getEtapeStatus(etape);
            const isLast = index === signatures.length - 1;

            return (
              <div key={etape.id} style={{ flex: 1, minWidth: 150, textAlign: 'center' }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: getStatusColor(status),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    color: 'white'
                  }}>
                    {getStatusIcon(status)}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{etape.libelle}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {etape.signee 
                      ? `Signé par ${etape.signataire} le ${new Date(etape.dateSignature).toLocaleDateString('fr-FR')}`
                      : etape.enCours 
                        ? 'En attente de signature' 
                        : 'Non signé'}
                  </div>
                  {status === 'en_cours' && (
                    <button 
                      className="btn-primary" 
                      style={{ fontSize: 12, padding: '4px 12px' }}
                      onClick={() => handleSign(etape)}
                    >
                      ✍️ Signer
                    </button>
                  )}
                </div>
                {!isLast && (
                  <div style={{
                    height: 2,
                    width: '80%',
                    margin: '8px auto',
                    background: status === 'signee' ? '#28a745' : '#ddd'
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Vue d'ensemble */}
      {signatures.length > 0 && (
        <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-secondary)', borderRadius: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span>📊 {signatures.filter(s => s.signee).length}/{signatures.length} signatures</span>
            <span>
              Statut : 
              <strong style={{ 
                marginLeft: 8,
                color: signatures.every(s => s.signee) ? '#28a745' : '#ffc107'
              }}>
                {signatures.every(s => s.signee) ? '✅ Complet' : '⏳ En cours'}
              </strong>
            </span>
          </div>
        </div>
      )}

      {signModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 400, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, color: 'var(--text-primary)' }}>
              ✍️ Signer : {signModal.etape?.libelle}
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)' }}>Commentaire (optionnel)</p>
            <textarea
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Ajouter une note à la signature..."
              value={signModal.commentaire}
              onChange={e => setSignModal(m => ({ ...m, commentaire: e.target.value }))}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
              <button style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer', background: 'var(--bg-card)' }} onClick={() => setSignModal({ open: false, etape: null, commentaire: '' })}>Annuler</button>
              <button style={{ padding: '8px 18px', borderRadius: 8, background: '#0B1F4A', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={confirmerSignature}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}