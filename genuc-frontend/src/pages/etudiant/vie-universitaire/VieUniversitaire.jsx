// src/pages/etudiant/vie-universitaire/VieUniversitaire.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../EtudiantDashboard.css';

export default function VieUniversitaire() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [clubs, setClubs] = useState([]);
  const [evenements, setEvenements] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [showClubForm, setShowClubForm] = useState(false);
  const [userClubs, setUserClubs] = useState([]);
  const [quitterModal, setQuitterModal] = useState({ open: false, clubId: null });
  const [form, setForm] = useState({
    nom: '',
    description: '',
    domaine: '',
    email: '',
    responsable: ''
  });

  const inscriptionId = user?.inscriptionId;
  const universiteId = user?.universiteId;

  useEffect(() => {
    if (!inscriptionId || !universiteId) {
      setError("Informations utilisateur manquantes");
      setLoading(false);
      return;
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId, universiteId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [clubsRes, eventsRes, userClubsRes] = await Promise.all([
        api.get(`/api/vie-universitaire/clubs/${universiteId}`),
        api.get(`/api/vie-universitaire/evenements/${universiteId}`),
        api.get(`/api/vie-universitaire/etudiant/${inscriptionId}/clubs`)
      ]);
      setClubs(clubsRes.data || []);
      setEvenements(eventsRes.data || []);
      setUserClubs(userClubsRes.data || []);
    } catch (err) {
      console.error('Erreur chargement vie universitaire:', err);
      setError('Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleClubSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError(null);
    setLoading(true);

    try {
      await api.post('/api/vie-universitaire/clubs', {
        ...form,
        universiteId: universiteId,
        createurId: user.id
      });
      setMessage('✅ Club créé avec succès !');
      setShowClubForm(false);
      setForm({ nom: '', description: '', domaine: '', email: '', responsable: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || '❌ Erreur lors de la création du club');
    } finally {
      setLoading(false);
    }
  };

  const handleRejoindreClub = async (clubId) => {
    setLoading(true);
    setMessage('');
    try {
      await api.post(`/api/vie-universitaire/clubs/${clubId}/rejoindre`, {
        inscriptionId: inscriptionId
      });
      setMessage('✅ Vous avez rejoint le club !');
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || '❌ Erreur lors de l\'inscription au club');
    } finally {
      setLoading(false);
    }
  };

  const handleQuitterClub = (clubId) => setQuitterModal({ open: true, clubId });

  const confirmerQuitter = async () => {
    const { clubId } = quitterModal;
    setQuitterModal({ open: false, clubId: null });
    setSelectedClub(null);
    setLoading(true);
    setMessage('');
    try {
      await api.delete(`/api/vie-universitaire/clubs/${clubId}/quitter`, {
        data: { inscriptionId: inscriptionId }
      });
      setMessage('✅ Vous avez quitté le club');
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || '❌ Erreur lors du départ du club');
    } finally {
      setLoading(false);
    }
  };

  const handleInscriptionEvenement = async (eventId) => {
    setLoading(true);
    setMessage('');
    try {
      await api.post(`/api/vie-universitaire/evenements/${eventId}/inscrire`, {
        inscriptionId: inscriptionId
      });
      setMessage('✅ Inscription à l\'événement réussie !');
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || '❌ Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const getDomaineIcon = (domaine) => {
    const map = {
      'SPORT': '⚽',
      'CULTURE': '🎨',
      'SCIENCE': '🔬',
      'TECHNOLOGIE': '💻',
      'ART': '🎭',
      'LITTÉRATURE': '📚',
      'MUSIQUE': '🎵',
      'ENTREPRENEURIAT': '💼',
      'RELIGION': '⛪',
      'AUTRE': '🌟'
    };
    return map[domaine] || '🌟';
  };

  const getDomaineColor = (domaine) => {
    const map = {
      'SPORT': '#1D9E75',
      'CULTURE': '#854F0B',
      'SCIENCE': '#185FA5',
      'TECHNOLOGIE': '#0B1F4A',
      'ART': '#993556',
      'LITTÉRATURE': '#9C27B0',
      'MUSIQUE': '#E91E63',
      'ENTREPRENEURIAT': '#FF9800',
      'RELIGION': '#4CAF50',
      'AUTRE': '#888'
    };
    return map[domaine] || '#888';
  };

  const estMembre = (clubId) => {
    return userClubs.some(uc => uc.id === clubId);
  };

  if (loading && !showClubForm) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de la vie universitaire...</p>
      </div>
    );
  }

  return (
    <div className="etudiant-dashboard">
      <div className="section-header">
        <h2 className="section-title">🏅 Vie Universitaire</h2>
        <button className="btn-primary" onClick={() => setShowClubForm(!showClubForm)}>
          {showClubForm ? 'Annuler' : '➕ Créer un club'}
        </button>
      </div>

      {message && (
        <div className="alert-success" onClick={() => setMessage('')}>{message}</div>
      )}
      {error && (
        <div className="alert-erreur" onClick={() => setError(null)}>{error}</div>
      )}

      {/* Formulaire de création de club */}
      {showClubForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Créer un nouveau club</h3>
          <form onSubmit={handleClubSubmit} className="form-grid" style={{ marginTop: 16 }}>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Nom du club *</label>
              <input
                type="text"
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                required
                placeholder="Ex: Club Informatique"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Domaine *</label>
              <select
                value={form.domaine}
                onChange={e => setForm({ ...form, domaine: e.target.value })}
                required
                disabled={loading}
              >
                <option value="">-- Sélectionner --</option>
                <option value="SPORT">Sport</option>
                <option value="CULTURE">Culture</option>
                <option value="SCIENCE">Science</option>
                <option value="TECHNOLOGIE">Technologie</option>
                <option value="ART">Art</option>
                <option value="LITTÉRATURE">Littérature</option>
                <option value="MUSIQUE">Musique</option>
                <option value="ENTREPRENEURIAT">Entrepreneuriat</option>
                <option value="RELIGION">Religion</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <div className="form-group">
              <label>Email de contact</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="club@email.com"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Responsable</label>
              <input
                type="text"
                value={form.responsable}
                onChange={e => setForm({ ...form, responsable: e.target.value })}
                placeholder="Nom du responsable"
                disabled={loading}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows="3"
                placeholder="Décrivez les objectifs et activités du club..."
                disabled={loading}
              />
            </div>
            <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10 }}>
              <button type="button" className="btn-outline" onClick={() => setShowClubForm(false)} disabled={loading}>
                Annuler
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? '⏳ Création...' : '🚀 Créer le club'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Clubs */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 className="card-title">🎯 Clubs et associations</h3>
        {clubs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
            Aucun club disponible pour le moment.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {clubs.map(club => {
              const membre = estMembre(club.id);
              return (
                <div key={club.id} className="card" style={{ 
                  borderTop: `4px solid ${getDomaineColor(club.domaine)}`,
                  padding: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ fontSize: 32 }}>{getDomaineIcon(club.domaine)}</span>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: 16 }}>{club.nom}</h4>
                      <span className="badge badge-neutral" style={{ fontSize: 10 }}>
                        {club.domaine}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    {club.description || 'Aucune description'}
                  </p>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {club.membresCount || 0} membres
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    {membre ? (
                      <button
                        className="btn-danger"
                        style={{ flex: 1, fontSize: 12 }}
                        onClick={() => handleQuitterClub(club.id)}
                        disabled={loading}
                      >
                        Quitter
                      </button>
                    ) : (
                      <button
                        className="btn-primary"
                        style={{ flex: 1, fontSize: 12 }}
                        onClick={() => handleRejoindreClub(club.id)}
                        disabled={loading}
                      >
                        Rejoindre
                      </button>
                    )}
                    <button
                      className="btn-outline"
                      style={{ fontSize: 12 }}
                      onClick={() => setSelectedClub(club)}
                    >
                      📋
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Événements */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 className="card-title">📅 Événements à venir</h3>
        {evenements.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
            Aucun événement planifié.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {evenements.map(event => (
              <div key={event.id} style={{
                padding: '14px 16px',
                background: new Date(event.date) < new Date() ? '#f5f5f5' : '#f8fafc',
                borderRadius: 8,
                borderLeft: `4px solid ${new Date(event.date) < new Date() ? '#888' : '#185FA5'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{event.titre}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{event.description}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    📅 {new Date(event.date).toLocaleDateString('fr-FR')} • 
                    ⏰ {event.heure || 'Horaire à définir'} • 
                    📍 {event.lieu || 'Lieu à définir'}
                    {event.club && ` • 🏛️ ${event.club}`}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span className={`badge ${new Date(event.date) < new Date() ? 'badge-neutral' : 'badge-success'}`}>
                    {new Date(event.date) < new Date() ? 'Passé' : 'À venir'}
                  </span>
                  {new Date(event.date) >= new Date() && (
                    <button
                      className="btn-primary"
                      style={{ fontSize: 11, padding: '4px 12px' }}
                      onClick={() => handleInscriptionEvenement(event.id)}
                      disabled={loading}
                    >
                      S'inscrire
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {quitterModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 380, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>Quitter le club</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>Voulez-vous vraiment quitter ce club ?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setQuitterModal({ open: false, clubId: null })}>Annuler</button>
              <button className="btn-danger" onClick={confirmerQuitter}>Quitter</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détail du club */}
      {selectedClub && (
        <div className="modal-overlay" onClick={() => setSelectedClub(null)} style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: 500, width: '100%', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 className="card-title">{selectedClub.nom}</h3>
              <button className="btn-outline" style={{ padding: '4px 12px' }} onClick={() => setSelectedClub(null)}>✕</button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <p><strong>Domaine :</strong> <span className="badge badge-neutral">{selectedClub.domaine}</span></p>
              <p><strong>Description :</strong> {selectedClub.description || 'Aucune description'}</p>
              <p><strong>Responsable :</strong> {selectedClub.responsable || 'Non spécifié'}</p>
              {selectedClub.email && <p><strong>Email :</strong> {selectedClub.email}</p>}
              <p><strong>Membres :</strong> {selectedClub.membresCount || 0}</p>
              <p><strong>Date de création :</strong> {new Date(selectedClub.creeLe).toLocaleDateString('fr-FR')}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {estMembre(selectedClub.id) ? (
                <button
                  className="btn-danger"
                  style={{ flex: 1 }}
                  onClick={() => handleQuitterClub(selectedClub.id)}
                  disabled={loading}
                >
                  Quitter le club
                </button>
              ) : (
                <button
                  className="btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    handleRejoindreClub(selectedClub.id);
                    setSelectedClub(null);
                  }}
                  disabled={loading}
                >
                  Rejoindre le club
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
