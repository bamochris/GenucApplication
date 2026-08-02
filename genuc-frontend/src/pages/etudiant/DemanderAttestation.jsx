// src/pages/etudiant/DemanderAttestation.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

const TYPES_ATTESTATION = [
  { value: 'INSCRIPTION', label: '📋 Attestation d\'inscription' },
  { value: 'FREQUENTATION', label: '📋 Attestation de fréquentation' },
  { value: 'REUSSITE', label: '🏆 Attestation de réussite' },
  { value: 'SCOLARITE', label: '📋 Attestation de scolarité' },
  { value: 'BOURSE', label: '💰 Attestation de bourse' },
  { value: 'CONDUITE', label: '✅ Attestation de bonne conduite' },
  { value: 'PHYSIQUE', label: '🏥 Attestation d\'aptitude physique' },
];

export default function DemanderAttestation() {
  const { user } = useAuth();
  const [attestations, setAttestations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    type: 'INSCRIPTION',
    motif: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const payload = {
        inscriptionId: parseInt(inscriptionId),
        type: form.type,
        motif: form.motif,
        demandeurId: user.id,
        demandeurNom: user.nomComplet || user.email
      };

      await api.post('/api/attestations/demander', payload);
      setMessage('✅ Demande d\'attestation soumise avec succès !');
      setShowForm(false);
      setForm({ type: 'INSCRIPTION', motif: '' });
      loadAttestations();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la demande');
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

  const getStatutBadge = (statut) => {
    const map = {
      'EN_ATTENTE': 'badge-warning',
      'VALIDE': 'badge-success',
      'REJETE': 'badge-danger',
      'EMISE': 'badge-success'
    };
    return map[statut] || 'badge-neutral';
  };

  const getStatutLabel = (statut) => {
    const map = {
      'EN_ATTENTE': '⏳ En attente',
      'VALIDE': '✅ Validée',
      'REJETE': '❌ Rejetée',
      'EMISE': '📄 Émise'
    };
    return map[statut] || statut;
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📜 Mes attestations</h1>
          <p className="page-sub">Demandez et téléchargez vos attestations officielles</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '➕ Nouvelle demande'}
        </button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">Demander une attestation</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Type d'attestation *</label>
              <select
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value})}
                required
              >
                {TYPES_ATTESTATION.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Motif (optionnel)</label>
              <input
                type="text"
                value={form.motif}
                onChange={e => setForm({...form, motif: e.target.value})}
                placeholder="Ex: Pour bourse, pour stage, etc."
              />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>
              📤 Soumettre la demande
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">📋 Historique des attestations</h2>
        {attestations.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
            Aucune demande d'attestation.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Type</th>
                <th>Date demande</th>
                <th>Statut</th>
                <th>Date émission</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {attestations.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600, color: '#185FA5' }}>{a.numeroAttestation}</td>
                  <td>{a.type?.replace('_', ' ')}</td>
                  <td>{new Date(a.dateDemande).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <span className={`badge ${getStatutBadge(a.statut)}`}>
                      {getStatutLabel(a.statut)}
                    </span>
                  </td>
                  <td>{a.dateEmission ? new Date(a.dateEmission).toLocaleDateString('fr-FR') : '-'}</td>
                  <td>
                    {(a.statut === 'VALIDE' || a.statut === 'EMISE') && (
                      <button
                        className="btn-outline"
                        style={{ fontSize: 11, padding: '4px 10px' }}
                        onClick={() => telechargerPdf(a.id)}
                      >
                        📥 Télécharger
                      </button>
                    )}
                    {a.statut === 'REJETE' && a.motif && (
                      <span style={{ fontSize: 11, color: '#cc0000' }}>Motif: {a.motif}</span>
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
