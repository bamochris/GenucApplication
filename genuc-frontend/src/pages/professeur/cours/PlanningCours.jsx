// src/pages/professeur/cours/PlanningCours.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function PlanningCours() {
  const { user } = useAuth();
  const [planning, setPlanning] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemaine, setSelectedSemaine] = useState(0);
  const [message, setMessage] = useState('');

  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const heures = ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00'];

  useEffect(() => {
    loadPlanning();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadPlanning = async () => {
    try {
      const res = await api.get(`/api/professeur/planning/${user.id}`);
      setPlanning(res.data);
      setMessage('');
    } catch (err) {
      console.error(err);
      setMessage("❌ Impossible de charger le planning des cours");
    } finally {
      setLoading(false);
    }
  };

  const getCoursForSlot = (jour, heure) => {
    return planning.filter(p => p.jour === jour && p.heureDebut === heure);
  };

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement du planning...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">📅 Planning des cours</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" onClick={() => setSelectedSemaine(selectedSemaine - 1)}>◀ Semaine précédente</button>
          <span style={{ padding: '8px 16px', background: 'var(--bg-secondary)', borderRadius: 8 }}>Semaine {selectedSemaine + 1}</span>
          <button className="btn-outline" onClick={() => setSelectedSemaine(selectedSemaine + 1)}>Semaine suivante ▶</button>
        </div>
      </div>

      {message && <div className="alert-erreur">{message}</div>}

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ minWidth: 80 }}>Heure</th>
              {jours.map(j => <th key={j}>{j}</th>)}
            </tr>
          </thead>
          <tbody>
            {heures.map(h => (
              <tr key={h}>
                <td style={{ fontWeight: 600, background: 'var(--bg-secondary)' }}>{h}</td>
                {jours.map(j => {
                  const cours = getCoursForSlot(j, h);
                  return (
                    <td key={`${j}-${h}`} style={{ padding: 4 }}>
                      {cours.map(c => (
                        <div key={c.id} style={{
                          background: c.statut === 'ACTIF' ? '#E1F5EE' : '#f0f0f0',
                          padding: '6px 8px',
                          borderRadius: 4,
                          marginBottom: 4,
                          fontSize: 12
                        }}>
                          <div style={{ fontWeight: 600 }}>{c.code}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.salle} • {c.nbEtudiants} étudiants</div>
                          <div style={{ fontSize: 10, color: c.statut === 'ACTIF' ? '#1D9E75' : '#888' }}>
                            {c.statut === 'ACTIF' ? '✅ Actif' : c.statut === 'TERMINE' ? '✅ Terminé' : '⏳ Planifié'}
                          </div>
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}