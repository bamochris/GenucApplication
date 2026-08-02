// src/constants/banquesRdc.js
// Canaux de règlement reconnus par la plateforme : TachPay (paiement en ligne)
// et les banques commerciales congolaises partenaires.
//
// Les chemins de logo pointent sur public/assets et sont recopiés TELS QUELS
// depuis le disque : la casse et l'extension varient d'un fichier à l'autre
// (Ecobank.jpg, firstbank.png, Logo-tmb.png…) et un serveur Linux, contrairement
// à Windows, refusera un nom approximatif.
//
// Cette liste sert de RÉFÉRENTIEL D'AFFICHAGE, pas de liste fermée : l'admin
// saisit librement le nom de ses comptes (écran « Comptes bancaires »), et le
// logo n'est affiché que si le nom saisi correspond à une entrée ci-dessous.
// Une banque absente d'ici reste donc parfaitement utilisable, sans logo.
export const BANQUES_RDC = [
  { code: 'TACHPAY',    nom: 'TachPay',      logo: '/assets/TachPay-logo.png', enLigne: true },
  { code: 'EQUITYBCDC', nom: 'Equity BCDC',  logo: '/assets/EquityBCDC.png' },
  { code: 'ECOBANK',    nom: 'Ecobank',      logo: '/assets/Ecobank.jpg' },
  { code: 'RAWBANK',    nom: 'RawBank',      logo: '/assets/RawBank.png' },
  { code: 'FIRSTBANK',  nom: 'FirstBank',    logo: '/assets/firstbank.png' },
  { code: 'UBA',        nom: 'UBA',          logo: '/assets/UBA.jpg' },
  { code: 'TMB',        nom: 'TMB',          logo: '/assets/Logo-tmb.png' },
  { code: 'BGFIBANK',   nom: 'BGFIBank',     logo: '/assets/BGFIBANK.png' },
  { code: 'FNBANK',     nom: 'FNBank',       logo: '/assets/FNBANK.png' },
  // Fichier nommé « sofibank.png » sur le disque, malgré la raison sociale
  // « Sofibanque » — le chemin doit rester celui du fichier réel.
  { code: 'SOFIBANQUE', nom: 'Sofibanque',   logo: '/assets/sofibank.png' },
];

/** Banques seules (hors TachPay), pour les écrans qui listent des comptes bancaires. */
export const BANQUES_SEULES = BANQUES_RDC.filter(b => !b.enLigne);

/**
 * Réduit un nom de banque à sa forme comparable : sans accents, sans espaces ni
 * ponctuation, en minuscules. « Equity BCDC », « equitybcdc » et « EQUITY-BCDC »
 * se ramènent ainsi à la même clé — l'admin saisissant le nom à la main, on ne
 * peut pas compter sur une correspondance exacte.
 */
const normaliser = (valeur) =>
  (valeur || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();

/**
 * Logo correspondant à un nom de banque saisi librement.
 * @returns {string|null} chemin du logo, ou null si la banque n'est pas au référentiel
 */
export function logoBanque(nomBanque) {
  const cle = normaliser(nomBanque);
  if (!cle) return null;
  const trouve = BANQUES_RDC.find(b => {
    const ref = normaliser(b.nom);
    // Inclusion dans les deux sens : « Equity BCDC (Kinshasa) » ou « BCDC »
    // doivent tous deux retrouver Equity BCDC.
    return cle === ref || cle.includes(ref) || ref.includes(cle);
  });
  return trouve ? trouve.logo : null;
}

export default BANQUES_RDC;
