// src/pages/comptable/GestionComptes.jsx
// Gestion des comptes comptables (ComptabiliteController /api/comptabilite/comptes)
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

const TYPE_COMPTE = ['ACTIF', 'PASSIF', 'CHARGE', 'PRODUIT'];
const TYPE_COMPTE_LABELS = {
  ACTIF: 'Actif',
  PASSIF: 'Passif',
  CHARGE: 'Charge',
  PRODUIT: 'Produit',
};

export default function GestionComptes() {
  const { user } = useAuth();
  const universiteId = user?.universiteId;

  const [comptes, setComptes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    numero: '',
    libelle: '',
    typeCompte: 'ACTIF',
    universite: null,
  });

  useEffect(() => {
    if (universiteId) loadComptes();
  }, [universiteId]);

  const loadComptes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/comptabilite/comptes/${universiteId}`);
      setComptes(res.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des comptes');
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
        universite: { id: parseInt(universiteId) },
      };
      if (editingId) {
        await api.put(`/api/comptabilite/comptes/${editingId}`, payload);
        setMessage('✅ Compte modifié avec succès');
      } else {
        await api.post('/api/comptabilite/comptes', payload);
        setMessage('✅ Compte créé avec succès');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({
        numero: '', libelle: '', typeCompte: 'ACTIF', universite: null,
      });
      loadComptes();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleEdit = (c) => {
    setEditingId(c.id);
    setForm({
      numero: c.numero || '',
      libelle: c.libelle || '',
      typeCompte: c.typeCompte || 'ACTIF',
      universite: c.universite || null,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce compte ? Cette action est irréversible.')) return;
    try {
      await api.delete(`/api/comptabilite/comptes/${id}`);
      setMessage('✅ Compte supprimé');
      loadComptes();
    } catch (err) {
      setError('Erreur lors de la suppression');
    }
  };

  const filteredComptes = comptes.filter(c =>
    c.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.libelle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="page">
      <div className="loading">Chargement des comptes...</div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">💰 Gestion des Comptes</h1>
          <p className="page-sub">Plan comptable de l'université — comptes, catégories et types</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingId(null);
              setForm({ numero: '', libelle: '', typeCompte: 'ACTIF', universite: null });
            } else {
              setShowForm(true);
              setEditingId(null);
              setForm({ numero: '', libelle: '', typeCompte: 'ACTIF', universite: null });
            }
          }}
        >
          {showForm ? 'Annuler' : '➕ Nouveau compte'}
        </button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {/* Formulaire création/édition */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">{editingId ? 'Modifier le compte' : 'Nouveau compte'}</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Numéro du compte *</label>
              <input
                value={form.numero}
                onChange={e => setForm({ ...form, numero: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Libellé *</label>
              <input
                value={form.libelle}
                onChange={e => setForm({ ...form, libelle: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Type *</label>
              <select
                value={form.typeCompte}
                onChange={e => setForm({ ...form, typeCompte: e.target.value })}
                required
              >
                {TYPE_COMPTE.map(t => (
                  <option key={t} value={t}>{TYPE_COMPTE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn-outline" onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm({ numero: '', libelle: '', typeCompte: 'ACTIF', universite: null });
              }}>
                Annuler
              </button>
              <button type="submit" className="btn-primary">
                {editingId ? '💾 Enregistrer les modifications' : 'Créer le compte'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recherche */}
      <div className="card" style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="🔍 Rechercher par numéro ou libellé..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }}
        />
      </div>

      {/* Tableau des comptes */}
      <div className="card">
        <h2 className="card-title">
          Comptes ({filteredComptes.length})
        </h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Libellé</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredComptes.map(c => (
              <tr key={c.id}>
                <td className="uni-code">{c.numero}</td>
                <td>{c.libelle}</td>
                <td>
                  <span className="badge badge-neutral">{TYPE_COMPTE_LABELS[c.typeCompte] || c.typeCompte}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => handleEdit(c)}>
                      ✏️
                    </button>
                    <button className="btn-danger" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => handleDelete(c.id)}>
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredComptes.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>
                  Aucun compte trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
