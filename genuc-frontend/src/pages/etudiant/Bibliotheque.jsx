// src/pages/etudiant/Bibliotheque.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function Bibliotheque() {
  const { user } = useAuth();
  const [ouvrages, setOuvrages] = useState([]);
  const [filteredOuvrages, setFilteredOuvrages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [filterDisponibilite, setFilterDisponibilite] = useState('');
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedOuvrage, setSelectedOuvrage] = useState(null);
  const [reservationLoading, setReservationLoading] = useState(false);

  const universiteId = user?.universiteId;
  const etudiantId = user?.inscriptionId ? user.inscriptionId : null;

  useEffect(() => {
    if (universiteId) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [universiteId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ouvragesRes, categoriesRes] = await Promise.all([
        api.get(`/api/bibliotheque/avancee/ouvrages/${universiteId}`),
        api.get(`/api/bibliotheque/avancee/categories/${universiteId}`)
      ]);
      setOuvrages(ouvragesRes.data || []);
      setFilteredOuvrages(ouvragesRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (err) {
      setError('Erreur chargement de la bibliothèque');
    } finally {
      setLoading(false);
    }
  };

  // Recherche et filtres
  useEffect(() => {
    let result = ouvrages;

    // Recherche par terme
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(o =>
        o.titre?.toLowerCase().includes(term) ||
        o.auteur?.toLowerCase().includes(term) ||
        o.isbn?.toLowerCase().includes(term)
      );
    }

    // Filtre par type
    if (filterType) {
      result = result.filter(o => o.typeOuvrage === filterType);
    }

    // Filtre par catégorie
    if (filterCategorie) {
      result = result.filter(o => o.categorie === filterCategorie);
    }

    // Filtre par disponibilité
    if (filterDisponibilite === 'disponible') {
      result = result.filter(o => o.quantiteDisponible > 0);
    } else if (filterDisponibilite === 'indisponible') {
      result = result.filter(o => o.quantiteDisponible <= 0);
    }

    setFilteredOuvrages(result);
  }, [searchTerm, filterType, filterCategorie, filterDisponibilite, ouvrages]);

  const handleReserver = async (ouvrageId) => {
    if (!etudiantId) {
      setError('Vous devez être connecté en tant qu\'étudiant pour réserver.');
      return;
    }
    setReservationLoading(true);
    try {
      await api.post('/api/bibliotheque/avancee/reserver', {
        livreId: ouvrageId,
        etudiantId: parseInt(etudiantId)
      });
      setMessage('✅ Livre réservé avec succès ! Vous avez 48h pour le retirer.');
      setShowReservationModal(false);
      setSelectedOuvrage(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la réservation');
    } finally {
      setReservationLoading(false);
    }
  };

  const getTypeLabel = (type) => {
    const map = {
      'LIVRE': '📖 Livre',
      'REVUE': '📰 Revue',
      'MEMOIRE': '📄 Mémoire',
      'THESE': '📑 Thèse'
    };
    return map[type] || type;
  };

  const getDisponibiliteBadge = (quantite) => {
    if (quantite > 0) {
      return <span className="badge badge-success">Disponible ({quantite})</span>;
    }
    return <span className="badge badge-danger">Indisponible</span>;
  };

  if (loading) return <div className="loading">Chargement de la bibliothèque...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📚 Bibliothèque universitaire</h1>
          <p className="page-sub">Recherchez, réservez et consultez les ouvrages disponibles</p>
        </div>
        <button className="btn-outline" onClick={loadData} title="Rafraîchir">
          🔄
        </button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      {/* Barre de recherche et filtres */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
          <div className="form-group">
            <label>🔍 Rechercher</label>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Titre, auteur, ISBN..."
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
          <div className="form-group">
            <label>Disponibilité</label>
            <select value={filterDisponibilite} onChange={e => setFilterDisponibilite(e.target.value)}>
              <option value="">Tous</option>
              <option value="disponible">Disponibles</option>
              <option value="indisponible">Indisponibles</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / span 3' }}>
            <label>Catégorie</label>
            <select value={filterCategorie} onChange={e => setFilterCategorie(e.target.value)}>
              <option value="">Toutes les catégories</option>
              {categories.map(c => (
                <option key={c.id} value={c.nom}>{c.nom}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {filteredOuvrages.length} ouvrage(s) trouvé(s)
          </span>
          {(searchTerm || filterType || filterCategorie || filterDisponibilite) && (
            <button
              className="btn-outline"
              style={{ fontSize: 11 }}
              onClick={() => {
                setSearchTerm('');
                setFilterType('');
                setFilterCategorie('');
                setFilterDisponibilite('');
              }}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {/* Liste des ouvrages */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {filteredOuvrages.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <p style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
              Aucun ouvrage trouvé.
              <br />
              <span style={{ fontSize: 12 }}>Essayez de modifier vos critères de recherche.</span>
            </p>
          </div>
        ) : (
          filteredOuvrages.map(ouvrage => (
            <div key={ouvrage.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="badge badge-neutral" style={{ fontSize: 10 }}>
                    {getTypeLabel(ouvrage.typeOuvrage)}
                  </span>
                  <h3 style={{ margin: '8px 0' }}>{ouvrage.titre}</h3>
                </div>
                {getDisponibiliteBadge(ouvrage.quantiteDisponible)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {ouvrage.auteur} • {ouvrage.editeur || ''} {ouvrage.anneePublication ? `• ${ouvrage.anneePublication}` : ''}
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
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1 }}
                  disabled={ouvrage.quantiteDisponible <= 0}
                  onClick={() => {
                    setSelectedOuvrage(ouvrage);
                    setShowReservationModal(true);
                  }}
                >
                  {ouvrage.quantiteDisponible > 0 ? '📥 Réserver' : 'Indisponible'}
                </button>
                <Link
                  to={`/etudiant/bibliotheque/detail/${ouvrage.id}`}
                  className="btn-outline"
                  style={{ textDecoration: 'none' }}
                >
                  📖
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de confirmation de réservation */}
      {showReservationModal && selectedOuvrage && (
        <div className="modal-overlay" onClick={() => { setShowReservationModal(false); setSelectedOuvrage(null); }} style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: 450, width: '100%' }} onClick={e => e.stopPropagation()}>
            <h3 className="card-title">📥 Confirmer la réservation</h3>
            <div style={{ marginBottom: 16 }}>
              <p><strong>Titre :</strong> {selectedOuvrage.titre}</p>
              <p><strong>Auteur :</strong> {selectedOuvrage.auteur}</p>
              <p><strong>Disponibilité :</strong> {selectedOuvrage.quantiteDisponible} exemplaire(s)</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                ⏳ La réservation est valable 48h. Passé ce délai, elle sera annulée.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={() => handleReserver(selectedOuvrage.id)}
                disabled={reservationLoading}
              >
                {reservationLoading ? '⏳...' : '✅ Confirmer'}
              </button>
              <button
                className="btn-outline"
                onClick={() => { setShowReservationModal(false); setSelectedOuvrage(null); }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}