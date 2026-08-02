// src/hooks/useApi.js
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { estAnnulation } from '../api/annulation';

/**
 * Hook personnalisé pour gérer les appels API avec chargement, erreurs et annulation
 * @param {Function} apiCall - Fonction qui appelle l'API (ex: () => api.get('/endpoint'))
 * @param {Object} options - { immediate: true/false, initialData: null }
 * @returns {Object} { data, loading, error, execute, reset }
 */
export function useApi(apiCall, options = {}) {
  const { immediate = true, initialData = null } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const callIdRef = useRef(0); // Pour identifier les appels successifs

  // ⚠️ `apiCall` est presque toujours une fonction fléchée écrite dans le corps du
  // composant : son identité change à CHAQUE rendu. La garder en dépendance de `execute`
  // rendait `execute` instable, donc l'effet de montage plus bas se rejouait à chaque
  // rendu — il annulait la requête en cours et en relançait une, dont la réponse
  // provoquait un rendu, qui relançait l'effet… boucle infinie de requêtes annulées
  // (visible sur Dashboard et AdminDossiers, qui passent une fonction fléchée en ligne).
  // On garde la dernière version dans une ref : `execute` devient stable et l'appel
  // utilise toujours la fermeture la plus récente.
  const apiCallRef = useRef(apiCall);
  useEffect(() => {
    apiCallRef.current = apiCall;
  });

  // Fonction d'exécution de l'appel API
  const execute = useCallback(async (...args) => {
    // Incrémenter l'identifiant pour détecter les appels obsolètes
    const currentCallId = ++callIdRef.current;

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      // Vérifier si l'appel est déjà annulé avant de lancer la requête
      if (controller.signal.aborted) {
        throw new Error('Aborted');
      }

      // Passer le signal à l'appel API
      const response = await apiCallRef.current(...args, { signal: controller.signal });

      // Vérifier que le composant est toujours monté et que l'appel est le dernier
      if (isMountedRef.current && currentCallId === callIdRef.current) {
        setData(response.data);
        return response.data;
      }
    } catch (err) {
      // Ignorer les erreurs d'annulation (AbortController ou AbortSignal)
      if (estAnnulation(err) || err.message === 'Aborted') {
        // Ne rien faire, c'est une annulation volontaire
        return;
      }
      // Ne traiter que l'erreur la plus récente
      if (isMountedRef.current && currentCallId === callIdRef.current) {
        const message = err.response?.data?.message || err.message || 'Une erreur est survenue';
        setError(message);
      }
    } finally {
      // Ne mettre à jour le loading que si l'appel est toujours le dernier
      if (isMountedRef.current && currentCallId === callIdRef.current) {
        setLoading(false);
      }
    }
    // Aucune dépendance : `execute` doit rester stable (cf. apiCallRef ci-dessus).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fonction de réinitialisation
  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
    // Réinitialiser l'identifiant pour éviter les appels obsolètes
    callIdRef.current = 0;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [initialData]);

  // Effet pour l'exécution immédiate
  useEffect(() => {
    isMountedRef.current = true;
    if (immediate) {
      execute();
    }
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [execute, immediate]);

  return { data, loading, error, execute, reset };
}

// Version simplifiée pour les requêtes GET courantes
export function useGet(endpoint, options = {}) {
  // `execute(...args)` ajoute toujours la configuration Axios en DERNIER argument.
  // L'ancienne signature `(_, config = {})` ne la recevait que si l'appelant passait
  // exactement un argument : sur `execute()` — le cas du chargement immédiat — le
  // `signal` atterrissait dans `_` et la requête partait sans, l'annulation au démontage
  // n'ayant alors plus aucun effet.
  const apiCall = useCallback(
    (...args) => api.get(endpoint, args.length ? args[args.length - 1] : {}),
    [endpoint]
  );
  return useApi(apiCall, options);
}

// Version pour les requêtes POST avec body
export function usePost(endpoint) {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const callIdRef = useRef(0);

  const execute = useCallback(async (data, config = {}) => {
    const currentCallId = ++callIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(endpoint, data, config);
      if (isMountedRef.current && currentCallId === callIdRef.current) {
        setResponse(res.data);
        return res.data;
      }
    } catch (err) {
      if (estAnnulation(err)) {
        return;
      }
      if (isMountedRef.current && currentCallId === callIdRef.current) {
        const message = err.response?.data?.message || err.message || 'Erreur lors de la requête';
        setError(message);
        throw err;
      }
    } finally {
      if (isMountedRef.current && currentCallId === callIdRef.current) {
        setLoading(false);
      }
    }
  }, [endpoint]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  return { data: response, loading, error, execute };
}