// src/components/PaiementStatutPoller.jsx
// Composant d'attente pour les paiements Mobile Money.
// Polls toutes les 5s l'endpoint de statut (par défaut le flux étudiant
// /api/tachpay/etudiant/paiement/{reference}/statut ; surchargez statutUrl
// pour le flux public dossier /api/dossiers/paiement/statut/{reference}).
import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';

const POLL_INTERVAL_MS = 5000;
const TIMEOUT_MS       = 3 * 60 * 1000; // 3 minutes

const OPERATEUR_COLORS = {
  VODACOM: '#e60012',
  AIRTEL:  '#cc0000',
  ORANGE:  '#f77f00',
};

const OPERATEUR_LOGOS = {
  VODACOM: '📡',
  AIRTEL:  '📶',
  ORANGE:  '🟠',
};

export default function PaiementStatutPoller({ reference, operateur, montant, onSuccess, onEchec, onTimeout, statutUrl, message }) {
  const [, setStatut]         = useState('EN_ATTENTE');
  const [secondes, setSecondes]     = useState(0);
  const [timeoutAtteint, setTimeoutAtteint] = useState(false);
  const intervalRef = useRef(null);
  const timerRef    = useRef(null);
  const totalRef    = useRef(0);

  const couleur = OPERATEUR_COLORS[operateur?.toUpperCase()] || '#0B1F4A';

  useEffect(() => {
    if (!reference) return;

    const poll = async () => {
      try {
        const res = await api.get(statutUrl || `/api/tachpay/etudiant/paiement/${reference}/statut`);
        const s = res.data?.statut;
        setStatut(s);
        if (s === 'VALIDE') {
          clearInterval(intervalRef.current);
          clearInterval(timerRef.current);
          onSuccess?.(res.data);
        } else if (s === 'REJETE') {
          clearInterval(intervalRef.current);
          clearInterval(timerRef.current);
          onEchec?.(res.data?.motifRejet || 'Paiement refusé');
        }
      } catch {
        // réseau — on réessaie au prochain tick
      }
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    timerRef.current = setInterval(() => {
      totalRef.current += 1;
      setSecondes(totalRef.current);
      if (totalRef.current * 1000 >= TIMEOUT_MS) {
        clearInterval(intervalRef.current);
        clearInterval(timerRef.current);
        setTimeoutAtteint(true);
        onTimeout?.();
      }
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(timerRef.current);
    };
  }, [reference]); // eslint-disable-line react-hooks/exhaustive-deps

  const minutesRestantes = Math.max(0, Math.floor((TIMEOUT_MS / 1000 - secondes) / 60));
  const secondesRestantes = Math.max(0, (TIMEOUT_MS / 1000 - secondes) % 60);
  const pourcentage = Math.min(100, (secondes / (TIMEOUT_MS / 1000)) * 100);

  if (timeoutAtteint) {
    return (
      <div style={styles.container}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⏰</div>
        <h3 style={{ color: '#cc6600', marginBottom: 8 }}>Délai d'attente dépassé</h3>
        <p style={styles.sub}>
          Votre paiement n'a pas été confirmé dans les 3 minutes. Si vous avez validé sur votre téléphone,
          vérifiez votre historique — la transaction peut encore aboutir.
        </p>
        <div style={styles.refBox}>Référence : <strong>{reference}</strong></div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Icône opérateur animée */}
      <div style={{ fontSize: 48, marginBottom: 8, animation: 'pulse 1.5s infinite' }}>
        {OPERATEUR_LOGOS[operateur?.toUpperCase()] || '📱'}
      </div>

      <h3 style={{ color: couleur, marginBottom: 6 }}>
        En attente de confirmation {operateur}
      </h3>

      <p style={styles.sub}>
        {message || (
          <>
            Un message a été envoyé à votre téléphone.<br />
            <strong>Approuvez le paiement</strong> pour confirmer la transaction.
          </>
        )}
      </p>

      <div style={styles.refBox}>
        Référence : <strong>{reference}</strong> · Montant : <strong>{montant} USD</strong>
      </div>

      {/* Barre de progression temporelle */}
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressBar, width: `${100 - pourcentage}%`, background: couleur }} />
      </div>
      <p style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
        Expire dans {minutesRestantes}:{String(secondesRestantes).padStart(2, '0')}
      </p>

      {/* Spinner */}
      <div style={styles.spinner}>
        <div style={{ ...styles.spinnerRing, borderTopColor: couleur }} />
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Vérification automatique toutes les 5 secondes…</p>

      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
        @keyframes spin  { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', padding: '32px 24px', maxWidth: 420, margin: '0 auto',
  },
  sub: { fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 },
  refBox: {
    background: 'var(--bg-secondary)', border: '1px solid var(--border-color, #e0e7ef)', borderRadius: 8,
    padding: '8px 16px', fontSize: 13, color: 'var(--text-primary)', marginBottom: 16,
  },
  progressTrack: {
    width: '100%', height: 6, background: 'var(--bg-secondary)',
    borderRadius: 99, overflow: 'hidden', marginTop: 4,
  },
  progressBar: {
    height: '100%', borderRadius: 99,
    transition: 'width 1s linear',
  },
  spinner: { margin: '20px auto 6px', position: 'relative', width: 40, height: 40 },
  spinnerRing: {
    position: 'absolute', inset: 0, borderRadius: '50%',
    border: '3px solid var(--border-color)', borderTopColor: '#0B1F4A',
    animation: 'spin 0.8s linear infinite',
  },
};
