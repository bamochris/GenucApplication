// src/pages/Dashboard.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import api from '../api/axios';
import './Dashboard.css';
import DashboardStats from '../components/DashboardStats';

export default function Dashboard() {
  const { user } = useAuth();
  const [annee, setAnnee] = useState(new Date().getFullYear());

  // ✅ Utilisation du hook useApi pour charger les universités
  const { data: universites, loading: chargement, error } = useApi(
    () => api.get('/api/universites/public'),
    { immediate: true }
  );

  const universitesData = universites || [];
  const ouvertes = universitesData.filter(u => u.inscriptionsOuvertes).length;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-sub">
            Bienvenue, {user?.nomComplet || user?.email} — {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>
      </div>

      {/* ✅ Affichage de l'erreur si présente */}
      {error && (
        <div className="alert-erreur" style={{ marginBottom: '20px' }}>
          ⚠️ Erreur de chargement : {error}
        </div>
      )}

      {/* Stats globales (tous rôles) */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background:'#E6F1FB'}}>🏛️</div>
          <div>
            <div className="stat-value">{universitesData.length}</div>
            <div className="stat-label">Universités actives</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'#E1F5EE'}}>✅</div>
          <div>
            <div className="stat-value" style={{color:'#0F6E56'}}>{ouvertes}</div>
            <div className="stat-label">Inscriptions ouvertes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'#FAEEDA'}}>💳</div>
          <div>
            <div className="stat-value">$128K</div>
            <div className="stat-label">Paiements ce mois</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'#FBEAF0'}}>🎓</div>
          <div>
            <div className="stat-value">1 204</div>
            <div className="stat-label">Cours en ligne</div>
          </div>
        </div>
      </div>

      {/* Graphiques nationaux : réservés au SUPER_ADMIN */}
      {isSuperAdmin && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">📊 Évolution annuelle</h2>
            <div className="year-selector">
              <label>Année :</label>
              <select value={annee} onChange={e => setAnnee(parseInt(e.target.value))}>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
          </div>
          <DashboardStats annee={annee} />
        </div>
      )}

      <div className="dash-grid">
        {/* Liste des universités */}
        <div className="card">
          <div className="card-head">
            <h2 className="card-title">🏛️ Universités enregistrées</h2>
          </div>
          {chargement ? (
            <div className="loading">Chargement...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Université</th>
                  <th>Ville</th>
                  <th>Frais</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {universitesData.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="uni-code">{u.code}</div>
                      <div className="uni-nom">{u.nom}</div>
                    </td>
                    <td>{u.ville}</td>
                    <td>${u.fraisBase}</td>
                    <td>
                      <span className={`badge ${u.inscriptionsOuvertes ? 'badge-success' : 'badge-neutral'}`}>
                        {u.inscriptionsOuvertes ? 'Ouvert' : 'Fermé'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Activité récente */}
        <div className="card">
          <div className="card-head">
            <h2 className="card-title">🕐 Activité récente</h2>
          </div>
          <div className="activity-list">
            {[
              { dot:'#1D9E75', texte:'Nouvelle inscription — Jean-Pierre KABONGO', meta:'UNIKIN · L1 Informatique · il y a 5 min' },
              { dot:'#185FA5', texte:'Paiement validé — GEN-2024-00142', meta:'UNILU · $120 USD · il y a 12 min' },
              { dot:'#854F0B', texte:'Cours publié — Algorithmes & Structures', meta:'UNIKIN · Prof. Mutombo · il y a 1h' },
              { dot:'#993556', texte:'Délibération publiée — L2 Informatique', meta:'UNIGOM · 124 étudiants · il y a 2h' },
              { dot:'#0F6E56', texte:'Diplôme généré — DIP-UNIKIN-2024-00041', meta:'UNIKIN · Marie LUKUSA · il y a 3h' },
            ].map((a, i) => (
              <div key={i} className="activity-item">
                <div className="activity-dot" style={{background: a.dot}}></div>
                <div>
                  <div className="activity-text">{a.texte}</div>
                  <div className="activity-meta">{a.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}