// src/pages/etudiant/frais/FraisAcademiques.jsx
// « Mes paiements » — hub unique regroupant tout ce qui concerne les
// paiements de l'étudiant : frais à payer, historique, reçus et état
// financier (auparavant éclatés entre /etudiant/frais et /finances/etudiant/*).
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import TachPayCheckout from '../../../components/TachPayCheckout';
import '../EtudiantDashboard.css';

const ONGLETS = [
  { id: 'frais', label: '📋 Frais à payer' },
  { id: 'historique', label: '📜 Historique' },
  { id: 'recus', label: '🧾 Reçus' },
  { id: 'etat', label: '📊 État financier' },
];

const COLORS = ['#185FA5', '#1D9E75', '#854F0B', '#993556', '#0B1F4A', '#FF9800'];

export default function FraisAcademiques() {
  const { user } = useAuth();
  const [onglet, setOnglet] = useState('frais');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [situation, setSituation] = useState(null);
  const [dettes, setDettes] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [showPaiementForm, setShowPaiementForm] = useState(false);
  const [showTachPay, setShowTachPay] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDettes, setSelectedDettes] = useState([]);
  const [generatingRecu, setGeneratingRecu] = useState(null);
  const [filterStatut, setFilterStatut] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [formPaiement, setFormPaiement] = useState({
    montant: '',
    modePaiement: 'MOBILE_MONEY',
    typePaiement: 'FRAIS_ACADEMIQUES',
    numeroTransaction: '',
    operateur: '',
    notes: ''
  });

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    const abortController = new AbortController();
    if (inscriptionId) {
      loadData(abortController.signal);
    } else {
      setLoading(false);
    }
    return () => abortController.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId]);

  const loadData = async (signal) => {
    setLoading(true);
    setError('');
    try {
      const [situationRes, dettesRes, paiementsRes] = await Promise.all([
        api.get(`/api/etudiant/frais/situation`, { signal }),
        api.get(`/api/etudiant/frais/a-payer`, { signal }),
        api.get(`/api/etudiant/frais/historique`, { signal })
      ]);
      setSituation(situationRes.data);
      setDettes(dettesRes.data || []);
      setPaiements(paiementsRes.data || []);
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('Requête annulée:', err.message);
        return;
      }
      console.error('Erreur chargement données financières:', err);
      setError('Impossible de charger vos données financières');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormPaiement({ ...formPaiement, [name]: value });
  };

  const handleSelectDette = (id) => {
    setSelectedDettes(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedDettes.length === dettes.length) {
      setSelectedDettes([]);
    } else {
      setSelectedDettes(dettes.map(d => d.id));
    }
  };

  const getTotalSelectionne = () => {
    return dettes
      .filter(d => selectedDettes.includes(d.id))
      .reduce((sum, d) => sum + (d.reste || d.montant), 0);
  };

  const handleSubmitPaiement = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (selectedDettes.length === 0) {
      setError('Veuillez sélectionner au moins un frais à payer');
      return;
    }

    if (!formPaiement.montant || parseFloat(formPaiement.montant) <= 0) {
      setError('Veuillez saisir un montant valide');
      return;
    }

    const total = getTotalSelectionne();
    if (parseFloat(formPaiement.montant) > total) {
      setError(`Le montant ne peut pas dépasser le total dû (${total.toFixed(2)} USD)`);
      return;
    }

    setSubmitting(true);
    setError('');

    const abortController = new AbortController();

    try {
      const payload = {
        inscriptionId: parseInt(inscriptionId),
        universiteId: user?.universiteId,
        montant: parseFloat(formPaiement.montant),
        modePaiement: formPaiement.modePaiement,
        typePaiement: formPaiement.typePaiement,
        numeroTransaction: formPaiement.numeroTransaction || null,
        operateur: formPaiement.operateur || null,
        notesCaisse: formPaiement.notes || null,
        affectationIds: selectedDettes
      };

      const response = await api.post('/api/paiements/etudiant', payload, { signal: abortController.signal });
      setMessage(`✅ Paiement de ${formPaiement.montant} USD déclaré avec succès ! En attente de validation.`);

      if (response.data?.id) {
        setGeneratingRecu(response.data.id);
        try {
          const recuRes = await api.get(`/api/etudiant/frais/recu/${response.data.id}`, {
            responseType: 'blob',
            signal: abortController.signal
          });
          const url = URL.createObjectURL(new Blob([recuRes.data], { type: 'application/pdf' }));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `recu_${response.data.reference || 'paiement'}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
          setMessage(`✅ Reçu téléchargé ! Référence: ${response.data.reference}`);
        } catch (recuErr) {
          if (axios.isCancel(recuErr)) {
            console.log('Téléchargement du reçu annulé');
          } else {
            console.warn('Impossible de générer le reçu automatiquement', recuErr);
          }
        }
        setGeneratingRecu(null);
      }

      setSelectedDettes([]);
      setFormPaiement({
        montant: '',
        modePaiement: 'MOBILE_MONEY',
        typePaiement: 'FRAIS_ACADEMIQUES',
        numeroTransaction: '',
        operateur: '',
        notes: ''
      });
      // Recharger les données avec un nouveau signal
      const newController = new AbortController();
      await loadData(newController.signal);
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('Requête annulée:', err.message);
        return;
      }
      setError(err.response?.data?.erreur || '❌ Erreur lors de la déclaration du paiement');
    } finally {
      setSubmitting(false);
      abortController.abort();
    }
  };

  const handleDownloadRecu = async (paiementId, reference) => {
    const abortController = new AbortController();
    try {
      const response = await api.get(`/api/etudiant/frais/recu/${paiementId}`, {
        responseType: 'blob',
        signal: abortController.signal
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recu_${reference || paiementId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage('✅ Reçu téléchargé avec succès');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('Téléchargement du reçu annulé');
        return;
      }
      setError('❌ Erreur lors du téléchargement du reçu');
    } finally {
      abortController.abort();
    }
  };

  const getStatutBadge = (statut) => {
    const map = {
      'VALIDE': 'badge-success',
      'EN_ATTENTE': 'badge-warning',
      'REJETE': 'badge-danger',
      'REMBOURSE': 'badge-neutral',
      'PAYE': 'badge-success',
      'PARTIEL': 'badge-warning'
    };
    return map[statut] || 'badge-neutral';
  };

  const getStatutLabel = (statut) => {
    const map = {
      'VALIDE': '✅ Validé',
      'EN_ATTENTE': '⏳ En attente',
      'REJETE': '❌ Rejeté',
      'REMBOURSE': '↩️ Remboursé',
      'PAYE': '✅ Payé',
      'PARTIEL': '🔄 Partiel'
    };
    return map[statut] || statut;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de votre situation financière...</p>
      </div>
    );
  }

  const pourcentage = situation ? Math.min(100, situation.pourcentage || 0) : 0;
  const totalReste = situation?.totalReste || 0;

  const paiementsFiltres = paiements.filter(p => {
    const matchStatut = filterStatut ? p.statut === filterStatut : true;
    const matchDate = filterDate ? p.datePaiement === filterDate : true;
    return matchStatut && matchDate;
  });

  const recusValides = paiements.filter(p => p.statut === 'VALIDE');

  const chartRepartition = dettes.map(d => ({ name: d.libelle || d.code, value: d.reste || d.montant }));

  const evolution = Object.values(
    recusValides.reduce((acc, p) => {
      const date = new Date(p.datePaiement);
      const cle = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      if (!acc[cle]) acc[cle] = { cle, mois: label, montant: 0 };
      acc[cle].montant += p.montant;
      return acc;
    }, {})
  ).sort((a, b) => a.cle.localeCompare(b.cle));

  return (
    <div className="etudiant-dashboard">
      <div className="section-header">
        <h2 className="section-title">💳 Mes paiements</h2>
        {dettes.length > 0 && (
          <span className="badge badge-danger" style={{ fontSize: 14, padding: '6px 14px' }}>
            {dettes.length} frais à payer
          </span>
        )}
      </div>

      {message && (
        <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>
          {message}
        </div>
      )}
      {error && (
        <div className="alert-erreur" onClick={() => setError('')}>{error}</div>
      )}

      {situation && (
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-value">{situation.totalAttendu?.toFixed(2)} USD</div>
              <div className="stat-label">Total attendu</div>
            </div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: '#1D9E75' }}>
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value" style={{ color: 'var(--color-success-text)' }}>{situation.totalPaye?.toFixed(2)} USD</div>
              <div className="stat-label">Déjà payé</div>
            </div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: totalReste > 0 ? '#cc0000' : '#1D9E75' }}>
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <div className="stat-value" style={{ color: totalReste > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}>
                {totalReste.toFixed(2)} USD
              </div>
              <div className="stat-label">{totalReste > 0 ? 'Reste à payer' : 'Soldé ✓'}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{Math.round(pourcentage)}%</div>
              <div className="stat-label">Taux de couverture</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border-color, #e2e8f0)', flexWrap: 'wrap' }}>
        {ONGLETS.map(o => (
          <button
            key={o.id}
            type="button"
            onClick={() => setOnglet(o.id)}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              color: onglet === o.id ? '#185FA5' : 'var(--text-muted)',
              borderBottom: onglet === o.id ? '3px solid #185FA5' : '3px solid transparent',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {onglet === 'frais' && (
        <>
          <div className="card" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h4 style={{ margin: 0, color: '#185FA5' }}>💳 Payer vos frais</h4>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                Paiement instantané par Mobile Money ou carte (TachPay), ou déclaration manuelle pour un règlement à la caisse.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" onClick={() => setShowTachPay(true)}>💳 Payer maintenant</button>
              <button className="btn-outline" onClick={() => setShowPaiementForm(!showPaiementForm)}>
                {showPaiementForm ? 'Annuler' : '📤 Déclarer un paiement'}
              </button>
            </div>
          </div>

          {situation && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Progression du paiement</span>
                <span style={{ fontWeight: 600 }}>{Math.round(pourcentage)}%</span>
              </div>
              <div style={{ background: 'var(--bg-secondary)', height: 12, borderRadius: 6, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, pourcentage)}%`,
                    background: pourcentage >= 80 ? '#1D9E75' : '#185FA5',
                    height: '100%',
                    transition: 'width 0.6s ease'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                <span>Payé : {situation.totalPaye?.toFixed(2)} USD</span>
                <span>Total : {situation.totalAttendu?.toFixed(2)} USD</span>
              </div>
            </div>
          )}

          <div className="card" style={{ marginBottom: 20 }}>
            <h3 className="card-title">📋 Frais à payer ({dettes.length})</h3>
            {dettes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                ✅ Aucun frais à payer. Vous êtes à jour !
              </p>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedDettes.length === dettes.length && dettes.length > 0}
                      onChange={handleSelectAll}
                    />
                    <span style={{ fontSize: 13 }}>Tout sélectionner</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 10 }}>
                      ({selectedDettes.length}/{dettes.length} sélectionnées)
                    </span>
                  </label>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 30 }}></th>
                        <th>Code</th>
                        <th>Libellé</th>
                        <th>Montant</th>
                        <th>Reste</th>
                        <th>Échéance</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dettes.map(d => {
                        const selectionnee = selectedDettes.includes(d.id);
                        return (
                          <tr key={d.id} style={{ background: selectionnee ? '#f0f7ff' : 'transparent' }}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectionnee}
                                onChange={() => handleSelectDette(d.id)}
                              />
                            </td>
                            <td className="uni-code">{d.code}</td>
                            <td>{d.libelle}</td>
                            <td>{d.montant.toFixed(2)} USD</td>
                            <td style={{ fontWeight: 600, color: d.reste > 0 ? '#cc0000' : '#1D9E75' }}>
                              {d.reste.toFixed(2)} USD
                            </td>
                            <td>{d.dateEcheance ? new Date(d.dateEcheance).toLocaleDateString('fr-FR') : '-'}</td>
                            <td>
                              <span className={`badge ${getStatutBadge(d.statut)}`}>
                                {getStatutLabel(d.statut)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {selectedDettes.length > 0 && (
                  <div style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(24,95,165,0.12)', borderRadius: 8 }}>
                    <span style={{ fontWeight: 600 }}>Total sélectionné : </span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#185FA5' }}>
                      {getTotalSelectionne().toFixed(2)} USD
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {showPaiementForm && (
            <div className="card">
              <h3 className="card-title">📤 Déclarer un paiement</h3>
              <form onSubmit={handleSubmitPaiement} className="form-grid" style={{ marginTop: 16 }}>
                <div className="form-group">
                  <label>Montant (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="montant"
                    value={formPaiement.montant}
                    onChange={handleChange}
                    placeholder="Ex: 150.00"
                    required
                    disabled={submitting}
                  />
                  {dettes.length > 0 && selectedDettes.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      Max: {getTotalSelectionne().toFixed(2)} USD
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Type de paiement *</label>
                  <select
                    name="typePaiement"
                    value={formPaiement.typePaiement}
                    onChange={handleChange}
                    required
                    disabled={submitting}
                  >
                    <option value="FRAIS_ACADEMIQUES">Frais académiques (Minerval)</option>
                    <option value="FRAIS_INSCRIPTION">Frais d'inscription</option>
                    <option value="FRAIS_EXAMEN">Frais d'examen</option>
                    <option value="FRAIS_BIBLIOTHEQUE">Frais de bibliothèque</option>
                    <option value="FRAIS_DIPLOME">Frais de diplôme</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Mode de paiement *</label>
                  <select
                    name="modePaiement"
                    value={formPaiement.modePaiement}
                    onChange={handleChange}
                    required
                    disabled={submitting}
                  >
                    <option value="MOBILE_MONEY">📱 Mobile Money (M-Pesa, Airtel Money, Orange Money)</option>
                    <option value="VIREMENT">🏦 Virement bancaire</option>
                    <option value="ESPECES">💵 Espèces (à la caisse)</option>
                    <option value="CHEQUE">📄 Chèque</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Opérateur / Banque</label>
                  <input
                    type="text"
                    name="operateur"
                    value={formPaiement.operateur}
                    onChange={handleChange}
                    placeholder="Ex: M-Pesa, Rawbank..."
                    disabled={submitting}
                  />
                </div>
                <div className="form-group">
                  <label>Numéro de transaction / Référence</label>
                  <input
                    type="text"
                    name="numeroTransaction"
                    value={formPaiement.numeroTransaction}
                    onChange={handleChange}
                    placeholder="Ex: TXN-123456"
                    disabled={submitting}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                  <label>Notes supplémentaires</label>
                  <textarea
                    name="notes"
                    value={formPaiement.notes}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Informations complémentaires..."
                    disabled={submitting}
                  />
                </div>
                <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10 }}>
                  <button type="button" className="btn-outline" onClick={() => setShowPaiementForm(false)} disabled={submitting}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting || selectedDettes.length === 0}>
                    {submitting ? '⏳ Soumission...' : '📤 Soumettre la déclaration'}
                  </button>
                </div>
                {selectedDettes.length === 0 && showPaiementForm && (
                  <div style={{ gridColumn: '1 / span 2', fontSize: 12, color: '#ff9800' }}>
                    ⚠️ Veuillez sélectionner au moins un frais à payer ci-dessus
                  </div>
                )}
              </form>
            </div>
          )}
        </>
      )}

      {onglet === 'historique' && (
        <div className="card">
          <div className="section-header" style={{ marginBottom: 16 }}>
            <h3 className="card-title" style={{ margin: 0 }}>📜 Historique des paiements</h3>
            <button className="btn-outline" onClick={() => {
              const controller = new AbortController();
              loadData(controller.signal);
            }}>🔄 Rafraîchir</button>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
            <label style={{ fontWeight: 600 }}>Statut :</label>
            <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}>
              <option value="">Tous</option>
              <option value="VALIDE">Validé</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="REJETE">Rejeté</option>
              <option value="REMBOURSE">Remboursé</option>
            </select>
            <label style={{ fontWeight: 600 }}>Date :</label>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }} />
            <button className="btn-outline" onClick={() => { setFilterStatut(''); setFilterDate(''); }}>Réinitialiser</button>
          </div>

          {paiementsFiltres.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
              {paiements.length === 0 ? 'Aucun paiement enregistré.' : 'Aucun paiement ne correspond aux filtres.'}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
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
                  {paiementsFiltres.map(p => (
                    <tr key={p.id}>
                      <td className="uni-code">{p.reference}</td>
                      <td>{new Date(p.datePaiement).toLocaleDateString('fr-FR')}</td>
                      <td style={{ fontWeight: 600 }}>{p.montant.toFixed(2)} {p.devise || 'USD'}</td>
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
                            style={{ fontSize: 11, padding: '4px 10px' }}
                            onClick={() => handleDownloadRecu(p.id, p.reference)}
                            disabled={generatingRecu === p.id}
                          >
                            {generatingRecu === p.id ? '⏳' : '🧾 Reçu'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {onglet === 'recus' && (
        <div className="card">
          <h3 className="card-title">🧾 Mes reçus</h3>
          {recusValides.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucun reçu disponible pour l'instant.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Date</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recusValides.map(r => (
                    <tr key={r.id}>
                      <td className="uni-code">{r.reference}</td>
                      <td>{new Date(r.datePaiement).toLocaleDateString('fr-FR')}</td>
                      <td>{r.montant.toFixed(2)} {r.devise || 'USD'}</td>
                      <td><span className={`badge ${getStatutBadge(r.statut)}`}>{getStatutLabel(r.statut)}</span></td>
                      <td>
                        <button
                          className="btn-outline"
                          style={{ fontSize: 11, padding: '4px 10px' }}
                          onClick={() => handleDownloadRecu(r.id, r.reference)}
                          disabled={generatingRecu === r.id}
                        >
                          {generatingRecu === r.id ? '⏳' : '📥 PDF'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {onglet === 'etat' && situation && (
        <>
          <div className="card" style={{ marginBottom: 20, background: 'rgba(24,95,165,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{situation.etudiant}</div>
                <div style={{ color: '#185FA5' }}>Matricule: {situation.matricule}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Situation</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: situation.estSolde ? '#1D9E75' : '#cc0000' }}>
                  {situation.estSolde ? '✅ Totalement soldé' : '⚠️ Dette active'}
                </div>
              </div>
            </div>
          </div>

          <div className="dash-grid" style={{ marginBottom: 20, gridTemplateColumns: '1fr 1fr' }}>
            <div className="card">
              <h3 className="card-title">Répartition des dettes</h3>
              {chartRepartition.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune dette</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartRepartition}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartRepartition.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card">
              <h3 className="card-title">Évolution des paiements</h3>
              {evolution.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune donnée d'évolution</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={evolution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="montant" fill="#185FA5" name="Montant (USD)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── Intégration de TachPayCheckout avec disableSearch ─── */}
      {showTachPay && (
        <TachPayCheckout
          mode="modal"
          isOpen
          onClose={() => setShowTachPay(false)}
          onSuccess={() => {
            setMessage('✅ Paiement initié avec succès.');
            const controller = new AbortController();
            loadData(controller.signal);
          }}
          prefill={{
            matricule: situation?.matricule || user?.matricule || '',
            nom: user?.nom || '',
            prenom: user?.prenom || '',
            email: user?.email || '',
            universite: situation?.universite || user?.universiteNom || '',
            universiteId: user?.universiteId || '',
            inscriptionId: user?.inscriptionId || inscriptionId,
            filiere: situation?.filiere || user?.filiereNom || '',
            promotion: situation?.promotion || user?.promotionLibelle || '',
            anneeScolaire: situation?.anneeAcademique || user?.anneeScolaire || '',
            telephone: user?.telephone || '',
            indicatif: user?.indicatif || '+243',
            pays: user?.pays || 'République Démocratique du Congo',
            province: user?.province || '',
            ville: user?.ville || '',
            departementId: user?.departementId || '',
            faculte: user?.faculteNom || '',
            filiereId: user?.filiereId || '',
          }}
          disableSearch={true}
        />
      )}
    </div>
  );
}
