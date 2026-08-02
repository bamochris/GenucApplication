// src/pages/professeur/recherche/Laboratoires.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function Laboratoires() {
  const { user } = useAuth();
  const [laboratoires, setLaboratoires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    nom: '',
    description: '',
    domaine: '',
    responsable: '',
    email: '',
    telephone: '',
    capacite: '',
    equipements: '',
    statut: 'ACTIF'
  });

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadData = async () => {
    try {
      const res = await api.get(`/api/recherche/laboratoires/${user.id}`);
      setLaboratoires(res.data);
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
      await api.post('/api/recherche/laboratoires', {
        ...form,
        professeurId: user.id,
        professeurNom: user.nomComplet,
        capacite: parseInt(form.capacite) || 0
      });
      setMessage('✅ Laboratoire ajouté');
      setShowForm(false);
      setForm({
        nom: '',
        description: '',
        domaine: '',
        responsable: '',
        email: '',
        telephone: '',
        capacite: '',
        equipements: '',
        statut: 'ACTIF'
      });
      loadData();
    } catch (err) {
      setMessage('❌ Erreur lors de l\'ajout');
    }
  };

  const getStatutBadge = (statut) => {
    const map = {
      'ACTIF': 'badge-success',
      'INACTIF': 'badge-danger',
      'EN_CONSTRUCTION': 'badge-warning'
    };
    return map[statut] || 'badge-neutral';
  };

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">🧪 Laboratoires</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '➕ Nouveau laboratoire'}
        </button>
      </div>

      {message && <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>{message}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Nouveau laboratoire</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Nom du laboratoire *</label>
              <input value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="3" />
            </div>
            <div className="form-group">
              <label>Domaine de recherche</label>
              <input value={form.domaine} onChange={e => setForm({...form, domaine: e.target.value})} placeholder="Biologie, Physique, etc." />
            </div>
            <div className="form-group">
              <label>Responsable</label>
              <input value={form.responsable} onChange={e => setForm({...form, responsable: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Capacité (personnes)</label>
              <input type="number" value={form.capacite} onChange={e => setForm({...form, capacite: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Équipements</label>
              <input value={form.equipements} onChange={e => setForm({...form, equipements: e.target.value})} placeholder="Microscopes, ordinateurs..." />
            </div>
            <div className="form-group">
              <label>Statut</label>
              <select value={form.statut} onChange={e => setForm({...form, statut: e.target.value})}>
                <option value="ACTIF">Actif</option>
                <option value="INACTIF">Inactif</option>
                <option value="EN_CONSTRUCTION">En construction</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>Ajouter</button>
          </form>
        </div>
      )}

      <div className="card">
        {laboratoires.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucun laboratoire</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Domaine</th>
                <th>Responsable</th>
                <th>Capacité</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {laboratoires.map(l => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600 }}>{l.nom}</td>
                  <td>{l.domaine || '-'}</td>
                  <td>{l.responsable || '-'}</td>
                  <td>{l.capacite || '-'}</td>
                  <td>
                    <span className={`badge ${getStatutBadge(l.statut)}`}>
                      {l.statut}
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