// src/pages/professeur/tfc/Encadrements.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function Encadrements() {
  const { user } = useAuth();
  const [encadrements, setEncadrements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    etudiantId: '',
    sujet: '',
    type: 'MEMOIRE',
    annee: '2024-2025'
  });
  const [etudiants, setEtudiants] = useState([]);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadData = async () => {
    try {
      const [encRes, etuRes] = await Promise.all([
        api.get(`/api/tfc/encadrements/${user.id}`),
        api.get(`/api/professeur/etudiants/disponibles/${user.id}`)
      ]);
      setEncadrements(encRes.data);
      setEtudiants(etuRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.post('/api/tfc/encadrements', {
        ...form,
        professeurId: user.id,
        professeurNom: user.nomComplet
      });
      setMessage('✅ Encadrement créé avec succès');
      setShowForm(false);
      setForm({ etudiantId: '', sujet: '', type: 'MEMOIRE', annee: '2024-2025' });
      loadData();
    } catch (err) {
      setMessage('❌ Erreur lors de la création');
    }
  };

  const handleUpdateStatut = async (id, statut) => {
    try {
      await api.patch(`/api/tfc/encadrements/${id}/statut`, { statut });
      setMessage(`✅ Statut mis à jour : ${statut}`);
      loadData();
    } catch (err) {
      setMessage('❌ Erreur lors de la mise à jour');
    }
  };

  const getStatutBadge = (statut) => {
    const map = {
      'EN_COURS': 'badge-warning',
      'SOUTENU': 'badge-success',
      'VALIDE': 'badge-success',
      'REJETE': 'badge-danger'
    };
    return map[statut] || 'badge-neutral';
  };

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">🎓 Encadrement TFC / Mémoire</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '➕ Nouvel encadrement'}
        </button>
      </div>

      {message && <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>{message}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Ajouter un encadrement</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Étudiant *</label>
              <select value={form.etudiantId} onChange={e => setForm({...form, etudiantId: e.target.value})} required>
                <option value="">-- Sélectionner --</option>
                {etudiants.map(e => (
                  <option key={e.id} value={e.id}>{e.matricule} - {e.prenom} {e.nom}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Type *</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} required>
                <option value="MEMOIRE">Mémoire</option>
                <option value="TFC">TFC</option>
                <option value="THESE">Thèse</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Sujet *</label>
              <input value={form.sujet} onChange={e => setForm({...form, sujet: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Année académique</label>
              <select value={form.annee} onChange={e => setForm({...form, annee: e.target.value})}>
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>Créer</button>
          </form>
        </div>
      )}

      <div className="card">
        {encadrements.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucun encadrement en cours</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Sujet</th>
                <th>Type</th>
                <th>Année</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {encadrements.map(e => (
                <tr key={e.id}>
                  <td>{e.etudiant}</td>
                  <td style={{ fontWeight: 600 }}>{e.sujet}</td>
                  <td>{e.type}</td>
                  <td>{e.annee}</td>
                  <td>
                    <span className={`badge ${getStatutBadge(e.statut)}`}>
                      {e.statut}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {e.statut === 'EN_COURS' && (
                        <>
                          <button
                            className="btn-success"
                            style={{ fontSize: 10, padding: '3px 8px' }}
                            onClick={() => handleUpdateStatut(e.id, 'SOUTENU')}
                          >
                            Soutenu
                          </button>
                          <button
                            className="btn-danger"
                            style={{ fontSize: 10, padding: '3px 8px' }}
                            onClick={() => handleUpdateStatut(e.id, 'REJETE')}
                          >
                            Rejeter
                          </button>
                        </>
                      )}
                      {e.statut === 'SOUTENU' && (
                        <button
                          className="btn-primary"
                          style={{ fontSize: 10, padding: '3px 8px' }}
                          onClick={() => handleUpdateStatut(e.id, 'VALIDE')}
                        >
                          Valider
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
    </div>
  );
}