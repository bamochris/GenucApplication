// src/components/common/ModulePage.jsx
// Gabarit des pages de module : en-tête, sélecteur d'université (superadmin)
// et onglets — chaque onglet rend son contenu avec l'université courante.
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './ModuleCrud.css';

export default function ModulePage({ titre, description, icone: Icone, accent = '#185FA5', onglets }) {
  const { user } = useAuth();
  const [universiteId, setUniversiteId] = useState(user?.universiteId || '');
  const [universites, setUniversites] = useState([]);
  const [onglet, setOnglet] = useState(onglets[0]?.cle);

  const estSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (estSuperAdmin) {
      api.get('/api/universites')
        .then((res) => setUniversites(Array.isArray(res.data) ? res.data : []))
        .catch(() => setUniversites([]));
    }
  }, [estSuperAdmin]);

  const actif = onglets.find((o) => o.cle === onglet) || onglets[0];

  return (
    <div className="mp-page">
      <header className="mp-header">
        <div className="mp-header-icon" style={{ color: accent, background: `${accent}1f` }}>
          <Icone />
        </div>
        <div>
          <h1>{titre}</h1>
          <p>{description}</p>
        </div>
      </header>

      {estSuperAdmin && (
        <div className="mp-carte">
          <label className="mp-selecteur">
            <span>Université</span>
            <select value={universiteId} onChange={(e) => setUniversiteId(e.target.value)}>
              <option value="">-- Sélectionner une université --</option>
              {universites.map((u) => <option key={u.id} value={u.id}>{u.nom}</option>)}
            </select>
          </label>
        </div>
      )}

      {onglets.length > 1 && (
        <div className="mp-onglets" role="tablist">
          {onglets.map((o) => (
            <button
              key={o.cle}
              type="button"
              role="tab"
              aria-selected={o.cle === onglet}
              className={`mp-onglet${o.cle === onglet ? ' mp-onglet-actif' : ''}`}
              onClick={() => setOnglet(o.cle)}
            >
              {o.libelle}
            </button>
          ))}
        </div>
      )}

      {universiteId ? (
        <div className="mp-carte">
          {actif.rendu(universiteId)}
        </div>
      ) : (
        <div className="mp-carte mc-vide">Sélectionnez une université pour gérer ce module.</div>
      )}
    </div>
  );
}
