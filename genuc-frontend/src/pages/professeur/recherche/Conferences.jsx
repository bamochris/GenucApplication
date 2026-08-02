// src/pages/professeur/recherche/Conferences.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function Conferences() {
  const { user } = useAuth();
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    titre: '',
    description: '',
    type: 'CONFERENCE',
    date: '',
    lieu: '',
    organisateur: '',
    lien: ''
  });

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadData = async () => {
    try {
      const res = await api.get(`/api/recherche/conferences/${user.id}`);
      setConferences(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.post('/api/recherche/conferences', {
        ...form,
        professeurId: user.id,
        professeurNom: user.nomComplet
      });
      setMessage('✅ Conférence/Séminaire ajouté');
      setShowForm(false);
      setForm({
        titre: '',
        description: '',
        type: 'CONFERENCE',
        date: '',
        lieu: '',
        organisateur: '',
        lien: ''
      });
      loadData();
    } catch (err) {
      setMessage('❌ Erreur lors de l\'ajout');
    }
  };

  const getTypeLabel = (type) => {
    const map = {
      'CONFERENCE': '📢 Conférence',
      'SEMINAIRE': '📚 Séminaire',
      'ATELIER': '🔧 Atelier',
      'COLLOQUE': '🎯 Colloque'
    };
    return map[type] || type;
  };

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">📅 Conférences & Séminaires</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '➕ Ajouter un événement'}
        </button>
      </div>

      {message && <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>{message}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Nouvel événement</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Titre *</label>
              <input value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="3" />
            </div>
            <div className="form-group">
              <label>Type *</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="CONFERENCE">Conférence</option>
                <option value="SEMINAIRE">Séminaire</option>
                <option value="ATELIER">Atelier</option>
                <option value="COLLOQUE">Colloque</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Lieu</label>
              <input value={form.lieu} onChange={e => setForm({...form, lieu: e.target.value})} placeholder="En ligne, Salle, Ville..." />
            </div>
            <div className="form-group">
              <label>Organisateur</label>
              <input value={form.organisateur} onChange={e => setForm({...form, organisateur: e.target.value})} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Lien (optionnel)</label>
              <input value={form.lien} onChange={e => setForm({...form, lien: e.target.value})} placeholder="URL de l'événement" />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>Ajouter</button>
          </form>
        </div>
      )}

      <div className="card">
        {conferences.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucun événement planifié</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Type</th>
                <th>Date</th>
                <th>Lieu</th>
                <th>Organisateur</th>
              </tr>
            </thead>
            <tbody>
              {conferences.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.titre}</td>
                  <td><span className="badge badge-neutral">{getTypeLabel(c.type)}</span></td>
                  <td>{c.date ? new Date(c.date).toLocaleDateString('fr-FR') : '-'}</td>
                  <td>{c.lieu || '-'}</td>
                  <td>{c.organisateur || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}