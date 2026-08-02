import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { resolveFileUrl } from '../../utils/fileUrl';
import SidebarSuperAdmin from '../../components/SidebarSuperAdmin';

const S = {
  layout: { display: 'flex', minHeight: '100vh', background: 'transparent', fontFamily: 'Inter,Arial,sans-serif' },
  main:   { flex: 1, padding: '32px', overflowY: 'auto' },

  // Header
  pageHeader: { marginBottom: 28 },
  pageTitle:  { fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 },
  pageDesc:   { fontSize: 13, color: 'var(--text-muted)', marginTop: 4 },

  // Feedback
  feedback: (ok) => ({
    position: 'fixed', top: 20, right: 20, zIndex: 9999,
    padding: '13px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
    background: ok ? '#e1f5ee' : '#fff0f0',
    color: ok ? '#065f46' : '#b91c1c',
    border: `1px solid ${ok ? '#6ee7b7' : '#fca5a5'}`,
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  }),

  // Université card
  uniCard: {
    background: 'var(--bg-card)', borderRadius: 12, padding: '20px 24px',
    border: '1px solid var(--border-color, #e2e8f0)', marginBottom: 16,
    boxShadow: '0 1px 4px var(--shadow-color, rgba(0,0,0,0.05))',
  },
  uniTop: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 },
  uniLogo: { width: 52, height: 52, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border-color, #e2e8f0)' },
  uniLogoFallback: (color) => ({
    width: 52, height: 52, borderRadius: 8,
    background: color || '#0b1f4a', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: 14, flexShrink: 0,
  }),
  uniNom:   { fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' },
  uniVille: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },

  // Admin badge
  adminBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: '#e1f5ee', color: '#065f46', borderRadius: 20,
    padding: '4px 12px', fontSize: 12, fontWeight: 600,
    border: '1px solid #6ee7b7',
  },
  noAdminBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'rgba(192,122,43,0.15)', color: '#92400e', borderRadius: 20,
    padding: '4px 12px', fontSize: 12, fontWeight: 600,
    border: '1px solid #fcd34d',
  },

  // Bouton
  btn: (variant) => ({
    padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
    background: variant === 'primary' ? '#0b1f4a'
               : variant === 'green'  ? '#16a34a'
               : variant === 'danger' ? '#dc2626'
               : '#e2e8f0',
    color: variant === 'ghost' ? '#334155' : '#fff',
  }),

  // Modal overlay
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  modal: {
    background: 'var(--bg-card)', borderRadius: 16, padding: '28px 32px',
    width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  },
  modalTitle: { fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 },
  modalSub:   { fontSize: 13, color: 'var(--text-muted)', marginBottom: 22 },

  // Form
  field: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 16 },
  label: { fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.3 },
  input: {
    height: 42, border: '1.5px solid var(--border-color, #cbd5e1)', borderRadius: 8,
    padding: '0 12px', fontSize: 14, color: 'var(--text-primary)', background: 'var(--bg-card)',
    fontFamily: 'inherit',
  },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  hint: { fontSize: 11, color: 'var(--text-muted)', marginTop: 3 },
  errMsg: { fontSize: 11, color: '#dc2626', marginTop: 2 },

  // Tableau admins existants
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    background: 'var(--bg-secondary)', padding: '10px 14px', textAlign: 'left',
    fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12, borderBottom: '1px solid var(--border-color, #e2e8f0)',
  },
  td: { padding: '10px 14px', borderBottom: '1px solid var(--border-color, #f1f5f9)', color: 'var(--text-primary)' },
};

const LOGOS = {
  UNIKIN: '/assets/UNIKIN.png', UPN: '/assets/UPN.png',
  'HEC-KIN': '/assets/HEC-KIN.png', UNILU: '/assets/UNILU.jpg',
  UNIGOM: '/assets/UNIGOM.jpg', UNIKIS: '/assets/UNIKIS.png',
  ISP: '/assets/ISP.jpg', UCC: '/assets/UCC.jpg',
};

const COULEURS = {
  UNIKIN: '#185FA5', UPN: '#C8102E', 'HEC-KIN': '#003366',
  UNILU: '#006400', UNIGOM: '#8B0000',
};

function initForm() {
  return { nom: '', prenom: '', email: '', telephone: '', motDePasse: '', universiteId: '' };
}

