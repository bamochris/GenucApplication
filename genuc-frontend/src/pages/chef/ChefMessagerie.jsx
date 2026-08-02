// src/pages/chef/ChefMessagerie.jsx
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function ChefMessagerie() {
  const { user: _user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nouveau, setNouveau] = useState({ destinataireEmail: '', sujet: '', corps: '' });
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    chargerMessages();
  }, []);

  const chargerMessages = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/messagerie');
      const list = Array.isArray(res.data) ? res.data : [];
      setMessages(list);
    } catch (err) {
      setError('Erreur lors du chargement des messages');
      toast.error(err.response?.data?.erreur || err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const envoyer = async (e) => {
    e.preventDefault();
    if (!nouveau.destinataireEmail || !nouveau.sujet || !nouveau.corps) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setEnvoi(true);
    try {
      await api.post('/api/messagerie/envoyer', {
        ...nouveau,
        destinataireEmail: nouveau.destinataireEmail.trim().toLowerCase(),
      });
      toast.success('Message envoyé avec succès');
      setNouveau({ destinataireEmail: '', sujet: '', corps: '' });
      chargerMessages();
    } catch (err) {
      toast.error(err.response?.data?.erreur || err.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setEnvoi(false);
    }
  };

  if (loading) return <div className="page"><div className="loading">Chargement...</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">💬 Messagerie</h1>
          <p className="page-sub">{messages.length} message(s) reçu(s)</p>
        </div>
        <button className="btn-outline" onClick={chargerMessages}>🔄 Rafraîchir</button>
      </div>

      {error && <div className="alert alert-erreur">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>✉️ Nouveau message</h3>
        <form onSubmit={envoyer} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Destinataire (email)"
            value={nouveau.destinataireEmail}
            onChange={e => setNouveau({ ...nouveau, destinataireEmail: e.target.value })}
            style={{
              width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0',
              borderRadius: 8, fontSize: 14,
            }}
          />
          <input
            type="text"
            placeholder="Sujet"
            value={nouveau.sujet}
            onChange={e => setNouveau({ ...nouveau, sujet: e.target.value })}
            style={{
              width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0',
              borderRadius: 8, fontSize: 14,
            }}
          />
          <textarea
            placeholder="Votre message..."
            value={nouveau.corps}
            onChange={e => setNouveau({ ...nouveau, corps: e.target.value })}
            rows={4}
            style={{
              width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0',
              borderRadius: 8, fontSize: 14, resize: 'vertical',
            }}
          />
          <button type="submit" className="btn-primary" disabled={envoi}>
            {envoi ? 'Envoi...' : 'Envoyer'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>📥 Messages reçus</h3>
        {messages.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 32, color: '#666' }}>Aucun message.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map(m => (
              <div key={m.id} style={{
                padding: 14, borderRadius: 10, border: '1px solid #e2e8f0',
                background: '#fafafa',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong>{m.expediteur?.nomComplet || m.expediteurEmail || '—'}</strong>
                  <span style={{ fontSize: 12, color: '#666' }}>{m.dateEnvoi || m.date || '—'}</span>
                </div>
                <div style={{ fontSize: 13, color: '#333', marginBottom: 4 }}>{m.sujet || '—'}</div>
                <div style={{ fontSize: 13, color: '#555' }}>{m.corps || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
