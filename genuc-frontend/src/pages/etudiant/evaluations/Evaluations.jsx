// src/pages/etudiant/evaluations/Evaluations.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../EtudiantDashboard.css';

export default function Evaluations() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [coursList, setCoursList] = useState([]);
  const [filterCours, setFilterCours] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const inscriptionId = user?.inscriptionId;

  const typesEvaluation = ['INTERROGATION', 'TP', 'TD', 'EXAMEN'];

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
      const [evalRes, coursRes] = await Promise.all([
        api.get(`/api/etudiant/portal/${inscriptionId}/evaluations`).catch(() => ({ data: [] })),
        api.get(`/api/etudiant/portal/${inscriptionId}/cours`).catch(() => ({ data: [] }))
      ]);
      setEvaluations(evalRes.data || []);
      setCoursList(coursRes.data || []);
    } catch (err) {
      console.error('Erreur chargement évaluations:', err);
      setMessage('❌ Erreur lors du chargement des évaluations');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'INTERROGATION': return '📝';
      case 'TP': return '🧪';
      case 'TD': return '📋';
      case 'EXAMEN': return '📄';
      default: return '📌';
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'INTERROGATION': return 'Interrogation';
      case 'TP': return 'Travaux Pratiques';
      case 'TD': return 'Travaux Dirigés';
      case 'EXAMEN': return 'Examen';
      default: return type;
    }
  };

  const getStatutBadge = (statut) => {
    switch(statut) {
      case 'PLANIFIE': return 'badge-neutral';
      case 'EN_COURS': return 'badge-warning';
      case 'TERMINE': return 'badge-success';
      case 'ANNULE': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  const getStatutLabel = (statut) => {
    switch(statut) {
      case 'PLANIFIE': return '⏳ Planifié';
      case 'EN_COURS': return '🔄 En cours';
      case 'TERMINE': return '✅ Terminé';
      case 'ANNULE': return '❌ Annulé';
      default: return statut;
    }
  };

  const evaluationsFiltrees = evaluations.filter(e => {
    const matchCours = filterCours ? e.coursId === parseInt(filterCours) : true;
    const matchType = filterType ? e.type === filterType : true;
    const matchStatut = filterStatut ? e.statut === filterStatut : true;
    return matchCours && matchType && matchStatut;
  });

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de vos évaluations...</p>
      </div>
    );
  }

  return (
    <div className="etudiant-dashboard">
      <div className="section-header">
        <h2 className="section-title">📝 Évaluations</h2>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {evaluations.length} évaluations
        </span>
      </div>

      {message && (
        <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>
          {message}
        </div>
      )}

      {/* Résumé des évaluations */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {typesEvaluation.map(type => {
          const count = evaluations.filter(e => e.type === type).length;
          const terminees = evaluations.filter(e => e.type === type && e.statut === 'TERMINE').length;
          return (
            <div key={type} className="stat-card">
              <div className="stat-icon">{getTypeIcon(type)}</div>
              <div className="stat-content">
                <div className="stat-value">{count}</div>
                <div className="stat-label">{getTypeLabel(type)}</div>
                <div className="stat-detail" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {terminees} terminée{terminees > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtres */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 150 }}>
            <label style={{ fontSize: 11 }}>Cours</label>
            <select
              value={filterCours}
              onChange={e => setFilterCours(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd' }}
            >
              <option value="">Tous les cours</option>
              {coursList.map(c => (
                <option key={c.id} value={c.id}>{c.code}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 150 }}>
            <label style={{ fontSize: 11 }}>Type</label>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd' }}
            >
              <option value="">Tous</option>
              {typesEvaluation.map(t => (
                <option key={t} value={t}>{getTypeLabel(t)}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 150 }}>
            <label style={{ fontSize: 11 }}>Statut</label>
            <select
              value={filterStatut}
              onChange={e => setFilterStatut(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd' }}
            >
              <option value="">Tous</option>
              <option value="PLANIFIE">Planifié</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINE">Terminé</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>
          <button className="btn-outline" style={{ marginBottom: 0 }} onClick={() => { setFilterCours(''); setFilterType(''); setFilterStatut(''); }}>
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Liste des évaluations */}
      <div className="card">
        {evaluationsFiltrees.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
            {evaluations.length === 0 
              ? 'Aucune évaluation planifiée pour le moment.'
              : 'Aucune évaluation ne correspond à vos critères.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {evaluationsFiltrees.map(e => {
              const dateEval = new Date(e.date);
              const joursRestant = Math.ceil((dateEval - new Date()) / (1000 * 60 * 60 * 24));
              const estUrgent = joursRestant <= 3 && joursRestant >= 0 && e.statut === 'PLANIFIE';
              const estPasse = joursRestant < 0 && e.statut === 'PLANIFIE';

              return (
                <div key={e.id} style={{
                  padding: '16px',
                  background: estUrgent ? '#fff3cd' : estPasse ? '#f0f0f0' : '#f8fafc',
                  borderRadius: 8,
                  borderLeft: `4px solid ${estUrgent ? '#cc0000' : estPasse ? '#888' : '#185FA5'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 10
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 24 }}>{getTypeIcon(e.type)}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 16 }}>{e.titre}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {e.coursTitre} ({e.coursCode})
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                      <span>📅 {dateEval.toLocaleDateString('fr-FR')}</span>
                      {e.heure && <span>⏰ {e.heure}</span>}
                      {e.salle && <span>📍 {e.salle}</span>}
                      <span>📊 Coeff. {e.coefficient || 1}</span>
                      {e.duree && <span>⏱️ {e.duree} min</span>}
                    </div>
                    {e.description && (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>{e.description}</p>
                    )}
                    {e.bareme && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        Barème : TP {e.bareme.ponderationTP}% • Interro {e.bareme.ponderationInterro}% • Examen {e.bareme.ponderationExamen}%
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 120 }}>
                    <div style={{ marginBottom: 4 }}>
                      <span className={`badge ${getStatutBadge(e.statut)}`}>
                        {getStatutLabel(e.statut)}
                      </span>
                    </div>
                    {e.statut === 'PLANIFIE' && !estPasse && (
                      <div style={{ fontSize: 13, fontWeight: 700, color: estUrgent ? '#cc0000' : '#185FA5' }}>
                        {joursRestant === 0 ? "Aujourd'hui !" : `J-${joursRestant}`}
                      </div>
                    )}
                    {e.statut === 'TERMINE' && e.note && (
                      <div style={{ marginTop: 4 }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: e.note >= 10 ? '#1D9E75' : '#cc0000' }}>
                          {e.note}/20
                        </span>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {e.mention || 'Mention non attribuée'}
                        </div>
                      </div>
                    )}
                    {e.statut === 'TERMINE' && !e.note && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        Note non encore publiée
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
