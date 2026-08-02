import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDesign } from '../../context/DesignContext';
import api from '../../api/axios';
import AlumniDashboardPremium from './AlumniDashboardPremium';

export default function AlumniDashboard() {
  const { user } = useAuth();
  const { design } = useDesign();
  const [profil, setProfil] = useState(null);
  const [reseau, setReseau] = useState([]);
  const [offres, setOffres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profil');
  const [qrDiplome, setQrDiplome] = useState(null);
  const [qrError, setQrError] = useState('');
  const [candidatures, setCandidatures] = useState({}); // { [offreId]: 'loading' | 'ok' | 'error' }

  useEffect(() => {
    Promise.all([
      api.get(`/api/alumni/${user.id}/profil`),
      api.get('/api/alumni/annuaire?limit=12'),
      api.get('/api/emploi/offres?type=alumni').catch(() => ({ data: { offres: [] } })),
    ]).then(([pRes, rRes, oRes]) => {
      setProfil(pRes.data);
      setReseau(rRes.data || []);
      // La réponse de /api/emploi/offres est un objet { offres, total, page, size }, pas un tableau brut.
      setOffres(oRes.data?.offres || []);
    }).catch(err => {
      console.error(err);
      setError('Impossible de charger votre profil alumni.');
    }).finally(() => setLoading(false));
  }, [user.id]);

  const postuler = async (offreId) => {
    setCandidatures(prev => ({ ...prev, [offreId]: 'loading' }));
    try {
      await api.post('/api/emploi/candidature', { offreId, etudiantId: user.id });
      setCandidatures(prev => ({ ...prev, [offreId]: 'ok' }));
    } catch {
      setCandidatures(prev => ({ ...prev, [offreId]: 'error' }));
    }
  };

  const genererQR = async () => {
    setQrError('');
    try {
      const res = await api.get(`/api/diplomes/${user.id}/qr-code`);
      setQrDiplome(res.data.qrCodeUrl);
    } catch {
      setQrError('Le diplôme numérique n\'est pas encore disponible pour votre profil.');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '4px solid #ddd', borderTop: '4px solid #185FA5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div className="alert-erreur">{error}</div>
      </div>
    );
  }

  // ── Variante « premium » (opt-in, réversible) ──────────────────────────
  if (design === 'premium') {
    return (
      <AlumniDashboardPremium
        user={user}
        profil={profil}
        reseau={reseau}
        offres={offres}
        candidatures={candidatures}
        qrDiplome={qrDiplome}
        qrError={qrError}
        onPostuler={postuler}
        onGenererQR={genererQR}
        onCloseQr={() => setQrDiplome(null)}
        onClearQrError={() => setQrError('')}
      />
    );
  }

  return (
    <div style={{ padding: 24, fontFamily: '-apple-system,sans-serif' }}>
      {qrError && (
        <div className="alert-erreur" style={{ marginBottom: 16 }} onClick={() => setQrError('')}>{qrError}</div>
      )}
      {/* Hero card alumni */}
      <div style={{
        background: 'linear-gradient(135deg, #0B1F4A 0%, #185FA5 100%)',
        borderRadius: 16, padding: 32, color: 'white', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0,
        }}>
          {user.prenom?.[0]}{user.nom?.[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{user.prenom} {user.nom}</div>
          <div style={{ opacity: 0.8, fontSize: 14, marginTop: 4 }}>
            Diplômé{user.genre === 'F' ? 'e' : ''} — {profil?.promotion} | {profil?.filiere}
          </div>
          <div style={{ opacity: 0.7, fontSize: 13, marginTop: 2 }}>{profil?.universite}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={genererQR} style={{
            padding: '10px 18px', background: 'rgba(255,255,255,0.2)', color: 'white',
            border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>
            📱 Diplôme numérique
          </button>
          {profil?.posteActuel && (
            <div style={{ padding: '10px 18px', background: '#1D9E75', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
              💼 {profil.posteActuel}
            </div>
          )}
        </div>
      </div>

      {/* QR code modal */}
      {qrDiplome && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 32, textAlign: 'center', maxWidth: 380 }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>Diplôme numérique vérifié</h3>
            <img src={qrDiplome} alt="QR Code diplôme" style={{ width: 200, height: 200, margin: '0 auto 16px' }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Ce QR code est lié à la blockchain. Toute personne peut scanner pour vérifier l'authenticité de votre diplôme.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <a href={qrDiplome} download="diplome-qr.png" style={{ padding: '9px 18px', background: '#185FA5', color: 'white', borderRadius: 8, textDecoration: 'none', fontSize: 13 }}>Télécharger</a>
              <button onClick={() => setQrDiplome(null)} style={{ padding: '9px 18px', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(24,95,165,0.12)', borderRadius: 8, padding: 4 }}>
        {[
          { key: 'profil', label: 'Mon profil' },
          { key: 'reseau', label: `Réseau Alumni (${reseau.length})` },
          { key: 'offres', label: `Offres ciblées (${offres.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            flex: 1, padding: '8px 12px', border: 'none', borderRadius: 6, cursor: 'pointer',
            background: activeTab === t.key ? 'white' : 'transparent', fontSize: 13,
            fontWeight: activeTab === t.key ? 700 : 400, color: activeTab === t.key ? '#0B1F4A' : '#666',
            boxShadow: activeTab === t.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab profil */}
      {activeTab === 'profil' && profil && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 24 }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 16, fontSize: 15 }}>Parcours académique</h3>
            {[
              { label: 'Promotion', value: profil.promotion },
              { label: 'Filière', value: profil.filiere },
              { label: 'Mention obtenue', value: profil.mention },
              { label: 'Année de diplôme', value: profil.anneeDiplome },
              { label: 'Numéro de diplôme', value: profil.numeroDiplome },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.value || '—'}</span>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 24 }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 16, fontSize: 15 }}>Situation professionnelle</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Poste actuel</label>
              <input defaultValue={profil.posteActuel || ''} placeholder="ex: Ingénieur logiciel chez XYZ"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Entreprise</label>
              <input defaultValue={profil.entreprise || ''} placeholder="Nom de l'entreprise"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>LinkedIn / site pro</label>
              <input defaultValue={profil.linkedin || ''} placeholder="https://linkedin.com/in/..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }} />
            </div>
            <button disabled title="La mise à jour du profil professionnel n'est pas encore disponible côté serveur."
              style={{ width: '100%', padding: '9px', background: '#a9b7c8', color: 'white', border: 'none', borderRadius: 8, cursor: 'not-allowed', fontSize: 13, fontWeight: 600 }}>
              Mettre à jour mon profil
            </button>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
              La mise à jour de la situation professionnelle sera bientôt disponible.
            </p>
          </div>
        </div>
      )}

      {/* Tab réseau */}
      {activeTab === 'reseau' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {reseau.map(a => (
            <div key={a.id} style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 18, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', background: '#185FA5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: 18, margin: '0 auto 10px',
              }}>{a.prenom?.[0]}{a.nom?.[0]}</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{a.prenom} {a.nom}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{a.promotion} — {a.filiere}</div>
              {a.posteActuel && <div style={{ fontSize: 11, color: '#185FA5', marginTop: 4 }}>{a.posteActuel}</div>}
              {a.linkedin && (
                <a href={a.linkedin} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', marginTop: 8, fontSize: 11, color: '#0077b5', textDecoration: 'none' }}>
                  LinkedIn →
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab offres */}
      {activeTab === 'offres' && (
        <div>
          {offres.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Aucune offre pour le moment</div>
          ) : offres.map(o => (
            <div key={o.id} style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 20, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.titre}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{o.entreprise} — {o.lieu}</div>
                {o.salaire && <div style={{ fontSize: 12, color: '#1D9E75', marginTop: 4, fontWeight: 600 }}>{o.salaire}</div>}
              </div>
              {candidatures[o.id] === 'ok' ? (
                <span style={{ padding: '8px 16px', color: '#1D9E75', fontSize: 12, fontWeight: 600 }}>✅ Candidature envoyée</span>
              ) : (
                <button onClick={() => postuler(o.id)} disabled={candidatures[o.id] === 'loading'}
                  style={{ padding: '8px 16px', background: '#185FA5', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, opacity: candidatures[o.id] === 'loading' ? 0.6 : 1 }}>
                  {candidatures[o.id] === 'loading' ? 'Envoi...' : candidatures[o.id] === 'error' ? 'Réessayer' : 'Postuler'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
