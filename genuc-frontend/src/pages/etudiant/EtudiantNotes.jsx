// src/pages/etudiant/EtudiantNotes.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import '../Dashboard.css';

export default function EtudiantNotes() {
  const { user } = useAuth();
  const [notesData, setNotesData] = useState(null);
  const [annee, setAnnee] = useState('2024-2025');
  const [anneesDisponibles] = useState(['2024-2025', '2025-2026']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    if (!inscriptionId) {
      setError("Aucune inscription trouvée");
      setLoading(false);
      return;
    }
    loadNotes();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId, annee]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/etudiant/portal/${inscriptionId}/notes`, {
        params: { annee }
      });
      setNotesData(response.data);
    } catch (err) {
      setError(err.response?.data?.erreur || "Erreur de chargement des notes");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReleve = async () => {
    try {
      const response = await api.get(`/api/etudiant/portal/${inscriptionId}/releve/telecharger`, {
        params: { annee },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `releve_notes_${inscriptionId}_${annee}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Erreur lors de la génération du relevé");
    }
  };

  const exportExcel = async () => {
    setExportLoading(true);
    try {
      const response = await api.get(`/api/notes/export/${inscriptionId}/${annee}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `notes_${inscriptionId}_${annee}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Erreur lors de l'export Excel");
    } finally {
      setExportLoading(false);
    }
  };

  const getMentionClass = (mention) => {
    const classes = {
      'TRES_GRANDE_DISTINCTION': 'badge-success',
      'GRANDE_DISTINCTION': 'badge-success',
      'DISTINCTION': 'badge-success',
      'SATISFACTION': 'badge-success',
      'REUSSITE': 'badge-success',
      'AJOURNE': 'badge-danger'
    };
    return classes[mention] || 'badge-neutral';
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

  // Préparer les données pour le graphique
  const prepareChartData = () => {
    if (!notesData?.notes) return [];
    return notesData.notes.map(n => ({
      cours: n.cours?.substring(0, 15) + (n.cours?.length > 15 ? '...' : ''),
      note: n.noteFinale || 0,
    }));
  };

  // Préparer les données pour le radar
  const prepareRadarData = () => {
    if (!notesData?.notes) return [];
    const categories = {};
    notesData.notes.forEach(n => {
      const cat = n.categorie || 'Général';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(n.noteFinale || 0);
    });
    return Object.entries(categories).map(([categorie, notes]) => ({
      categorie,
      moyenne: notes.reduce((a, b) => a + b, 0) / notes.length,
    }));
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Chargement de vos notes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert-erreur">{error}</div>
      </div>
    );
  }

  if (!notesData) return null;

  const chartData = prepareChartData();
  const radarData = prepareRadarData();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📝 Mes notes</h1>
          <p className="page-sub">Consultez vos résultats académiques par année</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" onClick={exportExcel} disabled={exportLoading}>
            {exportLoading ? '⏳' : '📥 Excel'}
          </button>
          <button className="btn-primary" onClick={handleDownloadReleve}>
            📄 Relevé PDF
          </button>
        </div>
      </div>

      {/* Filtre année */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 600, fontSize: 13 }}>Année académique :</label>
          <select 
            value={annee} 
            onChange={e => setAnnee(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border-color)' }}
          >
            {anneesDisponibles.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button className="btn-outline" onClick={loadNotes} style={{ marginLeft: 'auto' }}>
            🔄 Rafraîchir
          </button>
        </div>
      </div>

      {/* Résumé */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E6F1FB' }}>🎯</div>
          <div>
            <div className="stat-value" style={{ color: notesData.moyenneGenerale >= 10 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
              {notesData.moyenneGenerale?.toFixed(2) || '-'}
            </div>
            <div className="stat-label">Moyenne générale</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E1F5EE' }}>✅</div>
          <div>
            <div className="stat-value">{notesData.creditsValides || 0}</div>
            <div className="stat-label">Crédits validés</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FAEEDA' }}>🏅</div>
          <div>
            <div className="stat-value">
              <span className={`badge ${getMentionClass(notesData.mention)}`} style={{ fontSize: 14 }}>
                {getMentionLabel(notesData.mention)}
              </span>
            </div>
            <div className="stat-label">Mention</div>
          </div>
        </div>
        {notesData.decision && (
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#FBEAF0' }}>🎓</div>
            <div>
              <div className="stat-value" style={{ fontSize: 16 }}>
                {notesData.decision === 'ADMIS' ? 'Admis' : 
                 notesData.decision === 'DIPLOME' ? 'Diplômé' : 
                 notesData.decision === 'REDOUBLE' ? 'Redoublement' : notesData.decision}
              </div>
              <div className="stat-label">Décision du jury</div>
            </div>
          </div>
        )}
      </div>

      {/* Graphiques */}
      <div className="dash-grid" style={{ marginBottom: 20 }}>
        {chartData.length > 0 && (
          <div className="card">
            <h2 className="card-title">📊 Baromètre des notes</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cours" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 20]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="note" fill="#185FA5" name="Note /20" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {radarData.length > 0 && (
          <div className="card">
            <h2 className="card-title">🎯 Performances par catégorie</h2>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="categorie" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 20]} />
                <Radar name="Moyenne" dataKey="moyenne" stroke="#1D9E75" fill="#1D9E75" fillOpacity={0.4} />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tableau des notes */}
      <div className="card">
        <h2 className="card-title">Détail des résultats</h2>
        {notesData.notes?.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
            Aucune note publiée pour cette année académique.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Cours</th>
                  <th>Code</th>
                  <th>Crédits</th>
                  <th>TP /20</th>
                  <th>Interro /20</th>
                  <th>Examen /20</th>
                  <th>Finale /20</th>
                  <th>Mention</th>
                </tr>
              </thead>
              <tbody>
                {notesData.notes?.map((note, idx) => {
                  const estReussi = note.noteFinale >= 10;
                  return (
                    <tr key={idx} style={{ background: estReussi ? 'transparent' : '#FFF0f0' }}>
                      <td style={{ fontWeight: 600 }}>{note.cours}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{note.code}</td>
                      <td className="text-center">{note.credits}</td>
                      <td className="text-center">{note.noteTP || '-'}</td>
                      <td className="text-center">{note.noteInterrogation || '-'}</td>
                      <td className="text-center">{note.noteExamen || '-'}</td>
                      <td className="text-center" style={{ fontWeight: 700, color: estReussi ? '#1D9E75' : '#cc0000' }}>
                        {note.noteFinale?.toFixed(2) || '-'}
                      </td>
                      <td>
                        <span className={`badge ${getMentionClass(note.mention)}`}>
                          {getMentionLabel(note.mention)}
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

      {/* Délibération */}
      {notesData.dateDeliberation && (
        <div className="card" style={{ marginTop: 20, background: 'var(--bg-secondary)' }}>
          <div className="detail-grid">
            <div>
              <div className="detail-lbl">Date de délibération</div>
              <div>{new Date(notesData.dateDeliberation).toLocaleDateString('fr-FR')}</div>
            </div>
            <div>
              <div className="detail-lbl">Président du jury</div>
              <div>{notesData.presidentJury || 'Non spécifié'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
