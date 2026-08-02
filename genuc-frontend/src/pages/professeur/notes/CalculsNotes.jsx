// src/pages/professeur/notes/CalculsNotes.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function CalculsNotes() {
  const { user } = useAuth();
  const [cours, setCours] = useState([]);
  const [selectedCours, setSelectedCours] = useState('');
  const [etudiants, setEtudiants] = useState([]);
  const [notes, setNotes] = useState({});
  const [bareme, setBareme] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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

  const loadData = async (coursId) => {
    setLoading(true);
    try {
      const coursSelectionne = cours.find(c => String(c.id) === String(coursId));
      const annee = coursSelectionne?.anneeAcademique || '2024-2025';

      const [etudiantsRes, notesRes, baremeRes] = await Promise.all([
        api.get(`/api/cours/${coursId}/etudiants`),
        api.get(`/api/notes/cours/${coursId}/${annee}`),
        api.get(`/api/baremes/cours/${coursId}`).catch(() => null)
      ]);
      setEtudiants(etudiantsRes.data);
      setBareme(baremeRes && baremeRes.data ? baremeRes.data : null);

      const notesMap = {};
      notesRes.data.forEach(n => {
        notesMap[n.inscriptionId] = {
          tp: n.noteTP || 0,
          interro: n.noteInterrogation || 0,
          examen: n.noteExamen || 0,
          id: n.id
        };
      });
      setNotes(notesMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCours = (e) => {
    const id = e.target.value;
    setSelectedCours(id);
    if (id) loadData(id);
  };

  const handleNoteChange = (etudiantId, field, value) => {
    setNotes(prev => ({
      ...prev,
      [etudiantId]: {
        ...prev[etudiantId],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const calculateFinale = (tp, interro, examen, bareme) => {
    const ponderationTP = bareme?.ponderationTP ?? 30;
    const ponderationInterro = bareme?.ponderationInterro ?? 20;
    const ponderationExamen = bareme?.ponderationExamen ?? 50;
    const total = (tp * ponderationTP + interro * ponderationInterro + examen * ponderationExamen) / 100;
    return Math.round(total * 100) / 100;
  };

  const handleSaveAll = async () => {
    setMessage('');
    try {
      const coursSelectionne = cours.find(c => String(c.id) === String(selectedCours));
      const annee = coursSelectionne?.anneeAcademique || '2024-2025';
      const payload = Object.entries(notes).map(([etudiantId, data]) => ({
        inscriptionId: parseInt(etudiantId),
        noteTP: data.tp,
        noteInterrogation: data.interro,
        noteExamen: data.examen
      }));
      await api.post(`/api/notes/cours/${selectedCours}/calcul`, {
        anneeAcademique: annee,
        notes: payload
      });
      setMessage('✅ Toutes les notes ont été calculées et enregistrées');
    } catch (err) {
      setMessage('❌ Erreur lors de l\'enregistrement');
    }
  };

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">🧮 Calcul automatique des notes</h2>
      </div>

      {message && <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>{message}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 600 }}>Cours :</label>
          <select
            value={selectedCours}
            onChange={handleSelectCours}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', minWidth: 200 }}
          >
            <option value="">-- Sélectionner --</option>
            {cours.map(c => (
              <option key={c.id} value={c.id}>{c.code} - {c.titre}</option>
            ))}
          </select>
          {selectedCours && (
            <button className="btn-primary" onClick={() => loadData(selectedCours)}>🔄 Rafraîchir</button>
          )}
        </div>
      </div>

      {selectedCours && etudiants.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="card-title" style={{ margin: 0 }}>Saisie des composantes</h3>
            <button className="btn-success" onClick={handleSaveAll}>💾 Enregistrer tout</button>
          </div>

          {bareme && (
            <div style={{ padding: '12px', background: 'rgba(24,95,165,0.12)', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              📊 Barème : TP {bareme.ponderationTP}% / Interro {bareme.ponderationInterro}% / Examen {bareme.ponderationExamen}%
            </div>
          )}

          <table className="data-table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Matricule</th>
                <th>TP /20</th>
                <th>Interro /20</th>
                <th>Examen /20</th>
                <th>Finale /20</th>
              </tr>
            </thead>
            <tbody>
              {etudiants.map(etu => {
                const n = notes[etu.id] || { tp: 0, interro: 0, examen: 0 };
                const finale = calculateFinale(n.tp, n.interro, n.examen, bareme);
                return (
                  <tr key={etu.id}>
                    <td>{etu.prenom} {etu.nom}</td>
                    <td className="uni-code">{etu.matricule}</td>
                    <td>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        max="20"
                        value={n.tp || ''}
                        onChange={e => handleNoteChange(etu.id, 'tp', e.target.value)}
                        style={{ width: 60, padding: '4px', borderRadius: 4, border: '1px solid #ddd' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        max="20"
                        value={n.interro || ''}
                        onChange={e => handleNoteChange(etu.id, 'interro', e.target.value)}
                        style={{ width: 60, padding: '4px', borderRadius: 4, border: '1px solid #ddd' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        max="20"
                        value={n.examen || ''}
                        onChange={e => handleNoteChange(etu.id, 'examen', e.target.value)}
                        style={{ width: 60, padding: '4px', borderRadius: 4, border: '1px solid #ddd' }}
                      />
                    </td>
                    <td style={{ fontWeight: 700, color: finale >= 10 ? '#1D9E75' : '#cc0000' }}>
                      {finale.toFixed(2)}
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
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucun étudiant inscrit à ce cours.</p>
        </div>
      )}
    </div>
  );
}