// src/components/BibliothequeRecherche.jsx
import React, { useState } from 'react';

const BibliothequeRecherche = ({ onSearch, onReset, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [filterDisponibilite, setFilterDisponibilite] = useState('');
  const [categories] = useState([]);

  const handleSearch = () => {
    onSearch({ searchTerm, filterType, filterCategorie, filterDisponibilite });
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterCategorie('');
    setFilterDisponibilite('');
    onReset();
  };

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
        <div className="form-group">
          <label>🔍 Rechercher</label>
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
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button className="btn-primary" onClick={handleSearch} disabled={loading}>
          {loading ? '⏳ Recherche...' : '🔍 Rechercher'}
        </button>
        <button className="btn-outline" onClick={handleReset}>
          Réinitialiser
        </button>
      </div>
    </div>
  );
};

export default BibliothequeRecherche;