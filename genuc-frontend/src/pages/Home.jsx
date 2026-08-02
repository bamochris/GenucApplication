// src/pages/Home.jsx
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import universiteService from '../services/universiteService';
import TachPayLoadingDialog from '../components/TachPayLoadingDialog';
import './Home.css';
import Palmares from '../components/Palmares';
import ChatbotWidget from '../components/ChatbotWidget';
import { sanitizeHtml } from '../utils/sanitizeHtml';

// ─── Import des icônes ──────────────────────────────────────
import {
  FaUniversity,
  FaEdit,
  FaBook,
  FaGraduationCap,
  FaInfoCircle,
  FaTrophy,
  FaNewspaper,
  FaBookOpen,
  FaBriefcase,
  FaHeadset,
  FaSignInAlt,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaShieldAlt,
  FaMobileAlt,
  FaChevronDown,
  FaSearch,
} from 'react-icons/fa';

const UNI_LOGOS = {
  UNIKIN: '/assets/UNIKIN.png',
  UPN: '/assets/UPN.png',
  'HEC-KIN': '/assets/HEC-KIN.png',
  HEC: '/assets/HEC-KIN.png',
  HEC_KIN: '/assets/HEC-KIN.png',
  ISIPA: '/assets/ISIPA.png',
  ISP: '/assets/ISP.jpg',
  REV_KIM: '/assets/REV_KIM.jpg',
  UCC: '/assets/UCC.jpg',
  UNILU: '/assets/UNILU.jpg',
  UNISIC: '/assets/UNISIC.png',
  UPC: '/assets/UPC.png'
};

const normalizeUniversiteKey = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();

const resolveUniversiteLogo = (universite) => {
  const rawCode = universite?.code || '';
  const rawName = universite?.nom || '';

  const directLogo = UNI_LOGOS[rawCode];
  if (directLogo) return directLogo;

  const normalizedCode = normalizeUniversiteKey(rawCode);
  const normalizedName = normalizeUniversiteKey(rawName);
  const normalizedLogos = Object.entries(UNI_LOGOS).reduce((acc, [key, value]) => {
    acc[normalizeUniversiteKey(key)] = value;
    return acc;
  }, {});

  if (normalizedLogos[normalizedCode]) return normalizedLogos[normalizedCode];
  if (normalizedLogos[normalizedName]) return normalizedLogos[normalizedName];

  const looksLikeHecKin =
    normalizedCode.includes('HECKIN') ||
    normalizedName.includes('HECKIN') ||
    normalizedName.includes('HAUTESETUDESCOMMERCIALES');

  if (looksLikeHecKin) {
    return '/assets/HEC-KIN.png';
  }

  return null;
};

// ─── Services publics accessibles sans connexion ─────────────
const SERVICES_MENU = [
  { label: 'Inscription en ligne',     path: '/inscriptions-universites', icon: <FaEdit /> },
  { label: 'Cours en ligne',           path: '/cours-publics',            icon: <FaBook /> },
  { label: 'Emploi étudiant',          path: '/emploi-universitaire',     icon: <FaBriefcase /> },
  { label: 'Palmarès',                 path: '/palmares-public',          icon: <FaTrophy /> },
  { label: 'Vérifier un diplôme',      path: '/verifier',                 icon: <FaGraduationCap /> },
  { label: 'Vérifier une attestation', path: '/verifier-attestation',     icon: <FaShieldAlt /> },
  { label: 'Suivi de dossier',         path: '/suivi-dossier',            icon: <FaSearch /> },
  { label: 'Paiement mobile',          path: '/paiement-tachpay',         icon: <FaMobileAlt /> },
];

