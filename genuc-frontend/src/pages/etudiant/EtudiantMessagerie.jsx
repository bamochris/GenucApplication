// src/pages/etudiant/EtudiantMessagerie.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function EtudiantMessagerie() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    destinataire: '',
    sujet: '',
    contenu: ''
  });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [destinataires, setDestinataires] = useState([]);

  const inscriptionId = user?.inscriptionId;
  const universiteId = user?.universiteId;

  useEffect(() => {
    if (!inscriptionId) {
      setError("Aucune inscription trouvée");
      setLoading(false);
      return;
    }
    loadMessages();
    loadDestinataires();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId]);

  const loadMessages = async () => {
    try {
      const response = await api.get(`/api/messagerie/etudiant/${inscriptionId}`);
      setMessages(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDestinataires = async () => {
    try {
      // Récupérer les contacts disponibles (département, scolarité, etc.)
      const response = await api.get(`/api/messagerie/contacts/${universiteId}`);
      setDestinataires(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const envoyerMessage = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage('');
    
    try {
      await api.post('/api/messagerie/envoyer', {
        ...form,
        expediteurId: user.id,
        expediteurRole: user.role,
        inscriptionId: inscriptionId
      });
      setMessage('Message envoyé avec succès !');
      setShowForm(false);
      setForm({ destinataire: '', sujet: '', contenu: '' });
      loadMessages();
    } catch (err) {
      setError(err.response?.data?.erreur || "Erreur lors de l'envoi");
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

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Chargement de votre messagerie...</div>
      </div>
    );
  }

  const messagesNonLus = messages.filter(m => !m.lu && m.destinataireId === user.id).length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">💬 Messagerie</h1>
          <p className="page-sub">
            {messagesNonLus > 0 
              ? `Vous avez ${messagesNonLus} message(s) non lu(s)` 
              : 'Aucun message non lu'}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '✏️ Nouveau message'}
        </button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      {/* Formulaire d'envoi */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">Nouveau message</h2>
          <form onSubmit={envoyerMessage} className="form-grid" style={{ marginTop: 16 }}>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Destinataire</label>
              <select 
                value={form.destinataire} 
                onChange={e => setForm({ ...form, destinataire: e.target.value })}
                required
              >
                <option value="">-- Sélectionner un destinataire --</option>
                <option value="scolarite">📋 Scolarité</option>
                <option value="departement">🏛️ Chef de département</option>
                <option value="caisse">💰 Service de caisse</option>
                <option value="direction">🎓 Direction de l'université</option>
                {destinataires.map(d => (
                  <option key={d.id} value={d.id}>{d.nom} ({d.role})</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Sujet</label>
              <input 
                type="text" 
                value={form.sujet} 
                onChange={e => setForm({ ...form, sujet: e.target.value })}
                required
                placeholder="Objet de votre message"
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Message</label>
              <textarea 
                rows="5" 
                value={form.contenu} 
                onChange={e => setForm({ ...form, contenu: e.target.value })}
                required
                placeholder="Écrivez votre message ici..."
              />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>
              📤 Envoyer le message
            </button>
          </form>
        </div>
      )}

      {/* Liste des messages */}
      <div className="card">
        <h2 className="card-title">📥 Mes messages</h2>
        {messages.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
            Aucun message dans votre boîte.
          </p>
        ) : (
          <div className="activity-list">
            {messages.map(msg => {
              const estRecu = msg.destinataireId === user.id;
              const estNonLu = estRecu && !msg.lu;
              
              return (
                <div 
                  key={msg.id} 
                  className="activity-item" 
                  style={{ 
                    cursor: 'pointer',
                    background: estNonLu ? '#f0f7ff' : 'transparent',
                    borderRadius: 8,
                    padding: '12px'
                  }}
                  onClick={() => {
                    setSelectedMessage(msg);
                    if (estNonLu) marquerLu(msg.id);
                  }}
                >
                  <div className="activity-dot" style={{ background: estRecu ? '#185FA5' : '#1D9E75' }}></div>
                  <div style={{ flex: 1 }}>
                    <div className="activity-text">
                      <strong>{msg.sujet}</strong>
                      {estNonLu && <span className="badge badge-success" style={{ marginLeft: 8, fontSize: 10 }}>Nouveau</span>}
                    </div>
                    <div className="activity-meta">
                      {estRecu ? `De: ${msg.expediteurNom}` : `À: ${msg.destinataireNom}`} • 
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
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: 500, width: '90%', maxHeight: '80%', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 className="card-title">{selectedMessage.sujet}</h3>
              <button className="btn-outline" style={{ padding: '4px 12px' }} onClick={() => setSelectedMessage(null)}>✕</button>
            </div>
            <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--text-muted)' }}>
              De: {selectedMessage.expediteurNom} • {new Date(selectedMessage.dateEnvoi).toLocaleString('fr-FR')}
            </div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              {selectedMessage.contenu}
            </div>
            {selectedMessage.reponse && (
              <div style={{ marginTop: 20, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>📎 Réponse:</div>
                <div>{selectedMessage.reponse}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
