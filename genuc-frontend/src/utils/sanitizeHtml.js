// src/utils/sanitizeHtml.js
// Nettoyage du HTML avant injection via dangerouslySetInnerHTML.
// Le contenu des leçons (contenuHtml) est saisi par des enseignants : sans
// nettoyage, un <script> ou un attribut onerror injecté s'exécuterait chez
// l'étudiant (XSS stocké → vol du JWT en localStorage). DOMPurify retire tout
// script/handler d'évènement tout en conservant la mise en forme légitime.
import DOMPurify from 'dompurify';

// Autorise les liens/target mais force rel=noopener noreferrer sur les liens
// s'ouvrant dans un nouvel onglet (protection contre le tabnabbing).
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

const CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'hr', 'span', 'div', 'strong', 'b', 'em', 'i', 'u', 's',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'figure', 'figcaption', 'sup', 'sub',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'colspan', 'rowspan', 'class', 'style'],
  // Interdit les URLs javascript:/data: dangereuses (sauf images data:).
  ALLOW_DATA_ATTR: false,
};

/**
 * Retourne une version sûre du HTML fourni, prête pour dangerouslySetInnerHTML.
 * @param {string} html
 * @param {string} fallback HTML de repli si le contenu est vide.
 */
export function sanitizeHtml(html, fallback = '<p>Contenu non disponible</p>') {
  if (!html || !String(html).trim()) return fallback;
  return DOMPurify.sanitize(String(html), CONFIG);
}

export default sanitizeHtml;
