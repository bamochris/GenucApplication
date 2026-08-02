// src/pages/admin/CalendrierGestion.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

const TYPES_EVENEMENT = [
  'RENTREE_ACADEMIQUE', 'VACANCES', 'EXAMENS_SESSION_1',
  'EXAMENS_SESSION_2', 'INSCRIPTIONS', 'DELIBERATIONS',
  'JOUR_FERIE', 'REUNION', 'AUTRE'
];

const COULEURS = ['ROUGE', 'BLEU', 'VERT', 'ORANGE', 'VIOLET', 'GRIS'];

export default function CalendrierGestion() {
  const { user } = useAuth();
  const [evenements, setEvenements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    titre: '',
    description: '',
    dateDebut: '',
    dateFin: '',
    type: 'AUTRE',
    couleur: 'BLEU',
    actif: true
  });
  const [editingId, setEditingId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

  const universiteId = user?.universiteId;

  useEffect(() => {
    if (universiteId) loadEvenements();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [universiteId]);

  const loadEvenements = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/calendrier/universite/${universiteId}`);
      setEvenements(res.data);
    } catch (err) {
      setError("Erreur chargement du calendrier");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      titre: '',
      description: '',
      dateDebut: '',
      dateFin: '',
      type: 'AUTRE',
      couleur: 'BLEU',
      actif: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const payload = {
      ...form,
      universiteId: parseInt(universiteId)
    };

    try {
      if (editingId) {
        await api.put(`/api/calendrier/${editingId}`, payload);
        setMessage('Événement modifié avec succès');
      } else {
        await api.post('/api/calendrier', payload);
        setMessage('Événement créé avec succès');
      }
      resetForm();
      loadEvenements();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleEdit = (evt) => {
    setForm({
      titre: evt.titre,
      description: evt.description || '',
      dateDebut: evt.dateDebut,
      dateFin: evt.dateFin,
      type: evt.type,
      couleur: evt.couleur,
      actif: evt.actif
    });
    setEditingId(evt.id);
    setShowForm(true);
  };

  const handleDelete = (id) => setDeleteModal({ open: true, id });

  const confirmerDelete = async () => {
    const id = deleteModal.id;
    setDeleteModal({ open: false, id: null });
    try {
      await api.delete(`/api/calendrier/${id}`);
      setMessage('Événement supprimé');
      loadEvenements();
    } catch (err) {
      setError('Erreur lors de la suppression');
    }
  };

  const handleDesactiver = async (id) => {
    try {
      await api.patch(`/api/calendrier/${id}/desactiver`);
      loadEvenements();
    } catch (err) {
      setError('Erreur');
    }
  };

  const getCouleurBadge = (couleur) => {
    const map = {
      ROUGE: '#dc3545',
      BLEU: '#185FA5',
      VERT: '#1D9E75',
      ORANGE: '#ff9800',
      VIOLET: '#9c27b0',
      GRIS: '#9e9e9e'
    };
    return map[couleur] || '#185FA5';
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📅 Calendrier académique</h1>
          <p className="page-sub">Gérez les événements de l'année universitaire</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '➕ Nouvel événement'}
        </button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">{editingId ? 'Modifier' : 'Ajouter'} un événement</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Titre *</label>
              <input
                value={form.titre}
                onChange={e => setForm({...form, titre: e.target.value})}
                required
                placeholder="Ex: Début des examens"
              />
            </div>
            <div className="form-group">
              <label>Type *</label>
              <select
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value})}
                required
              >
                {TYPES_EVENEMENT.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date début *</label>
              <input
                type="date"
                value={form.dateDebut}
                onChange={e => setForm({...form, dateDebut: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Date fin *</label>
              <input
                type="date"
                value={form.dateFin}
                onChange={e => setForm({...form, dateFin: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Couleur</label>
              <select
                value={form.couleur}
                onChange={e => setForm({...form, couleur: e.target.value})}
              >
                {COULEURS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ marginBottom: 0 }}>Actif</label>
              <input
                type="checkbox"
                checked={form.actif}
                onChange={e => setForm({...form, actif: e.target.checked})}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                rows="3"
                placeholder="Détails de l'événement..."
              />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>
              {editingId ? 'Modifier' : 'Ajouter'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">📋 Événements programmés</h2>
        {evenements.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
            Aucun événement dans le calendrier.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Type</th>
                <th>Période</th>
                <th>Couleur</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {evenements.map(evt => (
                <tr key={evt.id}>
                  <td style={{ fontWeight: 600 }}>{evt.titre}</td>
                  <td>{evt.type?.replace('_', ' ')}</td>
                  <td>{evt.dateDebut} → {evt.dateFin}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      background: getCouleurBadge(evt.couleur)
                    }} />
                  </td>
                  <td>
                    <span className={`badge ${evt.actif ? 'badge-success' : 'badge-neutral'}`}>
                      {evt.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-outline" style={{ fontSize: 11 }} onClick={() => handleEdit(evt)}>
                        ✏️
                      </button>
                      <button className="btn-outline" style={{ fontSize: 11 }} onClick={() => handleDesactiver(evt.id)}>
                        {evt.actif ? '⏸️' : '▶️'}
                      </button>
                      <button className="btn-danger" style={{ fontSize: 11 }} onClick={() => handleDelete(evt.id)}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 380, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>🗑️ Supprimer l'événement</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>Supprimer cet événement du calendrier ? Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setDeleteModal({ open: false, id: null })}>Annuler</button>
              <button className="btn-danger" onClick={confirmerDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}