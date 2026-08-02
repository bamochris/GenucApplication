import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';

const TYPE_LABELS = {
  EXCELLENCE: { label: 'Bourse d\'excellence', icon: '🏆', color: '#f5a623' },
  SOCIALE: { label: 'Aide sociale', icon: '🤝', color: '#185FA5' },
  SPORT: { label: 'Bourse sportive', icon: '⚽', color: '#1D9E75' },
  MINISTERIELLE: { label: 'Bourse ministérielle', icon: '🏛️', color: '#9b59b6' },
  REDUCTION: { label: 'Réduction spéciale', icon: '💳', color: '#e74c3c' },
};

function StatutBadge({ statut }) {
  const styles = {
    EN_ATTENTE: { bg: '#fff3cd', color: '#856404', label: 'En attente' },
    APPROUVEE: { bg: '#d4edda', color: '#1D9E75', label: 'Approuvée' },
    REJETEE: { bg: '#f8d7da', color: '#e05563', label: 'Rejetée' },
    ACTIVE: { bg: '#cce5ff', color: '#185FA5', label: 'Active' },
  }[statut] || { bg: '#eee', color: 'var(--text-muted)', label: statut };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, background: styles.bg, color: styles.color, fontSize: 12, fontWeight: 600 }}>
      {styles.label}
    </span>
  );
}

export default function Bourses() {
  const { user } = useAuth();
  const [bourses, setBourses] = useState([]);
  const [mesDemandesIds, setMesDemandesIds] = useState([]);
  const [mesDemandes, setMesDemandes] = useState([]);
  const [tab, setTab] = useState('disponibles');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ motivation: '', pieces: null });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/api/bourses/disponibles'),
      api.get(`/api/bourses/mes-demandes/${user.id}`),
    ]).then(([bRes, dRes]) => {
      setBourses(bRes.data || []);
      const dem = dRes.data || [];
      setMesDemandes(dem);
      setMesDemandesIds(dem.map(d => d.bourseId));
    }).catch(console.error).finally(() => setLoading(false));
  }, [user.id]);

  const postuler = async (e) => {
    e.preventDefault();
    if (!modal) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.append('bourseId', modal.id);
    fd.append('etudiantId', user.id);
    fd.append('motivation', form.motivation);
    if (form.pieces) fd.append('pieces', form.pieces);
    try {
      const res = await api.post('/api/bourses/postuler', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMesDemandesIds(prev => [...prev, modal.id]);
      setMesDemandes(prev => [...prev, { ...res.data, bourse: modal }]);
      setModal(null);
      setForm({ motivation: '', pieces: null });
      setMessage('Candidature soumise avec succès ! Vous serez notifié de la décision.');
      setTab('mes-demandes');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Erreur lors de la soumission');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h2 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Bourses & aides financières</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Consultez les bourses disponibles et postulez en ligne.</p>

      {message && (
        <div style={{ padding: '12px 16px', background: 'rgba(29,158,117,0.12)', color: '#1D9E75', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
          {message} <button onClick={() => setMessage('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(24,95,165,0.12)', borderRadius: 8, padding: 4 }}>
        {[
          { key: 'disponibles', label: `Bourses disponibles (${bourses.length})` },
          { key: 'mes-demandes', label: `Mes candidatures (${mesDemandes.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '8px 12px', border: 'none', borderRadius: 6, cursor: 'pointer',
            background: tab === t.key ? 'white' : 'transparent',
            fontWeight: tab === t.key ? 700 : 400, fontSize: 13,
            color: tab === t.key ? '#0B1F4A' : '#666',
            boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Bourses disponibles */}
      {tab === 'disponibles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {bourses.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Aucune bourse disponible actuellement</div>}
          {bourses.map(b => {
            const type = TYPE_LABELS[b.type] || { label: b.type, icon: '🎓', color: 'var(--text-muted)' };
            const dejaPostule = mesDemandesIds.includes(b.id);
            return (
              <div key={b.id} style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: `1px solid ${type.color}22` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 32 }}>{type.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 16 }}>{b.libelle}</div>
                      <div style={{ display: 'inline-block', background: type.color + '22', color: type.color, fontSize: 11, padding: '2px 8px', borderRadius: 20, marginTop: 4, fontWeight: 600 }}>
                        {type.label}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 18, color: type.color }}>
                      {b.montant > 0 ? `${b.montant.toLocaleString('fr-FR')} ${b.devise}` : `${b.pourcentage}% de remise`}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {b.placesRestantes} place{b.placesRestantes !== 1 ? 's' : ''} restante{b.placesRestantes !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, margin: '12px 0' }}>{b.description}</p>

                <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                  {b.conditions?.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                      <span style={{ color: type.color }}>•</span> {c}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: '#cc0000' }}>
                    Date limite : {b.dateLimite ? new Date(b.dateLimite).toLocaleDateString('fr-FR') : 'Non définie'}
                  </div>
                  {dejaPostule ? (
                    <StatutBadge statut={mesDemandes.find(d => d.bourseId === b.id)?.statut || 'EN_ATTENTE'} />
                  ) : b.placesRestantes > 0 ? (
                    <button onClick={() => setModal(b)} style={{
                      padding: '9px 20px', background: type.color, color: 'white',
                      border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    }}>
                      Postuler
                    </button>
                  ) : (
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Complet</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mes candidatures */}
      {tab === 'mes-demandes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mesDemandes.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Aucune candidature soumise</div>}
          {mesDemandes.map(d => (
            <div key={d.id} style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.bourse?.libelle || `Bourse #${d.bourseId}`}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                  Soumise le {new Date(d.dateDemande).toLocaleDateString('fr-FR')}
                </div>
                {d.motifRejet && <div style={{ fontSize: 12, color: '#cc0000', marginTop: 4 }}>Motif : {d.motifRejet}</div>}
              </div>
              <StatutBadge statut={d.statut} />
            </div>
          ))}
        </div>
      )}

      {/* Modal candidature */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 32, maxWidth: 540, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 18 }}>Candidature — {modal.libelle}</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={postuler} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Lettre de motivation *</label>
                <textarea value={form.motivation} onChange={e => setForm(f => ({ ...f, motivation: e.target.value }))}
                  placeholder="Expliquez pourquoi vous méritez cette bourse (min. 100 mots)..."
                  rows={6} required minLength={100}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Pièces justificatives</label>
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setForm(f => ({ ...f, pieces: e.target.files[0] }))}
                  style={{ fontSize: 12 }} />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Relevés de notes, attestation de situation familiale, etc.</div>
              </div>
              <button type="submit" disabled={submitting || !form.motivation.trim()} style={{
                padding: 14, background: submitting ? '#aaa' : '#185FA5', color: 'white',
                border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: submitting ? 'default' : 'pointer',
              }}>
                {submitting ? 'Soumission...' : 'Soumettre ma candidature'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
