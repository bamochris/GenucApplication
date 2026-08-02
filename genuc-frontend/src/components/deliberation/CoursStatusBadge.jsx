// src/components/deliberation/CoursStatusBadge.jsx
export default function CoursStatusBadge({ statut }) {
  const config = {
    'RECU': { label: '📥 Reçu', className: 'badge-info' },
    'EN_ATTENTE': { label: '⏳ En attente', className: 'badge-warning' },
    'VALIDE': { label: '✅ Validé', className: 'badge-success' },
    'RETOURNE': { label: '🔄 Retourné', className: 'badge-danger' },
  };

  const { label, className } = config[statut] || { label: statut, className: 'badge-neutral' };

  return <span className={`badge ${className}`}>{label}</span>;
}