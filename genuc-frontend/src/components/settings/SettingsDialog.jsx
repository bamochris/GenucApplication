// src/components/settings/SettingsDialog.jsx
// Boîte de dialogue générique — navigation latérale, contenu qui s'ouvre À
// L'INTÉRIEUR de la boîte (aucune redirection) et pied de page Appliquer /
// Valider / Fermer. Réservée aux actions courtes et ponctuelles (ex :
// PasswordDialog) ; les fonctionnalités complètes sont de vraies pages.
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import useDraggableDialog from '../../hooks/useDraggableDialog';
import './SettingsDialog.css';
import { FaShieldAlt, FaTimes, FaCog } from 'react-icons/fa';

export function SettingsLoading() {
  return (
    <div className="sas-loading">
      <span className="sas-loading-dot" />
      Chargement de la section…
    </div>
  );
}

// Enveloppe pour les pages métier réutilisées telles quelles dans la boîte.
export function SettingsEmbed({ children }) {
  return (
    <div className="sas-embed">
      <Suspense fallback={<SettingsLoading />}>{children}</Suspense>
    </div>
  );
}

export default function SettingsDialog({ titre, sousTitre, note, menu, renderPanel, onClose }) {
  const tousLesItems = menu.flatMap((g) => g.items);
  const [actif, setActif] = useState(tousLesItems[0]?.id);
  const [dirty, setDirty] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  // Le panneau actif y enregistre sa fonction « appliquer » (async → bool).
  const applyRef = useRef(null);
  const { panelStyle, dragHandleProps } = useDraggableDialog();

  const item = tousLesItems.find((i) => i.id === actif) || tousLesItems[0];

  const confirmerAbandon = useCallback(() => (
    !dirty || window.confirm('Des modifications non appliquées seront perdues. Continuer ?')
  ), [dirty]);

  const fermer = useCallback(() => {
    if (confirmerAbandon()) onClose();
  }, [confirmerAbandon, onClose]);

  const choisir = (id) => {
    if (id === actif) return;
    if (!confirmerAbandon()) return;
    setDirty(false);
    setActif(id);
  };

  const appliquer = useCallback(async () => {
    if (!applyRef.current) return true;
    setEnvoi(true);
    try {
      return await applyRef.current();
    } finally {
      setEnvoi(false);
    }
  }, []);

  const valider = useCallback(async () => {
    const ok = await appliquer();
    if (ok) onClose();
  }, [appliquer, onClose]);

  // Fermeture au clavier + verrouillage du scroll de fond
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') fermer(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [fermer]);

  return (
    <div className="sas-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) fermer(); }}>
      <div className="sas-dialog dialog-resizable" role="dialog" aria-modal="true" aria-label={titre} style={panelStyle}>

        <header className="sas-header dialog-draggable-handle" {...dragHandleProps}>
          <div className="sas-header-left">
            <div className="sas-header-icon"><FaCog /></div>
            <div>
              <h2>{titre}</h2>
              <p>{sousTitre}</p>
            </div>
          </div>
          <button className="sas-close" onClick={fermer} aria-label="Fermer les paramètres">
            <FaTimes />
          </button>
        </header>

        <div className="sas-layout">
          {/* ─── Menu latéral ─── */}
          <nav className="sas-nav" aria-label="Sections des paramètres">
            {menu.map((groupe) => (
              <div key={groupe.id} className="sas-nav-group">
                <span className="sas-nav-label">{groupe.label}</span>
                {groupe.items.map((entree) => {
                  const Icone = entree.icone;
                  return (
                    <button
                      key={entree.id}
                      type="button"
                      className={
                        `sas-nav-item sas-accent-${entree.accent}` +
                        (entree.id === actif ? ' sas-nav-item-actif' : '') +
                        (entree.critique ? ' sas-nav-item-critique' : '')
                      }
                      onClick={() => choisir(entree.id)}
                      aria-current={entree.id === actif ? 'page' : undefined}
                    >
                      <span className="sas-nav-tile"><Icone /></span>
                      <span className="sas-nav-titre">{entree.titre}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* ─── Contenu de la section active ─── */}
          <div className="sas-content">
            <div className={`sas-content-head sas-accent-${item.accent}`}>
              <span className="sas-tile"><item.icone /></span>
              <div>
                <h3>
                  {item.titre}
                  {item.critique && <span className="sas-badge-critique">Critique</span>}
                </h3>
                <p>{item.desc}</p>
              </div>
            </div>

            <div className="sas-content-body">
              {renderPanel(actif, { applyRef, onDirtyChange: setDirty })}
            </div>
          </div>
        </div>

        <footer className="sas-footer">
          <div className="sas-footer-note">
            <FaShieldAlt />
            <span>{note}</span>
          </div>
          <div className="sas-actions">
            <button type="button" className="sas-btn sas-btn-ghost" onClick={fermer}>
              Fermer
            </button>
            <button
              type="button"
              className="sas-btn sas-btn-outline"
              onClick={appliquer}
              disabled={envoi || !dirty}
              title={dirty ? 'Applique les modifications sans fermer' : 'Aucune modification en attente'}
            >
              {envoi ? 'Application…' : 'Appliquer'}
            </button>
            <button
              type="button"
              className="sas-btn sas-btn-primary"
              onClick={valider}
              disabled={envoi}
              title="Applique les modifications puis ferme la boîte"
            >
              Valider
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