export default function Home() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesRef = useRef(null);
  const [tachpayLoading, setTachpayLoading] = useState(false);
  const [universites, setUniversites] = useState([]);
  const [stats, setStats] = useState({
    universites: 0,
  });

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (servicesRef.current && !servicesRef.current.contains(e.target)) {
        setServicesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // ─── Simulation du chargement ──────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const animateValue = (start, end, duration, setter) => {
      let startTimestamp = null;
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        if (isMounted) {
          setter(Math.floor(progress * (end - start) + start));
        }
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    };

    universiteService.listerToutes()
      .then(r => {
        if (isMounted) {
          const listeUniversites = Array.isArray(r.data) ? r.data : [];
          const count = listeUniversites.length;
          setUniversites(listeUniversites);
          animateValue(0, count, 1500, (val) =>
            setStats(prev => ({ ...prev, universites: val }))
          );
        }
      })
      .catch(() => {
        if (isMounted) {
          setStats(prev => ({ ...prev, universites: 0 }));
        }
      });

    return () => { isMounted = false; };
  }, []);

  // ─── Menu principal (cartes) ──────────────────────────────────
  const menuItems = [
    { 
      id: 'universites', 
      label: 'Universités connectées', 
      icon: <FaUniversity size={36} />, 
      path: '/universites-publiques', 
      color: '#1D9E75', 
      bgColor: '#E1F5EE' 
    },
    { 
      id: 'inscription', 
      label: 'Inscription', 
      icon: <FaEdit size={36} />, 
      path: '/inscriptions-universites', 
      color: '#185FA5', 
      bgColor: '#E6F1FB' 
    },
    { 
      id: 'cours', 
      label: 'Étudier en ligne', 
      icon: <FaBook size={36} />, 
      path: '/cours-publics', 
      color: '#854F0B', 
      bgColor: '#FAEEDA' 
    },
    // ─── Paiement avec logo TachPay ──────────────────────────
    {
      id: 'paiement',
      label: 'Module de paiement',
      icon: (
        <img
          src="/assets/TachPay-logo.png"
          alt="TachPay"
          style={{ width: 150, height: 150, objectFit: 'contain' }}
          onError={(e) => {
            e.target.style.display = 'none';
            // Utilisation de DOMPurify pour éviter XSS au lieu de innerHTML direct
            const fallbackHtml = sanitizeHtml('<span style="font-size:32px;">💳</span>');
            e.target.parentElement.innerHTML = fallbackHtml;
          }}
        />
      ),
      path: '/paiement-tachpay',
      color: 'var(--text-primary)',
      bgColor: '#F0F4FF',
    },
    // ─── NOUVEAUX BOUTONS ──────────────────────────────────────
    { 
      id: 'actualites', 
      label: 'Actualités', 
      icon: <FaNewspaper size={36} />, 
      path: '/actualites', 
      color: '#C07A2B', 
      bgColor: '#FFF8E7' 
    },
    { 
      id: 'bibliotheque', 
      label: 'Bibliothèque numérique', 
      icon: <FaBookOpen size={36} />, 
      path: '/bibliotheque-publique', 
      color: '#6B21A8', 
      bgColor: '#F3E8FF' 
    },
    {
      id: 'orientation',
      label: 'Orientation & Carrières',
      icon: <FaBriefcase size={36} />,
      path: '/orientation',
      color: 'var(--text-primary)',
      bgColor: '#F0F4FF'
    },
    {
      id: 'emploi-universitaire',
      label: 'Emploi Étudiant',
      icon: <FaBriefcase size={36} />,
      path: '/emploi-universitaire',
      color: '#185FA5',
      bgColor: '#E6F1FB'
    },
    { 
      id: 'contact', 
      label: 'Contact & Support', 
      icon: <FaHeadset size={36} />, 
      path: '/contact', 
      color: '#993556', 
      bgColor: '#FBEAF0' 
    },
    { 
      id: 'verifier', 
      label: 'Vérifier un diplôme', 
      icon: <FaGraduationCap size={36} />, 
      path: '/verifier', 
      color: 'var(--text-primary)', 
      bgColor: '#F0F4FF' 
    },
    { 
      id: 'palmares', 
      label: 'Palmarès', 
      icon: <FaTrophy size={36} />, 
      path: '/palmares-public', 
      color: '#C07A2B', 
      bgColor: '#FFF8E7' 
    },
    { 
      id: 'infos', 
      label: 'Infos', 
      icon: <FaInfoCircle size={36} />, 
      path: '/infos', 
      color: 'var(--text-primary)', 
      bgColor: '#F0F4FF' 
    }
  ];

  const handleMenuClick = (menu, e) => {
    e.preventDefault();
    setActiveMenu(menu.id);
    const element = e.currentTarget;
    element.style.transform = 'scale(0.95)';
    setTimeout(() => {
      element.style.transform = '';
    }, 150);

    if (menu.id === 'paiement') {
      setTachpayLoading(true);
      setTimeout(() => {
        navigate(menu.path);
        setTachpayLoading(false);
      }, 4000);
      return;
    }

    setTimeout(() => {
      navigate(menu.path);
    }, 150);
  };

  // ─── Loader ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="loader-container">
        <div className="loader-circle">
          <img
            src="/assets/logo-genuc.jpg"
            alt="GENUC"
            className="loader-logo"
            onError={(e) => {
              if (!e.target.src.endsWith('.png')) {
                e.target.src = "/assets/logo-genuc.png";
              }
            }}
          />
          <div className="loader-ring"></div>
        </div>
        <p className="loader-text">Chargement de la plateforme...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      {tachpayLoading && (
        <div className="tachpay-loading-overlay">
          <TachPayLoadingDialog message="Initialisation du module de paiement TachPay..." />
        </div>
      )}
      {/* ═══════════════════════════════════════════════════════
          TOP BAR (barre de navigation rectangulaire)
          ═══════════════════════════════════════════════════════ */}
      <header className="home-topbar">
        <div className="topbar-container">
          {/* Logo à gauche */}
          <div className="topbar-logo">
            <img src="/assets/logo-genuc2.png" alt="GENUC" className="topbar-logo-img" />
          </div>

          {/* Menu horizontal */}
          <nav className="topbar-nav">
            <Link to="/" className="topbar-link">Accueil</Link>
            <Link to="/universites-publiques" className="topbar-link">Universités</Link>
            <Link to="/actualites" className="topbar-link">Actualités</Link>

            {/* ── Dropdown Services ── */}
            <div className="topbar-dropdown-wrapper" ref={servicesRef}>
              <button
                className="topbar-link topbar-dropdown-trigger"
                onClick={() => setServicesOpen(o => !o)}
                aria-expanded={servicesOpen}
                aria-haspopup="true"
              >
                Services
                <FaChevronDown className={`dropdown-chevron${servicesOpen ? ' open' : ''}`} />
              </button>
              {servicesOpen && (
                <div className="topbar-dropdown-menu" role="menu">
                  {SERVICES_MENU.map(item => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="topbar-dropdown-item"
                      role="menuitem"
                      onClick={() => setServicesOpen(false)}
                    >
                      <span className="dropdown-item-icon">{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link to="/bibliotheque-publique" className="topbar-link">Bibliothèque</Link>
            <Link to="/orientation" className="topbar-link">Carrières</Link>
            <Link to="/contact" className="topbar-link">Contact</Link>
          </nav>

          {/* Espace connexion à droite */}
          <div className="topbar-actions">
            <Link to="/login" className="topbar-login">
              <FaSignInAlt /> Se connecter
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          HERO SECTION (contenu principal)
          ═══════════════════════════════════════════════════════ */}
      <div className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-logo-container">
            <img
              src="/assets/logo-genuc.jpg"
              alt="GENUC"
              className="hero-logo"
              onError={(e) => {
                if (!e.target.src.endsWith('.png')) {
                  e.target.src = "/assets/logo-genuc.png";
                }
              }}
            />
          </div>

          <h1 className="hero-title">
            GENUC
            <span className="hero-subtitle">Gestion Numérique des Universités du Congo</span>
          </h1>
          <Palmares />
          <p className="hero-description">
            Plateforme nationale académique
          </p>

          {/* Menu des fonctionnalités (cartes) */}
          <div className="menu-grid">
            {menuItems.map(menu => (
              <Link
                key={menu.id}
                to={menu.path}
                onClick={(e) => handleMenuClick(menu, e)}
                className={`menu-card ${activeMenu === menu.id ? 'active' : ''}`}
                style={{
                  '--menu-color': menu.color,
                  '--menu-bg': menu.bgColor
                }}
              >
                <span className="menu-icon">{menu.icon}</span>
                <span className="menu-label">{menu.label}</span>
                <div className="menu-ripple"></div>
              </Link>
            ))}
          </div>

          {/* Statistiques */}
          <div className="stats-container">
            <div className="stat-item">
              <div className="stat-number">{stats.universites}</div>
              <div className="stat-label">Universités connectées</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">15</div>
              <div className="stat-label">Rôles utilisateurs</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Accès en ligne</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION UNIVERSITÉS CONNECTÉES
          ═══════════════════════════════════════════════════════ */}
      <div className="universites-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="title-icon"><FaUniversity size={44} /></span>
            Universités connectées
            <span className="title-decoration"></span>
          </h2>
          <p className="section-subtitle">
            Découvrez les institutions partenaires de la plateforme GENUC
          </p>
        </div>

        <div className="universites-grid">
          {universites.map((uni, index) => {
            const logo = resolveUniversiteLogo(uni);
            const isHecKin = logo === '/assets/HEC-KIN.png';
            return (
            <div
              key={uni.code}
              className="uni-card"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => navigate('/universites-publiques')}
            >
              <div className="uni-card-inner">
                <div className={`uni-logo-wrapper${isHecKin ? ' uni-logo-wrapper--hec' : ''}`}>
                  {logo ? (
                    <img src={logo} alt={uni.code} className="uni-logo" />
                  ) : (
                    <div className="uni-logo uni-logo-fallback">{(uni.code || uni.nom || 'UNI').slice(0, 3)}</div>
                  )}
                </div>
                <div className="uni-name">{uni.code || uni.nom}</div>
              </div>
            </div>
          );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION FONCTIONNALITÉS CLÉS
          ═══════════════════════════════════════════════════════ */}
      <div className="features-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="title-icon"><FaGraduationCap size={38} /></span>
            Pourquoi choisir GENUC ?
          </h2>
          <p className="section-subtitle">
            Une plateforme complète pour transformer la gestion universitaire en RDC
          </p>
        </div>
        <div className="features-grid">
          {[
            {
              icon: <FaGraduationCap size={32} />,
              color: '#185FA5',
              bg: '#E6F1FB',
              title: 'Gestion académique',
              desc: 'Notes, présences, délibérations, bulletins et relevés de notes en ligne. Tout le parcours académique numérisé.'
            },
            {
              icon: <FaCalendarAlt size={32} />,
              color: '#1D9E75',
              bg: '#E1F5EE',
              title: 'Inscriptions simplifiées',
              desc: 'Inscription en ligne avec suivi de dossier en temps réel. Validation et paiements sécurisés depuis votre téléphone.'
            },
            {
              icon: <FaPhone size={32} />,
              color: '#854F0B',
              bg: '#FAEEDA',
              title: 'Paiement mobile',
              desc: 'M-Pesa, Orange Money, Airtel Money, AfriMoney — payez vos frais académiques depuis votre téléphone, partout en RDC.'
            },
            {
              icon: <FaEnvelope size={32} />,
              color: '#6B21A8',
              bg: '#F3E8FF',
              title: 'Communication intégrée',
              desc: 'Messagerie interne, notifications en temps réel, SMS et emails pour rester connecté avec votre université.'
            },
          ].map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon" style={{ background: f.bg, color: f.color }}>
                {f.icon}
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION CTA
          ═══════════════════════════════════════════════════════ */}
      <div className="cta-section">
        <div className="cta-content">
          <h3>Prêt à rejoindre la révolution numérique de l'enseignement ?</h3>
          <p>Inscrivez-vous dès maintenant et accédez à tous les services GENUC — 100% en ligne, 100% sécurisé.</p>
          <div className="cta-buttons">
            <Link to="/inscriptions-universites" className="cta-btn-primary">
              <FaEdit size={20} style={{ marginRight: 8 }} /> S'inscrire maintenant
            </Link>
            <Link to="/login" className="cta-btn-secondary">
              <FaGraduationCap size={20} style={{ marginRight: 8 }} /> Se connecter
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════ */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">GENUC</div>
            <p>Nous vous apportons notre soutien pour numériser vos universités</p>
          </div>
          <div className="footer-links">
            <Link to="/infos">À propos</Link>
            <Link to="/verifier"><FaGraduationCap size={16} /> Vérifier un diplôme</Link>
            <Link to="/palmares-public"><FaTrophy size={16} /> Palmarès</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/mentions">Mentions légales</Link>
          </div>
          <div className="footer-copyright">
            &copy; 2026 GENUC - Développé par Amtach (Christian Elonga & Tabitha Lutumba)
          </div>
        </div>
      </footer>

      {/* GENUC Cleverly — bouton flottant (logo) sur l'accueil */}
      <ChatbotWidget showFab />
    </div>
  );
}