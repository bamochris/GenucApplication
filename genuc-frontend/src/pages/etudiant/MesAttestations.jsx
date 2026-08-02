// src/pages/etudiant/MesAttestations.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function MesAttestations() {
  const { user } = useAuth();
  const [attestations, setAttestations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'INSCRIPTION',
    intitule: '',
    description: ''
  });

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    if (inscriptionId) loadAttestations();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId]);

  const loadAttestations = async () => {
    try {
      const res = await api.get(`/api/attestations/etudiant/${inscriptionId}`);
      setAttestations(res.data);
    } catch (err) {
      setError('Erreur chargement des attestations');
    } finally {
      setLoading(false);
    }
  };

  const genererAttestation = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/attestations/demander', {
        type: form.type,
        motif: form.description,
        inscriptionId: parseInt(inscriptionId),
        demandeurId: user.id,
        demandeurNom: user.nomComplet || user.email
      });
      setShowForm(false);
      setForm({ type: 'INSCRIPTION', intitule: '', description: '' });
      loadAttestations();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la génération');
    }
  };

  const telechargerPdf = async (id) => {
    try {
      const response = await api.get(`/api/attestations/${id}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attestation_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erreur lors du téléchargement');
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📜 Mes attestations</h1>
          <p className="page-sub">Téléchargez vos attestations officielles</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '➕ Nouvelle attestation'}
        </button>
      </div>

      {error && <div className="alert-erreur">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">Demander une attestation</h2>
          <form onSubmit={genererAttestation} className="form-grid">
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="INSCRIPTION">Attestation d'inscription</option>
                <option value="FREQUENTATION">Attestation de fréquentation</option>
                <option value="SCOLARITE">Attestation de scolarité</option>
                <option value="REUSSITE">Attestation de réussite</option>
                <option value="STAGE">Attestation de stage</option>
                <option value="BOURSE">Attestation de bourse</option>
              </select>
            </div>
            <div className="form-group">
              <label>Intitulé</label>
              <input
                value={form.intitule}
                onChange={e => setForm({...form, intitule: e.target.value})}
                placeholder="Ex: Attestation d'inscription"
                required
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Description (optionnelle)</label>
              <textarea
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                rows="3"
                placeholder="Précisions supplémentaires..."
              />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>
              📜 Générer l'attestation
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">📋 Liste des attestations</h2>
        {attestations.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
            Aucune attestation disponible.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Type</th>
                <th>Intitulé</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {attestations.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600, color: '#185FA5' }}>{a.numeroAttestation}</td>
                  <td>{a.type}</td>
                  <td>{a.intitule}</td>
                  <td>{new Date(a.dateDelivrance).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <span className={`badge ${a.valide ? 'badge-success' : 'badge-warning'}`}>
                      {a.valide ? 'Validée' : 'En attente'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-primary" style={{ fontSize: 11 }} onClick={() => telechargerPdf(a.id)}>
                      📥 PDF
                    </button>
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
