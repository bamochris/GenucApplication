// src/pages/admin/GestionBonsDePaiement.jsx
/**
 * 🧾 Gestion des Bons de Paiement
 * ✅ Génération avec QR Code (coordonnées bancaires + Mobile Money)
 * ✅ Liste, recherche, vérification, annulation
 */
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import BonDePaiementService from '../../services/bonDePaiementService';
import toast from 'react-hot-toast';
import '../Dashboard.css';

/**
 * Source d'image pour le QR d'un bon.
 *
 * Le champ `codeQR` porte le base64 nu — c'est ici qu'on ajoute le préfixe data URI.
 * Les bons émis avant la correction de TachPayPaiementService l'ont toutefois déjà
 * en base : les préfixer une seconde fois donnait une image cassée. On retire donc
 * ce qui traîne avant de préfixer, pour rester lisible sur une base non migrée.
 */
function srcImageQr(codeQR) {
  if (!codeQR) return '';
  const nu = String(codeQR).trim().replace(/^(data:[^,]*,)+/, '');
  return nu ? `data:image/png;base64,${nu}` : '';
}

export default function GestionBonsDePaiement() {
  const [bons, setBons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchNumero, setSearchNumero] = useState('');
  const [searchInscriptionId, setSearchInscriptionId] = useState('');
  const [selectedBon, setSelectedBon] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // ─── Modal Génération ─────────────────────────────────────
  const [showGenerer, setShowGenerer] = useState(false);
  const [genForm, setGenForm] = useState({ inscriptionId: '', montant: '', observations: '' });
  const [saving, setSaving] = useState(false);

  // ─── Modal Annulation ─────────────────────────────────────
  const [showAnnuler, setShowAnnuler] = useState(false);
  const [annulerMotif, setAnnulerMotif] = useState('');

  // ─── Stats ─────────────────────────────────────────────────
  const [stats, setStats] = useState({ total: 0, actifs: 0, utilises: 0, expires: 0 });

  // ─── Chargement ────────────────────────────────────────────
  const chargerBons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await BonDePaiementService.listerTous();
      setBons(data);

      const actifs = data.filter(b => !b.utilise && !b.expire);
      const utilises = data.filter(b => b.utilise);
      const expires = data.filter(b => b.expire);
      setStats({
        total: data.length,
        actifs: actifs.length,
        utilises: utilises.length,
        expires: expires.length,
      });
    } catch (err) {
      toast.error('Erreur lors du chargement des bons de paiement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    chargerBons();
  }, [chargerBons]);

  // ─── Recherche ─────────────────────────────────────────────
  const handleSearchByNumero = async () => {
    if (!searchNumero.trim()) {
      chargerBons();
      return;
    }
    setLoading(true);
    try {
      const data = await BonDePaiementService.getByNumero(searchNumero.trim());
      setBons(Array.isArray(data) ? data : [data]);
    } catch (err) {
      toast.error('Bon introuvable avec ce numéro');
      setBons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByInscription = async () => {
    if (!searchInscriptionId.trim()) {
      chargerBons();
      return;
    }
    setLoading(true);
    try {
      const data = await BonDePaiementService.getByInscription(Number(searchInscriptionId));
      setBons(Array.isArray(data) ? data : [data]);
    } catch (err) {
      toast.error('Aucun bon trouvé pour cette inscription');
      setBons([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Génération ────────────────────────────────────────────
  const handleGenerer = async (e) => {
    e.preventDefault();
    if (!genForm.inscriptionId || !genForm.montant) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setSaving(true);
    try {
      const result = await BonDePaiementService.generer(
        Number(genForm.inscriptionId),
        Number(genForm.montant),
        genForm.observations
      );
      toast.success(`Bon généré : ${result.numero}`);
      setShowGenerer(false);
      setGenForm({ inscriptionId: '', montant: '', observations: '' });
      chargerBons();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la génération');
    } finally {
      setSaving(false);
    }
  };

  // ─── Détail ────────────────────────────────────────────────
  const voirDetail = async (bon) => {
    try {
      const data = await BonDePaiementService.getById(bon.id);
      setSelectedBon(data);
      setShowDetail(true);
    } catch (err) {
      toast.error('Erreur lors du chargement du détail');
    }
  };

  // ─── Vérification ──────────────────────────────────────────
  const handleVerifier = async (numero) => {
    try {
      const result = await BonDePaiementService.verifier(numero);
      if (result.valide) {
        toast.success(`✅ Bon ${numero} — VALIDE (${result.message || 'Bon actif'})`);
      } else {
        toast.error(`❌ Bon ${numero} — INVALIDE (${result.message || 'Bon expiré ou utilisé'})`);
      }
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la vérification');
    }
  };

  // ─── Annulation ────────────────────────────────────────────
  const ouvrirAnnulation = (bon) => {
    setSelectedBon(bon);
    setAnnulerMotif('');
    setShowAnnuler(true);
  };

  const handleAnnuler = async () => {
    if (!annulerMotif.trim()) {
      toast.error('Veuillez fournir un motif d\'annulation');
      return;
    }
    try {
      await BonDePaiementService.annuler(selectedBon.id, annulerMotif);
      toast.success('Bon annulé avec succès');
      setShowAnnuler(false);
      setSelectedBon(null);
      chargerBons();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'annulation');
    }
  };

  const STATUT_ACTIF = { label: '🟢 Actif', className: 'badge-success' };
  const STATUT_UTILISE = { label: '✅ Utilisé', className: 'badge-neutral' };
  const STATUT_EXPIRE = { label: '🔴 Expiré', className: 'badge-danger' };

  // ─── Rendu ─────────────────────────────────────────────────
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>🧾 Bons de Paiement</h1>
        <p className="text-muted">Génération avec QR Code — Mobile Money & Bancaire</p>
      </div>

      {/* ─── Statistiques ─── */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card" style={{ background: 'rgba(29,158,117,0.12)', padding: '16px', borderRadius: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '2rem', color: '#1D9E75' }}>{stats.total}</h3>
          <p style={{ margin: 0, color: '#6b7280' }}>Total</p>
        </div>
        <div className="stat-card" style={{ background: 'rgba(24,95,165,0.12)', padding: '16px', borderRadius: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '2rem', color: '#1565c0' }}>{stats.actifs}</h3>
          <p style={{ margin: 0, color: '#6b7280' }}>Actifs</p>
        </div>
        <div className="stat-card" style={{ background: '#f3e5f5', padding: '16px', borderRadius: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '2rem', color: '#7b1fa2' }}>{stats.utilises}</h3>
          <p style={{ margin: 0, color: '#6b7280' }}>Utilisés</p>
        </div>
        <div className="stat-card" style={{ background: '#fbe9e7', padding: '16px', borderRadius: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '2rem', color: '#c62828' }}>{stats.expires}</h3>
          <p style={{ margin: 0, color: '#6b7280' }}>Expirés</p>
        </div>
      </div>

      {/* ─── Barre d'actions ─── */}
      <div className="dashboard-toolbar" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          className="btn btn-primary"
          onClick={() => setShowGenerer(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          ➕ Nouveau Bon
        </button>

        <Link
          to="/admin/comptes-bancaires"
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          🏦 Coordonnées bancaires
        </Link>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
          <input
            type="text"
            placeholder="🔍 N° Bon..."
            value={searchNumero}
            onChange={(e) => setSearchNumero(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchByNumero()}
            className="form-control"
            style={{ width: '180px' }}
          />
          <input
            type="number"
            placeholder="📋 ID Inscription..."
            value={searchInscriptionId}
            onChange={(e) => setSearchInscriptionId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchByInscription()}
            className="form-control"
            style={{ width: '180px' }}
          />
        </div>
      </div>

      {/* ─── Tableau ─── */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement des bons de paiement...</p>
        </div>
      ) : bons.length === 0 ? (
        <div className="empty-state text-center py-5">
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🧾</div>
          <h3>Aucun bon de paiement</h3>
          <p className="text-muted">Générez un nouveau bon de paiement pour commencer</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>N° Bon</th>
                <th>Étudiant</th>
                <th>Matricule</th>
                <th>Filière</th>
                <th>Montant</th>
                <th>Émis le</th>
                <th>Expire le</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bons.map((bon) => {
                const statut = bon.expire ? STATUT_EXPIRE : bon.utilise ? STATUT_UTILISE : STATUT_ACTIF;
                const estExpire = bon.expire;
                const estUtilise = bon.utilise;

                return (
                  <tr key={bon.id}>
                    <td><strong>{bon.numero}</strong></td>
                    <td>{bon.etudiantPrenom} {bon.etudiantNom}</td>
                    <td>{bon.etudiantMatricule}</td>
                    <td>{bon.filiereNom || '-'}</td>
                    <td><strong>{bon.montant?.toFixed(2)} USD</strong></td>
                    <td>{bon.dateEmission}</td>
                    <td>{bon.dateExpiration}</td>
                    <td>
                      <span className={`badge ${statut.className}`}>
                        {statut.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => voirDetail(bon)}
                          title="Voir le détail"
                        >
                          👁️
                        </button>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleVerifier(bon.numero)}
                          title="Vérifier la validité"
                        >
                          ✓
                        </button>
                        {!estUtilise && !estExpire && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => ouvrirAnnulation(bon)}
                            title="Annuler le bon"
                          >
                            🚫
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── MODAL GÉNÉRATION ─── */}
      {showGenerer && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1050
        }}>
          <div className="modal-content" style={{
            background: 'var(--bg-card)', borderRadius: '12px',
            padding: '24px', maxWidth: '500px', width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>➕ Générer un Bon de Paiement</h2>
              <button className="btn-close" onClick={() => setShowGenerer(false)}>✕</button>
            </div>

            <form onSubmit={handleGenerer}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  ID Inscription <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={genForm.inscriptionId}
                  onChange={(e) => setGenForm({ ...genForm, inscriptionId: e.target.value })}
                  placeholder="Entrez l'ID de l'inscription"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Montant (USD) <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={genForm.montant}
                  onChange={(e) => setGenForm({ ...genForm, montant: e.target.value })}
                  placeholder="Ex: 150.00"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Observations (optionnel)
                </label>
                <textarea
                  className="form-control"
                  value={genForm.observations}
                  onChange={(e) => setGenForm({ ...genForm, observations: e.target.value })}
                  placeholder="Motif, description..."
                  rows={3}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowGenerer(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Génération...' : '🎯 Générer le Bon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL DÉTAIL ─── */}
      {showDetail && selectedBon && (
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
              <h2 style={{ margin: 0 }}>🧾 Détail du Bon</h2>
              <button className="btn-close" onClick={() => setShowDetail(false)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>N° Bon</label>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedBon.numero}</p>
              </div>
              <div>
                <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Montant</label>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1D9E75' }}>
                  {selectedBon.montant?.toFixed(2)} USD
                </p>
              </div>
              <div>
                <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Étudiant</label>
                <p>{selectedBon.etudiantPrenom} {selectedBon.etudiantNom}</p>
              </div>
              <div>
                <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Matricule</label>
                <p>{selectedBon.etudiantMatricule}</p>
              </div>
              <div>
                <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Filière</label>
                <p>{selectedBon.filiereNom || '-'}</p>
              </div>
              <div>
                <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Promotion</label>
                <p>{selectedBon.promotionNom || '-'}</p>
              </div>
              <div>
                <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Date d'émission</label>
                <p>{selectedBon.dateEmission}</p>
              </div>
              <div>
                <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Date d'expiration</label>
                <p>{selectedBon.dateExpiration}</p>
              </div>
              <div>
                <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Statut</label>
                <p>
                  {selectedBon.expire ? (
                    <span className="badge badge-danger">🔴 Expiré</span>
                  ) : selectedBon.utilise ? (
                    <span className="badge badge-neutral">✅ Utilisé</span>
                  ) : (
                    <span className="badge badge-success">🟢 Actif</span>
                  )}
                </p>
              </div>
              <div>
                <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>ID Inscription</label>
                <p>{selectedBon.inscriptionId}</p>
              </div>
            </div>

            {selectedBon.observations && (
              <div style={{ marginTop: '16px' }}>
                <label style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Observations</label>
                <p style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', marginTop: '4px' }}>
                  {selectedBon.observations}
                </p>
              </div>
            )}

            {/* QR Code */}
            {selectedBon.codeQR && (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <label style={{ fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  📱 QR Code (Bancaire + Mobile Money)
                </label>
                <div style={{
                  background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px',
                  display: 'inline-block'
                }}>
                  <img
                    src={srcImageQr(selectedBon.codeQR)}
                    alt="QR Code Bon de Paiement"
                    style={{ width: '200px', height: '200px', imageRendering: 'pixelated' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <pre style={{ display: 'none', textAlign: 'left', fontSize: '0.75rem', maxHeight: '200px', overflow: 'auto', background: 'var(--bg-card)', padding: '8px', borderRadius: '8px', border: '1px solid #ddd' }}>
                    {selectedBon.contenuTexte || 'Contenu du QR indisponible'}
                  </pre>
                </div>
                <p style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Scannez pour voir les coordonnées bancaires et les instructions de paiement Mobile Money
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ marginTop: '12px' }}
                  onClick={async () => {
                    try {
                      const res = await api.get(`/api/bons-paiement/${selectedBon.id}/pdf`, { responseType: 'blob' });
                      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `bon_paiement_${selectedBon.numero}.pdf`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);
                    } catch (err) {
                      alert("Impossible de télécharger le PDF du bon de paiement.");
                    }
                  }}
                >
                  📄 Télécharger le PDF
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                className="btn btn-success"
                onClick={() => handleVerifier(selectedBon.numero)}
              >
                ✓ Vérifier
              </button>
              {!selectedBon.utilise && !selectedBon.expire && (
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    setShowDetail(false);
                    ouvrirAnnulation(selectedBon);
                  }}
                >
                  🚫 Annuler
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setShowDetail(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL ANNULATION ─── */}
      {showAnnuler && selectedBon && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1050
        }}>
          <div className="modal-content" style={{
            background: 'var(--bg-card)', borderRadius: '12px',
            padding: '24px', maxWidth: '450px', width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ marginTop: 0, color: '#c62828' }}>🚫 Annuler le Bon</h2>
            <p>Êtes-vous sûr de vouloir annuler le bon <strong>{selectedBon.numero}</strong> ?</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Cette action est irréversible. Le bon ne pourra plus être utilisé.
            </p>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Motif d'annulation <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                className="form-control"
                value={annulerMotif}
                onChange={(e) => setAnnulerMotif(e.target.value)}
                placeholder="Expliquez la raison de l'annulation..."
                rows={3}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowAnnuler(false)}>
                Non, garder
              </button>
              <button className="btn btn-danger" onClick={handleAnnuler}>
                Oui, annuler le bon
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
