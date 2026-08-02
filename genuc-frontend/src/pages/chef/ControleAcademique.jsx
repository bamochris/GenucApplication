// src/pages/chef/ControleAcademique.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import CoursStatusBadge from '../../components/deliberation/CoursStatusBadge';
import '../admin/Dashboard.css'; // ou '../Dashboard.css' selon votre structure

export default function ControleAcademique() {
  const { user } = useAuth();
  const [cours, setCours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('TOUS');
  const [actionModal, setActionModal] = useState({ open: false, coursId: null, type: null, text: '' });
  const [validationModal, setValidationModal] = useState({ open: false, coursId: null });

  const loadCours = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/controle/cours', {
        params: { departementId: user?.departementId }
      });
      setCours(res.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des cours');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.departementId]);

  useEffect(() => {
    loadCours();
  }, [loadCours]);

  const handleValider = (coursId) => setValidationModal({ open: true, coursId });

  const confirmerValidation = async () => {
    const { coursId } = validationModal;
    setValidationModal({ open: false, coursId: null });
    try {
      await api.post(`/api/controle/cours/${coursId}/valider`);
      setMessage('✅ Cours validé avec succès');
      loadCours();
    } catch (err) {
      setError('Erreur lors de la validation');
    }
  };

  const handleRetourner = (coursId) => setActionModal({ open: true, coursId, type: 'retourner', text: '' });
  const handleDemanderCorrection = (coursId) => setActionModal({ open: true, coursId, type: 'correction', text: '' });

  const confirmerAction = async () => {
    if (!actionModal.text.trim()) { setError('Veuillez saisir un texte.'); return; }
    const { coursId, type, text } = actionModal;
    setActionModal({ open: false, coursId: null, type: null, text: '' });
    try {
      if (type === 'retourner') {
        await api.post(`/api/controle/cours/${coursId}/retourner`, { motif: text });
        setMessage('✅ Cours retourné au professeur');
      } else {
        await api.post(`/api/controle/cours/${coursId}/correction`, { commentaire: text });
        setMessage('✅ Demande de correction envoyée');
      }
      loadCours();
    } catch (err) {
      setError(type === 'retourner' ? 'Erreur lors du retour' : 'Erreur lors de la demande');
    }
  };

  const coursFiltres = filter === 'TOUS' 
    ? cours 
    : cours.filter(c => c.statut === filter);

  const stats = {
    total: cours.length,
    recus: cours.filter(c => c.statut === 'RECU').length,
    enAttente: cours.filter(c => c.statut === 'EN_ATTENTE').length,
    valides: cours.filter(c => c.statut === 'VALIDE').length,
    retournes: cours.filter(c => c.statut === 'RETOURNE').length,
  };

  const anomalies = cours.filter(c => c.anomalies && c.anomalies.length > 0);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement des cours...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Contrôle Académique</h1>
          <p className="page-sub">Gestion des notes par Chef de Département</p>
        </div>
        <button className="btn-outline" onClick={loadCours}>
          🔄 Actualiser
        </button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {/* Cartes statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.total}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total cours</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: 'center', borderLeft: '4px solid #17a2b8' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#17a2b8' }}>{stats.recus}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Reçus</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: 'center', borderLeft: '4px solid #ffc107' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#ffc107' }}>{stats.enAttente}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>En attente</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: 'center', borderLeft: '4px solid #28a745' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#28a745' }}>{stats.valides}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Validés</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: 'center', borderLeft: '4px solid #dc3545' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#dc3545' }}>{stats.retournes}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Retournés</div>
        </div>
      </div>

      {/* Alertes anomalies */}
      {anomalies.length > 0 && (
        <div className="card" style={{ marginBottom: 16, borderLeft: '4px solid #dc3545', background: 'rgba(220, 53, 69, 0.08)' }}>
          <div style={{ padding: 12 }}>
            <strong style={{ color: '#dc3545' }}>⚠ {anomalies.length} cours présentent des anomalies :</strong>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              {anomalies.map(c => (
                <li key={c.id}>
                  <strong>{c.nom}</strong> – {c.anomalies.join(', ')}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontWeight: 600 }}>Filtrer :</label>
          {['TOUS', 'RECU', 'EN_ATTENTE', 'VALIDE', 'RETOURNE'].map(s => (
            <button
              key={s}
              className={filter === s ? 'btn-primary' : 'btn-outline'}
              style={{ fontSize: 12, padding: '4px 14px' }}
              onClick={() => setFilter(s)}
            >
              {s === 'TOUS' ? 'Tous' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau des cours */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Cours</th>
                <th>Professeur</th>
                <th>Promotion</th>
                <th>Effectif</th>
                <th>Statut</th>
                <th>Moyenne</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coursFiltres.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>Aucun cours trouvé</td></tr>
              ) : (
                coursFiltres.map(c => (
                  <tr key={c.id}>
                    <td><span className="uni-code">{c.code}</span></td>
                    <td>{c.nom}</td>
                    <td>{c.professeur}</td>
                    <td>{c.promotion}</td>
                    <td>{c.effectif}</td>
                    <td><CoursStatusBadge statut={c.statut} /></td>
                    <td>{c.moyenneGenerale ? c.moyenneGenerale.toFixed(2) : '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button 
                          className="btn-outline" 
                          style={{ fontSize: 10, padding: '3px 8px' }}
                          onClick={() => window.open(`/professeur/mes-cours/${c.id}`, '_blank', 'noopener,noreferrer')}
                        >
                          👁️
                        </button>
                        {c.statut === 'RECU' && (
                          <button 
                            className="btn-success" 
                            style={{ fontSize: 10, padding: '3px 8px' }}
                            onClick={() => handleValider(c.id)}
                          >
                            ✅ Valider
                          </button>
                        )}
                        {(c.statut === 'RECU' || c.statut === 'EN_ATTENTE') && (
                          <>
                            <button 
                              className="btn-danger" 
                              style={{ fontSize: 10, padding: '3px 8px' }}
                              onClick={() => handleRetourner(c.id)}
                            >
                              ↩️ Retourner
                            </button>
                            <button 
                              className="btn-warning" 
                              style={{ fontSize: 10, padding: '3px 8px' }}
                              onClick={() => handleDemanderCorrection(c.id)}
                            >
                              ✏️ Correction
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {validationModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 400, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>✅ Valider le cours</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>Valider ce cours ? Les notes seront verrouillées.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setValidationModal({ open: false, coursId: null })}>Annuler</button>
              <button className="btn-success" onClick={confirmerValidation}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {actionModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 420, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>
              {actionModal.type === 'retourner' ? '↩️ Motif du retour' : '✏️ Demande de correction'}
            </h3>
            <textarea
              rows={4}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
              placeholder={actionModal.type === 'retourner' ? 'Expliquez pourquoi le cours est retourné au professeur...' : 'Décrivez les corrections à apporter...'}
              value={actionModal.text}
              onChange={e => setActionModal(m => ({ ...m, text: e.target.value }))}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setActionModal({ open: false, coursId: null, type: null, text: '' })}>Annuler</button>
              <button className="btn-primary" onClick={confirmerAction}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}