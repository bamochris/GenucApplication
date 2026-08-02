// src/pages/etudiant/profil/DocumentsPersonnels.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../EtudiantDashboard.css';

export default function DocumentsPersonnels() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleteDocModal, setDeleteDocModal] = useState({ open: false, id: null });
  const [selectedType, setSelectedType] = useState('');

  const inscriptionId = user?.inscriptionId;

  // Types de documents autorisés
  const DOCUMENT_TYPES = [
    { value: 'PHOTO_IDENTITE', label: '📸 Photo d\'identité', icon: '📸' },
    { value: 'CARTE_IDENTITE', label: '🪪 Carte d\'identité', icon: '🪪' },
    { value: 'PASSEPORT', label: '📘 Passeport', icon: '📘' },
    { value: 'DIPLOME_ETAT', label: '🎓 Diplôme d\'État', icon: '🎓' },
    { value: 'ACTE_NAISSANCE', label: '📜 Acte de naissance', icon: '📜' },
    { value: 'RELEVE_NOTES', label: '📊 Relevé de notes', icon: '📊' },
    { value: 'ATTESTATION_CONDUITE', label: '✅ Attestation de conduite', icon: '✅' },
    { value: 'ATTESTATION_PHYSIQUE', label: '🏥 Attestation physique', icon: '🏥' },
    { value: 'AUTRE', label: '📎 Autre document', icon: '📎' },
  ];

  useEffect(() => {
    if (inscriptionId) {
      loadDocuments();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId]);

  const loadDocuments = async () => {
    try {
      const res = await api.get(`/api/documents/etudiant/${inscriptionId}`);
      setDocuments(res.data);
    } catch (err) {
      console.error('Erreur chargement documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const fileInput = e.target.file;
    const file = fileInput.files[0];

    if (!file) {
      setMessage('⚠️ Veuillez sélectionner un fichier');
      return;
    }

    if (!selectedType) {
      setMessage('⚠️ Veuillez sélectionner un type de document');
      return;
    }

    // Vérification de la taille (max 5 Mo)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('⚠️ Le fichier ne doit pas dépasser 5 Mo');
      return;
    }

    // Vérification du type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setMessage('⚠️ Format non supporté. Utilisez JPG, PNG ou PDF');
      return;
    }

    setUploading(true);
    setMessage('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', selectedType);
    formData.append('inscriptionId', inscriptionId);

    try {
      await api.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('✅ Document uploadé avec succès');
      setSelectedType('');
      fileInput.value = '';
      loadDocuments();
    } catch (err) {
      setMessage('❌ Erreur lors de l\'upload');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id) => setDeleteDocModal({ open: true, id });

  const confirmerDeleteDoc = async () => {
    const id = deleteDocModal.id;
    setDeleteDocModal({ open: false, id: null });
    try {
      await api.delete(`/api/documents/${id}`);
      setMessage('✅ Document supprimé');
      loadDocuments();
    } catch (err) {
      setMessage('❌ Erreur lors de la suppression');
    }
  };

  const handleDownload = async (id, nom) => {
    try {
      const response = await api.get(`/api/documents/${id}/telecharger`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nom || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setMessage('❌ Erreur lors du téléchargement');
    }
  };

  const getTypeLabel = (type) => {
    const found = DOCUMENT_TYPES.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getTypeIcon = (type) => {
    const found = DOCUMENT_TYPES.find(t => t.value === type);
    return found ? found.icon : '📎';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de vos documents...</p>
      </div>
    );
  }

  return (
    <div className="etudiant-dashboard">
      <div className="section-header">
        <h2 className="section-title">📎 Documents personnels</h2>
        <button 
          className="btn-primary" 
          onClick={() => document.getElementById('uploadForm').scrollIntoView({ behavior: 'smooth' })}
        >
          ➕ Ajouter un document
        </button>
      </div>

      {message && (
        <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>
          {message}
        </div>
      )}

      {/* Formulaire d'upload */}
      <div className="card" id="uploadForm" style={{ marginBottom: 24 }}>
        <h3 className="card-title">📤 Uploader un document</h3>
        <form onSubmit={handleUpload} className="form-grid" style={{ marginTop: 16 }}>
          <div className="form-group">
            <label>Type de document *</label>
            <select 
              value={selectedType} 
              onChange={e => setSelectedType(e.target.value)} 
              required
              disabled={uploading}
            >
              <option value="">-- Sélectionner --</option>
              {DOCUMENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Fichier * (PDF, JPG, PNG - max 5 Mo)</label>
            <input 
              type="file" 
              name="file" 
              accept=".pdf,.jpg,.jpeg,.png" 
              required
              disabled={uploading}
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ gridColumn: '1 / span 2' }}
            disabled={uploading}
          >
            {uploading ? '⏳ Upload en cours...' : '📤 Uploader le document'}
          </button>
        </form>
      </div>

      {/* Liste des documents */}
      <div className="card">
        <h3 className="card-title">Mes documents ({documents.length})</h3>
        {documents.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
            Aucun document personnel n'a été uploadé.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {documents.map(doc => (
              <div key={doc.id} className="card" style={{ padding: 16, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 32 }}>{getTypeIcon(doc.type)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{getTypeLabel(doc.type)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {doc.nomFichier || 'Document'} • {doc.dateUpload ? new Date(doc.dateUpload).toLocaleDateString('fr-FR') : ''}
                    </div>
                  </div>
                  <span className={`badge ${doc.valide ? 'badge-success' : 'badge-warning'}`}>
                    {doc.valide ? '✅ Validé' : '⏳ En attente'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button 
                    className="btn-outline" 
                    style={{ fontSize: 11, padding: '4px 12px', flex: 1 }}
                    onClick={() => handleDownload(doc.id, doc.nomFichier)}
                  >
                    📥 Télécharger
                  </button>
                  <button 
                    className="btn-danger" 
                    style={{ fontSize: 11, padding: '4px 12px' }}
                    onClick={() => handleDelete(doc.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statut des documents requis */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title">📋 Statut des documents requis</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginTop: 12 }}>
          {DOCUMENT_TYPES.slice(0, 6).map(type => {
            const hasDoc = documents.some(d => d.type === type.value);
            return (
              <div key={type.value} style={{ 
                padding: '12px 16px', 
                background: hasDoc ? '#e8f5e9' : '#f8fafc',
                borderRadius: 8,
                border: `1px solid ${hasDoc ? '#1D9E75' : '#e0e0e0'}`,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <span>{type.icon}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{type.label}</span>
                <span className={`badge ${hasDoc ? 'badge-success' : 'badge-neutral'}`}>
                  {hasDoc ? '✅' : '❌'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {deleteDocModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 360, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>🗑️ Supprimer le document</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>Supprimer ce document ? Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setDeleteDocModal({ open: false, id: null })}>Annuler</button>
              <button className="btn-danger" onClick={confirmerDeleteDoc}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
