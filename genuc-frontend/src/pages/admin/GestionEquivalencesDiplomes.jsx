// src/pages/admin/GestionEquivalencesDiplomes.jsx
/**
 * 🎓 Commission académique — Équivalences de diplômes
 * Examen et décision des demandes de reconnaissance de diplômes soumises par les étudiants.
 */
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import equivalenceDiplomeService from '../../services/equivalenceDiplomeService';
import toast from 'react-hot-toast';
import '../Dashboard.css';

const STATUT_STYLES = {
  EN_ATTENTE: { label: '⏳ En attente', className: 'badge-warning' },
  EN_EXAMEN: { label: '🔄 En examen', className: 'badge-info' },
  APPROUVEE: { label: '✅ Approuvée', className: 'badge-success' },
  APPROUVEE_PARTIELLE: { label: '✅ Approuvée (partielle)', className: 'badge-success' },
  REJETEE: { label: '❌ Rejetée', className: 'badge-danger' },
};

export default function GestionEquivalencesDiplomes() {
  const { user } = useAuth();
  const universiteId = user?.universiteId;

  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState('TOUS');

  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [decisionForm, setDecisionForm] = useState({ statut: 'EN_EXAMEN', decisionMotif: '', niveauAccorde: '' });
  const [saving, setSaving] = useState(false);

  const charger = useCallback(async () => {
    if (!universiteId) return;
    setLoading(true);
    try {
      const { data } = await equivalenceDiplomeService.listerPourCommission(
        universiteId, filtreStatut !== 'TOUS' ? filtreStatut : undefined
      );
      setDemandes(data || []);
    } catch (err) {
      toast.error('Erreur lors du chargement des demandes d\'équivalence');
    } finally {
      setLoading(false);
    }
  }, [universiteId, filtreStatut]);

  useEffect(() => {
    charger();
  }, [charger]);

  const ouvrirDetail = (demande) => {
    setSelected(demande);
    setDecisionForm({
      statut: demande.statut === 'EN_ATTENTE' ? 'EN_EXAMEN' : demande.statut,
      decisionMotif: demande.decisionMotif || '',
      niveauAccorde: demande.niveauAccorde || demande.niveauDemande || '',
    });
    setShowDetail(true);
  };

  const handleDecision = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await equivalenceDiplomeService.traiter(selected.id, decisionForm);
      toast.success('Décision enregistrée');
      setShowDetail(false);
      charger();
    } catch (err) {
      toast.error(err.response?.data?.erreur || 'Erreur lors de l\'enregistrement de la décision');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>🎓 Équivalences de diplômes</h1>
        <p className="text-muted">Commission académique — examen des demandes de reconnaissance de diplômes</p>
      </div>

      <div className="dashboard-toolbar" style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <select
          className="form-control"
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          style={{ width: '220px' }}
        >
          <option value="TOUS">Tous les statuts</option>
          {Object.entries(STATUT_STYLES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement des demandes...</p>
        </div>
      ) : demandes.length === 0 ? (
        <div className="empty-state text-center py-5">
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎓</div>
          <h3>Aucune demande d'équivalence</h3>
          <p className="text-muted">Les demandes soumises par les étudiants apparaîtront ici</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Établissement d'origine</th>
                <th>Diplôme</th>
                <th>Niveau demandé</th>
                <th>Soumis le</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {demandes.map((d) => {
                const statut = STATUT_STYLES[d.statut] || { label: d.statut, className: 'badge-neutral' };
                return (
                  <tr key={d.id}>
                    <td>{d.etudiantPrenom} {d.etudiantNom} {d.etudiantMatricule ? `(${d.etudiantMatricule})` : ''}</td>
                    <td>{d.etablissementOrigine} — {d.paysOrigine}</td>
                    <td>{d.diplomeObtenu}</td>
                    <td>{d.niveauDemande || '-'}</td>
                    <td>{d.dateSoumission ? new Date(d.dateSoumission).toLocaleDateString('fr-FR') : '-'}</td>
                    <td><span className={`badge ${statut.className}`}>{statut.label}</span></td>
                    <td>
                      <button className="btn btn-sm btn-info" onClick={() => ouvrirDetail(d)} title="Examiner">
                        👁️ Examiner
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── MODAL DÉTAIL / DÉCISION ─── */}
      {showDetail && selected && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1050
        }}>
          <div className="modal-content" style={{
            background: 'var(--bg-card)', borderRadius: '12px',
            padding: '24px', maxWidth: '600px', width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>🎓 Demande d'équivalence</h2>
              <button className="btn-close" onClick={() => setShowDetail(false)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Étudiant</label>
                <p>{selected.etudiantPrenom} {selected.etudiantNom}</p>
              </div>
              <div>
                <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Matricule</label>
                <p>{selected.etudiantMatricule || '-'}</p>
              </div>
              <div>
                <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Établissement d'origine</label>
                <p>{selected.etablissementOrigine} ({selected.paysOrigine})</p>
              </div>
              <div>
                <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Diplôme obtenu</label>
                <p>{selected.diplomeObtenu} {selected.anneeObtention ? `(${selected.anneeObtention})` : ''}</p>
              </div>
              <div>
                <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Niveau obtenu</label>
                <p>{selected.niveauObtenu || '-'}</p>
              </div>
              <div>
                <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Niveau demandé</label>
                <p>{selected.niveauDemande || '-'}</p>
              </div>
              <div>
                <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Domaine d'étude</label>
                <p>{selected.domaineEtude || '-'}</p>
              </div>
              <div>
                <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Filière demandée</label>
                <p>{selected.filiereDemandeeNom || '-'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              {selected.diplomeDocumentUrl && (
                <a className="btn btn-secondary" href={selected.diplomeDocumentUrl} target="_blank" rel="noreferrer">
                  📄 Voir le diplôme
                </a>
              )}
              {selected.releveNotesDocumentUrl && (
                <a className="btn btn-secondary" href={selected.releveNotesDocumentUrl} target="_blank" rel="noreferrer">
                  📄 Voir le relevé de notes
                </a>
              )}
            </div>

            <form onSubmit={handleDecision}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Décision</label>
                <select
                  className="form-control"
                  value={decisionForm.statut}
                  onChange={(e) => setDecisionForm({ ...decisionForm, statut: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                >
                  <option value="EN_EXAMEN">🔄 Mettre en examen</option>
                  <option value="APPROUVEE">✅ Approuver intégralement</option>
                  <option value="APPROUVEE_PARTIELLE">✅ Approuver partiellement</option>
                  <option value="REJETEE">❌ Rejeter</option>
                </select>
              </div>

              {(decisionForm.statut === 'APPROUVEE' || decisionForm.statut === 'APPROUVEE_PARTIELLE') && (
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Niveau accordé</label>
                  <select
                    className="form-control"
                    value={decisionForm.niveauAccorde}
                    onChange={(e) => setDecisionForm({ ...decisionForm, niveauAccorde: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                  >
                    <option value="">-- Sélectionner --</option>
                    {['L1', 'L2', 'L3', 'M1', 'M2', 'D1', 'D2', 'D3'].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Motif / commentaire de la commission</label>
                <textarea
                  className="form-control"
                  value={decisionForm.decisionMotif}
                  onChange={(e) => setDecisionForm({ ...decisionForm, decisionMotif: e.target.value })}
                  rows={3}
                  placeholder="Justification de la décision..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDetail(false)}>
                  Fermer
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement...' : '💾 Enregistrer la décision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
