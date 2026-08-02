// src/pages/professeur/bibliotheque/Bibliotheque.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function Bibliotheque() {
  const { user } = useAuth();
  const [ouvrages, setOuvrages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [filterCategorie, setFilterCategorie] = useState('');

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.universiteId]);

  const loadData = async () => {
    try {
      const [ouvRes, catRes] = await Promise.all([
        api.get(`/api/bibliotheque/ouvrages/${user.universiteId}`),
        api.get(`/api/bibliotheque/categories/${user.universiteId}`)
      ]);
      setOuvrages(ouvRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = ouvrages.filter(o => {
    const matchSearch = o.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        o.auteur?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategorie = filterCategorie ? o.categorie === filterCategorie : true;
    return matchSearch && matchCategorie;
  });

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">📖 Bibliothèque universitaire</h2>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 Rechercher un ouvrage..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          />
          <select
            value={filterCategorie}
            onChange={e => setFilterCategorie(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          >
            <option value="">Toutes catégories</option>
            {categories.map(c => <option key={c.id} value={c.nom}>{c.nom}</option>)}
          </select>
          <button className="btn-outline" onClick={() => { setSearchTerm(''); setFilterCategorie(''); }}>
            Réinitialiser
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucun ouvrage trouvé</p>
          </div>
        ) : (
          filtered.map(o => (
            <div key={o.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="badge badge-neutral" style={{ fontSize: 10 }}>{o.typeOuvrage}</span>
                  <h3 style={{ margin: '8px 0' }}>{o.titre}</h3>
                </div>
                <span className={`badge ${o.quantiteDisponible > 0 ? 'badge-success' : 'badge-danger'}`}>
                  {o.quantiteDisponible > 0 ? `Disponible (${o.quantiteDisponible})` : 'Indisponible'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.auteur} • {o.editeur || ''}</div>
              {o.categorie && <div style={{ fontSize: 11, color: '#185FA5', marginTop: 4 }}>📂 {o.categorie}</div>}
              {o.resume && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>{o.resume.substring(0, 100)}...</p>}
              {/* La réservation d'ouvrages est réservée aux étudiants et au personnel de bibliothèque
                  côté backend (BibliothequeController /api/bibliotheque/reserver) : les professeurs
                  consultent le catalogue mais ne peuvent pas réserver depuis ce portail. */}
              <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                {o.quantiteDisponible > 0 ? 'Consultable à la bibliothèque' : 'Indisponible actuellement'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}