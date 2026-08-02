// src/pages/finances/admin/CategoriesFrais.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../FinanceDashboard.css'; // <- corrigé

export default function CategoriesFrais() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteCatModal, setDeleteCatModal] = useState({ open: false, id: null });
  const [form, setForm] = useState({
    code: '',
    designation: '',
    description: '',
    actif: true
  });

  const universiteId = user?.universiteId;

  useEffect(() => {
    if (universiteId) {
      loadCategories();
    } else {
      setLoading(false);
      setError('Aucune université associée');
    }
  }, [universiteId]);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/admin/frais/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
      setError('Impossible de charger les catégories');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError(null);
    setLoading(true);

    if (form.code.length < 2) {
      setError('Le code doit contenir au moins 2 caractères');
      setLoading(false);
      return;
    }
    if (form.designation.length < 3) {
      setError('La désignation doit contenir au moins 3 caractères');
      setLoading(false);
      return;
    }

    try {
      if (editingId) {
        await api.put(`/api/admin/frais/categories/${editingId}`, form);
        setMessage('✅ Catégorie modifiée avec succès');
      } else {
        await api.post('/api/admin/frais/categories', form);
        setMessage('✅ Catégorie créée avec succès');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ code: '', designation: '', description: '', actif: true });
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.erreur || '❌ Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setForm({
      code: cat.code,
      designation: cat.designation,
      description: cat.description || '',
      actif: cat.actif
    });
    setShowForm(true);
  };

  const handleDelete = (id) => setDeleteCatModal({ open: true, id });

  const confirmerDeleteCat = async () => {
    const id = deleteCatModal.id;
    setDeleteCatModal({ open: false, id: null });
    setLoading(true);
    try {
      await api.patch(`/api/admin/frais/categories/${id}/desactiver`);
      setMessage('✅ Catégorie désactivée');
      loadCategories();
    } catch (err) {
      setError('❌ Erreur lors de la désactivation');
    } finally {
      setLoading(false);
    }
  };

  const annulerFormulaire = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ code: '', designation: '', description: '', actif: true });
  };

  if (loading && categories.length === 0) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement des catégories...</p>
      </div>
    );
  }

  return (
    <div className="finance-dashboard">
      <div className="section-header">
        <h2 className="section-title">📂 Catégories de frais</h2>
        <button className="btn-primary" onClick={() => {
          setShowForm(!showForm);
          setEditingId(null);
          if (!showForm) setForm({ code: '', designation: '', description: '', actif: true });
        }}>
          {showForm ? 'Annuler' : '➕ Nouvelle catégorie'}
        </button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError(null)}>{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">{editingId ? 'Modifier' : 'Ajouter'} une catégorie</h3>
          <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label>Code * (min 2 caractères)</label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                required
                minLength={2}
                placeholder="Ex: FA001"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Désignation * (min 3 caractères)</label>
              <input
                type="text"
                name="designation"
                value={form.designation}
                onChange={handleChange}
                required
                minLength={3}
                placeholder="Ex: Frais académiques"
                disabled={loading}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="2"
                placeholder="Description de la catégorie..."
                disabled={loading}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="actif"
                  checked={form.actif}
                  onChange={handleChange}
                  disabled={loading}
                />
                Active
              </label>
            </div>
            <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10 }}>
              <button type="button" className="btn-outline" onClick={annulerFormulaire} disabled={loading}>Annuler</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? '⏳ Enregistrement...' : (editingId ? '💾 Modifier' : '💾 Enregistrer')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">Liste des catégories</h3>
        {categories.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucune catégorie enregistrée</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Désignation</th>
                <th>Description</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td className="uni-code">{cat.code}</td>
                  <td>{cat.designation}</td>
                  <td>{cat.description || '-'}</td>
                  <td>
                    <span className={`badge ${cat.actif ? 'badge-success' : 'badge-danger'}`}>
                      {cat.actif ? '✅ Actif' : '❌ Inactif'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn-outline"
                        style={{ fontSize: 11, padding: '4px 10px' }}
                        onClick={() => handleEdit(cat)}
                        disabled={loading}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-danger"
                        style={{ fontSize: 11, padding: '4px 10px' }}
                        onClick={() => handleDelete(cat.id)}
                        disabled={loading}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteCatModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 380, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>🗑️ Désactiver la catégorie</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>Désactiver cette catégorie de frais ?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setDeleteCatModal({ open: false, id: null })}>Annuler</button>
              <button className="btn-danger" onClick={confirmerDeleteCat}>Désactiver</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}