// src/pages/Filiere.jsx
// Gestion des filières par département (admin)
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import '../../pages/Dashboard.css';

export default function Filieres() {
  const [universites, setUniversites] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [selectedUni, setSelectedUni] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  
  const [form, setForm] = useState({ 
    nom: '', code: '', description: '', 
    niveau: 'LICENCE', dureeAnnees: 3, creditsTotal: 180,
    departementId: '' 
  });
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');

  // Charger les universités
  useEffect(() => {
    api.get('/api/universites/public')
      .then(r => setUniversites(r.data))
      .catch(() => setErreur('Erreur chargement universités'));
  }, []);

  // Charger les départements quand l'université change
  const handleUniChange = (e) => {
    const uniId = e.target.value;
    setSelectedUni(uniId);
    setSelectedDept('');
    setDepartements([]);
    setFilieres([]);
    setForm(f => ({ ...f, departementId: '' }));
    if (uniId) {
      api.get(`/api/universites/public/${uniId}/departements`)
        .then(r => setDepartements(r.data))
        .catch(() => setErreur('Erreur chargement départements'));
    }
  };

  // Charger les filières quand le département change
  const handleDeptChange = (e) => {
    const deptId = e.target.value;
    setSelectedDept(deptId);
    setForm(f => ({ ...f, departementId: deptId }));
    if (deptId) {
      chargerFilieres(deptId);
    } else {
      setFilieres([]);
    }
  };

  const chargerFilieres = (deptId) => {
    api.get(`/api/departements/public/${deptId}/filieres`)
      .then(r => {
        const data = r.data?.filieres || r.data || [];
        setFilieres(Array.isArray(data) ? data : []);
      })
      .catch(() => setErreur('Impossible de charger les filières'));
  };

  // Soumettre une nouvelle filière
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');
    setMessage('');
    if (!form.departementId) {
      setErreur('Veuillez sélectionner un département.');
      return;
    }
    try {
      await api.post('/api/filieres', form);
      setMessage('✅ Filière créée avec succès !');
      setForm({ 
        nom: '', code: '', description: '', 
        niveau: 'LICENCE', dureeAnnees: 3, creditsTotal: 180,
        departementId: selectedDept 
      });
      chargerFilieres(selectedDept);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Structure Académique : Filières</h1>
        <p className="page-sub">Configurez les filières d'études par faculté/département</p>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {erreur && <div className="alert-erreur">{erreur}</div>}

      <div className="form-grid" style={{ gridTemplateColumns: '1fr 2fr', alignItems: 'start' }}>
        {/* Formulaire de création */}
        <div className="card">
          <h2 className="card-title">Ajouter une Filière</h2>
          <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Université</label>
              <select value={selectedUni} onChange={handleUniChange} required>
                <option value="">-- Choisir une université --</option>
                {universites.map(u => <option key={u.id} value={u.id}>{u.nom}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Département / Faculté</label>
              <select value={selectedDept} onChange={handleDeptChange} disabled={!selectedUni} required>
                <option value="">-- Choisir un département --</option>
                {departements.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Nom de la Filière</label>
              <input 
                type="text" 
                placeholder="ex: Génie Logiciel, Réseaux & Télécoms" 
                value={form.nom} 
                onChange={e => setForm({ ...form, nom: e.target.value })} 
                required 
              />
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Code</label>
              <input 
                type="text" 
                placeholder="ex: GL, RT" 
                value={form.code} 
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} 
              />
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Niveau</label>
              <select value={form.niveau} onChange={e => setForm({ ...form, niveau: e.target.value })}>
                <option value="LICENCE">Licence</option>
                <option value="MASTER">Master</option>
                <option value="DOCTORAT">Doctorat</option>
                <option value="CYCLE_COURT">Cycle Court</option>
                <option value="SPECIALISATION">Spécialisation</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Durée (années)</label>
              <input 
                type="number" 
                value={form.dureeAnnees} 
                onChange={e => setForm({ ...form, dureeAnnees: parseInt(e.target.value) || 3 })} 
                min="1" max="10"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Crédits total</label>
              <input 
                type="number" 
                value={form.creditsTotal} 
                onChange={e => setForm({ ...form, creditsTotal: parseInt(e.target.value) || 180 })} 
                min="60" max="300"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Description</label>
              <textarea 
                placeholder="Objectifs de la formation, débouchés..." 
                rows="3"
                value={form.description} 
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={!selectedDept} style={{ width: '100%' }}>
              Enregistrer la Filière
            </button>
          </form>
        </div>

        {/* Liste des filières existantes */}
        <div className="card">
          <h2 className="card-title">Filières configurées ({filieres.length})</h2>
          {!selectedDept ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 14 }}>
              💡 Sélectionnez un département pour afficher ses filières d'études.
            </p>
          ) : filieres.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 14 }}>Aucune filière dans ce département.</p>
          ) : (
            <div style={{ marginTop: 14 }}>
              {filieres.map(f => (
                <div key={f.id} style={{ 
                  padding: '12px', 
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.nom}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {f.code || '—'} • {f.niveau} • {f.dureeAnnees} ans • {f.creditsTotal} crédits
                    </div>
                    {f.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f.description}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={`badge ${f.actif ? 'badge-success' : 'badge-danger'}`}>
                      {f.actif ? 'Actif' : 'Inactif'}
                    </span>
                    <button className="btn-outline" style={{ fontSize: 11, padding: '4px 8px' }}>
                      ✏️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}