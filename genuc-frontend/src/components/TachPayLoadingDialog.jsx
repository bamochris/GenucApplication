import React, { useEffect, useState } from 'react';
import './TachPayLoadingDialog.css';

/* Teintes d'accent parcourues pendant l'attente.
 *
 * ⚠️ Ces couleurs teintent l'ANNEAU et le halo, jamais le fond du dialogue.
 * La version précédente les appliquait en `backgroundColor` sur la carte —
 * dont blanc — alors que le message, l'anneau, la flèche et le repli textuel
 * du logo sont tous blancs : un tiers du temps, l'écran affichait une boîte
 * blanche vide. Le fond est donc désormais fixe et sombre, ce qui garantit
 * le contraste en permanence, et seul l'accent varie.
 *
 * Déclarées hors du composant : un tableau recréé à chaque rendu changeait la
 * dépendance du useEffect ci-dessous, qui démontait et remontait son
 * intervalle à chaque battement. */
const ACCENTS = ['#4f9cf9', '#f5b544', '#2fbf87'];

/* Repère interne du SVG. Il ne s'agit PAS de pixels : le tracé est décrit
 * une fois dans ce repère, et `viewBox` le laisse s'adapter à la taille que
 * le CSS donne au conteneur. C'est ce qui rend l'anneau fluide sans qu'aucune
 * dimension ne soit calculée en JavaScript — l'ancienne version recevait un
 * `size` en pixels codé en dur (180), impossible à faire varier selon
 * l'écran. */
const VIEWBOX = 200;
const CENTRE = VIEWBOX / 2;
const RAYON = CENTRE - 14;
const CIRCONFERENCE = 2 * Math.PI * RAYON;

const TachPayLoadingDialog = ({
  message = 'Chargement de vos informations de paiement...',
  progress = null,
}) => {
  const [accent, setAccent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAccent((prec) => (prec + 1) % ACCENTS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const determine = progress !== null;
  const pourcentage = determine ? Math.min(100, Math.max(0, progress)) : 0;

  return (
    <div
      className="tachpay-loading-dialog"
      style={{ '--tachpay-accent': ACCENTS[accent] }}
      /* `status` + `aria-live` : un lecteur d'écran annonce l'attente au lieu
         de laisser croire que la page s'est figée. */
      role="status"
      aria-live="polite"
    >
      <div className="tachpay-loading-circle">
        <svg
          className={`tachpay-loading-progress${determine ? '' : ' tachpay-load-anim'}`}
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          aria-hidden="true"
        >
          <circle
            className="tachpay-progress-track"
            cx={CENTRE}
            cy={CENTRE}
            r={RAYON}
          />
          <circle
            className="tachpay-progress-fill"
            cx={CENTRE}
            cy={CENTRE}
            r={RAYON}
            strokeDasharray={CIRCONFERENCE}
            /* Déterminé : l'arc couvre la fraction accomplie.
               Indéterminé : un arc court, mis en rotation par le CSS. */
            strokeDashoffset={
              determine
                ? CIRCONFERENCE * (1 - pourcentage / 100)
                : CIRCONFERENCE * 0.75
            }
          />
        </svg>

        <div className="tachpay-loading-logo">
          <img
            src="/assets/TachPay-logo.png"
            alt="TachPay"
            className="tachpay-logo-img"
            onError={(e) => {
              e.target.style.display = 'none';
              const parent = e.target.parentElement;
              if (parent && !parent.querySelector('.tachpay-logo-fallback')) {
                const fallback = document.createElement('span');
                fallback.className = 'tachpay-logo-fallback';
                fallback.textContent = 'TachPay';
                parent.appendChild(fallback);
              }
            }}
          />
        </div>

        {determine && (
          <span className="tachpay-loading-percent">{Math.round(pourcentage)}&nbsp;%</span>
        )}
      </div>

      <p className="tachpay-loading-message">
        {message}
        <span className="tachpay-loading-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </p>

      <p className="tachpay-loading-hint">Paiement sécurisé — ne fermez pas cette page</p>
    </div>
  );
};

export default TachPayLoadingDialog;
