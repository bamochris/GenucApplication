// src/pages/PaiementInscription.jsx
// Paiement public des frais d'inscription par n° de dossier (avant traitement du dossier).
// Aucun compte requis : l'étudiant arrive ici depuis l'accusé de réception.
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import PaiementStatutPoller from '../components/PaiementStatutPoller';
import ReCAPTCHA from "react-google-recaptcha";

const OPERATEURS = [
  { code: 'VODACOM', label: 'Vodacom M-Pesa' },
  { code: 'ORANGE', label: 'Orange Money' },
  { code: 'AIRTEL', label: 'Airtel Money' },
];

export default function PaiementInscription() {
  const [params] = useSearchParams();
  const [numero, setNumero] = useState('');
  const [numeroSaisi, setNumeroSaisi] = useState('');
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [operateur, setOperateur] = useState('VODACOM');
  const [telephone, setTelephone] = useState('');
  const [paiement, setPaiement] = useState(false);
  const [succes, setSucces] = useState(null);
  // Transaction initiée, en attente de confirmation par le webhook opérateur
  const [enAttente, setEnAttente] = useState(null);
  // CAPTCHA pour protéger contre les attaques automatisées
  const [captchaToken, setCaptchaToken] = useState(null);

  const charger = async (num) => {
    const n = (num || '').trim();
    if (!n) return;
    setLoading(true); setError(''); setInfo(null); setSucces(null);
    try {
      const res = await api.get(`/api/dossiers/${encodeURIComponent(n)}/paiement`);
      setInfo(res.data);
    } catch (e) {
      setError(e.response?.data?.erreur || e.message || 'Dossier introuvable.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (params.get('dossier')) {
      const d = params.get('dossier');
      setNumero(d);
      setNumeroSaisi(d);
      charger(d);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const payer = async () => {
    if (!telephone.trim()) { setError('Entrez le numéro de téléphone Mobile Money.'); return; }
    
    // Validation CAPTCHA
    if (!captchaToken) {
      setError('Veuillez compléter le CAPTCHA de sécurité.');
      return;
    }
    
    setPaiement(true); setError('');
    try {
      // Le backend INITIE la transaction (PENDING) — le dossier n'est marqué
      // payé qu'à la confirmation par le webhook opérateur. On attend donc
      // le statut réel avant d'afficher le succès.
      const res = await api.post(`/api/dossiers/${encodeURIComponent(info.numeroDossier)}/payer`, { 
        operateur, 
        telephone,
        captchaToken 
      });
      setEnAttente(res.data);
    } catch (e) {
      setError(e.response?.data?.erreur || e.message || 'Échec du paiement.');
    } finally { setPaiement(false); }
  };

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  const card = { maxWidth: 560, width: '100%', background: 'var(--bg-card, #fff)', borderRadius: 16, padding: '32px 28px', boxShadow: '0 10px 40px rgba(0,0,0,0.10)' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg-secondary, #f1f5f9)' }}>
      <div style={card}>
        <h2 style={{ color: '#185FA5', margin: '0 0 4px', fontSize: 20 }}>💳 Paiement des frais d'inscription</h2>
        <p style={{ color: 'var(--text-muted, #64748b)', fontSize: 13, marginTop: 0 }}>
          Cette page reste disponible, mais le lien d'accuse de reception redirige maintenant vers TachPay avec reconnaissance par numero de dossier.
        </p>

        {/* Recherche par n° de dossier */}
        <div style={{ display: 'flex', gap: 8, margin: '14px 0' }}>
          <input
            value={numero}
            onChange={e => setNumero(e.target.value)}
            placeholder="N° de dossier (ex: HADOS-2026-000000)"
            style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--border-color, #cbd5e1)', borderRadius: 8, fontSize: 14 }}
          />
          <button onClick={() => charger(numero)} disabled={loading}
            style={{ padding: '10px 16px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
            {loading ? '…' : 'Rechercher'}
          </button>
        </div>

        {error && <div style={{ background: 'rgba(220,53,69,0.10)', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{error}</div>}

        {info && (
          <>
            <div style={{ background: 'rgba(24,95,165,0.10)', borderRadius: 12, padding: 18, marginBottom: 16 }}>
              <div style={{ marginBottom: 6 }}><strong>Candidat :</strong> {info.prenom} {info.nom}</div>
              <div style={{ marginBottom: 6 }}><strong>N° dossier :</strong> <span style={{ color: '#185FA5', fontWeight: 700 }}>{info.numeroDossier}</span></div>
              <div style={{ borderTop: '1px solid #bfdbfe', marginTop: 8, paddingTop: 8, fontSize: 18 }}>
                <strong>Montant : </strong>
                <span style={{ color: '#185FA5', fontWeight: 800 }}>
                  {info.montant != null ? `${info.montant} ${info.devise}` : 'À confirmer par l\'université'}
                </span>
              </div>
            </div>

            {info.paymentExpired && !info.paye && (
              <div style={{ background: 'rgba(220,53,69,0.10)', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 13 }}>
                Le lien de paiement associe a ce dossier a expire apres 72h. Contactez l'universite ou reutilisez votre numero de dossier si une nouvelle procedure est ouverte.
              </div>
            )}

            {info.paymentExpiresAt && !info.paye && (
              <p style={{ fontSize: 12, color: 'var(--text-muted, #64748b)', marginTop: -6, marginBottom: 16 }}>
                Echeance du lien : <strong>{new Date(info.paymentExpiresAt).toLocaleString('fr-FR')}</strong>
              </p>
            )}

            {enAttente ? (
              <PaiementStatutPoller
                reference={enAttente.reference}
                operateur={operateur}
                montant={info.montant}
                statutUrl={`/api/dossiers/paiement/statut/${encodeURIComponent(enAttente.reference)}`}
                onSuccess={() => {
                  setSucces({ reference: enAttente.reference });
                  setEnAttente(null);
                  setInfo({ ...info, paye: true });
                }}
                onEchec={(motif) => {
                  setEnAttente(null);
                  setError(motif || 'Le paiement a été refusé. Veuillez réessayer.');
                }}
              />
            ) : info.paye || succes ? (
              <div style={{ background: 'rgba(29,158,117,0.12)', border: '1px solid #86efac', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 40 }}>✅</div>
                <h3 style={{ color: '#1D9E75', margin: '8px 0' }}>Frais d'inscription payés</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary, #475569)', margin: 0 }}>
                  {succes?.reference && <>Référence : <strong>{succes.reference}</strong><br /></>}
                  Votre dossier est maintenant transmis au secrétariat pour traitement. Vous serez notifié après validation.
                </p>
                <Link to="/suivi-dossier" style={{ display: 'inline-block', marginTop: 12, color: '#1D9E75', fontWeight: 600 }}>Suivre mon dossier →</Link>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Opérateur Mobile Money</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {OPERATEURS.map(o => (
                      <label key={o.code} style={{ display: 'flex', alignItems: 'center', gap: 6, border: operateur === o.code ? '2px solid #185FA5' : '1.5px solid var(--border-color, #cbd5e1)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}>
                        <input type="radio" name="op" checked={operateur === o.code} onChange={() => setOperateur(o.code)} />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Numéro de téléphone</label>
                  <input value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="Ex: +243 8XX XXX XXX"
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border-color, #cbd5e1)', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
                </div>
                
                {/* CAPTCHA de sécurité */}
                <div style={{ marginBottom: 14 }}>
                  <ReCAPTCHA
                    sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY || 'your-recaptcha-site-key'}
                    onChange={handleCaptchaChange}
                    onExpired={() => setCaptchaToken(null)}
                  />
                </div>
                
                <button onClick={payer} disabled={paiement || info.paymentExpired}
                  style={{ width: '100%', padding: 13, background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: paiement ? 'not-allowed' : 'pointer', opacity: paiement ? 0.6 : 1 }}>
                  {paiement ? '⏳ Paiement en cours...' : info.paymentExpired ? 'Lien de paiement expiré' : `Payer ${info.montant != null ? `${info.montant} ${info.devise}` : 'les frais'}`}
                </button>
                <p style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginTop: 10, textAlign: 'center' }}>
                  Paiement sécurisé Mobile Money. Une demande de confirmation sera envoyée sur votre téléphone.
                </p>
              </>
            )}
          </>
        )}

        <div style={{ marginTop: 18, textAlign: 'center' }}>
          <Link to="/" style={{ color: 'var(--text-muted, #64748b)', fontSize: 13 }}>← Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  );
}
