// src/pages/PaiementRetour.jsx
// Page de retour après un paiement par carte (redirection Stripe Checkout).
// Montée sur /paiement/succes et /paiement/annule. Le paiement réel est
// confirmé de façon asynchrone par le webhook Stripe signé ; cette page ne
// fait qu'informer l'usager et le ramener vers son espace.
import { useSearchParams, Link } from 'react-router-dom';

export default function PaiementRetour({ statut = 'succes' }) {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id') || params.get('reference') || '';
  const succes = statut === 'succes';

  return (
    <div style={{
      minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        maxWidth: 440, width: '100%', textAlign: 'center',
        background: 'var(--bg-card, #fff)', borderRadius: 16, padding: 32,
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 38, color: '#fff',
          background: succes ? '#1D9E75' : '#cc0000',
        }}>
          {succes ? '✓' : '×'}
        </div>

        <h2 style={{ margin: '0 0 10px', color: 'var(--text-primary, #0B1F4A)' }}>
          {succes ? 'Paiement reçu' : 'Paiement annulé'}
        </h2>

        <p style={{ color: 'var(--text-secondary, #475569)', fontSize: 14, lineHeight: 1.6 }}>
          {succes ? (
            <>Votre paiement par carte a bien été soumis. Sa confirmation définitive
            arrive dans quelques instants ; un reçu vous sera envoyé par email et
            votre situation sera mise à jour dans <strong>Mes paiements</strong>.</>
          ) : (
            <>Vous avez annulé le paiement. Aucun montant n'a été débité. Vous pouvez
            réessayer à tout moment depuis votre espace.</>
          )}
        </p>

        {sessionId && (
          <div style={{
            marginTop: 14, fontSize: 12, color: 'var(--text-muted, #64748b)',
            wordBreak: 'break-all',
          }}>
            Référence : <span style={{ fontFamily: 'monospace' }}>{sessionId}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
          <Link to="/paiements" style={{
            padding: '10px 22px', borderRadius: 30, background: '#185FA5', color: '#fff',
            textDecoration: 'none', fontWeight: 600, fontSize: 14,
          }}>
            Mes paiements
          </Link>
          <Link to="/accueil" style={{
            padding: '10px 22px', borderRadius: 30, border: '1px solid var(--border-color, #cbd5e1)',
            color: 'var(--text-primary, #0B1F4A)', textDecoration: 'none', fontWeight: 600, fontSize: 14,
          }}>
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
