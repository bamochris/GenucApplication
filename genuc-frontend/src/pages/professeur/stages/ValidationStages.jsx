// src/pages/professeur/stages/ValidationStages.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function ValidationStages() {
  const { user } = useAuth();
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [rejetModal, setRejetModal] = useState({ open: false, id: null, motif: '' });

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadData = async () => {
    try {
      const res = await api.get(`/api/stages/validation/${user.id}`);
      setStages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleValider = async (id) => {
    try {
      await api.patch(`/api/stages/${id}/valider`, { valideParId: user.id });
      setMessage('✅ Stage validé');
      loadData();
    } catch (err) {
      setMessage('❌ Erreur lors de la validation');
    }
  };

  const handleRejeter = (id) => setRejetModal({ open: true, id, motif: '' });

  const confirmerRejet = async () => {
    if (!rejetModal.motif.trim()) { setMessage('❌ Veuillez saisir un motif.'); return; }
    const id = rejetModal.id;
    setRejetModal({ open: false, id: null, motif: '' });
    try {
      await api.patch(`/api/stages/${id}/rejeter`, { motif: rejetModal.motif, valideParId: user.id });
      setMessage('❌ Stage rejeté');
      loadData();
    } catch (err) {
      setMessage('❌ Erreur lors du rejet');
    }
  };

  const filtered = filterStatut ? stages.filter(s => s.statut === filterStatut) : stages;

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">🏢 Validation des stages</h2>
      </div>

      {message && <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>{message}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 600 }}>Statut :</label>
          <select
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          >
            <option value="">Tous</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="VALIDE">Validé</option>
            <option value="REJETE">Rejeté</option>
          </select>
          <button className="btn-outline" onClick={() => setFilterStatut('')}>Réinitialiser</button>
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucun stage à valider</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Entreprise</th>
                <th>Période</th>
                <th>Durée</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>{s.etudiant}</td>
                  <td>{s.entreprise}</td>
                  <td>{new Date(s.dateDebut).toLocaleDateString('fr-FR')} → {new Date(s.dateFin).toLocaleDateString('fr-FR')}</td>
                  <td>{s.dureeSemaines} sem.</td>
                  <td>
                    <span className={`badge ${s.statut === 'VALIDE' ? 'badge-success' : s.statut === 'REJETE' ? 'badge-danger' : 'badge-warning'}`}>
                      {s.statut}
                    </span>
                  </td>
                  <td>
                    {s.statut === 'EN_ATTENTE' && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="btn-success"
                          style={{ fontSize: 10, padding: '3px 8px' }}
                          onClick={() => handleValider(s.id)}
                        >
                          Valider
                        </button>
                        <button
                          className="btn-danger"
                          style={{ fontSize: 10, padding: '3px 8px' }}
                          onClick={() => handleRejeter(s.id)}
                        >
                          Rejeter
                        </button>
                      </div>
                    )}
                    {s.statut === 'VALIDE' && (
                      <span style={{ color: 'var(--color-success-text)' }}>✅ Validé</span>
                    )}
                    {s.statut === 'REJETE' && (
                      <span style={{ color: 'var(--color-danger-text)', fontSize: 11 }}>{s.motifRejet || 'Rejeté'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rejetModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 400, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>❌ Motif du rejet</h3>
            <textarea
              rows={4}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Expliquez la raison du rejet du stage..."
              value={rejetModal.motif}
              onChange={e => setRejetModal(m => ({ ...m, motif: e.target.value }))}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setRejetModal({ open: false, id: null, motif: '' })}>Annuler</button>
              <button className="btn-danger" onClick={confirmerRejet}>Confirmer le rejet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}