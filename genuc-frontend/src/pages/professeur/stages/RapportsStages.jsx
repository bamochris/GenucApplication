// src/pages/professeur/stages/RapportsStages.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function RapportsStages() {
  const { user } = useAuth();
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState('');
  const [filterPromotion, setFilterPromotion] = useState('');
  const [validerModal, setValiderModal] = useState({ open: false, id: null });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadData = async () => {
    try {
      const res = await api.get(`/api/stages/rapports/${user.id}`);
      setRapports(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const promotions = [...new Set(rapports.map(r => r.promotion).filter(Boolean))];

  const filtered = rapports.filter(r => {
    const matchStatut = filterStatut ? r.statut === filterStatut : true;
    const matchPromo = filterPromotion ? r.promotion === filterPromotion : true;
    return matchStatut && matchPromo;
  });

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">📊 Rapports de stage</h2>
      </div>

      {message && (
        <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>
          {message}
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontWeight: 600 }}>Statut :</label>
          <select
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          >
            <option value="">Tous</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="VALIDE">Validé</option>
          </select>
          <label style={{ fontWeight: 600 }}>Promotion :</label>
          <select
            value={filterPromotion}
            onChange={e => setFilterPromotion(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          >
            <option value="">Toutes</option>
            {promotions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button className="btn-outline" onClick={() => { setFilterStatut(''); setFilterPromotion(''); }}>
            Réinitialiser
          </button>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
            {filtered.length} rapports
          </span>
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucun rapport trouvé</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Entreprise</th>
                <th>Promotion</th>
                <th>Soumis le</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>{r.etudiant}</td>
                  <td>{r.entreprise}</td>
                  <td>{r.promotion}</td>
                  <td>{new Date(r.dateSoumission).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <span className={`badge ${r.statut === 'VALIDE' ? 'badge-success' : 'badge-warning'}`}>
                      {r.statut}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <a href={r.url} target="_blank" rel="noreferrer" className="btn-outline" style={{ fontSize: 10, padding: '3px 8px', textDecoration: 'none' }}>
                        📥 PDF
                      </a>
                      {r.statut === 'EN_ATTENTE' && (
                        <button
                          className="btn-success"
                          style={{ fontSize: 10, padding: '3px 8px' }}
                          onClick={() => setValiderModal({ open: true, id: r.id })}
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

      {validerModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 360, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>✅ Valider le rapport</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>Valider ce rapport de stage ?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setValiderModal({ open: false, id: null })}>Annuler</button>
              <button className="btn-success" onClick={async () => {
                const id = validerModal.id;
                setValiderModal({ open: false, id: null });
                try {
                  await api.patch(`/api/stages/rapports/${id}/valider`, { valideParId: user.id });
                  setMessage('✅ Rapport validé');
                  loadData();
                } catch { setMessage('❌ Erreur'); }
              }}>Valider</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
