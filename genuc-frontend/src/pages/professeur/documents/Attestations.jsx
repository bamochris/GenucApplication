// src/pages/professeur/documents/Attestations.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function Attestations() {
  const { user } = useAuth();
  const [attestations, setAttestations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    etudiantId: '',
    type: 'ASSIDUITE',
    motif: '',
    date: new Date().toISOString().slice(0, 10)
  });
  const [etudiants, setEtudiants] = useState([]);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadData = async () => {
    try {
      const [attRes, etuRes] = await Promise.all([
        // Module « attestations professeur » non implémenté côté backend : liste vide
        api.get(`/api/documents/attestations/${user.id}`).catch(() => ({ data: [] })),
        api.get(`/api/professeur/etudiants/disponibles/${user.id}`).catch(() => ({ data: [] }))
      ]);
      setAttestations(attRes.data || []);
      setEtudiants(etuRes.data || []);
    } catch (err) {
      console.error(err);
      setMessage('❌ Impossible de charger les attestations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.post('/api/documents/attestations', {
        ...form,
        professeurId: user.id,
        professeurNom: user.nomComplet
      });
      setMessage('✅ Attestation générée');
      setShowForm(false);
      setForm({ etudiantId: '', type: 'ASSIDUITE', motif: '', date: new Date().toISOString().slice(0, 10) });
      loadData();
    } catch (err) {
      setMessage('❌ Erreur lors de la génération');
    }
  };

  const telecharger = async (id) => {
    try {
      const response = await api.get(`/api/documents/attestations/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attestation_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setMessage('❌ Erreur lors du téléchargement');
    }
  };

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">📋 Attestations</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '➕ Générer une attestation'}
        </button>
      </div>

      {message && <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>{message}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Générer une attestation</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Étudiant *</label>
              <select value={form.etudiantId} onChange={e => setForm({...form, etudiantId: e.target.value})} required>
                <option value="">-- Sélectionner --</option>
                {etudiants.map(e => (
                  <option key={e.id} value={e.id}>{e.matricule} - {e.prenom} {e.nom}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Type *</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} required>
                <option value="ASSIDUITE">Attestation d'assiduité</option>
                <option value="REUSSITE">Attestation de réussite</option>
                <option value="CONDUITE">Attestation de bonne conduite</option>
                <option value="STAGE">Attestation de stage</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Motif / Description</label>
              <textarea value={form.motif} onChange={e => setForm({...form, motif: e.target.value})} rows="3" />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>Générer</button>
          </form>
        </div>
      )}

      <div className="card">
        {attestations.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucune attestation</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Étudiant</th>
                <th>Type</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {attestations.map(a => (
                <tr key={a.id}>
                  <td className="uni-code">{a.numero}</td>
                  <td>{a.etudiant}</td>
                  <td>{a.type}</td>
                  <td>{new Date(a.date).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <span className={`badge ${a.statut === 'GENERE' ? 'badge-success' : 'badge-warning'}`}>
                      {a.statut}
                    </span>
                  </td>
                  <td>
                    {a.statut === 'GENERE' && (
                      <button className="btn-outline" style={{ fontSize: 11 }} onClick={() => telecharger(a.id)}>
                        📥 PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}