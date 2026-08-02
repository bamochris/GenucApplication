// src/pages/professeur/recherche/Publications.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function Publications() {
  const { user } = useAuth();
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    titre: '',
    auteurs: '',
    revue: '',
    annee: new Date().getFullYear(),
    doi: '',
    resume: '',
    type: 'ARTICLE'
  });

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadData = async () => {
    try {
      const res = await api.get(`/api/recherche/publications/${user.id}`);
      setPublications(res.data);
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
      await api.post('/api/recherche/publications', {
        ...form,
        professeurId: user.id,
        professeurNom: user.nomComplet
      });
      setMessage('✅ Publication ajoutée');
      setShowForm(false);
      setForm({ titre: '', auteurs: '', revue: '', annee: new Date().getFullYear(), doi: '', resume: '', type: 'ARTICLE' });
      loadData();
    } catch (err) {
      setMessage('❌ Erreur lors de l\'ajout');
    }
  };

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">📄 Publications scientifiques</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '➕ Ajouter une publication'}
        </button>
      </div>

      {message && <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>{message}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Nouvelle publication</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Titre *</label>
              <input value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Auteurs</label>
              <input value={form.auteurs} onChange={e => setForm({...form, auteurs: e.target.value})} placeholder="Nom1, Nom2, ..." />
            </div>
            <div className="form-group">
              <label>Revue / Journal</label>
              <input value={form.revue} onChange={e => setForm({...form, revue: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Année</label>
              <input type="number" value={form.annee} onChange={e => setForm({...form, annee: e.target.value})} />
            </div>
            <div className="form-group">
              <label>DOI</label>
              <input value={form.doi} onChange={e => setForm({...form, doi: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="ARTICLE">Article</option>
                <option value="LIVRE">Livre</option>
                <option value="CHAPITRE">Chapitre</option>
                <option value="CONFERENCE">Conférence</option>
                <option value="RAPPORT">Rapport</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Résumé</label>
              <textarea value={form.resume} onChange={e => setForm({...form, resume: e.target.value})} rows="3" />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>Ajouter</button>
          </form>
        </div>
      )}

      <div className="card">
        {publications.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucune publication</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Auteurs</th>
                <th>Revue</th>
                <th>Année</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {publications.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.titre}</td>
                  <td>{p.auteurs || '-'}</td>
                  <td>{p.revue || '-'}</td>
                  <td>{p.annee}</td>
                  <td><span className="badge badge-neutral">{p.type}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}