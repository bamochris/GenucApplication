// src/pages/etudiant/resultats/Deliberation.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../EtudiantDashboard.css';

export default function Deliberation() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deliberation, setDeliberation] = useState(null);
  const [annee, setAnnee] = useState('');
  const [anneesDisponibles, setAnneesDisponibles] = useState([]);
  const [details, setDetails] = useState(false);

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    if (!inscriptionId) {
      setError("Aucune inscription trouvée");
      setLoading(false);
      return;
    }
    loadAnneesDisponibles();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId]);

  const loadAnneesDisponibles = async () => {
    try {
      const res = await api.get(`/api/etudiant/portal/${inscriptionId}/annees-disponibles`);
      setAnneesDisponibles(res.data || ['2024-2025', '2025-2026']);
      if (res.data && res.data.length > 0) {
        setAnnee(res.data[0]);
      }
    } catch (err) {
      console.error('Erreur chargement années:', err);
      setAnneesDisponibles(['2024-2025', '2025-2026']);
      setAnnee('2024-2025');
    }
  };

  useEffect(() => {
    if (inscriptionId && annee) {
      loadDeliberation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId, annee]);

  const loadDeliberation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/deliberations/etudiant/${inscriptionId}/${annee}`);
      setDeliberation(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setDeliberation(null);
      } else {
        setError(err.response?.data?.erreur || "Erreur de chargement de la délibération");
      }
    } finally {
      setLoading(false);
    }
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

  const getDecisionIcon = (decision) => {
    const icons = {
      'ADMIS': '✅',
      'ADMIS_RATTRAPAGE': '📘',
      'REDOUBLE': '🔄',
      'EXCLU': '❌',
      'DIPLOME': '🎓',
      'EN_ATTENTE': '⏳'
    };
    return icons[decision] || '📌';
  };

  const getDecisionLabel = (decision) => {
    const labels = {
      'ADMIS': 'Admis',
      'ADMIS_RATTRAPAGE': 'Admis avec rattrapage',
      'REDOUBLE': 'Redoublement',
      'EXCLU': 'Exclusion académique',
      'DIPLOME': 'Diplômé',
      'EN_ATTENTE': 'En attente'
    };
    return labels[decision] || decision;
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

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement des résultats de délibération...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="etudiant-dashboard">
        <div className="alert-erreur">{error}</div>
        <button className="btn-outline" onClick={loadDeliberation}>🔄 Réessayer</button>
      </div>
    );
  }

  return (
    <div className="etudiant-dashboard">
      <div className="section-header">
        <h2 className="section-title">🏆 Délibération</h2>
        {deliberation && deliberation.pdfDisponible && (
          <button 
            className="btn-primary" 
            onClick={async () => {
              try {
                const response = await api.get(`/api/deliberation/etudiant/pdf?anneeAcademique=${annee}`, {
                  responseType: 'blob'
                });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `releve_deliberation_${annee}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
              } catch (err) {
                setError('Erreur lors du téléchargement du PV de délibération.');
              }
            }}
          >
            📄 Télécharger le PV
          </button>
        )}
      </div>

      {/* Filtre année */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 600, fontSize: 13 }}>Année académique :</label>
          <select 
            value={annee} 
            onChange={e => setAnnee(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border-color)', minWidth: 150 }}
          >
            {anneesDisponibles.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button className="btn-outline" onClick={loadDeliberation} style={{ marginLeft: 'auto' }}>
            🔄 Rafraîchir
          </button>
        </div>
      </div>

      {!deliberation ? (
        <div className="card">
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⏳</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Aucune délibération disponible</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Les résultats de délibération pour l'année {annee} ne sont pas encore disponibles.
              <br />
              Veuillez revenir après la publication des résultats par l'administration.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Carte principale de décision */}
          <div className="card" style={{
            background: deliberation.decision === 'DIPLOME' ? 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' :
                       deliberation.decision === 'ADMIS' ? 'linear-gradient(135deg, #e3f2fd, #bbdefb)' :
                       deliberation.decision === 'REDOUBLE' || deliberation.decision === 'EXCLU' ? 'linear-gradient(135deg, #fce4ec, #f8bbd0)' :
                       'linear-gradient(135deg, #fff3e0, #ffe0b2)',
            padding: 30,
            textAlign: 'center',
            marginBottom: 20,
            border: `4px solid ${getDecisionColor(deliberation.decision)}`
          }}>
            <div style={{ fontSize: 72, marginBottom: 12 }}>{getDecisionIcon(deliberation.decision)}</div>
            <h2 style={{ color: getDecisionColor(deliberation.decision), marginBottom: 8, fontSize: 28 }}>
              {getDecisionLabel(deliberation.decision)}
            </h2>
            {deliberation.mention && deliberation.mention !== 'AJOURNE' && (
              <div style={{ 
                display: 'inline-block',
                padding: '8px 24px',
                background: getMentionColor(deliberation.mention),
                color: 'white',
                borderRadius: 20,
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 12
              }}>
                {getMentionLabel(deliberation.mention)}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 30, marginTop: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Moyenne générale</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: deliberation.moyenneGenerale >= 10 ? '#1D9E75' : '#cc0000' }}>
                  {deliberation.moyenneGenerale?.toFixed(2) || '-'}/20
                </div>
              </div>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Crédits validés</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#185FA5' }}>
                  {deliberation.creditsValides || 0}/{deliberation.creditsRequis || 60}
                </div>
              </div>
              {deliberation.coursReussis !== undefined && (
                <div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Cours réussis</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#1D9E75' }}>
                    {deliberation.coursReussis || 0}/{deliberation.coursTotaux || 0}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Détails supplémentaires */}
          <button 
            className="btn-outline" 
            onClick={() => setDetails(!details)}
            style={{ marginBottom: 16 }}
          >
            {details ? '▲ Masquer les détails' : '▼ Voir les détails'}
          </button>

          {details && (
            <div className="card">
              <h3 className="card-title">📋 Détails de la délibération</h3>
              <div className="detail-grid">
                <div>
                  <div className="detail-lbl">Année académique</div>
                  <div>{deliberation.anneeAcademique}</div>
                </div>
                <div>
                  <div className="detail-lbl">Niveau</div>
                  <div>{deliberation.niveau || '-'}</div>
                </div>
                <div>
                  <div className="detail-lbl">Date de délibération</div>
                  <div>{deliberation.dateDeliberation ? new Date(deliberation.dateDeliberation).toLocaleDateString('fr-FR') : 'Non publiée'}</div>
                </div>
                <div>
                  <div className="detail-lbl">Président du jury</div>
                  <div>{deliberation.presidentJuryNom || 'Non spécifié'}</div>
                </div>
                <div style={{ gridColumn: '1 / span 2' }}>
                  <div className="detail-lbl">Commentaire du jury</div>
                  <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>{deliberation.commentaireJury || 'Aucun commentaire'}</div>
                </div>
                {deliberation.codeDiplome && (
                  <div style={{ gridColumn: '1 / span 2' }}>
                    <div className="detail-lbl">Code du diplôme</div>
                    <div style={{ fontWeight: 700, color: '#185FA5' }}>{deliberation.codeDiplome}</div>
                  </div>
                )}
                {deliberation.niveauSuivant && (
                  <div style={{ gridColumn: '1 / span 2' }}>
                    <div className="detail-lbl">Prochaine promotion</div>
                    <div style={{ fontWeight: 600, color: '#1D9E75' }}>{deliberation.niveauSuivant}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Décision à prendre pour l'étudiant */}
          {deliberation.decision === 'ADMIS_RATTRAPAGE' && (
            <div className="card" style={{ marginTop: 16, background: 'rgba(192,122,43,0.15)', border: '1px solid #ffe082' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>📘</span>
                <div>
                  <h4 style={{ margin: 0, color: '#856404' }}>Rattrapage</h4>
                  <p style={{ margin: '4px 0 0', color: '#856404', fontSize: 13 }}>
                    Vous devez passer les examens de rattrapage pour valider votre année.
                    Les dates seront communiquées par l'administration.
                  </p>
                </div>
              </div>
            </div>
          )}

          {deliberation.decision === 'REDOUBLE' && (
            <div className="card" style={{ marginTop: 16, background: 'rgba(220,53,69,0.10)', border: '1px solid #ef9a9a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>🔄</span>
                <div>
                  <h4 style={{ margin: 0, color: '#c62828' }}>Redoublement</h4>
                  <p style={{ margin: '4px 0 0', color: '#c62828', fontSize: 13 }}>
                    Vous devrez redoubler cette année académique. 
                    Veuillez vous rapprocher du service de scolarité pour les modalités.
                  </p>
                </div>
              </div>
            </div>
          )}

          {deliberation.decision === 'EXCLU' && (
            <div className="card" style={{ marginTop: 16, background: 'rgba(220,53,69,0.10)', border: '1px solid #ef9a9a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>❌</span>
                <div>
                  <h4 style={{ margin: 0, color: '#c62828' }}>Exclusion académique</h4>
                  <p style={{ margin: '4px 0 0', color: '#c62828', fontSize: 13 }}>
                    Vous avez été exclu de l'université. Veuillez contacter l'administration 
                    pour plus d'informations sur les procédures de recours.
                  </p>
                </div>
              </div>
            </div>
          )}

          {deliberation.decision === 'DIPLOME' && (
            <div className="card" style={{ marginTop: 16, background: 'rgba(29,158,117,0.12)', border: '1px solid #a5d6a7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>🎉</span>
                <div>
                  <h4 style={{ margin: 0, color: '#1D9E75' }}>Félicitations !</h4>
                  <p style={{ margin: '4px 0 0', color: '#1D9E75', fontSize: 13 }}>
                    Vous êtes diplômé ! Votre diplôme sera disponible prochainement.
                    Vous pouvez télécharger votre attestation de réussite dans la section Documents.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
