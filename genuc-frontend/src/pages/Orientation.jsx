import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  FaBriefcase, FaGraduationCap, FaStar, FaMapMarkerAlt, FaChevronRight, FaSearch, FaDownload,
  FaLightbulb, FaUsers, FaCalendarAlt, FaPlay,
  FaCheckCircle, FaArrowRight, FaQuoteLeft, FaMicroscope, FaBalanceScale, FaHeartbeat, FaLaptopCode,
  FaIndustry, FaLeaf, FaBuilding, FaChartLine, FaHome, FaSignInAlt
} from 'react-icons/fa';
import './Orientation.css';

/* ── Palette ── */
const C = {
  navy: '#0B1F4A',
  blue: '#185FA5',
  green: '#1D9E75',
  orange: '#C07A2B',
  purple: '#6B21A8',
  red: '#B91C1C',
};

/* ── Données statiques ── */
const DOMAINES = [
  { id: 'info',   icon: <FaLaptopCode />,  label: 'Informatique & Tech',    color: C.blue,   metiers: ['Développeur Full-Stack','Data Scientist','Cybersécurité','DevOps'], salaire: '800–2500 USD/mois', croissance: '+42%' },
  { id: 'sante',  icon: <FaHeartbeat />,   label: 'Santé & Médecine',       color: C.red,    metiers: ['Médecin généraliste','Infirmier(e)','Pharmacien','Sage-femme'], salaire: '600–3000 USD/mois', croissance: '+28%' },
  { id: 'droit',  icon: <FaBalanceScale />,label: 'Droit & Sciences Po',    color: '#4F46E5',   metiers: ['Avocat','Notaire','Magistrat','Juriste d\'entreprise'], salaire: '700–2000 USD/mois', croissance: '+15%' },
  { id: 'eco',    icon: <FaChartLine />,   label: 'Économie & Finance',     color: C.green,  metiers: ['Analyste financier','Comptable','Banquier','Auditeur'], salaire: '800–2800 USD/mois', croissance: '+20%' },
  { id: 'agro',   icon: <FaLeaf />,        label: 'Agronomie & Élevage',    color: '#1D9E75',metiers: ['Agronome','Vétérinaire','Ingénieur rural','Hydrologue'], salaire: '500–1800 USD/mois', croissance: '+35%' },
  { id: 'mine',   icon: <FaIndustry />,    label: 'Mines & Géologie',       color: C.orange, metiers: ['Géologue','Ingénieur minier','Topographe','Métallurgiste'], salaire: '1200–4000 USD/mois', croissance: '+18%' },
  { id: 'gestion',icon: <FaBuilding />,    label: 'Gestion & Management',   color: C.purple, metiers: ['Manager','RH','Logisticien','Chef de projet'], salaire: '700–2500 USD/mois', croissance: '+22%' },
  { id: 'science',icon: <FaMicroscope />,  label: 'Sciences & Recherche',   color: '#0E7490', metiers: ['Chercheur','Chimiste','Physicien','Biologiste'], salaire: '600–2200 USD/mois', croissance: '+12%' },
];

const QUIZ_QUESTIONS = [
  { q: 'Qu\'est-ce qui vous attire le plus ?',
    options: ['Résoudre des problèmes techniques','Aider les gens directement','Analyser des données et chiffres','Créer et innover'] },
  { q: 'Votre environnement de travail idéal ?',
    options: ['Laboratoire / Bureau technique','Hôpital / Terrain','Bureau / Finance','Studio / Espace créatif'] },
  { q: 'Quel est votre point fort ?',
    options: ['Logique et précision','Empathie et communication','Organisation et rigueur','Créativité et vision'] },
  { q: 'Quelle activité vous plaît le plus ?',
    options: ['Programmer ou construire','Soigner ou conseiller','Compter et planifier','Dessiner ou inventer'] },
  { q: 'Dans 10 ans, vous vous voyez ?',
    options: ['Expert technique reconnu','Professionnel de santé ou social','Leader en finance ou management','Entrepreneur ou créatif'] },
];

