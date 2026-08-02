// src/components/QuickActionDialog.jsx
// Boîte de dialogue générique des « Actions rapides » — utilisée par tous
// les portails. Affiche une description, des champs optionnels (select,
// texte, nombre, date, textarea) et les boutons Appliquer / Fermer.
// « Appliquer » exécute onApply(values) si fourni, sinon navigue vers
// action.to en transmettant les valeurs via l'état du routeur
// (location.state.quickAction).
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useDraggableDialog from '../hooks/useDraggableDialog';
import './QuickActions.css';

const normaliserOptions = (options = []) =>
  options.map(o => (typeof o === 'string' ? { value: o, label: o } : o));

export default function QuickActionDialog({ action, onClose }) {
  const navigate = useNavigate();
  const dialogRef = useRef(null);
  const { panelStyle, dragHandleProps } = useDraggableDialog();
  const [values, setValues] = useState(() => {
    const init = {};
    (action.fields || []).forEach(f => {
      init[f.name] = f.defaultValue ?? '';
    });
    return init;
  });

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleChange = (name, value) =>
    setValues(v => ({ ...v, [name]: value }));

  const handleApply = () => {
    if (action.onApply) {
      action.onApply(values);
      onClose();
      return;
    }
    if (action.to) {
      navigate(action.to, { state: { quickAction: values } });
    }
    onClose();
  };

  const renderField = (f) => {
    const id = `qa-field-${f.name}`;
    if (f.type === 'select') {
      return (
        <select
          id={id}
          value={values[f.name]}
          onChange={(e) => handleChange(f.name, e.target.value)}
        >
          {normaliserOptions(f.options).map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    }
    if (f.type === 'textarea') {
      return (
        <textarea
          id={id}
          rows={3}
          placeholder={f.placeholder || ''}
          value={values[f.name]}
          onChange={(e) => handleChange(f.name, e.target.value)}
        />
      );
    }
    return (
      <input
        id={id}
        type={f.type || 'text'}
        placeholder={f.placeholder || ''}
        min={f.min}
        max={f.max}
        value={values[f.name]}
        onChange={(e) => handleChange(f.name, e.target.value)}
      />
    );
  };

  return (
    <div className="qa-overlay" onClick={onClose} role="presentation">
      <div
        className="qa-dialog dialog-resizable"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qa-dialog-title"
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          '--qa-color': action.color || '#185FA5',
          '--qa-bg': action.bg || 'rgba(24, 95, 165, 0.12)',
          ...panelStyle,
        }}
      >
        <div className="qa-dialog-header dialog-draggable-handle" {...dragHandleProps}>
          <span className="qa-dialog-icon" aria-hidden="true">{action.icon}</span>
          <h3 id="qa-dialog-title" className="qa-dialog-title">{action.label}</h3>
          <button type="button" className="qa-close" onClick={onClose} aria-label="Fermer la boîte de dialogue">
            ×
          </button>
        </div>

        <div className="qa-dialog-body">
          {action.description && <p className="qa-description">{action.description}</p>}
          {(action.fields || []).map(f => (
            <div className="form-group qa-field" key={f.name}>
              <label htmlFor={`qa-field-${f.name}`}>{f.label}</label>
              {renderField(f)}
              {f.hint && <small className="qa-hint">{f.hint}</small>}
            </div>
          ))}
        </div>

        <div className="qa-dialog-footer">
          <button type="button" className="qa-btn qa-btn-secondary" onClick={onClose}>
            Fermer
          </button>
          <button type="button" className="qa-btn qa-btn-primary" onClick={handleApply}>
            {action.applyLabel || 'Appliquer'}
          </button>
        </div>
      </div>
    </div>
  );
}
