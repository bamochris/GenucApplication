// src/pages/comptable/EcrituresComptables.jsx
// Gestion des écritures comptables (ComptabiliteController /api/comptabilite/ecritures)
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

const TYPE_ECRITURE = ['DEBIT', 'CREDIT'];

export default function EcrituresComptables() {
  const { user } = useAuth();
  const universiteId = user?.universiteId;

  const [ecritures, setEcritures] = useState([]);
  const [comptes, setComptes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    compteId: '',
    montant: '',
    typeMouvement: 'DEBIT',
    reference: '',
    description: '',
    dateEcriture: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (universiteId) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universiteId]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [ecrituresRes, comptesRes] = await Promise.all([
        api.get(`/api/comptabilite/ecritures/${universiteId}`).catch(() => ({ data: [] })),
        api.get(`/api/comptabilite/comptes/${universiteId}`).catch(() => ({ data: [] })),
      ]);
      setEcritures(ecrituresRes.data || []);
      setComptes(comptesRes.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des écritures');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/api/comptabilite/ecritures', {
        ...form,
        compte: { id: parseInt(form.compteId) },
        montant: parseFloat(form.montant),
        universite: { id: parseInt(universiteId) },
      });
      setMessage('✅ Écriture comptable enregistrée');
      setShowForm(false);
      setForm({
        compteId: '',
        montant: '',
        typeMouvement: 'DEBIT',
        reference: '',
        description: '',
        dateEcriture: new Date().toISOString().slice(0, 10),
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de l\'enregistrement');
    }
  };

  const filteredEcritures = ecritures.filter(e =>
    e.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.compte?.libelle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatAmount = (e) => {
    const isCredit = e.typeMouvement === 'CREDIT';
    return isCredit ? `+${e.montant}` : `-${e.montant}`;
  };

  const getTypeBadge = (type) => (
    type === 'CREDIT'
      ? <span className="badge badge-success">Crédit</span>
      : <span className="badge" style={{ background: '#E6F1FB', color: '#185FA5' }}>Débit</span>
  );

  if (loading) return (
    <div className="page">
      <div className="loading">Chargement des écritures...</div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📝 Écritures Comptables</h1>
          <p className="page-sub">
            Enregistrez et suivez toutes les écritures de la comptabilité générale
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Annuler' : '➕ Nouvelle écriture'}
        </button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {/* Formulaire nouvelle écriture */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">Nouvelle écriture</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Compte *</label>
              <select
                value={form.compteId}
                onChange={e => setForm({ ...form, compteId: e.target.value })}
                required
              >
                <option value="">-- Sélectionner un compte --</option>
                {comptes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.numero} — {c.libelle}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Montant (USD) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.montant}
                onChange={e => setForm({ ...form, montant: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Type *</label>
              <select
                value={form.typeMouvement}
                onChange={e => setForm({ ...form, typeMouvement: e.target.value })}
                required
              >
                {TYPE_ECRITURE.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                value={form.dateEcriture}
                onChange={e => setForm({ ...form, dateEcriture: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Référence</label>
              <input
                value={form.reference}
                onChange={e => setForm({ ...form, reference: e.target.value })}
                placeholder="ex: FACT-2025-001"
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows="2"
                placeholder="Description de l'écriture..."
              />
            </div>
            <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-primary">Enregistrer</button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setShowForm(false)}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recherche */}
      <div className="card" style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="🔍 Rechercher par référence, description ou compte..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }}
        />
      </div>

      {/* Tableau des écritures */}
      <div className="card">
        <h2 className="card-title">Écritures ({filteredEcritures.length})</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Compte</th>
              <th>Type</th>
              <th>Montant</th>
              <th>Référence</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {filteredEcritures.map(e => (
              <tr key={e.id}>
                <td>{e.dateEcriture ? new Date(e.dateEcriture).toLocaleDateString('fr-FR') : '-'}</td>
                <td>
                  <span className="uni-code">{e.compte?.numero}</span>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.compte?.libelle}</div>
                </td>
                <td>{getTypeBadge(e.typeMouvement)}</td>
                <td style={{ fontWeight: 600, color: e.typeMouvement === 'CREDIT' ? '#1D9E75' : '#cc0000' }}>
                  {formatAmount(e)}
                </td>
                <td>{e.reference || '-'}</td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{e.description || '-'}</td>
              </tr>
            ))}
            {filteredEcritures.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>
                  Aucune écriture trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
