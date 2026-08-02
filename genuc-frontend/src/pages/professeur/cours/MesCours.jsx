import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import { vacationService } from '../../../services/vacationService';
import {
  FaBook, FaUsers, FaClock, FaSearch,
  FaCheckCircle, FaHourglassHalf,
  FaClipboardList, FaEdit, FaEye
} from 'react-icons/fa';

const C = { navy:'#0B1F4A', blue:'#185FA5', green:'#1D9E75', orange:'#C07A2B', red:'#B91C1C', purple:'#6B21A8' };

const STATUT_STYLES = {
  'PUBLIE':      { label:'Publié',      color:C.green,  bg:'#E8F8F2', icon:<FaCheckCircle /> },
  'EN_COURS':    { label:'En cours',    color:C.blue,   bg:'#EBF4FF', icon:<FaHourglassHalf /> },
  'PLANIFIE':    { label:'Planifié',    color:C.orange, bg:'#FEF3C7', icon:<FaClock /> },
  'TERMINE':     { label:'Terminé',     color:'var(--text-muted)',   bg:'#f5f5f5', icon:<FaCheckCircle /> },
  'BROUILLON':   { label:'Brouillon',   color:'var(--text-muted)',   bg:'#f5f5f5', icon:<FaEdit /> },
};

const NIVEAU_COLORS = {
  'L1': C.blue,  'L2': C.green,  'L3': C.orange,
  'M1': C.purple,'M2': C.red,    'D':  C.navy,
};

