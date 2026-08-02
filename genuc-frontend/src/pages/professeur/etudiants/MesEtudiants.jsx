// src/pages/professeur/etudiants/MesEtudiants.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function MesEtudiants() {
  const { user } = useAuth();
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPromotion, setFilterPromotion] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadEtudiants();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadEtudiants = async () => {
    try {
      const res = await api.get(`/api/professeur/etudiants/disponibles/${user.id}`);
      setEtudiants(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Impossible de charger la liste des étudiants');
    } finally {
      setLoading(false);
    }
  };

  const filtered = etudiants.filter(e => {
    const matchName = e.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      e.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      e.matricule?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPromo = filterPromotion ? e.promotion === filterPromotion : true;
    return matchName && matchPromo;
  });

  const promotions = [...new Set(etudiants.map(e => e.promotion).filter(Boolean))];

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">👨‍🎓 Mes étudiants</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{etudiants.length} étudiants</span>
        </div>
      </div>

      {error && <div className="alert-erreur">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 Rechercher par nom, matricule..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          />
          <select
            value={filterPromotion}
            onChange={e => setFilterPromotion(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          >
            <option value="">Toutes promotions</option>
            {promotions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button className="btn-outline" onClick={() => { setSearchTerm(''); setFilterPromotion(''); }}>
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucun étudiant trouvé</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Matricule</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Promotion</th>
                <th>Filière</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td className="uni-code">{e.matricule}</td>
                  <td>{e.nom}</td>
                  <td>{e.prenom}</td>
                  <td>{e.promotion}</td>
                  <td>{e.filiere}</td>
                  <td>{e.nbNotes || 0}</td>
                  <td>
                    <Link to={`/professeur/etudiants/${e.id}`} className="btn-outline" style={{ fontSize: 11, textDecoration: 'none' }}>
                      📋 Voir
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