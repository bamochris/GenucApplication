// src/pages/professeur/evaluations/Examens.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function Examens() {
  const { user } = useAuth();
  const [examens, setExamens] = useState([]);
  const [cours, setCours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    coursId: '',
    titre: '',
    date: '',
    duree: 120,
    coefficient: 1,
    salle: '',
    type: 'EXAMEN_SESSION'
  });

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadData = async () => {
    try {
      const [coursRes, examenRes] = await Promise.all([
        api.get(`/api/cours/professeur/${user.id}`),
        api.get(`/api/evaluations/examens/${user.id}`)
      ]);
      setCours(coursRes.data);
      setExamens(examenRes.data);
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
      await api.post('/api/evaluations/examens', {
        ...form,
        professeurId: user.id
      });
      setMessage('✅ Examen créé avec succès');
      setShowForm(false);
      setForm({ coursId: '', titre: '', date: '', duree: 120, coefficient: 1, salle: '', type: 'EXAMEN_SESSION' });
      loadData();
    } catch (err) {
      setMessage('❌ Erreur lors de la création');
    }
  };

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">📋 Examens</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '➕ Nouvel examen'}
        </button>
      </div>

      {message && <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>{message}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Créer un examen</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Cours *</label>
              <select value={form.coursId} onChange={e => setForm({...form, coursId: e.target.value})} required>
                <option value="">-- Sélectionner --</option>
                {cours.map(c => <option key={c.id} value={c.id}>{c.code} - {c.titre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Titre *</label>
              <input value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Durée (minutes)</label>
              <input type="number" value={form.duree} onChange={e => setForm({...form, duree: e.target.value})} min={30} max={300} />
            </div>
            <div className="form-group">
              <label>Coefficient</label>
              <input type="number" step="0.5" value={form.coefficient} onChange={e => setForm({...form, coefficient: e.target.value})} min={0.5} max={5} />
            </div>
            <div className="form-group">
              <label>Salle</label>
              <input value={form.salle} onChange={e => setForm({...form, salle: e.target.value})} placeholder="Amphi A1, Salle 203..." />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="EXAMEN_SESSION">Examen de session</option>
                <option value="RATTRAPAGE">Rattrapage</option>
                <option value="EXAMEN_DIPLO">Examen de diplôme</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>Créer</button>
          </form>
        </div>
      )}

      <div className="card">
        {examens.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucun examen planifié</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Cours</th>
                <th>Date</th>
                <th>Durée</th>
                <th>Salle</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {examens.map(e => (
                <tr key={e.id}>
                  <td style={{ fontWeight: 600 }}>{e.titre}</td>
                  <td>{e.coursCode}</td>
                  <td>{new Date(e.date).toLocaleDateString('fr-FR')}</td>
                  <td>{e.duree} min</td>
                  <td>{e.salle || '-'}</td>
                  <td>
                    <span className={`badge ${e.statut === 'TERMINE' ? 'badge-success' : e.statut === 'EN_COURS' ? 'badge-warning' : 'badge-neutral'}`}>
                      {e.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}