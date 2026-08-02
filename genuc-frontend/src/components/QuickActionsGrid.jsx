// src/components/QuickActionsGrid.jsx
// Grille des « Actions rapides » commune à tous les portails.
// Chaque carte ouvre une QuickActionDialog (Appliquer / Fermer) au lieu
// de naviguer directement. Configuration par action :
//   { icon, label, color?, bg?, description?, fields?, applyLabel?, to?, onApply? }
import { useState } from 'react';
import QuickActionDialog from './QuickActionDialog';
import './QuickActions.css';

export default function QuickActionsGrid({ actions }) {
  const [actionActive, setActionActive] = useState(null);

  return (
    <>
      <div className="qa-grid">
        {actions.map((action, idx) => (
          <button
            key={idx}
            type="button"
            className="qa-card"
            style={{
              '--qa-color': action.color || '#185FA5',
              '--qa-bg': action.bg || 'rgba(24, 95, 165, 0.12)',
            }}
            onClick={() => setActionActive(action)}
          >
            <span className="qa-icon" aria-hidden="true">{action.icon}</span>
            <span className="qa-label">{action.label}</span>
          </button>
        ))}
      </div>

      {actionActive && (
        <QuickActionDialog
          action={actionActive}
          onClose={() => setActionActive(null)}
        />
      )}
    </>
  );
}
