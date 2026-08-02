// src/pages/etudiant/recours/RecoursAcademiques.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../EtudiantDashboard.css';

export default function RecoursAcademiques() {
  const { user } = useAuth();
  const [recours, setRecours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'ERREUR_NOTE',
    description: '',
    coursId: '',
    anneeAcademique: '',
    pieceJointe: null,
  });
  const [cours, setCours] = useState([]);

  const loadRecours = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/etudiant/${user.id}/recours`);
      setRecours(res.data || []);
    } catch (err) {
      setError('Erreur lors du chargement de vos recours');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const loadCours = useCallback(async () => {
    try {
      const res = await api.get(`/api/etudiant/${user.id}/cours`);
      setCours(res.data || []);
    } catch (err) {
      console.error('Erreur chargement cours', err);
    }
  }, [user.id]);

  useEffect(() => {
    loadRecours();
    loadCours();
  }, [loadRecours, loadCours]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!form.description || form.description.length < 10) {
      setError('La description doit contenir au moins 10 caractères.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('type', form.type);
      formData.append('description', form.description);
      if (form.coursId) formData.append('coursId', form.coursId);
      if (form.anneeAcademique) formData.append('anneeAcademique', form.anneeAcademique);
      if (form.pieceJointe) formData.append('pieceJointe', form.pieceJointe);

      await api.post(`/api/etudiant/${user.id}/recours`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage('✅ Recours soumis avec succès. Vous serez notifié du traitement.');
      setShowForm(false);
      setForm({ type: 'ERREUR_NOTE', description: '', coursId: '', anneeAcademique: '', pieceJointe: null });
      loadRecours();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la soumission du recours');
    }
  };

  const getTypeLabel = (type) => {
    const map = {
      'ERREUR_NOTE': 'Erreur de note',
      'ERREUR_MATRICULE': 'Erreur de matricule',
      'COURS_MANQUANT': 'Cours manquant',
      'CONTESTATION': 'Contestation générale',
      'AUTRE': 'Autre'
    };
    return map[type] || type;
  };

  const getStatutBadge = (statut) => {
    const map = {
      'SOUMIS': 'badge-warning',
      'EN_COURS': 'badge-info',
      'ACCEPTE': 'badge-success',
      'REFUSE': 'badge-danger'
    };
    return map[statut] || 'badge-neutral';
  };

  const getStatutLabel = (statut) => {
    const map = {
      'SOUMIS': '⏳ Soumis',
      'EN_COURS': '🔄 En cours',
      'ACCEPTE': '✅ Accepté',
      'REFUSE': '❌ Refusé'
    };
    return map[statut] || statut;
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📝 Recours Académiques</h1>
          <p className="page-sub">Contester une note ou signaler une erreur</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '➕ Nouveau recours'}
        </button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Soumettre un recours</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Type de recours *</label>
              <select 
                value={form.type} 
                onChange={e => setForm({...form, type: e.target.value})}
                required
              >
                <option value="ERREUR_NOTE">Erreur de note</option>
                <option value="ERREUR_MATRICULE">Erreur de matricule</option>
                <option value="COURS_MANQUANT">Cours manquant</option>
                <option value="CONTESTATION">Contestation générale</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <div className="form-group">
              <label>Cours concerné</label>
              <select 
                value={form.coursId} 
                onChange={e => setForm({...form, coursId: e.target.value})}
              >
                <option value="">-- Sélectionner --</option>
                {cours.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Description *</label>
              <textarea
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                rows="5"
                placeholder="Décrivez précisément l'erreur ou le motif de votre contestation..."
                required
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Pièce jointe (PDF, image)</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => setForm({...form, pieceJointe: e.target.files[0]})}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>
              📤 Soumettre le recours
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">📋 Mes recours soumis</h3>
        {recours.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
            Aucun recours soumis.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Cours</th>
                  <th>Statut</th>
                  <th>Réponse</th>
                </tr>
              </thead>
              <tbody>
                {recours.map(r => (
                  <tr key={r.id}>
                    <td>{new Date(r.dateSoumission).toLocaleDateString('fr-FR')}</td>
                    <td>{getTypeLabel(r.type)}</td>
                    <td>{r.cours?.nom || '-'}</td>
                    <td>
                      <span className={`badge ${getStatutBadge(r.statut)}`}>
                        {getStatutLabel(r.statut)}
                      </span>
                    </td>
                    <td style={{ maxWidth: 200, fontSize: 13 }}>
                      {r.reponse || '-'}
                      {r.dateReponse && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          le {new Date(r.dateReponse).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}