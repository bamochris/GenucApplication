// src/components/deliberation/StatsDashboard.jsx
import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const COLORS = ['#28a745', '#fd7e14', '#dc3545', '#007bff'];

export default function StatsDashboard({ data, loading }) {
  // 1. Memoization pour éviter les re-rendus inutiles
  const pieData = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'PA', value: data.pa || 0 },
      { name: 'PD', value: data.pd || 0 },
      { name: 'PP', value: data.pp || 0 },
      { name: 'CJ', value: data.cj || 0 },
    ];
  }, [data]);

  const distributionData = useMemo(() => {
    if (!data?.notes) return [];
    // Regrouper les notes par tranche [0-5], [5-10], [10-15], [15-20]
    const tranches = { '0-5': 0, '5-10': 0, '10-15': 0, '15-20': 0 };
    data.notes.forEach(n => {
      if (n.noteFinale < 5) tranches['0-5']++;
      else if (n.noteFinale < 10) tranches['5-10']++;
      else if (n.noteFinale < 15) tranches['10-15']++;
      else tranches['15-20']++;
    });
    return Object.entries(tranches).map(([tranche, count]) => ({ tranche, count }));
  }, [data]);

  // 2. Export en PNG (via html2canvas)
  const exportChart = (chartId, filename) => {
    import('html2canvas').then(html2canvas => {
      const element = document.getElementById(chartId);
      if (element) {
        html2canvas.default(element).then(canvas => {
          const link = document.createElement('a');
          link.download = `${filename}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        });
      }
    });
  };

  if (loading) return <div className="loading">Chargement des statistiques...</div>;

  return (
    <div className="stats-dashboard">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Graphique 1 : Répartition PA/PD/PP/CJ (Doughnut) */}
        <div className="card" id="chart-doughnut" style={{ padding: 16 }}>
          <h3 className="card-title">📊 Répartition des statuts</h3>
          <button 
            className="btn-outline" 
            style={{ fontSize: 10, float: 'right', marginTop: -28 }}
            onClick={() => exportChart('chart-doughnut', 'repartition_statuts')}
          >
            ⬇️ Export
          </button>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name} (${value})`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Graphique 2 : Distribution des notes (Histogramme) */}
        <div className="card" id="chart-distribution" style={{ padding: 16 }}>
          <h3 className="card-title">📈 Distribution des notes</h3>
          <button 
            className="btn-outline" 
            style={{ fontSize: 10, float: 'right', marginTop: -28 }}
            onClick={() => exportChart('chart-distribution', 'distribution_notes')}
          >
            ⬇️ Export
          </button>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={distributionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tranche" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#185FA5" radius={[4, 4, 0, 0]}>
                {distributionData.map((entry, index) => {
                  const color = entry.tranche === '0-5' || entry.tranche === '5-10' ? '#dc3545' : '#28a745';
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
            🔴 Échec (0-10) &nbsp;|&nbsp; 🟢 Réussite (10-20)
          </div>
        </div>

        {/* Graphique 3 : Évolution des résultats (Line chart) - si données historiques */}
        {data?.evolution && data.evolution.length > 0 && (
          <div className="card" id="chart-evolution" style={{ padding: 16, gridColumn: '1 / span 2' }}>
            <h3 className="card-title">📈 Évolution des résultats par année</h3>
            <button 
              className="btn-outline" 
              style={{ fontSize: 10, float: 'right', marginTop: -28 }}
              onClick={() => exportChart('chart-evolution', 'evolution_resultats')}
            >
              ⬇️ Export
            </button>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={data.evolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="annee" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="tauxReussite" stroke="#28a745" fill="#28a745" fillOpacity={0.3} />
                <Area type="monotone" dataKey="tauxEchec" stroke="#dc3545" fill="#dc3545" fillOpacity={0.3} />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}