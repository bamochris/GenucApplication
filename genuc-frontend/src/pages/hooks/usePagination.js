/**
 * Hook usePagination — Gestion pagination réutilisable
 * ✅ ÉTAPE 3 : État pagination + helpers
 */

import { useState, useCallback } from 'react';
import API_CONFIG from '../config/apiConfig';

/**
 * Hook pour gérer la pagination
 * Retourne l'état et les actions pour naviguer
 */
export const usePagination = (initialPage = 0, initialSize = API_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE) => {
  const [page, setPage] = useState(initialPage);
  const [size, setSize] = useState(initialSize);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Met à jour l'état depuis la réponse pagée du backend
   * Format: { content: [], page: 0, size: 20, totalElements: 100, totalPages: 5 }
   */
  const setPaginationState = useCallback((paginationData) => {
    if (paginationData) {
      setPage(paginationData.page || 0);
      setSize(paginationData.size || API_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE);
      setTotalElements(paginationData.totalElements || 0);
      setTotalPages(paginationData.totalPages || 0);
    }
  }, []);

  /**
   * Navigue vers une page spécifique
   */
  const goToPage = useCallback((pageNumber) => {
    if (pageNumber >= 0 && pageNumber < totalPages) {
      setPage(pageNumber);
      setError(null);
    }
  }, [totalPages]);

  /**
   * Navigue à la page suivante
   */
  const nextPage = useCallback(() => {
    if (page < totalPages - 1) {
      setPage((prev) => prev + 1);
      setError(null);
    }
  }, [page, totalPages]);

  /**
   * Navigue à la page précédente
   */
  const prevPage = useCallback(() => {
    if (page > 0) {
      setPage((prev) => prev - 1);
      setError(null);
    }
  }, [page]);

  /**
   * Change la taille de page
   */
  const setPageSize = useCallback((newSize) => {
    if (newSize > 0 && newSize <= API_CONFIG.PAGINATION.MAX_PAGE_SIZE) {
      setSize(newSize);
      setPage(0); // Reset to first page
      setError(null);
    }
  }, []);

  /**
   * Reset à la première page
   */
  const resetPagination = useCallback(() => {
    setPage(0);
    setTotalElements(0);
    setTotalPages(0);
    setError(null);
  }, []);

  /**
   * Getters pour l'état
   */
  const isFirstPage = page === 0;
  const isLastPage = page === totalPages - 1 || totalPages === 0;
  const hasNextPage = page < totalPages - 1;
  const hasPrevPage = page > 0;
  const startIndex = page * size;
  const endIndex = Math.min((page + 1) * size, totalElements);

  return {
    // État
    page,
    size,
    totalElements,
    totalPages,
    loading,
    error,

    // Setters
    setLoading,
    setError,
    setPaginationState,

    // Actions
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    resetPagination,

    // Getters
    isFirstPage,
    isLastPage,
    hasNextPage,
    hasPrevPage,
    startIndex,
    endIndex,
  };
};

export default usePagination;
