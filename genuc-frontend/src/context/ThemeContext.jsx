import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

// Thème initial : préférence explicite de l'utilisateur (localStorage) si elle
// existe, sinon la préférence du système d'exploitation (prefers-color-scheme).
const getThemeInitial = () => {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getThemeInitial);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Suivre le changement de thème du système tant que l'utilisateur n'a pas
  // fait de choix explicite (aucune valeur en localStorage lors du montage).
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const suivreSysteme = (e) => {
      if (!localStorage.getItem('theme-user-choice')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    media.addEventListener?.('change', suivreSysteme);
    return () => media.removeEventListener?.('change', suivreSysteme);
  }, []);

  const toggleTheme = () => {
    // Bascule manuelle = choix explicite : on cesse de suivre le système.
    localStorage.setItem('theme-user-choice', '1');
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
