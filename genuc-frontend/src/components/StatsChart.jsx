// src/components/StatsChart.jsx
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../api/axios';

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

export default function StatsChart({ annee }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);

    Promise.all([
      api.get(`/api/stats/inscriptions-par-mois/${annee}`, { signal: ctrl.signal }),
      api.get(`/api/stats/paiements-par-mois/${annee}`, { signal: ctrl.signal }),
    ])
      .then(([inscriptionsRes, paiementsRes]) => {
        const rows = MOIS.map((mois, i) => ({
          mois,
          inscriptions: inscriptionsRes.data?.[i + 1] ?? 0,
          paiements: paiementsRes.data?.[i + 1] ?? 0,
        }));
        setData(rows);
      })
       .catch((err) => {
         if (
           err.name !== 'CanceledError' &&
           err.code !== 'ERR_CANCELED'
         ) setError('Impossible de charger les statistiques.');
       })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [annee]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--color-gray-500, #64748b)', fontSize: 13 }}>
      Chargement du graphique...
    </div>
  );

  if (error) return (
    <div style={{ fontSize: 13, color: 'var(--color-danger, #dc3545)', background: 'var(--color-danger-bg, #FAECE7)', border: '1px solid #f3c8bb', borderRadius: 6, padding: '10px 14px' }}>
      ⚠️ {error}
    </div>
  );

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border-color)' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar yAxisId="left"  dataKey="inscriptions" fill="#185FA5" name="Inscriptions" radius={[4,4,0,0]} />
          <Bar yAxisId="right" dataKey="paiements"    fill="#1D9E75" name="Paiements (USD)" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}