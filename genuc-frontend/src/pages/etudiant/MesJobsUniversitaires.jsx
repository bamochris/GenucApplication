import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  FaBriefcase, FaClock, FaMoneyBillWave, FaCertificate,
  FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaFileContract,
  FaCalendarAlt, FaChartBar
} from 'react-icons/fa';

const STATUT_STYLE = {
  EN_ATTENTE:   { bg: '#fff3cd', color: '#856404', icon: <FaHourglassHalf />,  label: 'En attente' },
  ACCEPTEE:     { bg: '#d4edda', color: '#1D9E75', icon: <FaCheckCircle />,     label: 'Acceptée' },
  REJETEE:      { bg: '#f8d7da', color: '#e05563', icon: <FaTimesCircle />,     label: 'Rejetée' },
  EN_CONTRAT:   { bg: '#cce5ff', color: '#185FA5', icon: <FaFileContract />,    label: 'En contrat' },
  TERMINE:      { bg: '#eee',    color: 'var(--text-secondary)',    icon: <FaCheckCircle />,     label: 'Terminé' },
};

export default function MesJobsUniversitaires() {
  const { user } = useAuth();
  const [tab, setTab] = useState('candidatures');
  const [candidatures, setCandidatures] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [heures, setHeures] = useState(null);
  const [loading, setLoading] = useState(true);
  const [moisSelectionne, setMoisSelectionne] = useState(new Date().toISOString().substring(0, 7));

  useEffect(() => {
    Promise.all([
      api.get(`/api/emploi-universitaire/candidatures/etudiant/${user.id}`),
      api.get(`/api/emploi-universitaire/mes-contrats/${user.id}`),
    ]).then(([cRes, contratRes]) => {
      setCandidatures(cRes.data || []);
      setContrats(contratRes.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user.id]);

  useEffect(() => {
    if (tab !== 'heures') return;
    api.get(`/api/emploi-universitaire/mes-heures/${user.id}?mois=${moisSelectionne}`)
      .then(r => setHeures(r.data))
      .catch(console.error);
  }, [tab, moisSelectionne, user.id]);

  const contratActif = contrats.find(c => c.statut === 'EN_CONTRAT');

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: 4, fontSize: 22 }}>Mes jobs universitaires</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Travaillez au sein de votre université et financez vos études.</p>
        </div>
        <Link to="/emploi-universitaire" target="_blank" rel="noreferrer"
          style={{ padding: '9px 18px', background: '#185FA5', color: 'white', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FaBriefcase /> Voir les postes
        </Link>
      </div>

      {/* Contrat actif */}
      {contratActif && (
        <div style={{ background: 'linear-gradient(135deg, #0B1F4A, #185FA5)', borderRadius: 14, padding: 24, color: 'white', marginBottom: 24, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <FaFileContract style={{ fontSize: 36, opacity: 0.8, flexShrink: 0, marginTop: 4 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>CONTRAT ACTIF</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{contratActif.poste}</div>
            <div style={{ opacity: 0.85, fontSize: 14, marginBottom: 10 }}>{contratActif.universite} · {contratActif.departement}</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaClock style={{ opacity: 0.7 }} /> {contratActif.heuresParSemaine}h/sem</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaMoneyBillWave style={{ opacity: 0.7 }} /> {contratActif.salaireNet} {contratActif.devise}/mois</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FaCalendarAlt style={{ opacity: 0.7 }} /> Depuis {contratActif.dateDebut}</span>
            </div>
          </div>
          <button onClick={() => setTab('heures')} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <FaChartBar /> Mes heures
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(24,95,165,0.12)', borderRadius: 8, padding: 4 }}>
        {[
          { key: 'candidatures', label: `Candidatures (${candidatures.length})` },
          { key: 'contrats', label: `Contrats (${contrats.length})` },
          { key: 'heures', label: 'Heures & Salaires' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '8px 12px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13,
            background: tab === t.key ? 'white' : 'transparent',
            fontWeight: tab === t.key ? 700 : 400,
            color: tab === t.key ? '#0B1F4A' : '#666',
            boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Candidatures ── */}
      {tab === 'candidatures' && (
        <div>
          {candidatures.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: 12 }}>
              <FaBriefcase style={{ fontSize: 48, color: '#ddd', marginBottom: 16 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 8 }}>Vous n'avez pas encore postulé.</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Découvrez les postes disponibles dans votre université.</p>
              <Link to="/emploi-universitaire" style={{ padding: '10px 24px', background: '#185FA5', color: 'white', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                Voir les postes disponibles
              </Link>
            </div>
          ) : (
            candidatures.map(c => {
              const st = STATUT_STYLE[c.statut] || STATUT_STYLE.EN_ATTENTE;
              return (
                <div key={c.id} style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 20, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15, marginBottom: 4 }}>{c.offre?.titre || `Offre #${c.offreId}`}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{c.offre?.universite} · Postulé le {new Date(c.dateCandidature).toLocaleDateString('fr-FR')}</div>
                    {c.statut === 'REJETEE' && c.motif && (
                      <div style={{ fontSize: 12, color: '#cc0000', marginTop: 4 }}>Motif : {c.motif}</div>
                    )}
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: st.bg, color: st.color, fontSize: 12, fontWeight: 600, flexShrink: 0, marginLeft: 16 }}>
                    {st.icon} {st.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Contrats ── */}
      {tab === 'contrats' && (
        <div>
          {contrats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: 12, color: 'var(--text-muted)' }}>
              <FaFileContract style={{ fontSize: 48, color: '#ddd', marginBottom: 16 }} />
              <p>Aucun contrat pour le moment.</p>
            </div>
          ) : (
            contrats.map(c => (
              <div key={c.id} style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 22, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 16 }}>{c.poste}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{c.universite} · {c.departement}</div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: 20, background: c.statut === 'EN_CONTRAT' ? '#cce5ff' : '#eee', color: c.statut === 'EN_CONTRAT' ? '#004085' : '#555', fontSize: 12, fontWeight: 600 }}>
                    {c.statut === 'EN_CONTRAT' ? 'Actif' : 'Terminé'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { icon: <FaCalendarAlt />, label: 'Début', val: c.dateDebut },
                    { icon: <FaClock />, label: 'Durée', val: c.duree || '1 an académique' },
                    { icon: <FaMoneyBillWave />, label: 'Salaire', val: `${c.salaireNet} ${c.devise}/mois` },
                    { icon: <FaClock />, label: 'Heures/sem', val: `${c.heuresParSemaine}h max` },
                    { icon: <FaCertificate />, label: 'Attestation', val: c.attestationUrl ? 'Disponible' : 'En fin de contrat' },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <span style={{ color: '#185FA5' }}>{r.icon}</span>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.label}</div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {c.attestationUrl && (
                  <a href={c.attestationUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14, padding: '7px 14px', background: '#1D9E75', color: 'white', borderRadius: 6, textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
                    <FaCertificate /> Télécharger l'attestation
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Heures & Salaires ── */}
      {tab === 'heures' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
            <label style={{ fontSize: 14, color: 'var(--text-muted)' }}>Mois :</label>
            <input type="month" value={moisSelectionne} onChange={e => setMoisSelectionne(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }} />
          </div>

          {!heures ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Chargement...</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                  { icon: <FaClock />, label: 'Heures effectuées', val: `${heures.totalHeures}h`, color: '#185FA5' },
                  { icon: <FaMoneyBillWave />, label: 'Salaire dû', val: `${heures.salaireDu} ${heures.devise}`, color: '#1D9E75' },
                  { icon: <FaCheckCircle />, label: 'Jours travaillés', val: (heures.pointages || []).length, color: '#854F0B' },
                ].map(k => (
                  <div key={k.label} style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 20, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize: 24, color: k.color, marginBottom: 8 }}>{k.icon}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.val}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{k.label}</div>
                  </div>
                ))}
              </div>

              {(heures.pointages || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, background: 'var(--bg-card)', borderRadius: 12, color: 'var(--text-muted)' }}>
                  Aucun pointage enregistré pour ce mois.
                </div>
              ) : (
                <div style={{ background: 'var(--bg-card)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)' }}>
                        {['Date', 'Arrivée', 'Départ', 'Heures', 'Statut'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {heures.pointages.map((p, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '11px 16px', fontSize: 13 }}>{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                          <td style={{ padding: '11px 16px', fontSize: 13, color: '#185FA5', fontWeight: 600 }}>{p.arrivee}</td>
                          <td style={{ padding: '11px 16px', fontSize: 13, color: '#185FA5', fontWeight: 600 }}>{p.depart}</td>
                          <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 700 }}>{p.heures}h</td>
                          <td style={{ padding: '11px 16px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: 20, background: 'rgba(29,158,117,0.12)', color: '#1D9E75', fontSize: 11, fontWeight: 600 }}>Validé</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
