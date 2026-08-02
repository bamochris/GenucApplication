// src/components/CommandPalette.jsx
// Palette de commandes universelle (Ctrl/⌘ + K).
// Recherche dans TOUTES les options de menu du rôle courant (y compris les
// sous-options des modules groupés) + quelques commandes globales (thème,
// déconnexion). Navigation clavier complète. Disponible sur toutes les pages
// privées, quel que soit le rôle — accès rapide uniforme dans une app à ~220
// écrans, sans dupliquer la configuration : la source est LINKS_CONFIG (Navbar).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LINKS_CONFIG } from './Navbar';
import './CommandPalette.css';

// Normalise pour une recherche insensible à la casse ET aux accents.
const normaliser = (s = '') =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Aplati la config de menu d'un rôle en une liste plate de commandes navigables.
function construireCommandes(role) {
  const base = LINKS_CONFIG[role] || [];
  const out = [];
  for (const entree of base) {
    if (entree.group && Array.isArray(entree.items)) {
      for (const item of entree.items) {
        if (item.to) {
          out.push({ label: item.label, sousTitre: entree.label, to: item.to });
        }
      }
    } else if (entree.to) {
      out.push({ label: entree.label, to: entree.to });
    }
    // Les entrées « action » (ex. Paramètres) n'ont pas de route → ignorées ici.
  }
  return out;
}

export default function CommandPalette() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [ouvert, setOuvert] = useState(false);
  const [requete, setRequete] = useState('');
  const [indexActif, setIndexActif] = useState(0);
  const inputRef = useRef(null);
  const listeRef = useRef(null);

  const commandesGlobales = useMemo(() => {
    if (!user) return [];
    return [
      {
        label: theme === 'light' ? 'Basculer en mode sombre' : 'Basculer en mode clair',
        sousTitre: 'Apparence', action: () => toggleTheme(), garderOuvert: false,
      },
      { label: 'Se déconnecter', sousTitre: 'Compte', action: () => logout() },
    ];
  }, [user, theme, toggleTheme, logout]);

  const commandesNav = useMemo(
    () => (user ? construireCommandes(user.role) : []),
    [user]
  );

  const resultats = useMemo(() => {
    const toutes = [...commandesNav, ...commandesGlobales];
    const q = normaliser(requete);
    if (!q) return toutes;
    return toutes.filter(c =>
      normaliser(c.label).includes(q) || normaliser(c.sousTitre || '').includes(q)
    );
  }, [commandesNav, commandesGlobales, requete]);

  const fermer = useCallback(() => {
    setOuvert(false);
    setRequete('');
    setIndexActif(0);
  }, []);

  const executer = useCallback((cmd) => {
    if (!cmd) return;
    if (cmd.to) {
      navigate(cmd.to);
      fermer();
    } else if (cmd.action) {
      cmd.action();
      if (cmd.garderOuvert !== false) fermer();
    }
  }, [navigate, fermer]);

  // Raccourci global Ctrl/⌘ + K (ouvre/ferme) + ouverture par évènement
  // (déclencheur cliquable dans la topbar, pour la découvrabilité souris).
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setOuvert(o => !o);
      }
    };
    const onOuvrir = () => setOuvert(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('genuc:ouvrir-palette', onOuvrir);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('genuc:ouvrir-palette', onOuvrir);
    };
  }, []);

  // Focus l'input à l'ouverture.
  useEffect(() => {
    if (ouvert) {
      setIndexActif(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [ouvert]);

  // Garde l'élément actif visible.
  useEffect(() => {
    if (!ouvert) return;
    const el = listeRef.current?.querySelector('[data-actif="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [indexActif, ouvert, resultats.length]);

  if (!user || !ouvert) return null;

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); fermer(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndexActif(i => Math.min(i + 1, resultats.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndexActif(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executer(resultats[indexActif]);
    }
  };

  return (
    <div className="cmdk-overlay" onClick={fermer} role="presentation">
      <div
        className="cmdk-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Palette de commandes"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cmdk-search">
          <span className="cmdk-search-icon" aria-hidden="true">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="cmdk-input"
            placeholder="Rechercher une page ou une action…"
            value={requete}
            onChange={(e) => { setRequete(e.target.value); setIndexActif(0); }}
            onKeyDown={onKeyDown}
            aria-label="Rechercher une commande"
            aria-controls="cmdk-liste"
            autoComplete="off"
          />
          <kbd className="cmdk-esc">Échap</kbd>
        </div>

        <ul className="cmdk-liste" id="cmdk-liste" ref={listeRef} role="listbox">
          {resultats.length === 0 && (
            <li className="cmdk-vide">Aucun résultat pour « {requete} »</li>
          )}
          {resultats.map((cmd, i) => (
            <li
              key={`${cmd.label}-${cmd.to || cmd.sousTitre || i}`}
              role="option"
              aria-selected={i === indexActif}
              data-actif={i === indexActif}
              className={`cmdk-item${i === indexActif ? ' actif' : ''}`}
              onMouseEnter={() => setIndexActif(i)}
              onClick={() => executer(cmd)}
            >
              <span className="cmdk-item-label">{cmd.label}</span>
              {cmd.sousTitre && <span className="cmdk-item-sous">{cmd.sousTitre}</span>}
            </li>
          ))}
        </ul>

        <div className="cmdk-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> naviguer</span>
          <span><kbd>↵</kbd> ouvrir</span>
          <span><kbd>Ctrl</kbd>+<kbd>K</kbd> basculer</span>
        </div>
      </div>
    </div>
  );
}