const QUIZ_RESULTATS = [
  { profil: 'Profil Tech & Sciences', icon: <FaLaptopCode />, color: C.blue,
    desc: 'Vous aimez résoudre des problèmes complexes avec logique. L\'informatique, les sciences et l\'ingénierie vous correspondent.',
    filieres: ['Informatique','Génie civil','Électronique','Sciences exactes'] },
  { profil: 'Profil Humain & Social', icon: <FaHeartbeat />, color: C.red,
    desc: 'Vous êtes orienté vers les autres. La médecine, le droit, l\'enseignement et le social vous épanouiront.',
    filieres: ['Médecine','Droit','Travail social','Psychologie'] },
  { profil: 'Profil Gestion & Finance', icon: <FaChartLine />, color: C.green,
    desc: 'Organisé et rigoureux, vous excellez dans les chiffres et la stratégie. La finance et le management sont faits pour vous.',
    filieres: ['Économie','Comptabilité','Management','Commerce international'] },
  { profil: 'Profil Créatif & Entrepreneur', icon: <FaLightbulb />, color: C.orange,
    desc: 'Vous avez une vision unique et aimez créer. L\'entrepreneuriat, le marketing et les arts vous correspondent.',
    filieres: ['Marketing','Architecture','Communication','Arts & Design'] },
];

const OFFRES_DEMO = [
  { id:1, titre:'Développeur Mobile (Flutter)', entreprise:'Orange RDC', ville:'Kinshasa', type:'CDI', secteur:'Télécoms', logo:'🍊', salaire:'1500 USD/mois', date:'2026-07-01' },
  { id:2, titre:'Stage Analyste Financier', entreprise:'Rawbank', ville:'Kinshasa', type:'Stage', secteur:'Finance', logo:'🏦', salaire:'400 USD/mois', date:'2026-07-05' },
  { id:3, titre:'Ingénieur Géologue', entreprise:'Glencore DRC', ville:'Kolwezi', type:'CDI', secteur:'Mines', logo:'⛏️', salaire:'3000 USD/mois', date:'2026-06-28' },
  { id:4, titre:'Médecin Généraliste', entreprise:'MSF Congo', ville:'Goma', type:'CDD', secteur:'Santé', logo:'🏥', salaire:'2000 USD/mois', date:'2026-07-10' },
  { id:5, titre:'Juriste d\'entreprise', entreprise:'SNCC', ville:'Lubumbashi', type:'CDI', secteur:'Droit', logo:'⚖️', salaire:'1200 USD/mois', date:'2026-07-03' },
  { id:6, titre:'Agronome de terrain', entreprise:'World Vision RDC', ville:'Kananga', type:'CDD', secteur:'Agro', logo:'🌱', salaire:'900 USD/mois', date:'2026-07-08' },
  { id:7, titre:'Data Analyst', entreprise:'BCDC', ville:'Kinshasa', type:'Stage', secteur:'Finance', logo:'📊', salaire:'350 USD/mois', date:'2026-07-15' },
  { id:8, titre:'Infirmier(e) pédiatrique', entreprise:'Clinique Ngaliema', ville:'Kinshasa', type:'CDI', secteur:'Santé', logo:'💊', salaire:'800 USD/mois', date:'2026-07-02' },
];

const TEMOIGNAGES = [
  { nom:'Jean-Paul Mukendi', promo:'Génie Informatique 2022', universite:'UNIKIN', emploi:'Software Engineer @ Vodacom DRC', avatar:'JM',
    texte:'GENUC m\'a aidé à structurer mon parcours. La page orientation m\'a orienté vers l\'informatique dès ma 1ère année. Aujourd\'hui j\'ai un CDI à 23 ans.', note:5 },
  { nom:'Espérance Nsimba', promo:'Médecine 2021', universite:'UNIKIN', emploi:'Médecin résidente @ HGR Kinshasa', avatar:'EN',
    texte:'Les fiches métiers m\'ont aidée à choisir entre pédiatrie et urgences. Je recommande l\'orientation GENUC à tout étudiant qui hésite.', note:5 },
  { nom:'Patrick Katumba', promo:'Finance 2023', universite:'HEC-KIN', emploi:'Analyste crédit @ Equity Bank', avatar:'PK',
    texte:'J\'ai trouvé mon stage via GENUC. L\'entreprise m\'a gardé en CDI après. L\'outil de recherche d\'offres est excellent pour la RDC.', note:5 },
];

const EVENEMENTS = [
  { date:'15 Jul', titre:'Forum Emploi UNIKIN 2026', lieu:'Campus UNIKIN, Kinshasa', type:'Salon', places:500, icon:'🎪' },
  { date:'22 Jul', titre:'Webinaire : Travailler dans les mines en RDC', lieu:'En ligne (Zoom)', type:'Webinaire', places:200, icon:'🎥' },
  { date:'30 Jul', titre:'Job Dating Finance & Banque', lieu:'HEC-KIN, Kinshasa', type:'Job Dating', places:80, icon:'🤝' },
  { date:'10 Août', titre:'Atelier CV & LinkedIn', lieu:'ISP Kinshasa + En ligne', type:'Atelier', places:150, icon:'📝' },
];

