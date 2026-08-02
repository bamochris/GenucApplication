// src/pages/professeur/stages/SuiviStages.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function SuiviStages() {
  const { user } = useAuth();
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [rapport, setRapport] = useState(null);
  const [avis, setAvis] = useState('');

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadData = async () => {
    try {
      const res = await api.get(`/api/stages/suivi/${user.id}`);
      setStages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRapport = async (stageId) => {
    try {
      const res = await api.get(`/api/stages/${stageId}/rapport`);
      setRapport(res.data);
    } catch (err) {
      setRapport(null);
    }
  };

  const handleSelect = (stage) => {
    setSelected(stage);
    loadRapport(stage.id);
    setAvis('');
  };

  const handleValiderRapport = async (stageId) => {
    if (!avis.trim()) {
      setMessage('⚠️ Veuillez saisir un avis');
      return;
    }
    try {
      await api.post(`/api/stages/${stageId}/rapport/valider`, {
        avis,
        valideParId: user.id,
        valideParNom: user.nomComplet
      });
      setMessage('✅ Rapport validé');
      loadData();
      setAvis('');
    } catch (err) {
      setMessage('❌ Erreur lors de la validation');
    }
  };

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">📋 Suivi des stages</h2>
      </div>

      {message && <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>{message}</div>}

      <div className="dash-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <h3 className="card-title">Stages en cours</h3>
          {stages.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucun stage en cours</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stages.map(s => (
                <button
                  key={s.id}
                  className={`btn-outline ${selected?.id === s.id ? 'active' : ''}`}
                  onClick={() => handleSelect(s)}
                  style={{
                    textAlign: 'left',
                    background: selected?.id === s.id ? '#0B1F4A' : '',
                    color: selected?.id === s.id ? 'white' : '',
                    padding: '12px 16px'
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{s.etudiant}</div>
                  <div style={{ fontSize: 12 }}>{s.entreprise}</div>
                  <div style={{ fontSize: 11, color: selected?.id === s.id ? '#9FE1CB' : '#888' }}>
                    {s.progression || 0}% • {s.dureeSemaines} semaines
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          {!selected ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
              Sélectionnez un stage pour voir les détails
            </p>
          ) : (
            <>
              <h3 className="card-title">{selected.etudiant} - {selected.entreprise}</h3>

              <div style={{ marginTop: 12 }}>
                <div><strong>Période :</strong> {new Date(selected.dateDebut).toLocaleDateString('fr-FR')} → {new Date(selected.dateFin).toLocaleDateString('fr-FR')}</div>
                <div><strong>Durée :</strong> {selected.dureeSemaines} semaines</div>
                <div><strong>Progression :</strong> {selected.progression || 0}%</div>
                {selected.tuteur && <div><strong>Tuteur :</strong> {selected.tuteur}</div>}
              </div>

              {rapport && (
                <div style={{ marginTop: 16, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                  <h4>📄 Rapport de stage</h4>
                  <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 6 }}>
                    <div><strong>Titre :</strong> {rapport.titre}</div>
                    <div style={{ marginTop: 8 }}>{rapport.resume}</div>
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                      Soumis le {new Date(rapport.dateSoumission).toLocaleDateString('fr-FR')}
                    </div>
                    {rapport.url && (
                      <a href={rapport.url} target="_blank" rel="noreferrer" className="btn-outline" style={{ fontSize: 11, marginTop: 8, display: 'inline-block' }}>
                        📥 Télécharger
                      </a>
                    )}
                  </div>

                  {rapport.statut === 'EN_ATTENTE' && (
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Avis du professeur</label>
                      <textarea
                        value={avis}
                        onChange={e => setAvis(e.target.value)}
                        rows="3"
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
                        placeholder="Évaluez le rapport..."
                      />
                      <button
                        className="btn-primary"
                        style={{ marginTop: 8 }}
                        onClick={() => handleValiderRapport(selected.id)}
                      >
                        ✅ Valider le rapport
                      </button>
                    </div>
                  )}

                  {rapport.statut === 'VALIDE' && (
                    <div style={{ marginTop: 12, padding: '12px', background: 'rgba(29,158,117,0.12)', borderRadius: 6 }}>
                      ✅ Rapport validé
                      {rapport.avis && <div style={{ marginTop: 8, fontSize: 13 }}>Avis : {rapport.avis}</div>}
                    </div>
                  )}
                </div>
              )}

              {!rapport && (
                <div style={{ marginTop: 16, padding: '12px', background: 'rgba(24,95,165,0.12)', borderRadius: 6 }}>
                  ⏳ Aucun rapport soumis pour le moment.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
