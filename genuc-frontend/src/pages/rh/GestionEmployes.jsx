// src/pages/rh/GestionEmployes.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../../pages/Dashboard.css';

export default function GestionEmployes() {
  const { user } = useAuth();
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filtres, setFiltres] = useState({ type: '', statut: '', recherche: '' });
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    type: 'ENSEIGNANT',
    grade: '',
    specialite: '',
    telephone: '',
    sexe: '',
    dateNaissance: '',
    adresse: '',
    dateEmbauche: '',
    statut: 'ACTIF',
  });

  const universiteId = user?.universiteId;

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const empRes = await api.get(`/api/rh/personnel/universite/${universiteId}`);
      setEmployes(empRes.data || []);
    } catch (err) {
      setError('Erreur chargement des données');
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
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        type: form.type,
        grade: form.grade || null,
        specialite: form.specialite || null,
        telephone: form.telephone || null,
        sexe: form.sexe || null,
        dateNaissance: form.dateNaissance || null,
        adresse: form.adresse || null,
        dateEmbauche: form.dateEmbauche || null,
        statut: form.statut,
        universite: { id: parseInt(universiteId) },
      };
      await api.post('/api/rh/personnel', payload);
      setMessage('✅ Employé créé avec succès');
      setShowForm(false);
      setForm({ nom: '', prenom: '', email: '', type: 'ENSEIGNANT', grade: '', specialite: '', telephone: '', sexe: '', dateNaissance: '', adresse: '', dateEmbauche: '', statut: 'ACTIF' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la création');
    }
  };

  const exportCSV = () => {
    // Génération CSV manuelle
    const headers = ['Matricule', 'Nom', 'Prénom', 'Email', 'Type', 'Spécialité', 'Grade', 'Statut'];
    const rows = employes.map(e => [
      e.matriculePersonnel,
      e.nom,
      e.prenom,
      e.email,
      e.type,
      e.specialite || '',
      e.grade || '',
      e.statut,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `employes_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const employesFiltres = employes.filter(e => {
    if (filtres.type && e.type !== filtres.type) return false;
    if (filtres.statut && e.statut !== filtres.statut) return false;
    if (filtres.recherche) {
      const search = filtres.recherche.toLowerCase();
      return e.nom?.toLowerCase().includes(search) || e.prenom?.toLowerCase().includes(search) || e.email?.toLowerCase().includes(search);
    }
    return true;
  });

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 Gestion des employés</h1>
          <p className="page-sub">Liste du personnel et création de nouveaux employés</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" onClick={exportCSV}>📥 Export CSV</button>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '➕ Nouvel employé'}
          </button>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {/* Filtres */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
            <label>Rechercher</label>
            <input type="text" placeholder="Nom, prénom, email..." value={filtres.recherche} onChange={e => setFiltres({...filtres, recherche: e.target.value})} />
          </div>
          <div className="form-group" style={{ minWidth: 150 }}>
            <label>Type</label>
            <select value={filtres.type} onChange={e => setFiltres({...filtres, type: e.target.value})}>
              <option value="">Tous</option>
              <option value="ENSEIGNANT">Enseignant</option>
              <option value="ADMINISTRATIF">Administratif</option>
              <option value="OUVRIER">Ouvrier</option>
              <option value="STAGIAIRE">Stagiaire</option>
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 150 }}>
            <label>Statut</label>
            <select value={filtres.statut} onChange={e => setFiltres({...filtres, statut: e.target.value})}>
              <option value="">Tous</option>
              <option value="ACTIF">Actif</option>
              <option value="INACTIF">Inactif</option>
              <option value="CONGE">En congé</option>
              <option value="RETRAITE">Retraité</option>
            </select>
          </div>
          <button className="btn-outline" onClick={() => setFiltres({ type: '', statut: '', recherche: '' })}>Réinitialiser</button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">Ajouter un employé</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Nom *</label>
              <input value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Prénom *</label>
              <input value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="exemple@email.com" required />
            </div>
            <div className="form-group">
              <label>Type *</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} required>
                <option value="ENSEIGNANT">Enseignant</option>
                <option value="ADMINISTRATIF">Administratif</option>
                <option value="OUVRIER">Ouvrier</option>
                <option value="STAGIAIRE">Stagiaire</option>
              </select>
            </div>
            <div className="form-group">
              <label>Spécialité</label>
              <input value={form.specialite} onChange={e => setForm({...form, specialite: e.target.value})} placeholder="Ex: Informatique, Comptabilité..." />
            </div>
            <div className="form-group">
              <label>Grade</label>
              <input value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} placeholder="Ex: Doctorat, Licence..." />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} placeholder="+243..." />
            </div>
            <div className="form-group">
              <label>Sexe</label>
              <select value={form.sexe} onChange={e => setForm({...form, sexe: e.target.value})}>
                <option value="">-- Sélectionner --</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date de naissance</label>
              <input type="date" value={form.dateNaissance} onChange={e => setForm({...form, dateNaissance: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Adresse</label>
              <input value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Date d'embauche</label>
              <input type="date" value={form.dateEmbauche} onChange={e => setForm({...form, dateEmbauche: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Statut</label>
              <select value={form.statut} onChange={e => setForm({...form, statut: e.target.value})}>
                <option value="ACTIF">Actif</option>
                <option value="INACTIF">Inactif</option>
                <option value="CONGE">En congé</option>
                <option value="RETRAITE">Retraité</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-primary">
                Créer l'employé
              </button>
              <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>
                Annuler
              </button>
            </div>
          </form>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
            Le salaire de base et le type de contrat (CDI, CDD, vacataire...) se définissent ensuite via un contrat, depuis la fiche de l'employé.
          </p>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">📋 Liste des employés ({employesFiltres.length})</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Matricule</th>
              <th>Nom</th>
              <th>Spécialité</th>
              <th>Type</th>
              <th>Grade</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employesFiltres.map(e => (
              <tr key={e.id}>
                <td className="uni-code">{e.matriculePersonnel}</td>
                <td>{e.prenom} {e.nom}</td>
                <td>{e.specialite || '-'}</td>
                <td>{e.type}</td>
                <td>{e.grade || '-'}</td>
                <td>
                  <span className={`badge ${e.statut === 'ACTIF' ? 'badge-success' : 'badge-neutral'}`}>
                    {e.statut}
                  </span>
                </td>
                <td>
                  <Link to={`/rh/employes/${e.id}`} className="btn-outline" style={{ fontSize: 11, textDecoration: 'none' }}>
                    📋 Détails
                  </Link>
                </td>
              </tr>
            ))}
            {employesFiltres.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucun employé correspondant aux filtres</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
