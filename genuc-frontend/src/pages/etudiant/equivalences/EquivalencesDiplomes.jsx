// src/pages/etudiant/equivalences/EquivalencesDiplomes.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import equivalenceDiplomeService from '../../../services/equivalenceDiplomeService';
import '../EtudiantDashboard.css';

const INIT_FORM = {
  etablissementOrigine: '',
  paysOrigine: '',
  diplomeObtenu: '',
  domaineEtude: '',
  anneeObtention: '',
  niveauObtenu: '',
  niveauDemande: '',
  diplome: null,
  releveNotes: null,
};

export default function EquivalencesDiplomes() {
  const { user } = useAuth();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(INIT_FORM);

  const loadDemandes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await equivalenceDiplomeService.listerParEtudiant(user.id);
      setDemandes(data || []);
    } catch (err) {
      setError('Erreur lors du chargement de vos demandes d\'équivalence');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadDemandes();
  }, [loadDemandes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!form.etablissementOrigine.trim() || !form.paysOrigine.trim() || !form.diplomeObtenu.trim()) {
      setError('Établissement d\'origine, pays et diplôme obtenu sont obligatoires.');
      return;
    }
    if (!form.diplome) {
      setError('Le scan du diplôme est obligatoire.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('universiteId', user.universiteId);
      formData.append('etablissementOrigine', form.etablissementOrigine);
      formData.append('paysOrigine', form.paysOrigine);
      formData.append('diplomeObtenu', form.diplomeObtenu);
      if (form.domaineEtude) formData.append('domaineEtude', form.domaineEtude);
      if (form.anneeObtention) formData.append('anneeObtention', form.anneeObtention);
      if (form.niveauObtenu) formData.append('niveauObtenu', form.niveauObtenu);
      if (form.niveauDemande) formData.append('niveauDemande', form.niveauDemande);
      formData.append('diplome', form.diplome);
      if (form.releveNotes) formData.append('releveNotes', form.releveNotes);

      await equivalenceDiplomeService.soumettre(formData);

      setMessage('✅ Demande d\'équivalence soumise avec succès. Vous serez notifié de la décision.');
      setShowForm(false);
      setForm(INIT_FORM);
      loadDemandes();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la soumission de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnnuler = async (id) => {
    if (!window.confirm('Annuler cette demande d\'équivalence ?')) return;
    try {
      await equivalenceDiplomeService.annuler(id, user.id);
      setMessage('Demande annulée.');
      loadDemandes();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de l\'annulation');
    }
  };

  const STATUT_BADGE = {
    EN_ATTENTE: 'badge-warning',
    EN_EXAMEN: 'badge-info',
    APPROUVEE: 'badge-success',
    APPROUVEE_PARTIELLE: 'badge-success',
    REJETEE: 'badge-danger',
  };
  const STATUT_LABEL = {
    EN_ATTENTE: '⏳ En attente',
    EN_EXAMEN: '🔄 En cours d\'examen',
    APPROUVEE: '✅ Approuvée',
    APPROUVEE_PARTIELLE: '✅ Approuvée (partielle)',
    REJETEE: '❌ Rejetée',
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🎓 Équivalences de diplômes</h1>
          <p className="page-sub">Faire reconnaître un diplôme obtenu dans un autre établissement</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '➕ Nouvelle demande'}
        </button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Soumettre une demande d'équivalence</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Établissement d'origine *</label>
              <input
                type="text"
                value={form.etablissementOrigine}
                onChange={e => setForm({ ...form, etablissementOrigine: e.target.value })}
                placeholder="Ex : Université de Lubumbashi"
                required
              />
            </div>
            <div className="form-group">
              <label>Pays *</label>
              <input
                type="text"
                value={form.paysOrigine}
                onChange={e => setForm({ ...form, paysOrigine: e.target.value })}
                placeholder="Ex : République Démocratique du Congo"
                required
              />
            </div>
            <div className="form-group">
              <label>Diplôme obtenu *</label>
              <input
                type="text"
                value={form.diplomeObtenu}
                onChange={e => setForm({ ...form, diplomeObtenu: e.target.value })}
                placeholder="Ex : Graduat en Sciences Économiques"
                required
              />
            </div>
            <div className="form-group">
              <label>Domaine d'étude</label>
              <input
                type="text"
                value={form.domaineEtude}
                onChange={e => setForm({ ...form, domaineEtude: e.target.value })}
                placeholder="Ex : Économie et Gestion"
              />
            </div>
            <div className="form-group">
              <label>Année d'obtention</label>
              <input
                type="number"
                min="1960"
                max={new Date().getFullYear()}
                value={form.anneeObtention}
                onChange={e => setForm({ ...form, anneeObtention: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Niveau obtenu</label>
              <input
                type="text"
                value={form.niveauObtenu}
                onChange={e => setForm({ ...form, niveauObtenu: e.target.value })}
                placeholder="Ex : Graduat, Licence, Bachelor..."
              />
            </div>
            <div className="form-group">
              <label>Niveau d'équivalence demandé</label>
              <select
                value={form.niveauDemande}
                onChange={e => setForm({ ...form, niveauDemande: e.target.value })}
              >
                <option value="">-- Sélectionner --</option>
                {['L1', 'L2', 'L3', 'M1', 'M2', 'D1', 'D2', 'D3'].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Scan du diplôme (PDF, image) *</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => setForm({ ...form, diplome: e.target.files[0] })}
                required
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Relevé de notes (optionnel)</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => setForm({ ...form, releveNotes: e.target.files[0] })}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ gridColumn: '1 / span 2' }}>
              {submitting ? 'Envoi en cours...' : '📤 Soumettre la demande'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">📋 Mes demandes d'équivalence</h3>
        {demandes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
            Aucune demande d'équivalence soumise.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Établissement</th>
                  <th>Diplôme</th>
                  <th>Niveau demandé</th>
                  <th>Statut</th>
                  <th>Décision</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {demandes.map(d => (
                  <tr key={d.id}>
                    <td>{new Date(d.dateSoumission).toLocaleDateString('fr-FR')}</td>
                    <td>{d.etablissementOrigine}</td>
                    <td>{d.diplomeObtenu}</td>
                    <td>{d.niveauDemande || '-'}</td>
                    <td>
                      <span className={`badge ${STATUT_BADGE[d.statut] || 'badge-neutral'}`}>
                        {STATUT_LABEL[d.statut] || d.statut}
                      </span>
                    </td>
                    <td style={{ maxWidth: 200, fontSize: 13 }}>
                      {d.niveauAccorde && <div><strong>Niveau accordé :</strong> {d.niveauAccorde}</div>}
                      {d.decisionMotif || '-'}
                    </td>
                    <td>
                      {d.statut === 'EN_ATTENTE' && (
                        <button className="btn-outline" onClick={() => handleAnnuler(d.id)}>
                          Annuler
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
