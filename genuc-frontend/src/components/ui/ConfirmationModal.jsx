import React from 'react';
import Button from './Button';
import useDraggableDialog from '../../hooks/useDraggableDialog';
import './ConfirmationModal.css';

const ConfirmationModal = ({ title, message, onConfirm, onCancel, confirmText = 'Oui', cancelText = 'Annuler' }) => {
  const { panelStyle, dragHandleProps } = useDraggableDialog();
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content dialog-resizable" onClick={(e) => e.stopPropagation()} style={panelStyle}>
        <h3 className="dialog-draggable-handle" {...dragHandleProps}>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <Button variant="outline" onClick={onCancel}>{cancelText}</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;