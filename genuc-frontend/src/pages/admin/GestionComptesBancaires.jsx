// src/pages/admin/GestionComptesBancaires.jsx
/**
 * 🏦 Coordonnées bancaires de l'université
 * Comptes affichés sur le QR code et le PDF des bons de paiement.
 * Extrait de GestionBonsDePaiement (qui n'en gardait qu'un raccourci) pour
 * que la liste soit une vraie page, pas une boîte de dialogue.
 */
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import informationBancaireService from '../../services/informationBancaireService';
import { BANQUES_SEULES } from '../../constants/banquesRdc';
import toast from 'react-hot-toast';
import '../Dashboard.css';

const COMPTE_VIDE = {
  nomBanque: '', intituleCompte: '', numeroCompte: '', devise: 'USD',
  codeBanque: '', swiftCode: '', iban: '', instructionsPaiement: '',
};

export default function GestionComptesBancaires() {
  const { user } = useAuth();
  const universiteId = user?.universiteId;

  const [comptes, setComptes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [compteForm, setCompteForm] = useState(COMPTE_VIDE);
  const [editingCompteId, setEditingCompteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const chargerComptes = useCallback(async () => {
    if (!universiteId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await informationBancaireService.lister(universiteId);
      setComptes(data);
    } catch (err) {
      toast.error('Erreur lors du chargement des coordonnées bancaires');
    } finally {
      setLoading(false);
    }
  }, [universiteId]);

  useEffect(() => {
    chargerComptes();
  }, [chargerComptes]);

  const ouvrirNouveauCompte = () => {
    setEditingCompteId(null);
    setCompteForm(COMPTE_VIDE);
    setShowForm(true);
  };

  const ouvrirEditionCompte = (compte) => {
    setEditingCompteId(compte.id);
    setCompteForm({
      nomBanque: compte.nomBanque || '', intituleCompte: compte.intituleCompte || '',
      numeroCompte: compte.numeroCompte || '', devise: compte.devise || 'USD',
      codeBanque: compte.codeBanque || '', swiftCode: compte.swiftCode || '',
      iban: compte.iban || '', instructionsPaiement: compte.instructionsPaiement || '',
    });
    setShowForm(true);
  };

  const handleSaveCompte = async (e) => {
    e.preventDefault();
    if (!compteForm.nomBanque.trim() || !compteForm.intituleCompte.trim() || !compteForm.numeroCompte.trim()) {
      toast.error('Banque, titulaire et numéro de compte sont obligatoires');
      return;
    }
    setSaving(true);
    try {
      if (editingCompteId) {
        await informationBancaireService.modifier(editingCompteId, compteForm);
        toast.success('Coordonnées bancaires mises à jour');
      } else {
        await informationBancaireService.creer({ ...compteForm, universiteId });
        toast.success('Coordonnées bancaires ajoutées');
      }
      setShowForm(false);
      chargerComptes();
    } catch (err) {
      toast.error(err.response?.data?.erreur || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleSupprimerCompte = async (id) => {
    if (!window.confirm('Supprimer ces coordonnées bancaires ?')) return;
    try {
      await informationBancaireService.supprimer(id);
      toast.success('Coordonnées bancaires supprimées');
      chargerComptes();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>🏦 Coordonnées bancaires</h1>
        <p className="text-muted">
          Ces comptes apparaissent sur le QR code et le PDF des bons de paiement.
        </p>
      </div>

      <div className="dashboard-toolbar" style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={ouvrirNouveauCompte}>
          ➕ Ajouter un compte
        </button>
      </div>

      {loading ? (
        <p className="text-muted">Chargement…</p>
      ) : comptes.length === 0 ? (
        <div className="empty-state text-center py-4">
          <p className="text-muted">Aucun compte bancaire configuré pour cette université.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Banque</th>
                <th>Titulaire</th>
                <th>N° Compte</th>
                <th>Devise</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {comptes.map((compte) => (
                <tr key={compte.id}>
                  <td>{compte.nomBanque}</td>
                  <td>{compte.intituleCompte}</td>
                  <td>{compte.numeroCompte}</td>
                  <td>{compte.devise}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-sm btn-info" onClick={() => ouvrirEditionCompte(compte)} title="Modifier">✏️</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleSupprimerCompte(compte.id)} title="Supprimer">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Boîte de dialogue : ajouter/modifier un seul compte (formulaire court) ─── */}
      {showForm && (
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
              <h2 style={{ margin: 0 }}>{editingCompteId ? '✏️ Modifier le compte' : '➕ Nouveau compte bancaire'}</h2>
              <button className="btn-close" onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveCompte}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Banque <span style={{ color: 'red' }}>*</span>
                </label>
                {/* Saisie libre + suggestions : une banque absente de la liste reste
                    saisissable, mais les noms courants gardent une orthographe unique —
                    ils sont imprimés tels quels sur le bon présenté au guichet. */}
                <input
                  className="form-control"
                  list="banques-rdc"
                  value={compteForm.nomBanque}
                  onChange={(e) => setCompteForm({ ...compteForm, nomBanque: e.target.value })}
                  placeholder="Ex : Equity BCDC, RawBank, UBA, TMB…"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
                <datalist id="banques-rdc">
                  {BANQUES_SEULES.map((banque) => (
                    <option key={banque.code} value={banque.nom} />
                  ))}
                </datalist>
                <small style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  Ce nom apparaîtra sur le bon de caisse de l'étudiant. Reprendre un nom
                  du référentiel affiche aussi le logo de la banque dans l'application.
                </small>
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Titulaire du compte <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  className="form-control"
                  value={compteForm.intituleCompte}
                  onChange={(e) => setCompteForm({ ...compteForm, intituleCompte: e.target.value })}
                  placeholder="Ex : UNIVERSITÉ DE KINSHASA - FRAIS ACADEMIQUES"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                    Numéro de compte <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    className="form-control"
                    value={compteForm.numeroCompte}
                    onChange={(e) => setCompteForm({ ...compteForm, numeroCompte: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Devise</label>
                  <select
                    className="form-control"
                    value={compteForm.devise}
                    onChange={(e) => setCompteForm({ ...compteForm, devise: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                  >
                    <option value="USD">USD</option>
                    <option value="CDF">CDF</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Code banque</label>
                  <input
                    className="form-control"
                    value={compteForm.codeBanque}
                    onChange={(e) => setCompteForm({ ...compteForm, codeBanque: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>SWIFT/BIC</label>
                  <input
                    className="form-control"
                    value={compteForm.swiftCode}
                    onChange={(e) => setCompteForm({ ...compteForm, swiftCode: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>IBAN</label>
                <input
                  className="form-control"
                  value={compteForm.iban}
                  onChange={(e) => setCompteForm({ ...compteForm, iban: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Instructions de paiement</label>
                <textarea
                  className="form-control"
                  value={compteForm.instructionsPaiement}
                  onChange={(e) => setCompteForm({ ...compteForm, instructionsPaiement: e.target.value })}
                  placeholder="Ex : Indiquer le numéro du bon en référence du virement"
                  rows={3}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement...' : '💾 Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
