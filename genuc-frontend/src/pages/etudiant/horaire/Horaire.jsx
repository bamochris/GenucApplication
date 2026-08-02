// src/pages/etudiant/horaire/Horaire.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../EtudiantDashboard.css';

export default function Horaire() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [vue, setVue] = useState('semaine'); // 'semaine' | 'mois' | 'examens'
  const [semaineActuelle, setSemaineActuelle] = useState(0);
  const [moisActuel, setMoisActuel] = useState(new Date().getMonth());
  const [anneeActuelle, setAnneeActuelle] = useState(new Date().getFullYear());
  const [horaires, setHoraires] = useState([]);
  const [examens, setExamens] = useState([]);
  const [evenements, setEvenements] = useState([]);

  const inscriptionId = user?.inscriptionId;

  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const creneaux = ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00'];
  const moisLabels = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  useEffect(() => {
    if (inscriptionId) {
      loadData();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId]);

  const loadData = async () => {
    try {
      const [horaireRes, examenRes, eventRes] = await Promise.all([
        api.get(`/api/etudiant/portal/${inscriptionId}/horaire`).catch(() => ({ data: [] })),
        api.get(`/api/etudiant/portal/${inscriptionId}/examens`).catch(() => ({ data: [] })),
        api.get(`/api/etudiant/portal/${inscriptionId}/evenements`).catch(() => ({ data: [] }))
      ]);
      setHoraires(horaireRes.data || []);
      setExamens(examenRes.data || []);
      setEvenements(eventRes.data || []);
    } catch (err) {
      console.error('Erreur chargement horaire:', err);
      setMessage('❌ Erreur lors du chargement de l\'emploi du temps');
    } finally {
      setLoading(false);
    }
  };


  const getCoursForSlot = (jour, heure) => {
    return horaires.filter(h => h.jour === jour && h.heureDebut === heure);
  };

  const getStatutCours = (date) => {
    const today = new Date();
    const coursDate = new Date(date);
    if (coursDate < today) return 'done';
    if (coursDate.toDateString() === today.toDateString()) return 'active';
    return 'pending';
  };

  const getCouleurEvenement = (type) => {
    const map = {
      'EXAMEN': '#cc0000',
      'DEVOIR': '#ff9800',
      'CONFERENCE': '#185FA5',
      'REUNION': '#1D9E75',
      'AUTRE': '#888'
    };
    return map[type] || '#888';
  };

  // Navigation entre les semaines
  const semainePrecedente = () => setSemaineActuelle(semaineActuelle - 1);
  const semaineSuivante = () => setSemaineActuelle(semaineActuelle + 1);
  const semaineActuelleLabel = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1) + semaineActuelle * 7);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return `${startOfWeek.toLocaleDateString('fr-FR')} - ${endOfWeek.toLocaleDateString('fr-FR')}`;
  };

  // Navigation entre les mois
  const moisPrecedent = () => {
    if (moisActuel === 0) {
      setMoisActuel(11);
      setAnneeActuelle(anneeActuelle - 1);
    } else {
      setMoisActuel(moisActuel - 1);
    }
  };
  const moisSuivant = () => {
    if (moisActuel === 11) {
      setMoisActuel(0);
      setAnneeActuelle(anneeActuelle + 1);
    } else {
      setMoisActuel(moisActuel + 1);
    }
  };

  const getJoursMois = () => {
    const joursDansMois = new Date(anneeActuelle, moisActuel + 1, 0).getDate();
    const premierJour = new Date(anneeActuelle, moisActuel, 1).getDay();
    const jours = [];
    // Ajuster pour commencer par lundi (1) au lieu de dimanche (0)
    const decalage = premierJour === 0 ? 6 : premierJour - 1;
    for (let i = 0; i < decalage; i++) {
      jours.push(null);
    }
    for (let i = 1; i <= joursDansMois; i++) {
      jours.push(i);
    }
    return jours;
  };

  const getEvenementsJour = (jour) => {
    if (!jour) return [];
    return evenements.filter(e => {
      const eDate = new Date(e.date);
      return eDate.getDate() === jour && eDate.getMonth() === moisActuel && eDate.getFullYear() === anneeActuelle;
    });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de votre emploi du temps...</p>
      </div>
    );
  }

  return (
    <div className="etudiant-dashboard">
      <div className="section-header">
        <h2 className="section-title">📅 Horaire</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            className={vue === 'semaine' ? 'btn-primary' : 'btn-outline'} 
            onClick={() => setVue('semaine')}
          >
            Semaine
          </button>
          <button 
            className={vue === 'mois' ? 'btn-primary' : 'btn-outline'} 
            onClick={() => setVue('mois')}
          >
            Mois
          </button>
          <button 
            className={vue === 'examens' ? 'btn-primary' : 'btn-outline'} 
            onClick={() => setVue('examens')}
          >
            📋 Examens
          </button>
        </div>
      </div>

      {message && (
        <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>
          {message}
        </div>
      )}

      {/* Vue Semaine */}
      {vue === 'semaine' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="card-title" style={{ margin: 0 }}>Emploi du temps hebdomadaire</h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn-outline" onClick={semainePrecedente}>◀</button>
              <span style={{ fontWeight: 600 }}>{semaineActuelleLabel()}</span>
              <button className="btn-outline" onClick={semaineSuivante}>▶</button>
              <button className="btn-outline" onClick={() => setSemaineActuelle(0)}>Aujourd'hui</button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 80, background: 'var(--bg-secondary)' }}>Heure</th>
                  {jours.map(j => (
                    <th key={j} style={{ minWidth: 100 }}>
                      {j}
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>
                        {new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + (new Date().getDay() === 0 ? -6 : 1) + jours.indexOf(j) + semaineActuelle * 7))
                          .toLocaleDateString('fr-FR')}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {creneaux.map(heure => (
                  <tr key={heure}>
                    <td style={{ fontWeight: 600, background: 'var(--bg-secondary)' }}>{heure}</td>
                    {jours.map(jour => {
                      const cours = getCoursForSlot(jour, heure);
                      return (
                        <td key={`${jour}-${heure}`} style={{ padding: 4, verticalAlign: 'top' }}>
                          {cours.map(c => {
                            const statut = getStatutCours(c.date);
                            return (
                              <div key={c.id} style={{
                                background: statut === 'active' ? '#E1F5EE' : statut === 'done' ? '#f0f0f0' : '#fff3cd',
                                padding: '6px 8px',
                                borderRadius: 4,
                                marginBottom: 4,
                                borderLeft: `3px solid ${statut === 'active' ? '#1D9E75' : statut === 'done' ? '#888' : '#ff9800'}`
                              }}>
                                <div style={{ fontWeight: 600, fontSize: 12 }}>{c.titre}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.salle || 'Salle à définir'}</div>
                                <div style={{ fontSize: 10, color: statut === 'active' ? '#1D9E75' : statut === 'done' ? '#888' : '#ff9800' }}>
                                  {statut === 'active' ? '● En cours' : statut === 'done' ? '✓ Terminé' : '◯ À venir'}
                                </div>
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 12, flexWrap: 'wrap' }}>
            <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#E1F5EE', borderRadius: 2, marginRight: 4 }}></span> En cours</span>
            <span><span style={{ display: 'inline-block', width: 12, height: 12, background: 'var(--bg-secondary)', borderRadius: 2, marginRight: 4 }}></span> Terminé</span>
            <span><span style={{ display: 'inline-block', width: 12, height: 12, background: 'rgba(192,122,43,0.15)', borderRadius: 2, marginRight: 4 }}></span> À venir</span>
          </div>
        </div>
      )}

      {/* Vue Mois */}
      {vue === 'mois' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="card-title" style={{ margin: 0 }}>Calendrier mensuel</h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn-outline" onClick={moisPrecedent}>◀</button>
              <span style={{ fontWeight: 600 }}>{moisLabels[moisActuel]} {anneeActuelle}</span>
              <button className="btn-outline" onClick={moisSuivant}>▶</button>
              <button className="btn-outline" onClick={() => { setMoisActuel(new Date().getMonth()); setAnneeActuelle(new Date().getFullYear()); }}>
                Aujourd'hui
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {jours.map(j => (
                    <th key={j} style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>
                      {j.substring(0, 2)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const joursMois = getJoursMois();
                  const rows = [];
                  for (let i = 0; i < joursMois.length; i += 7) {
                    rows.push(joursMois.slice(i, i + 7));
                  }
                  return rows.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {row.map((jour, colIdx) => {
                        const isToday = jour && 
                          new Date(anneeActuelle, moisActuel, jour).toDateString() === new Date().toDateString();
                        const evenementsJour = jour ? getEvenementsJour(jour) : [];
                        return (
                          <td key={colIdx} style={{
                            padding: '6px',
                            textAlign: 'center',
                            border: '1px solid var(--border-color)',
                            background: isToday ? '#E6F1FB' : 'white',
                            minWidth: '80px',
                            height: '80px',
                            verticalAlign: 'top'
                          }}>
                            <div style={{ fontWeight: isToday ? 700 : 400, color: isToday ? '#185FA5' : '#333' }}>
                              {jour || ''}
                            </div>
                            {evenementsJour.length > 0 && (
                              <div style={{ marginTop: 4 }}>
                                {evenementsJour.slice(0, 2).map((e, idx) => (
                                  <div key={idx} style={{
                                    fontSize: 9,
                                    padding: '2px 4px',
                                    background: getCouleurEvenement(e.type),
                                    color: 'white',
                                    borderRadius: 2,
                                    marginBottom: 2,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {e.titre}
                                  </div>
                                ))}
                                {evenementsJour.length > 2 && (
                                  <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>
                                    +{evenementsJour.length - 2}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 12, flexWrap: 'wrap' }}>
            <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#E6F1FB', borderRadius: 2, marginRight: 4 }}></span> Aujourd'hui</span>
            <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#cc0000', borderRadius: 2, marginRight: 4 }}></span> Examen</span>
            <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#ff9800', borderRadius: 2, marginRight: 4 }}></span> Devoir</span>
            <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#185FA5', borderRadius: 2, marginRight: 4 }}></span> Conférence</span>
          </div>
        </div>
      )}

      {/* Vue Examens */}
      {vue === 'examens' && (
        <div className="card">
          <h3 className="card-title">📋 Calendrier des examens</h3>
          {examens.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
              Aucun examen planifié pour le moment.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {examens.map(e => {
                const dateExamen = new Date(e.date);
                const joursRestant = Math.ceil((dateExamen - new Date()) / (1000 * 60 * 60 * 24));
                const estUrgent = joursRestant <= 3 && joursRestant >= 0;
                const estPasse = joursRestant < 0;
                return (
                  <div key={e.id} style={{
                    padding: '16px',
                    background: estUrgent ? '#fff3cd' : estPasse ? '#f0f0f0' : '#f8fafc',
                    borderRadius: 8,
                    borderLeft: `4px solid ${estUrgent ? '#cc0000' : estPasse ? '#888' : '#185FA5'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 10
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{e.titre}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{e.cours} • {e.coefficient} coeff.</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        📅 {dateExamen.toLocaleDateString('fr-FR')} • ⏰ {e.heure || 'Horaire à définir'} • 📍 {e.salle || 'Salle à définir'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {!estPasse && (
                        <span style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: estUrgent ? '#cc0000' : '#185FA5'
                        }}>
                          {joursRestant === 0 ? "Aujourd'hui !" : `J-${joursRestant}`}
                        </span>
                      )}
                      {estPasse && (
                        <span className="badge badge-neutral">Passé</span>
                      )}
                      {estUrgent && !estPasse && (
                        <div style={{ fontSize: 11, color: '#cc0000', marginTop: 4 }}>⚠️ Urgent</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
