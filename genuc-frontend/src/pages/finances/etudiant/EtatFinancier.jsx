// src/pages/finances/etudiant/EtatFinancier.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import '../FinanceDashboard.css';

export default function EtatFinancier() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [situation, setSituation] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [evolution, setEvolution] = useState([]);

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    if (inscriptionId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [inscriptionId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const situationRes = await api.get('/api/etudiant/frais/situation');
      setSituation(situationRes.data);

      // Préparer les données pour le graphique circulaire
      const dettes = situationRes.data?.dettes || [];
      const chart = dettes.map(d => ({
        name: d.fraisLibelle || d.code,
        value: d.reste || d.montant
      }));
      setChartData(chart);

      // Évolution mensuelle calculée à partir des paiements validés (aucun
      // endpoint /evolution n'existe côté backend).
      const paiements = situationRes.data?.paiements || [];
      const parMois = {};
      paiements.forEach(p => {
        const date = new Date(p.datePaiement);
        const cle = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!parMois[cle]) {
          parMois[cle] = { cle, mois: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }), montant: 0 };
        }
        parMois[cle].montant += p.montant;
      });
      setEvolution(Object.values(parMois).sort((a, b) => a.cle.localeCompare(b.cle)));
    } catch (err) {
      console.error('Erreur chargement situation:', err);
      setError('Impossible de charger votre situation financière');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#185FA5', '#1D9E75', '#854F0B', '#993556', '#0B1F4A', '#FF9800'];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de votre situation financière...</p>
      </div>
    );
  }

  if (!situation) {
    return (
      <div className="finance-dashboard">
        <div className="card">
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
            Aucune information financière disponible.
          </p>
        </div>
      </div>
    );
  }

  const pourcentage = situation.pourcentage || 0;

  return (
    <div className="finance-dashboard">
      <div className="section-header">
        <h2 className="section-title">📊 État financier</h2>
        <button className="btn-outline" onClick={loadData}>🔄 Rafraîchir</button>
      </div>

      {error && (
        <div className="alert-erreur" onClick={() => setError(null)}>{error}</div>
      )}

      {/* Informations générales */}
      <div className="card" style={{ marginBottom: 20, background: 'rgba(24,95,165,0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{situation.etudiant}</div>
            <div style={{ color: '#185FA5' }}>Matricule: {situation.matricule}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Situation</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: situation.estSolde ? '#1D9E75' : '#cc0000' }}>
              {situation.estSolde ? '✅ Totalement soldé' : '⚠️ Dette active'}
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{situation.totalAttendu.toFixed(2)} USD</div>
            <div className="stat-label">Total attendu</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#1D9E75' }}>
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: 'var(--color-success-text)' }}>{situation.totalPaye.toFixed(2)} USD</div>
            <div className="stat-label">Déjà payé</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: situation.totalReste > 0 ? '#cc0000' : '#1D9E75' }}>
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: situation.totalReste > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}>
              {situation.totalReste.toFixed(2)} USD
            </div>
            <div className="stat-label">{situation.totalReste > 0 ? 'Reste à payer' : 'Soldé ✓'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{Math.round(pourcentage)}%</div>
            <div className="stat-label">Taux de couverture</div>
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span>Progression du paiement</span>
          <span style={{ fontWeight: 600 }}>{Math.round(pourcentage)}%</span>
        </div>
        <div style={{ background: 'var(--bg-secondary)', height: 12, borderRadius: 6, overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, pourcentage)}%`,
              background: pourcentage >= 80 ? '#1D9E75' : '#185FA5',
              height: '100%',
              transition: 'width 0.6s ease'
            }}
          />
        </div>
      </div>

      {/* Graphiques */}
      <div className="dash-grid" style={{ marginBottom: 20, gridTemplateColumns: '1fr 1fr' }}>
        {/* Camembert - Répartition des dettes */}
        <div className="card">
          <h3 className="card-title">Répartition des dettes</h3>
          {chartData.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune dette</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Évolution des paiements */}
        <div className="card">
          <h3 className="card-title">Évolution des paiements</h3>
          {evolution.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune donnée d'évolution</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={evolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="montant" fill="#185FA5" name="Montant (USD)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Historique des paiements */}
      <div className="card">
        <h3 className="card-title">Historique des paiements</h3>
        {situation.paiements?.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucun paiement</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Mode</th>
                </tr>
              </thead>
              <tbody>
                {situation.paiements?.map(p => (
                  <tr key={p.id}>
                    <td className="uni-code">{p.reference}</td>
                    <td>{new Date(p.datePaiement).toLocaleDateString('fr-FR')}</td>
                    <td>{p.montant.toFixed(2)} USD</td>
                    <td>{p.modePaiement?.replace('_', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
