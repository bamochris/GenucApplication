// src/pages/professeur/messagerie/Messagerie.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

const ADMIN_ROLES = ['ADMIN_UNIVERSITE', 'SUPER_ADMIN'];

const isRequestCanceled = (err) => (
  err?.code === 'ERR_CANCELED' ||
  err?.name === 'CanceledError' ||
  axios.isCancel(err)
);

export default function Messagerie() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [ciblesAdmin, setCiblesAdmin] = useState({ etudiants: [], promotions: [], professeurs: [] });
  const [form, setForm] = useState({
    mode: 'SIMPLE',
    destinataire: '',
    inscriptionIds: [],
    destinataireIds: [],
    promotionId: '',
    sujet: '',
    contenu: ''
  });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [reponse, setReponse] = useState('');

  const isAdminMessaging = ADMIN_ROLES.includes(user?.role);

  useEffect(() => {
    if (!user?.id) {
      return;
    }
    loadMessages();
    if (isAdminMessaging && user?.universiteId) {
      loadCiblesAdmin();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadMessages = async () => {
    try {
      const res = await api.get(`/api/messagerie/admin/${user.id}`);
      setMessages(res.data);
    } catch (err) {
      if (isRequestCanceled(err)) {
        return;
      }
      console.error(err);
      setError("Erreur lors du chargement des messages");
    } finally {
      setLoading(false);
    }
  };

  const loadCiblesAdmin = async () => {
    try {
      const res = await api.get(`/api/messagerie/admin/cibles/${user.universiteId}`);
      setCiblesAdmin({
        etudiants: res.data?.etudiants || [],
        promotions: res.data?.promotions || [],
        professeurs: res.data?.professeurs || []
      });
    } catch (err) {
      if (isRequestCanceled(err)) {
        return;
      }

      if (err?.status === 404) {
        try {
          const [inscriptionsRes, promotionsRes, contactsRes] = await Promise.all([
            api.get(`/api/inscriptions/universite/${user.universiteId}`),
            api.get(`/api/promotions/universite/${user.universiteId}`),
            api.get(`/api/messagerie/contacts/${user.universiteId}`)
          ]);

          const etudiants = Array.isArray(inscriptionsRes.data)
            ? inscriptionsRes.data.map((inscription) => ({
                inscriptionId: inscription.id,
                destinataireId: inscription.utilisateurId || inscription.etudiantId || null,
                nom: inscription.nomComplet || [inscription.prenom, inscription.nom].filter(Boolean).join(' '),
                matricule: inscription.matricule || '',
                promotionId: inscription.promotion?.id || null,
                promotion: inscription.promotion?.libelle || inscription.niveau || ''
              }))
            : [];

          const promotions = Array.isArray(promotionsRes.data)
            ? promotionsRes.data.map((promotion) => ({
                id: promotion.id,
                libelle: promotion.libelle || promotion.nom || `Promotion ${promotion.id}`
              }))
            : [];

          const professeurs = Array.isArray(contactsRes.data)
            ? contactsRes.data
                .filter((contact) => contact.type === 'PROFESSEUR')
                .map((contact) => ({
                  id: contact.id,
                  nom: contact.nom,
                  role: contact.type
                }))
            : [];

          setCiblesAdmin({ etudiants, promotions, professeurs });
          return;
        } catch (fallbackErr) {
          if (isRequestCanceled(fallbackErr)) {
            return;
          }
          console.error(fallbackErr);
        }
      }

      console.error(err);
      setError('Erreur lors du chargement des cibles de messagerie');
    }
  };

  const resetForm = () => {
    setForm({
      mode: isAdminMessaging ? 'INDIVIDUEL_ETUDIANTS' : 'SIMPLE',
      destinataire: '',
      inscriptionIds: [],
      destinataireIds: [],
      promotionId: '',
      sujet: '',
      contenu: ''
    });
  };

  const buildPayload = () => {
    const payload = {
      sujet: form.sujet,
      contenu: form.contenu,
      expediteurId: user.id,
      expediteurNom: user.nomComplet,
      expediteurRole: user.role,
      universiteId: user.universiteId
    };

    if (!isAdminMessaging) {
      return {
        ...payload,
        destinataire: form.destinataire,
        destinataireId: form.destinataire
      };
    }

    switch (form.mode) {
      case 'INDIVIDUEL_ETUDIANTS':
        if (form.inscriptionIds.length === 0) {
          throw new Error('Sélectionnez au moins un étudiant');
        }
        return { ...payload, inscriptionIds: form.inscriptionIds };
      case 'INDIVIDUEL_PROFESSEURS':
        if (form.destinataireIds.length === 0) {
          throw new Error('Sélectionnez au moins un professeur');
        }
        return { ...payload, destinataireIds: form.destinataireIds };
      case 'PROMOTION':
        if (!form.promotionId) {
          throw new Error('Sélectionnez une promotion');
        }
        return { ...payload, cibleType: 'PROMOTION', promotionId: form.promotionId };
      case 'TOUS_ETUDIANTS':
        return { ...payload, cibleType: 'TOUS_ETUDIANTS' };
      case 'PROFESSEURS':
        return { ...payload, cibleType: 'PROFESSEURS' };
      default:
        throw new Error('Mode de destinataire non supporté');
    }
  };

  const envoyerMessage = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const payload = buildPayload();
      const res = await api.post('/api/messagerie/envoyer', payload);
      const count = res.data?.count || 1;
      setMessage(`✅ Message envoyé avec succès${count > 1 ? ` à ${count} destinataires` : ''}`);
      setShowForm(false);
      resetForm();
      loadMessages();
    } catch (err) {
      setError(err.response?.data?.erreur || err.message || 'Erreur lors de l\'envoi');
    }
  };

  const marquerLu = async (id) => {
    try {
      await api.patch(`/api/messagerie/${id}/lu`);
      loadMessages();
    } catch (err) {
      if (isRequestCanceled(err)) {
        return;
      }
      console.error(err);
    }
  };

  const envoyerReponse = async (messageId) => {
    if (!reponse.trim()) {
      setError('Veuillez saisir une réponse');
      return;
    }
    try {
      await api.post(`/api/messagerie/${messageId}/repondre`, {
        reponse,
        reponseParId: user.id,
        reponseParNom: user.nomComplet
      });
      setMessage('✅ Réponse envoyée');
      setError('');
      setSelectedMessage(null);
      setReponse('');
      loadMessages();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de l\'envoi de la réponse');
    }
  };

  const handleModeChange = (value) => {
    setForm(prev => ({
      ...prev,
      mode: value,
      destinataire: '',
      inscriptionIds: [],
      destinataireIds: [],
      promotionId: ''
    }));
  };

  const handleInscriptionSelection = (event) => {
    const values = Array.from(event.target.selectedOptions, option => option.value);
    setForm(prev => ({ ...prev, inscriptionIds: values }));
  };

  const handleProfesseurSelection = (event) => {
    const values = Array.from(event.target.selectedOptions, option => option.value);
    setForm(prev => ({ ...prev, destinataireIds: values }));
  };

  const getTypeBadge = (type) => {
    const map = {
      'ETUDIANT': 'badge-warning',
      'ADMIN_UNIVERSITE': 'badge-success',
      'SUPER_ADMIN': 'badge-success',
      'PROFESSEUR': 'badge-neutral',
      'SCOLARITE': 'badge-info',
      'CAISSE': 'badge-info',
      'DIRECTION': 'badge-info',
      'SYSTEME': 'badge-danger'
    };
    return map[type] || 'badge-neutral';
  };

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">💬 Messagerie</h2>
        <button className="btn-primary" onClick={() => {
          setShowForm(!showForm);
          if (!showForm) {
            resetForm();
          }
        }}>
          {showForm ? 'Annuler' : '✏️ Nouveau message'}
        </button>
      </div>

      {message && <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Nouveau message</h3>
          <form onSubmit={envoyerMessage} className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Destinataire</label>
              {isAdminMessaging ? (
                <>
                  <select
                    value={form.mode}
                    onChange={e => handleModeChange(e.target.value)}
                    required
                  >
                    <option value="INDIVIDUEL_ETUDIANTS">👥 Un ou plusieurs étudiants</option>
                    <option value="INDIVIDUEL_PROFESSEURS">👨‍🏫 Un ou plusieurs professeurs</option>
                    <option value="PROMOTION">🎓 Toute une promotion</option>
                    <option value="TOUS_ETUDIANTS">📚 Tous les étudiants</option>
                    <option value="PROFESSEURS">👨‍🏫 Tous les professeurs</option>
                  </select>
                  {form.mode === 'INDIVIDUEL_ETUDIANTS' && (
                    <select
                      multiple
                      value={form.inscriptionIds}
                      onChange={handleInscriptionSelection}
                      style={{ marginTop: 10, minHeight: 180 }}
                      required
                    >
                      {ciblesAdmin.etudiants.map(etudiant => (
                        <option key={etudiant.inscriptionId} value={etudiant.inscriptionId}>
                          {etudiant.nom} {etudiant.matricule ? `• ${etudiant.matricule}` : ''} {etudiant.promotion ? `• ${etudiant.promotion}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {form.mode === 'INDIVIDUEL_PROFESSEURS' && (
                    <select
                      multiple
                      value={form.destinataireIds}
                      onChange={handleProfesseurSelection}
                      style={{ marginTop: 10, minHeight: 180 }}
                      required
                    >
                      {ciblesAdmin.professeurs.map(professeur => (
                        <option key={professeur.id} value={professeur.id}>
                          {professeur.nom}
                        </option>
                      ))}
                    </select>
                  )}
                  {form.mode === 'PROMOTION' && (
                    <select
                      value={form.promotionId}
                      onChange={e => setForm(prev => ({ ...prev, promotionId: e.target.value }))}
                      style={{ marginTop: 10 }}
                      required
                    >
                      <option value="">-- Sélectionner une promotion --</option>
                      {ciblesAdmin.promotions.map(promotion => (
                        <option key={promotion.id} value={promotion.id}>{promotion.libelle}</option>
                      ))}
                    </select>
                  )}
                  {form.mode === 'TOUS_ETUDIANTS' && (
                    <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                      Le message sera envoyé à tous les étudiants de votre université.
                    </div>
                  )}
                  {form.mode === 'PROFESSEURS' && (
                    <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                      Le message sera envoyé à tous les professeurs de votre université ({ciblesAdmin.professeurs.length}).
                    </div>
                  )}
                </>
              ) : (
                <select
                  value={form.destinataire}
                  onChange={e => setForm({ ...form, destinataire: e.target.value })}
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="scolarite">📋 Scolarité</option>
                  <option value="departement">🏛️ Chef de département</option>
                  <option value="caisse">💰 Service de caisse</option>
                  <option value="direction">🎓 Direction</option>
                </select>
              )}
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Sujet *</label>
              <input
                type="text"
                value={form.sujet}
                onChange={e => setForm({...form, sujet: e.target.value})}
                required
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Message *</label>
              <textarea
                rows="5"
                value={form.contenu}
                onChange={e => setForm({...form, contenu: e.target.value})}
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>
              📤 Envoyer
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">Boîte de réception ({messages.filter(m => !m.lu).length} non lus)</h3>
        {messages.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucun message</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map(m => (
              <div
                key={m.id}
                style={{
                  padding: '12px 16px',
                  background: m.lu ? 'var(--bg-secondary)' : 'rgba(24, 95, 165, 0.12)',
                  borderRadius: 8,
                  border: m.lu ? '1px solid var(--border-color)' : '1px solid #185FA5',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => {
                  setSelectedMessage(m);
                  if (!m.lu) marquerLu(m.id);
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.sujet}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{m.contenu?.substring(0, 120)}...</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      De: {m.expediteurNom} • {new Date(m.dateEnvoi).toLocaleString('fr-FR')}
                      {!m.lu && <span style={{ marginLeft: 8, color: '#185FA5', fontWeight: 600 }}>• Nouveau</span>}
                    </div>
                  </div>
                  <span className={`badge ${getTypeBadge(m.destinataireType)}`} style={{ marginLeft: 8 }}>
                    {m.destinataireType || 'MESSAGE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de lecture/réponse */}
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
          <div className="card" style={{ maxWidth: 600, width: '90%', maxHeight: '80%', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 className="card-title">{selectedMessage.sujet}</h3>
              <button className="btn-outline" style={{ padding: '4px 12px' }} onClick={() => setSelectedMessage(null)}>✕</button>
            </div>
            <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--text-muted)' }}>
              De: {selectedMessage.expediteurNom} • {new Date(selectedMessage.dateEnvoi).toLocaleString('fr-FR')}
            </div>
            {selectedMessage.destinataireNom && (
              <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                À: {selectedMessage.destinataireNom}
              </div>
            )}
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              {selectedMessage.contenu}
            </div>
            {selectedMessage.reponse && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(29,158,117,0.12)', borderRadius: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>📎 Réponse:</div>
                <div>{selectedMessage.reponse}</div>
              </div>
            )}
            <div style={{ marginTop: 16, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Répondre</label>
              <textarea
                rows="3"
                value={reponse}
                onChange={e => setReponse(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
                placeholder="Écrivez votre réponse..."
              />
              <button
                className="btn-primary"
                style={{ marginTop: 8 }}
                onClick={() => envoyerReponse(selectedMessage.id)}
              >
                📤 Envoyer la réponse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}