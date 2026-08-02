import { useState, useEffect } from 'react';

/**
 * Hook pour débouncer une valeur (utile pour la recherche en temps réel)
 * @param {any} value - La valeur à débouncer
 * @param {number} delay - Délai en millisecondes (défaut: 300ms)
 * @returns {any} - La valeur débouncée
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook pour rechercher avec debounce (simplifié)
 * @param {Function} searchFn - Fonction de recherche qui prend le terme en paramètre
 * @param {number} delay - Délai en millisecondes
 * @returns {Object} { searchTerm, setSearchTerm, results, loading }
 */
export function useDebouncedSearch(searchFn, delay = 300) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedTerm = useDebounce(searchTerm, delay);

  useEffect(() => {
    if (!debouncedTerm) {
      setResults([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    searchFn(debouncedTerm)
      .then(data => {
        if (isMounted) {
          setResults(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setResults([]);
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [debouncedTerm, searchFn]);

  return { searchTerm, setSearchTerm, results, loading };
}