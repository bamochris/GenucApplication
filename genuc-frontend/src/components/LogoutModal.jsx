// src/components/LogoutModal.jsx
import useDraggableDialog from '../hooks/useDraggableDialog';
import './LogoutModal.css';

export default function LogoutModal({ onConfirm, onCancel }) {
  const { panelStyle, dragHandleProps } = useDraggableDialog();
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content logout-confirm-modal dialog-resizable" onClick={e => e.stopPropagation()} style={panelStyle}>
        <div className="logout-modal-icon dialog-draggable-handle" {...dragHandleProps}>🔒</div>
        <h3 className="logout-modal-title">Déconnexion</h3>
        <p className="logout-modal-body">
          Êtes-vous sûr de vouloir vous déconnecter ?
        </p>
        <div className="logout-modal-actions">
          <button className="logout-btn-cancel" onClick={onCancel}>
            Annuler
          </button>
          <button className="logout-btn-confirm" onClick={onConfirm}>
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
