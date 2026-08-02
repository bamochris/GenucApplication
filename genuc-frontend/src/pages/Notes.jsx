// src/pages/Notes.jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export default function Notes() {
  const { user } = useAuth();
  const [onglet, setOnglet] = useState('voir');
  const [inscriptionId, setInsId] = useState('');
  const [annee, setAnnee] = useState('2024-2025');
  const [notes, setNotes] = useState([]);
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');
  const [coursStats, setCoursStats] = useState(null);
  const [coursId, setCoursId] = useState('');
  const [enAttente, setEnAttente] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cours, setCours] = useState([]); // ★ AJOUT : liste des cours pour le sélecteur

  const peutSaisir = ['PROFESSEUR', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE'].includes(user?.role);
  const peutValider = ['CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE'].includes(user?.role);

  const [formNote, setFormNote] = useState({
    inscriptionId: '', coursId: '', anneeAcademique: '2024-2025',
    noteTP: '', noteInterrogation: '', noteExamen: '', nbAbsences: 0
  });

  // Charger les cours pour le sélecteur
  useEffect(() => {
    if (user?.universiteId && (peutSaisir || peutValider)) {
      api.get(`/api/cours/universite/${user.universiteId}`)
        .then(res => setCours(res.data || []))
        .catch(err => console.error('Erreur chargement cours', err));
    }
  }, [user, peutSaisir, peutValider]);

  useEffect(() => {
    if (peutValider) {
      chargerNotesEnAttente();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [peutValider, user?.universiteId]);

  const chargerNotesEnAttente = async () => {
    try {
      const res = await api.get(`/api/notes/universite/${user?.universiteId}/a-valider`);
      setEnAttente(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const voirNotes = () => {
    if (!inscriptionId) {
      setErreur('Veuillez saisir un ID d\'inscription');
      return;
    }
    setErreur('');
    setMessage('');
    setNotes([]);
    api.get(`/api/notes/etudiant/${inscriptionId}/${annee}`)
      .then(r => {
        setNotes(r.data);
        if (r.data.length === 0) setErreur('Aucune note publiée pour ce dossier.');
      })
      .catch(() => setErreur('Matricule/Inscription introuvable ou erreur serveur.'));
  };

  const saisirNote = (e) => {
    e.preventDefault();
    setErreur('');
    setMessage('');
    
    const data = { ...formNote };
    if (data.noteTP) data.noteTP = parseFloat(data.noteTP);
    if (data.noteInterrogation) data.noteInterrogation = parseFloat(data.noteInterrogation);
    if (data.noteExamen) data.noteExamen = parseFloat(data.noteExamen);
    data.nbAbsences = parseInt(data.nbAbsences) || 0;

    api.post('/api/notes', data)
      .then(() => {
        setMessage('✅ Note et composantes d\'évaluation enregistrées');
        setFormNote({
          inscriptionId: '', coursId: '', anneeAcademique: '2024-2025',
          noteTP: '', noteInterrogation: '', noteExamen: '', nbAbsences: 0
        });
        chargerNotesEnAttente();
      })
      .catch(err => setErreur('Échec d\'enregistrement : ' + (err.response?.data?.message || 'Données invalides')));
  };

  const validerNote = async (id) => {
    try {
      await api.patch(`/api/notes/${id}/valider`);
      setMessage('✅ Note validée');
      chargerNotesEnAttente();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de la validation');
    }
  };

  const publierNote = async (id) => {
    try {
      await api.patch(`/api/notes/${id}/publier`);
      setMessage('✅ Note publiée');
      chargerNotesEnAttente();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de la publication');
    }
  };

  const voirStatsCours = async () => {
    if (!coursId) {
      setErreur('Veuillez sélectionner un cours');
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/api/notes/cours/${coursId}/${annee}/stats`);
      setCoursStats(res.data);
    } catch (err) {
      setErreur('Erreur chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Gestion des notes</h1>
          <p className="page-sub">Consultez, saisissez, validez et publiez les notes</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className={`btn-outline ${onglet === 'voir' ? 'active' : ''}`} 
          style={{ background: onglet === 'voir' ? '#0B1F4A' : '', color: onglet === 'voir' ? 'white' : '' }} 
          onClick={() => setOnglet('voir')}>
          🔍 Consulter
        </button>
        {peutSaisir && (
          <button className={`btn-outline ${onglet === 'saisir' ? 'active' : ''}`} 
            style={{ background: onglet === 'saisir' ? '#0B1F4A' : '', color: onglet === 'saisir' ? 'white' : '' }} 
            onClick={() => setOnglet('saisir')}>
            ✍️ Saisie
          </button>
        )}
        {peutValider && (
          <button className={`btn-outline ${onglet === 'valider' ? 'active' : ''}`} 
            style={{ background: onglet === 'valider' ? '#0B1F4A' : '', color: onglet === 'valider' ? 'white' : '' }} 
            onClick={() => setOnglet('valider')}>
            ✅ Validation ({enAttente.length})
          </button>
        )}
        {(peutSaisir || peutValider) && (
          <button className={`btn-outline ${onglet === 'stats' ? 'active' : ''}`} 
            style={{ background: onglet === 'stats' ? '#0B1F4A' : '', color: onglet === 'stats' ? 'white' : '' }} 
            onClick={() => setOnglet('stats')}>
            📊 Statistiques
          </button>
        )}
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {erreur && <div className="alert-erreur">{erreur}</div>}

      {/* Onglet Consultation */}
      {onglet === 'voir' && (
        <div className="card">
          <h2 className="card-title">Recherche de relevé d'étudiant</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
              <input type="number" placeholder="Entrez l'ID d'inscription..." value={inscriptionId} onChange={e => setInsId(e.target.value)} />
            </div>
            <div className="form-group" style={{ width: 150 }}>
              <select value={annee} onChange={e => setAnnee(e.target.value)}>
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>
            <button className="btn-primary" onClick={voirNotes}>Charger le relevé</button>
          </div>

          {notes.length > 0 && (
            <div className="table-responsive" style={{ marginTop: 20 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Matière / Cours</th>
                    <th>TP (/20)</th>
                    <th>Interro (/20)</th>
                    <th>Examen (/20)</th>
                    <th>Finale (/20)</th>
                    <th>Mention</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map(n => {
                    const echec = n.noteFinale < 10;
                    return (
                      <tr key={n.id} style={{ background: echec ? '#FFF0f0' : '' }}>
                        <td style={{ fontWeight: 600 }}>{n.cours?.titre || `Cours ID: ${n.coursId}`}</td>
                        <td>{n.noteTP != null ? n.noteTP : '-'}</td>
                        <td>{n.noteInterrogation != null ? n.noteInterrogation : '-'}</td>
                        <td style={{ fontWeight: 600 }}>{n.noteExamen}</td>
                        <td style={{ fontWeight: 700, color: echec ? '#cc0000' : '#1D9E75' }}>{n.noteFinale}</td>
                        <td>
                          <span className={`badge ${echec ? 'badge-danger' : 'badge-success'}`}>
                            {n.noteFinale >= 14 ? 'Distinction' : n.noteFinale >= 10 ? 'Satisfaction' : 'Ajourné'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Onglet Saisie */}
      {onglet === 'saisir' && peutSaisir && (
        <div className="card">
          <h2 className="card-title">Transmission d'une note d'évaluation</h2>
          <form onSubmit={saisirNote} className="form-grid" style={{ marginTop: 14 }}>
            <div className="form-group">
              <label>ID d'Inscription</label>
              <input type="number" value={formNote.inscriptionId} onChange={e => setFormNote({ ...formNote, inscriptionId: e.target.value })} required placeholder="Ex: 481" />
            </div>
            <div className="form-group">
              <label>ID du Cours</label>
              <input type="number" value={formNote.coursId} onChange={e => setFormNote({ ...formNote, coursId: e.target.value })} required placeholder="Ex: 12" />
            </div>
            <div className="form-group">
              <label>Année Académique</label>
              <input value={formNote.anneeAcademique} onChange={e => setFormNote({ ...formNote, anneeAcademique: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Nombre d'absences</label>
              <input type="number" min="0" value={formNote.nbAbsences} onChange={e => setFormNote({ ...formNote, nbAbsences: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Note TP (/20)</label>
              <input type="number" step="0.01" min="0" max="20" value={formNote.noteTP} onChange={e => setFormNote({ ...formNote, noteTP: e.target.value })} placeholder="Ex: 15.5" />
            </div>
            <div className="form-group">
              <label>Note Interrogation (/20)</label>
              <input type="number" step="0.01" min="0" max="20" value={formNote.noteInterrogation} onChange={e => setFormNote({ ...formNote, noteInterrogation: e.target.value })} placeholder="Ex: 11" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Note d'Examen (/20) *</label>
              <input type="number" step="0.01" min="0" max="20" value={formNote.noteExamen} onChange={e => setFormNote({ ...formNote, noteExamen: e.target.value })} required placeholder="Ex: 14" />
            </div>
            <div style={{ gridColumn: '1 / span 2', padding: '10px', background: '#f4f6f9', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              💡 Le système calculera automatiquement la note finale (30% TP/Continu + 20% Interro + 50% Examen)
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2', marginTop: 10 }}>Valider et soumettre au jury</button>
          </form>
        </div>
      )}

      {/* Onglet Validation */}
      {onglet === 'valider' && peutValider && (
        <div className="card">
          <h2 className="card-title">Notes en attente de validation ({enAttente.length})</h2>
          {enAttente.length === 0 ? (
            <p>Aucune note en attente de validation.</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Étudiant</th>
                    <th>Cours</th>
                    <th>Note</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enAttente.map(n => (
                    <tr key={n.id}>
                      <td>{n.inscription?.prenom} {n.inscription?.nom}</td>
                      <td>{n.cours?.titre}</td>
                      <td style={{ fontWeight: 700 }}>{n.noteFinale}/20</td>
                      <td><span className="badge badge-warning">Soumise</span></td>
                      <td>
                        <button className="btn-success" style={{ marginRight: 6, fontSize: 11 }} onClick={() => validerNote(n.id)}>
                          ✅ Valider
                        </button>
                        <button className="btn-primary" style={{ fontSize: 11 }} onClick={() => publierNote(n.id)}>
                          📢 Publier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Onglet Statistiques */}
      {onglet === 'stats' && (peutSaisir || peutValider) && (
        <div className="card">
          <h2 className="card-title">📊 Statistiques d'un cours</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
              <select value={coursId} onChange={e => setCoursId(e.target.value)}>
                <option value="">-- Sélectionner un cours --</option>
                {cours.map(c => <option key={c.id} value={c.id}>{c.code} - {c.titre}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ width: 150 }}>
              <select value={annee} onChange={e => setAnnee(e.target.value)}>
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>
            <button className="btn-primary" onClick={voirStatsCours} disabled={loading}>
              {loading ? 'Chargement...' : '📊 Voir les stats'}
            </button>
          </div>

          {coursStats && (
            <div className="stats-grid" style={{ marginTop: 20, gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="stat-card">
                <div className="stat-value">{coursStats.moyenneClasse}</div>
                <div className="stat-label">Moyenne de la classe</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{coursStats.nbReussis}</div>
                <div className="stat-label">Réussis</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--color-danger-text)' }}>{coursStats.nbAjournes}</div>
                <div className="stat-label">Ajournés</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: coursStats.tauxReussite >= 70 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                  {coursStats.tauxReussite}%
                </div>
                <div className="stat-label">Taux de réussite</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}