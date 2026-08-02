// src/components/etudiant/CircularProgress.jsx
// Petits graphiques circulaires réutilisés sur le dashboard étudiant :
// un donut « Payé / Reste » pour la situation financière, et une jauge
// radiale pour les métriques de progression académique (crédits, présence,
// couverture financière).
import { PieChart, Pie, Cell, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

export function DonutPaiement({ paye = 0, reste = 0, size = 170, colorPaye = '#1D9E75', colorReste = '#cc0000' }) {
  const total = paye + reste;
  const data = total > 0
    ? [{ name: 'Payé', value: paye }, { name: 'Reste', value: reste }]
    : [{ name: 'Payé', value: 0 }, { name: 'Reste', value: 1 }];
  const pourcentage = total > 0 ? Math.round((paye / total) * 100) : 0;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <PieChart width={size} height={size}>
        <Pie
          data={data}
          dataKey="value"
          innerRadius={size * 0.32}
          outerRadius={size * 0.48}
          startAngle={90}
          endAngle={-270}
          stroke="none"
        >
          <Cell fill={colorPaye} />
          <Cell fill={total > 0 ? colorReste : '#e2e8f0'} />
        </Pie>
      </PieChart>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{pourcentage}%</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>couvert</div>
      </div>
    </div>
  );
}

export function CircularGauge({ percent = 0, color = '#185FA5', size = 110, label }) {
  const valeur = Math.min(100, Math.max(0, percent));
  const data = [{ value: valeur }];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: size }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <RadialBarChart
          width={size}
          height={size}
          innerRadius="72%"
          outerRadius="100%"
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background dataKey="value" cornerRadius={size} fill={color} isAnimationActive={false} />
        </RadialBarChart>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color }}>{Math.round(valeur)}%</span>
        </div>
      </div>
      {label && <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>{label}</div>}
    </div>
  );
}
