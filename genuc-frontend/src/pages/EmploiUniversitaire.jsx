import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  FaUniversity, FaGraduationCap, FaBriefcase, FaSignInAlt,
  FaSearch, FaClock, FaMoneyBillWave, FaCertificate, FaUsers,
  FaChalkboardTeacher, FaFlask, FaBook, FaDesktop, FaHandshake,
  FaMusic, FaShieldAlt, FaTools, FaCheckCircle, FaArrowRight,
  FaMapMarkerAlt, FaCalendarAlt, FaStar, FaPhone, FaEnvelope
} from 'react-icons/fa';
import { resolveFileUrl } from '../utils/fileUrl';

/* ── Données statiques (enrichies depuis Home + propres) ── */

const CATEGORIES = [
  { id: 'moniteur',   icon: <FaChalkboardTeacher />, label: 'Moniteur / Répétiteur',    color: '#185FA5', bg: '#E6F1FB',
    desc: 'Aidez vos camarades des années inférieures à comprendre les matières où vous excellez.' },
  { id: 'labo',       icon: <FaFlask />,              label: 'Assistant de Laboratoire', color: '#1D9E75', bg: '#E1F5EE',
    desc: 'Préparez et encadrez les travaux pratiques en laboratoire aux côtés des techniciens.' },
  { id: 'biblio',     icon: <FaBook />,               label: 'Bibliothécaire Assistant', color: '#6B21A8', bg: '#F3E8FF',
    desc: 'Gérez les prêts, cataloguez les ouvrages et aidez les lecteurs à la bibliothèque.' },
  { id: 'it',         icon: <FaDesktop />,            label: 'Technicien IT Faculté',    color: '#854F0B', bg: '#FAEEDA',
    desc: 'Assurez la maintenance des salles informatiques et le support technique aux étudiants.' },
  { id: 'admin',      icon: <FaHandshake />,          label: 'Assistant Administratif',  color: '#4F46E5', bg: '#F0F4FF',
    desc: 'Appuyez les secrétariats des facultés dans l\'archivage et le traitement des dossiers.' },
  { id: 'culture',    icon: <FaMusic />,              label: 'Animateur Culturel',       color: '#C07A2B', bg: '#FFF8E7',
    desc: 'Organisez les activités culturelles, sportives et associatives de votre campus.' },
  { id: 'securite',   icon: <FaShieldAlt />,          label: 'Agent d\'Accueil',         color: '#993556', bg: '#FBEAF0',
    desc: 'Assurez l\'accueil, l\'orientation et la vérification des badges aux entrées du campus.' },
  { id: 'maintenance',icon: <FaTools />,              label: 'Agent de Maintenance',     color: '#1D9E75', bg: '#E1F5EE',
    desc: 'Participez à l\'entretien et à la maintenance des infrastructures du campus.' },
];

const AVANTAGES = [
  { icon: <FaClock />,          title: 'Horaires flexibles',      desc: 'Maximum 20h/semaine, adaptés à votre emploi du temps académique', color: '#185FA5' },
  { icon: <FaMoneyBillWave />,  title: 'Rémunération',            desc: 'Salaire en USD et CDF selon le poste et le nombre d\'heures effectuées', color: '#1D9E75' },
  { icon: <FaCertificate />,    title: 'Attestation officielle',  desc: 'Certificat d\'expérience professionnel signé par l\'université, reconnu par les employeurs', color: '#6B21A8' },
  { icon: <FaGraduationCap />,  title: 'Priorité diplôme',        desc: 'Les étudiants-employés reçoivent une mention spéciale sur leur relevé de notes', color: '#854F0B' },
  { icon: <FaUsers />,          title: 'Réseau professionnel',    desc: 'Intégrez le réseau GENUC des anciens étudiants-employés devenus cadres', color: '#C07A2B' },
  { icon: <FaStar />,           title: 'Priorité emploi alumni',  desc: 'Les postes permanents sont d\'abord proposés aux anciens étudiants-employés', color: '#993556' },
];

