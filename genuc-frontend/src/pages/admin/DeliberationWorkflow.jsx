// src/pages/admin/DeliberationWorkflow.jsx
// Délibérations en 3 phases avec clôture
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import '../Dashboard.css';

export default function DeliberationWorkflow() {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [selectedPromo, setSelectedPromo] = useState('');
  const [selectedAnnee, setSelectedAnnee] = useState('');
  const [phase, setPhase] = useState('preparation');
  const [resultats, setResultats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({ admis: 0, rattrapage: 0, redouble: 0, diplomes: 0 });

  useEffect(() => {
    if (user?.universiteId) {
      api.get(`/api/promotions/universite/${user.universiteId}`)
        .then(res => setPromotions(res.data))
        .catch(console.error);
      api.get('/api/annees-academiques')
        .then(res => {
          setAnnees(res.data);
          const active = res.data.find(a => a.active && !a.cloturee);
          if (active) setSelectedAnnee(active.libelle);
        })
        .catch(console.error);
    }
  }, [user]);

  const fetchPhaseStatus = async () => {
    if (!selectedAnnee) return;
    try {
      const res = await api.get(`/api/annees-academiques/${selectedAnnee}/statut`);
      setPhase(res.data.phase || 'preparation');
    } catch (err) { console.error(err); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  useEffect(() => { fetchPhaseStatus(); }, [selectedAnnee]);

  const handleAction = async (action, successMsg) => {
    if (!selectedPromo || !selectedAnnee) {
      setMessage("Sélectionnez une promotion et une année.");
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await api.post(`/api/deliberation/${action}`, {
        promotionId: selectedPromo,
        anneeAcademique: selectedAnnee
      });
      setResultats(res.data);
      calculerStats(res.data);
      setMessage(successMsg);
      if (action === 'cloturer') setPhase('cloturee');
      else if (action === 'rattrapage') setPhase('rattrapage');
      else setPhase('premiere');
    } catch (err) {
      setMessage("❌ " + (err.response?.data?.erreur || err.message));
    } finally {
      setLoading(false);
    }
  };

  const genererPv = async () => {
    try {
      const response = await api.post('/api/deliberation/pv-global', {
        promotionId: selectedPromo,
        anneeAcademique: selectedAnnee
      }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PV_Deliberation_${selectedAnnee}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setMessage("Erreur génération PDF");
    }
  };

  const calculerStats = (data) => {
    const admis = data.filter(r => r.decision === 'ADMIS').length;
    const rattrapage = data.filter(r => r.decision === 'ADMIS_RATTRAPAGE').length;
    const redouble = data.filter(r => r.decision === 'REDOUBLE').length;
    const diplomes = data.filter(r => r.decision === 'DIPLOME').length;
    setStats({ admis, rattrapage, redouble, diplomes });
  };

  // Déterminer les boutons actifs selon la phase
  const canPremiere = phase === 'preparation';
  const canRattrapage = phase === 'premiere';
  const canCloturer = phase !== 'cloturee' && resultats.length > 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">⚖️ Délibérations – 3 phases</h1>
        <p className="page-sub">Première session → Rattrapage → Clôture définitive</p>
      </div>

      <div className="card">
        <div className="form-grid">
          <div className="form-group">
            <label>Promotion</label>
            <select value={selectedPromo} onChange={e => setSelectedPromo(e.target.value)}>
              <option value="">-- Choisir --</option>
              {promotions.map(p => <option key={p.id} value={p.id}>{p.libelle} – {p.filiere?.nom}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Année académique</label>
            <select value={selectedAnnee} onChange={e => setSelectedAnnee(e.target.value)}>
              {annees.map(a => <option key={a.id} value={a.libelle}>{a.libelle} {a.cloturee ? '(clôturée)' : ''}</option>)}
            </select>
          </div>
        </div>

        <div className="stats-grid" style={{ margin: '20px 0' }}>
          <div className="stat-card"><div className="stat-value">{stats.admis}</div><div className="stat-label">Admis</div></div>
          <div className="stat-card"><div className="stat-value">{stats.diplomes}</div><div className="stat-label">Diplômés</div></div>
          <div className="stat-card"><div className="stat-value">{stats.rattrapage}</div><div className="stat-label">Rattrapage</div></div>
          <div className="stat-card"><div className="stat-value">{stats.redouble}</div><div className="stat-label">Redoublement</div></div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            className="btn-primary" 
            onClick={() => handleAction('premiere', "✅ Première délibération effectuée.")} 
            disabled={loading || !canPremiere}
          >
            🎓 1ère délibération
          </button>
          <button 
            className="btn-warning" 
            onClick={() => handleAction('rattrapage', "📘 Rattrapage pris en compte.")} 
            disabled={loading || !canRattrapage}
          >
            📘 Rattrapage
          </button>
          <button 
            className="btn-danger" 
            onClick={() => handleAction('cloturer', "🔒 Année clôturée – résultats définitifs.")} 
            disabled={loading || !canCloturer}
          >
            🔒 Clôturer l'année
          </button>
          <button 
            className="btn-success" 
            onClick={genererPv} 
            disabled={resultats.length === 0}
          >
            📄 Télécharger PV global
          </button>
        </div>

        {message && <div className="alert-success" style={{ marginTop: 20 }}>{message}</div>}
      </div>

      {resultats.length > 0 && (
        <div className="card">
          <h2 className="card-title">Détails des résultats – {phase.toUpperCase()}</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th><th>Étudiant</th><th>Matricule</th>
                <th>Moyenne</th><th>Crédits</th><th>Mention</th><th>Décision</th>
              </tr>
            </thead>
            <tbody>
              {resultats.map((r, idx) => (
                <tr key={r.inscriptionId} style={r.decision === 'ADMIS_RATTRAPAGE' ? { background: 'rgba(192,122,43,0.15)' } : {}}>
                  <td>{idx+1}</td>
                  <td>{r.etudiant}</td>
                  <td>{r.matricule}</td>
                  <td>{r.moyenne.toFixed(2)}</td>
                  <td>{r.credits}</td>
                  <td>{r.mention}</td>
                  <td>{r.decision}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}