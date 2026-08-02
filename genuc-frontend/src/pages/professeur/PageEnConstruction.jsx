// src/pages/professeur/PageEnConstruction.jsx
export default function PageEnConstruction({ title, icon }) {
  return (
    <div className="professeur-dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
      <div className="card" style={{ textAlign: 'center', padding: 60, maxWidth: 500 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🚧</div>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 10 }}>{icon} {title}</h2>
        <p style={{ color: 'var(--text-muted)' }}>Cette page est en cours de développement.</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>Revenez bientôt pour découvrir les nouvelles fonctionnalités.</p>
      </div>
    </div>
  );
}