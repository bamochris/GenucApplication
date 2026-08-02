/**
 * Composant Pagination — Contrôles navigation
 * ✅ ÉTAPE 3 : Interface pagination réutilisable
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'react-icons/fi';
import './Pagination.css';

const Pagination = ({
  page,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalElements,
  isLoading = false,
}) => {
  const handlePrevious = () => {
    if (page > 0) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages - 1) {
      onPageChange(page + 1);
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    onPageSizeChange(newSize);
  };

  const startIndex = page * pageSize + 1;
  const endIndex = Math.min((page + 1) * pageSize, totalElements);

  // Génère les numéros de pages à afficher
  const getPageNumbers = () => {
    const maxButtons = 5;
    const pages = [];
    let start = Math.max(0, page - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons);

    if (end - start < maxButtons) {
      start = Math.max(0, end - maxButtons);
    }

    for (let i = start; i < end; i++) {
      pages.push(i);
    }

    return pages;
  };

  if (totalPages === 0) {
    return null;
  }

  return (
    <div className="pagination-container">
      <div className="pagination-left">
        <div className="pagination-info">
          <span>
            Affichage {startIndex} à {endIndex} de {totalElements}
          </span>
        </div>

        <div className="page-size-selector">
          <label htmlFor="pageSize">Éléments par page :</label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={handlePageSizeChange}
            disabled={isLoading}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <div className="pagination-center">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={page === 0 || isLoading}
          className="pagination-btn prev-btn"
          aria-label="Page précédente"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Page Numbers */}
        <div className="page-numbers">
          {getPageNumbers().map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              disabled={isLoading}
              className={`page-number ${page === p ? 'active' : ''}`}
              aria-label={`Page ${p + 1}`}
              aria-current={page === p ? 'page' : undefined}
            >
              {p + 1}
            </button>
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={page === totalPages - 1 || isLoading}
          className="pagination-btn next-btn"
          aria-label="Page suivante"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="pagination-right">
        <span className="page-info">
          Page {page + 1} / {totalPages}
        </span>
      </div>
    </div>
  );
};

export default Pagination;
