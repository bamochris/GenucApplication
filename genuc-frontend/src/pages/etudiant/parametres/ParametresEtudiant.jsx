// src/pages/etudiant/parametres/ParametresEtudiant.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../EtudiantDashboard.css';

export default function ParametresEtudiant() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [supprimerModal, setSupprimerModal] = useState(false);
  const [error, setError] = useState(null);
  const [onglet, setOnglet] = useState('profil');
  const [nouvelEmail, setNouvelEmail] = useState('');
  const [form, setForm] = useState({
    email: '',
    telephone: '',
    adresse: '',
    notifications: true,
    rappels: true,
    newsletter: false,
    langue: 'fr'
  });
  const [passwordForm, setPasswordForm] = useState({
    ancienMotDePasse: '',
    nouveauMotDePasse: '',
    confirmationMotDePasse: ''
  });

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email || '',
        telephone: user.telephone || '',
        adresse: user.adresse || '',
        notifications: true,
        rappels: true,
        newsletter: false,
        langue: 'fr'
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
  };

  const handleSubmitProfil = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError(null);

    try {
      await api.put(`/api/etudiant/portal/profil/${inscriptionId}`, {
        email: form.email,
        telephone: form.telephone,
        adresse: form.adresse
      });
      setMessage('✅ Profil mis à jour avec succès');
      // Mettre à jour le contexte utilisateur
      if (user) {
        user.email = form.email;
        user.telephone = form.telephone;
        user.adresse = form.adresse;
      }
    } catch (err) {
      setError(err.response?.data?.erreur || '❌ Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError(null);

    if (passwordForm.nouveauMotDePasse !== passwordForm.confirmationMotDePasse) {
      setError('❌ Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (passwordForm.nouveauMotDePasse.length < 8) {
      setError('❌ Le mot de passe doit contenir au moins 8 caractères');
      setLoading(false);
      return;
    }

    try {
      await api.post('/api/auth/changer-mot-de-passe', {
        ancienMotDePasse: passwordForm.ancienMotDePasse,
        nouveauMotDePasse: passwordForm.nouveauMotDePasse
      });
      setMessage('✅ Mot de passe changé avec succès');
      setPasswordForm({
        ancienMotDePasse: '',
        nouveauMotDePasse: '',
        confirmationMotDePasse: ''
      });
    } catch (err) {
      setError(err.response?.data?.erreur || '❌ Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitNotifications = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError(null);

    try {
      await api.put(`/api/etudiant/portal/${inscriptionId}/preferences`, {
        notifications: form.notifications,
        rappels: form.rappels,
        newsletter: form.newsletter,
        langue: form.langue
      });
      setMessage('✅ Préférences mises à jour avec succès');
    } catch (err) {
      setError(err.response?.data?.erreur || '❌ Erreur lors de la mise à jour des préférences');
    } finally {
      setLoading(false);
    }
  };

  const handleSupprimerCompte = () => setSupprimerModal(true);

  const confirmerSuppression = async () => {
    setSupprimerModal(false);
    setLoading(true);
    try {
      await api.delete(`/api/etudiant/portal/${inscriptionId}/compte`);
      logout();
    } catch (err) {
      setError(err.response?.data?.erreur || '❌ Erreur lors de la suppression du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="etudiant-dashboard">
      <div className="section-header">
        <h2 className="section-title">⚙️ Paramètres</h2>
      </div>

      {message && (
        <div className="alert-success" onClick={() => setMessage('')}>{message}</div>
      )}
      {error && (
        <div className="alert-erreur" onClick={() => setError(null)}>{error}</div>
      )}

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          className={onglet === 'profil' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setOnglet('profil')}
        >
          👤 Profil
        </button>
        <button
          className={onglet === 'securite' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setOnglet('securite')}
        >
          🔒 Sécurité
        </button>
        <button
          className={onglet === 'notifications' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setOnglet('notifications')}
        >
          🔔 Notifications
        </button>
        <button
          className={onglet === 'compte' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setOnglet('compte')}
        >
          🗑️ Compte
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className="card">
        {/* Onglet Profil */}
        {onglet === 'profil' && (
          <div>
            <h3 className="card-title">👤 Informations personnelles</h3>
            <form onSubmit={handleSubmitProfil} className="form-grid" style={{ marginTop: 16 }}>
              <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                <label>Téléphone</label>
                <input
                  type="tel"
                  name="telephone"
                  value={form.telephone}
                  onChange={handleChange}
                  placeholder="+243 ..."
                  disabled={loading}
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                <label>Adresse</label>
                <input
                  type="text"
                  name="adresse"
                  value={form.adresse}
                  onChange={handleChange}
                  placeholder="Votre adresse complète"
                  disabled={loading}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }} disabled={loading}>
                {loading ? '⏳ Sauvegarde...' : '💾 Mettre à jour le profil'}
              </button>
            </form>
          </div>
        )}

        {/* Onglet Sécurité */}
        {onglet === 'securite' && (
          <div>
            <h3 className="card-title">🔒 Changer le mot de passe</h3>
            <form onSubmit={handleSubmitPassword} className="form-grid" style={{ marginTop: 16 }}>
              <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                <label>Ancien mot de passe *</label>
                <input
                  type="password"
                  name="ancienMotDePasse"
                  value={passwordForm.ancienMotDePasse}
                  onChange={handlePasswordChange}
                  required
                  disabled={loading}
                  placeholder="••••••••"
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                <label>Nouveau mot de passe *</label>
                <input
                  type="password"
                  name="nouveauMotDePasse"
                  value={passwordForm.nouveauMotDePasse}
                  onChange={handlePasswordChange}
                  required
                  disabled={loading}
                  placeholder="•••••••• (min 6 caractères)"
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                <label>Confirmer le nouveau mot de passe *</label>
                <input
                  type="password"
                  name="confirmationMotDePasse"
                  value={passwordForm.confirmationMotDePasse}
                  onChange={handlePasswordChange}
                  required
                  disabled={loading}
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }} disabled={loading}>
                {loading ? '⏳ Changement...' : '🔑 Changer le mot de passe'}
              </button>
            </form>

            <hr style={{ margin: '28px 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

            <h3 className="card-title">📧 Mon adresse email</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '6px 0 14px' }}>
              Si vous vous connectez avec votre matricule, ajoutez ici une adresse email :
              elle servira pour les communications de l'université et pour récupérer votre
              mot de passe en cas d'oubli. Vous pourrez aussi vous connecter avec.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setMessage(''); setError('');
                try {
                  const res = await api.post('/api/auth/ajouter-email', { email: nouvelEmail });
                  setMessage(res.data?.message || 'Adresse email enregistrée.');
                  setNouvelEmail('');
                } catch (err) {
                  setError(err.response?.data?.erreur || "Impossible d'enregistrer cette adresse.");
                }
              }}
              style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}
            >
              <div className="form-group" style={{ flex: 1, minWidth: 240, marginBottom: 0 }}>
                <label>Nouvelle adresse email</label>
                <input
                  type="email"
                  value={nouvelEmail}
                  onChange={(e) => setNouvelEmail(e.target.value)}
                  placeholder="prenom.nom@exemple.cd"
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={!nouvelEmail}>
                💾 Enregistrer
              </button>
            </form>
          </div>
        )}

        {/* Onglet Notifications */}
        {onglet === 'notifications' && (
          <div>
            <h3 className="card-title">🔔 Préférences de notifications</h3>
            <form onSubmit={handleSubmitNotifications} style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="notifications"
                    checked={form.notifications}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span>Activer les notifications</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="rappels"
                    checked={form.rappels}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span>Recevoir des rappels (examens, paiements, etc.)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="newsletter"
                    checked={form.newsletter}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span>Recevoir la newsletter universitaire</span>
                </label>
                <div className="form-group" style={{ maxWidth: 200 }}>
                  <label>Langue</label>
                  <select
                    name="langue"
                    value={form.langue}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="ln">Lingala</option>
                    <option value="sw">Swahili</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: 16 }} disabled={loading}>
                {loading ? '⏳ Sauvegarde...' : '💾 Mettre à jour les préférences'}
              </button>
            </form>
          </div>
        )}

        {/* Onglet Compte */}
        {onglet === 'compte' && (
          <div>
            <h3 className="card-title">🗑️ Gestion du compte</h3>
            <div style={{ marginTop: 16 }}>
              <div className="alert-erreur" style={{ marginBottom: 16 }}>
                <strong>⚠️ Suppression du compte</strong>
                <p style={{ marginTop: 8, fontSize: 13 }}>
                  La suppression de votre compte est irréversible. Toutes vos données personnelles,
                  inscriptions, paiements et historiques seront définitivement effacés.
                </p>
              </div>
              <button
                className="btn-danger"
                onClick={handleSupprimerCompte}
                disabled={loading}
              >
                {loading ? '⏳ Suppression...' : '🗑️ Supprimer mon compte'}
              </button>
            </div>

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: 14 }}>📊 Informations</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8, fontSize: 13 }}>
                <div><span style={{ color: 'var(--text-muted)' }}>ID Utilisateur :</span> {user?.id || '-'}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Rôle :</span> {user?.role || '-'}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Université ID :</span> {user?.universiteId || '-'}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Compte actif :</span> {user?.actif ? '✅ Oui' : '❌ Non'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {supprimerModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 420, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#cc0000' }}>⚠️ Supprimer votre compte</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
              Êtes-vous sûr de vouloir supprimer définitivement votre compte ?
            </p>
            <p style={{ color: '#cc0000', fontSize: 13, marginBottom: 18 }}>
              Toutes vos données (inscriptions, paiements, historiques) seront irrémédiablement effacées.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setSupprimerModal(false)}>Annuler</button>
              <button className="btn-danger" onClick={confirmerSuppression}>Oui, supprimer mon compte</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
