import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const KEY = 'genuc.design';

// Liste extensible de designs (le classique + le premium ; on peut en ajouter).
export const DESIGNS = [
  { id: 'classic', label: 'Classique', hint: 'Design d’origine' },
  { id: 'premium', label: 'Premium', hint: 'Bleu nuit & or' },
];

const DesignContext = createContext(null);

export function DesignProvider({ children }) {
  const [design, setDesignState] = useState(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    return DESIGNS.some((d) => d.id === saved) ? saved : 'classic';
  });

  // Applique le design : pose/retire la classe `design-<id>` sur <html>.
  useEffect(() => {
    try { localStorage.setItem(KEY, design); } catch { /* stockage indisponible */ }
    const root = document.documentElement;
    DESIGNS.forEach((d) => root.classList.remove(`design-${d.id}`));
    if (design !== 'classic') root.classList.add(`design-${design}`);
    // Mode premium : force le fond de marque sombre (via inline var, non traité
    // par webpack). En classique : on rend la main au thème (clair/sombre).
    if (design === 'premium') {
      root.style.setProperty('--bg-image', "url('/assets/background/bg-universites-dark-desktop.svg')");
    } else {
      root.style.removeProperty('--bg-image');
    }
  }, [design]);

  const setDesign = useCallback((id) => {
    if (DESIGNS.some((d) => d.id === id)) setDesignState(id);
  }, []);

  return (
    <DesignContext.Provider value={{ design, setDesign, designs: DESIGNS }}>
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign() {
  const ctx = useContext(DesignContext);
  return ctx || { design: 'classic', setDesign: () => {}, designs: DESIGNS };
}
