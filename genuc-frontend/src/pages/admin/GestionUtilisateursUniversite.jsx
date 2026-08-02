import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

/* ─── Rôles disponibles pour l'Admin Université ─── */
const ROLES = [
  { groupe: 'Direction',      roles: [
    { value: 'RECTEUR',             label: 'Recteur / Directeur Général' },
    { value: 'DOYEN',               label: 'Doyen de Faculté' },
    { value: 'CHEF_DEPARTEMENT',    label: 'Chef de Département' },
    { value: 'COORDINATEUR',        label: 'Coordinateur' },
    { value: 'CHEF_PROMOTION',      label: 'Chef de Promotion' },
  ]},
  { groupe: 'Enseignement',   roles: [
    { value: 'PROFESSEUR',          label: 'Professeur' },
    { value: 'ENSEIGNANT',          label: 'Chargé de cours / Assistant' },
  ]},
  { groupe: 'Administration', roles: [
    { value: 'SECRETAIRE_ACADEMIQUE', label: 'Secrétaire Académique' },
    { value: 'CAISSIER',              label: 'Caissier(ère)' },
    { value: 'COMPTABLE',             label: 'Comptable' },
    { value: 'RH',                    label: 'Ressources Humaines (RH)' },
    { value: 'BIBLIOTHECAIRE',        label: 'Bibliothécaire' },
    { value: 'APPARITEUR',            label: 'Appariteur' },
    { value: 'SERVICE_SOCIAL',        label: 'Service Social' },
    { value: 'AGENT',                 label: 'Agent Administratif' },
    { value: 'AUDITEUR',              label: 'Auditeur Interne' },
  ]},
];

const ALL_ROLES = ROLES.flatMap(g => g.roles);

const ROLE_GROUPS = {
  RECTEUR: 'Direction', DOYEN: 'Direction', CHEF_DEPARTEMENT: 'Direction',
  COORDINATEUR: 'Direction', CHEF_PROMOTION: 'Direction',
  PROFESSEUR: 'Enseignement', ENSEIGNANT: 'Enseignement',
  SECRETAIRE_ACADEMIQUE: 'Administration', CAISSIER: 'Administration',
  COMPTABLE: 'Administration', RH: 'Administration', BIBLIOTHECAIRE: 'Administration',
  APPARITEUR: 'Administration', SERVICE_SOCIAL: 'Administration',
  AGENT: 'Administration', AUDITEUR: 'Administration',
};

