// src/pages/professeur/tfc/Sujets.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function Sujets() {
  const { user } = useAuth();
  const [sujets, setSujets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    titre: '',
    description: '',
    domaine: '',
    niveau: 'L3'
  });

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadData = async () => {
    try {
      const res = await api.get(`/api/tfc/sujets/${user.id}`);
      setSujets(res.data);
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
      await api.post('/api/tfc/sujets', {
        ...form,
        professeurId: user.id,
        professeurNom: user.nomComplet
      });
      setMessage('✅ Sujet proposé avec succès');
      setShowForm(false);
      setForm({ titre: '', description: '', domaine: '', niveau: 'L3' });
      loadData();
    } catch (err) {
      setMessage('❌ Erreur lors de la proposition');
    }
  };

  const handleValider = async (id) => {
    try {
      await api.patch(`/api/tfc/sujets/${id}/valider`);
      setMessage('✅ Sujet validé');
      loadData();
    } catch (err) {
      setMessage('❌ Erreur lors de la validation');
    }
  };

  const getStatutBadge = (statut) => {
    const map = {
      'PROPOSE': 'badge-neutral',
      'VALIDE': 'badge-success',
      'REFUSE': 'badge-danger',
      'ATTRIBUE': 'badge-warning'
    };
    return map[statut] || 'badge-neutral';
  };

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">📝 Proposer un sujet de TFC/Mémoire</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '➕ Proposer un sujet'}
        </button>
      </div>

      {message && <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>{message}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Nouveau sujet</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Titre *</label>
              <input value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Description *</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="3" required />
            </div>
            <div className="form-group">
              <label>Domaine</label>
              <input value={form.domaine} onChange={e => setForm({...form, domaine: e.target.value})} placeholder="Informatique, Droit, Médecine..." />
            </div>
            <div className="form-group">
              <label>Niveau cible</label>
              <select value={form.niveau} onChange={e => setForm({...form, niveau: e.target.value})}>
                <option value="L3">Licence 3</option>
                <option value="M1">Master 1</option>
                <option value="M2">Master 2</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>Proposer</button>
          </form>
        </div>
      )}

      <div className="card">
        {sujets.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucun sujet proposé</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Domaine</th>
                <th>Niveau</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sujets.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.titre}</td>
                  <td>{s.domaine || '-'}</td>
                  <td>{s.niveau}</td>
                  <td>
                    <span className={`badge ${getStatutBadge(s.statut)}`}>
                      {s.statut}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {s.statut === 'PROPOSE' && (
                        <button
                          className="btn-success"
                          style={{ fontSize: 10, padding: '3px 8px' }}
                          onClick={() => handleValider(s.id)}
                        >
                          Valider
                        </button>
                      )}
                    </div>
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