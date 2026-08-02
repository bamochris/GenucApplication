// src/api/requestCache.js
//
// Cache mémoire + mutualisation des requêtes GET identiques.
//
// Deux problèmes distincts, un seul registre :
//
// 1. RÉPÉTITION DANS LE TEMPS — la liste des établissements, des filières ou des vacations
//    est redemandée à chaque navigation par des composants qui ne partagent aucun état.
//    Une entrée à durée de vie courte suffit à supprimer ces appels.
//
// 2. RÉPÉTITION SIMULTANÉE — React 19 en StrictMode monte les effets deux fois en
//    développement, et plusieurs composants montés ensemble demandent souvent la même
//    ressource. Annuler l'une des requêtes serait une erreur (c'est ce qui provoquait
//    autrefois des déconnexions intempestives : la requête tuée rejetait avec CanceledError
//    et l'appelant en concluait « pas de session ») — et inutile, puisqu'une requête annulée
//    est déjà partie sur le réseau et compte dans le quota du rate limiter. La bonne réponse
//    est de PARTAGER la promesse en cours : un seul appel réseau, tous les appelants servis.
//
// Une entrée `ttlMs: 0` ne fait que mutualiser les appels concurrents, sans jamais resservir
// de réponse passée — indispensable pour tout ce qui dépend de la session.

/**
 * Ressources éligibles, par préfixe de chemin.
 * N'ajouter ici que des GET dont la réponse peut être resservie telle quelle.
 */
const RESSOURCES = [
  { prefixe: '/api/universites/public', ttlMs: 60_000 },
  { prefixe: '/api/departements/public', ttlMs: 60_000 },
  { prefixe: '/api/filieres/public', ttlMs: 60_000 },
  { prefixe: '/api/cours/public', ttlMs: 60_000 },
  { prefixe: '/api/annees-academiques/public', ttlMs: 60_000 },
  { prefixe: '/api/vacations', ttlMs: 60_000 },
  // Identité de la session : jamais resservie depuis le passé (ttlMs: 0), mais mutualisée
  // pour que le double montage de StrictMode ne produise qu'un seul appel.
  { prefixe: '/api/auth/moi', ttlMs: 0 },
];

/** clé -> { donnees, expireA } | { promesse } */
const entrees = new Map();

/** Nombre maximal d'entrées conservées — borne la mémoire sur une session longue. */
const TAILLE_MAX = 100;

const ressourcePour = (url) => {
  if (!url) return null;
  return RESSOURCES.find(
    (r) => url === r.prefixe || url.startsWith(`${r.prefixe}/`) || url.startsWith(`${r.prefixe}?`)
  ) || null;
};

/** Clé stable : le chemin et les paramètres triés, pour que l'ordre des clés n'influe pas. */
export const cleDe = (config) => {
  const url = config.url || '';
  const params = config.params;
  if (!params || Object.keys(params).length === 0) return url;
  const tries = Object.keys(params)
    .sort()
    .map((k) => `${k}=${String(params[k])}`)
    .join('&');
  return `${url}?${tries}`;
};

const ranger = (cle, entree) => {
  if (entrees.size >= TAILLE_MAX && !entrees.has(cle)) {
    // Éviction FIFO : les Map JavaScript conservent l'ordre d'insertion.
    const plusAncienne = entrees.keys().next().value;
    entrees.delete(plusAncienne);
  }
  entrees.set(cle, entree);
};

/**
 * Réponse disponible pour cette requête, ou null.
 * @returns {{type:'donnees', donnees:any} | {type:'promesse', promesse:Promise} | null}
 */
export const lire = (config) => {
  const ressource = ressourcePour(config.url);
  if (!ressource) return null;

  const entree = entrees.get(cleDe(config));
  if (!entree) return null;

  if (entree.promesse) {
    return { type: 'promesse', promesse: entree.promesse };
  }
  if (entree.expireA > Date.now()) {
    return { type: 'donnees', donnees: entree.donnees };
  }
  entrees.delete(cleDe(config));
  return null;
};

/**
 * La ressource est-elle éligible au cache et à la mutualisation ?
 *
 * <p>À interroger AVANT de fabriquer la promesse partagée : en créer une pour une URL
 * non éligible produisait une promesse que personne n'attrape jamais — donc un
 * « unhandled rejection » à chaque GET en échec ou annulé (overlay rouge de
 * webpack-dev-server affichant « canceled »).</p>
 */
export const estMutualisable = (config) => Boolean(ressourcePour(config?.url));

/** Déclare une requête en vol pour que les suivantes s'y raccrochent. */
export const marquerEnVol = (config, promesse) => {
  // Une promesse partagée dont personne n'attrape le rejet déclenche un
  // « unhandled rejection » dans la console : on neutralise ici, chaque appelant
  // gère l'erreur de son côté. Neutralisé AVANT le filtre d'éligibilité : un appelant
  // qui aurait tout de même fabriqué la promesse ne doit pas faire surgir l'overlay.
  promesse.catch(() => {});
  if (!ressourcePour(config.url)) return;
  ranger(cleDe(config), { promesse });
};

/** Mémorise la réponse, ou libère simplement l'entrée si la ressource n'est pas cachable. */
export const memoriser = (config, donnees) => {
  const ressource = ressourcePour(config.url);
  if (!ressource) return;

  const cle = cleDe(config);
  if (ressource.ttlMs > 0) {
    ranger(cle, { donnees, expireA: Date.now() + ressource.ttlMs });
  } else {
    entrees.delete(cle);
  }
};

/** Libère l'entrée en vol après un échec, pour que la requête suivante reparte. */
export const oublier = (config) => {
  if (!config?.url) return;
  entrees.delete(cleDe(config));
};

/**
 * Purge les lectures d'une ressource après une écriture dessus.
 * Une écriture sur /api/universites/42 invalide tous les GET sous /api/universites.
 */
export const invaliderPour = (url) => {
  if (!url) return;
  const racine = url.split('?')[0].split('/').slice(0, 3).join('/'); // "/api/universites"
  if (racine.length <= 4) return; // "/api" seul : trop large, on ne purge rien
  for (const cle of [...entrees.keys()]) {
    if (cle.startsWith(racine)) {
      entrees.delete(cle);
    }
  }
};

/** Vide tout le cache — à appeler à la déconnexion. */
export const viderTout = () => entrees.clear();

/**
 * Méthodes que l'on peut rejouer sans risque après un échec réseau.
 *
 * <p>POST et PATCH en sont volontairement absents. Une requête sans réponse a très bien pu
 * être traitée par le serveur : la rejouer, sur POST /api/tachpay/.../payer, revient à
 * risquer un second débit pour un paiement déjà passé. C'est la raison d'être de cette
 * liste — le rejeu automatique s'appliquait auparavant à toutes les méthodes.</p>
 */
export const METHODES_REJOUABLES = ['GET', 'HEAD', 'OPTIONS'];

export const estRejouable = (config) =>
  METHODES_REJOUABLES.includes((config?.method || 'GET').toUpperCase());
