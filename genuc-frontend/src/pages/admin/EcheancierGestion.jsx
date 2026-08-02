// src/pages/admin/EcheancierGestion.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function EcheancierGestion() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inscriptions, setInscriptions] = useState([]);
  const [selectedInscription, setSelectedInscription] = useState('');
  const [echeanciers, setEcheanciers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    libelle: '',
    montantTotal: '',
    nombreEcheances: 3,
    description: ''
  });

  const universiteId = user?.universiteId;
  const [annulerModal, setAnnulerModal] = useState({ open: false, id: null });

  useEffect(() => {
    if (universiteId) loadInscriptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [universiteId]);

  const loadInscriptions = async () => {
    try {
      const res = await api.get(`/api/inscriptions/universite/${universiteId}`);
      setInscriptions(res.data);
    } catch (err) {
      setError("Erreur chargement des inscriptions");
    }
  };

  const loadEcheanciers = async (inscriptionId) => {
    if (!inscriptionId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/echeanciers/inscription/${inscriptionId}`);
      setEcheanciers(res.data);
    } catch (err) {
      setError("Erreur chargement des échéanciers");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInscription = (e) => {
    const id = e.target.value;
    setSelectedInscription(id);
    if (id) loadEcheanciers(id);
    else setEcheanciers([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const payload = {
      inscriptionId: parseInt(selectedInscription),
      libelle: form.libelle,
      montantTotal: parseFloat(form.montantTotal),
      nombreEcheances: parseInt(form.nombreEcheances),
      description: form.description
    };

    try {
      await api.post('/api/echeanciers', payload);
      setMessage('Échéancier créé avec succès');
      setShowForm(false);
      setForm({ libelle: '', montantTotal: '', nombreEcheances: 3, description: '' });
      loadEcheanciers(selectedInscription);
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la création');
    }
  };

  const handleGenererAuto = async () => {
    if (!selectedInscription) return;
    setError('');
    setMessage('');
    try {
      await api.post('/api/echeanciers/generer-auto', {
        inscriptionId: parseInt(selectedInscription),
        universiteId: parseInt(universiteId)
      });
      setMessage('Échéancier automatique généré avec succès');
      loadEcheanciers(selectedInscription);
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la génération');
    }
  };

  const handleAnnuler = (id) => setAnnulerModal({ open: true, id });

  const confirmerAnnuler = async () => {
    const id = annulerModal.id;
    setAnnulerModal({ open: false, id: null });
    try {
      await api.patch(`/api/echeanciers/${id}/annuler`);
      setMessage('Échéancier annulé');
      loadEcheanciers(selectedInscription);
    } catch (err) {
      setError('Erreur');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Gestion des échéanciers</h1>
          <p className="page-sub">Créez et gérez les plans de paiement par tranches</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '➕ Nouvel échéancier'}
          </button>
          <button className="btn-outline" onClick={handleGenererAuto}>
            ⚡ Générer automatique
          </button>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-group">
          <label>Sélectionner une inscription</label>
          <select value={selectedInscription} onChange={handleSelectInscription}>
            <option value="">-- Choisir une inscription --</option>
            {inscriptions.map(ins => (
              <option key={ins.id} value={ins.id}>
                {ins.matricule} - {ins.prenom} {ins.nom} ({ins.filiere?.nom})
              </option>
            ))}
          </select>
        </div>
      </div>

      {showForm && selectedInscription && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">Créer un échéancier</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Libellé *</label>
              <input
                value={form.libelle}
                onChange={e => setForm({...form, libelle: e.target.value})}
                required
                placeholder="Ex: Minerval 2024-2025"
              />
            </div>
            <div className="form-group">
              <label>Montant total (USD) *</label>
              <input
                type="number"
                step="0.01"
                value={form.montantTotal}
                onChange={e => setForm({...form, montantTotal: e.target.value})}
                required
                placeholder="Ex: 450.00"
              />
            </div>
            <div className="form-group">
              <label>Nombre d'échéances *</label>
              <select
                value={form.nombreEcheances}
                onChange={e => setForm({...form, nombreEcheances: parseInt(e.target.value)})}
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                rows="2"
                placeholder="Détails supplémentaires..."
              />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>
              Créer l'échéancier
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">Échéanciers existants</h2>
        {!selectedInscription ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
            Sélectionnez une inscription pour voir ses échéanciers.
          </p>
        ) : loading ? (
          <div className="loading">Chargement...</div>
        ) : echeanciers.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
            Aucun échéancier pour cette inscription.
          </p>
        ) : (
          echeanciers.map(ech => {
            const payees = ech.echeances?.filter(e => e.statut === 'PAYEE').length || 0;
            const total = ech.echeances?.length || 0;
            const progress = total > 0 ? Math.round((payees / total) * 100) : 0;

            return (
              <div key={ech.id} className="card" style={{ marginBottom: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{ech.libelle}</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {ech.description} • {ech.nombreEcheances} tranches • {ech.montantTotal} USD
                    </div>
                  </div>
                  <span className={`badge ${ech.statut === 'ACTIF' ? 'badge-success' : 'badge-neutral'}`}>
                    {ech.statut}
                  </span>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span>Progression</span>
                    <span>{payees}/{total} payées ({progress}%)</span>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${progress}%`,
                      background: progress === 100 ? '#1D9E75' : '#185FA5',
                      height: '100%',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button className="btn-outline" style={{ fontSize: 11 }} onClick={() => navigate(`/admin/echeancier/${ech.id}`)}>
                    📋 Détails
                  </button>
                  {ech.statut === 'ACTIF' && (
                    <button className="btn-danger" style={{ fontSize: 11 }} onClick={() => handleAnnuler(ech.id)}>
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {annulerModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 380, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>Annuler l'échéancier</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>Annuler cet échéancier ? Les paiements restants ne seront plus requis.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setAnnulerModal({ open: false, id: null })}>Annuler</button>
              <button className="btn-danger" onClick={confirmerAnnuler}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}