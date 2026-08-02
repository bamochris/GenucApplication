// src/pages/admin/deliberation/ParametresLMD.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import deliberationService from '../../../services/deliberationService';
import '../../Dashboard.css';

export default function ParametresLMD() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [parametres, setParametres] = useState({
    seuilReussite: 10,
    creditsParUE: 30,
    compensationAutorisee: true,
    detteMax: 2,
    creditsAnnuelRequis: 60,
    mentionTresBien: 16,
    mentionBien: 14,
    mentionAssezBien: 12,
    mentionPassable: 10,
  });

  useEffect(() => {
    loadParametres();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, []);

  const loadParametres = async () => {
    try {
      const data = await deliberationService.getParametresLMD(user.universiteId);
      if (data) setParametres(data);
    } catch (err) {
      setError('Erreur lors du chargement des paramètres');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setParametres({
      ...parametres,
      [name]: type === 'checkbox' ? checked : parseFloat(value) || value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await deliberationService.updateParametresLMD(user.universiteId, parametres);
      setMessage('✅ Paramètres enregistrés avec succès');
    } catch (err) {
      setError('❌ Erreur lors de l\'enregistrement');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Chargement des paramètres...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">⚙️ Paramètres LMD</h1>
        <p className="page-sub">Configuration des règles académiques pour le système LMD</p>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>Seuil de réussite *</label>
            <input
              type="number"
              step="0.5"
              name="seuilReussite"
              value={parametres.seuilReussite}
              onChange={handleChange}
              required
              min="0"
              max="20"
            />
            <small>Moyenne minimale pour valider</small>
          </div>

          <div className="form-group">
            <label>Crédits par UE</label>
            <input
              type="number"
              name="creditsParUE"
              value={parametres.creditsParUE}
              onChange={handleChange}
              min="1"
            />
          </div>

          <div className="form-group">
            <label>Dette académique autorisée (UE)</label>
            <input
              type="number"
              name="detteMax"
              value={parametres.detteMax}
              onChange={handleChange}
              min="0"
            />
            <small>Nombre d'UE non validées autorisées pour le passage</small>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="compensationAutorisee"
                checked={parametres.compensationAutorisee}
                onChange={handleChange}
              />
              Compenser les UE entre elles
            </label>
          </div>

          <div className="form-group">
            <label>Crédits annuels requis</label>
            <input
              type="number"
              name="creditsAnnuelRequis"
              value={parametres.creditsAnnuelRequis}
              onChange={handleChange}
              min="1"
            />
          </div>

          <div className="form-group">
            <label>Mention Très Bien (≥)</label>
            <input
              type="number"
              step="0.5"
              name="mentionTresBien"
              value={parametres.mentionTresBien}
              onChange={handleChange}
              min="10"
              max="20"
            />
          </div>

          <div className="form-group">
            <label>Mention Bien (≥)</label>
            <input
              type="number"
              step="0.5"
              name="mentionBien"
              value={parametres.mentionBien}
              onChange={handleChange}
              min="10"
              max="20"
            />
          </div>

          <div className="form-group">
            <label>Mention Assez Bien (≥)</label>
            <input
              type="number"
              step="0.5"
              name="mentionAssezBien"
              value={parametres.mentionAssezBien}
              onChange={handleChange}
              min="10"
              max="20"
            />
          </div>

          <div className="form-group">
            <label>Mention Passable (≥)</label>
            <input
              type="number"
              step="0.5"
              name="mentionPassable"
              value={parametres.mentionPassable}
              onChange={handleChange}
              min="10"
              max="20"
            />
          </div>

          <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10, marginTop: 10 }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? '⏳ Enregistrement...' : '💾 Enregistrer les paramètres'}
            </button>
            <button type="button" className="btn-outline" onClick={loadParametres}>
              🔄 Réinitialiser
            </button>
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title">ℹ️ Règles en vigueur</h3>
        <ul style={{ listStyle: 'none', padding: 0, lineHeight: 2 }}>
          <li>✅ <strong>Seuil de réussite :</strong> {parametres.seuilReussite}/20</li>
          <li>✅ <strong>Dette autorisée :</strong> {parametres.detteMax} UE</li>
          <li>✅ <strong>Compensation :</strong> {parametres.compensationAutorisee ? 'Activée' : 'Désactivée'}</li>
          <li>✅ <strong>Crédits annuels requis :</strong> {parametres.creditsAnnuelRequis}</li>
          <li>✅ <strong>Mentions :</strong> Passable ≥ {parametres.mentionPassable}, AB ≥ {parametres.mentionAssezBien}, Bien ≥ {parametres.mentionBien}, TB ≥ {parametres.mentionTresBien}</li>
        </ul>
      </div>
    </div>
  );
}