// Logo d'université avec repli sûr : logo réellement uploadé
// (universite.logo) → mapping connu → initiales colorées.
function UniLogoBadge({ uni, color }) {
  const [imgError, setImgError] = useState(false);
  const logoSrc = resolveFileUrl(uni.logo) || LOGOS[uni.code];

  if (logoSrc && !imgError) {
    return <img src={logoSrc} alt={uni.code} style={S.uniLogo} onError={() => setImgError(true)} />;
  }
  return <div style={S.uniLogoFallback(color)}>{uni.code?.slice(0, 3)}</div>;
}

export default function GestionAdminsUniversite() {
  const [universites, setUniversites]   = useState([]);
  const [admins, setAdmins]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modal, setModal]               = useState(null); // { universiteId, nom }
  const [form, setForm]                 = useState(initForm());
  const [errors, setErrors]             = useState({});
  const [submitting, setSubmitting]     = useState(false);
  const [feedback, setFeedback]         = useState(null);
  const [genPwd, setGenPwd]             = useState(true);

  const showFeedback = (msg, ok = true) => {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 4000);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [uniRes, adminsRes] = await Promise.all([
        api.get('/api/universites/public'),
        api.get('/api/utilisateurs?role=ADMIN_UNIVERSITE'),
      ]);
      setUniversites(uniRes.data || []);
      setAdmins(adminsRes.data?.utilisateurs || adminsRes.data?.content || []);
    } catch {
      setUniversites([]);
    } finally {
      setLoading(false);
    }
  };

  const ouvrirModal = (uni) => {
    setForm({ ...initForm(), universiteId: uni.id });
    setErrors({});
    setGenPwd(true);
    setModal({ universiteId: uni.id, nomUni: uni.nom, codeUni: uni.code });
  };

  const fermerModal = () => { setModal(null); setForm(initForm()); setErrors({}); };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const valider = () => {
    const e = {};
    if (!form.nom.trim())    e.nom    = 'Requis';
    if (!form.prenom.trim()) e.prenom = 'Requis';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide';
    if (!genPwd && form.motDePasse.length < 8) e.motDePasse = 'Minimum 8 caractères';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const creerAdmin = async () => {
    if (!valider()) return;
    setSubmitting(true);
    try {
      const pwd = genPwd
        ? 'Genuc@' + Math.random().toString(36).slice(2, 8).toUpperCase()
        : form.motDePasse;

      await api.post('/api/utilisateurs', {
        nom:          form.nom.toUpperCase().trim(),
        prenom:       form.prenom.trim(),
        email:        form.email.toLowerCase().trim(),
        telephone:    form.telephone.trim() || null,
        motDePasse:   pwd,
        role:         'ADMIN_UNIVERSITE',
        universiteId: modal.universiteId,
      });
      showFeedback(`Admin créé avec succès pour ${modal.nomUni}. Email de bienvenue envoyé.`);
      fermerModal();
      loadAll();
    } catch (err) {
      showFeedback(err.response?.data?.message || err.response?.data?.erreur || 'Erreur lors de la création', false);
    } finally {
      setSubmitting(false);
    }
  };

  const desactiverAdmin = async (adminId) => {
    if (!window.confirm('Désactiver cet administrateur ?')) return;
    try {
      await api.patch(`/api/utilisateurs/${adminId}/desactiver`);
      showFeedback('Administrateur désactivé.');
      loadAll();
    } catch {
      showFeedback('Erreur lors de la désactivation.', false);
    }
  };

  const adminDeUni = (uniId) => admins.find(a => a.universiteId === uniId && a.actif);

  if (loading) return <div style={S.layout}><SidebarSuperAdmin /><div style={S.main}>Chargement…</div></div>;

  return (
    <div style={S.layout}>
      <SidebarSuperAdmin />

      {feedback && <div style={S.feedback(feedback.ok)}>{feedback.msg}</div>}

      <div style={S.main}>
        <div style={S.pageHeader}>
          <h1 style={S.pageTitle}>👨‍💼 Gestion des Administrateurs d'Université</h1>
          <p style={S.pageDesc}>
            Créez et gérez les comptes administrateurs pour chaque université.
            Chaque université doit avoir un administrateur principal.
          </p>
        </div>

        {/* Tableau récapitulatif */}
        {admins.length > 0 && (
          <div style={{ ...S.uniCard, marginBottom: 28 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 14 }}>
              📋 Administrateurs actifs ({admins.filter(a => a.actif).length})
            </div>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Nom complet</th>
                  <th style={S.th}>Email</th>
                  <th style={S.th}>Téléphone</th>
                  <th style={S.th}>Université</th>
                  <th style={S.th}>Statut</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(a => {
                  const uni = universites.find(u => u.id === a.universiteId);
                  return (
                    <tr key={a.id}>
                      <td style={S.td}><strong>{a.prenom} {a.nom}</strong></td>
                      <td style={S.td}>{a.email}</td>
                      <td style={S.td}>{a.telephone || '—'}</td>
                      <td style={S.td}>{uni?.nom || `Université #${a.universiteId}`}</td>
                      <td style={S.td}>
                        <span style={a.actif ? S.adminBadge : S.noAdminBadge}>
                          {a.actif ? '✓ Actif' : '✗ Inactif'}
                        </span>
                      </td>
                      <td style={S.td}>
                        {a.actif && (
                          <button style={{ ...S.btn('danger'), padding: '5px 12px', fontSize: 12 }}
                            onClick={() => desactiverAdmin(a.id)}>
                            Désactiver
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Cartes université */}
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 14 }}>
          🏛️ Universités ({universites.length})
        </div>
        {universites.map(uni => {
          const admin = adminDeUni(uni.id);
          const color = COULEURS[uni.code] || '#0b1f4a';
          return (
            <div key={uni.id} style={S.uniCard}>
              <div style={S.uniTop}>
                <UniLogoBadge uni={uni} color={color} />
                <div style={{ flex: 1 }}>
                  <div style={S.uniNom}>{uni.nom}</div>
                  <div style={S.uniVille}>📍 {uni.ville}{uni.province ? `, ${uni.province}` : ''}</div>
                </div>
                <div>
                  {admin
                    ? <span style={S.adminBadge}>✓ Admin : {admin.prenom} {admin.nom}</span>
                    : <span style={S.noAdminBadge}>⚠️ Aucun administrateur</span>
                  }
                </div>
              </div>

              {admin && (
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 12, paddingLeft: 68 }}>
                  📧 {admin.email}
                  {admin.telephone && ` · 📞 ${admin.telephone}`}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, paddingLeft: 68 }}>
                <button style={S.btn('primary')} onClick={() => ouvrirModal(uni)}>
                  {admin ? '➕ Ajouter un 2ème admin' : '👤 Créer l\'administrateur'}
                </button>
                {admin && (
                  <button style={S.btn('danger')} onClick={() => desactiverAdmin(admin.id)}>
                    Désactiver l'admin actuel
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal création admin ── */}
      {modal && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && fermerModal()}>
          <div style={S.modal}>
            <div style={S.modalTitle}>👤 Créer un Administrateur</div>
            <div style={S.modalSub}>Université : <strong>{modal.nomUni}</strong></div>

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
              <label style={S.label}>Adresse email <span style={{ color: '#dc2626' }}>*</span></label>
              <input style={S.input} type="email" placeholder="admin@universite.cd" value={form.email}
                onChange={e => set('email', e.target.value)} />
              {errors.email && <span style={S.errMsg}>{errors.email}</span>}
            </div>

            <div style={S.field}>
              <label style={S.label}>Téléphone</label>
              <input style={S.input} placeholder="+243 8X XXX XX XX" value={form.telephone}
                onChange={e => set('telephone', e.target.value)} />
            </div>

            <div style={S.field}>
              <label style={{ ...S.label, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={genPwd} onChange={e => setGenPwd(e.target.checked)} />
                Générer automatiquement un mot de passe temporaire
              </label>
              <span style={S.hint}>Un email avec les identifiants sera envoyé à l'administrateur.</span>
            </div>

            {!genPwd && (
              <div style={S.field}>
                <label style={S.label}>Mot de passe temporaire <span style={{ color: '#dc2626' }}>*</span></label>
                <input style={S.input} type="password" placeholder="Minimum 8 caractères"
                  value={form.motDePasse} onChange={e => set('motDePasse', e.target.value)} />
                {errors.motDePasse && <span style={S.errMsg}>{errors.motDePasse}</span>}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'flex-end' }}>
              <button style={S.btn('ghost')} onClick={fermerModal}>Annuler</button>
              <button style={S.btn('primary')} onClick={creerAdmin} disabled={submitting}>
                {submitting ? 'Création…' : '✓ Créer l\'administrateur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
