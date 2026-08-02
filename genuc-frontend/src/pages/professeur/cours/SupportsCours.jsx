// src/pages/professeur/cours/SupportsCours.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function SupportsCours() {
  const { user } = useAuth();
  const [cours, setCours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCours, setSelectedCours] = useState(null);
  const [supports, setSupports] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    titre: '',
    description: '',
    type: 'PDF',
    fichier: null
  });
  const [message, setMessage] = useState('');
  const [deleteSupModal, setDeleteSupModal] = useState({ open: false, id: null });

  useEffect(() => {
    loadCours();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadCours = async () => {
    try {
      const res = await api.get(`/api/cours/professeur/${user.id}`);
      setCours(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSupports = async (coursId) => {
    try {
      const res = await api.get(`/api/cours/${coursId}/supports`);
      setSupports(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectCours = (c) => {
    setSelectedCours(c);
    loadSupports(c.id);
    setShowUpload(false);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setMessage('');
    const formData = new FormData();
    formData.append('titre', uploadForm.titre);
    formData.append('description', uploadForm.description);
    formData.append('type', uploadForm.type);
    formData.append('fichier', uploadForm.fichier);
    formData.append('coursId', selectedCours.id);

    try {
      await api.post(`/api/cours/${selectedCours.id}/supports`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('✅ Support ajouté avec succès');
      setUploadForm({ titre: '', description: '', type: 'PDF', fichier: null });
      setShowUpload(false);
      loadSupports(selectedCours.id);
    } catch (err) {
      setMessage('❌ Erreur lors de l\'ajout du support');
    }
  };

  const handleFileChange = (e) => {
    setUploadForm({ ...uploadForm, fichier: e.target.files[0] });
  };

  const downloadSupport = (support) => {
    window.open(support.url, '_blank', 'noopener,noreferrer');
  };

  const deleteSupport = (id) => setDeleteSupModal({ open: true, id });

  const confirmerDeleteSup = async () => {
    const id = deleteSupModal.id;
    setDeleteSupModal({ open: false, id: null });
    try {
      await api.delete(`/api/cours/supports/${id}`);
      loadSupports(selectedCours.id);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">📚 Supports de cours</h2>
      </div>

      {message && <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>{message}</div>}

      <div className="dash-grid" style={{ gridTemplateColumns: '300px 1fr' }}>
        {/* Liste des cours */}
        <div className="card">
          <h3 className="card-title">Mes cours</h3>
          {cours.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Aucun cours</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cours.map(c => (
                <button
                  key={c.id}
                  className={`btn-outline ${selectedCours?.id === c.id ? 'active' : ''}`}
                  onClick={() => handleSelectCours(c)}
                  style={{
                    textAlign: 'left',
                    background: selectedCours?.id === c.id ? '#0B1F4A' : '',
                    color: selectedCours?.id === c.id ? 'white' : '',
                    padding: '10px 14px'
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{c.code}</div>
                  <div style={{ fontSize: 12 }}>{c.titre}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Supports du cours sélectionné */}
        <div className="card">
          {!selectedCours ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
              Sélectionnez un cours pour voir ses supports
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 className="card-title" style={{ margin: 0 }}>
                  {selectedCours.titre} - Supports
                </h3>
                <button className="btn-primary" onClick={() => setShowUpload(!showUpload)}>
                  {showUpload ? 'Annuler' : '➕ Ajouter'}
                </button>
              </div>

              {showUpload && (
                <form onSubmit={handleUpload} className="form-grid" style={{ marginBottom: 16, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <div className="form-group">
                    <label>Titre *</label>
                    <input value={uploadForm.titre} onChange={e => setUploadForm({...uploadForm, titre: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select value={uploadForm.type} onChange={e => setUploadForm({...uploadForm, type: e.target.value})}>
                      <option value="PDF">PDF</option>
                      <option value="VIDEO">Vidéo</option>
                      <option value="DOCUMENT">Document</option>
                      <option value="PPT">Présentation</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                    <label>Description</label>
                    <textarea value={uploadForm.description} onChange={e => setUploadForm({...uploadForm, description: e.target.value})} rows="2" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                    <label>Fichier *</label>
                    <input type="file" onChange={handleFileChange} required />
                    {uploadForm.fichier && <span style={{ fontSize: 12, color: '#185FA5' }}>📎 {uploadForm.fichier.name}</span>}
                  </div>
                  <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>Uploader</button>
                </form>
              )}

              {supports.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucun support pour ce cours</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {supports.map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{s.titre}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.type} • {new Date(s.creeLe).toLocaleDateString('fr-FR')}</div>
                        {s.description && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.description}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => downloadSupport(s)}>📥</button>
                        <button className="btn-danger" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => deleteSupport(s.id)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {deleteSupModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 380, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>🗑️ Supprimer le support</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>Supprimer ce support de cours ? Les étudiants n'y auront plus accès.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setDeleteSupModal({ open: false, id: null })}>Annuler</button>
              <button className="btn-danger" onClick={confirmerDeleteSup}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}