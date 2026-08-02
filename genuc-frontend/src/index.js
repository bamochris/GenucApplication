import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DesignProvider } from './context/DesignContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <DesignProvider>
      <App />
    </DesignProvider>
  </React.StrictMode>
);

if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
} else if ('serviceWorker' in navigator) {
  // En développement : désinscrire tout service worker déjà actif pour éviter
  // de servir un bundle périmé après un rebuild (cause d'un "Unexpected token '<'"
  // quand un chunk mis en cache ne correspond plus aux fichiers générés).
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.unregister());
  });
}
