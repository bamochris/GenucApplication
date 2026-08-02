// src/pages/appariteur/AppariteurDashboard.jsx
// Portail Appariteur — gestion des salles d'examen et horaires de passation.
// Note : le backend n'a pas encore de contrôleur dédié /api/appariteur/** —
// le tableau de bord agit comme une navigation vers les modules existants
// (vacations, présences) et affiche un état "environnement prêt".
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDesign } from '../../context/DesignContext';
import api from '../../api/axios';
import '../Dashboard.css';
import AppariteurDashboardPremium from './AppariteurDashboardPremium';

export default function AppariteurDashboard() {
  const { user } = useAuth();
  const { design } = useDesign();
  const universiteId = user?.universiteId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const [vacations, setVacations] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (universiteId) {
      loadDashboard();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universiteId]);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      // Utilise les endpoints vacations existants (accessible aux secrétaires/admins)
      const [vacationsRes, statsRes] = await Promise.all([
        api.get(`/api/vacations/universite/${universiteId}/actives`).catch(() => ({ data: [] })),
        api.get(`/api/universites/${universiteId}/stats`).catch(() => ({ data: {} })),
      ]);
      setVacations(vacationsRes.data || []);
      setStats(statsRes.data || {});
    } catch (err) {
      setError('Erreur de chargement du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  if (design === 'premium') {
    return (
      <AppariteurDashboardPremium
        stats={stats}
        vacations={vacations}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRefresh={loadDashboard}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏛️ Appariteur — Gestion des salles d’examen</h1>
          <p className="page-sub">
            Supervision des vacations, salles et présences d’examen
          </p>
        </div>
        <button className="btn-outline" onClick={loadDashboard} style={{ fontSize: 12 }}>🔄 Actualiser</button>
      </div>

      {error && <div className="alert-erreur">{error}</div>}
      {loading && <div className="loading">Chargement du tableau de bord...</div>}

      {!loading && (
        <>
          {/* KPIs */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#E6F1FB' }}>📅</div>
              <div>
                <div className="stat-value">{vacations.length || 0}</div>
                <div className="stat-label">Vacations actives</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#E1F5EE' }}>🎓</div>
              <div>
                <div className="stat-value">{stats.nbEtudiants || 0}</div>
                <div className="stat-label">Étudiants</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#FDEBD0' }}>🏢</div>
              <div>
                <div className="stat-value">{stats.totalSalles || 0}</div>
                <div className="stat-label">Salles</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#FBEAF0' }}>📊</div>
              <div>
                <div className="stat-value">{stats.tauxReussite || 0}%</div>
                <div className="stat-label">Taux de réussite</div>
              </div>
            </div>
          </div>

          {/* Navigation rapide */}
          <div className="card" style={{ marginTop: 20 }}>
            <h2 className="card-title">⚡ Navigation rapide</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link to="/admin/vacations" className="btn-primary" style={{ fontSize: 12 }}>
                📅 Gérer les vacations
              </Link>
              <Link to="/professeur/presences/qrcode" className="btn-outline" style={{ fontSize: 12 }}>
                📱 Présences QR
              </Link>
              <Link to="/finances/dashboard" className="btn-outline" style={{ fontSize: 12 }}>
                💰 Finances
              </Link>
              <Link to="/admin/deliberation/statistiques" className="btn-outline" style={{ fontSize: 12 }}>
                📊 Statistiques
              </Link>
            </div>
          </div>

          {/* Vacations actives */}
          <div className="card">
            <h2 className="card-title">Vacations actives ({vacations.length})</h2>
            {vacations.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
                Aucune vacation active pour le moment.
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Libellé</th>
                    <th>Type</th>
                    <th>Date début</th>
                    <th>Inscriptions</th>
                  </tr>
                </thead>
                <tbody>
                  {vacations.map(v => (
                    <tr key={v.id}>
                      <td>{v.libelle || v.nom || '-'}</td>
                      <td><span className="badge badge-neutral">{v.type}</span></td>
                      <td>{v.dateDebut ? new Date(v.dateDebut).toLocaleDateString('fr-FR') : '-'}</td>
                      <td>{v.nombreInscriptions || v.inscriptions?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Actions */}
          <div className="card" style={{ marginTop: 20 }}>
            <h2 className="card-title">📌 Fonctionnalités à venir</h2>
            <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
              <ul style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
                <li>Gestion avancée des bureaux de vote / salles d’examen</li>
                <li>Scan et validation des électeurs</li>
                <li>Publication des résultats de scrutins</li>
                <li>Rapports de couverture et présence par salle</li>
              </ul>
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                💡 Ces fonctionnalités seront activées lorsque le backend exposera les
                endpoints du contrôleur dédié /api/appariteur/**.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
