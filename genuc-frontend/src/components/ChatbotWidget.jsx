// src/components/ChatbotWidget.jsx
// GENUC Cleverly — assistant de la plateforme. Au-delà des réponses aux
// questions courantes (relayées au backend), il sert de guide de navigation :
// il connaît toutes les pages accessibles au visiteur (pages publiques) ou à
// l'utilisateur connecté (menus de son rôle, via LINKS_CONFIG de la Navbar)
// et propose des boutons qui y emmènent directement.
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { LINKS_CONFIG } from './Navbar';

/* ── Pages publiques (visiteur non connecté) ─────────────────── */
const PAGES_PUBLIQUES = [
  { to: '/',                        label: 'Accueil',                     alias: 'home page principale' },
  { to: '/universites-publiques',   label: 'Universités partenaires',     alias: 'explorer facultés départements filières établissements' },
  { to: '/inscriptions-universites',label: "S'inscrire à une université", alias: 'inscription candidature postuler filière choisir' },
  { to: '/inscriptions',            label: "Formulaire d'inscription",    alias: 'dossier candidature soumettre documents' },
  { to: '/suivi-dossier',           label: 'Suivre mon dossier',          alias: 'suivi statut candidature numéro' },
  { to: '/orientation',             label: "Test d'orientation",          alias: 'métier carrière filière choisir débouchés quiz riasec' },
  { to: '/paiement-tachpay',        label: 'Payer des frais (TachPay)',   alias: 'paiement mobile money mpesa orange airtel carte bancaire frais' },
  { to: '/verifier',                label: 'Vérifier un diplôme',         alias: 'authenticité vérification diplôme' },
  { to: '/verifier-attestation',    label: 'Vérifier une attestation',    alias: 'authenticité vérification attestation' },
  { to: '/cours-publics',           label: 'Cours publics',               alias: 'e-learning cours en ligne gratuits' },
  { to: '/bibliotheque-publique',   label: 'Bibliothèque publique',       alias: 'livres ouvrages lecture' },
  { to: '/palmares-public',         label: 'Palmarès des lauréats',       alias: 'meilleurs étudiants classement lauréats' },
  { to: '/emploi-universitaire',    label: 'Emploi étudiant',             alias: 'travail job poste candidature emploi campus' },
  { to: '/actualites',              label: 'Actualités',                  alias: 'nouvelles annonces news' },
  { to: '/infos',                   label: 'Infos pratiques',             alias: 'informations aide questions' },
  { to: '/contact',                 label: 'Contact & support',           alias: 'aide support joindre écrire' },
  { to: '/login',                   label: 'Se connecter',                alias: 'connexion compte login mot de passe' },
];

/* ── Synonymes ajoutés à certaines pages des menus par rôle ───── */
const ALIAS_PAR_CHEMIN = {
  '/etudiant/resultats':      'notes moyenne relevé points',
  '/etudiant/frais':          'payer paiement solde argent tachpay reçu historique état financier mobile money',
  '/etudiant/horaire':        'emploi du temps planning cours du jour',
  '/etudiant/bulletins':      'bulletin imprimer télécharger',
  '/etudiant/mes-cours':      'supports leçons matières',
  '/etudiant/carte':          "carte d'étudiant badge qr",
  '/etudiant/messagerie':     'messages écrire contacter',
  '/etudiant/parcours':       'progression crédits académique',
  '/etudiant/presences':      'présence absence assiduité',
  '/etudiant/recours':        'réclamation contestation note',
  '/paiements':               'transactions frais argent',
  '/universites':             'établissements gérer université',
  '/diplomes':                'diplomation parchemin',
  '/utilisateurs':            'comptes admins gérer utilisateur',
  '/finances/dashboard':      'argent trésorerie comptabilité',
};

