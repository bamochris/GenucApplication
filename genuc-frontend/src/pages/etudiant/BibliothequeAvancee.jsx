// src/pages/etudiant/BibliothequeAvancee.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function BibliothequeAvancee() {
  const { user } = useAuth();
  const [ouvrages, setOuvrages] = useState([]);
  const [, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategorie] = useState('');

  const universiteId = user?.universiteId;
  const etudiantId = user?.inscriptionId;

  useEffect(() => {
    if (universiteId) loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [universiteId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ouvragesRes, categoriesRes] = await Promise.all([
        api.get(`/api/bibliotheque/avancee/ouvrages/${universiteId}`),
        api.get(`/api/bibliotheque/avancee/categories/${universiteId}`)
      ]);
      setOuvrages(ouvragesRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      setError('Erreur chargement de la bibliothèque');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadData();
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        motCle: searchTerm,
        ...(filterCategorie && { categorie: filterCategorie }),
        ...(filterType && { type: filterType }),
        universiteId: universiteId
      });
      const res = await api.get(`/api/bibliotheque/avancee/recherche?${params}`);
      setOuvrages(res.data);
    } catch (err) {
      setError('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const reserver = async (livreId) => {
    if (!etudiantId) {
      setError('Vous devez être connecté en tant qu\'étudiant');
      return;
    }
    try {
      await api.post('/api/bibliotheque/avancee/reserver', {
        livreId,
        etudiantId: parseInt(etudiantId)
      });
      setMessage('✅ Livre réservé avec succès');
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la réservation');
    }
  };

  if (loading) return <div className="loading">Chargement de la bibliothèque...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📚 Bibliothèque universitaire</h1>
          <p className="page-sub">Recherchez, réservez et empruntez des ouvrages</p>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
          <div className="form-group">
            <label>Rechercher</label>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Titre, auteur, ISBN..."
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">Tous</option>
              <option value="LIVRE">Livre</option>
              <option value="REVUE">Revue</option>
              <option value="MEMOIRE">Mémoire</option>
              <option value="THESE">Thèse</option>
            </select>
          </div>
          <button className="btn-primary" onClick={handleSearch} style={{ alignSelf: 'flex-end' }}>
            🔍 Rechercher
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {ouvrages.map(ouvrage => (
          <div key={ouvrage.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-neutral" style={{ fontSize: 10 }}>
                  {ouvrage.typeOuvrage}
                </span>
                <h3 style={{ margin: '8px 0' }}>{ouvrage.titre}</h3>
              </div>
              <span className={`badge ${ouvrage.quantiteDisponible > 0 ? 'badge-success' : 'badge-danger'}`}>
                {ouvrage.quantiteDisponible > 0 ? `Disponible (${ouvrage.quantiteDisponible})` : 'Indisponible'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {ouvrage.auteur} • {ouvrage.editeur || ''} • {ouvrage.anneePublication}
            </div>
            {ouvrage.categorie && (
              <div style={{ fontSize: 11, color: '#185FA5', marginTop: 4 }}>
                📂 {ouvrage.categorie}
              </div>
            )}
            {ouvrage.resume && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, flex: 1 }}>
                {ouvrage.resume.substring(0, 100)}...
              </p>
            )}
            <button
              className="btn-primary"
              style={{ marginTop: 12 }}
              disabled={ouvrage.quantiteDisponible <= 0}
              onClick={() => reserver(ouvrage.id)}
            >
              {ouvrage.quantiteDisponible > 0 ? '📥 Réserver' : 'Indisponible'}
            </button>
          </div>
        ))}
      </div>

      {ouvrages.length === 0 && (
        <div className="card">
          <p style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
            Aucun ouvrage trouvé.
          </p>
        </div>
      )}
    </div>
  );
}