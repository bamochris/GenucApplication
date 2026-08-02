// src/pages/comptable/GestionBudgets.jsx
// Gestion des budgets comptables (ComptabiliteController /api/comptabilite/budgets)
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function GestionBudgets() {
  const { user } = useAuth();
  const universiteId = user?.universiteId;

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    libelle: '',
    montantAlloue: '',
    annee: new Date().getFullYear(),
    description: '',
  });

  // Années académiques disponibles
  const currentYear = new Date().getFullYear();
  const annees = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    if (universiteId) loadBudgets();
  }, [universiteId]);

  const loadBudgets = async () => {
    setLoading(true);
    setError('');
    try {
      const annee = form.annee;
      const res = await api.get(`/api/comptabilite/budgets/${universiteId}/${annee}`);
      setBudgets(res.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des budgets');
      setBudgets([]);
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
        ...form,
        montantAlloue: parseFloat(form.montantAlloue),
        montantUtilise: 0,
        montantRestant: parseFloat(form.montantAlloue),
        universite: { id: parseInt(universiteId) },
      };
      if (editingId) {
        await api.put(`/api/comptabilite/budgets/${editingId}`, payload);
        setMessage('✅ Budget modifié avec succès');
      } else {
        await api.post('/api/comptabilite/budgets', payload);
        setMessage('✅ Budget créé avec succès');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ libelle: '', montantAlloue: '', annee: currentYear, description: '' });
      loadBudgets();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleEdit = (b) => {
    setEditingId(b.id);
    setForm({
      libelle: b.libelle || '',
      montantAlloue: b.montantAlloue || '',
      annee: b.annee || currentYear,
      description: b.description || '',
    });
    setShowForm(true);
  };

  const handleAnneeChange = (e) => {
    setForm({ ...form, annee: Number(e.target.value) });
  };

  // Recharger quand l'année change
  useEffect(() => {
    if (universiteId) loadBudgets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.annee]);

  const totalAlloue = budgets.reduce((sum, b) => sum + (Number(b.montantAlloue) || 0), 0);
  const totalUtilise = budgets.reduce((sum, b) => sum + (Number(b.montantUtilise) || 0), 0);
  const totalRestant = totalAlloue - totalUtilise;
  const tauxUtilisation = totalAlloue > 0 ? Math.round((totalUtilise / totalAlloue) * 100) : 0;

  if (loading) return (
    <div className="page">
      <div className="loading">Chargement des budgets...</div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Gestion des Budgets</h1>
          <p className="page-sub">
            Budgets alloués pour l'année académique {form.annee}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={form.annee}
            onChange={handleAnneeChange}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }}
          >
            {annees.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button
            className="btn-primary"
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setEditingId(null);
                setForm({ libelle: '', montantAlloue: '', annee: currentYear, description: '' });
              } else {
                setShowForm(true);
                setEditingId(null);
                setForm({ libelle: '', montantAlloue: '', annee: form.annee, description: '' });
              }
            }}
          >
            {showForm ? 'Annuler' : '➕ Nouveau budget'}
          </button>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {/* Formulaire */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">{editingId ? 'Modifier le budget' : 'Nouveau budget'}</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Libellé *</label>
              <input
                value={form.libelle}
                onChange={e => setForm({ ...form, libelle: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Montant alloué (USD) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.montantAlloue}
                onChange={e => setForm({ ...form, montantAlloue: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows="2"
              />
            </div>
            <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="submit" className="btn-primary">
                {editingId ? '💾 Enregistrer' : 'Créer le budget'}
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm({ libelle: '', montantAlloue: '', annee: form.annee, description: '' });
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Statistiques globales du budget */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E6F1FB' }}>💰</div>
          <div>
            <div className="stat-value">{totalAlloue.toLocaleString()}</div>
            <div className="stat-label">Total alloué (USD)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FAEEDA' }}>📈</div>
          <div>
            <div className="stat-value">{totalUtilise.toLocaleString()}</div>
            <div className="stat-label">Total utilisé (USD)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E1F5EE' }}>💚</div>
          <div>
            <div className="stat-value" style={{ color: '#1D9E75' }}>{totalRestant.toLocaleString()}</div>
            <div className="stat-label">Restant (USD)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FBEAF0' }}>📊</div>
          <div>
            <div className="stat-value" style={{ color: tauxUtilisation > 90 ? '#cc0000' : '#1D9E75' }}>
              {tauxUtilisation}%
            </div>
            <div className="stat-label">Taux d'utilisation</div>
          </div>
        </div>
      </div>

      {/* Tableau des budgets */}
      <div className="card">
        <h2 className="card-title">Budgets ({budgets.length})</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Libellé</th>
              <th>Alloué (USD)</th>
              <th>Utilisé (USD)</th>
              <th>Restant (USD)</th>
              <th>Taux</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map(b => {
              const alloue = Number(b.montantAlloue) || 0;
              const utilise = Number(b.montantUtilise) || 0;
              const restant = alloue - utilise;
              const taux = alloue > 0 ? Math.round((utilise / alloue) * 100) : 0;
              return (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.libelle}</td>
                  <td>{alloue.toLocaleString()}</td>
                  <td>{utilise.toLocaleString()}</td>
                  <td style={{ color: restant < 0 ? '#cc0000' : '#1D9E75' }}>
                    {restant.toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge ${taux > 90 ? 'badge-danger' : taux > 70 ? 'badge-warning' : 'badge-success'}`}>
                      {taux}%
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => handleEdit(b)}>
                        ✏️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {budgets.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>
                  Aucun budget pour l'année {form.annee}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