const ETAPES = [
  { num: '01', title: 'Consultez les postes',   desc: 'Parcourez les offres disponibles dans votre université. Filtrez par catégorie, campus ou horaire.' },
  { num: '02', title: 'Créez votre dossier',    desc: 'Connectez-vous à GENUC. Votre profil académique est automatiquement joint à votre candidature.' },
  { num: '03', title: 'Postulez en 1 clic',     desc: 'Ajoutez une lettre de motivation. Votre candidature parvient instantanément au responsable RH.' },
  { num: '04', title: 'Entretien & validation', desc: 'Entretien en présentiel ou en ligne. Contrat signé électroniquement via GENUC.' },
  { num: '05', title: 'Commencez à travailler', desc: 'Badgez chaque jour via l\'application. Vos heures et salaires sont tracés en temps réel sur GENUC.' },
];

/* ─────────────────────────────────────────────────────── */

export default function EmploiUniversitaire() {
  const navigate = useNavigate();
  const [offres, setOffres] = useState([]);
  // « etudiants: 48000 » etait un effectif national invente, affiche « 48 000+ ».
  // Il est desormais somme sur les etablissements reels : l'API expose nbEtudiants.
  const [stats, setStats] = useState({ universites: 0, etudiants: 0, postes: 0, etudiantsEmployes: 0 });
  const [search, setSearch] = useState('');
  const [categorie, setCategorie] = useState('');
  const [loadingOffres, setLoadingOffres] = useState(true);
  // Etablissements reellement enregistres. Remplace UNIVERSITES_LOGOS, une liste
  // en dur de huit codes (UNIKIN, UPN, ISIPA…) sans rapport avec la base.
  const [universites, setUniversites] = useState([]);

  useEffect(() => {
    /* Stats publiques */
    api.get('/api/universites/public')
      .then(r => {
        const unis = r.data || [];
        setStats(s => ({
          ...s,
          universites: unis.length,
          etudiants: unis.reduce((acc, u) => acc + (u.nbEtudiants || 0), 0),
        }));
        setUniversites(unis);
      })
      .catch(() => {});

    /* Offres publiques */
    api.get('/api/emploi-universitaire/offres/publiques')
      .then(r => {
        const data = r.data || [];
        setOffres(data);
        setStats(s => ({
          ...s,
          postes: data.length,
          etudiantsEmployes: data.reduce((acc, o) => acc + (o.nbPostes || 1), 0),
        }));
      })
      // Une erreur reseau ne doit pas faire apparaitre des offres inventees :
      // la liste reste vide et l'ecran vide s'affiche.
      .catch(() => setOffres([]))
      .finally(() => setLoadingOffres(false));
  }, []);

  const offresFiltrees = offres.filter(o => {
    const matchSearch = !search || o.titre?.toLowerCase().includes(search.toLowerCase()) || o.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categorie || o.categorie === categorie;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: 'var(--text-primary)' }}>

      {/* ── TOPBAR (même que Home.jsx) ── */}
      <header style={{ background: '#0B1F4A', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 60, gap: 24 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <img src="/assets/logo-genuc2.png" alt="GENUC" style={{ height: 40, objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none'; }} />
          </Link>
          <nav style={{ flex: 1, display: 'flex', gap: 20 }}>
            {[
              { to: '/', label: 'Accueil' },
              { to: '/universites-publiques', label: 'Universités' },
              { to: '/actualites', label: 'Actualités' },
              { to: '/bibliotheque-publique', label: 'Bibliothèque' },
              { to: '/emploi-universitaire', label: 'Emploi Étudiant', active: true },
              { to: '/contact', label: 'Contact' },
            ].map(l => (
              <Link key={l.to} to={l.to} style={{
                color: l.active ? '#9FE1CB' : 'rgba(255,255,255,0.8)',
                textDecoration: 'none', fontSize: 14, fontWeight: l.active ? 700 : 400,
                borderBottom: l.active ? '2px solid #9FE1CB' : '2px solid transparent',
                paddingBottom: 4,
              }}>{l.label}</Link>
            ))}
          </nav>
          <Link to="/login" style={{
            display: 'flex', alignItems: 'center', gap: 8, color: 'white',
            padding: '8px 16px', background: '#185FA5', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600,
          }}>
            <FaSignInAlt /> Se connecter
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{
        background: 'linear-gradient(135deg, #0B1F4A 0%, #185FA5 60%, #1D9E75 100%)',
        padding: '80px 24px', textAlign: 'center', color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: 40, padding: '8px 20px', marginBottom: 24, fontSize: 14, fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)' }}>
            <FaBriefcase /> Service Emploi Étudiant — GENUC
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 900, lineHeight: 1.2, marginBottom: 16 }}>
            Travaillez dans votre université<br />
            <span style={{ color: '#9FE1CB' }}>pendant vos études</span>
          </h1>
          <p style={{ fontSize: 18, opacity: 0.85, lineHeight: 1.7, marginBottom: 36 }}>
            GENUC connecte les étudiants aux opportunités d'emploi au sein de leurs universités.
            Gagnez en expérience, financez vos études et construisez votre carrière — tout en poursuivant votre cursus.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#offres" style={{ padding: '14px 28px', background: '#1D9E75', color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaSearch /> Voir les postes disponibles
            </a>
            <Link to="/login" style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.15)', color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 16, border: '1px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaSignInAlt /> Postuler maintenant
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS (réutilisées de Home.jsx + stats emploi) ── */}
      <section style={{ background: 'var(--bg-card)', padding: '40px 24px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {[
            { value: stats.universites, label: 'Universités partenaires', icon: <FaUniversity />, color: '#185FA5' },
            { value: stats.etudiants.toLocaleString() + '+', label: 'Étudiants inscrits sur GENUC', icon: <FaGraduationCap />, color: '#1D9E75' },
            { value: offres.length || '—', label: 'Postes disponibles', icon: <FaBriefcase />, color: '#854F0B' },
            { value: '2 000+', label: 'Étudiants ont déjà bénéficié', icon: <FaStar />, color: '#6B21A8' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '20px 12px' }}>
              <div style={{ fontSize: 28, color: s.color, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATÉGORIES DE POSTES ── */}
      <section style={{ background: 'var(--bg-secondary)', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>Types de postes disponibles</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16, maxWidth: 560, margin: '0 auto' }}>
              Chaque étudiant peut trouver un rôle adapté à ses compétences et à son emploi du temps.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
            {CATEGORIES.map(c => (
              <div key={c.id} onClick={() => setCategorie(categorie === c.id ? '' : c.id)}
                style={{
                  background: 'var(--bg-card)', borderRadius: 14, padding: '22px 20px', cursor: 'pointer',
                  border: `2px solid ${categorie === c.id ? c.color : '#eee'}`,
                  transition: 'all 0.2s', boxShadow: categorie === c.id ? `0 4px 16px ${c.color}33` : '0 1px 4px rgba(0,0,0,0.06)',
                  transform: categorie === c.id ? 'translateY(-2px)' : 'none',
                }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 12 }}>
                  {c.icon}
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15, marginBottom: 6 }}>{c.label}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OFFRES ── */}
      <section id="offres" style={{ padding: '64px 24px', background: 'var(--bg-card)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>Postes actuellement disponibles</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>Connectez-vous pour postuler en 1 clic</p>
          </div>

          {/* Filtres */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', padding: '16px 20px', background: 'var(--bg-secondary)', borderRadius: 12 }}>
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <FaSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un poste..."
                style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <select value={categorie} onChange={e => setCategorie(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, minWidth: 200 }}>
              <option value="">Toutes catégories</option>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            {(search || categorie) && (
              <button onClick={() => { setSearch(''); setCategorie(''); }}
                style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #ddd', background: 'var(--bg-card)', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)' }}>
                Réinitialiser
              </button>
            )}
          </div>

          {loadingOffres ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <div style={{ width: 36, height: 36, border: '4px solid #ddd', borderTop: '4px solid #185FA5', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              Chargement des postes...
              <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
            </div>
          ) : offresFiltrees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <FaBriefcase style={{ fontSize: 48, marginBottom: 16 }} />
              <p>Aucun poste ne correspond à votre recherche.</p>
              <p style={{ fontSize: 13 }}>Revenez prochainement ou modifiez vos filtres.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
              {offresFiltrees.map(o => (
                <OffreCard key={o.id} offre={o} onPostuler={() => navigate('/login')} />
              ))}
            </div>
          )}

          {/* Aucune offre : on le dit. Ce bloc affichait auparavant des offres
              inventees (moniteur a l'UNIKIN, assistant bibliothecaire a l'UPN,
              remunerations et nombres de candidatures compris) des que l'API n'en
              renvoyait aucune — c'est-a-dire en permanence tant qu'aucun
              etablissement n'en publie. */}
          {!loadingOffres && offresFiltrees.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
              <FaBriefcase style={{ fontSize: 40, opacity: 0.35, marginBottom: 14 }} />
              <p style={{ fontSize: 15, margin: 0 }}>
                {offres.length === 0
                  ? "Aucune offre d'emploi étudiant n'est publiée pour le moment."
                  : "Aucune offre ne correspond à votre recherche."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── AVANTAGES ── */}
      <section style={{ background: 'var(--bg-secondary)', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>Pourquoi travailler à l'université ?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16, maxWidth: 560, margin: '0 auto' }}>
              Un emploi étudiant à l'université n'est pas qu'un revenu — c'est un tremplin.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {AVANTAGES.map(a => (
              <div key={a.title} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: a.color + '18', color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>
                  {a.icon}
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--text-primary)' }}>{a.title}</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section style={{ background: 'var(--bg-card)', padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>Comment ça marche ?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>De la candidature à votre premier salaire en 5 étapes simples</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {ETAPES.map((e, i) => (
              <div key={e.num} style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 32 }}>
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #185FA5, #1D9E75)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16 }}>
                    {e.num}
                  </div>
                  {i < ETAPES.length - 1 && <div style={{ width: 2, height: 40, background: 'var(--bg-secondary)', margin: '8px 0' }} />}
                </div>
                <div style={{ paddingTop: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>{e.title}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>{e.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UNIVERSITÉS CONNECTÉES (réutilisé de Home.jsx) ── */}
      <section style={{ background: 'var(--bg-secondary)', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <FaUniversity style={{ color: '#185FA5' }} /> Établissements participants
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Ces institutions proposent des postes d'emploi étudiant via GENUC</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16 }}>
            {universites.map(u => (
              <div key={u.id} style={{
                background: 'var(--bg-card)', borderRadius: 12, padding: 20, textAlign: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)', cursor: 'pointer', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)'; }}>
                {u.logo && (
                  <img src={resolveFileUrl(u.logo)} alt={u.code} style={{ height: 56, objectFit: 'contain', display: 'block', margin: '0 auto 8px' }}
                    onError={e => { e.target.style.display = 'none'; }} />
                )}
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{u.code}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{u.nom}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONDITIONS D'ÉLIGIBILITÉ ── */}
      <section style={{ background: 'var(--bg-card)', padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>Conditions d'éligibilité</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'Être inscrit dans une université partenaire GENUC',
                'Avoir validé au minimum la 1ère année',
                'Avoir un GPA supérieur ou égal à 12/20',
                'Ne pas avoir de dette de frais académiques',
                'Disponibilité de 10 à 20 heures par semaine',
                'Bonne conduite académique (aucun avertissement disciplinaire)',
              ].map(c => (
                <div key={c} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <FaCheckCircle style={{ color: '#1D9E75', flexShrink: 0, marginTop: 2 }} /> {c}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>Documents à préparer</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'Carte d\'étudiant valide (vérifiée automatiquement via GENUC)',
                'Relevé de notes de la dernière session (extrait automatique)',
                'Attestation de non-redevance des frais',
                'Lettre de motivation (rédigée sur GENUC)',
                'Photo d\'identité récente',
                'Numéro de compte Mobile Money pour la paie',
              ].map(d => (
                <div key={d} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <FaArrowRight style={{ color: '#185FA5', flexShrink: 0, marginTop: 2 }} /> {d}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA (même style que Home.jsx) ── */}
      <section style={{ background: 'linear-gradient(135deg, #0B1F4A 0%, #185FA5 100%)', padding: '64px 24px', textAlign: 'center', color: 'white' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Prêt à rejoindre le programme ?</h2>
          <p style={{ fontSize: 16, opacity: 0.85, lineHeight: 1.7, marginBottom: 36 }}>
            Connectez-vous à GENUC, complétez votre profil étudiant et postulez aux postes qui vous correspondent.
            Votre université traite les candidatures dans un délai de 7 jours ouvrables.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" style={{ padding: '14px 32px', background: '#1D9E75', color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaSignInAlt /> Se connecter et postuler
            </Link>
            <Link to="/inscriptions-universites" style={{ padding: '14px 32px', background: 'rgba(255,255,255,0.15)', color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 16, border: '1px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaGraduationCap /> S'inscrire à une université
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER (réutilisé de Home.jsx) ── */}
      <footer style={{ background: '#0B1F4A', color: 'white', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 40, alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 10, color: '#9FE1CB' }}>GENUC</div>
            <p style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.7 }}>Plateforme Nationale de Gestion Universitaire — RDC</p>
          </div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { to: '/infos', label: 'À propos' },
              { to: '/verifier-diplome', label: 'Vérifier un diplôme' },
              { to: '/palmares-public', label: 'Palmarès' },
              { to: '/emploi-universitaire', label: 'Emploi Étudiant' },
              { to: '/contact', label: 'Contact' },
            ].map(l => (
              <Link key={l.to} to={l.to} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}>{l.label}</Link>
            ))}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 8 }}>Support :</div>
            <div style={{ fontSize: 13, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginBottom: 4 }}>
              <FaEnvelope /> support@genuc.cd
            </div>
            <div style={{ fontSize: 13, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
              <FaPhone /> +243 XXX XXX XXX
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1100, margin: '24px auto 0', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', fontSize: 12, opacity: 0.5 }}>
          © 2026 GENUC — Développé par Amtach (Christian Elonga & Tabitha Lutumba)
        </div>
      </footer>
    </div>
  );
}

/* ─── Composant carte d'offre ─── */
function OffreCard({ offre, onPostuler }) {
  const cat = CATEGORIES.find(c => c.id === offre.categorie) || CATEGORIES[0];
  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 14, padding: 24, border: '1px solid var(--border-color)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none'; }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: cat.bg, color: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
          {cat.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15, lineHeight: 1.3 }}>{offre.titre}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FaUniversity style={{ fontSize: 10 }} /> {offre.universite}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>{offre.description}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {[
          { icon: <FaClock />, val: offre.heures || '10-20h/sem' },
          { icon: <FaMoneyBillWave />, val: offre.remuneration || 'À négocier' },
          { icon: <FaMapMarkerAlt />, val: offre.campus || 'Campus principal' },
          { icon: <FaCalendarAlt />, val: offre.dateDebut ? `Dès ${offre.dateDebut}` : 'Immédiat' },
        ].map((t, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'rgba(24,95,165,0.12)', color: '#185FA5', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
            {t.icon} {t.val}
          </span>
        ))}
      </div>

      {offre.competences?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {offre.competences.map(c => (
            <span key={c} style={{ padding: '2px 8px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderRadius: 4, fontSize: 11 }}>{c}</span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--border-color)' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {offre.nbPostes || 1} poste{offre.nbPostes > 1 ? 's' : ''} disponible{offre.nbPostes > 1 ? 's' : ''}
          {offre.nbCandidatures ? ` · ${offre.nbCandidatures} candidature${offre.nbCandidatures > 1 ? 's' : ''}` : ''}
        </span>
        <button onClick={onPostuler} style={{
          padding: '8px 18px', background: cat.color, color: 'white',
          border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          Postuler <FaArrowRight style={{ fontSize: 11 }} />
        </button>
      </div>
    </div>
  );
}

