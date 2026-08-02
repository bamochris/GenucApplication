// src/pages/chef-promotion/ChefPromotionDashboard.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDesign } from '../../context/DesignContext';
import api from '../../api/axios';
import '../Dashboard.css';
import ChefPromotionDashboardPremium from './ChefPromotionDashboardPremium';

export default function ChefPromotionDashboard() {
  const { user } = useAuth();
  const { design } = useDesign();
  const [promotions, setPromotions] = useState([]);
  const [selectedPromo, setSelectedPromo] = useState('');
  const [effectifs, setEffectifs] = useState(null);
  const [resultats, setResultats] = useState(null);
  const [classement, setClassement] = useState([]);
  const [presences, setPresences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [annee, setAnnee] = useState('2024-2025');

  const universiteId = user?.universiteId;

  useEffect(() => {
    if (universiteId) {
      loadPromotions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [universiteId]);

  const loadPromotions = async () => {
    try {
      const res = await api.get(`/api/promotions/universite/${universiteId}`);
      setPromotions(res.data || []);
      if (res.data.length > 0) {
        setSelectedPromo(res.data[0].id.toString());
      }
    } catch (err) {
      setError('Erreur de chargement des promotions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPromo) {
      loadDonnees();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [selectedPromo, annee]);

  const loadDonnees = async () => {
    try {
      const [effectifsRes, resultatsRes, classementRes, presencesRes] = await Promise.all([
        api.get(`/api/chef-promotion/promotion/${selectedPromo}/effectifs`),
        api.get(`/api/chef-promotion/promotion/${selectedPromo}/resultats?annee=${annee}`),
        api.get(`/api/chef-promotion/promotion/${selectedPromo}/classement?annee=${annee}`),
        api.get(`/api/chef-promotion/promotion/${selectedPromo}/presences`).catch(() => ({ data: null })),
      ]);
      setEffectifs(effectifsRes.data);
      setResultats(resultatsRes.data);
      setClassement(classementRes.data || []);
      setPresences(presencesRes.data);
    } catch (err) {
      setError('Erreur de chargement');
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;

  // ── Variante « premium » (opt-in, réversible) ──────────────────────────
  if (design === 'premium') {
    return (
      <ChefPromotionDashboardPremium
        promotions={promotions}
        selectedPromo={selectedPromo}
        annee={annee}
        effectifs={effectifs}
        resultats={resultats}
        classement={classement}
        presences={presences}
        error={error}
        onSelectPromo={setSelectedPromo}
        onSelectAnnee={setAnnee}
        onRefresh={loadDonnees}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">👨‍🎓 Chef de Promotion</h1>
        <p className="page-sub">Suivi de la promotion</p>
      </div>

      {error && <div className="alert-erreur">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
          <div className="form-group">
            <label>Promotion</label>
            <select value={selectedPromo} onChange={e => setSelectedPromo(e.target.value)}>
              {promotions.map(p => (
                <option key={p.id} value={p.id}>{p.libelle} – {p.filiere?.nom}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Année académique</label>
            <select value={annee} onChange={e => setAnnee(e.target.value)}>
              <option value="2023-2024">2023-2024</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
            </select>
          </div>
          <button className="btn-outline" onClick={loadDonnees} style={{ alignSelf: 'flex-end' }}>
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* Statistiques */}
      {effectifs && resultats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{effectifs.total}</div>
            <div className="stat-label">Total étudiants</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{effectifs.valides}</div>
            <div className="stat-label">Validés</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#185FA5' }}>{resultats.moyenneGenerale}</div>
            <div className="stat-label">Moyenne générale</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: resultats.tauxReussite > 70 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
              {resultats.tauxReussite}%
            </div>
            <div className="stat-label">Taux de réussite</div>
          </div>
        </div>
      )}

      {/* Présences du jour */}
      {presences && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">📋 Présences aujourd'hui</h2>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div style={{ padding: 12, background: 'rgba(24,95,165,0.12)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#185FA5' }}>{presences.total}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Total étudiants</div>
            </div>
            <div style={{ padding: 12, background: 'rgba(29,158,117,0.12)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1D9E75' }}>{presences.presents}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Présents</div>
            </div>
            <div style={{ padding: 12, background: '#fdecea', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#cc0000' }}>{presences.absents}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Absents</div>
            </div>
            <div style={{ padding: 12, background: 'rgba(192,122,43,0.15)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: presences.tauxPresence >= 70 ? '#1D9E75' : '#cc0000' }}>
                {presences.tauxPresence}%
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Taux de présence</div>
            </div>
          </div>
        </div>
      )}

      {/* Classement */}
      {classement.length > 0 && (
        <div className="card">
          <h2 className="card-title">🏆 Classement de la promotion</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Rang</th>
                <th>Étudiant</th>
                <th>Matricule</th>
                <th>Moyenne</th>
              </tr>
            </thead>
            <tbody>
              {classement.map((etudiant, index) => (
                <tr key={etudiant.inscriptionId}>
                  <td>{index + 1}</td>
                  <td>{etudiant.etudiant}</td>
                  <td>{etudiant.matricule}</td>
                  <td style={{ fontWeight: index < 3 ? 700 : 400, color: index < 3 ? '#185FA5' : 'var(--text-primary)' }}>
                    {etudiant.moyenne}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}