// src/pages/secretaire/GestionVacations.jsx
// Gestion des vacations universitaires — création, suivi inscriptions, validation.
// API : VacationController (/api/vacations — 21 endpoints, rôle SECRETAIRE_ACADEMIQUE)
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

const TYPES_VACATION = ['VACATION_JOUR', 'VACATION_SOIR', 'VACATION_WEEKEND'];

export default function GestionVacations() {
  const { user } = useAuth();
  const universiteId = user?.universiteId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [vacations, setVacations] = useState([]);
  const [selectedVacation, setSelectedVacation] = useState(null);
  const [inscriptions, setInscriptions] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('liste');

  const [form, setForm] = useState({
    libelle: '',
    description: '',
    type: 'VACATION_JOUR',
    dateDebut: '',
    dateFin: '',
    capaciteMax: '',
  });

  useEffect(() => {
    if (universiteId) {
      loadVacations();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universiteId]);

  const loadVacations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/vacations/universite/${universiteId}`);
      setVacations(res.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des vacations');
    } finally {
      setLoading(false);
    }
  }, [universiteId]);

  const loadInscriptions = useCallback(async (vacationId) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/vacations/${vacationId}/inscriptions`);
      setInscriptions(res.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des inscriptions');
      setInscriptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post(`/api/vacations`, {
        ...form,
        capaciteMax: parseInt(form.capaciteMax) || 0,
        universite: { id: parseInt(universiteId) },
      }, {
        params: { universiteId, anneeAcademiqueId: user?.anneeAcademiqueId || 1 },
      });
      setMessage('✅ Vacation créée avec succès');
      setShowForm(false);
      setForm({
        libelle: '',
        description: '',
        type: 'VACATION_JOUR',
        dateDebut: '',
        dateFin: '',
        capaciteMax: '',
      });
      loadVacations();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la création');
    }
  };

  const ouvrirInscriptions = async (vacationId) => {
    try {
      await api.patch(`/api/vacations/${vacationId}/ouvrir-inscriptions`);
      setMessage('✅ Inscriptions ouvertes');
      loadVacations();
    } catch (err) {
      setError('Erreur lors de l\'ouverture des inscriptions');
    }
  };

  const fermerInscriptions = async (vacationId) => {
    try {
      await api.patch(`/api/vacations/${vacationId}/fermer-inscriptions`);
      setMessage('✅ Inscriptions fermées');
      loadVacations();
    } catch (err) {
      setError('Erreur lors de la fermeture des inscriptions');
    }
  };

  const validerInscription = async (inscriptionId) => {
    try {
      await api.patch(`/api/vacations/inscriptions/${inscriptionId}/valider`);
      setMessage('✅ Inscription validée');
      loadInscriptions(selectedVacation.id);
    } catch (err) {
      setError('Erreur lors de la validation');
    }
  };

  if (loading && !selectedVacation) return (
    <div className="page">
      <div className="loading">Chargement des vacations...</div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📅 Gestion des Vacations</h1>
          <p className="page-sub">
            Créez et suivez les vacations universitaires et leurs inscriptions
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className={activeTab === 'liste' ? 'btn-primary' : 'btn-outline'}
            onClick={() => { setActiveTab('liste'); setSelectedVacation(null); }}
            style={{ fontSize: 12 }}
          >
            📋 Liste des vacations
          </button>
          <button
            className={activeTab === 'creation' ? 'btn-primary' : 'btn-outline'}
            onClick={() => { setActiveTab('creation'); setShowForm(true); }}
            style={{ fontSize: 12 }}
          >
            ➕ Nouvelle vacation
          </button>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {/* Formulaire création */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">
            {form.libelle ? 'Modifier' : 'Créer'} une nouvelle vacation
          </h2>
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
              <label>Type *</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                required
              >
                {TYPES_VACATION.map(t => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date de début *</label>
              <input
                type="datetime-local"
                value={form.dateDebut}
                onChange={e => setForm({ ...form, dateDebut: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Date de fin *</label>
              <input
                type="datetime-local"
                value={form.dateFin}
                onChange={e => setForm({ ...form, dateFin: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Capacité max</label>
              <input
                type="number"
                min="0"
                value={form.capaciteMax}
                onChange={e => setForm({ ...form, capaciteMax: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows="2"
              />
            </div>
            <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-primary">Créer la vacation</button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => {
                  setShowForm(false);
                  setActiveTab('liste');
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Onglet Liste des vacations */}
      {activeTab === 'liste' && (
        <div className="card">
          <h2 className="card-title">Vacations ({vacations.length})</h2>
          {vacations.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
              Aucune vacation enregistrée. Créez-en une pour commencer.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Libellé</th>
                  <th>Type</th>
                  <th>Début</th>
                  <th>Fin</th>
                  <th>Capacité</th>
                  <th>Inscriptions</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vacations.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600 }}>{v.libelle || v.nom || '-'}</td>
                    <td><span className="badge badge-neutral">{v.type}</span></td>
                    <td>{v.dateDebut ? new Date(v.dateDebut).toLocaleString('fr-FR') : '-'}</td>
                    <td>{v.dateFin ? new Date(v.dateFin).toLocaleString('fr-FR') : '-'}</td>
                    <td>{v.capaciteMax || '-'}</td>
                    <td>{v.nombreInscriptions || v.inscriptions?.length || 0}/{v.capaciteMax || '∞'}</td>
                    <td>
                      <span className={`badge ${
                        v.inscriptionsOuvertes ? 'badge-success' : 'badge-neutral'
                      }`}>
                        {v.inscriptionsOuvertes ? 'Ouvertes' : 'Fermées'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn-outline"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                          onClick={() => { setActiveTab('inscriptions'); setSelectedVacation(v); loadInscriptions(v.id); }}
                        >
                          👁️ Voir
                        </button>
                        {v.inscriptionsOuvertes ? (
                          <button
                            className="btn-danger"
                            style={{ fontSize: 11, padding: '4px 8px' }}
                            onClick={() => fermerInscriptions(v.id)}
                          >
                            🔒 Fermer
                          </button>
                        ) : (
                          <button
                            className="btn-success"
                            style={{ fontSize: 11, padding: '4px 8px' }}
                            onClick={() => ouvrirInscriptions(v.id)}
                          >
                            🔓 Ouvrir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Onglet Inscriptions d'une vacation */}
      {activeTab === 'inscriptions' && selectedVacation && (
        <div className="card">
          <h2 className="card-title">
            Inscriptions — {selectedVacation.libelle || selectedVacation.nom || '-'}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            {inscriptions.length} inscription(s) — cliquez sur un bouton pour valider
          </p>
          {inscriptions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
              Aucune inscription pour cette vacation.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Matricule</th>
                  <th>Date inscription</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inscriptions.map(i => (
                  <tr key={i.id}>
                    <td>
                      {i.etudiant?.prenom || ''} {i.etudiant?.nom || i.etudiant?.nomComplet || '-'}
                    </td>
                    <td className="uni-code">{i.etudiant?.matricule || '-'}</td>
                    <td>{i.creeLe ? new Date(i.creeLe).toLocaleString('fr-FR') : '-'}</td>
                    <td>
                      <span className="badge badge-warning">{i.statut || 'EN_ATTENTE'}</span>
                    </td>
                    <td>
                      <button
                        className="btn-success"
                        style={{ fontSize: 11, padding: '4px 10px' }}
                        onClick={() => validerInscription(i.id)}
                      >
                        ✅ Valider
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button
            className="btn-outline"
            style={{ marginTop: 12, fontSize: 12 }}
            onClick={() => { setActiveTab('liste'); setSelectedVacation(null); }}
          >
            ← Retour aux vacations
          </button>
        </div>
      )}
    </div>
  );
}
