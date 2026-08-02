// src/pages/admin/GestionVacations.jsx
// Gestion des vacations (Vacation Jour / Vacation Soir) : CRUD, affectation des cours,
// et validation des demandes d'inscription à une vacation.
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { vacationService } from '../../services/vacationService';
import '../Dashboard.css';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const FORM_INITIAL = {
  nom: '',
  type: 'JOUR',
  description: '',
  dateDebut: '',
  dateFin: '',
  fraisInscription: '',
  deviseFrais: 'USD',
  capaciteMax: '',
  anneeAcademiqueId: '',
};

const COURS_FORM_INITIAL = {
  coursId: '', promotionId: '', professeurId: '', jour: 'Lundi', heureDebut: '', heureFin: '', salle: '',
};

const STATUT_LABELS = {
  EN_ATTENTE: { label: 'En attente', className: 'badge-warning' },
  VALIDE: { label: 'Validée', className: 'badge-success' },
  REJETE: { label: 'Rejetée', className: 'badge-danger' },
};

export default function GestionVacations() {
  const { user } = useAuth();
  const universiteId = user?.universiteId;

  const [vacations, setVacations] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editionId, setEditionId] = useState(null);
  const [form, setForm] = useState(FORM_INITIAL);
  const [submitting, setSubmitting] = useState(false);

  const [confirmModal, setConfirmModal] = useState(null); // { type: 'archiver'|'supprimer', vacation }

  // Détail d'une vacation (cours + inscriptions)
  const [selectedVacation, setSelectedVacation] = useState(null);
  const [detailTab, setDetailTab] = useState('cours'); // 'cours' | 'inscriptions'
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [coursVacations, setCoursVacations] = useState([]);
  const [coursOptions, setCoursOptions] = useState([]);
  const [promotionOptions, setPromotionOptions] = useState([]);
  const [professeurOptions, setProfesseurOptions] = useState([]);
  const [coursForm, setCoursForm] = useState(COURS_FORM_INITIAL);
  const [optionsChargees, setOptionsChargees] = useState(false);

  const [inscriptions, setInscriptions] = useState([]);
  const [rejetModal, setRejetModal] = useState(null); // { inscription, motif }
  const [desinscrireModal, setDesinscrireModal] = useState(null); // { inscription }

  // ─── Chargement initial ────────────────────────────────────
  const chargerTout = useCallback(async () => {
    if (!universiteId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [vRes, aRes] = await Promise.all([
        vacationService.listerParUniversite(universiteId),
        api.get('/api/annees-academiques'),
      ]);
      setVacations(Array.isArray(vRes.data) ? vRes.data : []);
      setAnnees(Array.isArray(aRes.data) ? aRes.data : []);
    } catch (err) {
      setError("Erreur lors du chargement des vacations.");
    } finally {
      setLoading(false);
    }
  }, [universiteId]);

  useEffect(() => { chargerTout(); }, [chargerTout]);

  useEffect(() => {
    if (annees.length && !form.anneeAcademiqueId) {
      const active = annees.find(a => a.active);
      if (active) setForm(p => ({ ...p, anneeAcademiqueId: active.id.toString() }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annees]);

  // ─── Formulaire vacation ────────────────────────────────────
  const ouvrirCreation = () => {
    setEditionId(null);
    setForm({ ...FORM_INITIAL, anneeAcademiqueId: annees.find(a => a.active)?.id?.toString() || '' });
    setShowForm(true);
  };

  const ouvrirEdition = (v) => {
    setEditionId(v.id);
    setForm({
      nom: v.nom || '',
      type: v.type || 'JOUR',
      description: v.description || '',
      dateDebut: v.dateDebut || '',
      dateFin: v.dateFin || '',
      fraisInscription: v.fraisInscription ?? '',
      deviseFrais: v.deviseFrais || 'USD',
      capaciteMax: v.capaciteMax ?? '',
      anneeAcademiqueId: v.anneeAcademiqueId ? v.anneeAcademiqueId.toString() : '',
    });
    setShowForm(true);
  };

  const annulerFormulaire = () => {
    setShowForm(false);
    setEditionId(null);
    setForm(FORM_INITIAL);
  };

  const soumettreForm = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const payload = {
        nom: form.nom.trim(),
        type: form.type,
        description: form.description?.trim() || null,
        dateDebut: form.dateDebut,
        dateFin: form.dateFin,
        fraisInscription: form.fraisInscription !== '' ? parseFloat(form.fraisInscription) : null,
        deviseFrais: form.deviseFrais || 'USD',
        capaciteMax: form.capaciteMax !== '' ? parseInt(form.capaciteMax, 10) : null,
      };
      if (editionId) {
        await vacationService.modifier(editionId, payload);
        setMessage('✅ Vacation modifiée avec succès.');
      } else {
        if (!form.anneeAcademiqueId) {
          setError('Veuillez sélectionner une année académique.');
          setSubmitting(false);
          return;
        }
        await vacationService.creer(payload, universiteId, parseInt(form.anneeAcademiqueId, 10));
        setMessage('✅ Vacation créée avec succès.');
      }
      annulerFormulaire();
      await chargerTout();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.erreur || "Erreur lors de l'enregistrement de la vacation.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Actions rapides ────────────────────────────────────────
  const toggleInscriptions = async (v) => {
    setError(''); setMessage('');
    try {
      if (v.inscriptionsOuvertes) {
        await vacationService.fermerInscriptions(v.id);
        setMessage('✅ Inscriptions fermées.');
      } else {
        await vacationService.ouvrirInscriptions(v.id);
        setMessage('✅ Inscriptions ouvertes.');
      }
      await chargerTout();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Erreur lors du changement de statut des inscriptions.");
    }
  };

  const confirmerAction = async () => {
    if (!confirmModal) return;
    const { type, vacation } = confirmModal;
    setConfirmModal(null);
    setError(''); setMessage('');
    try {
      if (type === 'archiver') {
        await vacationService.archiver(vacation.id);
        setMessage('✅ Vacation archivée.');
      } else if (type === 'supprimer') {
        await vacationService.supprimer(vacation.id);
        setMessage('✅ Vacation supprimée.');
        if (selectedVacation?.id === vacation.id) setSelectedVacation(null);
      }
      await chargerTout();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'opération.");
    }
  };

  // ─── Détail : cours & inscriptions ──────────────────────────
  const chargerOptionsCours = useCallback(async () => {
    if (optionsChargees || !universiteId) return;
    try {
      const [cRes, pRes, uRes] = await Promise.all([
        api.get(`/api/cours/admin/${universiteId}`).catch(() => ({ data: [] })),
        api.get(`/api/promotions/universite/${universiteId}`).catch(() => ({ data: [] })),
        api.get('/api/utilisateurs', { params: { role: 'PROFESSEUR', universiteId } }).catch(() => ({ data: { utilisateurs: [] } })),
      ]);
      setCoursOptions(Array.isArray(cRes.data) ? cRes.data : []);
      setPromotionOptions(Array.isArray(pRes.data) ? pRes.data : []);
      setProfesseurOptions(Array.isArray(uRes.data?.utilisateurs) ? uRes.data.utilisateurs : []);
      setOptionsChargees(true);
    } catch {
      // silencieux : les listes resteront vides
    }
  }, [universiteId, optionsChargees]);

  const chargerDetailCours = async (vacationId) => {
    setLoadingDetail(true);
    try {
      const res = await vacationService.listerCours(vacationId);
      setCoursVacations(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Erreur lors du chargement des cours de la vacation.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const chargerDetailInscriptions = async (vacationId) => {
    setLoadingDetail(true);
    try {
      const res = await vacationService.listerInscriptions(vacationId);
      setInscriptions(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Erreur lors du chargement des inscriptions.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const ouvrirDetail = async (v) => {
    setSelectedVacation(v);
    setDetailTab('cours');
    setError(''); setMessage('');
    await chargerOptionsCours();
    await chargerDetailCours(v.id);
  };

  const fermerDetail = () => {
    setSelectedVacation(null);
    setCoursVacations([]);
    setInscriptions([]);
    setCoursForm(COURS_FORM_INITIAL);
  };

  const changerOnglet = async (tab) => {
    setDetailTab(tab);
    if (!selectedVacation) return;
    if (tab === 'cours') await chargerDetailCours(selectedVacation.id);
    if (tab === 'inscriptions') await chargerDetailInscriptions(selectedVacation.id);
  };

  const ajouterCoursVacation = async (e) => {
    e.preventDefault();
    setError('');
    if (!coursForm.coursId || !coursForm.promotionId || !coursForm.jour || !coursForm.heureDebut || !coursForm.heureFin) {
      setError('Veuillez remplir les champs obligatoires (cours, promotion, jour, heures).');
      return;
    }
    try {
      const payload = {
        jour: coursForm.jour,
        heureDebut: coursForm.heureDebut,
        heureFin: coursForm.heureFin,
        salle: coursForm.salle?.trim() || null,
      };
      await vacationService.ajouterCours(
        selectedVacation.id,
        payload,
        parseInt(coursForm.coursId, 10),
        coursForm.professeurId ? parseInt(coursForm.professeurId, 10) : undefined,
        parseInt(coursForm.promotionId, 10)
      );
      setMessage('✅ Cours ajouté à la vacation.');
      setCoursForm(COURS_FORM_INITIAL);
      await chargerDetailCours(selectedVacation.id);
      await chargerTout();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.erreur || "Erreur lors de l'ajout du cours.");
    }
  };

  const supprimerCoursVacation = async (coursVacationId) => {
    setError(''); setMessage('');
    try {
      await vacationService.supprimerCours(coursVacationId);
      setMessage('✅ Cours retiré de la vacation.');
      await chargerDetailCours(selectedVacation.id);
      await chargerTout();
    } catch {
      setError('Erreur lors du retrait du cours.');
    }
  };

  const validerInscriptionVacation = async (inscriptionId) => {
    setError(''); setMessage('');
    try {
      await vacationService.validerInscription(inscriptionId);
      setMessage('✅ Inscription validée.');
      await chargerDetailInscriptions(selectedVacation.id);
    } catch {
      setError("Erreur lors de la validation de l'inscription.");
    }
  };

  const confirmerRejet = async () => {
    if (!rejetModal) return;
    const { inscription, motif } = rejetModal;
    setRejetModal(null);
    setError(''); setMessage('');
    try {
      await vacationService.rejeterInscription(inscription.id, motif?.trim() || 'Non spécifié');
      setMessage('✅ Inscription rejetée.');
      await chargerDetailInscriptions(selectedVacation.id);
    } catch {
      setError("Erreur lors du rejet de l'inscription.");
    }
  };

  const confirmerDesinscription = async () => {
    if (!desinscrireModal) return;
    const { inscription } = desinscrireModal;
    setDesinscrireModal(null);
    setError(''); setMessage('');
    try {
      await vacationService.desinscrireEtudiant(inscription.id);
      setMessage('✅ Étudiant désinscrit de la vacation.');
      await chargerDetailInscriptions(selectedVacation.id);
    } catch {
      setError('Erreur lors de la désinscription.');
    }
  };

  // ─── Rendu ───────────────────────────────────────────────────
  if (loading) return <div className="loading">Chargement...</div>;

  if (!universiteId) {
    return (
      <div className="page">
        <h1 className="page-title">🌓 Gestion des vacations</h1>
        <div className="card">
          <p className="empty-state">Aucune université associée à votre compte.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🌓 Gestion des vacations (Jour / Soir)</h1>
          <p className="page-sub">Créez et gérez les vacations Jour et Soir, affectez des cours et validez les inscriptions.</p>
        </div>
        <button className="btn-primary" onClick={showForm ? annulerFormulaire : ouvrirCreation}>
          {showForm ? 'Annuler' : '➕ Nouvelle vacation'}
        </button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">{editionId ? 'Modifier la vacation' : 'Nouvelle vacation'}</h2>
          <form onSubmit={soumettreForm} className="form-grid">
            <div className="form-group">
              <label>Nom *</label>
              <input
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                placeholder="Ex: Vacation Jour 2025-2026"
                required
              />
            </div>
            <div className="form-group">
              <label>Type *</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="JOUR">Jour</option>
                <option value="SOIR">Soir</option>
              </select>
            </div>
            <div className="form-group">
              <label>Année académique *</label>
              <select
                value={form.anneeAcademiqueId}
                onChange={e => setForm({ ...form, anneeAcademiqueId: e.target.value })}
                disabled={!!editionId}
                required={!editionId}
              >
                <option value="">-- Sélectionner --</option>
                {annees.map(a => <option key={a.id} value={a.id}>{a.libelle} {a.active ? '(Active)' : ''}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date de début *</label>
              <input type="date" value={form.dateDebut} onChange={e => setForm({ ...form, dateDebut: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Date de fin *</label>
              <input type="date" value={form.dateFin} onChange={e => setForm({ ...form, dateFin: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Capacité maximale</label>
              <input type="number" min="0" value={form.capaciteMax} onChange={e => setForm({ ...form, capaciteMax: e.target.value })} placeholder="Ex: 200" />
            </div>
            <div className="form-group">
              <label>Frais d'inscription</label>
              <input type="number" min="0" step="0.01" value={form.fraisInscription} onChange={e => setForm({ ...form, fraisInscription: e.target.value })} placeholder="Ex: 50" />
            </div>
            <div className="form-group">
              <label>Devise</label>
              <select value={form.deviseFrais} onChange={e => setForm({ ...form, deviseFrais: e.target.value })}>
                <option value="USD">USD</option>
                <option value="CDF">CDF</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="3" />
            </div>
            <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10 }}>
              <button type="button" className="btn-outline" onClick={annulerFormulaire}>Annuler</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Enregistrement...' : (editionId ? '💾 Modifier' : '💾 Créer la vacation')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">Vacations existantes ({vacations.length})</h2>
        {vacations.length === 0 ? (
          <p className="empty-state">Aucune vacation enregistrée pour votre université.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Période</th>
                <th>Capacité</th>
                <th>Inscrits</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vacations.map(v => (
                <tr key={v.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{v.nom}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v.anneeAcademiqueLibelle}</div>
                  </td>
                  <td>
                    <span className={`badge ${v.type === 'JOUR' ? 'badge-success' : 'badge-neutral'}`}>
                      {v.type === 'JOUR' ? '☀️ Jour' : '🌙 Soir'}
                    </span>
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {v.dateDebut ? new Date(v.dateDebut).toLocaleDateString('fr-FR') : '—'} → {v.dateFin ? new Date(v.dateFin).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td>{v.capaciteMax ?? '—'}</td>
                  <td>{v.nbEtudiantsInscrits ?? 0}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className={`badge ${v.actif ? 'badge-success' : 'badge-danger'}`}>{v.actif ? 'Active' : 'Archivée'}</span>
                      <span className={`badge ${v.inscriptionsOuvertes ? 'badge-success' : 'badge-neutral'}`}>
                        {v.inscriptionsOuvertes ? 'Inscriptions ouvertes' : 'Inscriptions fermées'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => ouvrirDetail(v)}>
                        Gérer
                      </button>
                      <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => ouvrirEdition(v)}>
                        ✏️ Modifier
                      </button>
                      <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => toggleInscriptions(v)}>
                        {v.inscriptionsOuvertes ? 'Fermer' : 'Ouvrir'} insc.
                      </button>
                      {v.actif && (
                        <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => setConfirmModal({ type: 'archiver', vacation: v })}>
                          🗄️ Archiver
                        </button>
                      )}
                      <button className="btn-danger" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => setConfirmModal({ type: 'supprimer', vacation: v })}>
                        🗑️ Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── Panneau détail : cours & inscriptions ─────────────── */}
      {selectedVacation && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="page-header" style={{ marginBottom: 12 }}>
            <div>
              <h2 className="card-title" style={{ margin: 0 }}>
                {selectedVacation.type === 'JOUR' ? '☀️' : '🌙'} {selectedVacation.nom}
              </h2>
              <p className="page-sub" style={{ margin: '4px 0 0' }}>Affectation des cours et validation des inscriptions</p>
            </div>
            <button className="btn-outline" onClick={fermerDetail}>Fermer</button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              className={detailTab === 'cours' ? 'btn-primary' : 'btn-outline'}
              onClick={() => changerOnglet('cours')}
            >
              📚 Cours assignés ({coursVacations.length})
            </button>
            <button
              className={detailTab === 'inscriptions' ? 'btn-primary' : 'btn-outline'}
              onClick={() => changerOnglet('inscriptions')}
            >
              📋 Demandes d'inscription
            </button>
          </div>

          {loadingDetail ? (
            <div className="loading">Chargement...</div>
          ) : detailTab === 'cours' ? (
            <div>
              <form onSubmit={ajouterCoursVacation} className="form-grid" style={{ marginBottom: 20 }}>
                <div className="form-group">
                  <label>Cours *</label>
                  <select value={coursForm.coursId} onChange={e => setCoursForm({ ...coursForm, coursId: e.target.value })}>
                    <option value="">-- Sélectionner --</option>
                    {coursOptions.map(c => <option key={c.id} value={c.id}>{c.code ? `${c.code} — ` : ''}{c.titre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Promotion *</label>
                  <select value={coursForm.promotionId} onChange={e => setCoursForm({ ...coursForm, promotionId: e.target.value })}>
                    <option value="">-- Sélectionner --</option>
                    {promotionOptions.map(p => <option key={p.id} value={p.id}>{p.libelle}{p.code ? ` (${p.code})` : ''}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Professeur</label>
                  <select value={coursForm.professeurId} onChange={e => setCoursForm({ ...coursForm, professeurId: e.target.value })}>
                    <option value="">-- Aucun --</option>
                    {professeurOptions.map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Jour *</label>
                  <select value={coursForm.jour} onChange={e => setCoursForm({ ...coursForm, jour: e.target.value })}>
                    {JOURS.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Heure début *</label>
                  <input type="time" value={coursForm.heureDebut} onChange={e => setCoursForm({ ...coursForm, heureDebut: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Heure fin *</label>
                  <input type="time" value={coursForm.heureFin} onChange={e => setCoursForm({ ...coursForm, heureFin: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Salle</label>
                  <input value={coursForm.salle} onChange={e => setCoursForm({ ...coursForm, salle: e.target.value })} placeholder="Ex: Salle A1" />
                </div>
                <div style={{ gridColumn: '1 / span 2', display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" className="btn-primary">➕ Ajouter le cours à la vacation</button>
                </div>
              </form>

              {coursVacations.length === 0 ? (
                <p className="empty-state">Aucun cours affecté à cette vacation.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Cours</th>
                      <th>Promotion</th>
                      <th>Professeur</th>
                      <th>Horaire</th>
                      <th>Salle</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coursVacations.map(cv => (
                      <tr key={cv.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{cv.coursTitre}</div>
                          {cv.coursCode && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cv.coursCode}</div>}
                        </td>
                        <td>{cv.promotionNom || '—'}</td>
                        <td>{cv.professeurNom ? `${cv.professeurPrenom || ''} ${cv.professeurNom}` : '—'}</td>
                        <td>{cv.jour} {cv.heureDebut}–{cv.heureFin}</td>
                        <td>{cv.salle || '—'}</td>
                        <td>
                          <button className="btn-danger" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => supprimerCoursVacation(cv.id)}>
                            Retirer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div>
              {inscriptions.length === 0 ? (
                <p className="empty-state">Aucune demande d'inscription pour cette vacation.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Étudiant</th>
                      <th>Promotion</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inscriptions.map(ins => {
                      const st = STATUT_LABELS[ins.statut] || STATUT_LABELS.EN_ATTENTE;
                      return (
                        <tr key={ins.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{ins.etudiantPrenom} {ins.etudiantNom}</div>
                            {ins.etudiantMatricule && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ins.etudiantMatricule}</div>}
                          </td>
                          <td>{ins.promotionNom || '—'}</td>
                          <td><span className={`badge ${st.className}`}>{st.label}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {ins.statut === 'EN_ATTENTE' && (
                                <>
                                  <button className="btn-success" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => validerInscriptionVacation(ins.id)}>
                                    ✅ Valider
                                  </button>
                                  <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => setRejetModal({ inscription: ins, motif: '' })}>
                                    ❌ Rejeter
                                  </button>
                                </>
                              )}
                              <button className="btn-danger" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => setDesinscrireModal({ inscription: ins })}>
                                Désinscrire
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Modal de confirmation : archiver / supprimer vacation ─── */}
      {confirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 400, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>
              {confirmModal.type === 'archiver' ? '🗄️ Archiver la vacation' : '🗑️ Supprimer la vacation'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>
              {confirmModal.type === 'archiver'
                ? `Archiver "${confirmModal.vacation.nom}" ? Elle ne sera plus active mais restera consultable.`
                : `Supprimer définitivement "${confirmModal.vacation.nom}" ? Cette action est irréversible.`}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setConfirmModal(null)}>Annuler</button>
              <button className={confirmModal.type === 'supprimer' ? 'btn-danger' : 'btn-primary'} onClick={confirmerAction}>
                {confirmModal.type === 'archiver' ? 'Archiver' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal de rejet d'inscription (avec motif) ─────────────── */}
      {rejetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 420, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>❌ Rejeter la demande d'inscription</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12 }}>
              {rejetModal.inscription.etudiantPrenom} {rejetModal.inscription.etudiantNom}
            </p>
            <div className="form-group">
              <label>Motif du rejet</label>
              <textarea
                rows="3"
                value={rejetModal.motif}
                onChange={e => setRejetModal({ ...rejetModal, motif: e.target.value })}
                placeholder="Ex: Dossier incomplet, capacité atteinte..."
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn-outline" onClick={() => setRejetModal(null)}>Annuler</button>
              <button className="btn-danger" onClick={confirmerRejet}>Rejeter</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal de désinscription ─────────────────────────────── */}
      {desinscrireModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 400, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>🗑️ Désinscrire l'étudiant</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>
              Désinscrire {desinscrireModal.inscription.etudiantPrenom} {desinscrireModal.inscription.etudiantNom} de cette vacation ?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setDesinscrireModal(null)}>Annuler</button>
              <button className="btn-danger" onClick={confirmerDesinscription}>Désinscrire</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