const RESSOURCES = [
  { titre:'Guide CV pour jeunes diplômés RDC', desc:'Template Word + conseils adaptés au marché congolais', icon:'📄', tag:'PDF gratuit', color: C.blue },
  { titre:'100 Questions d\'entretien fréquentes', desc:'Préparez-vous aux questions des recruteurs RDC/internationaux', icon:'🎯', tag:'PDF gratuit', color: C.green },
  { titre:'Secteurs porteurs RDC 2025–2030', desc:'Rapport sur les métiers d\'avenir : Tech, Mines, Santé, Agro', icon:'📊', tag:'Rapport', color: C.orange },
  { titre:'Modèle de lettre de motivation', desc:'3 templates professionnels prêts à personnaliser', icon:'✉️', tag:'Word/PDF', color: C.purple },
  { titre:'Annuaire ONEM Congo', desc:'Office National de l\'Emploi — offres officielles', icon:'🏛️', tag:'Site externe', color: '#475569' },
  { titre:'Guide Stage & Contrat', desc:'Vos droits, salaire minimum, durée légale en RDC', icon:'⚖️', tag:'PDF gratuit', color: C.red },
];

const VILLES = ['Toutes les villes', 'Kinshasa', 'Lubumbashi', 'Goma', 'Bukavu', 'Kolwezi', 'Kananga', 'Matadi', 'Kisangani'];
const TYPES   = ['Tous les types', 'Stage', 'CDI', 'CDD', 'Freelance'];
const SECTEURS_F = ['Tous les secteurs', 'Informatique', 'Finance', 'Santé', 'Mines', 'Droit', 'Agro', 'Télécoms'];

