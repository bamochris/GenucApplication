// src/components/settings/PasswordPanel.jsx
// Panneau « changer mon mot de passe » des boîtes de dialogue Paramètres.
// Le panneau enregistre sa soumission dans applyRef : ce sont les boutons
// « Appliquer » et « Valider » du pied de la boîte qui la déclenchent.
import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { FaEye, FaEyeSlash, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function PasswordPanel({ applyRef, onDirtyChange }) {
  const [form, setForm] = useState({ ancien: '', nouveau: '', confirmation: '' });
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'ok'|'err', texte }

  const set = (k) => (e) => {
    const valeur = e.target.value;
    setForm((f) => {
      const suivant = { ...f, [k]: valeur };
      onDirtyChange(Boolean(suivant.ancien || suivant.nouveau || suivant.confirmation));
      return suivant;
    });
  };

  const force = (() => {
    const p = form.nouveau;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 2) return { niveau: 'faible', pct: 33 };
    if (score <= 3) return { niveau: 'moyen', pct: 66 };
    return { niveau: 'fort', pct: 100 };
  })();

  const soumettre = useCallback(async () => {
    setMessage(null);
    if (!form.ancien) {
      setMessage({ type: 'err', texte: 'Saisissez votre mot de passe actuel.' });
      return false;
    }
    if (form.nouveau.length < 8) {
      setMessage({ type: 'err', texte: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
      return false;
    }
    if (form.nouveau !== form.confirmation) {
      setMessage({ type: 'err', texte: 'La confirmation ne correspond pas au nouveau mot de passe.' });
      return false;
    }
    try {
      const res = await api.post('/api/auth/changer-mot-de-passe', {
        ancienMotDePasse: form.ancien,
        nouveauMotDePasse: form.nouveau,
      });
      setMessage({ type: 'ok', texte: res.data?.message || 'Mot de passe modifié avec succès.' });
      setForm({ ancien: '', nouveau: '', confirmation: '' });
      onDirtyChange(false);
      return true;
    } catch (err) {
      setMessage({
        type: 'err',
        texte: err.response?.data?.erreur || err.message || 'Échec du changement de mot de passe.',
      });
      return false;
    }
  }, [form, onDirtyChange]);

  // Met la soumission à disposition des boutons du pied de la boîte.
  useEffect(() => {
    applyRef.current = soumettre;
    return () => { applyRef.current = null; };
  }, [applyRef, soumettre]);

  return (
    <div className="sas-panel">
      {message && (
        <div className={`sas-flash ${message.type === 'ok' ? 'sas-flash-ok' : 'sas-flash-err'}`}>
          {message.type === 'ok' ? <FaCheckCircle /> : <FaExclamationTriangle />}
          <span>{message.texte}</span>
        </div>
      )}

      <form className="sas-form" onSubmit={(e) => { e.preventDefault(); soumettre(); }}>
        <label className="sas-field">
          <span>Mot de passe actuel</span>
          <div className="sas-input-wrap">
            <input
              type={visible ? 'text' : 'password'}
              value={form.ancien}
              onChange={set('ancien')}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="sas-eye"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'Masquer les mots de passe' : 'Afficher les mots de passe'}
            >
              {visible ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </label>

        <label className="sas-field">
          <span>Nouveau mot de passe</span>
          <div className="sas-input-wrap">
            <input
              type={visible ? 'text' : 'password'}
              value={form.nouveau}
              onChange={set('nouveau')}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          {force && (
            <div className="sas-strength">
              <div className={`sas-strength-bar sas-strength-${force.niveau}`} style={{ width: `${force.pct}%` }} />
              <span className={`sas-strength-label sas-strength-txt-${force.niveau}`}>
                Robustesse : {force.niveau}
              </span>
            </div>
          )}
        </label>

        <label className="sas-field">
          <span>Confirmer le nouveau mot de passe</span>
          <div className="sas-input-wrap">
            <input
              type={visible ? 'text' : 'password'}
              value={form.confirmation}
              onChange={set('confirmation')}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
        </label>

        <p className="sas-hint">
          Validez avec « Appliquer » (la boîte reste ouverte) ou « Valider » (applique puis ferme).
        </p>
        {/* Soumission possible avec Entrée */}
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </div>
  );
}
