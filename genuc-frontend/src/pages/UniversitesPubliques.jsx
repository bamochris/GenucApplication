import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { resolveFileUrl } from '../utils/fileUrl';
import { parseDocumentsRequis, libelleDocument } from '../utils/documentsInscription';
import {
  FaUniversity, FaChevronRight, FaHome, FaSearch,
  FaMapMarkerAlt, FaBook, FaTimes, FaBriefcase,
  FaClock, FaStar, FaGraduationCap, FaInfoCircle,
  FaArrowRight, FaCheckCircle, FaLaptopCode, FaHeartbeat,
  FaBalanceScale, FaChartLine, FaLeaf, FaBuilding,
  FaPalette, FaMicroscope
} from 'react-icons/fa';

/* ── Palette ── */
const C = { navy: '#0B1F4A', blue: '#185FA5', green: '#1D9E75', orange: '#C07A2B', purple: '#6B21A8', red: '#B91C1C' };

/* ── Logos réels des universités (identiques à Home.jsx) ── */
const UNI_LOGOS = {
  'UNIKIN':  '/assets/UNIKIN.png',
  'UPN':     '/assets/UPN.png',
  'HEC-KIN': '/assets/HEC-KIN.png',
  'HEC':     '/assets/HEC-KIN.png',
  'ISIPA':   '/assets/ISIPA.png',
  'ISP':     '/assets/ISP.jpg',
  'REV_KIM': '/assets/REV_KIM.jpg',
  'UCC':     '/assets/UCC.jpg',
  'UNILU':   '/assets/UNILU.jpg',
  'UNISIC':  '/assets/UNISIC.png',
  'UPC':     '/assets/UPC.png',
};

/* ── Couleurs par université ── */
const UNI_COLORS = {
  UNIKIN:  { bg: '#185FA5', light: '#E6F1FB' },
  UPN:     { bg: '#1D9E75', light: '#E1F5EE' },
  UNILU:   { bg: '#B91C1C', light: '#FEE2E2' },
  HEC:     { bg: '#C07A2B', light: '#FEF3C7' },
  'HEC-KIN':{ bg: '#C07A2B', light: '#FEF3C7' },
  ISP:     { bg: '#6B21A8', light: '#F3E8FF' },
  ISIPA:   { bg: '#0E7490', light: '#CFFAFE' },
  UCC:     { bg: '#065F46', light: '#D1FAE5' },
  UPC:     { bg: '#92400E', light: '#FDE68A' },
  REV_KIM: { bg: '#1D9E75', light: '#E1F5EE' },
  UNISIC:  { bg: '#7C3AED', light: '#EDE9FE' },
  DEFAULT: { bg: C.navy,    light: '#E8EDF5' },
};

