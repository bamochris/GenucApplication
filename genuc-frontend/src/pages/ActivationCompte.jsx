// src/pages/ActivationCompte.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Login.css';

export default function ActivationCompte() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [etape, setEtape] = useState('verification');
  const [info, setInfo] = useState(null);
  const [form, setForm] = useState({ motDePasse: '', confirmMotDePasse: '' });
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (!token) {
      setErreur('Token manquant');
      return;
    }
    verifierToken();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [token]);

  const verifierToken = async () => {
    try {
      const response = await api.get(`/api/activation/verifier?token=${token}`);
      setInfo(response.data);
      setEtape('formulaire');
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Token invalide ou expiré');
    }
  };

  const creerMotDePasse = async (e) => {
    e.preventDefault();
    setErreur('');
    
    if (form.motDePasse.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    if (form.motDePasse !== form.confirmMotDePasse) {
      setErreur('Les mots de passe ne correspondent pas');
      return;
    }
    
    setChargement(true);
    
    try {
      await api.post('/api/activation/creer-mot-de-passe', {
        token,
        motDePasse: form.motDePasse,
        confirmMotDePasse: form.confirmMotDePasse
      });
      setEtape('success');
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur lors de la création du mot de passe');
    } finally {
      setChargement(false);
    }
  };

  if (etape === 'verification') {
    return (
      <div className="login-page">
        <div className="login-right" style={{ margin: 'auto' }}>
          <div className="login-card" style={{ textAlign: 'center' }}>
            <div className="loading">Vérification de votre lien...</div>
          </div>
        </div>
      </div>
    );
  }

  if (erreur && etape !== 'formulaire') {
    return (
      <div className="login-page">
        <div className="login-right" style={{ margin: 'auto' }}>
          <div className="login-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏰</div>
            <h2>Lien expiré ou invalide</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>{erreur}</p>
            <button className="btn-primary" onClick={() => navigate('/login')}>
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (etape === 'success') {
    return (
      <div className="login-page">
        <div className="login-right" style={{ margin: 'auto' }}>
          <div className="login-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2>Compte activé avec succès !</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
              Votre compte a été activé. Vous pouvez maintenant vous connecter.
            </p>
            <button className="btn-primary" onClick={() => navigate('/login')}>
              Se connecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-right" style={{ margin: 'auto' }}>
        <div className="login-card">
          <h2 className="form-title">🔐 Créer votre mot de passe</h2>
          <p className="form-sub">
            Bienvenue <strong>{info?.nom}</strong> !<br />
            Créez votre mot de passe pour activer votre compte.
          </p>

          {erreur && <div className="alert-erreur">{erreur}</div>}

          <form onSubmit={creerMotDePasse}>
            <div className="form-group">
              <label>Nouveau mot de passe (min. 8 caractères)</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.motDePasse}
                onChange={e => setForm({ ...form, motDePasse: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirmer le mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.confirmMotDePasse}
                onChange={e => setForm({ ...form, confirmMotDePasse: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn-login" disabled={chargement}>
              {chargement ? 'Activation...' : 'Activer mon compte'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}