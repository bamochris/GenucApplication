/**
 * 📝 FormField - Composant input avec validation intégrée
 * Réutilisable pour tous les types de champs
 */
import React, { memo, useState } from 'react';
import './FormField.css';

const FormField = memo(({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  error,
  touched,
  onChange,
  onBlur,
  disabled = false,
  required = false,
  hint,
  maxLength,
  min,
  max,
  pattern,
  children, // Pour select ou textarea
  icon, // Icône à gauche
}) => {
  const hasError = touched && error;
  const isSelect = type === 'select';
  const isTextarea = type === 'textarea';
  const isPassword = type === 'password';
  const [showPassword, setShowPassword] = useState(false);
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="form-field">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      <div className="form-input-wrapper">
        {icon && <span className="form-icon">{icon}</span>}

        {isSelect ? (
          <select
            name={name}
            value={value || ''}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            className={`form-input form-select ${hasError ? 'error' : ''}`}
          >
            <option value="">Sélectionner...</option>
            {children}
          </select>
        ) : isTextarea ? (
          <textarea
            name={name}
            value={value || ''}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder}
            className={`form-input form-textarea ${hasError ? 'error' : ''}`}
            maxLength={maxLength}
          />
        ) : (
          <input
            type={resolvedType}
            name={name}
            value={value || ''}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder}
            className={`form-input ${isPassword ? 'form-input-password' : ''} ${hasError ? 'error' : ''}`}
            maxLength={maxLength}
            min={min}
            max={max}
            pattern={pattern}
            required={required}
          />
        )}

        {isPassword && (
          <button
            type="button"
            className="form-password-toggle"
            onClick={() => setShowPassword(s => !s)}
            tabIndex={-1}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        )}
      </div>

      {hasError && <p className="form-error">{error}</p>}
      {hint && !hasError && <p className="form-hint">{hint}</p>}
    </div>
  );
});

FormField.displayName = 'FormField';

export default FormField;