// src/utils/fichierPrive.js
// Accès aux fichiers NON publics du backend (pièces de dossier, photos d'identité,
// TFC, rapports de stage, recours...).
//
// Ces fichiers ne sont plus servis en statique sous /uploads/** : ils passent par
// GET /api/fichiers/<sousDossier>/<nom>, qui exige le jeton JWT et vérifie que le
// demandeur est bien propriétaire (ou membre du personnel de l'établissement).
//
// Conséquence : un <img src> ou un <a href> ne fonctionne PAS, ces balises
// n'envoient jamais l'en-tête Authorization. Il faut récupérer le contenu via
// l'instance Axios puis créer une URL d'objet.
import api from '../api/axios';

// Sous-dossiers restés publics côté backend (FichierAccesService.DOSSIERS_PUBLICS) :
// identité visuelle affichée sur des pages publiques.
const DOSSIERS_PUBLICS = ['universites', 'logos', 'certificats'];

/** Transforme "/uploads/dossiers/x.pdf" en "/api/fichiers/dossiers/x.pdf". */
export function cheminApiFichier(chemin) {
  if (!chemin) return null;
  const relatif = chemin.startsWith('/uploads/') ? chemin.slice('/uploads/'.length) : chemin.replace(/^\/+/, '');
  return `/api/fichiers/${relatif}`;
}

/** true si le chemin pointe vers un dossier encore servi publiquement. */
export function estFichierPublic(chemin) {
  if (!chemin) return false;
  const relatif = chemin.startsWith('/uploads/') ? chemin.slice('/uploads/'.length) : chemin.replace(/^\/+/, '');
  return DOSSIERS_PUBLICS.some(d => relatif.startsWith(`${d}/`));
}

/**
 * Récupère un fichier privé et renvoie une URL d'objet utilisable dans <img src>
 * ou window.open. L'appelant est responsable du URL.revokeObjectURL().
 *
 * @returns {Promise<string|null>} l'URL d'objet, ou null si le fichier est
 *          inaccessible (droits insuffisants, fichier supprimé...).
 */
export async function chargerFichierPrive(chemin) {
  if (!chemin) return null;
  try {
    const res = await api.get(cheminApiFichier(chemin), { responseType: 'blob' });
    return URL.createObjectURL(res.data);
  } catch {
    return null;
  }
}

/**
 * Ouvre un fichier privé dans un nouvel onglet.
 * L'onglet est ouvert AVANT l'appel réseau : ouvrir après la promesse ferait
 * intervenir le bloqueur de pop-up (le clic n'est plus la cause directe).
 *
 * @returns {Promise<string|null>} message d'erreur à afficher, ou null si succès.
 */
export async function ouvrirFichierPrive(chemin, libelle = 'le document') {
  // Pas de 'noopener' ici : la spec HTML impose que window.open() renvoie null
  // quand cette option est présente, or on a besoin de la référence pour écrire
  // le message d'attente puis y charger le blob. Aucun risque de tabnabbing :
  // la destination est une URL blob: same-origin fabriquée par ce module.
  const onglet = window.open('', '_blank');
  if (onglet) {
    onglet.document.write(
      `<p style="font-family:sans-serif;padding:24px">Chargement de ${libelle}…</p>`
    );
  }
  const url = await chargerFichierPrive(chemin);
  if (!url) {
    if (onglet) onglet.close();
    return `Impossible d'ouvrir ${libelle} (fichier introuvable ou accès refusé).`;
  }
  if (!onglet) {
    URL.revokeObjectURL(url);
    return 'Autorisez les fenêtres pop-up pour afficher le document.';
  }
  onglet.location.replace(url);
  // La révocation immédiate couperait le chargement : on laisse au navigateur le
  // temps de lire le blob, puis on libère la mémoire.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return null;
}
