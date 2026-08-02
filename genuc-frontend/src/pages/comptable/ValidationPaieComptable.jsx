// src/pages/comptable/ValidationPaieComptable.jsx
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../../pages/Dashboard.css';

export default function ValidationPaieComptable() {
  const { user } = useAuth();
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [actionEnCours, setActionEnCours] = useState(null);
  const [rejetModal, setRejetModal] = useState({ open: false, id: null, motif: '' });
  const [payerModal, setPayerModal] = useState({ open: false, id: null });

  const universiteId = user?.universiteId;

  // Définition de la fonction avec useCallback pour éviter les recréations
  const chargerBulletins = useCallback(async () => {
    if (!universiteId) {
      setError('Aucune université associée à votre compte.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/api/rh/paie/en-attente-validation?universiteId=${universiteId}`);
      setBulletins(res.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des bulletins à payer.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [universiteId]);

  useEffect(() => {
    chargerBulletins();
  }, [chargerBulletins]); // ✅ dépendance maintenant stable

  const marquerPaye = (id) => setPayerModal({ open: true, id });

  const confirmerPaiement = async () => {
    const id = payerModal.id;
    setPayerModal({ open: false, id: null });
    setActionEnCours(id);
    try {
      await api.patch(`/api/rh/paie/${id}/payer`, {
        comptableId: user.id,
        datePaiement: new Date().toISOString().split('T')[0]
      });
      setMessage('✅ Bulletin marqué comme payé.');
      chargerBulletins();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors du paiement.');
    } finally {
      setActionEnCours(null);
    }
  };

  const rejeterPaiement = (id) => setRejetModal({ open: true, id, motif: '' });

  const confirmerRejet = async () => {
    if (!rejetModal.motif.trim()) { setError('Veuillez saisir un motif.'); return; }
    const id = rejetModal.id;
    setRejetModal({ open: false, id: null, motif: '' });
    setActionEnCours(id);
    try {
      await api.post(`/api/rh/paie/${id}/rejeter`, { comptableId: user.id, motif: rejetModal.motif });
      setMessage('❌ Paiement rejeté (retour en validation RH).');
      chargerBulletins();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors du rejet.');
    } finally {
      setActionEnCours(null);
    }
  };

  const telechargerPdf = async (id, numero) => {
    try {
      const response = await api.get(`/api/rh/paie/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bulletin_${numero || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erreur lors du téléchargement du PDF.');
    }
  };

  const getStatutBadge = (statut) => {
    const map = {
      'EN_ATTENTE': 'badge-warning',
      'VALIDE': 'badge-success',
      'REJETE': 'badge-danger',
      'PAYE': 'badge-success'
    };
    return map[statut] || 'badge-neutral';
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Chargement des bulletins à payer...</div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="page">
        <div className="alert-erreur">{error}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">💰 Validation comptable – Paiement des salaires</h1>
          <p className="page-sub">Validez et payez les bulletins approuvés par les RH</p>
        </div>
        <button className="btn-outline" onClick={chargerBulletins}>
          🔄 Rafraîchir
        </button>
      </div>

      {message && (
        <div className="alert-success" onClick={() => setMessage('')}>
          {message}
        </div>
      )}
      {error && (
        <div className="alert-erreur" onClick={() => setError('')}>
          {error}
        </div>
      )}

      <div className="card">
        <h2 className="card-title">
          📋 Bulletins à payer ({bulletins.length})
        </h2>

        {bulletins.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
            Aucun bulletin en attente de paiement.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° bulletin</th>
                  <th>Employé</th>
                  <th>Période</th>
                  <th>Net à payer</th>
                  <th>Statut RH</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bulletins.map((paie) => {
                  const id = paie.id;
                  const numero = paie.numeroBulletin;
                  const nom = paie.personnel?.prenom + ' ' + paie.personnel?.nom || 'Inconnu';
                  const mois = paie.mois;
                  const annee = paie.annee;
                  const net = paie.netAPayer;
                  const statut = paie.statut;

                  return (
                    <tr key={id}>
                      <td className="uni-code">{numero}</td>
                      <td>{nom}</td>
                      <td>{mois} {annee}</td>
                      <td>{net} USD</td>
                      <td>
                        <span className={`badge ${getStatutBadge(statut)}`}>
                          {statut?.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            className="btn-success"
                            style={{ fontSize: 11, padding: '4px 10px' }}
                            onClick={() => marquerPaye(id)}
                            disabled={actionEnCours === id}
                          >
                            {actionEnCours === id ? '⏳' : '💰 Payer'}
                          </button>
                          <button
                            className="btn-danger"
                            style={{ fontSize: 11, padding: '4px 10px' }}
                            onClick={() => rejeterPaiement(id)}
                            disabled={actionEnCours === id}
                          >
                            ❌ Rejeter
                          </button>
                          <button
                            className="btn-outline"
                            style={{ fontSize: 11, padding: '4px 10px' }}
                            onClick={() => telechargerPdf(id, numero)}
                          >
                            📥 PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {bulletins.length > 0 && (
        <div className="card" style={{ marginTop: 20, background: 'rgba(24,95,165,0.12)' }}>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card" style={{ background: 'transparent', boxShadow: 'none', padding: '8px' }}>
              <div className="stat-value" style={{ color: '#185FA5' }}>
                {bulletins.reduce((sum, p) => sum + (p.netAPayer || 0), 0).toLocaleString()} USD
              </div>
              <div className="stat-label">Total à payer</div>
            </div>
            <div className="stat-card" style={{ background: 'transparent', boxShadow: 'none', padding: '8px' }}>
              <div className="stat-value">{bulletins.length}</div>
              <div className="stat-label">Nombre de bulletins</div>
            </div>
            <div className="stat-card" style={{ background: 'transparent', boxShadow: 'none', padding: '8px' }}>
              <div className="stat-value">
                {bulletins.filter(p => p.statut === 'VALIDE').length}
              </div>
              <div className="stat-label">Validés par RH</div>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 20, background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13 }}>
          <span>💰 <strong>Payer</strong> : valide définitivement le paiement (irréversible).</span>
          <span>❌ <strong>Rejeter</strong> : renvoie le bulletin aux RH pour correction.</span>
          <span>📥 <strong>PDF</strong> : visualise ou télécharge le bulletin.</span>
        </div>
      </div>

      {payerModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 380, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>💰 Confirmer le paiement</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>
              Cette action est irréversible. Le bulletin sera marqué comme payé.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setPayerModal({ open: false, id: null })}>Annuler</button>
              <button className="btn-success" onClick={confirmerPaiement}>Confirmer le paiement</button>
            </div>
          </div>
        </div>
      )}

      {rejetModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 400, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>❌ Motif du rejet</h3>
            <textarea
              rows={4}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Expliquez la raison du rejet..."
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