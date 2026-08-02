// src/pages/admin/UniversiteDetail.jsx
// Détail d'une université avec gestion des départements
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import '../Dashboard.css';

export default function UniversiteDetail() {
  const { id } = useParams();
  const [universite, setUniversite] = useState(null);
  const [departements, setDepartements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: '', code: '', type: 'DEPARTEMENT', description: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const chargerUniversite = async () => {
      try {
        const res = await api.get(`/api/universites/public/${id}`);
        setUniversite(res.data);
      } catch (err) {
        setError("Erreur chargement université");
      }
    };
    const chargerDepartements = async () => {
      try {
        const res = await api.get(`/api/universites/public/${id}/departements`);
        setDepartements(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setDepartements([]);
      } finally {
        setLoading(false);
      }
    };
    chargerUniversite();
    chargerDepartements();
  }, [id]);

  const ajouterDepartement = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post(`/api/universites/${id}/departements`, form);
      setMessage('Département ajouté avec succès');
      setShowForm(false);
      setForm({ nom: '', code: '', type: 'DEPARTEMENT', description: '' });
      const res = await api.get(`/api/universites/public/${id}/departements`);
      setDepartements(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.erreur || err.response?.data?.message || 'Erreur lors de l’ajout');
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (!universite) return <div className="alert-erreur">Université non trouvée</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">{universite.nom}</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '➕ Ajouter un département'}
        </button>
      </div>
      {message && <div className="alert-success">{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">Nouveau département</h2>
          <form onSubmit={ajouterDepartement} className="form-grid">
            <div className="form-group">
              <label>Nom *</label>
              <input value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Code *</label>
              <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="FACULTE">Faculté</option>
                <option value="DEPARTEMENT">Département</option>
                <option value="SECTION">Section</option>
                <option value="INSTITUT">Institut</option>
                <option value="ECOLE">École</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="3" />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>Enregistrer</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">Départements existants</h2>
        {departements.length === 0 ? (
          <p>Aucun département.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Code</th><th>Nom</th><th>Type</th><th>Filières</th></tr>
            </thead>
            <tbody>
              {departements.map(d => (
                <tr key={d.id}>
                  <td className="uni-code">{d.code}</td>
                  <td>{d.nom}</td>
                  <td>{d.type}</td>
                  <td>
                    <Link to={`/admin/departement/${d.id}/filieres`} className="btn-outline" style={{ fontSize: 11, textDecoration: 'none' }}>
                      Gérer filières
                    </Link>
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