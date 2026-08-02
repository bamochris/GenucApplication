// src/pages/professeur/deliberation/Deliberation.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function Deliberation() {
  const { user } = useAuth();
  const [cours, setCours] = useState([]);
  const [selectedCours, setSelectedCours] = useState('');
  const [, setEtudiants] = useState([]);
  const [deliberations, setDeliberations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [annee, setAnnee] = useState('2024-2025');
  const [filterStatut, setFilterStatut] = useState('');
  const [decisionModal, setDecisionModal] = useState({ open: false, id: null, decision: null, commentaire: '' });
  const [publishModal, setPublishModal] = useState({ open: false, type: null, id: null });

  useEffect(() => {
    loadCours();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadCours = async () => {
    try {
      const res = await api.get(`/api/cours/professeur/${user.id}`);
      setCours(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const loadDeliberations = async (coursId) => {
    try {
      const res = await api.get(`/api/deliberations/cours/${coursId}/${annee}`);
      setDeliberations(res.data);
      // Extraire les étudiants uniques
      const uniqueEtudiants = res.data.map(d => d.etudiant);
      setEtudiants(uniqueEtudiants);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectCours = (e) => {
    const id = e.target.value;
    setSelectedCours(id);
    if (id) loadDeliberations(id);
    else {
      setDeliberations([]);
      setEtudiants([]);
    }
  };

  const handleValider = (id, decision) => setDecisionModal({ open: true, id, decision, commentaire: '' });

  const confirmerDecision = async () => {
    const { id, decision, commentaire } = decisionModal;
    setDecisionModal({ open: false, id: null, decision: null, commentaire: '' });
    try {
      await api.patch(`/api/deliberations/${id}`, { decision, commentaire, valideParId: user.id });
      setMessage(`✅ Décision "${decision}" enregistrée`);
      loadDeliberations(selectedCours);
    } catch (err) {
      setMessage("❌ Erreur lors de l'enregistrement");
    }
  };

  const handlePublier = (id) => setPublishModal({ open: true, type: 'single', id });
  const handlePublierTout = () => setPublishModal({ open: true, type: 'all', id: null });

  const confirmerPublication = async () => {
    const { type, id } = publishModal;
    setPublishModal({ open: false, type: null, id: null });
    try {
      if (type === 'single') {
        await api.patch(`/api/deliberations/${id}/publier`);
        setMessage('✅ Délibération publiée');
      } else {
        await api.post(`/api/deliberations/cours/${selectedCours}/${annee}/publier-tout`);
        setMessage('✅ Toutes les délibérations publiées');
      }
      loadDeliberations(selectedCours);
    } catch (err) {
      setMessage('❌ Erreur lors de la publication');
    }
  };

  const getDecisionColor = (decision) => {
    const colors = {
      'ADMIS': '#1D9E75',
      'ADMIS_RATTRAPAGE': '#ff9800',
      'REDOUBLE': '#cc0000',
      'EXCLU': '#cc0000',
      'DIPLOME': '#185FA5',
      'EN_ATTENTE': '#888'
    };
    return colors[decision] || '#888';
  };

  const getStatutBadge = (statut) => {
    const map = {
      'EN_PREPARATION': 'badge-neutral',
      'PRÊTE': 'badge-warning',
      'TENUE': 'badge-warning',
      'PUBLIEE': 'badge-success'
    };
    return map[statut] || 'badge-neutral';
  };

  const filtered = filterStatut
    ? deliberations.filter(d => d.decision === filterStatut)
    : deliberations;

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">🏆 Délibération</h2>
      </div>

      {message && <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>{message}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
            <label>Cours</label>
            <select
              value={selectedCours}
              onChange={handleSelectCours}
              required
            >
              <option value="">-- Sélectionner --</option>
              {cours.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.titre}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 150 }}>
            <label>Année académique</label>
            <select value={annee} onChange={e => setAnnee(e.target.value)}>
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 150 }}>
            <label>Filtrer par décision</label>
            <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
              <option value="">Tous</option>
              <option value="ADMIS">Admis</option>
              <option value="ADMIS_RATTRAPAGE">Rattrapage</option>
              <option value="REDOUBLE">Redoublement</option>
              <option value="DIPLOME">Diplôme</option>
              <option value="EN_ATTENTE">En attente</option>
            </select>
          </div>
          <button className="btn-outline" onClick={() => { setFilterStatut(''); }}>
            Réinitialiser
          </button>
          {selectedCours && deliberations.length > 0 && (
            <button className="btn-primary" onClick={handlePublierTout}>
              📢 Publier tout
            </button>
          )}
        </div>
      </div>

      {selectedCours && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="card-title" style={{ margin: 0 }}>
              Résultats - {deliberations.length} étudiants
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {filtered.length} affichés
            </span>
          </div>

          {filtered.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
              {deliberations.length === 0
                ? 'Aucune délibération pour ce cours. Utilisez "Préparer" pour générer les résultats.'
                : 'Aucun résultat ne correspond aux filtres.'}
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Matricule</th>
                  <th>Moyenne</th>
                  <th>Mention</th>
                  <th>Décision</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id}>
                    <td>{d.etudiant}</td>
                    <td className="uni-code">{d.matricule}</td>
                    <td style={{ fontWeight: 600 }}>{d.moyenneGenerale || '-'}/20</td>
                    <td>{d.mention || '-'}</td>
                    <td>
                      <span style={{
                        color: getDecisionColor(d.decision),
                        fontWeight: 700
                      }}>
                        {d.decision === 'ADMIS' ? '✅ Admis' :
                         d.decision === 'ADMIS_RATTRAPAGE' ? '📘 Rattrapage' :
                         d.decision === 'REDOUBLE' ? '🔴 Redouble' :
                         d.decision === 'DIPLOME' ? '🎓 Diplômé' :
                         d.decision === 'EXCLU' ? '❌ Exclu' : '⏳ En attente'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatutBadge(d.statut)}`}>
                        {d.statut}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {d.decision === 'EN_ATTENTE' && (
                          <>
                            <button
                              className="btn-success"
                              style={{ fontSize: 10, padding: '3px 8px' }}
                              onClick={() => handleValider(d.id, 'ADMIS')}
                            >
                              ✅ Admis
                            </button>
                            <button
                              className="btn-warning"
                              style={{ fontSize: 10, padding: '3px 8px', background: '#ff9800', color: 'white' }}
                              onClick={() => handleValider(d.id, 'ADMIS_RATTRAPAGE')}
                            >
                              📘 Rattrapage
                            </button>
                            <button
                              className="btn-danger"
                              style={{ fontSize: 10, padding: '3px 8px' }}
                              onClick={() => handleValider(d.id, 'REDOUBLE')}
                            >
                              🔴 Redouble
                            </button>
                            <button
                              className="btn-primary"
                              style={{ fontSize: 10, padding: '3px 8px', background: '#185FA5' }}
                              onClick={() => handleValider(d.id, 'DIPLOME')}
                            >
                              🎓 Diplôme
                            </button>
                          </>
                        )}
                        {d.statut === 'TENUE' && (
                          <button
                            className="btn-primary"
                            style={{ fontSize: 10, padding: '3px 8px' }}
                            onClick={() => handlePublier(d.id)}
                          >
                            📢 Publier
                          </button>
                        )}
                        {d.statut === 'PUBLIEE' && (
                          <span style={{ fontSize: 11, color: '#1D9E75' }}>✓ Publiée</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!selectedCours && (
        <div className="card">
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
            Sélectionnez un cours pour voir les délibérations.
          </p>
        </div>
      )}

      {publishModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 400, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>📢 Publier</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>
              {publishModal.type === 'single'
                ? 'Publier cette délibération ? L\'étudiant pourra la consulter.'
                : 'Publier toutes les délibérations de ce cours ?'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setPublishModal({ open: false, type: null, id: null })}>Annuler</button>
              <button className="btn-primary" onClick={confirmerPublication}>Publier</button>
            </div>
          </div>
        </div>
      )}

      {decisionModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 420, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, color: 'var(--text-primary)' }}>
              Décision : <span style={{ color: '#185FA5' }}>{decisionModal.decision}</span>
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)' }}>Commentaire (optionnel)</p>
            <textarea
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Ajouter une note sur la décision..."
              value={decisionModal.commentaire}
              onChange={e => setDecisionModal(m => ({ ...m, commentaire: e.target.value }))}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setDecisionModal({ open: false, id: null, decision: null, commentaire: '' })}>Annuler</button>
              <button className="btn-primary" onClick={confirmerDecision}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}