/* ── Débouchés par mots-clés de filière ── */
const DEBOUCHES_MAP = [
  { keys: ['informati','logiciel','développ','génie logiciel','systèmes'],
    Icon: FaLaptopCode, color: C.blue, label: 'Informatique & Tech',
    metiers: ['Développeur Full-Stack','Data Scientist','Architecte Cloud','Cybersécurité','Chef de projet IT','DevOps Engineer'],
    salaire: '800–2 500 USD/mois', duree: '3–5 ans', secteurs: ['Télécoms','Banques','ONG','Startups','Gouvernement'] },
  { keys: ['médecin','santé','infirm','pharmacie','dentaire','kinési','biomed'],
    Icon: FaHeartbeat, color: C.red, label: 'Santé & Médecine',
    metiers: ['Médecin généraliste','Spécialiste','Pharmacien','Infirmier(e)','Sage-femme','Biologiste médical'],
    salaire: '700–3 500 USD/mois', duree: '5–7 ans', secteurs: ['Hôpitaux','ONG santé','MSF','Cliniques','Ministère santé'] },
  { keys: ['droit','juridique','notariat','judiciaire','sciences po'],
    Icon: FaBalanceScale, color: '#4F46E5', label: 'Droit & Justice',
    metiers: ['Avocat','Magistrat','Notaire','Juriste d\'entreprise','Conseiller juridique','Diplomate'],
    salaire: '600–2 500 USD/mois', duree: '3–5 ans', secteurs: ['Barreau','Entreprises','ONU','État','Banques'] },
  { keys: ['économi','finance','comptabl','gestion','commerce','management','banque'],
    Icon: FaChartLine, color: C.green, label: 'Finance & Gestion',
    metiers: ['Analyste financier','Comptable','Auditeur','Directeur financier','Banquier','Consultant'],
    salaire: '700–3 000 USD/mois', duree: '3–5 ans', secteurs: ['Banques','Multinationales','Cabinet audit','ONG','Mines'] },
  { keys: ['agronomie','agriculture','élevage','vétérinai','rural','forestier'],
    Icon: FaLeaf, color: '#1D9E75', label: 'Agronomie & Environnement',
    metiers: ['Agronome','Vétérinaire','Ingénieur rural','Hydrologue','Consultant agri'],
    salaire: '500–2 000 USD/mois', duree: '3–5 ans', secteurs: ['ONG','Ministère agri','FAO','USAID','Coopératives'] },
  { keys: ['chimie','physique','biologie','science','mathématique','géologie','mine'],
    Icon: FaMicroscope, color: '#0E7490', label: 'Sciences & Recherche',
    metiers: ['Chercheur','Chimiste','Géologue','Ingénieur minier','Topographe','Physicien'],
    salaire: '800–4 000 USD/mois', duree: '3–5 ans', secteurs: ['Mines','Recherche','Universités','Industries'] },
  { keys: ['architecture','btp','génie civil','construction','urbanisme'],
    Icon: FaBuilding, color: C.orange, label: 'Architecture & BTP',
    metiers: ['Architecte','Ingénieur civil','Urbaniste','Conducteur de travaux','BIM Manager'],
    salaire: '800–2 500 USD/mois', duree: '5 ans', secteurs: ['BTP','Promoteurs','Mairies','ONG','État'] },
  { keys: ['art','design','comm','journalisme','lettres','linguistique','pédagogie','éducation'],
    Icon: FaPalette, color: C.purple, label: 'Lettres, Arts & Communication',
    metiers: ['Journaliste','Designer','Enseignant','Traducteur','Community manager','Attaché de presse'],
    salaire: '400–1 500 USD/mois', duree: '3–5 ans', secteurs: ['Médias','ONG','Écoles','Agences','État'] },
];

function getDebouches(filiereNom = '') {
  const nom = filiereNom.toLowerCase();
  return DEBOUCHES_MAP.find(d => d.keys.some(k => nom.includes(k))) || {
    Icon: FaGraduationCap, color: '#64748B', label: 'Carrières générales',
    metiers: ['Cadre d\'entreprise','Fonctionnaire','Consultant','Chef de projet','Entrepreneur'],
    salaire: '500–2 000 USD/mois', duree: '3–5 ans', secteurs: ['Entreprises','ONG','État','Banques'],
  };
}

function getUniColor(code = '') {
  if (UNI_COLORS[code]) return UNI_COLORS[code];
  const key = Object.keys(UNI_COLORS).find(k => k !== 'DEFAULT' && code.toUpperCase().startsWith(k.toUpperCase()));
  return UNI_COLORS[key] || UNI_COLORS.DEFAULT;
}

