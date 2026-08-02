// src/api/annulation.js
//
// Reconnaissance d'une requête ANNULÉE.
//
// Une annulation n'est pas une panne : elle traduit une décision du frontend (démontage
// d'un composant, filtre changé, double montage de StrictMode). Elle ne doit donc jamais
// remonter à l'utilisateur, ni polluer la console, ni faire conclure « pas de session ».
//
// Trois formes coexistent selon l'origine :
//   - `AbortError`   — un `fetch` nu interrompu par un AbortController ;
//   - `CanceledError` / `ERR_CANCELED` — Axios, que le signal soit avorté AVANT l'envoi
//     (throwIfCancellationRequested en tête de dispatchRequest) ou pendant ;
//   - `axios.isCancel` — l'ancienne API CancelToken, encore possible via des libs tierces.

import axios from 'axios';

export const estAnnulation = (erreur) =>
  Boolean(erreur) &&
  (erreur.code === 'ERR_CANCELED' ||
    erreur.name === 'CanceledError' ||
    erreur.name === 'AbortError' ||
    axios.isCancel(erreur));

export default estAnnulation;
