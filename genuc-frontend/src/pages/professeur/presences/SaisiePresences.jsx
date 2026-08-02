// src/pages/professeur/presences/SaisiePresences.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function SaisiePresences() {
  const { user } = useAuth();
  const [cours, setCours] = useState([]);
  const [selectedCours, setSelectedCours] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [etudiants, setEtudiants] = useState([]);
  const [presences, setPresences] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCours();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadCours = async () => {
    try {
      const res = await api.get(`/api/cours/professeur/${user.id}`);
      setCours(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadEtudiants = async () => {
    if (!selectedCours) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/presences/cours/${selectedCours}/tableau?date=${date}`);
      const liste = res.data.presences || [];
      setEtudiants(liste.map(p => ({ id: p.etudiantId, nom: p.nom, prenom: p.prenom })));

      const presMap = {};
      liste.forEach(p => {
        presMap[p.etudiantId] = { present: p.present, justifie: p.justifie, id: p.presenceId };
      });
      setPresences(presMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCours) loadEtudiants();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [selectedCours, date]);

  const handleToggle = (etudiantId) => {
    setPresences(prev => ({
      ...prev,
      [etudiantId]: {
        ...prev[etudiantId],
        present: !prev[etudiantId]?.present
      }
    }));
  };

  const handleJustifier = (etudiantId) => {
    setPresences(prev => ({
      ...prev,
      [etudiantId]: {
        ...prev[etudiantId],
        justifie: !prev[etudiantId]?.justifie
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const payload = Object.entries(presences).map(([etudiantId, data]) => ({
        etudiantId: parseInt(etudiantId),
        present: data.present || false,
        justifie: data.justifie || false,
        presenceId: data.id || null
      }));
      
      await api.post(`/api/presences/cours/${selectedCours}/saisie`, {
        date,
        presences: payload
      });
      setMessage('✅ Présences enregistrées avec succès');
    } catch (err) {
      setMessage('❌ Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">✅ Saisie des présences</h2>
      </div>

      {message && <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>{message}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
            <label>Cours</label>
            <select
              value={selectedCours}
              onChange={e => setSelectedCours(e.target.value)}
              required
            >
              <option value="">-- Sélectionner --</option>
              {cours.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.titre}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 150 }}>
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={loadEtudiants}>Charger</button>
        </div>
      </div>

      {selectedCours && etudiants.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="card-title" style={{ margin: 0 }}>Liste des étudiants</h3>
            <button className="btn-success" onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement...' : '💾 Enregistrer'}
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Étudiant</th>
                <th>Matricule</th>
                <th>Présent</th>
                <th>Justifié</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {etudiants.map((e, idx) => {
                const p = presences[e.id] || { present: false, justifie: false };
                const statut = p.justifie ? 'Justifié' : p.present ? 'Présent' : 'Absent';
                const couleur = p.justifie ? '#ff9800' : p.present ? '#1D9E75' : '#cc0000';
                return (
                  <tr key={e.id}>
                    <td>{idx + 1}</td>
                    <td>{e.prenom} {e.nom}</td>
                    <td className="uni-code">{e.matricule}</td>
                    <td>
                      <label style={{ cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={p.present}
                          onChange={() => handleToggle(e.id)}
                          disabled={p.justifie}
                        />
                      </label>
                    </td>
                    <td>
                      <label style={{ cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={p.justifie}
                          onChange={() => handleJustifier(e.id)}
                          disabled={p.present}
                        />
                      </label>
                    </td>
                    <td>
                      <span style={{ color: couleur, fontWeight: 600 }}>{statut}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedCours && etudiants.length === 0 && (
        <div className="card">
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
            Aucun étudiant inscrit à ce cours.
          </p>
        </div>
      )}
    </div>
  );
}