// src/utils/documentsInscription.js
// Catalogue des documents qu'un candidat peut téléverser lors de son
// inscription. L'admin d'université choisit, filière par filière, lesquels
// sont demandés et lesquels sont obligatoires (Filiere.documentsRequis,
// tableau JSON [{key, obligatoire}]). Ce choix est affiché publiquement
// (fiche filière) et pilote l'étape « Documents » du formulaire d'inscription.

export const DOCUMENTS_CATALOGUE = [
  { key: 'photoIdentite',         label: "Pièce d'identité (carte d'électeur ou passeport)", accept: 'image/*,application/pdf', groupe: 'Photo & Identité' },
  { key: 'photoPasseport',        label: 'Photo passeport',                   accept: 'image/*',                 groupe: 'Photo & Identité' },
  { key: 'carteIdentite',         label: "Carte d'identité nationale (optionnel)", accept: 'image/*,application/pdf', groupe: 'Photo & Identité' },
  { key: 'diplomeEtat',           label: "Diplôme d'État ou attestation de réussite", accept: 'image/*,application/pdf', groupe: 'Documents scolaires' },
  { key: 'relevePoints',          label: 'Relevé de notes / Bulletin',        accept: 'image/*,application/pdf', groupe: 'Documents scolaires' },
  { key: 'lettreRecommandation',  label: 'Lettre de recommandation',          accept: 'image/*,application/pdf', groupe: 'Documents scolaires' },
  { key: 'acteNaissance',         label: 'Acte de naissance',                 accept: 'image/*,application/pdf', groupe: 'Documents administratifs' },
  { key: 'attestationPhysique',   label: "Attestation d'aptitude physique",   accept: 'image/*,application/pdf', groupe: 'Documents administratifs' },
  { key: 'attestationConduite',   label: 'Attestation de bonne conduite',     accept: 'image/*,application/pdf', groupe: 'Documents administratifs' },
];

// Liste servie quand la filière n'a rien prédéfini — reproduit le
// comportement historique du formulaire (4 documents obligatoires).
export const DOCUMENTS_PAR_DEFAUT = DOCUMENTS_CATALOGUE.map(d => ({
  key: d.key,
  obligatoire: ['photoIdentite', 'photoPasseport', 'diplomeEtat', 'relevePoints', 'acteNaissance'].includes(d.key),
}));

export function libelleDocument(key) {
  return DOCUMENTS_CATALOGUE.find(c => c.key === key)?.label || key;
}

export function acceptDocument(key) {
  return DOCUMENTS_CATALOGUE.find(c => c.key === key)?.accept || 'image/*,application/pdf';
}

// Filiere.documentsRequis (JSON) → [{key, obligatoire}] validés, ou null
// si vide/illisible (le formulaire retombe alors sur DOCUMENTS_PAR_DEFAUT).
export function parseDocumentsRequis(json) {
  if (!json) return null;
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return null;
    const normalises = arr
      .map(d => (typeof d === 'string' ? { key: d, obligatoire: false } : d))
      .filter(d => d?.key && DOCUMENTS_CATALOGUE.some(c => c.key === d.key))
      .map(d => ({ key: d.key, obligatoire: !!d.obligatoire }));
    return normalises.length ? normalises : null;
  } catch {
    return null;
  }
}
