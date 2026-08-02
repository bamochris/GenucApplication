// src/pages/caissier/CaissierDashboard.jsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDesign } from '../../context/DesignContext';
import TachPayCheckout from '../../components/TachPayCheckout';
import api from '../../api/axios';
import BonDePaiementService from '../../services/bonDePaiementService';
import '../Dashboard.css';
import AvatarUtilisateur from '../../components/AvatarUtilisateur';
import QuickActionsGrid from '../../components/QuickActionsGrid';
import CaissierDashboardPremium from './CaissierDashboardPremium';

export default function CaissierDashboard() {
  const { user } = useAuth();
  const { design } = useDesign();
  const navigate = useNavigate();
  const universiteId = user?.universiteId;

  // ─── États ──────────────────────────────────────────────────────
  const [attente, setAttente] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [rapportJour, setRapportJour] = useState(null);
  const [caisse, setCaisse] = useState(null);
  const [soldeInitial, setSoldeInitial] = useState('');
  const [soldeFinal, setSoldeFinal] = useState('');
  const [loading, setLoading] = useState(true);
  const [onglet, setOnglet] = useState('attente');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [error, setError] = useState('');
  const [showDepenseForm, setShowDepenseForm] = useState(false);
  const [depenseForm, setDepenseForm] = useState({ libelle: '', montant: '', categorie: 'AUTRE', description: '' });

  // États pour le journal des opérations
  const [operations, setOperations] = useState([]);
  const [loadingOps, setLoadingOps] = useState(false);

  // État pour le formulaire de rejet
  const [rejetModal, setRejetModal] = useState({ open: false, paiementId: null, motif: '' });

  // État pour la confirmation de fermeture de caisse
  const [clotureModal, setClotureModal] = useState(false);

  // Statistiques avancées
  const [stats, setStats] = useState({ totalEncaisse: 0, totalDepenses: 0, nbTransactions: 0 });
  const [echeancesARecouvrer, setEcheancesARecouvrer] = useState([]);

  // ─── Vérification d'un bon de paiement (QR ou n° de référence) ──
  const [bonNumero, setBonNumero] = useState('');
  const [bonVerif, setBonVerif] = useState(null);
  const [bonVerifErreur, setBonVerifErreur] = useState('');
  const [bonVerifLoading, setBonVerifLoading] = useState(false);

  // ─── État pour TachPayCheckout ────────────────────────────────
  const [showCheckout, setShowCheckout] = useState(false);

  // ─── États TachPay ────────────────────────────────────────────
  const [tachpayRapport, setTachPayRapport] = useState(null);
  const [loadingTachPay, setLoadingTachPay] = useState(false);
  const [scanBon, setScanBon] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [especesForm, setEspecesForm] = useState({ matricule: '', montant: '', affectationIds: [] });
  const [especesStudent, setEspecesStudent] = useState(null);
  const [especesLoading, setEspecesLoading] = useState(false);
  const [especesMsg, setEspecesMsg] = useState('');

  // ─── Chargement des opérations de caisse ──────────────────────
  const chargerOperations = useCallback(async (caisseId) => {
    if (!caisseId) {
      setOperations([]);
      return;
    }
    setLoadingOps(true);
    try {
      const res = await api.get(`/api/caisse/operations/caisse/${caisseId}`);
      setOperations(res.data || []);
    } catch (err) {
      console.error('Erreur chargement opérations :', err);
      setOperations([]);
    } finally {
      setLoadingOps(false);
    }
  }, []);

  // ─── Chargement des données principales ───────────────────────
  const chargerDonnees = useCallback(async () => {
    if (!universiteId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [paiementsRes, rapportRes, caisseRes, statsRes, echeancesRes] = await Promise.all([
        api.get(`/api/paiements/gestion/universite/${universiteId}`).catch(() => ({ data: [] })),
        api.get(`/api/paiements/rapports/${universiteId}/journalier`).catch(() => ({ data: null })),
        api.get(`/api/caisse/universite/${universiteId}/ouverte`).catch(() => ({ data: null })),
        api.get(`/api/caisse/stats/${universiteId}`).catch(() => ({ data: {} })),
        api.get(`/api/echeances/universite/${universiteId}/a-recouvrer`).catch(() => ({ data: [] }))
      ]);
      const tous = paiementsRes.data?.content || paiementsRes.data || [];
      setAttente(tous.filter(p => p.statut === 'EN_ATTENTE' || p.statut === 'SOUMIS'));
      setHistorique(tous);
      setRapportJour(rapportRes.data);
      setCaisse(caisseRes.data);
      setStats(statsRes.data || { totalEncaisse: 0, totalDepenses: 0, nbTransactions: 0 });
      setEcheancesARecouvrer(echeancesRes.data || []);

      if (caisseRes.data) {
        await chargerOperations(caisseRes.data.id);
      } else {
        setOperations([]);
      }
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [universiteId, chargerOperations]);

  useEffect(() => {
    chargerDonnees();
  }, [chargerDonnees]);

  useEffect(() => {
    if (onglet === 'journal' && caisse) {
      chargerOperations(caisse.id);
    }
  }, [onglet, caisse, chargerOperations]);

  // ─── Vérifier un bon de paiement (saisie manuelle ou douchette QR) ──
  // Un scanner physique "tape" le contenu scanné puis envoie un Entrée,
  // donc un simple champ texte + onKeyDown(Enter) suffit pour les deux usages.
  const verifierBonPaiement = async () => {
    const numero = bonNumero.trim();
    if (!numero) return;
    setBonVerifLoading(true);
    setBonVerifErreur('');
    setBonVerif(null);
    try {
      const result = await BonDePaiementService.verifier(numero);
      setBonVerif(result);
    } catch (err) {
      setBonVerifErreur(err.message || "Bon introuvable ou invalide.");
    } finally {
      setBonVerifLoading(false);
    }
  };

  const reinitialiserVerifBon = () => {
    setBonNumero('');
    setBonVerif(null);
    setBonVerifErreur('');
  };

  // ─── Gestion de la caisse ──────────────────────────────────────
  const ouvrirCaisse = async () => {
    if (!soldeInitial || parseFloat(soldeInitial) < 0) {
      setError('Veuillez saisir un solde initial valide (≥ 0)');
      return;
    }
    try {
      await api.post('/api/caisse/ouvrir', {
        universiteId: parseInt(universiteId),
        caissierId: user.id,
        soldeInitial: parseFloat(soldeInitial),
      });
      setMessage({ type: 'success', text: '✅ Caisse ouverte avec succès' });
      setSoldeInitial('');
      chargerDonnees();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur à l\'ouverture');
    }
  };

  const demanderFermetureCaisse = () => {
    if (!caisse) return;
    if (!soldeFinal || parseFloat(soldeFinal) < 0) {
      setError('Veuillez saisir un solde final valide');
      return;
    }
    setClotureModal(true);
  };

  const fermerCaisse = async () => {
    setClotureModal(false);
    if (!caisse) return;
    try {
      await api.patch(`/api/caisse/${caisse.id}/fermer`, {
        caissierId: user.id,
        soldeFinal: parseFloat(soldeFinal),
      });
      setMessage({ type: 'success', text: '✅ Caisse fermée avec succès' });
      setSoldeFinal('');
      setOperations([]);
      chargerDonnees();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur à la fermeture');
    }
  };

  // ─── Gestion des paiements ─────────────────────────────────────
  const validerPaiement = async (id) => {
    if (!caisse) {
      setError('❌ Vous devez ouvrir la caisse avant de valider des paiements');
      return;
    }
    try {
      await api.patch(`/api/paiements/gestion/${id}/valider`, { agentId: user.id });
      setMessage({ type: 'success', text: '✅ Paiement validé' });
      chargerDonnees();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la validation');
    }
  };

  const rejeterPaiement = (id) => {
    setRejetModal({ open: true, paiementId: id, motif: 'Document non conforme' });
  };

  const confirmerRejet = async () => {
    if (!rejetModal.motif.trim()) {
      setError('Veuillez saisir un motif de rejet');
      return;
    }
    try {
      await api.patch(`/api/paiements/gestion/${rejetModal.paiementId}/rejeter`, {
        agentId: user.id,
        motif: rejetModal.motif,
      });
      setMessage({ type: 'success', text: 'Paiement rejeté' });
      setRejetModal({ open: false, paiementId: null, motif: '' });
      chargerDonnees();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du rejet');
    }
  };

  // ─── Impression du reçu ──────────────────────────────────────
  const imprimerRecu = async (paiementId) => {
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
      setError('Erreur lors de la génération du reçu');
    }
  };

  // ─── Dépenses ──────────────────────────────────────────────────
  const enregistrerDepense = async (e) => {
    e.preventDefault();
    if (!depenseForm.libelle || !depenseForm.montant) {
      setError('Veuillez remplir le libellé et le montant');
      return;
    }
    try {
      await api.post('/api/tresorerie/depenses', {
        ...depenseForm,
        universiteId: parseInt(universiteId),
        montant: parseFloat(depenseForm.montant),
        valideParId: user.id,
        dateDepense: new Date().toISOString().split('T')[0],
      });
      setMessage({ type: 'success', text: '✅ Dépense enregistrée' });
      setShowDepenseForm(false);
      setDepenseForm({ libelle: '', montant: '', categorie: 'AUTRE', description: '' });
      chargerDonnees();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de l\'enregistrement');
    }
  };

  // ─── TachPay : charger rapport ───────────────────────────────
  const chargerRapportTachPay = useCallback(async () => {
    setLoadingTachPay(true);
    try {
      const res = await api.get('/api/tachpay/caisse/rapport/journalier');
      setTachPayRapport(res.data);
    } catch { setTachPayRapport(null); }
    finally { setLoadingTachPay(false); }
  }, []);

  // ─── TachPay : scanner un bon ────────────────────────────────
  const validerBonTachPay = async () => {
    if (!scanBon.trim()) return;
    setScanLoading(true); setScanResult(null); setScanError('');
    try {
      const res = await api.post('/api/tachpay/caisse/valider-bon', { numeroBon: scanBon.trim() });
      setScanResult(res.data);
      setScanBon('');
      chargerRapportTachPay();
    } catch (err) {
      setScanError(err.response?.data?.erreur || 'Bon invalide ou déjà utilisé');
    } finally { setScanLoading(false); }
  };

  // ─── TachPay : chercher étudiant par matricule ───────────────
  const rechercherEtudiantEspeces = async () => {
    if (!especesForm.matricule.trim()) return;
    setEspecesLoading(true); setEspecesStudent(null); setEspecesMsg('');
    try {
      const res = await api.get(`/api/tachpay/caisse/etudiant/${especesForm.matricule.trim()}/frais`);
      setEspecesStudent(res.data);
      const allIds = (res.data.frais || []).map(f => f.id);
      setEspecesForm(f => ({ ...f, affectationIds: allIds, montant: res.data.montantTotal || '' }));
    } catch (err) {
      setEspecesMsg(err.response?.data?.erreur || 'Matricule introuvable');
    } finally { setEspecesLoading(false); }
  };

  // ─── TachPay : enregistrer paiement espèces ──────────────────
  const payerEspeces = async () => {
    if (!especesStudent || !especesForm.montant || especesForm.affectationIds.length === 0) return;
    setEspecesLoading(true); setEspecesMsg('');
    try {
      await api.post('/api/tachpay/caisse/paiement-especes', {
        inscriptionId: especesStudent.inscriptionId,
        affectationIds: especesForm.affectationIds,
        montant: parseFloat(especesForm.montant),
      });
      setEspecesMsg('✅ Paiement enregistré avec succès');
      setEspecesStudent(null);
      setEspecesForm({ matricule: '', montant: '', affectationIds: [] });
      chargerRapportTachPay();
    } catch (err) {
      setEspecesMsg(err.response?.data?.erreur || 'Erreur lors du paiement');
    } finally { setEspecesLoading(false); }
  };

  // ─── Utilitaires d'affichage ──────────────────────────────────
  const getStatutBadge = (statut) => {
    const map = {
      VALIDE: 'badge-success',
      EN_ATTENTE: 'badge-warning',
      REJETE: 'badge-danger',
      PAYEE: 'badge-success',
      EN_RETARD: 'badge-danger',
    };
    return map[statut] || 'badge-neutral';
  };

  const getStatutLabel = (statut) => {
    const map = {
      VALIDE: '✅ Validé',
      EN_ATTENTE: '⏳ En attente',
      REJETE: '❌ Rejeté',
      PAYEE: '✅ Payée',
      EN_RETARD: '⛔ En retard',
    };
    return map[statut] || statut;
  };

  // ─── Rendu ──────────────────────────────────────────────────────
  if (!universiteId) {
    return (
      <div className="page">
        <div className="alert-erreur">
          Aucune université associée à votre compte. Contactez l'administrateur.
        </div>
      </div>
    );
  }

  if (loading) return <div className="page"><div className="loading">Chargement...</div></div>;

  // Overlays partagés par les deux designs (rejet, clôture, TachPayCheckout).
  const overlays = (
    <>
      {rejetModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 24, width: 400, maxWidth: '90vw' }}>
            <h3 style={{ marginBottom: 16, color: 'var(--text-primary)' }}>Motif du rejet</h3>
            <textarea value={rejetModal.motif} onChange={e => setRejetModal(prev => ({ ...prev, motif: e.target.value }))} rows={3}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, resize: 'vertical', fontSize: 14 }}
              placeholder="Saisir le motif du rejet..." />
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setRejetModal({ open: false, paiementId: null, motif: '' })}>Annuler</button>
              <button className="btn-danger" onClick={confirmerRejet}>Confirmer le rejet</button>
            </div>
          </div>
        </div>
      )}
      {clotureModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 24, width: 400, maxWidth: '90vw' }}>
            <h3 style={{ marginBottom: 12, color: 'var(--text-primary)' }}>🔒 Confirmer la fermeture de caisse</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>
              Fermer la caisse avec un solde final de <strong>{soldeFinal} USD</strong> ? Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setClotureModal(false)}>Annuler</button>
              <button className="btn-danger" onClick={fermerCaisse}>Confirmer la fermeture</button>
            </div>
          </div>
        </div>
      )}
      <TachPayCheckout
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSuccess={() => {
          setShowCheckout(false);
          setMessage({ type: 'success', text: 'Paiement TachPay enregistré avec succès' });
          chargerDonnees();
        }}
        prefill={{ universite: user.universiteNom || '', caissier: user.nomComplet || '' }}
      />
    </>
  );

  // ── Variante « premium » (opt-in, réversible) ──────────────────────────
  if (design === 'premium') {
    const selectOnglet = (id) => {
      setOnglet(id);
      if (id === 'journal' && caisse) chargerOperations(caisse.id);
      if (id === 'tachpay') chargerRapportTachPay();
    };
    return (
      <>
        <CaissierDashboardPremium
          user={user}
          attente={attente}
          historique={historique}
          rapportJour={rapportJour}
          caisse={caisse}
          stats={stats}
          echeancesARecouvrer={echeancesARecouvrer}
          operations={operations}
          loadingOps={loadingOps}
          onglet={onglet}
          onSelectOnglet={selectOnglet}
          soldeInitial={soldeInitial}
          setSoldeInitial={setSoldeInitial}
          soldeFinal={soldeFinal}
          setSoldeFinal={setSoldeFinal}
          onOuvrirCaisse={ouvrirCaisse}
          onFermerCaisse={demanderFermetureCaisse}
          message={message}
          error={error}
          onClearMessage={() => setMessage({ type: '', text: '' })}
          onClearError={() => setError('')}
          onOpenCheckout={() => setShowCheckout(true)}
          onRefresh={chargerDonnees}
          showDepenseForm={showDepenseForm}
          onToggleDepense={() => setShowDepenseForm(!showDepenseForm)}
          depenseForm={depenseForm}
          setDepenseForm={setDepenseForm}
          onEnregistrerDepense={enregistrerDepense}
          onValiderPaiement={validerPaiement}
          onRejeterPaiement={rejeterPaiement}
          onImprimerRecu={imprimerRecu}
          onTraiterEcheance={(id) => navigate(`/caissier/echeance/${id}`)}
          onRefreshJournal={() => caisse && chargerOperations(caisse.id)}
          bonNumero={bonNumero}
          setBonNumero={setBonNumero}
          bonVerif={bonVerif}
          bonVerifErreur={bonVerifErreur}
          bonVerifLoading={bonVerifLoading}
          onVerifierBon={verifierBonPaiement}
          onResetBon={reinitialiserVerifBon}
          tachpayRapport={tachpayRapport}
          loadingTachPay={loadingTachPay}
          onRefreshTachPay={chargerRapportTachPay}
          scanBon={scanBon}
          setScanBon={setScanBon}
          scanResult={scanResult}
          scanError={scanError}
          scanLoading={scanLoading}
          onValiderBonTachPay={validerBonTachPay}
          especesForm={especesForm}
          setEspecesForm={setEspecesForm}
          especesStudent={especesStudent}
          especesLoading={especesLoading}
          especesMsg={especesMsg}
          onRechercherEspeces={rechercherEtudiantEspeces}
          onPayerEspeces={payerEspeces}
        />
        {overlays}
      </>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">💰 Caisse – Gestion des paiements</h1>
          <p className="page-sub"><AvatarUtilisateur taille={22} style={{ marginRight: 7 }} />{user.nomComplet || user.email} – {user.universiteNom || 'Université'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Bouton pour ouvrir TachPayCheckout */}
          <button className="btn-primary" onClick={() => setShowCheckout(true)}>
            📱 Nouveau paiement TachPay
          </button>
          <button className="btn-outline" onClick={chargerDonnees} title="Rafraîchir">
            🔄
          </button>
          <button className="btn-outline" onClick={() => setShowDepenseForm(!showDepenseForm)}>
            {showDepenseForm ? 'Annuler' : '➕ Dépense'}
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`alert-${message.type === 'success' ? 'success' : 'erreur'}`} onClick={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </div>
      )}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {/* Actions rapides */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head"><h2 className="card-title">⚡ Actions rapides</h2></div>
        <QuickActionsGrid
          actions={[
            { icon: '💵', label: 'Encaissement', to: '/finances/caissier/encaissement', color: '#1D9E75', bg: '#E1F5EE', description: 'Enregistrer un nouvel encaissement.', applyLabel: 'Ouvrir l\'encaissement' },
            { icon: '📒', label: 'Journal de caisse', to: '/finances/caissier/journal', color: '#185FA5', bg: '#E6F1FB', description: 'Consulter le journal des opérations.', applyLabel: 'Ouvrir le journal' },
            { icon: '🔒', label: 'Clôture de caisse', to: '/finances/caissier/cloture', color: '#854F0B', bg: '#FAEEDA', description: 'Effectuer la clôture de la caisse du jour.', applyLabel: 'Ouvrir la clôture' },
            { icon: '📊', label: 'Rapports de caisse', to: '/finances/caissier/rapports', color: '#6B21A8', bg: '#F3E8FF', description: 'Consulter les rapports de caisse.', applyLabel: 'Ouvrir les rapports' },
          ]}
        />
      </div>

      {/* Statistiques avancées */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-value">{stats.totalEncaisse || 0} USD</div>
          <div className="stat-label">Total encaissé</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--color-danger-text)' }}>{stats.totalDepenses || 0} USD</div>
          <div className="stat-label">Total dépenses</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.nbTransactions || 0}</div>
          <div className="stat-label">Transactions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: echeancesARecouvrer.length > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}>
            {echeancesARecouvrer.length}
          </div>
          <div className="stat-label">Échéances à recouvrer</div>
        </div>
      </div>

      {/* Gestion de la caisse */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <h2 className="card-title">
            {caisse ? '🟢 Caisse ouverte' : '🔴 Caisse fermée'}
          </h2>
        </div>
        {caisse ? (
          <div>
            <p><strong>Ouverte le :</strong> {new Date(caisse.dateOuverture).toLocaleDateString('fr-FR')}</p>
            <p><strong>Solde initial :</strong> {caisse.soldeInitial} USD</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
              <input
                type="number"
                step="0.01"
                placeholder="Solde final"
                value={soldeFinal}
                onChange={e => setSoldeFinal(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, width: 200 }}
              />
              <button className="btn-danger" onClick={demanderFermetureCaisse}>🔒 Fermer la caisse</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="number"
              step="0.01"
              placeholder="Solde initial"
              value={soldeInitial}
              onChange={e => setSoldeInitial(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, width: 200 }}
            />
            <button className="btn-primary" onClick={ouvrirCaisse}>🟢 Ouvrir la caisse</button>
          </div>
        )}
      </div>

      {/* Formulaire de dépense */}
      {showDepenseForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">💸 Enregistrer une dépense</h2>
          <form onSubmit={enregistrerDepense} className="form-grid">
            <div className="form-group">
              <label>Libellé *</label>
              <input
                value={depenseForm.libelle}
                onChange={e => setDepenseForm({ ...depenseForm, libelle: e.target.value })}
                required
                placeholder="Ex: Achat fournitures"
              />
            </div>
            <div className="form-group">
              <label>Montant (USD) *</label>
              <input
                type="number"
                step="0.01"
                value={depenseForm.montant}
                onChange={e => setDepenseForm({ ...depenseForm, montant: e.target.value })}
                required
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label>Catégorie</label>
              <select
                value={depenseForm.categorie}
                onChange={e => setDepenseForm({ ...depenseForm, categorie: e.target.value })}
              >
                <option value="FOURNITURE">Fourniture</option>
                <option value="ENTRETIEN">Entretien</option>
                <option value="TRANSPORT">Transport</option>
                <option value="SALAIRE">Salaire</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Description</label>
              <textarea
                value={depenseForm.description}
                onChange={e => setDepenseForm({ ...depenseForm, description: e.target.value })}
                rows="2"
                placeholder="Détails complémentaires..."
              />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>
              💾 Enregistrer la dépense
            </button>
          </form>
        </div>
      )}

      {/* Résumé du jour */}
      {rapportJour && (
        <div className="card" style={{ marginBottom: 20, background: 'var(--bg-secondary)' }}>
          <h2 className="card-title">📊 Résumé du jour – {rapportJour.date}</h2>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--color-success-text)' }}>{rapportJour.totalCollecte} USD</div>
              <div className="stat-label">Total collecté</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{rapportJour.nbTransactions}</div>
              <div className="stat-label">Transactions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: rapportJour.nbEnAttente > 0 ? 'var(--color-danger-text)' : 'var(--text-muted)' }}>
                {rapportJour.nbEnAttente}
              </div>
              <div className="stat-label">En attente</div>
            </div>
          </div>
          {rapportJour.repartitionMode && Object.keys(rapportJour.repartitionMode).length > 0 && (
            <div style={{ marginTop: 8, fontSize: 13 }}>
              <strong>Répartition par mode :</strong>{' '}
              {Object.entries(rapportJour.repartitionMode).map(([mode, count], idx, arr) => (
                <span key={mode}>{mode} ({count}){idx < arr.length - 1 ? ' • ' : ''}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Onglets */}
      <div className="tabs" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          className={onglet === 'attente' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setOnglet('attente')}
        >
          En attente ({attente.length})
        </button>
        <button
          className={onglet === 'historique' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setOnglet('historique')}
        >
          Historique
        </button>
        <button
          className={onglet === 'echeances' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setOnglet('echeances')}
        >
          📋 Échéances
        </button>
        <button
          className={onglet === 'journal' ? 'btn-primary' : 'btn-outline'}
          onClick={() => {
            setOnglet('journal');
            if (caisse) chargerOperations(caisse.id);
          }}
        >
          📋 Journal de caisse
        </button>
        <button
          className={onglet === 'tachpay' ? 'btn-primary' : 'btn-outline'}
          onClick={() => { setOnglet('tachpay'); chargerRapportTachPay(); }}
          style={{ background: onglet === 'tachpay' ? '#0B1F4A' : undefined }}
        >
          💳 TachPay
        </button>
      </div>

      {/* Contenu des onglets */}

      {/* Onglet En attente */}
      {onglet === 'attente' && (
        <>
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 className="card-title">🔍 Vérifier un bon de paiement</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: -8, marginBottom: 12 }}>
            Scannez le QR code avec la douchette ou saisissez le numéro de référence, puis appuyez sur Entrée.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, minWidth: 220, padding: '9px 12px', border: '1.5px solid var(--border-color)', borderRadius: 8, fontSize: 14 }}
              placeholder="Numéro de référence ou contenu du QR code..."
              value={bonNumero}
              autoFocus
              onChange={(e) => setBonNumero(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') verifierBonPaiement(); }}
            />
            <button className="btn-primary" onClick={verifierBonPaiement} disabled={bonVerifLoading || !bonNumero.trim()}>
              {bonVerifLoading ? 'Vérification...' : '🔍 Vérifier'}
            </button>
            {(bonVerif || bonVerifErreur) && (
              <button className="btn-outline" onClick={reinitialiserVerifBon}>✕ Effacer</button>
            )}
          </div>

          {bonVerifErreur && (
            <div className="alert-erreur" style={{ marginTop: 12 }}>⚠️ {bonVerifErreur}</div>
          )}

          {bonVerif && (
            <div
              className="detail-grid"
              style={{
                marginTop: 14, padding: 14, borderRadius: 10,
                background: bonVerif.statut === 'VALIDE' ? '#E1F5EE' : '#FAECE7',
                border: `1px solid ${bonVerif.statut === 'VALIDE' ? '#b2dfdb' : '#f3c8bb'}`,
              }}
            >
              <div>
                <div className="detail-lbl">Statut</div>
                <div>
                  <span className={`badge ${bonVerif.statut === 'VALIDE' ? 'badge-success' : 'badge-danger'}`}>
                    {bonVerif.statut === 'VALIDE' ? '✅ Valide' : '❌ Invalide'}
                  </span>
                  {bonVerif.utilise && <span style={{ marginLeft: 6, fontSize: 12, color: '#993C1D' }}>(déjà utilisé)</span>}
                  {bonVerif.expire && <span style={{ marginLeft: 6, fontSize: 12, color: '#993C1D' }}>(expiré)</span>}
                </div>
              </div>
              <div>
                <div className="detail-lbl">Numéro</div>
                <div>{bonVerif.numero}</div>
              </div>
              <div>
                <div className="detail-lbl">Étudiant</div>
                <div>{bonVerif.etudiant} {bonVerif.matricule ? `(${bonVerif.matricule})` : ''}</div>
              </div>
              <div>
                <div className="detail-lbl">Montant</div>
                <div>{bonVerif.montant} USD</div>
              </div>
              <div>
                <div className="detail-lbl">Émis le</div>
                <div>{bonVerif.dateEmission}</div>
              </div>
              <div>
                <div className="detail-lbl">Expire le</div>
                <div>{bonVerif.dateExpiration}</div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">⏳ Paiements en attente de validation</h2>
          {attente.length === 0 ? (
            <p>Aucun paiement en attente.</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Étudiant</th>
                    <th>Montant</th>
                    <th>Type</th>
                    <th>Mode</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attente.map(p => (
                    <tr key={p.id}>
                      <td>{p.reference}</td>
                      <td>{p.inscription?.etudiant?.nomComplet || '—'}</td>
                      <td>{p.montant} {p.devise}</td>
                      <td>{p.type}</td>
                      <td>{p.modePaiement}</td>
                      <td>{new Date(p.datePaiement).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <button
                          className="btn-success"
                          style={{ marginRight: 6 }}
                          onClick={() => validerPaiement(p.id)}
                          disabled={!caisse}
                          title={!caisse ? 'Ouvrez la caisse d\'abord' : ''}
                        >
                          Valider
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => rejeterPaiement(p.id)}
                          disabled={!caisse}
                          title={!caisse ? 'Ouvrez la caisse d\'abord' : ''}
                        >
                          Rejeter
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!caisse && attente.length > 0 && (
            <div className="alert-erreur" style={{ marginTop: 12 }}>
              ⚠️ Veuillez ouvrir la caisse avant de valider ou rejeter des paiements.
            </div>
          )}
        </div>
        </>
      )}

      {/* Onglet Historique */}
      {onglet === 'historique' && (
        <div className="card">
          <h2 className="card-title">📜 Historique des paiements</h2>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Étudiant</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Date validation</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {historique.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center' }}>Aucun paiement enregistré.</td></tr>
                ) : (
                  historique.map(p => (
                    <tr key={p.id}>
                      <td>{p.reference}</td>
                      <td>{p.inscription?.etudiant?.nomComplet || '—'}</td>
                      <td>{p.montant} {p.devise}</td>
                      <td><span className={`badge ${getStatutBadge(p.statut)}`}>{getStatutLabel(p.statut)}</span></td>
                      <td>{p.dateValidation ? new Date(p.dateValidation).toLocaleDateString('fr-FR') : '-'}</td>
                      <td>
                        {p.statut === 'VALIDE' && (
                          <button
                            className="btn-outline"
                            style={{ fontSize: 11, padding: '4px 8px' }}
                            onClick={() => imprimerRecu(p.id)}
                          >
                            🖨️ Reçu
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onglet Échéances à recouvrer */}
      {onglet === 'echeances' && (
        <div className="card">
          <h2 className="card-title">📋 Échéances à recouvrer</h2>
          {echeancesARecouvrer.length === 0 ? (
            <p>Aucune échéance en retard.</p>
          ) : (
            <div className="table-responsive"><table className="data-table">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Échéance</th>
                  <th>Montant</th>
                  <th>Pénalité</th>
                  <th>Date échéance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {echeancesARecouvrer.map(e => (
                  <tr key={e.id}>
                    <td>{e.echeancier?.inscription?.etudiant?.nomComplet || '—'}</td>
                    <td>Échéance #{e.numeroEcheance}</td>
                    <td>{e.montant} USD</td>
                    <td style={{ color: '#cc0000' }}>{e.penalite > 0 ? e.penalite + ' USD' : '-'}</td>
                    <td>{new Date(e.dateEcheance).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <button
                        className="btn-primary"
                        style={{ fontSize: 11 }}
                        onClick={() => navigate(`/caissier/echeance/${e.id}`)}
                      >
                        Traiter
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>
      )}

      {/* Onglet Journal de caisse */}
      {onglet === 'journal' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 className="card-title" style={{ margin: 0 }}>📋 Journal des opérations</h2>
            <button
              className="btn-outline"
              onClick={() => caisse && chargerOperations(caisse.id)}
              disabled={!caisse}
            >
              🔄 Rafraîchir
            </button>
          </div>
          {!caisse ? (
            <div className="alert-erreur">Aucune caisse ouverte. Ouvrez la caisse pour voir les opérations.</div>
          ) : loadingOps ? (
            <div className="loading">Chargement des opérations...</div>
          ) : operations.length === 0 ? (
            <p>Aucune opération enregistrée pour cette caisse.</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Montant</th>
                    <th>Référence</th>
                    <th>Description</th>
                    <th>Solde après</th>
                    <th>Opérateur</th>
                  </tr>
                </thead>
                <tbody>
                  {operations.map(op => (
                    <tr key={op.id}>
                      <td>{new Date(op.dateOperation).toLocaleString('fr-FR')}</td>
                      <td>
                        <span className={`badge ${
                          op.type === 'ENCAISSEMENT' ? 'badge-success' :
                          op.type === 'REMBOURSEMENT' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {op.type}
                        </span>
                      </td>
                      <td style={{
                        color: op.type === 'ENCAISSEMENT' ? '#1D9E75' :
                               op.type === 'REMBOURSEMENT' ? '#cc0000' : '#cc6600',
                        fontWeight: 600
                      }}>
                        {op.type === 'ENCAISSEMENT' ? '+' : '-'} {op.montant} USD
                      </td>
                      <td>{op.reference || '-'}</td>
                      <td>{op.description || '-'}</td>
                      <td>{op.soldeApresOperation} USD</td>
                      <td>{op.operateurId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Onglet TachPay */}
      {onglet === 'tachpay' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Rapport du jour */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="card-title" style={{ margin: 0 }}>📊 TachPay — Rapport du jour</h2>
              <button className="btn-outline" onClick={chargerRapportTachPay} disabled={loadingTachPay}>
                🔄 Rafraîchir
              </button>
            </div>
            {loadingTachPay ? (
              <div className="loading">Chargement...</div>
            ) : tachpayRapport ? (
              <>
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 16 }}>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--color-success-text)' }}>{tachpayRapport.totalValide?.toFixed(2)} $</div>
                    <div className="stat-label">Encaissé (validé)</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{tachpayRapport.nbTotal}</div>
                    <div className="stat-label">Transactions</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: tachpayRapport.nbEnAttente > 0 ? '#cc6600' : '#888' }}>
                      {tachpayRapport.nbEnAttente}
                    </div>
                    <div className="stat-label">En attente</div>
                  </div>
                  <div className="stat-card" style={{ fontSize: 12 }}>
                    {Object.entries(tachpayRapport.repartition || {}).map(([mode, nb]) => (
                      <div key={mode} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{mode.replace('_', ' ')}</span><strong>{nb}</strong>
                      </div>
                    ))}
                    <div className="stat-label" style={{ marginTop: 4 }}>Répartition</div>
                  </div>
                </div>
                {tachpayRapport.paiements?.length > 0 && (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Référence</th><th>Étudiant</th><th>Matricule</th>
                          <th>Montant</th><th>Mode</th><th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tachpayRapport.paiements.map((p, i) => (
                          <tr key={i}>
                            <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.reference}</td>
                            <td>{p.etudiant || '—'}</td>
                            <td>{p.matricule || '—'}</td>
                            <td>{p.montant} $</td>
                            <td>{p.modePaiement?.replace('_', ' ')}</td>
                            <td>
                              <span className={`badge ${
                                p.statut === 'VALIDE' ? 'badge-success' :
                                p.statut === 'EN_ATTENTE' ? 'badge-warning' : 'badge-danger'
                              }`}>{p.statut}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Aucun rapport disponible.</p>
            )}
          </div>

          {/* Scanner de bon */}
          <div className="card">
            <h2 className="card-title">🔍 Valider un bon de paiement</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
              Saisissez le numéro du bon (ou scannez le QR code) pour encaisser le paiement.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                value={scanBon}
                onChange={e => { setScanBon(e.target.value.toUpperCase()); setScanResult(null); setScanError(''); }}
                onKeyDown={e => e.key === 'Enter' && validerBonTachPay()}
                placeholder="Ex : BP-2024-00001"
                style={{ flex: 1, minWidth: 220, padding: '10px 14px', border: '2px solid #ddd', borderRadius: 8, fontSize: 14, letterSpacing: 1 }}
              />
              <button className="btn-primary" onClick={validerBonTachPay} disabled={scanLoading || !scanBon.trim()}>
                {scanLoading ? '⏳...' : '✅ Valider le bon'}
              </button>
            </div>
            {scanError && (
              <div className="alert-erreur" style={{ marginTop: 10 }}>{scanError}</div>
            )}
            {scanResult && (
              <div style={{
                marginTop: 12, padding: '14px 18px', background: '#e8f8f2',
                border: '1px solid #1D9E75', borderRadius: 8
              }}>
                <div style={{ fontWeight: 700, color: '#1D9E75', marginBottom: 6 }}>✅ Bon validé avec succès</div>
                <div style={{ fontSize: 13 }}>
                  <strong>Référence :</strong> {scanResult.reference}<br />
                  <strong>Montant :</strong> {scanResult.montant} USD<br />
                  <strong>Statut :</strong> {scanResult.statut}
                </div>
              </div>
            )}
          </div>

          {/* Paiement espèces rapide */}
          <div className="card">
            <h2 className="card-title">💵 Paiement espèces — Accès rapide</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <input
                value={especesForm.matricule}
                onChange={e => { setEspecesForm(f => ({ ...f, matricule: e.target.value })); setEspecesStudent(null); setEspecesMsg(''); }}
                onKeyDown={e => e.key === 'Enter' && rechercherEtudiantEspeces()}
                placeholder="Matricule de l'étudiant"
                style={{ flex: 1, minWidth: 200, padding: '10px 14px', border: '2px solid #ddd', borderRadius: 8, fontSize: 14 }}
              />
              <button className="btn-outline" onClick={rechercherEtudiantEspeces} disabled={especesLoading}>
                {especesLoading ? '⏳...' : '🔎 Rechercher'}
              </button>
            </div>

            {especesMsg && !especesStudent && (
              <div className="alert-erreur">{especesMsg}</div>
            )}

            {especesStudent && (
              <div style={{ border: '1px solid #e0e7ef', borderRadius: 8, padding: 16 }}>
                <div style={{ marginBottom: 12 }}>
                  <strong>Étudiant :</strong> {especesStudent.frais?.[0]?.etudiant || especesForm.matricule}<br />
                  <strong>Frais à payer :</strong> {especesStudent.montantTotal?.toFixed(2)} USD
                </div>

                <div style={{ marginBottom: 12, maxHeight: 180, overflowY: 'auto' }}>
                  {(especesStudent.frais || []).map(f => (
                    <label key={f.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                      background: especesForm.affectationIds.includes(f.id) ? '#f0f4ff' : 'transparent'
                    }}>
                      <input
                        type="checkbox"
                        checked={especesForm.affectationIds.includes(f.id)}
                        onChange={() => {
                          setEspecesForm(fm => {
                            const ids = fm.affectationIds.includes(f.id)
                              ? fm.affectationIds.filter(id => id !== f.id)
                              : [...fm.affectationIds, f.id];
                            const total = (especesStudent.frais || [])
                              .filter(x => ids.includes(x.id))
                              .reduce((s, x) => s + x.reste, 0);
                            return { ...fm, affectationIds: ids, montant: total.toFixed(2) };
                          });
                        }}
                      />
                      <span style={{ flex: 1, fontSize: 13 }}>{f.libelle}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.reste} $</span>
                    </label>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="number"
                    step="0.01"
                    value={especesForm.montant}
                    onChange={e => setEspecesForm(f => ({ ...f, montant: e.target.value }))}
                    placeholder="Montant reçu (USD)"
                    style={{ width: 180, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }}
                  />
                  <button
                    className="btn-primary"
                    onClick={payerEspeces}
                    disabled={especesLoading || !especesForm.montant || especesForm.affectationIds.length === 0}
                  >
                    {especesLoading ? '⏳ Traitement...' : '💵 Enregistrer le paiement'}
                  </button>
                </div>

                {especesMsg && <div style={{ marginTop: 10 }} className={especesMsg.startsWith('✅') ? 'alert-success' : 'alert-erreur'}>{especesMsg}</div>}
              </div>
            )}
          </div>

        </div>
      )}

      {overlays}
    </div>
  );
}