// src/pages/etudiant/EtudiantPaiements.jsx
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import informationBancaireService from '../../services/informationBancaireService';
import '../Dashboard.css';

// Les deux canaux qui aboutissent sur le compte bancaire de l'établissement :
// le dépôt d'espèces au guichet et le virement de compte à compte. Tous deux
// demandent de choisir une banque, contrairement au Mobile Money et à la caisse.
const estCanalBancaire = (mode) => mode === 'VIREMENT' || mode === 'DEPOT_BANCAIRE';

export default function EtudiantPaiements() {
  const { user } = useAuth();
  const [situation, setSituation] = useState(null);
  const [paiements, setPaiements] = useState([]);
  const [echeanciers, setEcheanciers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    montant: '',
    modePaiement: 'MOBILE_MONEY',
    typePaiement: 'FRAIS_ACADEMIQUES',
    numeroTransaction: '',
    operateur: '',
    notesCaisse: ''
  });
  const [selectedEcheanceIds, setSelectedEcheanceIds] = useState([]);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [mobileForm, setMobileForm] = useState({ modePaiement: 'MOBILE_MONEY', operateur: 'M-Pesa', numeroTransaction: '' });
  const [mobileLoading, setMobileLoading] = useState(false);
  // Comptes bancaires publiés par l'établissement : l'étudiant peut régler hors caisse
  // et hors TachPay, au guichet de l'une de ces banques.
  const [banques, setBanques] = useState([]);

  const inscriptionId = user?.inscriptionId;

  // Modes de paiement ouverts par l'admin sur les frais encore dus.
  //
  // UNION et non intersection : une échéance n'est pas rattachée à un frais
  // précis (Echeance → Echeancier → Inscription, sans lien vers Frais), on ne
  // peut donc pas savoir lequel elle solde. Être plus strict risquerait de
  // bloquer un versement légitime. Ensemble vide ⇒ aucune restriction.
  const modesAutorises = (() => {
    const dettes = situation?.dettes;
    if (!Array.isArray(dettes) || dettes.length === 0) return null;
    const union = new Set();
    for (const d of dettes) {
      const ouverts = d?.modesPaiementAutorises;
      if (!Array.isArray(ouverts) || ouverts.length === 0) return null; // frais sans contrainte
      ouverts.forEach(m => union.add(m));
    }
    return union.size > 0 ? union : null;
  })();

  const modeOuvert = (code) => !modesAutorises || modesAutorises.has(code);

  const loadSituation = useCallback(async () => {
    try {
      const response = await api.get(`/api/paiements/etudiant/situation/${inscriptionId}`);
      setSituation(response.data);
    } catch (err) {
      console.error(err);
    }
  }, [inscriptionId]);

  const loadPaiements = useCallback(async () => {
    try {
      const response = await api.get(`/api/paiements/etudiant/inscription/${inscriptionId}`);
      setPaiements(response.data);
    } catch (err) {
      console.error(err);
    }
  }, [inscriptionId]);

  const loadEcheanciers = useCallback(async () => {
    try {
      const response = await api.get(`/api/echeanciers/inscription/${inscriptionId}`);
      setEcheanciers(response.data);
    } catch (err) {
      console.error(err);
    }
  }, [inscriptionId]);

  const loadAllData = useCallback(async () => {
    try {
      await Promise.all([
        loadSituation(),
        loadPaiements(),
        loadEcheanciers()
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [loadSituation, loadPaiements, loadEcheanciers]);

  useEffect(() => {
    if (!inscriptionId) {
      setError("Aucune inscription trouvée");
      setLoading(false);
      return;
    }
    loadAllData();
  }, [inscriptionId, loadAllData]);

  // Banques partenaires de l'établissement. Échec silencieux : l'absence de comptes
  // publiés ne doit pas empêcher les autres modes de paiement de fonctionner.
  useEffect(() => {
    if (!user?.universiteId) return;
    informationBancaireService.listerActifs(user.universiteId)
      .then(r => setBanques(Array.isArray(r.data) ? r.data : []))
      .catch(() => setBanques([]));
  }, [user?.universiteId]);

  // Le mode change → l'opérateur retenu doit rester cohérent (une banque n'est pas
  // un opérateur mobile money, et inversement).
  useEffect(() => {
    setMobileForm(f => {
      if (estCanalBancaire(f.modePaiement)) {
        return { ...f, operateur: banques.length > 0 ? banques[0].nom : 'Autre' };
      }
      return { ...f, operateur: 'M-Pesa' };
    });
  }, [mobileForm.modePaiement, banques]);

  const soumettrePaiement = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage('');
    
    try {
      const payload = {
        ...form,
        inscriptionId: parseInt(inscriptionId),
        universiteId: user?.universiteId,
        montant: parseFloat(form.montant),
        agentId: user?.id
      };
      
      const response = await api.post('/api/paiements/etudiant', payload);
      setMessage(`Paiement soumis avec succès ! Référence: ${response.data.reference}`);
      setShowForm(false);
      setForm({
        montant: '',
        modePaiement: 'MOBILE_MONEY',
        typePaiement: 'FRAIS_ACADEMIQUES',
        numeroTransaction: '',
        operateur: '',
        notesCaisse: ''
      });
      loadAllData();
    } catch (err) {
      setError(err.response?.data?.erreur || "Erreur lors de la soumission");
    }
  };

  const payerEcheances = () => {
    if (selectedEcheanceIds.length === 0) {
      setError('Veuillez sélectionner au moins une échéance');
      return;
    }
    setShowMobileModal(true);
  };

  const confirmerPaiementMobile = async (e) => {
    e.preventDefault();
    setMobileLoading(true);
    setError(null);
    try {
      await api.post('/api/echeances/payer-lot', {
        echeancierId: echeanciers[0]?.id,
        echeanceIds: selectedEcheanceIds,
        paiementData: {
          modePaiement: mobileForm.modePaiement,
          numeroTransaction: mobileForm.numeroTransaction,
          operateur: mobileForm.operateur,
        }
      });
      setMessage(`✅ ${selectedEcheanceIds.length} échéance(s) payée(s) avec succès !`);
      setSelectedEcheanceIds([]);
      setShowMobileModal(false);
      setMobileForm({ modePaiement: 'MOBILE_MONEY', operateur: 'M-Pesa', numeroTransaction: '' });
      loadAllData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors du paiement des échéances');
    } finally {
      setMobileLoading(false);
    }
  };

  const genererRecu = async (paiementId) => {
    try {
      const response = await api.get(`/api/etudiant/frais/recu/${paiementId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recu_paiement_${paiementId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Erreur lors de la génération du reçu");
    }
  };

  const getStatutBadge = (statut) => {
    switch(statut) {
      case 'VALIDE': return 'badge-success';
      case 'EN_ATTENTE': return 'badge-warning';
      case 'REJETE': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  const getStatutLabel = (statut) => {
    switch(statut) {
      case 'VALIDE': return 'Validé ✓';
      case 'EN_ATTENTE': return 'En attente ⏳';
      case 'REJETE': return 'Rejeté ✗';
      default: return statut;
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Chargement de votre situation financière...</div>
      </div>
    );
  }

  const pourcentage = situation ? Math.min(100, situation.pourcentage || 0) : 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">💰 Mes paiements</h1>
          <p className="page-sub">Consultez votre situation financière et déclarez vos versements</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '📤 Déclarer un paiement'}
        </button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      {/* Formulaire de déclaration */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">Déclarer un nouveau paiement</h2>
          <form onSubmit={soumettrePaiement} className="form-grid" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label>Montant (USD)</label>
              <input 
                type="number" 
                step="0.01" 
                value={form.montant} 
                onChange={e => setForm({ ...form, montant: e.target.value })} 
                required 
                placeholder="Ex: 150.00"
              />
            </div>
            <div className="form-group">
              <label>Type de paiement</label>
              <select value={form.typePaiement} onChange={e => setForm({ ...form, typePaiement: e.target.value })}>
                <option value="FRAIS_INSCRIPTION">Frais d'inscription</option>
                <option value="FRAIS_ACADEMIQUES">Frais académiques (Minerval)</option>
                <option value="FRAIS_EXAMEN">Frais d'examen</option>
                <option value="FRAIS_BIBLIOTHEQUE">Frais de bibliothèque</option>
                <option value="FRAIS_DIPLOME">Frais de diplôme</option>
              </select>
            </div>
            <div className="form-group">
              <label>Mode de paiement</label>
              <select value={form.modePaiement} onChange={e => setForm({ ...form, modePaiement: e.target.value })}>
                <option value="MOBILE_MONEY">Mobile Money (M-Pesa, Airtel Money, Orange Money)</option>
                <option value="VIREMENT">Virement bancaire</option>
                <option value="ESPECES">Espèces (à la caisse)</option>
                <option value="CHEQUE">Chèque</option>
              </select>
            </div>
            <div className="form-group">
              <label>Opérateur / Banque</label>
              <input 
                value={form.operateur} 
                onChange={e => setForm({ ...form, operateur: e.target.value })} 
                placeholder="Ex: M-Pesa, Rawbank..."
              />
            </div>
            <div className="form-group">
              <label>Numéro de transaction / Référence</label>
              <input 
                value={form.numeroTransaction} 
                onChange={e => setForm({ ...form, numeroTransaction: e.target.value })} 
                placeholder="Ex: TXN-123456"
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Notes supplémentaires</label>
              <textarea 
                rows="2" 
                value={form.notesCaisse} 
                onChange={e => setForm({ ...form, notesCaisse: e.target.value })} 
                placeholder="Informations complémentaires..."
              />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>
              Soumettre la déclaration
            </button>
          </form>
        </div>
      )}

      {/* Situation financière */}
      {situation && (
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#E6F1FB' }}>📋</div>
            <div>
              <div className="stat-value">{situation.montantAttendu?.toLocaleString()} USD</div>
              <div className="stat-label">Total attendu</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#E1F5EE' }}>✅</div>
            <div>
              <div className="stat-value" style={{ color: '#1D9E75' }}>{situation.totalPaye?.toLocaleString()} USD</div>
              <div className="stat-label">Déjà payé</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#FAEEDA' }}>⚠️</div>
            <div>
              <div className="stat-value" style={{ color: situation.soldeRestant > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}>
                {situation.soldeRestant?.toLocaleString()} USD
              </div>
              <div className="stat-label">
                {situation.soldeRestant > 0 ? 'Reste à payer' : 'Soldé ✓'}
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#FBEAF0' }}>📊</div>
            <div>
              <div className="stat-value">{pourcentage}%</div>
              <div className="stat-label">Taux de couverture</div>
            </div>
          </div>
        </div>
      )}

      {/* Barre de progression */}
      {situation && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>Progression du paiement</span>
            <span style={{ fontWeight: 600 }}>{pourcentage}%</span>
          </div>
          <div style={{ background: 'var(--bg-secondary)', height: 12, borderRadius: 6, overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${pourcentage}%`, 
                background: pourcentage >= 100 ? '#1D9E75' : '#185FA5', 
                height: '100%',
                transition: 'width 0.3s'
              }} 
            />
          </div>
        </div>
      )}

      {/* Échéanciers */}
      {echeanciers.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">📋 Échéanciers de paiement</h2>
          {echeanciers.map(ech => {
            const payees = ech.echeances?.filter(e => e.statut === 'PAYEE').length || 0;
            const total = ech.echeances?.length || 0;
            const progress = total > 0 ? Math.round((payees / total) * 100) : 0;
            const totalRestant = ech.montantTotal - ech.echeances?.filter(e => e.statut === 'PAYEE')
              .reduce((sum, e) => sum + e.montant, 0) || 0;

            return (
              <div key={ech.id} style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{ech.libelle}</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {ech.description} • {ech.nombreEcheances} tranches • Total: {ech.montantTotal} USD
                    </div>
                  </div>
                  <span className={`badge ${ech.statut === 'ACTIF' ? 'badge-success' : 'badge-neutral'}`}>
                    {ech.statut}
                  </span>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span>Progression</span>
                    <span>{payees}/{total} payées ({progress}%)</span>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${progress}%`,
                      background: progress === 100 ? '#1D9E75' : '#185FA5',
                      height: '100%',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontWeight: 600 }}>
                    <span>Reste à payer</span>
                    <span style={{ color: totalRestant > 0 ? '#cc0000' : '#1D9E75' }}>
                      {Math.round(totalRestant * 100) / 100} USD
                    </span>
                  </div>
                </div>

                <table className="data-table" style={{ fontSize: 12, marginTop: 12 }}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Montant</th>
                      <th>Date échéance</th>
                      <th>Pénalité</th>
                      <th>Statut</th>
                      <th>Sélection</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ech.echeances?.sort((a,b) => a.numeroEcheance - b.numeroEcheance).map(e => (
                      <tr key={e.id}>
                        <td>{e.numeroEcheance}</td>
                        <td>{e.montant} USD</td>
                        <td>{new Date(e.dateEcheance).toLocaleDateString('fr-FR')}</td>
                        <td style={{ color: e.penalite > 0 ? '#cc0000' : '#888' }}>
                          {e.penalite > 0 ? e.penalite + ' USD' : '-'}
                        </td>
                        <td>
                          <span className={`badge ${getStatutBadge(e.statut)}`}>
                            {getStatutLabel(e.statut)}
                          </span>
                        </td>
                        <td>
                          {e.statut === 'EN_ATTENTE' && (
                            <input
                              type="checkbox"
                              checked={selectedEcheanceIds.includes(e.id)}
                              onChange={() => {
                                setSelectedEcheanceIds(prev =>
                                  prev.includes(e.id)
                                    ? prev.filter(id => id !== e.id)
                                    : [...prev, e.id]
                                );
                              }}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {selectedEcheanceIds.length > 0 && (
                  <button
                    className="btn-primary"
                    style={{ marginTop: 12 }}
                    onClick={payerEcheances}
                  >
                    💳 Payer {selectedEcheanceIds.length} échéance(s)
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Historique des paiements */}
      <div className="card">
        <h2 className="card-title">📜 Historique des paiements</h2>
        {paiements.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
            Aucun paiement enregistré.
          </p>
        ) : (
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Type</th>
                <th>Mode</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paiements.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: '#185FA5' }}>{p.reference}</td>
                  <td>{new Date(p.datePaiement).toLocaleDateString('fr-FR')}</td>
                  <td style={{ fontWeight: 600 }}>{p.montant} {p.devise}</td>
                  <td>{p.type?.replace('_', ' ')}</td>
                  <td>{p.modePaiement?.replace('_', ' ')}</td>
                  <td>
                    <span className={`badge ${getStatutBadge(p.statut)}`}>
                      {getStatutLabel(p.statut)}
                    </span>
                  </td>
                  <td>
                    {p.statut === 'VALIDE' && (
                      <button 
                        className="btn-outline" 
                        style={{ fontSize: 11, padding: '4px 8px' }}
                        onClick={() => genererRecu(p.id)}
                      >
                        🖨️ Reçu
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal paiement mobile money des échéances */}
      {showMobileModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', width: '90%', maxWidth: '480px' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>💳 Payer {selectedEcheanceIds.length} échéance(s)</h3>
              <button className="btn-outline" onClick={() => setShowMobileModal(false)}>✕</button>
            </div>
            <form onSubmit={confirmerPaiementMobile} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label>Mode de paiement</label>
                <select
                  value={mobileForm.modePaiement}
                  onChange={e => setMobileForm(f => ({ ...f, modePaiement: e.target.value }))}
                >
                  {/* Seuls les modes ouverts par l'université sont proposés.
                      Dépôt d'espèces au guichet d'une banque partenaire : le canal le
                      plus courant pour un étudiant sans compte bancaire. Distinct du
                      virement (de compte à compte) et des espèces en caisse. */}
                  {modeOuvert('MOBILE_MONEY') && <option value="MOBILE_MONEY">Mobile Money</option>}
                  {modeOuvert('DEPOT_BANCAIRE') && <option value="DEPOT_BANCAIRE">Dépôt d'espèces en banque</option>}
                  {modeOuvert('VIREMENT') && <option value="VIREMENT">Virement bancaire</option>}
                  {modeOuvert('ESPECES') && <option value="ESPECES">Espèces (caisse de l'université)</option>}
                </select>
                {modesAutorises && (
                  <small style={{ color: 'var(--text-muted)' }}>
                    Modes acceptés par votre université pour vos frais en cours.
                  </small>
                )}
              </div>
              {/* En virement, la liste vient des comptes réellement déclarés par
                  l'établissement — et non d'une liste figée où une seule banque
                  était codée en dur. L'étudiant peut ainsi payer chez n'importe
                  quelle banque partenaire (Equity BCDC, FBN Bank, UBA…). */}
              <div className="form-group">
                <label>{estCanalBancaire(mobileForm.modePaiement) ? 'Banque' : 'Opérateur'}</label>
                <select
                  value={mobileForm.operateur}
                  onChange={e => setMobileForm(f => ({ ...f, operateur: e.target.value }))}
                >
                  {estCanalBancaire(mobileForm.modePaiement) ? (
                    <>
                      {banques.map(b => (
                        <option key={`${b.nom}-${b.compte}`} value={b.nom}>
                          {b.nom}{b.devise ? ` (${b.devise})` : ''}
                        </option>
                      ))}
                      <option value="Autre">Autre banque</option>
                    </>
                  ) : (
                    <>
                      <option value="M-Pesa">M-Pesa (Vodacom)</option>
                      <option value="Airtel Money">Airtel Money</option>
                      <option value="Orange Money">Orange Money</option>
                      <option value="AfriMoney">AfriMoney</option>
                      <option value="Autre">Autre</option>
                    </>
                  )}
                </select>
                {estCanalBancaire(mobileForm.modePaiement) && (
                  banques.length === 0 ? (
                    <small style={{ color: 'var(--text-muted)' }}>
                      Aucun compte bancaire n'est publié par votre établissement.
                      Rapprochez-vous du service financier.
                    </small>
                  ) : (
                    // Le numéro du compte choisi, pour éviter un aller-retour vers le bon.
                    banques
                      .filter(b => b.nom === mobileForm.operateur && b.compte)
                      .map(b => (
                        <small key={b.compte} style={{ display: 'block', color: 'var(--text-muted)' }}>
                          Compte : <strong>{b.compte}</strong>
                          {b.intitule ? ` — ${b.intitule}` : ''}
                        </small>
                      ))
                  )
                )}
              </div>
              <div className="form-group">
                <label>Numéro de transaction / Référence *</label>
                <input
                  required
                  placeholder="Ex: MP240001234"
                  value={mobileForm.numeroTransaction}
                  onChange={e => setMobileForm(f => ({ ...f, numeroTransaction: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setShowMobileModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={mobileLoading}>
                  {mobileLoading ? 'Traitement...' : 'Confirmer le paiement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
