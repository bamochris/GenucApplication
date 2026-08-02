// src/pages/etudiant/documents/DocumentsOfficiels.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../EtudiantDashboard.css';

export default function DocumentsOfficiels() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [documents, setDocuments] = useState([]);
  const [generating, setGenerating] = useState(false);

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    if (!inscriptionId) {
      setError("Aucune inscription trouvée");
      setLoading(false);
      return;
    }
    loadDocuments();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId]);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/etudiant/portal/${inscriptionId}/documents-officiels`);
      setDocuments(response.data || []);
    } catch (err) {
      console.error('Erreur chargement documents:', err);
      setError('Erreur de chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (doc) => {
    const code = (doc?.type || '').toUpperCase();
    if (code.includes('RELEVE')) return '📊';
    if (code.includes('BOURSE')) return '💰';
    if (code.includes('DIPLOME')) return '🎓';
    if (code.includes('CONDUITE')) return '✅';
    if (code.includes('FREQUENTATION')) return '🏫';
    if (code.includes('REUSSITE')) return '🏆';
    if (code.includes('SCOLARITE') || code.includes('INSCRIPTION')) return '📋';
    return doc?.typeSource === 'RELEVE' ? '📊' : '📄';
  };

  const handleGenerer = async (type) => {
    setGenerating(true);
    setMessage('');
    setError(null);
    try {
      const response = await api.post(`/api/etudiant/portal/${inscriptionId}/documents/generer`, {
        type: type
      }, {
        responseType: 'blob'
      });

      // Si la réponse est un PDF
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${type}_${inscriptionId}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage('✅ Document généré et téléchargé avec succès');
      loadDocuments();
    } catch (err) {
      if (err.response?.status === 404) {
        setError('❌ Document non disponible. Vérifiez que vous remplissez les conditions.');
      } else {
        setError(err.response?.data?.erreur || '❌ Erreur lors de la génération du document');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDemander = async (type) => {
    setGenerating(true);
    setMessage('');
    setError(null);
    try {
      await api.post(`/api/etudiant/portal/${inscriptionId}/documents/demander`, {
        type: type
      });
      const document = documents.find((doc) => doc.type === type);
      setMessage(`✅ Demande de ${document?.label || type} envoyée avec succès`);
      loadDocuments();
    } catch (err) {
      setError(err.response?.data?.erreur || '❌ Erreur lors de la demande');
    } finally {
      setGenerating(false);
    }
  };

  const getStatutBadge = (statut) => {
    const map = {
      'DISPONIBLE': 'badge-success',
      'DEMANDE_EN_COURS': 'badge-warning',
      'A_DEMANDER': 'badge-neutral',
      'PAIEMENT_REQUIS': 'badge-danger'
    };
    return map[statut] || 'badge-neutral';
  };

  const getStatutLabel = (statut) => {
    const map = {
      'DISPONIBLE': '✅ Disponible',
      'DEMANDE_EN_COURS': '⏳ Demande en cours',
      'A_DEMANDER': '📤 À demander',
      'PAIEMENT_REQUIS': '💳 Paiement requis'
    };
    return map[statut] || statut;
  };

  const isDocumentDisponible = (doc) => {
    return doc?.canDownload === true || doc?.statut === 'DISPONIBLE';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de vos documents officiels...</p>
      </div>
    );
  }

  return (
    <div className="etudiant-dashboard">
      <div className="section-header">
        <h2 className="section-title">📑 Documents Officiels</h2>
        <button className="btn-outline" onClick={loadDocuments}>🔄 Rafraîchir</button>
      </div>

      {message && (
        <div className="alert-success" onClick={() => setMessage('')}>{message}</div>
      )}
      {error && (
        <div className="alert-erreur" onClick={() => setError(null)}>{error}</div>
      )}

      {documents.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: 24, marginBottom: 20 }}>
          Aucun document officiel n'est encore configuré pour votre université.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {documents.map((doc) => {
          const disponible = isDocumentDisponible(doc);
          const demandeEnCours = doc?.statut === 'DEMANDE_EN_COURS';
          const paiementRequis = doc?.statut === 'PAIEMENT_REQUIS';

          return (
            <div key={doc.type} className="card" style={{ 
              borderLeft: `4px solid ${disponible ? '#1D9E75' : demandeEnCours ? '#ff9800' : paiementRequis ? '#cc0000' : '#94a3b8'}`,
              opacity: doc?.actif === false ? 0.65 : 1
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{getIcon(doc)}</div>
                  <h3 className="card-title" style={{ fontSize: 15 }}>{doc.label}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {doc.description || 'Document officiel disponible dans votre portail étudiant.'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${getStatutBadge(doc?.statut || 'A_DEMANDER')}`}>
                    {getStatutLabel(doc?.statut || 'A_DEMANDER')}
                  </span>
                </div>
              </div>

              {doc.fraisCodeRequis && (
                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                  Frais lié: <strong>{doc.fraisCodeRequis}</strong>
                </div>
              )}

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
                {disponible && (
                  <button
                    className="btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => handleGenerer(doc.type)}
                    disabled={generating}
                  >
                    {generating ? '⏳ Génération...' : '📥 Télécharger'}
                  </button>
                )}
                {demandeEnCours && (
                  <button
                    className="btn-warning"
                    style={{ width: '100%', background: '#ff9800', color: 'white' }}
                    disabled
                  >
                    ⏳ Demande en cours...
                  </button>
                )}
                {!disponible && !demandeEnCours && doc.canRequest && (
                  <button
                    className="btn-outline"
                    style={{ width: '100%' }}
                    onClick={() => handleDemander(doc.type)}
                    disabled={generating}
                  >
                    {generating ? '⏳ Envoi...' : '📤 Demander ce document'}
                  </button>
                )}
                {paiementRequis && (
                  <Link to="/etudiant/frais" className="btn-outline" style={{ width: '100%', display: 'block', textAlign: 'center' }}>
                    💳 Aller au paiement
                  </Link>
                )}
              </div>

              {doc && doc.dateGeneration && disponible && (
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
                  Généré le {new Date(doc.dateGeneration).toLocaleDateString('fr-FR')}
                </div>
              )}
              {doc && doc.motif && !disponible && (
                <div style={{ fontSize: 11, color: '#cc0000', marginTop: 8, textAlign: 'center' }}>
                  {doc.motif}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
