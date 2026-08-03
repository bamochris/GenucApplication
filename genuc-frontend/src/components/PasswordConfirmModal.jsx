// src/components/PasswordConfirmModal.jsx
// Verrou de sécurité pour les actions sensibles (modification/suppression
// d'université, etc.) : redemande le mot de passe du super admin connecté
// et n'exécute l'action fournie qu'après vérification côté serveur.
import { useState } from 'react';
import api from '../api/axios';
import useDraggableDialog from '../hooks/useDraggableDialog';
import './QuickActions.css';

export default function PasswordConfirmModal({ title, message, confirmLabel = 'Confirmer', danger = false, onConfirm, onClose }) {
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [verification, setVerification] = useState(false);
  const { panelStyle, dragHandleProps } = useDraggableDialog();

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!motDePasse) {
      setErreur('Le mot de passe est requis.');
      return;
    }
    setVerification(true);
    setErreur('');
    try {
      // Le backend lit le champ `ancienMotDePasse` (DTO PasswordChangeRequest
      // partagé avec le changement de mot de passe) : envoyer `motDePasse`
      // faisait répondre 400 « Mot de passe requis » quel que soit la saisie.
      await api.post('/api/auth/verifier-mot-de-passe', { ancienMotDePasse: motDePasse });
      await onConfirm();
      onClose();
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Mot de passe incorrect.');
    } finally {
      setVerification(false);
    }
  };

  return (
    <div className="qa-overlay" onClick={onClose} role="presentation">
      <div
        className="qa-dialog dialog-resizable"
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-confirm-title"
        onClick={(e) => e.stopPropagation()}
        style={{ '--qa-color': danger ? '#cc0000' : '#0B1F4A', '--qa-bg': danger ? 'rgba(204,0,0,0.12)' : 'rgba(11,31,74,0.12)', ...panelStyle }}
      >
        <div className="qa-dialog-header dialog-draggable-handle" {...dragHandleProps}>
          <span className="qa-dialog-icon" aria-hidden="true">🔒</span>
          <h3 id="password-confirm-title" className="qa-dialog-title">{title}</h3>
          <button type="button" className="qa-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>

        <form onSubmit={handleConfirm}>
          <div className="qa-dialog-body">
            {message && <p className="qa-description">{message}</p>}
            <div className="form-group qa-field">
              <label htmlFor="password-confirm-input">Mot de passe superadmin</label>
              <input
                id="password-confirm-input"
                type="password"
                autoFocus
                autoComplete="current-password"
                value={motDePasse}
                onChange={(e) => { setMotDePasse(e.target.value); setErreur(''); }}
                disabled={verification}
              />
              {erreur && <small style={{ color: 'var(--color-danger-text, #cc0000)' }}>❌ {erreur}</small>}
            </div>
          </div>

          <div className="qa-dialog-footer">
            <button type="button" className="qa-btn qa-btn-secondary" onClick={onClose} disabled={verification}>
              Fermer
            </button>
            <button type="submit" className="qa-btn qa-btn-primary" disabled={verification}>
              {verification ? 'Vérification...' : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
