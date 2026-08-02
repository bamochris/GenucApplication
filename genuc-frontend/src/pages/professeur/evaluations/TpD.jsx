// src/pages/professeur/evaluations/TpD.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function TpD() {
  const { user } = useAuth();
  const [tps, setTps] = useState([]);
  const [cours, setCours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    coursId: '',
    titre: '',
    date: '',
    coefficient: 1,
    nbGroupes: 1
  });

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadData = async () => {
    try {
      const [coursRes, tpRes] = await Promise.all([
        api.get(`/api/cours/professeur/${user.id}`),
        api.get(`/api/evaluations/tp/${user.id}`)
      ]);
      setCours(coursRes.data);
      setTps(tpRes.data);
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
      await api.post('/api/evaluations/tp', {
        ...form,
        professeurId: user.id
      });
      setMessage('✅ TP créé avec succès');
      setShowForm(false);
      setForm({ coursId: '', titre: '', date: '', coefficient: 1, nbGroupes: 1 });
      loadData();
    } catch (err) {
      setMessage('❌ Erreur lors de la création');
    }
  };

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">🧪 Travaux Pratiques / TD</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '➕ Nouveau TP'}
        </button>
      </div>

      {message && <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>{message}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Créer un TP / TD</h3>
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
              <label>Coefficient</label>
              <input type="number" step="0.5" value={form.coefficient} onChange={e => setForm({...form, coefficient: e.target.value})} min={0.5} max={5} />
            </div>
            <div className="form-group">
              <label>Nombre de groupes</label>
              <input type="number" value={form.nbGroupes} onChange={e => setForm({...form, nbGroupes: e.target.value})} min={1} max={20} />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>Créer</button>
          </form>
        </div>
      )}

      <div className="card">
        {tps.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucun TP planifié</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Cours</th>
                <th>Date</th>
                <th>Coeff.</th>
                <th>Groupes</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {tps.map(tp => (
                <tr key={tp.id}>
                  <td style={{ fontWeight: 600 }}>{tp.titre}</td>
                  <td>{tp.coursCode}</td>
                  <td>{new Date(tp.date).toLocaleDateString('fr-FR')}</td>
                  <td>{tp.coefficient}</td>
                  <td>{tp.nbGroupes}</td>
                  <td>
                    <span className={`badge ${tp.statut === 'TERMINE' ? 'badge-success' : tp.statut === 'EN_COURS' ? 'badge-warning' : 'badge-neutral'}`}>
                      {tp.statut}
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