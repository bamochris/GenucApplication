// src/pages/securite/Securite2FA.jsx
// Activation / désactivation de l'authentification à deux facteurs (TOTP) — recommandée
// en priorité pour les rôles sensibles (recteur, superadmin) mais ouverte à tout compte.
import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';

export default function Securite2FA() {
  const [enabled, setEnabled] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [setupData, setSetupData] = useState(null);
  const [confirmCode, setConfirmCode] = useState('');
  const [confirming, setConfirming] = useState(false);

  const [disableCode, setDisableCode] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disabling, setDisabling] = useState(false);

  const chargerStatut = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/auth/2fa/status');
      setEnabled(data.enabled);
    } catch (err) {
      setError('Impossible de charger le statut de la 2FA');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    chargerStatut();
  }, [chargerStatut]);

  const demarrerActivation = async () => {
    setError('');
    setMessage('');
    try {
      const { data } = await api.post('/api/auth/2fa/setup');
      setSetupData(data);
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors du démarrage de l\'activation');
    }
  };

  const confirmerActivation = async (e) => {
    e.preventDefault();
    if (!confirmCode.trim()) return;
    setConfirming(true);
    setError('');
    try {
      await api.post('/api/auth/2fa/confirm', { code: confirmCode.trim() });
      setMessage('✅ 2FA activée avec succès. Elle sera demandée à chaque connexion.');
      setSetupData(null);
      setConfirmCode('');
      chargerStatut();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Code invalide');
    } finally {
      setConfirming(false);
    }
  };

  const desactiver = async (e) => {
    e.preventDefault();
    if (!disableCode.trim()) return;
    setDisabling(true);
    setError('');
    try {
      await api.post('/api/auth/2fa/disable', { code: disableCode.trim() });
      setMessage('2FA désactivée.');
      setShowDisableForm(false);
      setDisableCode('');
      chargerStatut();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Code invalide');
    } finally {
      setDisabling(false);
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="page securite-2fa">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔐 Sécurité du compte</h1>
          <p className="page-sub">Authentification à deux facteurs (2FA) — fortement recommandée pour les comptes recteur et superadmin</p>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      <div className="card">
        <h3 className="card-title">
          Statut : {enabled ? <span className="badge badge-success">✅ Activée</span> : <span className="badge badge-neutral">⭕ Désactivée</span>}
        </h3>

        {enabled === false && !setupData && (
          <div>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
              La 2FA ajoute une couche de sécurité supplémentaire : en plus de votre mot de passe,
              un code à 6 chiffres généré par une application d'authentification (Google Authenticator,
              Authy, Microsoft Authenticator...) sera exigé à chaque connexion.
            </p>
            <button className="btn-primary" onClick={demarrerActivation}>
              🔒 Activer la 2FA
            </button>
          </div>
        )}

        {setupData && (
          <div className="setup-2fa-block">
            <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
              <li>Scannez ce QR code avec votre application d'authentification</li>
              <li>Ou entrez manuellement la clé secrète</li>
              <li>Entrez le code à 6 chiffres généré pour confirmer</li>
            </ol>

            {setupData.qrCodeImage && (
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <img
                  src={setupData.qrCodeImage}
                  alt="QR code 2FA"
                  style={{ width: 200, height: 200, border: '1px solid var(--border-color)', borderRadius: 8, padding: 8 }}
                />
              </div>
            )}

            <div className="form-group">
              <label>Clé secrète (si vous ne pouvez pas scanner)</label>
              <code style={{ display: 'block', padding: 10, background: 'var(--bg-secondary)', borderRadius: 6, letterSpacing: 2 }}>
                {setupData.secret}
              </code>
            </div>

            <form onSubmit={confirmerActivation} className="form-grid" style={{ marginTop: 16 }}>
              <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                <label>Code de vérification *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  style={{ textAlign: 'center', letterSpacing: 6, fontSize: '1.3rem' }}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={confirming} style={{ gridColumn: '1 / span 2' }}>
                {confirming ? 'Vérification...' : '✅ Confirmer et activer'}
              </button>
              <button
                type="button"
                className="btn-outline"
                style={{ gridColumn: '1 / span 2' }}
                onClick={() => { setSetupData(null); setConfirmCode(''); }}
              >
                Annuler
              </button>
            </form>
          </div>
        )}

        {enabled && !showDisableForm && (
          <div>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
              La 2FA est active sur ce compte. Un code sera demandé à chaque connexion.
            </p>
            <button className="btn-outline" onClick={() => setShowDisableForm(true)}>
              Désactiver la 2FA
            </button>
          </div>
        )}

        {enabled && showDisableForm && (
          <form onSubmit={desactiver} className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Entrez un code de vérification pour confirmer la désactivation *</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                style={{ textAlign: 'center', letterSpacing: 6, fontSize: '1.3rem' }}
                required
              />
            </div>
            <button type="submit" className="btn-danger" disabled={disabling} style={{ gridColumn: '1 / span 2' }}>
              {disabling ? 'Désactivation...' : '🚫 Confirmer la désactivation'}
            </button>
            <button
              type="button"
              className="btn-outline"
              style={{ gridColumn: '1 / span 2' }}
              onClick={() => { setShowDisableForm(false); setDisableCode(''); }}
            >
              Annuler
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
