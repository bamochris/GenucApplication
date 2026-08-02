// src/utils/canauxPaiement.js
// Résolution des canaux de paiement ouverts à l'étudiant.
//
// L'admin de l'université décide, sur CHAQUE frais, quels modes de paiement sont
// acceptés et sur quelles banques le règlement peut être déposé. Le portail
// étudiant ne doit donc proposer que ce qui a été ouvert.
//
// Convention partagée avec le backend : une liste VIDE signifie « aucune
// restriction », et non « rien d'autorisé ». C'est ce qui préserve le
// comportement des frais créés avant l'introduction de cette option.

/**
 * Intersection des canaux ouverts par plusieurs frais réglés ensemble.
 *
 * <p>Intersection et non union : un paiement qui couvre deux frais doit emprunter
 * un canal accepté par les DEUX, sinon l'un des deux serait réglé par un moyen
 * que l'admin lui a refusé.</p>
 *
 * @param {Array<Object>} frais   frais sélectionnés (objets renvoyés par l'API)
 * @param {string} cle            'modesPaiementAutorises' ou 'banquesAutorisees'
 * @returns {Array|null} la liste des valeurs communes, ou null si aucune
 *          restriction ne s'applique (au moins un frais sans contrainte)
 */
export function canauxCommuns(frais, cle) {
  if (!Array.isArray(frais) || frais.length === 0) return null;

  let commun = null;
  for (const f of frais) {
    const ouverts = f?.[cle];
    // Un frais sans restriction n'en impose aucune aux autres.
    if (!Array.isArray(ouverts) || ouverts.length === 0) return null;
    commun = commun === null
      ? [...ouverts]
      : commun.filter(v => ouverts.includes(v));
  }
  return commun;
}

/**
 * Filtre une liste d'options par les canaux communs aux frais sélectionnés.
 *
 * <p>Si l'intersection est vide — l'admin a ouvert des canaux incompatibles entre
 * deux frais — on renvoie la liste complète plutôt que d'enfermer l'étudiant dans
 * un écran sans aucune option. Le cas est signalé par {@link intersectionVide}
 * pour que l'interface puisse l'expliquer.</p>
 *
 * @param {Array<Object>} options options à filtrer
 * @param {Function} codeDe      extrait le code d'une option
 */
export function filtrerParCanaux(options, frais, cle, codeDe = (o) => o.code) {
  const commun = canauxCommuns(frais, cle);
  if (commun === null || commun.length === 0) return options;
  return options.filter(o => commun.includes(codeDe(o)));
}

/** true quand les frais sélectionnés n'ont aucun canal en commun. */
export function intersectionVide(frais, cle) {
  const commun = canauxCommuns(frais, cle);
  return commun !== null && commun.length === 0;
}

const canauxPaiement = { canauxCommuns, filtrerParCanaux, intersectionVide };
export default canauxPaiement;
