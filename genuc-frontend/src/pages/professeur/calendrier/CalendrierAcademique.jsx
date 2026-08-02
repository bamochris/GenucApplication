// src/pages/professeur/calendrier/CalendrierAcademique.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function CalendrierAcademique() {
  const { user } = useAuth();
  const [evenements, setEvenements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mois, setMois] = useState(new Date().getMonth());
  const [annee, setAnnee] = useState(new Date().getFullYear());

  const moisLabels = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.universiteId]);

  const loadData = async () => {
    try {
      const res = await api.get(`/api/calendrier/universite/${user.universiteId}`);
      setEvenements(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = evenements.filter(e => {
    const date = new Date(e.dateDebut);
    return date.getMonth() === mois && date.getFullYear() === annee;
  });

  const getCouleurEvenement = (couleur) => {
    const map = {
      'ROUGE': '#dc3545',
      'BLEU': '#185FA5',
      'VERT': '#1D9E75',
      'ORANGE': '#ff9800',
      'VIOLET': '#9c27b0',
      'GRIS': '#9e9e9e'
    };
    return map[couleur] || '#185FA5';
  };

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">📅 Calendrier académique</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn-outline" onClick={() => { if (mois === 0) { setMois(11); setAnnee(annee - 1); } else setMois(mois - 1); }}>◀</button>
          <span style={{ fontWeight: 600 }}>{moisLabels[mois]} {annee}</span>
          <button className="btn-outline" onClick={() => { if (mois === 11) { setMois(0); setAnnee(annee + 1); } else setMois(mois + 1); }}>▶</button>
          <button className="btn-outline" onClick={() => { setMois(new Date().getMonth()); setAnnee(new Date().getFullYear()); }}>
            Aujourd'hui
          </button>
        </div>
      </div>

      <div className="card">
        {filteredEvents.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucun événement ce mois-ci</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredEvents.map(e => (
              <div key={e.id} style={{
                padding: '16px',
                borderLeft: `4px solid ${getCouleurEvenement(e.couleur)}`,
                background: 'var(--bg-secondary)',
                borderRadius: 8
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{e.titre}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{e.description}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      {new Date(e.dateDebut).toLocaleDateString('fr-FR')} → {new Date(e.dateFin).toLocaleDateString('fr-FR')}
                      {e.type && <span style={{ marginLeft: 8 }}>• {e.type}</span>}
                    </div>
                  </div>
                  <span className={`badge ${e.actif ? 'badge-success' : 'badge-neutral'}`}>
                    {e.actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}