// src/pages/chef/ChefNotes.jsx
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function ChefNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const departementId = user?.departementId;

  useEffect(() => {
    if (departementId) chargerDonnees();
    else setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departementId]);

  const chargerDonnees = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/notes/departement/${departementId}/a-valider`);
      setNotes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError('Erreur lors du chargement des notes');
      toast.error(err.response?.data?.erreur || err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const valider = async (noteId) => {
    try {
      await api.patch(`/api/notes/${noteId}/valider`);
      toast.success('Note validée avec succès');
      chargerDonnees();
    } catch (err) {
      toast.error(err.response?.data?.erreur || err.response?.data?.message || 'Erreur lors de la validation');
    }
  };

  if (loading) return <div className="page"><div className="loading">Chargement...</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📝 Notes à valider</h1>
          <p className="page-sub">{notes.length} note(s) en attente de validation</p>
        </div>
        <button className="btn-outline" onClick={chargerDonnees}>🔄 Rafraîchir</button>
      </div>

      {error && <div className="alert alert-erreur">{error}</div>}

      <div className="card">
        {notes.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 32, color: '#666' }}>Aucune note à valider.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Cours</th>
                <th>Note</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {notes.map(n => (
                <tr key={n.id}>
                  <td>{n.inscription?.etudiant?.nomComplet || n.inscriptionId || '—'}</td>
                  <td>{n.cours?.titre || n.cours?.nom || '—'}</td>
                  <td><strong>{n.noteFinale ?? n.note ?? '—'}</strong></td>
                  <td>{n.dateSaisie || n.date || '—'}</td>
                  <td>
                    <button className="btn-success" onClick={() => valider(n.id)}>Valider</button>
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
