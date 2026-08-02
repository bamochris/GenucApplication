// src/pages/admin/PromotionGestion.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import '../Dashboard.css';

export default function PromotionGestion() {
  const { filiereId } = useParams();
  const [promotions, setPromotions] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [form, setForm] = useState({ libelle: '', code: '', niveau: 'L1', creditsRequis: 60, dureeAnnees: 1, anneeAcademiqueId: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

  useEffect(() => {
    const chargerDonnees = async () => {
      try {
        const [promoRes, anneeRes] = await Promise.all([
          api.get(`/api/promotions/filiere/${filiereId}`),
          api.get('/api/annees-academiques')
        ]);
        setPromotions(promoRes.data);
        setAnnees(anneeRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    chargerDonnees();
  }, [filiereId]);

  const ajouterPromotion = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/api/promotions', {
        libelle: form.libelle,
        code: form.code,
        niveau: form.niveau,
        creditsRequis: form.creditsRequis,
        dureeAnnees: form.dureeAnnees,
        filiere: { id: parseInt(filiereId) },
        anneeAcademique: { id: parseInt(form.anneeAcademiqueId) },
      });
      const promoRes = await api.get(`/api/promotions/filiere/${filiereId}`);
      setPromotions(promoRes.data);
      setForm({ libelle: '', code: '', niveau: 'L1', creditsRequis: 60, dureeAnnees: 1, anneeAcademiqueId: '' });
      setMessage('✅ Promotion ajoutée avec succès');
    } catch (err) {
      setError(err.response?.data?.erreur || err.response?.data?.message || '❌ Erreur lors de l\'ajout');
    }
  };

  const supprimer = (id) => setDeleteModal({ open: true, id });

  const confirmerSuppression = async () => {
    const id = deleteModal.id;
    setDeleteModal({ open: false, id: null });
    setError('');
    setMessage('');
    try {
      await api.delete(`/api/promotions/${id}`);
      const promoRes = await api.get(`/api/promotions/filiere/${filiereId}`);
      setPromotions(promoRes.data);
      setMessage('✅ Promotion supprimée');
    } catch (err) {
      setError(err.response?.data?.erreur || '❌ Erreur lors de la suppression');
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="page">
      <h1 className="page-title">🎓 Gestion des promotions</h1>
      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}
      <div className="card">
        <h2 className="card-title">Ajouter une promotion</h2>
        <form onSubmit={ajouterPromotion} className="form-grid">
          <div className="form-group">
            <label>Libellé (L1, L2, M1, etc.)</label>
            <input value={form.libelle} onChange={e => setForm({...form, libelle: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Code unique</label>
            <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Niveau (enum)</label>
            <select value={form.niveau} onChange={e => setForm({...form, niveau: e.target.value})}>
              <option value="L1">L1</option><option value="L2">L2</option><option value="L3">L3</option>
              <option value="M1">M1</option><option value="M2">M2</option>
              <option value="D1">D1</option><option value="D2">D2</option><option value="D3">D3</option>
            </select>
          </div>
          <div className="form-group">
            <label>Crédits requis</label>
            <input type="number" value={form.creditsRequis} onChange={e => setForm({...form, creditsRequis: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Année académique</label>
            <select value={form.anneeAcademiqueId} onChange={e => setForm({...form, anneeAcademiqueId: e.target.value})} required>
              <option value="">-- Sélectionner --</option>
              {annees.map(a => <option key={a.id} value={a.id}>{a.libelle}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary">Ajouter</button>
        </form>
      </div>
      <div className="card">
        <h2 className="card-title">Promotions existantes</h2>
        <table className="data-table">
          <thead>
            <tr><th>Libellé</th><th>Niveau</th><th>Crédits</th><th>Année académique</th><th>Action</th></tr>
          </thead>
          <tbody>
            {promotions.map(p => (
              <tr key={p.id}>
                <td>{p.libelle}</td>
                <td>{p.niveau}</td>
                <td>{p.creditsRequis}</td>
                <td>{p.anneeAcademique?.libelle}</td>
                <td><button className="btn-danger" onClick={() => supprimer(p.id)}>Supprimer</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 360, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>🗑️ Supprimer la promotion</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>Supprimer cette promotion ? Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setDeleteModal({ open: false, id: null })}>Annuler</button>
              <button className="btn-danger" onClick={confirmerSuppression}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}