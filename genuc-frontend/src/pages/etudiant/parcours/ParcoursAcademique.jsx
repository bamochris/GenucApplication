// src/pages/etudiant/parcours/ParcoursAcademique.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import '../EtudiantDashboard.css';

export default function ParcoursAcademique() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [parcours, setParcours] = useState([]);
  const [stats, setStats] = useState({
    totalCredits: 0,
    nbAnnees: 0,
    moyenneGenerale: 0,
    statutActuel: 'En cours',
    anneeDebut: '',
    anneeFin: '',
    meilleureMoyenne: 0,
    meilleureMention: ''
  });
  const [evolution, setEvolution] = useState([]);

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    if (!inscriptionId) {
      setError("Aucune inscription trouvée");
      setLoading(false);
      return;
    }
    loadParcours();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId]);

  const loadParcours = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/etudiant/portal/${inscriptionId}/parcours`);
      const data = response.data;
      setParcours(data.parcours || []);
      setStats(data.stats || {
        totalCredits: 0,
        nbAnnees: 0,
        moyenneGenerale: 0,
        statutActuel: 'En cours',
        anneeDebut: '',
        anneeFin: '',
        meilleureMoyenne: 0,
        meilleureMention: ''
      });
      setEvolution(data.evolution || []);
    } catch (err) {
      if (err.response?.status === 404) {
        // Pas encore de parcours
        setParcours([]);
        setStats({
          totalCredits: 0,
          nbAnnees: 0,
          moyenneGenerale: 0,
          statutActuel: 'Aucune donnée',
          anneeDebut: '',
          anneeFin: '',
          meilleureMoyenne: 0,
          meilleureMention: ''
        });
        setEvolution([]);
      } else {
        setError(err.response?.data?.erreur || "Erreur de chargement du parcours");
      }
    } finally {
      setLoading(false);
    }
  };

  const getMentionColor = (mention) => {
    const colors = {
      'TRES_GRANDE_DISTINCTION': '#1D9E75',
      'GRANDE_DISTINCTION': '#185FA5',
      'DISTINCTION': '#854F0B',
      'SATISFACTION': '#0F6E56',
      'REUSSITE': '#0B1F4A',
      'AJOURNE': '#cc0000'
    };
    return colors[mention] || '#0B1F4A';
  };

  const getMentionLabel = (mention) => {
    const labels = {
      'TRES_GRANDE_DISTINCTION': 'Très Grande Distinction',
      'GRANDE_DISTINCTION': 'Grande Distinction',
      'DISTINCTION': 'Distinction',
      'SATISFACTION': 'Satisfaction',
      'REUSSITE': 'Réussite',
      'AJOURNE': 'Ajourné'
    };
    return labels[mention] || mention;
  };

  const getDecisionLabel = (decision) => {
    const labels = {
      'ADMIS': 'Admis',
      'ADMIS_RATTRAPAGE': 'Rattrapage',
      'REDOUBLE': 'Redoublement',
      'EXCLU': 'Exclu',
      'DIPLOME': 'Diplômé',
      'EN_ATTENTE': 'En attente'
    };
    return labels[decision] || decision;
  };

  const getDecisionColor = (decision) => {
    const colors = {
      'ADMIS': '#1D9E75',
      'ADMIS_RATTRAPAGE': '#ff9800',
      'REDOUBLE': '#cc0000',
      'EXCLU': '#cc0000',
      'DIPLOME': '#185FA5',
      'EN_ATTENTE': '#888'
    };
    return colors[decision] || '#888';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de votre parcours académique...</p>
      </div>
    );
  }

  return (
    <div className="etudiant-dashboard">
      <div className="section-header">
        <h2 className="section-title">🎓 Parcours Académique</h2>
      </div>

      {error && (
        <div className="alert-erreur">{error}</div>
      )}

      {/* Résumé des statistiques */}
      {parcours.length > 0 && (
        <>
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-icon">🎓</div>
              <div className="stat-content">
                <div className="stat-value">{stats.nbAnnees}</div>
                <div className="stat-label">Années académiques</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalCredits}</div>
                <div className="stat-label">Crédits total acquis</div>
              </div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: stats.moyenneGenerale >= 10 ? '#1D9E75' : '#cc0000' }}>
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value" style={{ color: stats.moyenneGenerale >= 10 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                  {stats.moyenneGenerale.toFixed(2)}
                </div>
                <div className="stat-label">Moyenne générale</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏅</div>
              <div className="stat-content">
                <div className="stat-value" style={{ color: getMentionColor(stats.meilleureMention) }}>
                  {stats.meilleureMention ? getMentionLabel(stats.meilleureMention) : '-'}
                </div>
                <div className="stat-label">Meilleure mention</div>
              </div>
            </div>
          </div>

          {/* Évolution des moyennes */}
          {evolution.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title">📈 Évolution des moyennes</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={evolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="annee" />
                  <YAxis domain={[0, 20]} />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="moyenne" 
                    stroke="#185FA5" 
                    fill="#185FA5" 
                    fillOpacity={0.2}
                    name="Moyenne /20"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="seuil" 
                    stroke="#cc0000" 
                    strokeDasharray="5 5" 
                    name="Seuil (10/20)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Timeline des parcours */}
          <div className="card">
            <h3 className="card-title">📋 Historique des promotions</h3>
            <div style={{ position: 'relative' }}>
              {/* Ligne verticale */}
              <div style={{
                position: 'absolute',
                left: 20,
                top: 0,
                bottom: 0,
                width: 2,
                background: '#e0e0e0',
                zIndex: 0
              }} />

              {parcours.map((p, index) => (
                <div key={index} style={{
                  position: 'relative',
                  paddingLeft: 50,
                  paddingBottom: 24,
                  borderBottom: index < parcours.length - 1 ? '1px solid var(--border-color)' : 'none'
                }}>
                  {/* Cercle de la timeline */}
                  <div style={{
                    position: 'absolute',
                    left: 14,
                    top: 4,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: p.decision === 'DIPLOME' ? '#1D9E75' : 
                               p.decision === 'ADMIS' ? '#185FA5' :
                               p.decision === 'REDOUBLE' ? '#cc0000' : '#ff9800',
                    border: '3px solid white',
                    boxShadow: '0 0 0 2px #e0e0e0',
                    zIndex: 1
                  }} />

                  <div style={{
                    background: p.decision === 'DIPLOME' ? '#f0fdf4' :
                               p.decision === 'ADMIS' ? '#f0f4ff' :
                               p.decision === 'REDOUBLE' ? '#fef2f2' : '#fefce8',
                    borderRadius: 8,
                    padding: 16,
                    border: `1px solid ${getDecisionColor(p.decision)}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                          {p.promotion}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {p.anneeAcademique} • {p.filiere || 'Filière non spécifiée'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: p.moyenne >= 10 ? '#1D9E75' : '#cc0000' }}>
                          {p.moyenne.toFixed(2)}/20
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {p.creditsValides} crédits validés
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                      {p.mention && p.mention !== 'AJOURNE' && (
                        <span style={{
                          padding: '2px 12px',
                          background: getMentionColor(p.mention),
                          color: 'white',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 600
                        }}>
                          {getMentionLabel(p.mention)}
                        </span>
                      )}
                      <span style={{
                        padding: '2px 12px',
                        background: getDecisionColor(p.decision),
                        color: 'white',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600
                      }}>
                        {getDecisionLabel(p.decision)}
                      </span>
                      {p.rang && (
                        <span style={{
                          padding: '2px 12px',
                          background: '#854F0B',
                          color: 'white',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 600
                        }}>
                          Rang #{p.rang}
                        </span>
                      )}
                    </div>

                    {p.commentaireJury && (
                      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        "{p.commentaireJury}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statut actuel */}
          <div className="card" style={{ marginTop: 20, background: 'var(--bg-secondary)' }}>
            <h3 className="card-title">📌 Statut actuel</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Promotion actuelle</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {parcours.length > 0 ? parcours[parcours.length - 1].promotion : '-'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Année académique</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {parcours.length > 0 ? parcours[parcours.length - 1].anneeAcademique : '-'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Statut</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: stats.statutActuel === 'Diplômé' ? '#1D9E75' : '#185FA5' }}>
                  {stats.statutActuel || 'En cours'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Année de début</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {stats.anneeDebut || '-'}
                </div>
              </div>
              {stats.anneeFin && (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Année de fin</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {stats.anneeFin}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {parcours.length === 0 && !error && (
        <div className="card">
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎓</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Aucun parcours enregistré</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Vous n'avez pas encore de parcours académique enregistré.
              <br />
              Les données apparaîtront après votre première délibération.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
