// src/pages/admin/deliberation/SalleJury.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import deliberationService from '../../../services/deliberationService';
import StatutBadge from '../../../components/deliberation/StatutBadge';
import SignatureWorkflow from '../../../components/deliberation/SignatureWorkflow';
import '../../Dashboard.css';

export default function SalleJury() {
  const { user } = useAuth();
  const [data, setData] = useState({});
  const [participants, setParticipants] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showSignature, setShowSignature] = useState(false);
  const [statutModal, setStatutModal] = useState({ open: false, etudiantId: null, nouveauStatut: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const stats = await deliberationService.getStats(user.universiteId, '2025-2026');
      setData(stats);
      
      // Participants (à adapter si endpoint existe)
      setParticipants([
        { id: 1, nom: 'Prof. Jean Mwamba', role: 'DOYEN', present: true },
        { id: 2, nom: 'Dr. Marie Kazadi', role: 'CHEF_DEPARTEMENT', present: true },
        { id: 3, nom: 'Prof. Paul Tshibangu', role: 'MEMBRE', present: false },
      ]);
      
      // Historique (à adapter)
      setHistorique([
        { id: 1, date: new Date(), utilisateur: 'Admin', action: 'MODIFICATION', etudiant: '2026-001', commentaire: 'Statut modifié' },
      ]);
    } catch (err) {
      setError('Erreur lors du chargement des données du jury');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.universiteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleModifierStatut = (etudiantId, nouveauStatut) => setStatutModal({ open: true, etudiantId, nouveauStatut });

  const confirmerModification = async () => {
    const { etudiantId, nouveauStatut } = statutModal;
    setStatutModal({ open: false, etudiantId: null, nouveauStatut: '' });
    try {
      await deliberationService.tenueJury(etudiantId, { decision: nouveauStatut });
      setMessage('✅ Statut modifié avec succès');
      loadData();
    } catch (err) {
      setError('Erreur lors de la modification');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de la salle de jury...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏛️ Salle de Jury Numérique</h1>
          <p className="page-sub">Délibération officielle - Session 2025-2026</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" onClick={loadData}>
            🔄 Actualiser
          </button>
          <button className="btn-primary" onClick={() => setShowSignature(!showSignature)}>
            {showSignature ? '📋 Voir résultats' : '✍️ Signatures'}
          </button>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {/* Participants */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card-title">👥 Participants au Jury</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {participants.map(p => (
            <div key={p.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg-secondary)',
              padding: '8px 14px',
              borderRadius: 20,
              border: '1px solid #e9ecef'
            }}>
              <span style={{ fontSize: 18 }}>{p.role === 'DOYEN' ? '👨‍🏫' : p.role === 'CHEF_DEPARTEMENT' ? '👨‍🎓' : '👤'}</span>
              <span style={{ fontWeight: 500 }}>{p.nom}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.role}</span>
              {p.present && <span style={{ color: '#28a745', fontSize: 12 }}>✅ Présent</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Statistiques jury */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div className="card" style={{ padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{data.total || 0}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Effectif</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: 'center', borderLeft: '4px solid #28a745' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#28a745' }}>{data.admis || data.pa || 0}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PA</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: 'center', borderLeft: '4px solid #fd7e14' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#fd7e14' }}>{data.pd || 0}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PD</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: 'center', borderLeft: '4px solid #dc3545' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#dc3545' }}>{data.redoublants || data.pp || 0}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PP</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: 'center', borderLeft: '4px solid #007bff' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#007bff' }}>{data.cj || 0}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>CJ</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: 'center', borderLeft: '4px solid #6f42c1' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#6f42c1' }}>{data.tauxReussite || 0}%</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Taux réussite</div>
        </div>
      </div>

      {/* Workflow de signatures (toggle) */}
      {showSignature && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 className="card-title">✍️ Signatures officielles</h3>
          <SignatureWorkflow 
            deliberationId={1} 
            onComplete={() => {
              setMessage('✅ Signature complétée');
              loadData();
            }}
          />
        </div>
      )}

      {/* Tableau des résultats */}
      {!showSignature && (
        <div className="card">
          <h3 className="card-title">📋 Détail des délibérations</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Matricule</th>
                  <th>Nom</th>
                  <th>Moyenne</th>
                  <th>Crédits</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data.etudiants || []).length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>Aucun étudiant en délibération</td></tr>
                ) : (
                  data.etudiants?.map(s => (
                    <tr key={s.id}>
                      <td><span className="uni-code">{s.matricule}</span></td>
                      <td>{s.nom} {s.prenom}</td>
                      <td><strong>{s.moyenne?.toFixed(2) || '-'}</strong></td>
                      <td>{s.credits || 0}</td>
                      <td><StatutBadge statut={s.statut || s.decision} /></td>
                      <td>
                        <select
                          value={s.statut || s.decision}
                          onChange={e => handleModifierStatut(s.id, e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: 12 }}
                        >
                          <option value="PA">PA</option>
                          <option value="PD">PD</option>
                          <option value="PP">PP</option>
                          <option value="CJ">CJ</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {statutModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 380, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>Modifier le statut</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>
              Modifier le statut de l'étudiant en <strong>{statutModal.nouveauStatut}</strong> ?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setStatutModal({ open: false, etudiantId: null, nouveauStatut: '' })}>Annuler</button>
              <button className="btn-primary" onClick={confirmerModification}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* Historique des modifications */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 className="card-title">🕐 Historique des modifications</h3>
        {historique.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune modification enregistrée</p>
        ) : (
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Utilisateur</th>
                  <th>Action</th>
                  <th>Étudiant</th>
                  <th>Commentaire</th>
                </tr>
              </thead>
              <tbody>
                {historique.map(h => (
                  <tr key={h.id}>
                    <td>{new Date(h.date).toLocaleDateString('fr-FR')} {new Date(h.date).toLocaleTimeString('fr-FR')}</td>
                    <td>{h.utilisateur}</td>
                    <td>{h.action}</td>
                    <td>{h.etudiant}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{h.commentaire || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}