/* ══════════════════════════════════════════════════════════════════ */
export default function Orientation() {
  const [activeSection, setActiveSection] = useState('quiz');
  const [quizStep, setQuizStep]   = useState(0);   /* -1 = pas commencé, 0-4 = questions, 5 = résultat */
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [domaineActif, setDomaineActif] = useState(null);
  const [offres, setOffres] = useState(OFFRES_DEMO);
  const [filtreVille, setFiltreVille] = useState('Toutes les villes');
  const [filtreType, setFiltreType]   = useState('Tous les types');
  const [filtreSecteur, setFiltreSecteur] = useState('Tous les secteurs');
  const [filtreRecherche, setFiltreRecherche] = useState('');
  const sectionRefs = useRef({});

  useEffect(() => {
    api.get('/api/emploi/offres/publiques')
      .then(r => { if (r.data?.length) setOffres(r.data); })
      .catch(() => {});
  }, []);

  const scrollTo = (id) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  };

  /* Quiz */
  const repondre = (idx) => {
    const rep = [...quizAnswers, idx];
    setQuizAnswers(rep);
    if (quizStep < QUIZ_QUESTIONS.length - 1) setQuizStep(s => s + 1);
    else setQuizStep(QUIZ_QUESTIONS.length); // résultat
  };

  const quizResultatIndex = () => {
    if (quizAnswers.length < QUIZ_QUESTIONS.length) return 0;
    const counts = [0, 0, 0, 0];
    quizAnswers.forEach(a => counts[a]++);
    return counts.indexOf(Math.max(...counts));
  };

  /* Offres filtrées */
  const offresFiltrees = offres.filter(o => {
    const matchVille   = filtreVille   === 'Toutes les villes'   || o.ville === filtreVille;
    const matchType    = filtreType    === 'Tous les types'       || o.type === filtreType;
    const matchSecteur = filtreSecteur === 'Tous les secteurs'    || o.secteur === filtreSecteur;
    const matchSearch  = !filtreRecherche || o.titre.toLowerCase().includes(filtreRecherche.toLowerCase()) || o.entreprise.toLowerCase().includes(filtreRecherche.toLowerCase());
    return matchVille && matchType && matchSecteur && matchSearch;
  });

  const NAV_LINKS = [
    { id: 'quiz',        label: 'Test d\'orientation' },
    { id: 'domaines',    label: 'Filières' },
    { id: 'offres',      label: 'Offres' },
    { id: 'conseils',    label: 'CV & Entretien' },
    { id: 'evenements',  label: 'Événements' },
    { id: 'temoignages', label: 'Témoignages' },
    { id: 'ressources',  label: 'Ressources' },
  ];

  return (
    <div className="orientation-page" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", background: 'var(--bg-secondary)', minHeight: '100vh' }}>

      {/* ══ TOPBAR ══ */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 1000, background: C.navy, boxShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
        <div className="orientation-topbar-inner" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #1D9E75, #185FA5)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: 16 }}>G</div>
            <span style={{ color: 'white', fontWeight: 800, fontSize: 18, letterSpacing: '-0.3px' }}>GENUC</span>
          </Link>

          {/* Nav sections desktop */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} className="hide-mobile">
            {NAV_LINKS.map(n => (
              <button key={n.id} onClick={() => scrollTo(n.id)} style={{
                background: 'none', border: 'none', color: activeSection === n.id ? '#9FE1CB' : 'rgba(255,255,255,0.75)',
                borderBottom: activeSection === n.id ? '2px solid #9FE1CB' : '2px solid transparent',
                padding: '6px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
              }}>{n.label}</button>
            ))}
          </div>

          <div className="orientation-top-actions" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link className="orientation-home-link" to="/" style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}>
              <FaHome /> Accueil
            </Link>
            <Link to="/login" style={{ padding: '8px 18px', background: C.green, color: 'white', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
              Se connecter
            </Link>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, #0D2B6B 40%, #1a4a8a 70%, ${C.green} 100%)`,
        padding: '80px 24px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Motif de points */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        {/* Cercles décoratifs */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(29,158,117,0.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -40, width: 240, height: 240, borderRadius: '50%', background: 'rgba(24,95,165,0.18)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 780, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(29,158,117,0.2)', border: '1px solid rgba(29,158,117,0.4)', borderRadius: 30, padding: '6px 16px', marginBottom: 24 }}>
            <FaStar style={{ color: '#9FE1CB', fontSize: 12 }} />
            <span style={{ color: '#9FE1CB', fontSize: 13, fontWeight: 600 }}>Plateforme d'orientation #1 en RDC</span>
          </div>
          <h1 style={{ color: 'white', fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-1px' }}>
            Construisez votre avenir<br />
            <span style={{ background: 'linear-gradient(90deg, #9FE1CB, #7EC8D8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>avec confiance</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: 18, lineHeight: 1.7, marginBottom: 36, maxWidth: 600, margin: '0 auto 36px' }}>
            Tests d'orientation, offres de stages & emplois, conseils CV, événements carrière — tout ce qu'il faut pour réussir professionnellement en RDC et à l'international.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => scrollTo('quiz')} style={{ padding: '14px 30px', background: C.green, color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(29,158,117,0.4)' }}>
              <FaPlay /> Faire mon test d'orientation
            </button>
            <button onClick={() => scrollTo('offres')} style={{ padding: '14px 30px', background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaBriefcase /> Voir les offres d'emploi
            </button>
          </div>

          {/* Stats rapides */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 52, flexWrap: 'wrap' }}>
            {[
              { val: '48 000+', label: 'Étudiants guidés' },
              { val: '320+', label: 'Offres actives' },
              { val: '85%', label: 'Taux d\'emploi à 1 an' },
              { val: '15', label: 'Villes couvertes' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#9FE1CB' }}>{s.val}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>

        {/* ══ SECTION 1 : TEST D'ORIENTATION ══ */}
        <section ref={el => sectionRefs.current['quiz'] = el} style={{ paddingTop: 70, paddingBottom: 60 }}>
          <SectionHeader
            badge="🎯 Découverte de soi"
            title="Quel profil professionnel êtes-vous ?"
            sub="5 questions pour découvrir les filières et métiers qui vous correspondent vraiment."
          />

          {!quizStarted ? (
            <div style={{ maxWidth: 680, margin: '0 auto', background: 'var(--bg-card)', borderRadius: 20, padding: 40, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>🧠</div>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Test RIASEC simplifié</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
                Ce test de personnalité adapté au contexte universitaire africain vous aide à identifier vos forces et vos centres d'intérêt pour mieux choisir votre voie.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
                {['⏱ 2 minutes', '📋 5 questions', '✅ Résultat immédiat'].map(t => (
                  <span key={t} style={{ padding: '6px 14px', background: 'rgba(24,95,165,0.12)', color: C.blue, borderRadius: 20, fontSize: 13, fontWeight: 600 }}>{t}</span>
                ))}
              </div>
              <button onClick={() => setQuizStarted(true)} style={{ padding: '14px 36px', background: `linear-gradient(135deg, ${C.blue}, ${C.green})`, color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(24,95,165,0.35)' }}>
                Commencer le test →
              </button>
            </div>
          ) : quizStep < QUIZ_QUESTIONS.length ? (
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              {/* Barre de progression */}
              <div style={{ marginBottom: 28, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Question {quizStep + 1} sur {QUIZ_QUESTIONS.length}</div>
                <div style={{ height: 6, background: '#e0e7ff', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${((quizStep) / QUIZ_QUESTIONS.length) * 100}%`, background: `linear-gradient(90deg, ${C.blue}, ${C.green})`, borderRadius: 10, transition: 'width 0.4s ease' }} />
                </div>
              </div>
              <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 40, boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800, marginBottom: 28, lineHeight: 1.4 }}>{QUIZ_QUESTIONS[quizStep].q}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {QUIZ_QUESTIONS[quizStep].options.map((opt, i) => (
                    <button key={i} onClick={() => repondre(i)} style={{
                      padding: '16px 20px', background: 'var(--bg-secondary)', border: '2px solid var(--border-color)', borderRadius: 12,
                      textAlign: 'left', cursor: 'pointer', fontSize: 15, color: '#334155', fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.background = '#f0f7ff'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#f8f9fb'; }}>
                      <span style={{ width: 28, height: 28, borderRadius: '50%', background: `${C.blue}15`, color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Résultat */
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              {(() => {
                const r = QUIZ_RESULTATS[quizResultatIndex()];
                return (
                  <div style={{ background: 'var(--bg-card)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
                    <div style={{ background: `linear-gradient(135deg, ${r.color}, ${r.color}cc)`, padding: '36px 40px', color: 'white', textAlign: 'center' }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>{r.icon}</div>
                      <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6, fontWeight: 600, letterSpacing: 1 }}>VOTRE PROFIL</div>
                      <h3 style={{ fontSize: 26, fontWeight: 900, marginBottom: 0 }}>{r.profil}</h3>
                    </div>
                    <div style={{ padding: 36 }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>{r.desc}</p>
                      <div style={{ marginBottom: 28 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Filières recommandées</div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {r.filieres.map(f => (
                            <span key={f} style={{ padding: '6px 14px', background: `${r.color}15`, color: r.color, borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{f}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <button onClick={() => { setQuizStep(0); setQuizAnswers([]); }} style={{ padding: '10px 20px', background: 'rgba(24,95,165,0.12)', color: C.blue, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                          ↺ Refaire le test
                        </button>
                        <button onClick={() => scrollTo('domaines')} style={{ padding: '10px 20px', background: r.color, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                          Explorer les filières →
                        </button>
                        <button onClick={() => scrollTo('offres')} style={{ padding: '10px 20px', background: 'rgba(24,95,165,0.12)', color: 'var(--text-secondary)', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                          Voir les offres d'emploi
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </section>

        {/* ══ SECTION 2 : DOMAINES & FILIÈRES ══ */}
        <section ref={el => sectionRefs.current['domaines'] = el} style={{ paddingBottom: 60 }}>
          <SectionHeader
            badge="🎓 Explorer"
            title="Domaines & Filières"
            sub="Découvrez les débouchés, salaires et perspectives de chaque domaine en RDC."
          />
          <div className="orientation-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16, marginBottom: 24 }}>
            {DOMAINES.map(d => (
              <div key={d.id} onClick={() => setDomaineActif(domaineActif?.id === d.id ? null : d)}
                style={{
                  background: 'var(--bg-card)', borderRadius: 16, padding: 24, cursor: 'pointer', transition: 'all 0.25s',
                  border: `2px solid ${domaineActif?.id === d.id ? d.color : 'transparent'}`,
                  boxShadow: domaineActif?.id === d.id ? `0 8px 28px ${d.color}25` : '0 2px 8px rgba(0,0,0,0.05)',
                  transform: domaineActif?.id === d.id ? 'translateY(-2px)' : 'none',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${d.color}18`, color: d.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    {d.icon}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#1D9E75', background: '#E1F5EE', padding: '3px 8px', borderRadius: 20 }}>
                    {d.croissance} croissance
                  </span>
                </div>
                <h4 style={{ color: 'var(--text-primary)', fontWeight: 800, marginBottom: 6, fontSize: 15 }}>{d.label}</h4>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{d.salaire}</div>
                {domaineActif?.id === d.id && (
                  <div style={{ borderTop: `1px solid ${d.color}25`, paddingTop: 14, marginTop: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Métiers phares</div>
                    {d.metiers.map(m => (
                      <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#445', marginBottom: 5 }}>
                        <FaCheckCircle style={{ color: d.color, fontSize: 11, flexShrink: 0 }} /> {m}
                      </div>
                    ))}
                    <button onClick={() => scrollTo('offres')} style={{ marginTop: 14, padding: '8px 14px', background: d.color, color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
                      Voir les offres dans ce secteur →
                    </button>
                  </div>
                )}
                {domaineActif?.id !== d.id && (
                  <div style={{ fontSize: 12, color: d.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Voir les métiers <FaChevronRight style={{ fontSize: 10 }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ══ SECTION 3 : OFFRES ══ */}
        <section ref={el => sectionRefs.current['offres'] = el} style={{ paddingBottom: 60 }}>
          <SectionHeader
            badge="💼 Opportunités"
            title="Offres de stages & emplois"
            sub={`${offresFiltrees.length} offre${offresFiltrees.length > 1 ? 's' : ''} disponible${offresFiltrees.length > 1 ? 's' : ''} en RDC`}
          />

          {/* Barre de recherche */}
          <div className="orientation-filter-card" style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                <FaSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }} />
                <input value={filtreRecherche} onChange={e => setFiltreRecherche(e.target.value)}
                  placeholder="Rechercher un titre, entreprise..."
                  style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <select value={filtreVille} onChange={e => setFiltreVille(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg-card)', cursor: 'pointer' }}>
                {VILLES.map(v => <option key={v}>{v}</option>)}
              </select>
              <select value={filtreType} onChange={e => setFiltreType(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg-card)', cursor: 'pointer' }}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <select value={filtreSecteur} onChange={e => setFiltreSecteur(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg-card)', cursor: 'pointer' }}>
                {SECTEURS_F.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {offresFiltrees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--bg-card)', borderRadius: 16, color: 'var(--text-muted)' }}>
              <FaBriefcase style={{ fontSize: 48, marginBottom: 16 }} />
              <p>Aucune offre ne correspond à vos critères.</p>
              <button onClick={() => { setFiltreVille('Toutes les villes'); setFiltreType('Tous les types'); setFiltreSecteur('Tous les secteurs'); setFiltreRecherche(''); }}
                style={{ padding: '8px 20px', background: C.blue, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginTop: 12 }}>
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="orientation-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {offresFiltrees.map(o => <OffreCard key={o.id} offre={o} />)}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: C.navy, color: 'white', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
              Se connecter pour postuler directement <FaArrowRight />
            </Link>
          </div>
        </section>

        {/* ══ SECTION 4 : CONSEILS CV & ENTRETIEN ══ */}
        <section ref={el => sectionRefs.current['conseils'] = el} style={{ paddingBottom: 60 }}>
          <SectionHeader
            badge="📝 Conseils"
            title="Réussir CV & Entretien"
            sub="Guides pratiques adaptés au marché de l'emploi en RDC et à l'international."
          />
          <div className="orientation-two-column" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* CV */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ background: `linear-gradient(135deg, ${C.blue}, #0D2B6B)`, padding: '28px 28px 20px', color: 'white' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Construire un CV gagnant</h3>
                <p style={{ opacity: 0.8, fontSize: 13, lineHeight: 1.5 }}>Les standards attendus par les recruteurs RDC & internationaux</p>
              </div>
              <div style={{ padding: 24 }}>
                {[
                  { n:'1', t:'Photo professionnelle', d:'Fond neutre, tenue formelle, sourire naturel' },
                  { n:'2', t:'Accroche percutante', d:'2-3 lignes qui résument votre valeur ajoutée' },
                  { n:'3', t:'Expériences inversées', d:'La plus récente en premier, avec résultats chiffrés' },
                  { n:'4', t:'Compétences & langues', d:'Français, Lingala + Anglais = triple avantage RDC' },
                  { n:'5', t:'Pas plus de 2 pages', d:'Une page pour < 3 ans d\'expérience' },
                ].map(item => (
                  <div key={item.n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${C.blue}18`, color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{item.n}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{item.t}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.d}</div>
                    </div>
                  </div>
                ))}
                <button style={{ width: '100%', padding: '11px', background: C.blue, color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <FaDownload /> Télécharger modèle CV
                </button>
              </div>
            </div>

            {/* Entretien */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ background: `linear-gradient(135deg, ${C.green}, #0D7A5A)`, padding: '28px 28px 20px', color: 'white' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🤝</div>
                <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Maîtriser l'entretien</h3>
                <p style={{ opacity: 0.8, fontSize: 13, lineHeight: 1.5 }}>Techniques et questions fréquentes pour convaincre dès la première rencontre</p>
              </div>
              <div style={{ padding: 24 }}>
                {[
                  { q:'Parlez-moi de vous', a:'Répondez en 2 min : formations → expériences → ambitions' },
                  { q:'Pourquoi notre entreprise ?', a:'Montrez que vous avez fait des recherches sur l\'entreprise' },
                  { q:'Votre plus grande faiblesse ?', a:'Citez une vraie faiblesse + la solution que vous appliquez' },
                  { q:'Où vous voyez-vous dans 5 ans ?', a:'Alignez votre réponse avec le poste proposé' },
                  { q:'Prétentions salariales ?', a:'Donnez une fourchette basée sur le marché RDC' },
                ].map((item, i) => (
                  <div key={i} style={{ marginBottom: 14, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, borderLeft: `3px solid ${C.green}` }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 3 }}>"{item.q}"</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>→ {item.a}</div>
                  </div>
                ))}
                <button style={{ width: '100%', padding: '11px', background: C.green, color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <FaDownload /> Guide 100 questions
                </button>
              </div>
            </div>
          </div>

          {/* Conseil bonus */}
          <div className="orientation-tip" style={{ marginTop: 20, background: `linear-gradient(135deg, ${C.orange}15, ${C.orange}05)`, border: `1px solid ${C.orange}30`, borderRadius: 16, padding: 24, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 36, flexShrink: 0 }}>💡</div>
            <div>
              <h4 style={{ color: 'var(--text-primary)', fontWeight: 800, marginBottom: 8, fontSize: 16 }}>Conseil GENUC : Maîtrisez le français ET l'anglais</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                En RDC, les candidats bilingues (français + anglais) ont <strong>3× plus de chances</strong> d'être recrutés dans les multinationales comme Glencore, MSF, USAID, Vodacom ou les banques internationales. Investissez dans l'anglais professionnel — c'est le meilleur retour sur investissement de votre cursus.
              </p>
            </div>
          </div>
        </section>

        {/* ══ SECTION 5 : ÉVÉNEMENTS ══ */}
        <section ref={el => sectionRefs.current['evenements'] = el} style={{ paddingBottom: 60 }}>
          <SectionHeader
            badge="📅 Agenda"
            title="Événements Carrière"
            sub="Forums, webinaires et ateliers pour booster votre insertion professionnelle."
          />
          <div className="orientation-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {EVENEMENTS.map((e, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`, padding: '20px 20px 16px', color: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 28 }}>{e.icon}</span>
                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{e.type}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, marginTop: 10 }}>{e.date}</div>
                </div>
                <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 15, marginBottom: 10, lineHeight: 1.4 }}>{e.titre}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                    <FaMapMarkerAlt /> {e.lieu}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                    <FaUsers /> {e.places} places
                  </div>
                  <button style={{ marginTop: 'auto', padding: '9px', background: 'rgba(24,95,165,0.12)', color: C.blue, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    S'inscrire →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ SECTION 6 : TÉMOIGNAGES ══ */}
        <section ref={el => sectionRefs.current['temoignages'] = el} style={{ paddingBottom: 60 }}>
          <SectionHeader
            badge="⭐ Ils ont réussi"
            title="Témoignages d'anciens étudiants"
            sub="Des vrais parcours, de l'université au monde professionnel en RDC."
          />
          <div className="orientation-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {TEMOIGNAGES.map((t, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', position: 'relative' }}>
                <FaQuoteLeft style={{ position: 'absolute', top: 20, right: 20, fontSize: 28, color: '#e5e7eb' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg, ${C.blue}, ${C.green})`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 15 }}>{t.nom}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t.promo} · {t.universite}</div>
                    <div style={{ fontSize: 11, color: C.green, fontWeight: 700, marginTop: 3 }}>{t.emploi}</div>
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, fontStyle: 'italic', margin: '0 0 14px' }}>"{t.texte}"</p>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[...Array(t.note)].map((_, j) => <FaStar key={j} style={{ color: '#F59E0B', fontSize: 14 }} />)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <Link to="/alumni/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: `2px solid ${C.navy}`, borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
              <FaUsers /> Rejoindre le réseau Alumni
            </Link>
          </div>
        </section>

        {/* ══ SECTION 7 : RESSOURCES ══ */}
        <section ref={el => sectionRefs.current['ressources'] = el} style={{ paddingBottom: 60 }}>
          <SectionHeader
            badge="📚 Boîte à outils"
            title="Ressources téléchargeables"
            sub="Guides, modèles et rapports pour accélérer votre insertion professionnelle."
          />
          <div className="orientation-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {RESSOURCES.map((r, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 22, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', gap: 16, alignItems: 'flex-start', cursor: 'pointer', transition: 'all 0.2s', border: '2px solid transparent' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = r.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: `${r.color}15`, color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {r.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                    <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, lineHeight: 1.4, margin: 0 }}>{r.titre}</h4>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${r.color}18`, color: r.color, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{r.tag}</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5, margin: 0 }}>{r.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: r.color, fontSize: 12, fontWeight: 700, marginTop: 10 }}>
                    <FaDownload style={{ fontSize: 11 }} /> Télécharger gratuitement
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>{/* end maxWidth container */}

      {/* ══ CTA FINAL ══ */}
      <section style={{ background: `linear-gradient(135deg, ${C.navy} 0%, #0D2B6B 50%, ${C.green} 100%)`, padding: '70px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
          <h2 style={{ color: 'white', fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 900, marginBottom: 16, lineHeight: 1.2 }}>
            Prêt à bâtir votre carrière ?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>
            Rejoignez les 48 000 étudiants qui utilisent GENUC pour gérer leur parcours académique et construire leur avenir professionnel.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/inscriptions-universites" style={{ padding: '14px 30px', background: C.green, color: 'white', borderRadius: 10, textDecoration: 'none', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(29,158,117,0.5)' }}>
              <FaGraduationCap /> S'inscrire à l'université
            </Link>
            <Link to="/login" style={{ padding: '14px 30px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 10, textDecoration: 'none', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaSignInAlt /> Accéder à mon espace
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background: '#0A1628', color: 'rgba(255,255,255,0.6)', padding: '40px 24px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #1D9E75, #185FA5)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: 14 }}>G</div>
            <span style={{ color: 'white', fontWeight: 800, fontSize: 17 }}>GENUC</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
            Plateforme Nationale de Gestion Universitaire — République Démocratique du Congo
          </p>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            {['/', '/universites-publiques', '/cours-publics', '/emploi-universitaire', '/contact'].map((path, i) => (
              <Link key={path} to={path} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 13 }}>
                {['Accueil', 'Universités', 'Cours', 'Emploi Étudiant', 'Contact'][i]}
              </Link>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, fontSize: 12 }}>
            © 2026 GENUC — Tous droits réservés · support@genuc.cd
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Sous-composants ── */

function SectionHeader({ badge, title, sub }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 40 }}>
      <span style={{ display: 'inline-block', background: 'rgba(24,95,165,0.12)', color: C.blue, padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{badge}</span>
      <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 900, marginBottom: 10, lineHeight: 1.2 }}>{title}</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 16, maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>{sub}</p>
    </div>
  );
}

function OffreCard({ offre }) {
  const typeColor = { CDI: C.green, Stage: C.blue, CDD: C.orange, Freelance: C.purple };
  const color = typeColor[offre.type] || C.navy;
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 22, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', transition: 'all 0.2s', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'none'; }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>{offre.logo}</span>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.3 }}>{offre.titre}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{offre.entreprise}</div>
          </div>
        </div>
        <span style={{ padding: '4px 10px', borderRadius: 20, background: `${color}18`, color: color, fontSize: 11, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{offre.type}</span>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}><FaMapMarkerAlt style={{ color: 'var(--text-muted)' }} /> {offre.ville}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}><FaCalendarAlt style={{ color: 'var(--text-muted)' }} /> {new Date(offre.date).toLocaleDateString('fr-FR')}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: C.green }}>{offre.salaire}</span>
        <Link to="/login" style={{ padding: '7px 14px', background: C.navy, color: 'white', borderRadius: 7, textDecoration: 'none', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
          Postuler <FaArrowRight style={{ fontSize: 10 }} />
        </Link>
      </div>
    </div>
  );
}
