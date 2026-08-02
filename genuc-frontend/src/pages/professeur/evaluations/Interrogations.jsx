// src/pages/professeur/evaluations/Interrogations.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function Interrogations() {
  const { user } = useAuth();
  const [interrogations, setInterrogations] = useState([]);
  const [cours, setCours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    coursId: '',
    titre: '',
    date: '',
    duree: 30,
    coefficient: 1,
    questions: 3
  });

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadData = async () => {
    try {
      const [coursRes, interRes] = await Promise.all([
        api.get(`/api/cours/professeur/${user.id}`),
        api.get(`/api/evaluations/interrogations/${user.id}`)
      ]);
      setCours(coursRes.data);
      setInterrogations(interRes.data);
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
      await api.post('/api/evaluations/interrogations', {
        ...form,
        professeurId: user.id
      });
      setMessage('✅ Interrogation créée avec succès');
      setShowForm(false);
      setForm({ coursId: '', titre: '', date: '', duree: 30, coefficient: 1, questions: 3 });
      loadData();
    } catch (err) {
      setMessage('❌ Erreur lors de la création');
    }
  };

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">📝 Interrogations</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '➕ Nouvelle interrogation'}
        </button>
      </div>

      {message && <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>{message}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Créer une interrogation</h3>
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
              <input type="number" value={form.duree} onChange={e => setForm({...form, duree: e.target.value})} min={5} max={180} />
            </div>
            <div className="form-group">
              <label>Coefficient</label>
              <input type="number" step="0.5" value={form.coefficient} onChange={e => setForm({...form, coefficient: e.target.value})} min={0.5} max={5} />
            </div>
            <div className="form-group">
              <label>Nombre de questions</label>
              <input type="number" value={form.questions} onChange={e => setForm({...form, questions: e.target.value})} min={1} max={30} />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>Créer</button>
          </form>
        </div>
      )}

      <div className="card">
        {interrogations.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucune interrogation planifiée</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Cours</th>
                <th>Date</th>
                <th>Durée</th>
                <th>Coeff.</th>
                <th>Questions</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {interrogations.map(i => (
                <tr key={i.id}>
                  <td style={{ fontWeight: 600 }}>{i.titre}</td>
                  <td>{i.coursCode}</td>
                  <td>{new Date(i.date).toLocaleDateString('fr-FR')}</td>
                  <td>{i.duree} min</td>
                  <td>{i.coefficient}</td>
                  <td>{i.questions}</td>
                  <td>
                    <span className={`badge ${i.statut === 'TERMINE' ? 'badge-success' : i.statut === 'EN_COURS' ? 'badge-warning' : 'badge-neutral'}`}>
                      {i.statut}
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