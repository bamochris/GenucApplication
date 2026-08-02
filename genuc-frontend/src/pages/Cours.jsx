import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // ← AJOUT
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export default function Cours() {
  const { user } = useAuth();
  const [universites, setUniversites] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [cours, setCours] = useState([]);
  const [uniId, setUniId] = useState('');
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    titre: '', code: '', description: '', niveau: 'L1',
    credits: 3, langue: 'Francais', universiteId: '', departementId: '',
    professeurId: '', professeurNom: ''
  });

  const peutCreer = ['PROFESSEUR', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN'].includes(user?.role);

  useEffect(() => {
    api.get('/api/universites/public')
      .then(r => setUniversites(r.data))
      .catch(console.error);
  }, []);

  const chargerCours = () => {
    if (!uniId) return;
    setChargement(true);
    setErreur('');
    api.get(`/api/cours/public/${uniId}`)
      .then(r => setCours(r.data))
      .catch(() => setErreur('Impossible de charger les cours.'))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    chargerCours();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [uniId]);

  const onUniChange = (e) => {
    const id = e.target.value;
    setUniId(id);
    setForm({ ...form, universiteId: id, departementId: '' });
    if (id) {
      api.get(`/api/universites/public/${id}/departements`)
        .then(r => setDepartements(r.data))
        .catch(console.error);
    } else {
      setDepartements([]);
    }
  };

  const publierCours = (id) => {
    api.patch(`/api/cours/${id}/publier`)
      .then(() => {
        setMessage('Le cours a ete publie officiellement');
        chargerCours();
      })
      .catch(console.error);
  };

  const soumettreCours = (e) => {
    e.preventDefault();
    setErreur('');
    setMessage('');
    api.post('/api/cours', form)
      .then(() => {
        setMessage('Cours ajoute avec succes dans le catalogue');
        setShowForm(false);
        setForm({
          titre: '', code: '', description: '', niveau: 'L1',
          credits: 3, langue: 'Francais', universiteId: uniId, departementId: '',
          professeurId: '', professeurNom: ''
        });
        chargerCours();
      })
      .catch(err => setErreur(err.response?.data?.message || 'Erreur lors de la creation'));
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Curriculum & Offres de Cours</h1>
          <p className="page-sub">Visualisez et mettez en ligne les matieres academiques par departement.</p>
        </div>
        {peutCreer && (
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '📚 Publier un nouveau cours'}
          </button>
        )}
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {erreur && <div className="alert-erreur">{erreur}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
          Selectionner une universite pour filtrer :
        </label>
        <select value={uniId} onChange={onUniChange} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border-color)', width: '100%', maxWidth: 400 }}>
          <option value="">-- Choisissez une institution --</option>
          {universites.map(u => <option key={u.id} value={u.id}>{u.code} - {u.nom}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">Ajouter un cours au catalogue national</h2>
          <form onSubmit={soumettreCours} className="form-grid" style={{ marginTop: 14 }}>
            {/* ... formulaire inchangé ... */}
            <div className="form-group">
              <label>Intitule du cours</label>
              <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required placeholder="Ex: Algorithmique Avancee" />
            </div>
            <div className="form-group">
              <label>Code Unique</label>
              <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required placeholder="Ex: INFO-202" />
            </div>
            <div className="form-group">
              <label>Etablissement cible (Selectionne en haut)</label>
              <input type="text" readOnly value={universites.find(u => u.id === parseInt(uniId))?.code || ''} />
            </div>
            <div className="form-group">
              <label>Departement Rattache</label>
              <select value={form.departementId} onChange={e => setForm({ ...form, departementId: e.target.value })} required>
                <option value="">-- Choisir le departement --</option>
                {departements.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Niveau / Promotion</label>
              <select value={form.niveau} onChange={e => setForm({ ...form, niveau: e.target.value })}>
                <option value="L1">Licence 1 (L1)</option>
                <option value="L2">Licence 2 (L2)</option>
                <option value="L3">Licence 3 (L3)</option>
                <option value="M1">Master 1 (M1)</option>
                <option value="M2">Master 2 (M2)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Volume Credits (Ects)</label>
              <input type="number" min="1" value={form.credits} onChange={e => setForm({ ...form, credits: parseInt(e.target.value) })} required />
            </div>
            <div className="form-group">
              <label>Nom du Professeur Responsable</label>
              <input value={form.professeurNom} onChange={e => setForm({ ...form, professeurNom: e.target.value })} required placeholder="Prof. Dr. Nom" />
            </div>
            <div className="form-group">
              <label>Langue d'enseignement</label>
              <input value={form.langue} onChange={e => setForm({ ...form, langue: e.target.value })} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Description des objectifs pedagogiques</label>
              <textarea rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Saisissez le resume ou syllabus..." />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2', marginTop: 10 }}>Enregistrer le cours</button>
          </form>
        </div>
      )}

      {chargement ? (
        <p style={{ color: 'var(--text-muted)' }}>Extraction des donnees pedagogiques...</p>
      ) : !uniId ? (
        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Veuillez choisir une universite ci-dessus pour inspecter ses enseignements.</p>
      ) : cours.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Aucun cours enregistre pour cet etablissement.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {cours.map(c => {
            const isRefuse = c.statut === 'REJETE';
            const isOk = c.statut === 'PUBLIE';
            return (
              <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#185FA5' }}>{c.code || 'CODE-NC'}</div>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 10,
                      background: isOk ? '#E1F5EE' : isRefuse ? '#FFF0f0' : '#F4F6F9',
                      color: isOk ? '#0F6E56' : isRefuse ? '#cc0000' : '#555', fontWeight: 600
                    }}>
                      {c.statut}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{c.titre}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                    {c.professeurNom} &middot; {c.niveau} &middot; {c.credits} Credits
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.4 }}>{c.description || 'Aucun descriptif fourni.'}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {peutCreer && c.statut === 'BROUILLON' && (
                    <button className="btn-primary" style={{ fontSize: 11, padding: '5px', width: '100%' }} onClick={() => publierCours(c.id)}>
                      Publier au reseau
                    </button>
                  )}
                  {/* Bouton pour voir les présences (visible pour professeur et chef département) */}
                  {(user?.role === 'PROFESSEUR' || user?.role === 'CHEF_DEPARTEMENT') && (
                    <Link to={`/professeur/presences/cours/${c.id}`} className="btn-outline" style={{ textAlign: 'center', textDecoration: 'none' }}>
                      📋 Voir les présences
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}