const SUGGESTIONS = {
  ETUDIANT:   ['Guide de navigation', 'Voir mes notes', 'Payer mes frais', 'Mon emploi du temps'],
  PROFESSEUR: ['Guide de navigation', 'Saisir des notes', 'Mes présences', 'Mon planning'],
  DEFAULT:    ['Guide de navigation', "S'inscrire à une université", 'Vérifier un diplôme', 'Payer des frais'],
};

/* ── Utilitaires de correspondance ───────────────────────────── */
const normaliser = (s = '') =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Aplatit un menu de rôle (les entrées « groupe » contiennent des items).
const aplatirMenu = (entrees = []) =>
  entrees.flatMap(e => (e.items ? e.items : [e])).filter(e => e.to && e.label);

export default function ChatbotWidget({ showFab = false, headless = false }) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: 'bot',
      text: `Bonjour${user ? ' ' + (user.prenom || user.nomComplet || '') : ''} ! 👋 Je suis GENUC Cleverly, votre guide sur la plateforme. Décrivez ce que vous cherchez (« payer mes frais », « voir mes notes »…) ou tapez « guide » pour voir toutes les pages qui vous sont accessibles.`,
      time: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const suggestions = SUGGESTIONS[user?.role] || SUGGESTIONS.DEFAULT;

  // Catalogue de navigation : pages du rôle connecté (+ pages publiques
  // utiles), ou uniquement les pages publiques pour un visiteur.
  const catalogue = useMemo(() => {
    const duRole = user?.role ? aplatirMenu(LINKS_CONFIG[user.role]) : [];
    const base = duRole.length
      ? [...duRole, { to: '/contact', label: 'Contact & support' }]
      : PAGES_PUBLIQUES;
    // Déduplique par chemin et prépare le texte de recherche normalisé.
    const vus = new Set();
    return base.filter(p => !vus.has(p.to) && vus.add(p.to)).map(p => ({
      ...p,
      recherche: normaliser(`${p.label} ${p.alias || ''} ${ALIAS_PAR_CHEMIN[p.to] || ''}`),
    }));
  }, [user]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    const ouvrirCleverly = () => {
      setOpen(true);
      setMinimized(false);
    };
    window.addEventListener('genuc:ouvrir-cleverly', ouvrirCleverly);
    return () => window.removeEventListener('genuc:ouvrir-cleverly', ouvrirCleverly);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = useCallback((from, text, extras = {}) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), from, text, time: new Date(), ...extras }]);
    if (from === 'bot' && !open) setUnread(u => u + 1);
  }, [open]);

  const allerVers = useCallback((page) => {
    addMessage('bot', `🧭 Je vous emmène vers « ${page.label} ».`);
    navigate(page.to);
  }, [addMessage, navigate]);

  // Recherche les pages du catalogue correspondant à la question.
  const chercherPages = useCallback((question) => {
    const mots = normaliser(question).split(/[^a-z0-9]+/).filter(m => m.length >= 3);
    if (!mots.length) return [];
    return catalogue
      .map(p => ({ page: p, score: mots.filter(m => p.recherche.includes(m)).length }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(r => r.page);
  }, [catalogue]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    const userText = text.trim();
    const q = normaliser(userText);
    setInput('');
    addMessage('user', userText);

    /* Salutations */
    if (/^(bonjour|bonsoir|salut|hello|coucou|bjr)\b/.test(q)) {
      addMessage('bot', 'Bonjour ! 😊 Dites-moi ce que vous cherchez, ou tapez « guide » pour voir toutes les pages disponibles.');
      return;
    }
    if (/^merci/.test(q)) {
      addMessage('bot', 'Avec plaisir ! N\'hésitez pas si vous avez besoin d\'autre chose. 🎓');
      return;
    }

    /* Guide complet : liste de toutes les pages accessibles */
    if (/(guide|menu|navigation|naviguer|plan du site|toutes les pages|ou aller|aide)/.test(q)) {
      addMessage('bot',
        user?.role
          ? 'Voici toutes les pages accessibles avec votre compte. Cliquez pour y aller :'
          : 'Voici les pages ouvertes aux visiteurs. Cliquez pour y aller :',
        { options: catalogue.map(p => ({ label: p.label, to: p.to })) }
      );
      return;
    }

    /* Guidage : correspondance avec le catalogue de pages */
    const pages = chercherPages(userText);
    if (pages.length) {
      addMessage('bot',
        pages.length === 1 ? 'Voici la page qu\'il vous faut :' : 'Voici les pages qui correspondent :',
        { options: pages.map(p => ({ label: p.label, to: p.to })) }
      );
      return;
    }

    /* Pas de page correspondante → réponse du backend */
    setLoading(true);
    try {
      const res = await api.post('/api/chatbot/question', {
        question: userText,
        role: user?.role,
        userId: user?.id,
        historique: messages.slice(-6).map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text })),
      });
      addMessage('bot', res.data.reponse || 'Je n\'ai pas de réponse à cette question pour le moment. Tapez « guide » pour explorer la plateforme.');
    } catch {
      addMessage('bot', 'Je suis temporairement indisponible. Tapez « guide » pour naviguer, ou contactez le support : support@genuc.cd');
    } finally {
      setLoading(false);
    }
  }, [loading, addMessage, messages, user, catalogue, chercherPages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  // ── Widget flottant déplaçable (position persistée) ────────────────────
  const DEFAULT_POS = { left: 'auto', top: 'auto', right: 24, bottom: 24 };
  const [pos, setPos] = useState(() => {
    try { const s = localStorage.getItem('genuc.chatbot.pos'); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });
  const wrapRef = useRef(null);
  const posRef = useRef(pos);
  posRef.current = pos;
  const justDraggedRef = useRef(false);

  const startDrag = useCallback((e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const el = wrapRef.current;
    if (!el) return;
    e.preventDefault();
    el.setPointerCapture?.(e.pointerId);
    justDraggedRef.current = false;
    const rect = el.getBoundingClientRect();
    const offX = e.clientX - rect.left;
    const offY = e.clientY - rect.top;
    const w = rect.width, h = rect.height;
    const startX = e.clientX, startY = e.clientY;
    let moved = false;

    const clamp = (x, y) => ({
      x: Math.min(Math.max(4, x), Math.max(4, window.innerWidth - w - 4)),
      y: Math.min(Math.max(4, y), Math.max(4, window.innerHeight - h - 4)),
    });
    const onMove = (ev) => {
      if (Math.abs(ev.clientX - startX) > 3 || Math.abs(ev.clientY - startY) > 3) moved = true;
      setPos(clamp(ev.clientX - offX, ev.clientY - offY));
    };
    const onUp = (ev) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      el.releasePointerCapture?.(ev.pointerId);
      document.body.style.userSelect = '';
      if (moved) {
        justDraggedRef.current = true; // bloque le clic d'ouverture consécutif au glissé
        if (posRef.current) {
          try { localStorage.setItem('genuc.chatbot.pos', JSON.stringify(posRef.current)); }
          catch { /* stockage indisponible */ }
        }
      }
    };
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }, []);

  // Coordonnées libres (après déplacement) ou position par défaut.
  const floatingPos = pos ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' } : DEFAULT_POS;
  // Le panneau (plus grand) est replacé dans la fenêtre pour ne jamais sortir de l'écran.
  const panelPos = pos
    ? {
        left: Math.min(Math.max(4, pos.x), Math.max(4, (typeof window !== 'undefined' ? window.innerWidth : 1280) - 360 - 4)),
        top: Math.min(Math.max(4, pos.y), Math.max(4, (typeof window !== 'undefined' ? window.innerHeight : 800) - 520 - 4)),
        right: 'auto', bottom: 'auto',
      }
    : DEFAULT_POS;

  if (!open) {
    // headless : pas de FAB (ouverture via topbar / événement)
    if (headless) return null;
    // FAB : forcé (Home) ou visiteur non connecté
    if (!showFab && (isLoading || user)) return null;

    return (
      <button
        ref={wrapRef}
        onPointerDown={startDrag}
        onClick={() => { if (justDraggedRef.current) { justDraggedRef.current = false; return; } setOpen(true); }}
        aria-label="Ouvrir GENUC Cleverly, l'assistant de navigation (glissez pour déplacer)"
        style={{
          position: 'fixed', ...floatingPos, zIndex: 9990,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #185FA5 0%, #0B1F4A 100%)',
          border: 'none', cursor: 'grab', boxShadow: '0 4px 16px rgba(24,95,165,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, overflow: 'hidden',
          transition: 'transform 0.2s', touchAction: 'none',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <img
          src="/assets/cleverly-logo.png"
          alt=""
          aria-hidden
          style={{ width: 40, height: 40, objectFit: 'contain', pointerEvents: 'none' }}
        />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#cc0000', color: 'white', borderRadius: '50%',
            width: 20, height: 20, fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{unread}</span>
        )}
      </button>
    );
  }

  return (
    <div ref={wrapRef} style={{
      position: 'fixed', ...panelPos, zIndex: 9990,
      width: 360, borderRadius: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-card)', overflow: 'hidden',
      maxHeight: minimized ? 56 : 520,
      transition: 'max-height 0.3s ease',
    }}>
      {/* Header — sert aussi de poignée pour déplacer le widget à la souris */}
      <div
        onPointerDown={startDrag}
        style={{
          background: 'linear-gradient(135deg, #185FA5 0%, #0B1F4A 100%)',
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0, cursor: 'move', userSelect: 'none', touchAction: 'none',
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
        }}>
          <img
            src="/assets/cleverly-logo.png"
            alt=""
            aria-hidden
            style={{ width: 28, height: 28, objectFit: 'contain' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>GENUC Cleverly</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#4caf50', marginRight: 4 }} />
            Votre guide — en ligne 24h/24
          </div>
        </div>
        <button onPointerDown={e => e.stopPropagation()} onClick={() => setMinimized(m => !m)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 16, padding: 4 }}>{minimized ? '▲' : '▼'}</button>
        <button onPointerDown={e => e.stopPropagation()} onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 18, padding: 4 }}>✕</button>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '9px 13px', borderRadius: msg.from === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.from === 'user' ? '#185FA5' : '#f0f4ff',
                  color: msg.from === 'user' ? 'white' : '#0B1F4A',
                  fontSize: 13, lineHeight: 1.5,
                }}>
                  {msg.text}
                  {msg.options && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {msg.options.map(o => (
                        <button
                          key={o.to}
                          onClick={() => allerVers(o)}
                          style={{
                            padding: '5px 11px', borderRadius: 20, border: '1px solid #185FA5',
                            background: 'white', color: '#185FA5', fontSize: 11.5, fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {o.label} →
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  {msg.time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(24,95,165,0.12)', borderRadius: '14px 14px 14px 4px', padding: '10px 14px' }}>
                  <span className="typing-dots">
                    {[0,1,2].map(i => (
                      <span key={i} style={{
                        display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#185FA5',
                        margin: '0 2px', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions rapides */}
          {messages.length <= 2 && (
            <div style={{ padding: '0 14px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => sendMessage(s)} style={{
                  padding: '5px 10px', borderRadius: 20, border: '1px solid #185FA5',
                  background: 'transparent', color: '#185FA5', fontSize: 11, cursor: 'pointer',
                }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 8, flexShrink: 0 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Où voulez-vous aller ? Posez votre question…"
              style={{
                flex: 1, padding: '9px 12px', borderRadius: 20,
                border: '1px solid var(--border-color)', fontSize: 13, outline: 'none',
                background: 'var(--bg-card)', color: 'var(--text-primary)',
              }}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: input.trim() ? '#185FA5' : 'var(--border-color)',
                border: 'none', color: 'white', cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                transition: 'background 0.2s', flexShrink: 0,
              }}
            >➤</button>
          </div>
        </>
      )}

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
      `}</style>
    </div>
  );
}