export default function MesCours() {
  const { user } = useAuth();
  const [cours, setCours]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtreNiveau, setFiltreNiveau] = useState('');
  const [vue, setVue]           = useState('grid');

  // ── Cours par vacation (Jour / Soir) ──
  const [coursVacation, setCoursVacation] = useState([]);
  const [vacationTypeById, setVacationTypeById] = useState({});
  const [filtreVacationType, setFiltreVacationType] = useState('');
  const [loadingVacation, setLoadingVacation] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await api.get(`/api/cours/professeur/${user?.id}`);
        setCours(Array.isArray(r.data) ? r.data : COURS_DEMO);
      } catch { setCours(COURS_DEMO); }
      setLoading(false);
    };
    if (user?.id) load();
  }, [user?.id]);

  useEffect(() => {
    const loadVacation = async () => {
      try {
        const [cvRes, vRes] = await Promise.all([
          vacationService.listerCoursParProfesseur(user.id),
          user?.universiteId ? vacationService.listerActives(user.universiteId) : Promise.resolve({ data: [] }),
        ]);
        setCoursVacation(Array.isArray(cvRes.data) ? cvRes.data : []);
        const map = {};
        (Array.isArray(vRes.data) ? vRes.data : []).forEach(v => { map[v.id] = v.type; });
        setVacationTypeById(map);
      } catch {
        setCoursVacation([]);
      } finally {
        setLoadingVacation(false);
      }
    };
    if (user?.id) loadVacation(); else setLoadingVacation(false);
  }, [user?.id, user?.universiteId]);

  const coursVacationFiltres = coursVacation.filter(cv => {
    if (!filtreVacationType) return true;
    return vacationTypeById[cv.vacationId] === filtreVacationType;
  });

  const niveaux  = [...new Set(cours.map(c => c.niveau).filter(Boolean))];
  const statuts  = [...new Set(cours.map(c => c.statut).filter(Boolean))];

  const coursFiltres = cours.filter(c => {
    const txt = !recherche || (c.titre||'').toLowerCase().includes(recherche.toLowerCase()) || (c.code||'').toLowerCase().includes(recherche.toLowerCase());
    const sta = !filtreStatut  || c.statut  === filtreStatut;
    const niv = !filtreNiveau  || c.niveau  === filtreNiveau;
    return txt && sta && niv;
  });

  const totalEtudiants = cours.reduce((s,c) => s+(c.nbEtudiants||0), 0);
  const nbPublies      = cours.filter(c => c.statut==='PUBLIE').length;
  const totalCredits   = cours.reduce((s,c) => s+(c.credits||0), 0);

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:300,gap:12 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:36,height:36,border:`3px solid ${C.blue}30`,borderTopColor:C.blue,borderRadius:'50%',animation:'spin 0.8s linear infinite' }} />
      <span style={{ color:'var(--text-muted)',fontSize:14 }}>Chargement de vos cours...</span>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',sans-serif", padding:'24px 20px', maxWidth:1200, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ color:'var(--text-primary)', fontSize:24, fontWeight:900, margin:0 }}>Mes cours</h1>
          <p style={{ color:'var(--text-muted)', fontSize:14, margin:'4px 0 0' }}>
            {cours.length} cours attribué{cours.length>1?'s':''} — {user?.prenom} {user?.nom}
          </p>
        </div>
        <Link to="/professeur/cours/nouveau" style={{ padding:'10px 20px', background:C.blue, color:'white', borderRadius:10, textDecoration:'none', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:7 }}>
          + Nouveau cours
        </Link>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'Total cours',      val:cours.length,    color:C.blue,   bg:'#EBF4FF', icon:<FaBook /> },
          { label:'Cours publiés',    val:nbPublies,       color:C.green,  bg:'#E8F8F2', icon:<FaCheckCircle /> },
          { label:'Total étudiants',  val:totalEtudiants,  color:C.orange, bg:'#FEF3C7', icon:<FaUsers /> },
          { label:'Total crédits',    val:totalCredits,    color:C.purple, bg:'#EDE9FE', icon:<FaClipboardList /> },
        ].map(k => (
          <div key={k.label} style={{ background:'var(--bg-card)', borderRadius:16, padding:'16px 20px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:42, height:42, borderRadius:12, background:k.bg, color:k.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize:26, fontWeight:900, color:k.color, lineHeight:1 }}>{k.val}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:'1', minWidth:220 }}>
          <FaSearch style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', fontSize:13 }} />
          <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Titre, code du cours..."
            style={{ width:'100%', padding:'9px 12px 9px 36px', borderRadius:10, border:'1.5px solid var(--border-color)', fontSize:14, outline:'none', boxSizing:'border-box' }} />
        </div>
        <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
          style={{ padding:'9px 14px', border:'1.5px solid var(--border-color)', borderRadius:10, fontSize:13, outline:'none', background:'var(--bg-card)', color:'var(--text-primary)' }}>
          <option value="">Tous les statuts</option>
          {statuts.map(s => <option key={s} value={s}>{STATUT_STYLES[s]?.label || s}</option>)}
        </select>
        <select value={filtreNiveau} onChange={e => setFiltreNiveau(e.target.value)}
          style={{ padding:'9px 14px', border:'1.5px solid var(--border-color)', borderRadius:10, fontSize:13, outline:'none', background:'var(--bg-card)', color:'var(--text-primary)' }}>
          <option value="">Tous les niveaux</option>
          {niveaux.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <div style={{ display:'flex', gap:3, background:'#f0f4fa', borderRadius:9, padding:3 }}>
          {[['grid','⊞'],['list','☰']].map(([v,l]) => (
            <button key={v} onClick={() => setVue(v)} style={{ padding:'7px 12px', borderRadius:7, border:'none', background:vue===v?'white':'transparent', color:vue===v?C.navy:'#888', fontWeight:vue===v?700:400, fontSize:14, cursor:'pointer', boxShadow:vue===v?'0 1px 4px rgba(0,0,0,0.08)':'none' }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Cours par vacation (Jour / Soir) */}
      {!loadingVacation && coursVacation.length > 0 && (
        <div style={{ background:'var(--bg-card)', borderRadius:18, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
            <h3 style={{ color:'var(--text-primary)', fontSize:15, fontWeight:800, margin:0 }}>🌓 Mes cours par vacation</h3>
            <select value={filtreVacationType} onChange={e => setFiltreVacationType(e.target.value)}
              style={{ padding:'7px 12px', border:'1.5px solid var(--border-color)', borderRadius:9, fontSize:13, outline:'none', background:'var(--bg-card)', color:'var(--text-primary)' }}>
              <option value="">Toutes les vacations</option>
              <option value="JOUR">☀️ Jour</option>
              <option value="SOIR">🌙 Soir</option>
            </select>
          </div>
          {coursVacationFiltres.length === 0 ? (
            <p style={{ color:'var(--text-muted)', fontSize:13, margin:0 }}>Aucun cours pour ce filtre de vacation.</p>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
              {coursVacationFiltres.map(cv => {
                const type = vacationTypeById[cv.vacationId];
                return (
                  <div key={cv.id} style={{ border:'1px solid var(--border-color)', borderRadius:12, padding:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <strong style={{ fontSize:13, color:'var(--text-primary)' }}>{cv.coursTitre}</strong>
                      {type && (
                        <span style={{ padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:700, background: type==='JOUR' ? '#E8F8F2' : '#EEF2FF', color: type==='JOUR' ? C.green : '#4338CA' }}>
                          {type === 'JOUR' ? '☀️ Jour' : '🌙 Soir'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{cv.vacationNom}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{cv.jour} {cv.heureDebut}–{cv.heureFin} {cv.salle ? `• ${cv.salle}` : ''}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{cv.promotionNom || '—'}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Vide */}
      {coursFiltres.length === 0 && (
        <div style={{ background:'var(--bg-card)', borderRadius:18, padding:60, textAlign:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <FaBook style={{ fontSize:48, color:'#ddd', marginBottom:16 }} />
          <p style={{ color:'var(--text-muted)', fontSize:15, margin:0 }}>
            {cours.length === 0 ? 'Aucun cours ne vous est attribué pour le moment.' : 'Aucun cours ne correspond à vos filtres.'}
          </p>
        </div>
      )}

      {/* Vue grille */}
      {vue === 'grid' && coursFiltres.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
          {coursFiltres.map(c => {
            const st  = STATUT_STYLES[c.statut] || STATUT_STYLES['BROUILLON'];
            const niv = NIVEAU_COLORS[c.niveau] || C.navy;
            return (
              <div key={c.id} style={{ background:'var(--bg-card)', borderRadius:18, padding:22, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:`1px solid var(--border-color)`, transition:'all 0.2s', display:'flex', flexDirection:'column' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.10)'; e.currentTarget.style.transform='translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.06)'; e.currentTarget.style.transform='none'; }}>

                {/* Top */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {c.niveau && <span style={{ padding:'3px 10px', borderRadius:20, background:`${niv}18`, color:niv, fontSize:11, fontWeight:800 }}>{c.niveau}</span>}
                    {c.code   && <span style={{ padding:'3px 10px', borderRadius:20, background:'var(--bg-secondary)', color:'var(--text-muted)', fontSize:11, fontWeight:700, fontFamily:'monospace' }}>{c.code}</span>}
                  </div>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, background:st.bg, color:st.color, fontSize:11, fontWeight:700, flexShrink:0 }}>
                    <span style={{ fontSize:10 }}>{st.icon}</span>{st.label}
                  </span>
                </div>

                {/* Titre */}
                <h3 style={{ color:'var(--text-primary)', fontWeight:800, fontSize:16, margin:'0 0 6px', lineHeight:1.3 }}>{c.titre || 'Cours sans titre'}</h3>
                {c.description && <p style={{ color:'var(--text-muted)', fontSize:13, margin:'0 0 16px', lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{c.description}</p>}

                {/* Méta */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16, marginTop:'auto' }}>
                  {[
                    { icon:<FaUsers style={{ fontSize:11 }} />,  val:`${c.nbEtudiants||0} étudiants` },
                    { icon:<FaClipboardList style={{ fontSize:11 }} />, val:`${c.credits||0} crédit${c.credits>1?'s':''}` },
                    { icon:<FaClock style={{ fontSize:11 }} />,  val:`${c.heures||0}h` },
                    { icon:<FaBook style={{ fontSize:11 }} />,   val:c.promotion || c.annee || '—' },
                  ].map((m,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text-muted)' }}>
                      <span style={{ color:niv }}>{m.icon}</span>{m.val}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:8, borderTop:'1px solid #f5f5f5', paddingTop:14 }}>
                  <Link to="/professeur/notes/saisie"
                    style={{ flex:1, padding:'8px', background:'#f0f4ff', color:C.blue, borderRadius:9, textDecoration:'none', fontSize:12, fontWeight:700, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                    <FaEdit style={{ fontSize:11 }} /> Notes
                  </Link>
                  <Link to={`/professeur/presences/cours/${c.id}`}
                    style={{ flex:1, padding:'8px', background:'#E8F8F2', color:C.green, borderRadius:9, textDecoration:'none', fontSize:12, fontWeight:700, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                    <FaClipboardList style={{ fontSize:11 }} /> Présences
                  </Link>
                  <Link to={`/professeur/cours/${c.id}/contenu`}
                    style={{ padding:'8px 12px', background:'var(--bg-secondary)', color:'var(--text-muted)', borderRadius:9, textDecoration:'none', fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
                    <FaEye style={{ fontSize:11 }} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vue liste */}
      {vue === 'list' && coursFiltres.length > 0 && (
        <div style={{ background:'var(--bg-card)', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f8f9fb' }}>
                {['Cours','Niveau','Étudiants','Crédits','Statut','Actions'].map(h => (
                  <th key={h} style={{ padding:'13px 16px', textAlign:'left', fontSize:12, color:'var(--text-muted)', fontWeight:700, borderBottom:'1px solid var(--border-color)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coursFiltres.map(c => {
                const st  = STATUT_STYLES[c.statut] || STATUT_STYLES['BROUILLON'];
                const niv = NIVEAU_COLORS[c.niveau] || C.navy;
                return (
                  <tr key={c.id} style={{ borderBottom:'1px solid var(--border-color, #f5f5f5)', transition:'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ fontWeight:700, color:'var(--text-primary)', fontSize:14 }}>{c.titre}</div>
                      {c.code && <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'monospace', marginTop:2 }}>{c.code}</div>}
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      {c.niveau && <span style={{ padding:'3px 10px', borderRadius:20, background:`${niv}18`, color:niv, fontSize:12, fontWeight:800 }}>{c.niveau}</span>}
                    </td>
                    <td style={{ padding:'12px 16px', fontSize:13, color:'var(--text-muted)', fontWeight:600 }}>{c.nbEtudiants||0}</td>
                    <td style={{ padding:'12px 16px', fontSize:13, color:'var(--text-muted)', fontWeight:600 }}>{c.credits||0}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, background:st.bg, color:st.color, fontSize:11, fontWeight:700 }}>
                        <span style={{ fontSize:10 }}>{st.icon}</span>{st.label}
                      </span>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <Link to="/professeur/notes/saisie"     style={{ padding:'5px 10px', background:'#f0f4ff', color:C.blue,  borderRadius:7, textDecoration:'none', fontSize:12, fontWeight:700 }}>Notes</Link>
                        <Link to={`/professeur/presences/cours/${c.id}`} style={{ padding:'5px 10px', background:'#E8F8F2', color:C.green, borderRadius:7, textDecoration:'none', fontSize:12, fontWeight:700 }}>Présences</Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const COURS_DEMO = [
  { id:1, code:'INFO-301', titre:'Algorithmique et Structures de données', niveau:'L3', credits:4, heures:60, nbEtudiants:87, statut:'PUBLIE',   promotion:'2024-2025', description:'Cours fondamental sur les algorithmes de tri, de recherche et les structures de données avancées.' },
  { id:2, code:'INFO-201', titre:'Programmation Web — HTML/CSS/JS',        niveau:'L2', credits:3, heures:45, nbEtudiants:112, statut:'EN_COURS', promotion:'2024-2025', description:'Introduction au développement web moderne avec les langages standards du web.' },
  { id:3, code:'INFO-401', titre:'Architecture des systèmes distribués',    niveau:'M1', credits:5, heures:75, nbEtudiants:42,  statut:'PLANIFIE', promotion:'2024-2025', description:'Étude des architectures microservices, API REST et systèmes cloud.' },
  { id:4, code:'INFO-101', titre:'Introduction à la programmation',         niveau:'L1', credits:3, heures:45, nbEtudiants:156, statut:'PUBLIE',   promotion:'2024-2025', description:'Premiers pas en programmation avec Python.' },
  { id:5, code:'INFO-302', titre:'Base de données avancées',                niveau:'L3', credits:4, heures:60, nbEtudiants:78,  statut:'PUBLIE',   promotion:'2024-2025', description:'SQL avancé, NoSQL, optimisation de requêtes et modélisation.' },
];
