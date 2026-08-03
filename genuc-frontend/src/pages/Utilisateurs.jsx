// src/pages/Utilisateurs.jsx — Gestion des utilisateurs (superadmin / admin d'université)
// Créer, rechercher, désactiver/réactiver et reconfigurer un compte (rôle, université).
// Le rôle détermine les informations accessibles : le restreindre retire les droits de
// consultation correspondants.
import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

// Liste complète des rôles attribuables. Chaque `id` DOIT correspondre exactement
// à une valeur de l'enum backend `RoleEnum` : le controller valide via
// `RoleEnum.valueOf(role)` et rejette tout rôle inconnu (« Rôle invalide »).
// Les alias anglais de l'enum (DEAN, PROFESSOR, REGISTRAR, …) sont volontairement
// omis car ils font doublon avec les rôles français ci-dessous.
const ROLES = [
  // ── Direction & Administration ──
  { id: 'ADMIN_UNIVERSITE',     label: "Administrateur d'Université" },
  { id: 'ADMIN_SYSTEME',        label: 'Administrateur Système' },
  { id: 'RECTEUR',              label: 'Recteur' },
  { id: 'DOYEN',                label: 'Doyen' },
  { id: 'SECRETAIRE_ACADEMIQUE', label: 'Secrétaire Académique' },
  // ── Académique & Enseignement ──
  { id: 'CHEF_DEPARTEMENT',     label: 'Chef de Département (validation pédagogique)' },
  { id: 'CHEF_PROMOTION',       label: 'Chef de Promotion' },
  { id: 'COORDINATEUR',         label: 'Coordinateur' },
  { id: 'PROFESSEUR',           label: 'Professeur (saisie des notes & cours)' },
  { id: 'ENSEIGNANT',           label: 'Enseignant' },
  { id: 'CORRECTEUR',           label: 'Correcteur' },
  // ── Finance ──
  { id: 'CAISSIER',             label: '💰 Caissier (validation des paiements)' },
  { id: 'AGENT',                label: 'Agent (caisse / finance)' },
  { id: 'COMPTABLE',            label: 'Comptable' },
  // ── Support & Services ──
  { id: 'RH',                   label: 'Ressources Humaines' },
  { id: 'BIBLIOTHECAIRE',       label: 'Bibliothécaire' },
  { id: 'APPARITEUR',           label: 'Appariteur' },
  { id: 'SERVICE_SOCIAL',       label: 'Service Social' },
  { id: 'AUDITEUR',             label: 'Auditeur' },
  { id: 'PERSONNEL',            label: 'Personnel' },
  // ── Autres ──
  { id: 'ETUDIANT',             label: 'Étudiant' },
  { id: 'PARENT',               label: 'Parent' },
  { id: 'INVITE',               label: 'Invité' },
];

// Apparence commune à toutes les listes déroulantes de la barre de filtres.
const styleSelect = {
  padding: '9px 12px', fontSize: 13,
  border: '1.5px solid var(--border-color)', borderRadius: 9,
  background: 'var(--bg-card)', color: 'var(--text-primary)',
  maxWidth: '100%',
};

const badgeRole = (role) =>
  role === 'SUPER_ADMIN' ? 'badge-danger'
  : role === 'ADMIN_UNIVERSITE' ? 'badge-success'
  : 'badge-neutral';