const ROLE_COLORS = {
  Direction:     { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  Enseignement:  { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  Administration:{ bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' },
};

const S = {
  layout:   { display: 'flex', minHeight: '100vh', background: 'transparent', fontFamily: 'Inter,Arial,sans-serif' },
  main:     { flex: 1, padding: '32px', overflowY: 'auto' },
  pageTitle:{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 },
  pageDesc: { fontSize: 13, color: 'var(--text-muted)', marginTop: 4, marginBottom: 28 },

  feedback: (ok) => ({
    position: 'fixed', top: 20, right: 20, zIndex: 9999,
    padding: '13px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
    background: ok ? '#e1f5ee' : '#fff0f0',
    color:      ok ? '#065f46' : '#b91c1c',
    border:     `1px solid ${ok ? '#6ee7b7' : '#fca5a5'}`,
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    maxWidth: 420,
  }),

  // Onglets de groupe
  tabs: { display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  tab:  (active) => ({
    padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', border: active ? 'none' : '1.5px solid var(--border-color, #e2e8f0)',
    background: active ? '#0b1f4a' : 'var(--bg-card, #fff)', color: active ? '#fff' : 'var(--text-secondary, #475569)',
    boxShadow: active ? '0 2px 8px rgba(11,31,74,0.2)' : 'none',
    transition: 'all 0.15s',
  }),

  // Bouton
  btn: (variant, size) => ({
    padding: size === 'sm' ? '6px 14px' : '10px 22px',
    borderRadius: 8, fontSize: size === 'sm' ? 12 : 14, fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
    background: variant === 'primary' ? '#0b1f4a'
               : variant === 'green'  ? '#16a34a'
               : variant === 'red'    ? '#dc2626'
               : '#e2e8f0',
    color: ['ghost'].includes(variant) ? '#334155' : '#fff',
  }),

  // Card
  card: {
    background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color, #e2e8f0)',
    boxShadow: '0 1px 4px var(--shadow-color, rgba(0,0,0,0.05))', marginBottom: 16,
  },
  cardHeader: (groupe) => {
    const c = ROLE_COLORS[groupe] || ROLE_COLORS.Administration;
    return {
      padding: '14px 20px', borderBottom: `1px solid ${c.border}`,
      background: c.bg, borderRadius: '12px 12px 0 0',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    };
  },
  groupTitle: (groupe) => {
    const c = ROLE_COLORS[groupe] || ROLE_COLORS.Administration;
    return { fontWeight: 700, fontSize: 14, color: c.text };
  },

  // Table
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:    { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12, borderBottom: '1px solid var(--border-color, #f1f5f9)', background: 'var(--bg-secondary)' },
  td:    { padding: '10px 14px', borderBottom: '1px solid var(--border-color, #f8fafc)', color: 'var(--text-primary)', verticalAlign: 'middle' },

  // Badge
  badge: (actif) => ({
    display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: actif ? '#dcfce7' : '#fee2e2',
    color:      actif ? '#15803d' : '#b91c1c',
    border:     `1px solid ${actif ? '#86efac' : '#fca5a5'}`,
  }),

  // Modal
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  modal: {
    background: 'var(--bg-card)', borderRadius: 16, padding: '28px 32px',
    width: '100%', maxWidth: 540, boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    maxHeight: '90vh', overflowY: 'auto',
  },
  modalTitle: { fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 },
  modalSub:   { fontSize: 13, color: 'var(--text-muted)', marginBottom: 22 },

  // Form
  field: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 16 },
  label: { fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.3 },
  input: {
    height: 42, border: '1.5px solid var(--border-color, #cbd5e1)', borderRadius: 8,
    padding: '0 12px', fontSize: 14, color: 'var(--text-primary)', background: 'var(--bg-card)',
    fontFamily: 'inherit', boxSizing: 'border-box', width: '100%',
  },
  select: {
    height: 42, border: '1.5px solid var(--border-color, #cbd5e1)', borderRadius: 8,
    padding: '0 12px', fontSize: 14, color: 'var(--text-primary)', background: 'var(--bg-card)',
    fontFamily: 'inherit', width: '100%', cursor: 'pointer',
  },
  row2:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  errMsg:{ fontSize: 11, color: '#dc2626', marginTop: 2 },
  hint:  { fontSize: 11, color: 'var(--text-muted)', marginTop: 3 },
};

function initForm() {
  return { nom: '', prenom: '', email: '', telephone: '', role: '', departementId: '', motDePasse: '', genPwd: true };
}

/* ─── Composant principal ─── */
// Vignette d'identification : photo passeport en priorité (document
// officiel), sinon photo de profil, sinon avatar neutre. Clic = plein écran.
function VignetteIdentite({ utilisateur, onAgrandir }) {
  const chemin = utilisateur.photoPasseport || utilisateur.photoProfil;
  if (!chemin) {
    return (
      <div title="Aucune photo d'identification fournie" style={{
        width: 44, height: 54, borderRadius: 6, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 20, background: 'var(--bg-secondary)',
        border: '1px dashed var(--border-color)', opacity: 0.6,
      }}>👤</div>
    );
  }
  const base = (apiBase => apiBase || '')(require('../../api/axios').default.defaults.baseURL);
  const url = chemin.startsWith('http') || chemin.startsWith('data:')
    ? chemin : `${base}${chemin.startsWith('/') ? '' : '/'}${chemin}`;
  const estPasseport = !!utilisateur.photoPasseport;
  return (
    <button
      type="button"
      onClick={() => onAgrandir({ url, nom: `${utilisateur.prenom || ''} ${utilisateur.nom || ''}`.trim(), passeport: estPasseport })}
      title={estPasseport ? 'Photo passeport — cliquer pour agrandir' : 'Photo de profil — cliquer pour agrandir'}
      style={{ border: 'none', background: 'none', padding: 0, cursor: 'zoom-in' }}
    >
      <img src={url} alt="" style={{
        width: 44, height: 54, objectFit: 'cover', borderRadius: 6,
        border: `2px solid ${estPasseport ? '#1D9E75' : 'var(--border-color)'}`,
      }} />
    </button>
  );
}

export default function GestionUtilisateursUniversite() {
  const { user } = useAuth();
  const universiteId = user?.universiteId;

  const [utilisateurs, setUtilisateurs] = useState([]);
  const [photoAgrandie, setPhotoAgrandie] = useState(null);
  const [departements, setDepartements] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeGroupe, setActiveGroupe] = useState('Tous');
  const [modal, setModal]               = useState(false);
  const [form, setForm]                 = useState(initForm());
  const [errors, setErrors]             = useState({});
  const [submitting, setSubmitting]     = useState(false);
  const [feedback, setFeedback]         = useState(null);
  const [search, setSearch]             = useState('');

  const showFeedback = (msg, ok = true) => {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 4500);
  };

  useEffect(() => {
    if (universiteId) loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [universiteId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [usersRes, deptRes] = await Promise.all([
        api.get(`/api/utilisateurs?universiteId=${universiteId}`),
        api.get(`/api/universites/public/${universiteId}/departements`).catch(() => ({ data: [] })),
      ]);
      const data = usersRes.data?.utilisateurs || usersRes.data?.content || [];
      // Exclure SUPER_ADMIN, ADMIN_UNIVERSITE, ETUDIANT de la liste de gestion
      setUtilisateurs(data.filter(u =>
        !['SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'ETUDIANT', 'STUDENT'].includes(u.role)
      ));
      setDepartements(deptRes.data || []);
    } catch {
      setUtilisateurs([]);
    } finally {
      setLoading(false);
    }
  };

  const ouvrirModal = () => { setForm({ ...initForm(), genPwd: true }); setErrors({}); setModal(true); };
  const fermerModal = () => { setModal(false); setForm(initForm()); setErrors({}); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const valider = () => {
    const e = {};
    if (!form.nom.trim())    e.nom  = 'Requis';
    if (!form.prenom.trim()) e.prenom = 'Requis';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide';
    if (!form.role)          e.role = 'Sélectionnez un rôle';
    if (!form.genPwd && form.motDePasse.length < 8) e.motDePasse = 'Minimum 8 caractères';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const creerUtilisateur = async () => {
    if (!valider()) return;
    setSubmitting(true);
    try {
      const pwd = form.genPwd
        ? 'Genuc@' + Math.random().toString(36).slice(2, 8).toUpperCase()
        : form.motDePasse;

      await api.post('/api/utilisateurs', {
        nom:           form.nom.toUpperCase().trim(),
        prenom:        form.prenom.trim(),
        email:         form.email.toLowerCase().trim(),
        telephone:     form.telephone.trim() || null,
        motDePasse:    pwd,
        role:          form.role,
        universiteId:  universiteId,
        departementId: form.departementId || null,
      });

      const roleLabel = ALL_ROLES.find(r => r.value === form.role)?.label || form.role;
      showFeedback(`${roleLabel} créé avec succès. Email de bienvenue envoyé.`);
      fermerModal();
      loadAll();
    } catch (err) {
      showFeedback(err.response?.data?.message || err.response?.data?.erreur || 'Erreur lors de la création.', false);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActif = async (u) => {
    const action = u.actif ? 'desactiver' : 'activer';
    try {
      await api.patch(`/api/utilisateurs/${u.id}/${action}`);
      showFeedback(`Compte ${u.actif ? 'désactivé' : 'réactivé'} avec succès.`);
      loadAll();
    } catch {
      showFeedback('Erreur lors de la modification.', false);
    }
  };

  // Suppression DÉFINITIVE (hard delete) — irréversible. Le backend refuse si
  // l'utilisateur a des données liées (on désactive alors plutôt).
  const supprimerDefinitif = async (u) => {
    if (!window.confirm(
      `⚠️ Supprimer DÉFINITIVEMENT ${u.prenom || ''} ${u.nom || ''} (${u.email}) ?\n\n` +
      `Cette action est IRRÉVERSIBLE et efface TOUTE trace de cette personne : le compte, ` +
      `mais aussi tout dossier d'inscription, étudiant et inscription portant le même email, ` +
      `avec leurs paiements/notes. L'email redeviendra réutilisable.`
    )) return;
    try {
      await api.delete(`/api/utilisateurs/${u.id}/definitif`);
      showFeedback('Utilisateur supprimé définitivement.');
      loadAll();
    } catch (err) {
      showFeedback(err.response?.data?.erreur || 'Erreur lors de la suppression.', false);
    }
  };

  // Filtrage
  const groupes = ['Tous', 'Direction', 'Enseignement', 'Administration'];
  const filtered = utilisateurs.filter(u => {
    const matchGroupe = activeGroupe === 'Tous' || ROLE_GROUPS[u.role] === activeGroupe;
    const q = search.toLowerCase();
    const matchSearch = !q || `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(q);
    return matchGroupe && matchSearch;
  });

  // Grouper par rôle
  const parGroupe = {};
  for (const u of filtered) {
    const g = ROLE_GROUPS[u.role] || 'Autres';
    if (!parGroupe[g]) parGroupe[g] = {};
    if (!parGroupe[g][u.role]) parGroupe[g][u.role] = [];
    parGroupe[g][u.role].push(u);
  }

  const getRoleLabel = (role) => ALL_ROLES.find(r => r.value === role)?.label || role;

  const needsDept = (role) => ['DOYEN', 'CHEF_DEPARTEMENT', 'PROFESSEUR', 'ENSEIGNANT',
    'CHEF_PROMOTION', 'COORDINATEUR', 'SECRETAIRE_ACADEMIQUE', 'APPARITEUR'].includes(role);

  return (
    <div style={S.layout}>
      {feedback && <div style={S.feedback(feedback.ok)}>{feedback.msg}</div>}

      <div style={S.main}>
        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={S.pageTitle}>👥 Gestion du Personnel Universitaire</h1>
            <p style={S.pageDesc}>
              Créez et gérez tous les membres du personnel de votre université.
              Les étudiants sont créés automatiquement via la validation des dossiers d'inscription.
            </p>
          </div>
          <button style={S.btn('primary')} onClick={ouvrirModal}>+ Nouvel utilisateur</button>
        </div>

        {/* Barre de recherche + onglets */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            style={{ ...S.input, width: 280, flex: 'none' }}
            placeholder="🔍 Rechercher par nom, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={S.tabs}>
            {groupes.map(g => (
              <button key={g} style={S.tab(activeGroupe === g)} onClick={() => setActiveGroupe(g)}>
                {g} ({g === 'Tous' ? utilisateurs.length : utilisateurs.filter(u => ROLE_GROUPS[u.role] === g).length})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ ...S.card, padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Aucun utilisateur trouvé</div>
            <div style={{ fontSize: 13 }}>Cliquez sur « + Nouvel utilisateur » pour commencer.</div>
          </div>
        ) : (
          Object.entries(parGroupe).map(([groupe, parRole]) => (
            <div key={groupe} style={S.card}>
              <div style={S.cardHeader(groupe)}>
                <span style={S.groupTitle(groupe)}>{groupe}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {Object.values(parRole).flat().length} membre(s)
                </span>
              </div>
              {Object.entries(parRole).map(([role, membres]) => (
                <div key={role}>
                  <div style={{ padding: '10px 20px', background: 'var(--bg-secondary)', fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: 0.5, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>
                    {getRoleLabel(role)} ({membres.length})
                  </div>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Identification</th>
                        <th style={S.th}>Nom complet</th>
                        <th style={S.th}>Email</th>
                        <th style={S.th}>Téléphone</th>
                        <th style={S.th}>Département</th>
                        <th style={S.th}>Statut</th>
                        <th style={S.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {membres.map(u => (
                        <tr key={u.id}>
                          <td style={S.td}>
                            <VignetteIdentite utilisateur={u} onAgrandir={setPhotoAgrandie} />
                          </td>
                          <td style={S.td}><strong>{u.prenom} {u.nom}</strong></td>
                          <td style={S.td}>{u.email}</td>
                          <td style={S.td}>{u.telephone || '—'}</td>
                          <td style={S.td}>{u.departementNom || '—'}</td>
                          <td style={S.td}>
                            <span style={S.badge(u.actif)}>
                              {u.actif ? '✓ Actif' : '✗ Inactif'}
                            </span>
                          </td>
                          <td style={S.td}>
                            <button
                              style={S.btn(u.actif ? 'red' : 'green', 'sm')}
                              onClick={() => toggleActif(u)}
                            >
                              {u.actif ? 'Désactiver' : 'Réactiver'}
                            </button>
                            {u.role !== 'ADMIN_UNIVERSITE' && u.role !== 'SUPER_ADMIN' && (
                              <button
                                style={{
                                  ...S.btn('ghost', 'sm'), marginLeft: 8,
                                  background: '#fff', color: '#dc2626', border: '1.5px solid #fca5a5',
                                }}
                                onClick={() => supprimerDefinitif(u)}
                                title="Supprimer définitivement ce compte (irréversible)"
                              >
                                🗑️ Supprimer
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* ── Modal création utilisateur ── */}
      {modal && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && fermerModal()}>
          <div style={S.modal}>
            <div style={S.modalTitle}>👤 Créer un utilisateur</div>
            <div style={S.modalSub}>
              Remplissez le formulaire ci-dessous. Un email de bienvenue avec les identifiants sera envoyé automatiquement.
            </div>

            {/* Rôle — affiché en premier pour adapter le formulaire */}
            <div style={S.field}>
              <label style={S.label}>Rôle <span style={{ color: '#dc2626' }}>*</span></label>
              <select style={S.select} value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="">-- Sélectionner un rôle --</option>
                {ROLES.map(g => (
                  <optgroup key={g.groupe} label={g.groupe}>
                    {g.roles.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.role && <span style={S.errMsg}>{errors.role}</span>}
            </div>

            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Nom <span style={{ color: '#dc2626' }}>*</span></label>
                <input style={S.input} placeholder="NOM" value={form.nom}
                  onChange={e => set('nom', e.target.value)} />
                {errors.nom && <span style={S.errMsg}>{errors.nom}</span>}
              </div>
              <div style={S.field}>
                <label style={S.label}>Prénom <span style={{ color: '#dc2626' }}>*</span></label>
                <input style={S.input} placeholder="Prénom" value={form.prenom}
                  onChange={e => set('prenom', e.target.value)} />
                {errors.prenom && <span style={S.errMsg}>{errors.prenom}</span>}
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Email professionnel <span style={{ color: '#dc2626' }}>*</span></label>
              <input style={S.input} type="email" placeholder="prenom.nom@universite.cd"
                value={form.email} onChange={e => set('email', e.target.value)} />
              {errors.email && <span style={S.errMsg}>{errors.email}</span>}
            </div>

            <div style={S.field}>
              <label style={S.label}>Téléphone</label>
              <input style={S.input} placeholder="+243 8X XXX XX XX" value={form.telephone}
                onChange={e => set('telephone', e.target.value)} />
            </div>

            {/* Département (si pertinent) */}
            {form.role && needsDept(form.role) && departements.length > 0 && (
              <div style={S.field}>
                <label style={S.label}>Département / Faculté</label>
                <select style={S.select} value={form.departementId}
                  onChange={e => set('departementId', e.target.value)}>
                  <option value="">-- Aucun département --</option>
                  {departements.map(d => (
                    <option key={d.id} value={d.id}>{d.nom}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={S.field}>
              <label style={{ ...S.label, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.genPwd}
                  onChange={e => set('genPwd', e.target.checked)} />
                Générer automatiquement un mot de passe temporaire
              </label>
              <span style={S.hint}>L'utilisateur recevra ses identifiants par email et devra changer son mot de passe à la première connexion.</span>
            </div>

            {!form.genPwd && (
              <div style={S.field}>
                <label style={S.label}>Mot de passe <span style={{ color: '#dc2626' }}>*</span></label>
                <input style={S.input} type="password" placeholder="Minimum 8 caractères"
                  value={form.motDePasse} onChange={e => set('motDePasse', e.target.value)} />
                {errors.motDePasse && <span style={S.errMsg}>{errors.motDePasse}</span>}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'flex-end' }}>
              <button style={{ ...S.btn('ghost'), border: '1.5px solid #e2e8f0' }} onClick={fermerModal}>
                Annuler
              </button>
              <button style={S.btn('primary')} onClick={creerUtilisateur} disabled={submitting}>
                {submitting ? 'Création en cours…' : '✓ Créer l\'utilisateur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {photoAgrandie && (
        <div
          onClick={() => setPhotoAgrandie(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(7,16,38,0.85)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 14, cursor: 'zoom-out', padding: 20,
          }}
        >
          <img src={photoAgrandie.url} alt="" style={{
            maxWidth: 'min(480px, 92vw)', maxHeight: '76vh', borderRadius: 12,
            border: '3px solid #fff', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }} />
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, textAlign: 'center' }}>
            {photoAgrandie.passeport ? '🛂 Photo passeport' : '📸 Photo de profil'} — {photoAgrandie.nom}
            <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 400, marginTop: 4 }}>
              Cliquez n'importe où pour fermer
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
