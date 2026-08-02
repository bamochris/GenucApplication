// src/pages/etudiant/messagerie/MessagerieEtudiant.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import axios from 'axios';
import '../EtudiantDashboard.css';

export default function MessagerieEtudiant() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [form, setForm] = useState({
    destinataire: '',
    destinataireId: '',
    sujet: '',
    contenu: ''
  });
  const [destinataires, setDestinataires] = useState([]);

  const inscriptionId = user?.inscriptionId;
  const universiteId = user?.universiteId;

  useEffect(() => {
    const abortController = new AbortController();
    if (!inscriptionId) {
      setError("Aucune inscription trouvée");
      setLoading(false);
      return;
    }
    loadMessages(abortController.signal);
    loadDestinataires(abortController.signal);
    return () => abortController.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId]);

  const loadMessages = async (signal) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/messagerie/etudiant/${inscriptionId}`, { signal });
      setMessages(response.data || []);
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('Requête annulée:', err.message);
        return;
      }
      console.error('Erreur chargement messages:', err);
      setError('Erreur de chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  const loadDestinataires = async (signal) => {
    try {
      const response = await api.get(`/api/messagerie/contacts/${universiteId}`, { signal });
      setDestinataires(response.data || []);
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('Requête annulée:', err.message);
        return;
      }
      console.error('Erreur chargement contacts:', err);
    }
  };

  const envoyerMessage = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage('');
    setLoading(true);

    try {
      await api.post('/api/messagerie/envoyer', {
        ...form,
        expediteurId: user.id,
        expediteurRole: user.role,
        inscriptionId: inscriptionId,
        universiteId: universiteId
      });
      setMessage('✅ Message envoyé avec succès !');
      setShowForm(false);
      setForm({ destinataire: '', destinataireId: '', sujet: '', contenu: '' });
      loadMessages();
    } catch (err) {
      setError(err.response?.data?.erreur || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  const marquerLu = async (messageId) => {
    try {
      await api.patch(`/api/messagerie/${messageId}/lu`);
      loadMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const envoyerReponse = async () => {
    if (!replyText.trim()) {
      setError('Veuillez saisir une réponse');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage('');

    try {
      await api.post(`/api/messagerie/${selectedMessage.id}/repondre`, {
        reponse: replyText,
        reponseParId: user.id,
        reponseParNom: user.nomComplet || user.email
      });
      setMessage('✅ Réponse envoyée avec succès');
      setSelectedMessage(null);
      setReplyText('');
      loadMessages();
    } catch (err) {
      setError(err.response?.data?.erreur || "Erreur lors de l'envoi de la réponse");
    } finally {
      setLoading(false);
    }
  };

  const handleDestinataireChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, destinataire: value });
    
    // Si c'est un ID numérique (utilisateur), on le stocke
    const destinataire = destinataires.find(d => d.id === value || d.nom === value);
    if (destinataire) {
      setForm(prev => ({ ...prev, destinataireId: destinataire.id }));
    } else {
      // Pour les valeurs prédéfinies (scolarite, departement, etc.)
      setForm(prev => ({ ...prev, destinataireId: value }));
    }
  };

  const messagesNonLus = messages.filter(m => !m.lu && m.destinataireId === user?.id).length;

  return (
    <div className="etudiant-dashboard">
      <div className="section-header">
        <h2 className="section-title">💬 Messagerie</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {messagesNonLus > 0 && (
            <span className="badge badge-danger" style={{ fontSize: 14, padding: '6px 14px' }}>
              {messagesNonLus} non lu(s)
            </span>
          )}
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '✏️ Nouveau message'}
          </button>
        </div>
      </div>

      {message && (
        <div className="alert-success" onClick={() => setMessage('')}>{message}</div>
      )}
      {error && (
        <div className="alert-erreur" onClick={() => setError(null)}>{error}</div>
      )}

      {/* Formulaire d'envoi */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Nouveau message</h3>
          <form onSubmit={envoyerMessage} className="form-grid" style={{ marginTop: 16 }}>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Destinataire *</label>
              <select 
                value={form.destinataire} 
                onChange={handleDestinataireChange}
                required
                disabled={loading}
              >
                <option value="">-- Sélectionner un destinataire --</option>
                <optgroup label="Services">
                  <option value="scolarite">📋 Scolarité</option>
                  <option value="departement">🏛️ Chef de département</option>
                  <option value="caisse">💰 Service de caisse</option>
                  <option value="direction">🎓 Direction de l'université</option>
                  <option value="bibliotheque">📚 Bibliothèque</option>
                  <option value="social">🏥 Service social</option>
                </optgroup>
                {destinataires.length > 0 && (
                  <optgroup label="Personnel">
                    {destinataires.map(d => (
                      <option key={d.id} value={d.id}>{d.nom} ({d.role})</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Sujet *</label>
              <input 
                type="text" 
                value={form.sujet} 
                onChange={e => setForm({ ...form, sujet: e.target.value })}
                required
                placeholder="Objet de votre message"
                disabled={loading}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Message *</label>
              <textarea 
                rows="5" 
                value={form.contenu} 
                onChange={e => setForm({ ...form, contenu: e.target.value })}
                required
                placeholder="Écrivez votre message ici..."
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }} disabled={loading}>
              {loading ? '⏳ Envoi...' : '📤 Envoyer le message'}
            </button>
          </form>
        </div>
      )}

      {/* Liste des messages */}
      <div className="card">
        <h3 className="card-title">📥 Mes messages ({messages.length})</h3>
        {loading && !showForm ? (
          <div className="loading">Chargement des messages...</div>
        ) : messages.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
            Aucun message dans votre boîte.
          </p>
        ) : (
          <div className="activity-list">
            {messages.map(msg => {
              const estRecu = msg.destinataireId === user?.id || msg.destinataireId === null;
              const estNonLu = estRecu && !msg.lu;
              
              return (
                <div 
                  key={msg.id} 
                  className="activity-item" 
                  style={{ 
                    cursor: 'pointer',
                    background: estNonLu ? '#f0f7ff' : 'transparent',
                    borderRadius: 8,
                    padding: '12px',
                    marginBottom: 4
                  }}
                  onClick={() => {
                    setSelectedMessage(msg);
                    if (estNonLu) marquerLu(msg.id);
                  }}
                >
                  <div className="activity-dot" style={{ 
                    background: estRecu ? '#185FA5' : '#1D9E75',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    flexShrink: 0,
                    marginTop: 4
                  }}></div>
                  <div style={{ flex: 1 }}>
                    <div className="activity-text">
                      <strong>{msg.sujet}</strong>
                      {estNonLu && <span className="badge badge-success" style={{ marginLeft: 8, fontSize: 10 }}>Nouveau</span>}
                    </div>
                    <div className="activity-meta">
                      {estRecu ? `De: ${msg.expediteurNom}` : `À: ${msg.destinataireNom || 'Administration'}`} • 
                      {new Date(msg.dateEnvoi).toLocaleString('fr-FR')}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                      {msg.contenu?.substring(0, 100)}...
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de lecture */}
      {selectedMessage && (
        <div className="modal-overlay" onClick={() => setSelectedMessage(null)} style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: 550, width: '90%', maxHeight: '80%', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 className="card-title">{selectedMessage.sujet}</h3>
              <button className="btn-outline" style={{ padding: '4px 12px' }} onClick={() => setSelectedMessage(null)}>✕</button>
            </div>
            <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--text-muted)' }}>
              <div><strong>De:</strong> {selectedMessage.expediteurNom}</div>
              <div><strong>Date:</strong> {new Date(selectedMessage.dateEnvoi).toLocaleString('fr-FR')}</div>
              {selectedMessage.destinataireNom && (
                <div><strong>À:</strong> {selectedMessage.destinataireNom}</div>
              )}
            </div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, padding: '12px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
              {selectedMessage.contenu}
            </div>

            {/* Réponse existante */}
            {selectedMessage.reponse && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(24,95,165,0.12)', borderRadius: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 4, color: '#185FA5' }}>📎 Réponse:</div>
                <div style={{ fontSize: 13 }}>{selectedMessage.reponse}</div>
                {selectedMessage.reponseParNom && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Par {selectedMessage.reponseParNom} le {selectedMessage.dateReponse ? new Date(selectedMessage.dateReponse).toLocaleString('fr-FR') : ''}
                  </div>
                )}
              </div>
            )}

            {/* Formulaire de réponse */}
            {!selectedMessage.reponse && (
              <div style={{ marginTop: 16 }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Répondre</label>
                <textarea
                  rows="3"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }}
                  placeholder="Écrivez votre réponse..."
                  disabled={loading}
                />
                <button
                  className="btn-primary"
                  style={{ marginTop: 8 }}
                  onClick={envoyerReponse}
                  disabled={loading || !replyText.trim()}
                >
                  {loading ? '⏳ Envoi...' : '📤 Envoyer la réponse'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
