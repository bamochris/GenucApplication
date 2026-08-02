// src/pages/professeur/parametres/Parametres.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function Parametres() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    email: '',
    telephone: '',
    notifications: true,
    rappels: true
  });

  useEffect(() => {
    setForm({
      email: user?.email || '',
      telephone: user?.telephone || '',
      notifications: true,
      rappels: true
    });
    setLoading(false);
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.put(`/api/professeur/parametres/${user.id}`, form);
      setMessage('✅ Paramètres mis à jour');
    } catch (err) {
      setMessage('❌ Erreur lors de la mise à jour');
    }
  };

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">⚙️ Paramètres</h2>
      </div>

      {message && <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>{message}</div>}

      <div className="dash-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <h3 className="card-title">Informations personnelles</h3>
          <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: 16 }}>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Téléphone</label>
              <input type="tel" value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>💾 Enregistrer</button>
          </form>
        </div>

        <div className="card">
          <h3 className="card-title">Notifications</h3>
          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.notifications}
                onChange={e => setForm({...form, notifications: e.target.checked})}
              />
              Activer les notifications
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.rappels}
                onChange={e => setForm({...form, rappels: e.target.checked})}
              />
              Recevoir des rappels
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}