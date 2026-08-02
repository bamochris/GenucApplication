// src/pages/Universites.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StructureUniversite from './admin/StructureUniversite';
import './Dashboard.css';

export default function Universites() {
  const { user } = useAuth();
  const [universites, setUniversites] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: '', code: '', ville: '', fraisBase: '', email: '' });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdminUni = user?.role === 'ADMIN_UNIVERSITE';

  const titrePage = isAdminUni ? 'Université' : 'Universités partenaires';
  const sousTitrePage = isAdminUni
    ? "Profil de votre établissement et structure interne."
    : 'Gestion des institutions et de leur structure interne.';

  // Fonction de chargement des universités (avec filtrage selon le rôle)
  const chargerUniversites = () => {
    setChargement(true);
    // Si SUPER_ADMIN, on utilise l'endpoint public (toutes les universités)
    // Sinon (ADMIN_UNIVERSITE), on utilise l'endpoint admin qui retourne uniquement son université
    const url = isSuperAdmin ? '/api/universites/public' : '/api/universites/admin';
    
    api.get(url)
      .then(r => {
        // La réponse peut être un tableau ou, pour /admin, une liste contenant une université
        const data = Array.isArray(r.data) ? r.data : [];
        setUniversites(data);
      })
      .catch(err => {
        // Annulation volontaire (requête GET dupliquée annulée par
        // l'intercepteur axios, ex. double montage StrictMode) : à ignorer,
        // la requête suivante fournira les données.
        if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
        console.error('Erreur chargement universités :', err);
        setUniversites([]);
      })
      .finally(() => setChargement(false));
  };

  // Chargement initial au montage du composant
  useEffect(() => {
    chargerUniversites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dépendance vide pour ne charger qu'une fois

  // Bascule du statut des inscriptions (seulement si l'utilisateur a le droit)
  const toggleInscriptions = (id) => {
    api.patch(`/api/universites/${id}/inscriptions`)
      .then(() => {
        chargerUniversites(); // Recharger la liste
        setIsError(false);
        setMessage('Statut des inscriptions mis à jour');
        setTimeout(() => setMessage(''), 3000);
      })
      .catch((error) => {
        const messageErreur = error.response?.data?.message || "Impossible de modifier le statut des inscriptions.";
        setIsError(true);
        setMessage('Erreur : ' + messageErreur);
        setTimeout(() => setMessage(''), 3000);
      });
  };

  // Création d'une nouvelle université (réservé SUPER_ADMIN)
  const creerUniversite = (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    const payload = { ...form, fraisBase: parseFloat(form.fraisBase) || 0 };
    
    api.post('/api/universites', payload)
      .then(() => {
        chargerUniversites();
        setShowForm(false);
        setForm({ nom: '', code: '', ville: '', fraisBase: '', email: '' });
        setIsError(false);
        setMessage('Université créée avec succès');
        setTimeout(() => setMessage(''), 3000);
      })
      .catch((error) => {
        const messageErreur = error.response?.data?.message || error.response?.data?.error || "Une erreur est survenue.";
        setIsError(true);
        setMessage('Erreur : ' + messageErreur);
        setTimeout(() => setMessage(''), 3000);
      });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{titrePage}</h1>
          <p className="page-sub">{sousTitrePage}</p>
        </div>
        {isSuperAdmin && (
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '➕ Ajouter une université'}
          </button>
        )}
      </div>

      {message && (
        <div className={isError ? 'alert-erreur' : 'alert-success'} onClick={() => setMessage('')}>
          {message}
        </div>
      )}

      {showForm && isSuperAdmin && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">Enregistrer une nouvelle université</h2>
          <form onSubmit={creerUniversite} className="form-grid">
            <div className="form-group">
              <label>Nom officiel</label>
              <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Code / Diminutif</label>
              <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Ville</label>
              <input value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Frais de base annuelle (USD)</label>
              <input type="number" value={form.fraisBase} onChange={e => setForm({ ...form, fraisBase: e.target.value })} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Contact Email (Secrétariat)</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>Sauvegarder l'institution</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">{isAdminUni ? 'Profil de l’établissement' : 'Établissements connectés'}</h2>
        {chargement ? (
          <p>Chargement...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom</th>
                <th>Ville</th>
                <th>Inscriptions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {universites.map(u => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.code}</strong>
                  </td>
                  <td>{u.nom}</td>
                  <td>{u.ville || '—'}</td>
                  <td>
                    <span className={`badge ${u.inscriptionsOuvertes ? 'badge-success' : 'badge-neutral'}`}>
                      {u.inscriptionsOuvertes ? 'Ouvertes' : 'Fermées'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link to={`/admin/universite/${u.id}`} className="btn-outline" style={{ fontSize: 11 }}>
                        Gérer
                      </Link>
                      {/* Afficher le bouton uniquement si l'utilisateur est SUPER_ADMIN ou ADMIN_UNIVERSITE de cette université */}
                      {(isSuperAdmin || (isAdminUni && u.id === user?.universiteId)) && (
                        <button
                          className="btn-outline"
                          style={{ fontSize: 11 }}
                          onClick={() => toggleInscriptions(u.id)}
                        >
                          {u.inscriptionsOuvertes ? 'Fermer' : 'Ouvrir'}
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

      {isAdminUni && <StructureUniversite />}
    </div>
  );
}