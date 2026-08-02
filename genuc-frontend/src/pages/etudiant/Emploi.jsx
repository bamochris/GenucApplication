import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const SECTEURS = ['Tous', 'Informatique', 'Finance', 'Santé', 'Éducation', 'Mines', 'Télécoms', 'ONG', 'Administration'];

function OffreCard({ offre, onPostuler }) {
  const [postulant, setPostulant] = useState(false);
  const [dejaPostule, setDejaPostule] = useState(offre.dejaPostule);

  const handlePostuler = async () => {
    setPostulant(true);
    await onPostuler(offre.id);
    setDejaPostule(true);
    setPostulant(false);
  };

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 14 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 10, background: 'rgba(24,95,165,0.12)', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>
          {offre.logoUrl ? <img src={offre.logoUrl} alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} /> : '🏢'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15, marginBottom: 2 }}>{offre.titre}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
            {offre.entreprise} — {offre.lieu}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(24,95,165,0.12)', color: '#185FA5', fontSize: 11, fontWeight: 600 }}>
              {offre.type}
            </span>
            <span style={{ padding: '3px 10px', borderRadius: 20, background: '#f0fff8', color: '#1D9E75', fontSize: 11, fontWeight: 600 }}>
              {offre.secteur}
            </span>
            {offre.salaire && (
              <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(192,122,43,0.15)', color: '#856404', fontSize: 11, fontWeight: 600 }}>
                {offre.salaire}
              </span>
            )}
            {offre.compatible && (
              <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(29,158,117,0.12)', color: '#1D9E75', fontSize: 11, fontWeight: 600 }}>
                ✓ Correspond à votre profil
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
            {new Date(offre.datePublication).toLocaleDateString('fr-FR')}
          </div>
          {dejaPostule ? (
            <span style={{ padding: '6px 14px', borderRadius: 6, background: 'rgba(29,158,117,0.12)', color: '#1D9E75', fontSize: 12, fontWeight: 600 }}>
              ✓ Candidaté
            </span>
          ) : (
            <button onClick={handlePostuler} disabled={postulant} style={{
              padding: '7px 16px', background: '#185FA5', color: 'white',
              border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>
              {postulant ? '...' : 'Postuler'}
            </button>
          )}
        </div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 12 }}>{offre.description}</p>
      {offre.competences?.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {offre.competences.map(c => (
            <span key={c} style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: 11 }}>{c}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Emploi() {
  const { user } = useAuth();
  const [offres, setOffres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [secteur, setSecteur] = useState('Tous');
  const [typeFilter, setTypeFilter] = useState('');
  const [compatiblesOnly, setCompatiblesOnly] = useState(false);

  useEffect(() => {
    api.get(`/api/emploi/offres?etudiantId=${user.id}`)
      .then(r => setOffres(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.id]);

  const postuler = async (offreId) => {
    try {
      await api.post('/api/emploi/candidature', { offreId, etudiantId: user.id });
    } catch {}
  };

  const filtered = offres.filter(o => {
    const matchSearch = o.titre?.toLowerCase().includes(search.toLowerCase()) || o.entreprise?.toLowerCase().includes(search.toLowerCase());
    const matchSecteur = secteur === 'Tous' || o.secteur === secteur;
    const matchType = !typeFilter || o.type === typeFilter;
    const matchCompat = !compatiblesOnly || o.compatible;
    return matchSearch && matchSecteur && matchType && matchCompat;
  });

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des offres...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Offres d'emploi & stages</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{offres.filter(o => o.compatible).length} offres correspondent à votre profil</p>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', background: 'var(--bg-card)', padding: '14px 16px', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Poste, entreprise..."
          style={{ flex: '1 1 200px', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }} />
        <select value={secteur} onChange={e => setSecteur(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}>
          {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}>
          <option value="">Tous types</option>
          <option value="CDI">CDI</option>
          <option value="CDD">CDD</option>
          <option value="Stage">Stage</option>
          <option value="Freelance">Freelance</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={compatiblesOnly} onChange={e => setCompatiblesOnly(e.target.checked)} />
          Mon profil uniquement
        </label>
      </div>

      <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>{filtered.length} offre{filtered.length !== 1 ? 's' : ''} trouvée{filtered.length !== 1 ? 's' : ''}</div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Aucune offre ne correspond à vos critères</div>
      ) : (
        filtered.map(o => <OffreCard key={o.id} offre={o} onPostuler={postuler} />)
      )}
    </div>
  );
}
