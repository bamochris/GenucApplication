// src/components/import/ImportProgress.jsx
export default function ImportProgress({ value, max }) {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <div style={{ width: '100%', height: 20, background: 'var(--bg-secondary)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, #007bff, #28a745)', transition: 'width 0.3s' }} />
    </div>
  );
}