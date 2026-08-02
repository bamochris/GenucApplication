// src/pages/recteur/RecteurDashboard.jsx
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDesign } from '../../context/DesignContext';
import api from '../../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import '../../pages/Dashboard.css';
import AvatarUtilisateur from '../../components/AvatarUtilisateur';
import QuickActionsGrid from '../../components/QuickActionsGrid';
import RecteurDashboardPremium from './RecteurDashboardPremium';

export default function RecteurDashboard() {
  const { user } = useAuth();
  const { design } = useDesign();
  const [dashboard, setDashboard] = useState(null);
  const [evolution, setEvolution] = useState([]);
  const [reussite, setReussite] = useState([]);
  const [palmaresStats, setPalmaresStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const universiteId = user?.universiteId;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      let dashData = null, evoData = [], reussiteData = [], palmaresData = null;

      try {
        const res = await api.get(`/api/recteur/dashboard/${universiteId}`);
        dashData = res.data;
      } catch (e) {
        setError('Impossible de charger le tableau de bord.');
      }

      try {
        const res = await api.get(`/api/recteur/evolution/${universiteId}`);
        evoData = res.data;
      } catch (e) {
        // evolution optionnelle
      }

      try {
        const res = await api.get(`/api/recteur/reussite/${universiteId}`);
        reussiteData = res.data;
      } catch (e) {
        // réussite optionnelle
      }

      try {
        const res = await api.get(`/api/palmares/stats/${universiteId}`);
        palmaresData = res.data;
      } catch (e) {
        // palmarès optionnel
      }

      setDashboard(dashData);
      setEvolution(evoData || []);
      setReussite(reussiteData || []);
      setPalmaresStats(palmaresData);

    } catch (err) {
      setError('Erreur inattendue lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, [universiteId]);

  useEffect(() => {
    if (universiteId) {
      loadData();
    } else {
      setLoading(false);
      setError('Aucune université associée à votre compte.');
    }
  }, [universiteId, loadData]);

  if (loading) {
    return (
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ width: 320, height: 28, background: 'var(--bg-secondary)', borderRadius: 6, marginBottom: 8, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
            <div style={{ width: 200, height: 16, background: 'var(--bg-secondary)', borderRadius: 4, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
          </div>
          <div style={{ width: 160, height: 16, background: 'var(--bg-secondary)', borderRadius: 4, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
        </div>
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="stat-card">
              <div style={{ width: 44, height: 44, background: 'var(--bg-secondary)', borderRadius: 8, marginRight: 12, flexShrink: 0, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: 60, height: 28, background: 'var(--bg-secondary)', borderRadius: 4, marginBottom: 6, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
                <div style={{ width: 80, height: 14, background: 'var(--bg-secondary)', borderRadius: 4, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
              </div>
            </div>
          ))}
        </div>
        <div className="dash-grid" style={{ marginBottom: 20 }}>
          {[1,2].map(i => (
            <div key={i} className="card" style={{ height: 140 }}>
              <div style={{ width: 120, height: 18, background: 'var(--bg-secondary)', borderRadius: 4, marginBottom: 16, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[1,2].map(j => (
                  <div key={j} style={{ height: 70, background: 'var(--bg-secondary)', borderRadius: 8, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="card" style={{ height: 290 }}>
          <div style={{ width: 200, height: 18, background: 'var(--bg-secondary)', borderRadius: 4, marginBottom: 16, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 230, background: 'var(--bg-secondary)', borderRadius: 8, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
        </div>
        <style>{`@keyframes skeleton-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
      </div>
    );
  }

  // Si erreur ou pas d'université
  if (!universiteId || error) {
    return (
      <div className="page">
        <div className="alert-erreur">
          {error || 'Aucune université associée à votre compte.'}
          <br />
          <button className="btn-outline" onClick={() => window.location.reload()} style={{ marginTop: 12 }}>
            🔄 Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Données pour les graphiques
  const COLORS = ['#185FA5', '#1D9E75', '#854F0B', '#993556', '#0B1F4A'];

  const mentionData = palmaresStats?.parMention
    ? Object.entries(palmaresStats.parMention).map(([name, value]) => ({
        name: name.replace('_', ' '),
        value
      }))
    : [];

  // Valeurs par défaut pour éviter les erreurs
  const safeDashboard = dashboard || {};
  const effectifs = safeDashboard.effectifs || {};
  const finances = safeDashboard.finances || {};
  const resultats = safeDashboard.resultats || {};

  // ── Variante « premium » (opt-in, réversible) ──────────────────────────
  if (design === 'premium') {
    return <RecteurDashboardPremium user={user} dashboard={dashboard} palmaresStats={palmaresStats} />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏛️ Tableau de bord – Recteur</h1>
          <p className="page-sub">
            <AvatarUtilisateur taille={22} style={{ marginRight: 7 }} />{user?.nomComplet} • {safeDashboard.universite || 'Université'}
          </p>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          📅 {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {error && <div className="alert-erreur">{error}</div>}

      {/* Actions rapides */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head"><h2 className="card-title">⚡ Actions rapides</h2></div>
        <QuickActionsGrid
          actions={[
            { icon: '📊', label: 'Rapports stratégiques', to: '/admin/rapports', color: '#185FA5', bg: '#E6F1FB', description: 'Consulter les rapports et statistiques de l\'université.', applyLabel: 'Ouvrir les rapports' },
            { icon: '💰', label: 'Finances', to: '/finances/dashboard', color: '#1D9E75', bg: '#E1F5EE', description: 'Vue d\'ensemble financière de l\'université.', applyLabel: 'Ouvrir les finances' },
            { icon: '⚖️', label: 'Salle de jury', to: '/admin/deliberation/jury', color: '#854F0B', bg: '#FAEEDA', description: 'Superviser les délibérations en salle de jury.', applyLabel: 'Ouvrir la salle de jury' },
            { icon: '📈', label: 'Statistiques délibération', to: '/admin/deliberation/statistiques', color: '#6B21A8', bg: '#F3E8FF', description: 'Statistiques de réussite et de mentions.', applyLabel: 'Afficher' },
          ]}
        />
      </div>

      {/* Statistiques clés */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E6F1FB' }}>👨‍🎓</div>
          <div>
            <div className="stat-value">{effectifs.totalEtudiants || 0}</div>
            <div className="stat-label">Étudiants</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E1F5EE' }}>👨‍🏫</div>
          <div>
            <div className="stat-value">{effectifs.totalEnseignants || 0}</div>
            <div className="stat-label">Enseignants</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FAEEDA' }}>🏛️</div>
          <div>
            <div className="stat-value">{effectifs.totalDepartements || 0}</div>
            <div className="stat-label">Départements</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FBEAF0' }}>📝</div>
          <div>
            <div className="stat-value" style={{ color: effectifs.inscriptionsEnAttente > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}>
              {effectifs.inscriptionsEnAttente || 0}
            </div>
            <div className="stat-label">Inscriptions en attente</div>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        {/* Finances */}
        <div className="card">
          <h2 className="card-title">💰 Finances</h2>
          <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ padding: 12, background: 'rgba(24,95,165,0.12)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Recettes du mois</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#185FA5' }}>
                {finances.recettesMois?.toLocaleString() || 0} USD
              </div>
            </div>
            <div style={{ padding: 12, background: 'rgba(24,95,165,0.12)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Recettes de l'année</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1D9E75' }}>
                {finances.recettesAnnee?.toLocaleString() || 0} USD
              </div>
            </div>
          </div>
        </div>

        {/* Résultats */}
        <div className="card">
          <h2 className="card-title">🎓 Résultats académiques</h2>
          <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ padding: 12, background: 'rgba(29,158,117,0.12)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Admis</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1D9E75' }}>
                {resultats.totalAdmis || 0}
              </div>
            </div>
            <div style={{ padding: 12, background: 'rgba(24,95,165,0.12)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Diplômés</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#185FA5' }}>
                {resultats.totalDiplomes || 0}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>Taux de réussite</span>
              <span style={{ fontWeight: 700, color: resultats.tauxReussite > 70 ? '#1D9E75' : '#cc0000' }}>
                {resultats.tauxReussite || 0}%
              </span>
            </div>
            <div style={{ background: 'var(--bg-secondary)', height: 8, borderRadius: 4, marginTop: 4 }}>
              <div style={{
                width: `${resultats.tauxReussite || 0}%`,
                background: resultats.tauxReussite > 70 ? '#1D9E75' : '#cc0000',
                height: '100%',
                borderRadius: 4,
                transition: 'width 0.3s'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Graphique d'évolution */}
      <div className="card" style={{ marginTop: 20 }}>
        <h2 className="card-title">📈 Évolution des effectifs</h2>
        {evolution.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={evolution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="annee" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="etudiants" stroke="#185FA5" name="Étudiants" />
              <Line type="monotone" dataKey="enseignants" stroke="#1D9E75" name="Enseignants" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune donnée d'évolution disponible</p>
        )}
      </div>

      {/* Taux de réussite par faculté */}
      {reussite.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 className="card-title">📊 Taux de réussite par faculté</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={reussite}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="faculte" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="tauxReussite" fill="#185FA5" name="Taux de réussite %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Palmarès */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">🏆 Excellence académique – Palmarès</h2>
          <Link to="/palmares-public" className="btn-outline" style={{ fontSize: 12, textDecoration: 'none' }}>
            Voir le palmarès complet →
          </Link>
        </div>

        {palmaresStats ? (
          <div>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 16 }}>
              <div className="stat-card" style={{ padding: 12 }}>
                <div className="stat-value" style={{ color: '#185FA5' }}>{palmaresStats.totalLaureats || 0}</div>
                <div className="stat-label">Total lauréats</div>
              </div>
              <div className="stat-card" style={{ padding: 12 }}>
                <div className="stat-value" style={{ color: 'var(--color-success-text)' }}>{Object.keys(palmaresStats.parAnnee || {}).length}</div>
                <div className="stat-label">Années représentées</div>
              </div>
              <div className="stat-card" style={{ padding: 12 }}>
                <div className="stat-value" style={{ color: '#854F0B' }}>{Object.keys(palmaresStats.parFiliere || {}).length}</div>
                <div className="stat-label">Filières représentées</div>
              </div>
              <div className="stat-card" style={{ padding: 12 }}>
                <div className="stat-value" style={{ color: '#993556' }}>
                  {Object.keys(palmaresStats.parMention || {}).length}
                </div>
                <div className="stat-label">Mentions différentes</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {mentionData.length > 0 && (
                <div style={{ height: 200 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Répartition par mention</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={mentionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {mentionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Derniers lauréats</div>
                {palmaresStats.dernieresAnnees && palmaresStats.dernieresAnnees.length > 0 ? (
                  <ul style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 0, listStyle: 'none' }}>
                    {palmaresStats.dernieresAnnees.slice(0, 5).map((m, i) => (
                      <li key={i} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        borderBottom: i < 4 ? '1px solid var(--border-color)' : 'none'
                      }}>
                        <span>{m.nom}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{m.annee} – {m.mention?.replace('_', ' ')}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aucun lauréat enregistré</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
            <p>Aucune donnée de palmarès disponible</p>
            <p style={{ fontSize: 12 }}>Générez le palmarès depuis les paramètres administratifs</p>
          </div>
        )}
      </div>
    </div>
  );
}