// src/hooks/usePhotosIdentite.js
// Photos du compte connecté (profil + passeport), rafraîchies partout dès
// qu'un téléversement aboutit (événement global « photos-maj »).
//
// Les photos d'identité ne sont plus servies en statique sous /uploads/photos/ :
// elles contiennent une donnée personnelle (photo passeport) et n'importe qui
// pouvait les lire en connaissant l'URL. Elles passent maintenant par
// /api/fichiers/photos/**, qui exige le jeton et vérifie le propriétaire — donc
// le hook télécharge le contenu et expose des URLs d'objet (blob:) directement
// utilisables dans <img src>.
import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import { chargerFichierPrive } from '../utils/fichierPrive';

export function urlPhoto(chemin) {
  if (!chemin) return null;
  // Déjà exploitable tel quel : data URI, blob: produit par ce hook, ou URL absolue.
  if (chemin.startsWith('data:') || chemin.startsWith('blob:') || chemin.startsWith('http')) {
    return chemin;
  }
  // Un chemin brut /uploads/photos/... n'est plus lisible sans jeton : on ne
  // renvoie pas d'URL cassée, l'appelant retombe sur son avatar par défaut.
  return null;
}

export default function usePhotosIdentite(actif = true) {
  const [photos, setPhotos] = useState({ photoProfil: null, photoPasseport: null });
  // URLs d'objet en cours d'utilisation, à révoquer au remplacement/démontage
  // sous peine de fuite mémoire à chaque rafraîchissement.
  const objectUrls = useRef([]);

  const libererAnciennes = useCallback(() => {
    objectUrls.current.forEach(url => URL.revokeObjectURL(url));
    objectUrls.current = [];
  }, []);

  const recharger = useCallback(async () => {
    if (!actif) return;
    try {
      const { data } = await api.get('/api/auth/mes-photos');
      const [profil, passeport] = await Promise.all([
        chargerFichierPrive(data?.photoProfil),
        chargerFichierPrive(data?.photoPasseport),
      ]);
      libererAnciennes();
      objectUrls.current = [profil, passeport].filter(Boolean);
      setPhotos({ photoProfil: profil, photoPasseport: passeport });
    } catch {
      // Compte sans photo ou appel en échec : on garde l'avatar par défaut.
    }
  }, [actif, libererAnciennes]);

  useEffect(() => {
    recharger();
    window.addEventListener('photos-maj', recharger);
    return () => {
      window.removeEventListener('photos-maj', recharger);
      libererAnciennes();
    };
  }, [recharger, libererAnciennes]);

  return photos;
}
