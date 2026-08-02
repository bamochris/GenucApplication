// src/pages/admin/deliberation/GestionRecours.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../Dashboard.css';

export default function GestionRecours() {
  const { user } = useAuth();
  const [recours, setRecours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('TOUS');
  const [selectedRecours, setSelectedRecours] = useState(null);
  const [decisionModal, setDecisionModal] = useState({ open: false, recoursId: null, decision: null, commentaire: '' });

  const loadRecours = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/recours', {
        params: { universiteId: user.universiteId }
      });
      setRecours(res.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des recours');
    } finally {
      setLoading(false);
    }
  }, [user.universiteId]);

  useEffect(() => {
    loadRecours();
  }, [loadRecours]);

  const handleTraiter = (recoursId, decision) =>
    setDecisionModal({ open: true, recoursId, decision, commentaire: '' });

  const confirmerDecision = async () => {
    const { recoursId, decision, commentaire } = decisionModal;
    setDecisionModal({ open: false, recoursId: null, decision: null, commentaire: '' });
    try {
      await api.put(`/api/admin/recours/${recoursId}`, { statut: decision, commentaire });
      setMessage(`✅ Recours ${decision === 'ACCEPTE' ? 'accepté' : 'refusé'} avec succès`);
      loadRecours();
      setSelectedRecours(null);
    } catch (err) {
      setError('Erreur lors du traitement du recours');
    }
  };

  const getTypeLabel = (type) => {
    const map = {
      'ERREUR_NOTE': 'Erreur de note',
      'ERREUR_MATRICULE': 'Erreur de matricule',
      'COURS_MANQUANT': 'Cours manquant',
      'CONTESTATION': 'Contestation',
      'AUTRE': 'Autre'
    };
    return map[type] || type;
  };

  const getStatutBadge = (statut) => {
    const map = {
      'SOUMIS': 'badge-warning',
      'EN_COURS': 'badge-info',
      'ACCEPTE': 'badge-success',
      'REFUSE': 'badge-danger'
    };
    return map[statut] || 'badge-neutral';
  };

  const getStatutLabel = (statut) => {
    const map = {
      'SOUMIS': '⏳ Soumis',
      'EN_COURS': '🔄 En cours',
      'ACCEPTE': '✅ Accepté',
      'REFUSE': '❌ Refusé'
    };
    return map[statut] || statut;
  };

  const filteredRecours = filter === 'TOUS' 
    ? recours 
    : recours.filter(r => r.statut === filter);

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Gestion des Recours</h1>
          <p className="page-sub">Traitement des demandes de contestation</p>
        </div>
        <button className="btn-outline" onClick={loadRecours}>
          🔄 Actualiser
        </button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {/* Filtres */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontWeight: 600 }}>Filtrer :</label>
          {['TOUS', 'SOUMIS', 'EN_COURS', 'ACCEPTE', 'REFUSE'].map(s => (
            <button
              key={s}
              className={filter === s ? 'btn-primary' : 'btn-outline'}
              style={{ fontSize: 12, padding: '4px 14px' }}
              onClick={() => setFilter(s)}
            >
              {s === 'TOUS' ? 'Tous' : getStatutLabel(s)}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
            {filteredRecours.length} recours
          </span>
        </div>
      </div>

      {/* Liste */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Étudiant</th>
                <th>Matricule</th>
                <th>Type</th>
                <th>Cours</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecours.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>Aucun recours</td></tr>
              ) : (
                filteredRecours.map(r => (
                  <tr key={r.id}>
                    <td>{new Date(r.dateSoumission).toLocaleDateString('fr-FR')}</td>
                    <td>{r.etudiant?.nom} {r.etudiant?.prenom}</td>
                    <td><span className="uni-code">{r.etudiant?.matricule}</span></td>
                    <td>{getTypeLabel(r.type)}</td>
                    <td>{r.cours?.nom || '-'}</td>
                    <td>
                      <span className={`badge ${getStatutBadge(r.statut)}`}>
                        {getStatutLabel(r.statut)}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-outline" 
                        style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => setSelectedRecours(selectedRecours === r.id ? null : r.id)} // ★ correction du nom
                      >
                        {selectedRecours === r.id ? 'Masquer' : '👁️ Voir'}
                      </button>
                      {r.statut === 'SOUMIS' && (
                        <>
                          <button 
                            className="btn-success" 
                            style={{ fontSize: 11, padding: '3px 8px', marginLeft: 4 }}
                            onClick={() => handleTraiter(r.id, 'ACCEPTE')}
                          >
                            ✅ Accepter
                          </button>
                          <button 
                            className="btn-danger" 
                            style={{ fontSize: 11, padding: '3px 8px', marginLeft: 4 }}
                            onClick={() => handleTraiter(r.id, 'REFUSE')}
                          >
                            ❌ Refuser
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Détail du recours sélectionné */}
      {selectedRecours && (
        <div className="card" style={{ marginTop: 16 }}>
          <h4 className="card-title">📄 Détail du recours #{selectedRecours}</h4>
          {recours.filter(r => r.id === selectedRecours).map(r => (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><strong>Étudiant :</strong> {r.etudiant?.nom} {r.etudiant?.prenom} ({r.etudiant?.matricule})</div>
              <div><strong>Type :</strong> {getTypeLabel(r.type)}</div>
              <div style={{ gridColumn: '1 / span 2' }}>
                <strong>Description :</strong><br />
                <p style={{ background: 'var(--bg-secondary)', padding: 10, borderRadius: 4 }}>{r.description}</p>
              </div>
              {r.pieceJointe && (
                <div style={{ gridColumn: '1 / span 2' }}>
                  <a href={r.pieceJointe} target="_blank" rel="noopener noreferrer">
                    📎 Voir la pièce jointe
                  </a>
                </div>
              )}
              {r.reponse && (
                <div style={{ gridColumn: '1 / span 2' }}>
                  <strong>Réponse :</strong><br />
                  <p style={{ background: 'var(--bg-secondary)', padding: 10, borderRadius: 4 }}>{r.reponse}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {decisionModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 420, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, color: 'var(--text-primary)' }}>
              {decisionModal.decision === 'ACCEPTE' ? '✅ Accepter le recours' : '❌ Refuser le recours'}
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)' }}>Commentaire (optionnel)</p>
            <textarea
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Expliquer la décision..."
              value={decisionModal.commentaire}
              onChange={e => setDecisionModal(m => ({ ...m, commentaire: e.target.value }))}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setDecisionModal({ open: false, recoursId: null, decision: null, commentaire: '' })}>Annuler</button>
              <button
                className={decisionModal.decision === 'ACCEPTE' ? 'btn-success' : 'btn-danger'}
                onClick={confirmerDecision}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}