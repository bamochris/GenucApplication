// src/pages/admin/GestionCartesAdmin.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function GestionCartesAdmin() {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState([]);
  const [selectedPromotion, setSelectedPromotion] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resultat, setResultat] = useState(null);

  const universiteId = user?.universiteId;

  useEffect(() => {
    if (universiteId) {
      api.get(`/api/promotions/universite/${universiteId}`)
        .then(res => setPromotions(res.data))
        .catch(() => setError('Erreur chargement des promotions'));
    }
  }, [universiteId]);

  const handleGenererLot = async () => {
    if (!selectedPromotion) {
      setError('Veuillez sélectionner une promotion');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    setResultat(null);

    try {
      const response = await api.post(`/api/carte-etudiant/promotion/${selectedPromotion}`);
      setResultat(response.data);
      setMessage('✅ Génération des cartes terminée !');
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  const telechargerCarte = async (matricule) => {
    // Rechercher l'inscription par matricule
    try {
      const insResponse = await api.get(`/api/inscriptions/matricule/${matricule}`);
      const inscriptionId = insResponse.data.id;
      const response = await api.get(`/api/carte-etudiant/${inscriptionId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `carte_${matricule}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erreur lors du téléchargement de la carte');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🪪 Gestion des cartes d'étudiant</h1>
          <p className="page-sub">Générez les cartes individuelles ou en lot</p>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      <div className="card">
        <h2 className="card-title">📦 Génération en lot</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Promotion</label>
            <select
              value={selectedPromotion}
              onChange={e => setSelectedPromotion(e.target.value)}
            >
              <option value="">-- Sélectionner une promotion --</option>
              {promotions.map(p => (
                <option key={p.id} value={p.id}>
                  {p.libelle} - {p.filiere?.nom}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn-primary"
            onClick={handleGenererLot}
            disabled={loading}
            style={{ alignSelf: 'flex-end' }}
          >
            {loading ? '⏳ Génération...' : '📦 Générer toutes les cartes'}
          </button>
        </div>

        {resultat && (
          <div style={{ marginTop: 16 }}>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#185FA5' }}>{resultat.total}</div>
                <div className="stat-label">Total étudiants</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--color-success-text)' }}>{resultat.reussites}</div>
                <div className="stat-label">Cartes générées</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--color-danger-text)' }}>{resultat.erreurs}</div>
                <div className="stat-label">Erreurs</div>
              </div>
            </div>

            {resultat.resultats?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h4>Détail par étudiant</h4>
                <table className="data-table" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>Matricule</th>
                      <th>Étudiant</th>
                      <th>Statut</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultat.resultats.map((r, idx) => (
                      <tr key={idx}>
                        <td>{r.matricule}</td>
                        <td>{r.nom}</td>
                        <td>
                          <span className={`badge ${r.statut === 'OK' ? 'badge-success' : 'badge-danger'}`}>
                            {r.statut}
                          </span>
                        </td>
                        <td>
                          {r.statut === 'OK' && (
                            <button
                              className="btn-outline"
                              style={{ fontSize: 11 }}
                              onClick={() => telechargerCarte(r.matricule)}
                            >
                              📥 Télécharger
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2 className="card-title">📋 Téléchargement individuel</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
          Saisissez un matricule pour télécharger la carte d'un étudiant spécifique.
        </p>
        <div className="form-grid">
          <div className="form-group">
            <label>Matricule</label>
            <input
              type="text"
              id="matriculeInput"
              placeholder="Ex: UNIKIN202600001"
            />
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              const matricule = document.getElementById('matriculeInput').value;
              if (matricule) telechargerCarte(matricule);
              else setError('Veuillez saisir un matricule');
            }}
            style={{ alignSelf: 'flex-end' }}
          >
            📥 Télécharger
          </button>
        </div>
      </div>
    </div>
  );
}