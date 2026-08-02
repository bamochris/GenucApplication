// src/pages/rh/GestionCongesRH.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function GestionCongesRH() {
  const { user } = useAuth();
  const [conges, setConges] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [onglet, setOnglet] = useState('attente');
  const [rejetModal, setRejetModal] = useState({ open: false, id: null, motif: '' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    personnelId: '',
    libelle: 'Congé annuel',
    dateDebut: '',
    dateFin: '',
    commentaire: '',
  });

  const universiteId = user?.universiteId;

  useEffect(() => {
    if (universiteId) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [universiteId]);

  const loadData = async () => {
    try {
      const [persoRes, congesRes, histRes] = await Promise.all([
        api.get(`/api/rh/personnel/universite/${universiteId}`),
        api.get(`/api/conges/en-attente?universiteId=${universiteId}`),
        // NOTE : pas d'endpoint backend pour l'historique des congés d'une université
        // (seulement /api/conges/personnel/{id}). Cet onglet reste vide tant que ce
        // endpoint n'est pas ajouté côté backend.
        api.get(`/api/conges/universite/${universiteId}/historique`).catch(() => ({ data: [] })),
      ]);
      setPersonnel(persoRes.data || []);
      setConges(congesRes.data || []);
      setHistorique(histRes.data || []);
    } catch (err) {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/api/conges/demander', {
        ...form,
        personnelId: parseInt(form.personnelId),
        nbJoursOuvrables: form.dateDebut && form.dateFin ? calculerJoursOuvrables(form.dateDebut, form.dateFin) : 0,
      });
      setMessage('✅ Congé créé avec succès');
      setShowForm(false);
      setForm({ personnelId: '', libelle: 'Congé annuel', dateDebut: '', dateFin: '', commentaire: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la création');
    }
  };

  const valider = async (id) => {
    try {
      await api.patch(`/api/conges/${id}/valider`, {
        valideurId: user.id,
        commentaire: 'Validé',
      });
      setMessage('✅ Congé validé');
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur');
    }
  };

  const rejeter = (id) => setRejetModal({ open: true, id, motif: '' });

  const confirmerRejet = async () => {
    if (!rejetModal.motif.trim()) { setError('Veuillez saisir un motif.'); return; }
    const id = rejetModal.id;
    setRejetModal({ open: false, id: null, motif: '' });
    try {
      await api.patch(`/api/conges/${id}/rejeter`, { motif: rejetModal.motif });
      setMessage('❌ Congé rejeté');
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur');
    }
  };

  const calculerJoursOuvrables = (debut, fin) => {
    const d = new Date(debut);
    const f = new Date(fin);
    let jours = 0;
    while (d <= f) {
      if (d.getDay() !== 0 && d.getDay() !== 6) jours++;
      d.setDate(d.getDate() + 1);
    }
    return jours;
  };

  const getStatutBadge = (statut) => {
    const map = {
      EN_ATTENTE: 'badge-warning',
      VALIDE: 'badge-success',
      REJETE: 'badge-danger',
      TERMINE: 'badge-neutral',
    };
    return map[statut] || 'badge-neutral';
  };

  const getStatutLabel = (statut) => {
    const map = {
      EN_ATTENTE: '⏳ En attente',
      VALIDE: '✅ Validé',
      REJETE: '❌ Rejeté',
      TERMINE: '📅 Terminé',
    };
    return map[statut] || statut;
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📅 Gestion des congés</h1>
          <p className="page-sub">Validez, rejetez ou consultez les demandes de congé</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '➕ Nouvelle demande'}
        </button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">Créer un congé</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Employé *</label>
              <select value={form.personnelId} onChange={e => setForm({...form, personnelId: e.target.value})} required>
                <option value="">-- Sélectionner --</option>
                {personnel.map(p => (
                  <option key={p.id} value={p.id}>{p.prenom} {p.nom} ({p.matriculePersonnel})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Type de congé *</label>
              <select value={form.libelle} onChange={e => setForm({...form, libelle: e.target.value})} required>
                <option value="Congé annuel">Congé annuel</option>
                <option value="Congé de maladie">Congé de maladie</option>
                <option value="Congé de maternité">Congé de maternité</option>
                <option value="Congé sans solde">Congé sans solde</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date début *</label>
              <input type="date" value={form.dateDebut} onChange={e => setForm({...form, dateDebut: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Date fin *</label>
              <input type="date" value={form.dateFin} onChange={e => setForm({...form, dateFin: e.target.value})} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Commentaire</label>
              <textarea value={form.commentaire} onChange={e => setForm({...form, commentaire: e.target.value})} rows="2" />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>
              📤 Soumettre la demande
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button className={onglet === 'attente' ? 'btn-primary' : 'btn-outline'} onClick={() => setOnglet('attente')}>
          En attente ({conges.length})
        </button>
        <button className={onglet === 'historique' ? 'btn-primary' : 'btn-outline'} onClick={() => setOnglet('historique')}>
          Historique ({historique.length})
        </button>
      </div>

      {onglet === 'attente' && (
        <div className="card">
          <h2 className="card-title">📋 Demandes en attente</h2>
          {conges.length === 0 ? (
            <p>Aucune demande en attente.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Libellé</th>
                  <th>Période</th>
                  <th>Jours</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {conges.map(c => (
                  <tr key={c.id}>
                    <td>{c.personnel?.prenom} {c.personnel?.nom}</td>
                    <td>{c.libelle}</td>
                    <td>{c.dateDebut} → {c.dateFin}</td>
                    <td>{c.nbJoursOuvrables}</td>
                    <td><span className={`badge ${getStatutBadge(c.statut)}`}>{getStatutLabel(c.statut)}</span></td>
                    <td>
                      <button className="btn-success" style={{ fontSize: 11, marginRight: 4 }} onClick={() => valider(c.id)}>
                        ✅ Valider
                      </button>
                      <button className="btn-danger" style={{ fontSize: 11 }} onClick={() => rejeter(c.id)}>
                        ❌ Rejeter
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {onglet === 'historique' && (
        <div className="card">
          <h2 className="card-title">📋 Historique des congés</h2>
          {historique.length === 0 ? (
            <p>Aucun congé enregistré.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Type</th>
                  <th>Période</th>
                  <th>Statut</th>
                  <th>Date validation</th>
                </tr>
              </thead>
              <tbody>
                {historique.map(c => (
                  <tr key={c.id}>
                    <td>{c.personnel?.prenom} {c.personnel?.nom}</td>
                    <td>{c.libelle}</td>
                    <td>{c.dateDebut} → {c.dateFin}</td>
                    <td><span className={`badge ${getStatutBadge(c.statut)}`}>{getStatutLabel(c.statut)}</span></td>
                    <td>{c.dateValidation ? new Date(c.dateValidation).toLocaleDateString('fr-FR') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {rejetModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 400, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>❌ Motif du rejet</h3>
            <textarea
              rows={4}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Expliquez la raison du rejet de la demande de congé..."
              value={rejetModal.motif}
              onChange={e => setRejetModal(m => ({ ...m, motif: e.target.value }))}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setRejetModal({ open: false, id: null, motif: '' })}>Annuler</button>
              <button className="btn-danger" onClick={confirmerRejet}>Confirmer le rejet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}