// src/pages/professeur/recherche/Projets.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function Projets() {
  const { user } = useAuth();
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    titre: '',
    description: '',
    financement: '',
    montant: '',
    dateDebut: '',
    dateFin: '',
    statut: 'EN_COURS'
  });

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadData = async () => {
    try {
      const res = await api.get(`/api/recherche/projets/${user.id}`);
      setProjets(res.data);
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
      await api.post('/api/recherche/projets', {
        ...form,
        professeurId: user.id,
        professeurNom: user.nomComplet,
        montant: parseFloat(form.montant) || 0
      });
      setMessage('✅ Projet de recherche ajouté');
      setShowForm(false);
      setForm({
        titre: '',
        description: '',
        financement: '',
        montant: '',
        dateDebut: '',
        dateFin: '',
        statut: 'EN_COURS'
      });
      loadData();
    } catch (err) {
      setMessage('❌ Erreur lors de l\'ajout');
    }
  };

  const getStatutBadge = (statut) => {
    const map = {
      'EN_COURS': 'badge-warning',
      'TERMINE': 'badge-success',
      'SUSPENDU': 'badge-danger'
    };
    return map[statut] || 'badge-neutral';
  };

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">🔬 Projets de recherche</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '➕ Nouveau projet'}
        </button>
      </div>

      {message && <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>{message}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Nouveau projet de recherche</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Titre du projet *</label>
              <input value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="3" />
            </div>
            <div className="form-group">
              <label>Source de financement</label>
              <input value={form.financement} onChange={e => setForm({...form, financement: e.target.value})} placeholder="ANR, EU, etc." />
            </div>
            <div className="form-group">
              <label>Montant (USD)</label>
              <input type="number" step="0.01" value={form.montant} onChange={e => setForm({...form, montant: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Date de début</label>
              <input type="date" value={form.dateDebut} onChange={e => setForm({...form, dateDebut: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Date de fin</label>
              <input type="date" value={form.dateFin} onChange={e => setForm({...form, dateFin: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Statut</label>
              <select value={form.statut} onChange={e => setForm({...form, statut: e.target.value})}>
                <option value="EN_COURS">En cours</option>
                <option value="TERMINE">Terminé</option>
                <option value="SUSPENDU">Suspendu</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>Ajouter</button>
          </form>
        </div>
      )}

      <div className="card">
        {projets.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucun projet de recherche</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Financement</th>
                <th>Montant</th>
                <th>Période</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {projets.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.titre}</td>
                  <td>{p.financement || '-'}</td>
                  <td>{p.montant ? p.montant + ' USD' : '-'}</td>
                  <td>{p.dateDebut ? new Date(p.dateDebut).toLocaleDateString('fr-FR') : '-'} → {p.dateFin ? new Date(p.dateFin).toLocaleDateString('fr-FR') : '-'}</td>
                  <td>
                    <span className={`badge ${getStatutBadge(p.statut)}`}>
                      {p.statut}
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