/* ════════════════════════════════════════════════ */
export default function UniversitesPubliques() {
  const [universites, setUniversites]   = useState([]);
  const [selectedUni, setSelectedUni]   = useState(null);
  const [departements, setDepartements] = useState([]);
  const [filieres, setFilieres]         = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [loadingDept, setLoadingDept]   = useState(false);
  const [loadingFil, setLoadingFil]     = useState(false);
  const [recherche, setRecherche]       = useState('');
  const [infoFiliere, setInfoFiliere]   = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    api.get('/api/universites/public')
      .then(r => setUniversites(Array.isArray(r.data) ? r.data : []))
      .catch(() => setUniversites([]))
      .finally(() => setLoading(false));
  }, []);

  const handleUniClick = async (uni) => {
    if (selectedUni?.id === uni.id) return;
    setSelectedUni(uni); setSelectedDept(null); setFilieres([]); setLoadingDept(true);
    try {
      const r = await api.get(`/api/universites/public/${uni.id}/departements`);
      setDepartements(Array.isArray(r.data) ? r.data : []);
    } catch { setDepartements([]); }
    finally { setLoadingDept(false); }
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleDeptClick = async (dept) => {
    if (selectedDept?.id === dept.id) return;
    setSelectedDept(dept); setFilieres([]); setLoadingFil(true);
    try {
      const r = await api.get(`/api/departements/public/${dept.id}/filieres`);
      setFilieres(Array.isArray(r.data) ? r.data : []);
    } catch { setFilieres([]); }
    finally { setLoadingFil(false); }
  };

  const uniFiltered = universites.filter(u =>
    !recherche || u.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
    u.code?.toLowerCase().includes(recherche.toLowerCase()) ||
    u.ville?.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: 'var(--bg-secondary)', minHeight: '100vh' }}>

      {/* ══ TOPBAR ══ */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 1000, background: C.navy, boxShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 62, flexWrap: 'wrap', gap: 10 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#1D9E75,#185FA5)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: 15 }}>G</div>
            <span style={{ color: 'white', fontWeight: 800, fontSize: 17 }}>GENUC</span>
          </Link>
          <div className="up-nav-links" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}><FaHome /> Accueil</Link>
            <Link to="/orientation" className="up-nav-secondary" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}>Orientation</Link>
            <Link to="/emploi-universitaire" className="up-nav-secondary" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}>Emploi Étudiant</Link>
            <Link to="/login" style={{ padding: '8px 18px', background: C.green, color: 'white', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700, marginLeft: 8, whiteSpace: 'nowrap' }}>Se connecter</Link>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section style={{ background: `linear-gradient(135deg, ${C.navy} 0%, #0D2B6B 50%, ${C.blue} 100%)`, padding: '56px 24px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(29,158,117,0.2)', border: '1px solid rgba(29,158,117,0.35)', borderRadius: 30, padding: '5px 14px', marginBottom: 20 }}>
            <FaUniversity style={{ color: '#9FE1CB', fontSize: 12 }} />
            <span style={{ color: '#9FE1CB', fontSize: 13, fontWeight: 600 }}>Réseau Universitaire National</span>
          </div>
          <h1 style={{ color: 'white', fontSize: 'clamp(28px,4.5vw,50px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 16 }}>
            Universités connectées<br/>
            <span style={{ background: 'linear-gradient(90deg,#9FE1CB,#7EC8D8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>à GENUC</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
            Explorez les universités partenaires, leurs facultés et toutes les filières disponibles en République Démocratique du Congo.
          </p>
          {/* Barre de recherche dans le hero */}
          <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
            <FaSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }} />
            <input value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher une université, ville..."
              className="up-search-input"
              style={{ width: '100%', padding: '13px 14px 13px 40px', borderRadius: 12, border: 'none', fontSize: 15, outline: 'none', boxSizing: 'border-box', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
          </div>
          {/* Stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 36, marginTop: 36, flexWrap: 'wrap' }}>
            {[
              { val: universites.length, label: 'Établissements' },
              { val: '120+', label: 'Facultés' },
              { val: '480+', label: 'Filières' },
              { val: '48 000+', label: 'Étudiants' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#9FE1CB' }}>{s.val}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ GRILLE UNIVERSITÉS ══ */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800 }}>
            {uniFiltered.length} université{uniFiltered.length > 1 ? 's' : ''}{recherche ? ` pour "${recherche}"` : ''}
          </h2>
          {selectedUni && (
            <button onClick={() => { setSelectedUni(null); setSelectedDept(null); setFilieres([]); setDepartements([]); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
              <FaTimes style={{ fontSize: 11 }} /> Désélectionner
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : uniFiltered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: 16, color: 'var(--text-muted)' }}>
            <FaUniversity style={{ fontSize: 48, marginBottom: 16 }} />
            <p>Aucune université trouvée pour "{recherche}"</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
            {uniFiltered.map(uni => <UniCard key={uni.id} uni={uni} selected={selectedUni?.id === uni.id} onClick={handleUniClick} />)}
          </div>
        )}
      </section>

      {/* ══ PANEL EXPLORATION (Départements + Filières) ══ */}
      {selectedUni && (
        <section ref={panelRef} style={{ maxWidth: 1280, margin: '32px auto 0', padding: '0 20px 40px' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', fontWeight: 700 }}>
              <FaUniversity style={{ fontSize: 12 }} /> {selectedUni.nom}
            </span>
            {selectedDept && <><FaChevronRight style={{ fontSize: 10 }} /><span style={{ color: C.blue, fontWeight: 600 }}>{selectedDept.nom}</span></>}
          </div>

          <div className="up-explore-grid" style={{ display: 'grid', gridTemplateColumns: selectedDept ? '1fr 1fr' : '1fr', gap: 20 }}>

            {/* ─ Départements ─ */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${getUniColor(selectedUni.code).bg}18`, color: getUniColor(selectedUni.code).bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  <FaBook />
                </div>
                <div>
                  <h3 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 16, margin: 0 }}>Facultés & Départements</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedUni.nom}</div>
                </div>
              </div>

              {loadingDept ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[...Array(4)].map((_, i) => <div key={i} style={{ height: 52, borderRadius: 10, background: 'var(--bg-secondary)', animation: 'pulse 1.5s infinite' }} />)}
                </div>
              ) : departements.length === 0 ? (
                <EmptyState icon={<FaBook />} text="Aucune faculté disponible pour l'instant." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {departements.map((dept, i) => {
                    const isActive = selectedDept?.id === dept.id;
                    const color = getUniColor(selectedUni.code).bg;
                    return (
                      <button key={dept.id} onClick={() => handleDeptClick(dept)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', borderRadius: 12, border: `2px solid ${isActive ? color : 'var(--border-color)'}`,
                        background: isActive ? `${color}12` : 'var(--bg-secondary)', cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.18s',
                      }}
                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-card)'; } }}
                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-secondary)'; } }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: isActive ? color : 'var(--border-color)', color: isActive ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                            {(dept.code || dept.nom || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: isActive ? color : 'var(--text-primary)' }}>{dept.nom}</div>
                            {dept.code && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{dept.code}</div>}
                          </div>
                        </div>
                        <FaChevronRight style={{ color: isActive ? color : 'var(--text-muted)', fontSize: 12, flexShrink: 0 }} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ─ Filières ─ */}
            {selectedDept && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.green}18`, color: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    <FaGraduationCap />
                  </div>
                  <div>
                    <h3 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 16, margin: 0 }}>Filières disponibles</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedDept.nom}</div>
                  </div>
                </div>

                {loadingFil ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[...Array(3)].map((_, i) => <div key={i} style={{ height: 72, borderRadius: 12, background: 'var(--bg-secondary)', animation: 'pulse 1.5s infinite' }} />)}
                  </div>
                ) : filieres.length === 0 ? (
                  <EmptyState icon={<FaGraduationCap />} text="Aucune filière pour ce département." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 480, overflowY: 'auto', paddingRight: 4 }}>
                    {filieres.map(filiere => (
                      <FiliereCard key={filiere.id} filiere={filiere} onInfo={setInfoFiliere} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══ CTA ══ */}
      <section style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`, margin: '48px 0 0', padding: '52px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎓</div>
          <h2 style={{ color: 'white', fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Prêt à vous inscrire ?</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
            Choisissez votre université et votre filière, et démarrez votre dossier d'inscription en ligne.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/inscriptions-universites" style={{ padding: '13px 28px', background: C.green, color: 'white', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaGraduationCap /> Démarrer mon inscription
            </Link>
            <Link to="/orientation" style={{ padding: '13px 28px', background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
              Tester mon orientation →
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background: '#0A1628', color: 'rgba(255,255,255,0.5)', padding: '30px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#1D9E75,#185FA5)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: 13 }}>G</div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>GENUC</span>
        </div>
        <p style={{ fontSize: 12, margin: 0 }}>Plateforme Nationale de Gestion Universitaire — RDC · support@genuc.cd</p>
      </footer>

      {/* ══ MODAL INFO FILIÈRE ══ */}
      {infoFiliere && <FilieresInfoModal filiere={infoFiliere} onClose={() => setInfoFiliere(null)} />}

      <style>{`
        .up-search-input::placeholder { color: var(--text-muted); }
        @media (max-width: 640px) {
          .up-nav-secondary { display: none !important; }
        }
        @media (max-width: 900px) {
          .up-explore-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

/* ════ COMPOSANTS ════ */

function UniCard({ uni, selected, onClick }) {
  const [imgError, setImgError] = useState(false);
  const uc = getUniColor(uni.code);
  const initiales = (uni.code || uni.nom || 'U').substring(0, 3).toUpperCase();
  const logoSrc = resolveFileUrl(uni.logo) || UNI_LOGOS[uni.code] || null;

  return (
    <div onClick={() => onClick(uni)} style={{
      background: 'var(--bg-card)', borderRadius: 18, padding: 20, cursor: 'pointer',
      border: `2px solid ${selected ? uc.bg : 'transparent'}`,
      boxShadow: selected ? `0 8px 32px ${uc.bg}30` : '0 2px 12px rgba(0,0,0,0.06)',
      transition: 'all 0.22s', transform: selected ? 'translateY(-2px)' : 'none',
    }}
      onMouseEnter={e => { if (!selected) { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
      onMouseLeave={e => { if (!selected) { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none'; } }}>

      {/* Logo / Avatar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <div style={{ width: 58, height: 58, borderRadius: 14, flexShrink: 0, overflow: 'hidden', border: `2px solid ${uc.bg}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: uc.light }}>
          {logoSrc && !imgError ? (
            <img
              src={logoSrc}
              alt={uni.code}
              onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 5 }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${uc.bg}, ${uc.bg}cc)`, color: 'white', fontWeight: 900, fontSize: 15, letterSpacing: '-0.5px' }}>
              {initiales}
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.3, marginBottom: 3 }}>{uni.nom}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
            <FaMapMarkerAlt style={{ color: uc.bg, fontSize: 10 }} />
            {uni.ville || 'RDC'}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
        {[
          // Champs réellement renvoyés par /api/universites/public : nbFacultes et
          // nbDepartements sont dérivés des listes saisies à l'enregistrement,
          // nbEtudiants compte les inscriptions VALIDE. On affiche 0 plutôt qu'un
          // tiret : un établissement neuf a bien zéro étudiant, ce n'est pas une
          // donnée manquante.
          { label: 'Facultés',    val: uni.nbFacultes ?? '—' },
          { label: 'Départements', val: uni.nbDepartements ?? '—' },
          { label: 'Étudiants',   val: uni.nbEtudiants == null ? '—' : (uni.nbEtudiants > 999 ? `${(uni.nbEtudiants/1000).toFixed(1)}k` : uni.nbEtudiants) },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: uc.bg }}>{s.val}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Badge accréditation + bouton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ padding: '3px 10px', borderRadius: 20, background: uc.light, color: uc.bg, fontSize: 11, fontWeight: 700 }}>
          {uni.typeEtablissement || 'Établissement'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: selected ? uc.bg : 'var(--text-muted)', fontWeight: selected ? 700 : 400, transition: 'all 0.2s' }}>
          {selected ? 'Sélectionnée ✓' : 'Explorer'} <FaChevronRight style={{ fontSize: 9 }} />
        </span>
      </div>
    </div>
  );
}

function FiliereCard({ filiere, onInfo }) {
  const deb = getDebouches(filiere.nom);
  return (
    <div style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--bg-secondary)', border: '1.5px solid var(--border-color)', transition: 'all 0.18s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14, marginBottom: 4, lineHeight: 1.3 }}>{filiere.nom}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: deb.color, fontWeight: 600, background: `${deb.color}12`, padding: '2px 8px', borderRadius: 20 }}>
              <deb.Icon style={{ fontSize: 10 }} /> {deb.label}
            </span>
            {filiere.duree && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <FaClock style={{ fontSize: 10 }} /> {filiere.duree}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 7, flexShrink: 0, alignItems: 'center' }}>
          <button onClick={() => onInfo(filiere)} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
            background: `linear-gradient(135deg, ${deb.color}, ${deb.color}bb)`,
            color: 'white', border: 'none', borderRadius: 20, cursor: 'pointer',
            fontSize: 12, fontWeight: 700, boxShadow: `0 2px 8px ${deb.color}40`,
            transition: 'all 0.18s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = `0 4px 14px ${deb.color}55`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 2px 8px ${deb.color}40`; }}>
            <FaInfoCircle style={{ fontSize: 11 }} /> Info
          </button>
          <Link to={`/inscriptions?filiere=${filiere.id}`} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
            background: C.green, color: 'white', borderRadius: 20, textDecoration: 'none',
            fontSize: 12, fontWeight: 700,
          }}>
            Postuler <FaArrowRight style={{ fontSize: 9 }} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function FilieresInfoModal({ filiere, onClose }) {
  const deb = getDebouches(filiere.nom);
  const exigences = (filiere.conditionsAdmission || '').split('\n').filter(l => l.trim());
  const documentsRequis = parseDocumentsRequis(filiere.documentsRequis);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(11,31,74,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', borderRadius: 24, maxWidth: 640, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${deb.color}, ${deb.color}bb)`, padding: '28px 28px 22px', position: 'relative', color: 'white' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
            <FaTimes />
          </button>
          <div style={{ fontSize: 36, marginBottom: 10 }}><deb.Icon /></div>
          <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 600, letterSpacing: 1, marginBottom: 5 }}>FILIÈRE</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 8px' }}>{filiere.nom}</h2>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, opacity: 0.9, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><FaClock style={{ fontSize: 11 }} /> Durée : {filiere.duree || deb.duree}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><FaBriefcase style={{ fontSize: 11 }} /> {deb.label}</span>
          </div>
        </div>

        <div style={{ padding: 28 }}>
          {/* Description */}
          {filiere.description && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{filiere.description}</p>
            </div>
          )}

          {/* Exigences d'admission définies par l'université */}
          {exigences.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaCheckCircle style={{ color: deb.color }} /> Exigences d'admission
              </h4>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.9 }}>
                {exigences.map((e, i) => <li key={i}>{e.trim()}</li>)}
              </ul>
            </div>
          )}

          {/* Test d'admission exigé par la filière */}
          {filiere.testAdmissionRequis && (
            <div style={{ marginBottom: 24, background: 'rgba(192,122,43,0.12)', border: '1px solid #fcd34d', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontWeight: 800, color: '#92600a', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                📝 Test d'admission requis
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#92600a', lineHeight: 1.6 }}>
                L'admission à cette filière est soumise à la réussite d'un test d'admission. Vous serez convoqué(e) après le dépôt de votre dossier.
              </p>
            </div>
          )}

          {/* Documents à téléverser lors de l'inscription */}
          {documentsRequis && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaBook style={{ color: deb.color }} /> Documents à fournir
              </h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {documentsRequis.map(d => (
                  <span
                    key={d.key}
                    title={d.obligatoire ? 'Document obligatoire' : 'Document facultatif'}
                    style={{ padding: '5px 12px', borderRadius: 20, background: `${deb.color}14`, color: deb.color, fontSize: 12, fontWeight: 600 }}
                  >
                    {libelleDocument(d.key)}{d.obligatoire ? ' *' : ''}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>* obligatoire</div>
            </div>
          )}

          {/* Métiers */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaBriefcase style={{ color: deb.color }} /> Métiers après diplôme
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {deb.metiers.map(m => (
                <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: `${deb.color}0e`, borderRadius: 10, fontSize: 13, color: 'var(--text-primary)' }}>
                  <FaCheckCircle style={{ color: deb.color, fontSize: 12, flexShrink: 0 }} /> {m}
                </div>
              ))}
            </div>
          </div>

          {/* Secteurs employeurs */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaBuilding style={{ color: deb.color }} /> Principaux employeurs en RDC
            </h4>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {deb.secteurs.map(s => (
                <span key={s} style={{ padding: '5px 12px', borderRadius: 20, background: `${deb.color}14`, color: deb.color, fontSize: 12, fontWeight: 700 }}>{s}</span>
              ))}
            </div>
          </div>

          {/* Salaire */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 26, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, padding: '14px 18px', background: 'var(--bg-secondary)', borderRadius: 14, minWidth: 140 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>SALAIRE ESTIMÉ EN RDC</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.green }}>{deb.salaire}</div>
            </div>
            <div style={{ flex: 1, padding: '14px 18px', background: 'var(--bg-secondary)', borderRadius: 14, minWidth: 140 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>DURÉE DES ÉTUDES</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: deb.color }}>{filiere.duree || deb.duree}</div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to={`/inscriptions?filiere=${filiere.id}`} style={{ flex: 1, padding: '13px', background: `linear-gradient(135deg, ${deb.color}, ${deb.color}bb)`, color: 'white', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <FaGraduationCap /> Postuler à cette filière
            </Link>
            <Link to="/orientation" style={{ padding: '13px 18px', background: `${C.blue}18`, color: C.blue, borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FaStar style={{ fontSize: 12 }} /> Test orientation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>{text}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
        <div style={{ width: 58, height: 58, borderRadius: 14, background: 'var(--bg-secondary)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, background: 'var(--bg-secondary)', borderRadius: 6, marginBottom: 8 }} />
          <div style={{ height: 11, background: 'var(--bg-secondary)', borderRadius: 6, width: '60%' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
        {[...Array(3)].map((_, i) => <div key={i} style={{ height: 44, background: 'var(--bg-secondary)', borderRadius: 10 }} />)}
      </div>
      <div style={{ height: 24, background: 'var(--bg-secondary)', borderRadius: 20, width: '40%' }} />
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  );
}

