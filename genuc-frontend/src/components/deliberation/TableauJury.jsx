// src/components/deliberation/TableauJury.jsx
import React from 'react';
import StatutBadge from './StatutBadge';

export default function TableauJury({ 
  data, 
  loading, 
  onRowClick, 
  showActions = false,
  actions = null 
}) {
  if (loading) {
    return <div className="loading-spinner">Chargement...</div>;
  }

  if (!data || data.length === 0) {
    return <p className="text-center text-muted">Aucun étudiant trouvé.</p>;
  }

  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            <th>Matricule</th>
            <th>Nom</th>
            <th>Moyenne</th>
            <th>Crédits</th>
            <th>Décision</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((etudiant) => (
            <tr key={etudiant.id} onClick={() => onRowClick && onRowClick(etudiant)} style={{ cursor: onRowClick ? 'pointer' : 'default' }}>
              <td><span className="uni-code">{etudiant.matricule}</span></td>
              <td>{etudiant.prenom} {etudiant.nom}</td>
              <td>{etudiant.moyenne?.toFixed(2) ?? '-'}</td>
              <td>{etudiant.creditsAcquis ?? 0} / {etudiant.creditsTotal ?? 0}</td>
              <td>
                <StatutBadge statut={etudiant.statut} showLabel />
              </td>
              {showActions && (
                <td>
                  {actions && typeof actions === 'function' ? actions(etudiant) : actions}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}