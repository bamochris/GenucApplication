import { useEffect, useState } from 'react';
import api from '../../api/axios';
import '../Dashboard.css';

export default function AnneeAcademiqueGestion() {
  const [annees, setAnnees] = useState([]);
  const [form, setForm] = useState({ libelle: '', active: true });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    chargerAnnees();
  }, []);

  const chargerAnnees = async () => {
    try {
      // /toutes : inclut les années désactivées, sinon impossible de les réactiver
      const res = await api.get('/api/annees-academiques/toutes');
      setAnnees(res.data);
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        setErreur("Accès refusé : vous n'avez pas les droits pour voir cette page.");
      } else {
        setErreur("Erreur lors du chargement des années académiques.");
      }
    } finally {
      setLoading(false);
    }
  };

  const ajouter = async (e) => {
    e.preventDefault();
    setMessage('');
    setErreur('');
    setSubmitting(true);
    try {
      await api.post('/api/annees-academiques', form);
      setMessage('✅ Année académique ajoutée avec succès.');
      setForm({ libelle: '', active: true });
      await chargerAnnees();
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        setErreur("Accès refusé : vous n'avez pas les droits pour ajouter une année.");
      } else if (status === 400) {
        setErreur(err.response?.data?.message || "Données invalides.");
      } else if (status === 409) {
        setErreur("Cette année académique existe déjà.");
      } else {
        setErreur("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id, actif) => {
    setMessage('');
    setErreur('');
    try {
      await api.patch(`/api/annees-academiques/${id}`, { active: !actif });
      setMessage(`✅ Année ${actif ? 'désactivée' : 'activée'} avec succès.`);
      await chargerAnnees();
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        setErreur("Accès refusé : vous n'avez pas les droits pour modifier une année.");
      } else {
        setErreur("Erreur lors de la modification.");
      }
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="page">
      <h1 className="page-title">📅 Gestion des années académiques</h1>

      {/* Messages de feedback */}
      {message && (
        <div className="alert alert-success" onClick={() => setMessage('')}>
          {message}
        </div>
      )}
      {erreur && (
        <div className="alert alert-error" onClick={() => setErreur('')}>
          {erreur}
        </div>
      )}

      {/* Formulaire d'ajout */}
      <div className="card">
        <h2 className="card-title">Ajouter une année</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Libellé (ex: 2025-2026)</label>
            <input
              value={form.libelle}
              onChange={e => setForm({ ...form, libelle: e.target.value })}
              placeholder="2025-2026"
              required
            />
          </div>
          <div className="form-group">
            <label>Active</label>
            <input
              type="checkbox"
              checked={form.active}
              onChange={e => setForm({ ...form, active: e.target.checked })}
            />
          </div>
          <button
            className="btn-primary"
            onClick={ajouter}
            disabled={submitting || !form.libelle.trim()}
          >
            {submitting ? 'Ajout en cours...' : 'Ajouter'}
          </button>
        </div>
      </div>

      {/* Liste des années */}
      <div className="card">
        <h2 className="card-title">Liste des années</h2>
        {annees.length === 0 ? (
          <p className="empty-state">Aucune année académique enregistrée.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Libellé</th>
                <th>Active</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {annees.map(a => (
                <tr key={a.id}>
                  <td>{a.libelle}</td>
                  <td>{a.active ? '✅ Oui' : '❌ Non'}</td>
                  <td>
                    <button
                      className="btn-outline"
                      onClick={() => toggleActive(a.id, a.active)}
                    >
                      {a.active ? 'Désactiver' : 'Activer'}
                    </button>
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