export default function Utilisateurs() {
  const { user } = useAuth();
  const estSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [utilisateurs, setUtilisateurs] = useState([]);
  const [universites, setUniversites]   = useState([]);
  const [onglet, setOnglet]             = useState('liste');
  const [message, setMessage]           = useState('');
  const [erreur, setErreur]             = useState('');
  const [chargement, setChargement]     = useState(false);

  // Filtres
  const [recherche, setRecherche]       = useState('');
  const [champRecherche, setChampRecherche] = useState('tout'); // tout | nom | email
  const [filtreRole, setFiltreRole]     = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtreUniversite, setFiltreUniversite] = useState('');
  const [filtreDepartement, setFiltreDepartement] = useState('');
  const [departements, setDepartements] = useState([]);

  // Tri
  const [tri, setTri] = useState('nom-asc');

  // Édition
  const [enEdition, setEnEdition]       = useState(null); // utilisateur en cours d'édition
  const [editForm, setEditForm]         = useState({ role: '', universiteId: '' });
  const [actionEnCours, setActionEnCours] = useState(null); // id de l'utilisateur en cours d'action

  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', motDePasse: '', role: 'PROFESSEUR', universiteId: '',
  });

  useEffect(() => {
    chargerUtilisateurs();
    api.get('/api/universites/public')
      .then(r => setUniversites(Array.isArray(r.data) ? r.data : []))
      .catch(() => setErreur('Impossible de récupérer la liste des universités.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage
  }, []);

  const chargerUtilisateurs = () => {
    setChargement(true);
    setErreur('');
    api.get('/api/utilisateurs')
      .then(r => {
        const data = r.data;
        if (Array.isArray(data)) setUtilisateurs(data);
        else if (data && Array.isArray(data.utilisateurs)) setUtilisateurs(data.utilisateurs);
        else setUtilisateurs([]);
      })
      .catch(() => setErreur('Erreur lors du chargement des utilisateurs. Vérifiez vos privilèges.'))
      .finally(() => setChargement(false));
  };

  const nomUniversite = (id) =>
    universites.find(u => u.id === id)?.nom
    || universites.find(u => String(u.id) === String(id))?.nom;

  const nomDepartement = (id) =>
    departements.find(d => String(d.id) === String(id))?.nom;

  // Les départements dépendent de l'université choisie : on ne peut pas les
  // charger tous d'avance (l'API les expose par établissement). Le filtre
  // « Département » n'a donc de sens qu'une fois une université sélectionnée.
  useEffect(() => {
    if (!filtreUniversite) {
      setDepartements([]);
      setFiltreDepartement('');
      return;
    }
    api.get(`/api/universites/public/${filtreUniversite}/departements`)
      .then(r => setDepartements(Array.isArray(r.data) ? r.data : []))
      .catch(() => setDepartements([]));
    setFiltreDepartement('');
  }, [filtreUniversite]);

  const nomComplet = (u) =>
    (u.nomComplet || `${u.prenom || ''} ${u.nom || ''}`.trim() || '').toLowerCase();

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();

    const filtres = utilisateurs.filter(u => {
      if (filtreRole && u.role !== filtreRole) return false;
      if (filtreStatut === 'actif' && !u.actif) return false;
      if (filtreStatut === 'inactif' && u.actif) return false;
      if (filtreUniversite && String(u.universiteId) !== String(filtreUniversite)) return false;
      if (filtreDepartement && String(u.departementId) !== String(filtreDepartement)) return false;
      if (!q) return true;
      // Le champ de recherche peut être restreint au nom ou à l'adresse afin
      // qu'un terme présent dans les deux ne ramène pas tout.
      if (champRecherche === 'nom') return nomComplet(u).includes(q);
      if (champRecherche === 'email') return (u.email || '').toLowerCase().includes(q);
      return `${nomComplet(u)} ${(u.email || '').toLowerCase()}`.includes(q);
    });

    // `localeCompare` gère les accents (Émile après Edouard, pas à la fin).
    const texte = (v) => (v || '').toString().toLowerCase();
    const comparateurs = {
      'nom-asc':   (a, b) => nomComplet(a).localeCompare(nomComplet(b), 'fr'),
      'nom-desc':  (a, b) => nomComplet(b).localeCompare(nomComplet(a), 'fr'),
      'email-asc': (a, b) => texte(a.email).localeCompare(texte(b.email), 'fr'),
      'email-desc':(a, b) => texte(b.email).localeCompare(texte(a.email), 'fr'),
      'role-asc':  (a, b) => texte(a.role).localeCompare(texte(b.role), 'fr'),
      'universite-asc': (a, b) =>
        texte(nomUniversite(a.universiteId)).localeCompare(texte(nomUniversite(b.universiteId)), 'fr'),
      'departement-asc': (a, b) =>
        texte(nomDepartement(a.departementId)).localeCompare(texte(nomDepartement(b.departementId)), 'fr'),
      'statut-asc': (a, b) => Number(b.actif) - Number(a.actif),
    };

    // Copie avant tri : `sort` modifie le tableau en place, et trier
    // `utilisateurs` directement ferait muter l'état.
    return [...filtres].sort(comparateurs[tri] || comparateurs['nom-asc']);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nomUniversite/nomDepartement dérivent de universites/departements, déjà listés
  }, [utilisateurs, recherche, champRecherche, filtreRole, filtreStatut,
      filtreUniversite, filtreDepartement, tri, universites, departements]);

  // ─── Activer / Désactiver ─────────────────────────────────────
  const basculerStatut = async (u) => {
    if (u.email === user?.email) {
      setErreur('Vous ne pouvez pas désactiver votre propre compte.');
      return;
    }
    const verbe = u.actif ? 'désactiver' : 'réactiver';
    if (u.actif && !window.confirm(
      `Désactiver le compte de ${u.nomComplet || u.email} ?\n` +
      `L'utilisateur ne pourra plus se connecter ni consulter aucune information.`
    )) return;

    setActionEnCours(u.id);
    setMessage(''); setErreur('');
    try {
      await api.patch(`/api/utilisateurs/${u.id}/${u.actif ? 'desactiver' : 'activer'}`);
      setMessage(`Compte ${u.actif ? 'désactivé' : 'réactivé'} : ${u.nomComplet || u.email}.`);
      chargerUtilisateurs();
    } catch (err) {
      setErreur(err.response?.data?.erreur || `Impossible de ${verbe} ce compte.`);
    } finally {
      setActionEnCours(null);
    }
  };

  // ─── Suppression définitive (hard delete) ─────────────────────
  const supprimerDefinitif = async (u) => {
    if (u.email === user?.email) {
      setErreur('Vous ne pouvez pas supprimer votre propre compte.');
      return;
    }
    if (!window.confirm(
      `⚠️ Supprimer DÉFINITIVEMENT ${u.nomComplet || u.email} ?\n\n` +
      `Cette action est IRRÉVERSIBLE et efface TOUTE trace de cette personne : le compte, ` +
      `mais aussi tout dossier d'inscription, étudiant et inscription portant le même email ` +
      `(${u.email}), avec leurs paiements/notes. L'email redeviendra réutilisable.`
    )) return;

    setActionEnCours(u.id);
    setMessage(''); setErreur('');
    try {
      await api.delete(`/api/utilisateurs/${u.id}/definitif`);
      setMessage(`Compte supprimé définitivement : ${u.nomComplet || u.email}.`);
      chargerUtilisateurs();
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Impossible de supprimer ce compte.');
    } finally {
      setActionEnCours(null);
    }
  };

  // ─── Édition rôle / université ────────────────────────────────
  const ouvrirEdition = (u) => {
    setMessage(''); setErreur('');
    setEnEdition(u);
    setEditForm({ role: u.role || '', universiteId: u.universiteId ?? '' });
  };

  const enregistrerEdition = async (e) => {
    e.preventDefault();
    setActionEnCours(enEdition.id);
    try {
      await api.put(`/api/utilisateurs/${enEdition.id}`, {
        role: editForm.role || null,
        universiteId: editForm.universiteId ? parseInt(editForm.universiteId, 10) : null,
        // IMPORTANT : le backend applique `actif` tel quel (booléen primitif) —
        // l'omettre désactiverait silencieusement le compte.
        actif: enEdition.actif,
      });
      setMessage(`Compte reconfiguré : ${enEdition.nomComplet || enEdition.email}. Le nouveau rôle définit les informations accessibles.`);
      setEnEdition(null);
      chargerUtilisateurs();
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Échec de la modification du compte.');
    } finally {
      setActionEnCours(null);
    }
  };

  // ─── Création ─────────────────────────────────────────────────
  const soumettre = (e) => {
    e.preventDefault();
    setErreur(''); setMessage('');

    if (form.role !== 'SUPER_ADMIN' && !form.universiteId) {
      setErreur("Veuillez sélectionner une université d'affectation.");
      return;
    }

    // Détection immédiate d'un doublon d'email parmi les comptes déjà chargés
    // (le backend refuse de toute façon, mais autant le dire avant l'envoi).
    const emailSaisi = form.email.trim().toLowerCase();
    const doublon = utilisateurs.find(u => (u.email || '').toLowerCase() === emailSaisi);
    if (doublon) {
      setErreur(`L'email ${emailSaisi} est déjà utilisé par le compte de ${doublon.nomComplet || doublon.email} (${doublon.role}). Utilisez une autre adresse, ou reconfigurez le compte existant depuis la liste.`);
      return;
    }

    const donnees = { ...form, universiteId: form.universiteId ? parseInt(form.universiteId, 10) : null };

    api.post('/api/utilisateurs', donnees)
      .then(() => {
        setMessage(`Compte utilisateur créé avec succès pour ${form.prenom} ${form.nom}.`);
        setForm({ nom: '', prenom: '', email: '', motDePasse: '', role: 'PROFESSEUR', universiteId: '' });
        chargerUtilisateurs();
        setOnglet('liste');
      })
      .catch(err => setErreur(err.response?.data?.erreur || err.response?.data?.message
        || "Échec de la création du compte. L'adresse email est peut-être déjà utilisée."));
  };

  return (
    <div className="page">
      {/* `pleine-largeur` fait toucher la bande au bord de la barre latérale à
          gauche et au bord de la fenêtre à droite (voir Dashboard.css). */}
      <div className="page-header pleine-largeur">
        <div>
          <h1 className="page-title">Gestion des utilisateurs</h1>
          <p className="page-sub">
            Créez, désactivez ou reconfigurez les comptes. Le rôle attribué détermine
            les informations que l'utilisateur a le droit de consulter.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button className={`btn-outline ${onglet === 'liste' ? 'active' : ''}`}
                style={{ background: onglet === 'liste' ? '#0B1F4A' : '', color: onglet === 'liste' ? 'white' : '' }}
                onClick={() => setOnglet('liste')}>
          👥 Liste des utilisateurs
        </button>
        <button className={`btn-outline ${onglet === 'creer' ? 'active' : ''}`}
                style={{ background: onglet === 'creer' ? '#0B1F4A' : '', color: onglet === 'creer' ? 'white' : '' }}
                onClick={() => setOnglet('creer')}>
          ➕ Créer un nouvel accès
        </button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {erreur && <div className="alert-erreur" onClick={() => setErreur('')}>{erreur}</div>}

      {onglet === 'liste' && (
        <div className="card">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
            <input
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              placeholder="🔎 Rechercher par nom ou email…"
              style={{
                flex: '1 1 240px', padding: '9px 14px', fontSize: 13,
                border: '1.5px solid var(--border-color)', borderRadius: 9,
                background: 'var(--bg-card)', color: 'var(--text-primary)',
              }}
            />
            <select value={filtreRole} onChange={e => setFiltreRole(e.target.value)}
                    style={styleSelect} aria-label="Filtrer par rôle">
              <option value="">Tous les rôles</option>
              {estSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
              {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
            <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
                    style={styleSelect}>
              <option value="">Tous les statuts</option>
              <option value="actif">✅ Actifs</option>
              <option value="inactif">🚫 Désactivés</option>
            </select>

            {/* Restreint la recherche à un seul champ : un terme présent à la
                fois dans un nom et dans une adresse ne ramène plus tout. */}
            <select value={champRecherche} onChange={e => setChampRecherche(e.target.value)}
                    style={styleSelect} aria-label="Champ de recherche">
              <option value="tout">🔎 Nom et email</option>
              <option value="nom">🔎 Nom seulement</option>
              <option value="email">🔎 Email seulement</option>
            </select>

            <select value={filtreUniversite} onChange={e => setFiltreUniversite(e.target.value)}
                    style={styleSelect} aria-label="Filtrer par université">
              <option value="">🏛️ Toutes les universités</option>
              {universites.map(u => <option key={u.id} value={u.id}>{u.nom}</option>)}
            </select>

            {/* Les départements sont exposés par établissement : le filtre ne
                devient utilisable qu'une fois une université choisie. */}
            <select value={filtreDepartement} onChange={e => setFiltreDepartement(e.target.value)}
                    style={{ ...styleSelect, opacity: filtreUniversite ? 1 : 0.55 }}
                    disabled={!filtreUniversite}
                    title={filtreUniversite ? '' : "Choisissez d'abord une université"}
                    aria-label="Filtrer par département">
              <option value="">
                {filtreUniversite ? '🏢 Tous les départements' : '🏢 Département (choisir une université)'}
              </option>
              {departements.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </select>

            <select value={tri} onChange={e => setTri(e.target.value)}
                    style={styleSelect} aria-label="Trier la liste">
              <option value="nom-asc">↕ Nom (A → Z)</option>
              <option value="nom-desc">↕ Nom (Z → A)</option>
              <option value="email-asc">↕ Email (A → Z)</option>
              <option value="email-desc">↕ Email (Z → A)</option>
              <option value="role-asc">↕ Rôle</option>
              <option value="universite-asc">↕ Université</option>
              <option value="departement-asc">↕ Département</option>
              <option value="statut-asc">↕ Statut (actifs d'abord)</option>
            </select>

            {(recherche || filtreRole || filtreStatut || filtreUniversite || filtreDepartement) && (
              <button
                type="button"
                className="btn-outline"
                style={{ fontSize: 12, padding: '8px 14px' }}
                onClick={() => {
                  setRecherche(''); setFiltreRole(''); setFiltreStatut('');
                  setFiltreUniversite(''); setFiltreDepartement('');
                }}
              >
                ✖ Réinitialiser
              </button>
            )}

            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {visibles.length} / {utilisateurs.length} comptes
            </span>
          </div>

          {chargement ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chargement des profils d'accès…</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: 13 }}>
                    <th style={{ padding: '10px 6px' }}>Nom complet</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Université</th>
                    <th>Département</th>
                    <th>Statut</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: 13, opacity: u.actif ? 1 : 0.55 }}>
                      <td style={{ padding: '12px 6px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {u.nomComplet || `${u.prenom || ''} ${u.nom || ''}`.trim() || '—'}
                        {u.email === user?.email && (
                          <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 800, color: '#185FA5', border: '1px solid #185FA5', borderRadius: 20, padding: '1px 8px' }}>VOUS</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td><span className={`badge ${badgeRole(u.role)}`}>{u.role}</span></td>
                      <td style={{ color: '#185FA5', fontSize: 12 }}>
                        {nomUniversite(u.universiteId) || (u.role === 'SUPER_ADMIN' ? 'MINISTÈRE / ESU (Global)' : 'Non rattaché')}
                      </td>
                      {/* Le nom n'est résolu que si les départements de
                          l'université filtrée ont été chargés ; sinon on montre
                          au moins que le compte est rattaché quelque part. */}
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                        {nomDepartement(u.departementId) || (u.departementId ? `#${u.departementId}` : '—')}
                      </td>
                      <td>
                        <span className={`badge ${u.actif ? 'badge-success' : 'badge-danger'}`}>
                          {u.actif ? 'Actif' : 'Désactivé'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          className="btn-outline"
                          style={{ fontSize: 12, padding: '5px 12px', marginRight: 8 }}
                          onClick={() => ouvrirEdition(u)}
                          disabled={actionEnCours === u.id || (!estSuperAdmin && u.role === 'SUPER_ADMIN')}
                          title="Modifier le rôle et le rattachement"
                        >
                          ⚙️ Configurer
                        </button>
                        <button
                          className="btn-outline"
                          style={{
                            fontSize: 12, padding: '5px 12px',
                            color: u.actif ? '#B91C1C' : '#0F6E56',
                            borderColor: u.actif ? '#f3b4b4' : '#9fd8c5',
                          }}
                          onClick={() => basculerStatut(u)}
                          disabled={actionEnCours === u.id || u.email === user?.email}
                          title={u.actif
                            ? "Désactiver : l'utilisateur perd tout accès à la plateforme"
                            : 'Réactiver le compte'}
                        >
                          {actionEnCours === u.id ? '…' : (u.actif ? '🚫 Désactiver' : '✅ Réactiver')}
                        </button>
                        <button
                          className="btn-outline"
                          style={{
                            fontSize: 12, padding: '5px 12px', marginLeft: 8,
                            color: '#B91C1C', borderColor: '#f3b4b4',
                          }}
                          onClick={() => supprimerDefinitif(u)}
                          disabled={
                            actionEnCours === u.id
                            || u.email === user?.email
                            || (!estSuperAdmin && (u.role === 'SUPER_ADMIN' || u.role === 'ADMIN_UNIVERSITE'))
                          }
                          title="Supprimer définitivement ce compte (irréversible)"
                        >
                          🗑️ Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                  {visibles.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        Aucun compte ne correspond à ces critères.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {onglet === 'creer' && (
        <div className="card">
          <h2 className="card-title">Enregistrement d'un nouvel agent ou enseignant</h2>
          <form onSubmit={soumettre} className="form-grid" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label>Nom (et postnom)</label>
              <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required placeholder="Ex: KABONGO MWAMBA" />
            </div>
            <div className="form-group">
              <label>Prénom</label>
              <input value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} required placeholder="Ex: Dieudonné" />
            </div>
            <div className="form-group">
              <label>Adresse email officielle (Identifiant de connexion)</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="nom@universite.cd" />
            </div>
            <div className="form-group">
              <label>Mot de passe initial</label>
              <input type="password" value={form.motDePasse} onChange={e => setForm({ ...form, motDePasse: e.target.value })} required placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label>Niveau d'habilitation / Rôle</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                {estSuperAdmin && <option value="SUPER_ADMIN">Super Administrateur National (ESU)</option>}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Université d'affectation (Obligatoire sauf pour le rôle National)</label>
              <select value={form.universiteId} onChange={e => setForm({ ...form, universiteId: e.target.value })}>
                <option value="">-- Sélectionner l'université de rattachement --</option>
                {universites.map(u => <option key={u.id} value={u.id}>{u.code} - {u.nom}</option>)}
              </select>
            </div>
            {erreur && (
              <div style={{
                gridColumn: '1 / span 2', padding: '10px 14px', borderRadius: 8,
                background: 'rgba(220,53,69,0.10)', border: '1px solid #fca5a5', color: '#dc2626', fontSize: 13,
              }}>
                ❌ {erreur}
              </div>
            )}
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2', marginTop: 14 }}>
              Créer le compte et envoyer les accès
            </button>
          </form>
        </div>
      )}

      {/* ─── Modal de configuration d'un compte ─── */}
      {enEdition && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'rgba(7,16,38,0.55)', backdropFilter: 'blur(4px)', padding: 20,
          }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setEnEdition(null); }}
        >
          <div className="card" role="dialog" aria-modal="true" style={{ width: 'min(480px, 100%)', margin: 0 }}>
            <h2 className="card-title" style={{ marginBottom: 4 }}>
              ⚙️ Configurer : {enEdition.nomComplet || enEdition.email}
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>
              Le rôle définit les informations et opérations accessibles. Restreindre le rôle
              retire immédiatement les droits de consultation correspondants.
            </p>
            <form onSubmit={enregistrerEdition} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Rôle / niveau d'habilitation</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  disabled={!estSuperAdmin}
                  title={!estSuperAdmin ? "Seul le Super Admin peut modifier un rôle" : undefined}
                >
                  {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                  {estSuperAdmin && <option value="SUPER_ADMIN">Super Administrateur National (ESU)</option>}
                </select>
              </div>
              <div className="form-group">
                <label>Université de rattachement</label>
                <select
                  value={editForm.universiteId ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, universiteId: e.target.value }))}
                >
                  <option value="">-- Aucune (rôle national) --</option>
                  {universites.map(u => <option key={u.id} value={u.id}>{u.code} - {u.nom}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="button" className="btn-outline" onClick={() => setEnEdition(null)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={actionEnCours === enEdition.id}>
                  {actionEnCours === enEdition.id ? 'Enregistrement…' : 'Enregistrer la configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
