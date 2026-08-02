import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';

const PLANS = [
  { mois: 1, label: 'Paiement comptant', remise: 5, description: 'Payez tout maintenant et bénéficiez de 5% de remise' },
  { mois: 3, label: '3 tranches', remise: 0, description: 'Répartissez sur 3 mois (début, 2ème, 3ème mois)' },
  { mois: 6, label: '6 tranches', remise: 0, description: 'Répartissez sur 6 mois — plus de flexibilité' },
  { mois: 12, label: '12 tranches', remise: 0, description: 'Paiement mensuel sur toute l\'année académique' },
];

function PaiementTranche({ tranche, onPay, currency }) {
  const [paying, setPaying] = useState(false);
  const isPaid = tranche.statut === 'PAYE';
  const isLate = !isPaid && new Date(tranche.dateEcheance) < new Date();

  const pay = async () => {
    setPaying(true);
    await onPay(tranche.id);
    setPaying(false);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px',
      background: isPaid ? '#f0fff8' : isLate ? '#fff3f3' : 'white',
      border: `1px solid ${isPaid ? '#b2dfdb' : isLate ? '#ffcccc' : '#eee'}`,
      borderRadius: 10, marginBottom: 10,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: isPaid ? '#1D9E75' : isLate ? '#cc0000' : '#eee',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700,
      }}>
        {isPaid ? '✓' : tranche.numero}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>Tranche {tranche.numero}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Échéance : {new Date(tranche.dateEcheance).toLocaleDateString('fr-FR')}
          {isLate && !isPaid && <span style={{ color: '#cc0000', marginLeft: 8 }}>⚠️ En retard</span>}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
          {tranche.montant.toLocaleString('fr-FR')} {currency}
        </div>
        {isPaid ? (
          <div style={{ fontSize: 12, color: '#1D9E75' }}>Payé le {new Date(tranche.datePaiement).toLocaleDateString('fr-FR')}</div>
        ) : (
          <button onClick={pay} disabled={paying} style={{
            padding: '6px 14px', background: isLate ? '#cc0000' : '#185FA5',
            color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, marginTop: 4,
          }}>
            {paying ? '...' : 'Payer'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function PlanPaiement() {
  const { user } = useAuth();
  const [frais, setFrais] = useState(null);
  const [planActif, setPlanActif] = useState(null);
  const [tranches, setTranches] = useState([]);
  const [planChoisi, setPlanChoisi] = useState(3);
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/api/frais/etudiant/${user.id}/annee-courante`),
      api.get(`/api/paiements/plan/etudiant/${user.id}`),
    ]).then(([fRes, pRes]) => {
      setFrais(fRes.data);
      if (pRes.data) {
        setPlanActif(pRes.data);
        setTranches(pRes.data.tranches || []);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [user.id]);

  const creerPlan = async () => {
    setCreating(true);
    try {
      const res = await api.post('/api/paiements/plan/creer', {
        etudiantId: user.id,
        nbTranches: planChoisi,
        devise: currency,
      });
      setPlanActif(res.data);
      setTranches(res.data.tranches || []);
      setMessage('Plan d\'échelonnement créé avec succès !');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Erreur lors de la création du plan');
    } finally { setCreating(false); }
  };

  const payerTranche = async (trancheId) => {
    try {
      const res = await api.post(`/api/paiements/plan/tranches/${trancheId}/payer`, { devise: currency });
      setTranches(prev => prev.map(t => t.id === trancheId ? { ...t, statut: 'PAYE', datePaiement: new Date().toISOString() } : t));
      setMessage('Paiement effectué avec succès !');
      return res.data;
    } catch (err) {
      setMessage(err.response?.data?.message || 'Erreur de paiement');
    }
  };

  const totalPaye = tranches.filter(t => t.statut === 'PAYE').reduce((s, t) => s + t.montant, 0);
  const totalRestant = tranches.filter(t => t.statut !== 'PAYE').reduce((s, t) => s + t.montant, 0);
  const pctPaye = frais?.totalFrais ? Math.round((totalPaye / frais.totalFrais) * 100) : 0;

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
      <h2 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Plan de paiement échelonné</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Gérez le paiement de vos frais académiques en toute flexibilité.</p>

      {message && (
        <div style={{ padding: '12px 16px', background: 'rgba(29,158,117,0.12)', color: '#1D9E75', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
          {message} <button onClick={() => setMessage('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#1D9E75' }}>✕</button>
        </div>
      )}

      {/* Résumé frais */}
      {frais && (
        <div style={{ background: 'linear-gradient(135deg, #0B1F4A 0%, #185FA5 100%)', borderRadius: 14, padding: 24, color: 'white', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>Total frais académiques {frais.annee}</div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4 }}>
                {frais.totalFrais?.toLocaleString('fr-FR')} <span style={{ fontSize: 18, opacity: 0.8 }}>{currency}</span>
              </div>
            </div>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 13, cursor: 'pointer' }}>
              <option value="USD">USD $</option>
              <option value="CDF">CDF FC</option>
            </select>
          </div>
          {planActif && (
            <>
              <div style={{ marginBottom: 8, fontSize: 13, opacity: 0.8 }}>Progression du paiement</div>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 6, height: 10 }}>
                <div style={{ background: '#9FE1CB', height: '100%', borderRadius: 6, width: `${pctPaye}%`, transition: 'width 0.6s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, opacity: 0.9 }}>
                <span>Payé : {totalPaye.toLocaleString('fr-FR')} {currency} ({pctPaye}%)</span>
                <span>Restant : {totalRestant.toLocaleString('fr-FR')} {currency}</span>
              </div>
            </>
          )}
        </div>
      )}

      {!planActif ? (
        /* Créer un plan */
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 28 }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: 16, marginBottom: 20 }}>Choisissez votre plan de paiement</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            {PLANS.map(p => (
              <div key={p.mois} onClick={() => setPlanChoisi(p.mois)}
                style={{
                  padding: 16, borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                  border: `2px solid ${planChoisi === p.mois ? '#185FA5' : '#eee'}`,
                  background: planChoisi === p.mois ? '#f0f4ff' : 'white',
                }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>{p.label}</div>
                {p.remise > 0 && (
                  <div style={{ display: 'inline-block', background: '#1D9E75', color: 'white', fontSize: 11, padding: '2px 8px', borderRadius: 20, marginTop: 4 }}>
                    -{p.remise}% de remise
                  </div>
                )}
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>{p.description}</div>
                {frais && (
                  <div style={{ marginTop: 10, fontWeight: 600, color: '#185FA5' }}>
                    {p.mois === 1 ? (
                      `${Math.round(frais.totalFrais * (1 - p.remise / 100)).toLocaleString('fr-FR')} ${currency} unique`
                    ) : (
                      `≈ ${Math.round(frais.totalFrais / p.mois).toLocaleString('fr-FR')} ${currency}/mois`
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={creerPlan} disabled={creating}
            style={{ width: '100%', padding: 14, background: creating ? '#aaa' : '#185FA5', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: creating ? 'default' : 'pointer' }}>
            {creating ? 'Création du plan...' : 'Créer mon plan de paiement'}
          </button>
        </div>
      ) : (
        /* Tranches */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 16 }}>
              Plan {planActif.nbTranches} tranches — Créé le {new Date(planActif.dateCreation).toLocaleDateString('fr-FR')}
            </h3>
          </div>
          {tranches.map(t => (
            <PaiementTranche key={t.id} tranche={t} onPay={payerTranche} currency={currency} />
          ))}
        </div>
      )}
    </div>
  );
}
