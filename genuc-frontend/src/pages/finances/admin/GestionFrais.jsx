// src/pages/finances/admin/GestionFrais.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../FinanceDashboard.css'; 

export default function GestionFrais() {
  const { user } = useAuth();
  const [frais, setFrais] = useState([]);
  const [categories, setCategories] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [fraisModal, setFraisModal] = useState({ open: false, id: null, type: null });
  const [filterAnnee, setFilterAnnee] = useState('');
  const [annees, setAnnees] = useState([]);
  const [form, setForm] = useState({
    code: '',
    libelle: '',
    montant: '',
    devise: 'USD',
    categorieId: '',
    anneeAcademique: '',
    promotionId: '',
    faculteId: '',
    dateLimite: '',
    description: '',
    type: 'ACADEMIQUE',
    statut: 'ACTIF'
  });

  const getCurrentYear = () => {
    const year = new Date().getFullYear();
    return `${year}-${year + 1}`;
  };

  useEffect(() => {
    if (user && user.universiteId) {
      loadData();
    } else {
      setLoading(false);
      setError('Aucune université associée à cet utilisateur');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fraisRes, categoriesRes, promotionsRes] = await Promise.all([
        api.get('/api/admin/frais'),
        api.get('/api/admin/frais/categories'),
        api.get(`/api/promotions/universite/${user.universiteId}`)
      ]);
      setFrais(fraisRes.data || []);
      setCategories(categoriesRes.data || []);
      setPromotions(promotionsRes.data || []);
      
      const years = [...new Set(fraisRes.data.map(f => f.anneeAcademique).filter(Boolean))];
      setAnnees(years);
      if (years.length > 0 && !filterAnnee) {
        setFilterAnnee(years[0]);
      }
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const resetForm = () => {
    setForm({
      code: '',
      libelle: '',
      montant: '',
      devise: 'USD',
      categorieId: '',
      anneeAcademique: getCurrentYear(),
      promotionId: '',
      faculteId: '',
      dateLimite: '',
      description: '',
      type: 'ACADEMIQUE',
      statut: 'ACTIF'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!form.promotionId) {
      setError('Veuillez sélectionner une promotion');
      return;
    }

    try {
      // PAYLOAD CORRIGÉ : IDs plats au lieu d'objets imbriqués
      const payload = {
        code: form.code,
        libelle: form.libelle,
        montant: parseFloat(form.montant),
        devise: form.devise,
        categorieId: parseInt(form.categorieId),
        anneeAcademique: form.anneeAcademique,
        promotionId: parseInt(form.promotionId),
        faculteId: form.faculteId ? parseInt(form.faculteId) : null,
        dateLimite: form.dateLimite || null,
        description: form.description,
        type: form.type,
        statut: form.statut,
        universiteId: user.universiteId
      };

      if (editingId) {
        await api.put(`/api/admin/frais/${editingId}`, payload);
        setMessage('✅ Frais modifié avec succès');
      } else {
        await api.post('/api/admin/frais', payload);
        setMessage('✅ Frais créé et affecté avec succès');
      }
      resetForm();
      loadData();
    } catch (err) {
      console.error('Erreur détaillée:', err.response?.data);
      setError(err.response?.data?.erreur || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleEdit = (f) => {
    setForm({
      code: f.code,
      libelle: f.libelle,
      montant: f.montant,
      devise: f.devise || 'USD',
      categorieId: f.categorie?.id || '',
      anneeAcademique: f.anneeAcademique || getCurrentYear(),
      promotionId: f.promotionId || '',
      faculteId: f.faculteId || '',
      dateLimite: f.dateLimite || '',
      description: f.description || '',
      type: f.type || 'ACADEMIQUE',
      statut: f.statut || 'ACTIF'
    });
    setEditingId(f.id);
    setShowForm(true);
  };

  const handleDesactiver = (id) => setFraisModal({ open: true, id, type: 'desactiver' });
  const handleArchiver = (id) => setFraisModal({ open: true, id, type: 'archiver' });

  const confirmerFraisAction = async () => {
    const { id, type } = fraisModal;
    setFraisModal({ open: false, id: null, type: null });
    try {
      if (type === 'desactiver') {
        await api.patch(`/api/admin/frais/${id}/desactiver`);
        setMessage('✅ Frais désactivé');
      } else {
        await api.patch(`/api/admin/frais/${id}/archiver`);
        setMessage('✅ Frais archivé');
      }
      loadData();
    } catch (err) {
      setError(type === 'desactiver' ? 'Erreur lors de la désactivation' : 'Erreur lors de l\'archivage');
    }
  };

  const handleReaffecter = async (id) => {
    try {
      await api.patch(`/api/admin/frais/${id}/reaffecter`);
      setMessage('✅ Réaffectation effectuée');
      loadData();
    } catch (err) {
      setError('Erreur lors de la réaffectation');
    }
  };

  const getTypeLabel = (type) => {
    const map = {
      'ACADEMIQUE': 'Académique',
      'INSCRIPTION': 'Inscription',
      'LABORATOIRE': 'Laboratoire',
      'BIBLIOTHEQUE': 'Bibliothèque',
      'STAGE': 'Stage',
      'SOUTENANCE': 'Soutenance',
      'CARTE_ETUDIANT': 'Carte étudiant',
      'SESSION_SPECIALE': 'Session spéciale',
      'AUTRE': 'Autre'
    };
    return map[type] || type;
  };

  const getPromotionLibelle = (id) => {
    const promo = promotions.find(p => p.id === id);
    return promo ? promo.libelle : '—';
  };

  const filteredFrais = filterAnnee 
    ? frais.filter(f => f.anneeAcademique === filterAnnee)
    : frais;

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement des frais...</p>
      </div>
    );
  }

  return (
    <div className="finance-dashboard">
      <div className="section-header">
        <h2 className="section-title">💰 Gestion des frais</h2>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? 'Annuler' : '➕ Nouveau frais'}
        </button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">{editingId ? 'Modifier' : 'Ajouter'} un frais</h3>
          <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label>Code *</label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="Ex: FA-2025-001"
                required
              />
            </div>
            <div className="form-group">
              <label>Libellé *</label>
              <input
                type="text"
                name="libelle"
                value={form.libelle}
                onChange={handleChange}
                placeholder="Ex: Frais de laboratoire"
                required
              />
            </div>
            <div className="form-group">
              <label>Montant *</label>
              <input
                type="number"
                step="0.01"
                name="montant"
                value={form.montant}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>
            <div className="form-group">
              <label>Devise</label>
              <select name="devise" value={form.devise} onChange={handleChange}>
                <option value="USD">USD</option>
                <option value="CDF">CDF</option>
              </select>
            </div>
            <div className="form-group">
              <label>Catégorie *</label>
              <select name="categorieId" value={form.categorieId} onChange={handleChange} required>
                <option value="">-- Sélectionner --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.designation}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Type</label>
              <select name="type" value={form.type} onChange={handleChange}>
                <option value="ACADEMIQUE">Académique</option>
                <option value="INSCRIPTION">Inscription</option>
                <option value="LABORATOIRE">Laboratoire</option>
                <option value="BIBLIOTHEQUE">Bibliothèque</option>
                <option value="STAGE">Stage</option>
                <option value="SOUTENANCE">Soutenance</option>
                <option value="CARTE_ETUDIANT">Carte étudiant</option>
                <option value="SESSION_SPECIALE">Session spéciale</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <div className="form-group">
              <label>Année académique *</label>
              <select name="anneeAcademique" value={form.anneeAcademique} onChange={handleChange} required>
                <option value="">-- Sélectionner --</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
              </select>
            </div>
            <div className="form-group">
              <label>Promotion *</label>
              <select name="promotionId" value={form.promotionId} onChange={handleChange} required>
                <option value="">-- Sélectionner --</option>
                {promotions.map(p => (
                  <option key={p.id} value={p.id}>{p.libelle} - {p.filiere?.nom || ''}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date limite</label>
              <input
                type="date"
                name="dateLimite"
                value={form.dateLimite}
                onChange={handleChange}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="2"
                placeholder="Description du frais..."
              />
            </div>
            <div className="form-group">
              <label>Statut</label>
              <select name="statut" value={form.statut} onChange={handleChange}>
                <option value="ACTIF">Actif</option>
                <option value="INACTIF">Inactif</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10 }}>
              <button type="button" className="btn-outline" onClick={resetForm}>Annuler</button>
              <button type="submit" className="btn-primary">
                {editingId ? '💾 Modifier' : '💾 Créer et affecter'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 600 }}>Filtrer par année :</label>
          <select
            value={filterAnnee}
            onChange={e => setFilterAnnee(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          >
            <option value="">Toutes</option>
            {annees.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button className="btn-outline" onClick={() => setFilterAnnee('')}>Réinitialiser</button>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
            {filteredFrais.length} frais
          </span>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Libellé</th>
                <th>Montant</th>
                <th>Promotion</th>
                <th>Année</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFrais.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>Aucun frais</td></tr>
              ) : (
                filteredFrais.map(f => (
                  <tr key={f.id}>
                    <td><span className="badge badge-neutral">{f.code}</span></td>
                    <td style={{ fontWeight: 600 }}>{f.libelle}</td>
                    <td>{f.montant} {f.devise}</td>
                    <td>{getPromotionLibelle(f.promotionId)}</td>
                    <td>{f.anneeAcademique}</td>
                    <td><span className="badge badge-neutral">{getTypeLabel(f.type)}</span></td>
                    <td>
                      <span className={`badge ${f.statut === 'ACTIF' ? 'badge-success' : f.statut === 'INACTIF' ? 'badge-danger' : 'badge-neutral'}`}>
                        {f.statut}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button className="btn-outline" style={{ fontSize: 10, padding: '3px 8px' }} onClick={() => handleEdit(f)}>✏️</button>
                        {f.statut === 'ACTIF' && (
                          <>
                            <button className="btn-danger" style={{ fontSize: 10, padding: '3px 8px' }} onClick={() => handleDesactiver(f.id)}>🔴</button>
                            <button className="btn-outline" style={{ fontSize: 10, padding: '3px 8px' }} onClick={() => handleReaffecter(f.id)}>🔄</button>
                          </>
                        )}
                        {f.statut === 'INACTIF' && (
                          <button className="btn-outline" style={{ fontSize: 10, padding: '3px 8px' }} onClick={() => handleArchiver(f.id)}>📦</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {fraisModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 400, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>
              {fraisModal.type === 'desactiver' ? '🔴 Désactiver le frais' : '📦 Archiver le frais'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>
              {fraisModal.type === 'desactiver'
                ? 'Désactiver ce frais ? Les affectations non payées seront annulées.'
                : 'Archiver ce frais ? Il ne sera plus modifiable.'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setFraisModal({ open: false, id: null, type: null })}>Annuler</button>
              <button className="btn-danger" onClick={confirmerFraisAction}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}