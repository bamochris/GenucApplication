// src/pages/finances/admin/AffectationFrais.jsx
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../FinanceDashboard.css';

export default function AffectationFrais() {
  const { user } = useAuth();
  const [affectations, setAffectations] = useState([]);
  const [frais, setFrais] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const [form, setForm] = useState({
    fraisId: '',
    inscriptionId: '',
    montant: '',
    commentaire: ''
  });
  const [etudiantSearch, setEtudiantSearch] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
      setError('Utilisateur non authentifié');
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (etudiantSearch.length >= 3) {
        handleSearchEtudiant(etudiantSearch);
      } else {
        setEtudiants([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [etudiantSearch]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [affectRes, fraisRes] = await Promise.all([
        api.get('/api/admin/frais/historique'),
        api.get('/api/admin/frais')
      ]);
      setAffectations(affectRes.data || []);
      setFrais(fraisRes.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchEtudiant = async (search) => {
    if (!search || search.length < 3) return;
    try {
      const res = await api.get(`/api/inscriptions/recherche?q=${search}`);
      setEtudiants(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === 'fraisId') {
      const selected = frais.find(f => f.id === parseInt(value));
      if (selected) {
        setForm(prev => ({ ...prev, montant: selected.montant }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await api.post(`/api/admin/frais/${form.fraisId}/affecter/${form.inscriptionId}`);
      setMessage('✅ Frais affecté avec succès');
      setShowForm(false);
      setForm({ fraisId: '', inscriptionId: '', montant: '', commentaire: '' });
      setEtudiants([]);
      setEtudiantSearch('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de l\'affectation');
    }
  };

  const getStatutLabel = (statut) => {
    const map = {
      'EN_ATTENTE': '⏳ En attente',
      'PARTIEL': '🔄 Partiel',
      'PAYE': '✅ Payé',
      'ANNULE': '❌ Annulé'
    };
    return map[statut] || statut;
  };

  const getStatutBadge = (statut) => {
    const map = {
      'EN_ATTENTE': 'badge-warning',
      'PARTIEL': 'badge-warning',
      'PAYE': 'badge-success',
      'ANNULE': 'badge-danger'
    };
    return map[statut] || 'badge-neutral';
  };

  const filteredAffectations = useMemo(() => {
    return affectations.filter(a => {
      const matchStatut = filterStatut ? a.statut === filterStatut : true;
      const matchSearch = searchTerm
        ? (a.inscription?.matricule || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (a.inscription?.prenom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (a.inscription?.nom || '').toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      return matchStatut && matchSearch;
    });
  }, [affectations, filterStatut, searchTerm]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement des affectations...</p>
      </div>
    );
  }

  return (
    <div className="finance-dashboard">
      <div className="section-header">
        <h2 className="section-title">📋 Affectation des frais</h2>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEtudiants([]); setEtudiantSearch(''); }}>
          {showForm ? 'Annuler' : '➕ Affecter un frais'}
        </button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Affectation individuelle</h3>
          <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label>Frais *</label>
              <select name="fraisId" value={form.fraisId} onChange={handleChange} required>
                <option value="">-- Sélectionner --</option>
                {frais.filter(f => f.statut === 'ACTIF').map(f => (
                  <option key={f.id} value={f.id}>{f.code} - {f.libelle} ({f.montant} {f.devise})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Montant</label>
              <input
                type="number"
                step="0.01"
                name="montant"
                value={form.montant}
                onChange={handleChange}
                placeholder="Montant"
                required
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Étudiant (Matricule, Nom ou Prénom) *</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  placeholder="Rechercher un étudiant (min 3 caractères)..."
                  value={etudiantSearch}
                  onChange={(e) => setEtudiantSearch(e.target.value)}
                  style={{ flex: 1 }}
                />
                <select
                  name="inscriptionId"
                  value={form.inscriptionId}
                  onChange={handleChange}
                  required
                  style={{ minWidth: 200 }}
                >
                  <option value="">-- Sélectionner --</option>
                  {etudiants.map(e => (
                    <option key={e.id} value={e.id}>{e.matricule} - {e.prenom} {e.nom}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Commentaire</label>
              <textarea
                name="commentaire"
                value={form.commentaire}
                onChange={handleChange}
                rows="2"
                placeholder="Motif de l'affectation..."
              />
            </div>
            <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10 }}>
              <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button type="submit" className="btn-primary">📤 Affecter</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 150 }}>
            <input
              type="text"
              placeholder="🔍 Rechercher un étudiant..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd' }}
            />
          </div>
          <label style={{ fontWeight: 600 }}>Statut :</label>
          <select
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          >
            <option value="">Tous</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="PARTIEL">Partiel</option>
            <option value="PAYE">Payé</option>
            <option value="ANNULE">Annulé</option>
          </select>
          <button className="btn-outline" onClick={() => { setSearchTerm(''); setFilterStatut(''); }}>Réinitialiser</button>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
            {filteredAffectations.length} affectations
          </span>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Frais</th>
                <th>Montant</th>
                <th>Payé</th>
                <th>Reste</th>
                <th>Statut</th>
                <th>Échéance</th>
              </tr>
            </thead>
            <tbody>
              {filteredAffectations.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>Aucune affectation</td></tr>
              ) : (
                filteredAffectations.map(a => {
                  const montant = a.montant || 0;
                  const reste = a.reste || 0;
                  return (
                    <tr key={a.id}>
                      <td>{a.inscription?.prenom || ''} {a.inscription?.nom || ''}<br/><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.inscription?.matricule || ''}</span></td>
                      <td>{a.frais?.libelle || ''}<br/><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.frais?.code || ''}</span></td>
                      <td>{montant} USD</td>
                      <td>{(montant - reste).toFixed(2)} USD</td>
                      <td style={{ fontWeight: 600, color: reste > 0 ? '#cc0000' : '#1D9E75' }}>{reste} USD</td>
                      <td>
                        <span className={`badge ${getStatutBadge(a.statut)}`}>
                          {getStatutLabel(a.statut)}
                        </span>
                      </td>
                      <td>{a.dateEcheance ? new Date(a.dateEcheance).toLocaleDateString('fr-FR') : '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}