import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { FaSearch, FaDownload, FaExclamationTriangle } from 'react-icons/fa';

const C = { navy:'#0B1F4A', blue:'#185FA5', green:'#1D9E75', orange:'#C07A2B', red:'#B91C1C' };

function NiveauDette({ montant }) {
  if (montant > 500) return { label:'Critique', color:C.red,    bg:'#FEE2E2' };
  if (montant > 200) return { label:'Élevée',   color:C.orange, bg:'#FEF3C7' };
  return                    { label:'Modérée',  color:C.blue,   bg:'#EBF4FF' };
}

export default function RapportDettes() {
  const [loading, setLoading] = useState(true);
  const [dettes, setDettes] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [filtreNiveau, setFiltreNiveau] = useState('');
  const [triChamp, setTriChamp] = useState('totalDette');
  const [triAsc, setTriAsc] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const r = await api.get('/api/rapports/financiers/dettes');
      setDettes(Array.isArray(r.data) ? r.data : DETTES_DEMO);
    } catch { setDettes(DETTES_DEMO); }
    finally { setLoading(false); }
  };

  const totalDettes = dettes.reduce((s,d) => s+(d.totalDette||0), 0);
  const nbCritiques = dettes.filter(d => d.totalDette > 500).length;
  const moyenneDette = dettes.length ? totalDettes/dettes.length : 0;

  const dettesFiltrees = dettes
    .filter(d => {
      const ok1 = !recherche || (d.etudiant||'').toLowerCase().includes(recherche.toLowerCase()) || (d.matricule||'').toLowerCase().includes(recherche.toLowerCase());
      if (!filtreNiveau) return ok1;
      const niv = NiveauDette(d.totalDette).label;
      return ok1 && niv === filtreNiveau;
    })
    .sort((a,b) => {
      const va = a[triChamp]||''; const vb = b[triChamp]||'';
      return triAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  const handleTri = (champ) => { if(triChamp===champ) setTriAsc(a=>!a); else { setTriChamp(champ); setTriAsc(false); } };

  const exporterCSV = () => {
    if (dettesFiltrees.length === 0) return;
    const entetes = ['Étudiant', 'Matricule', 'Promotion', 'Total dû (USD)', 'Niveau'];
    const lignes = dettesFiltrees.map(d => [
      d.etudiant || '',
      d.matricule || '',
      d.promotion || '',
      (d.totalDette || 0).toFixed(2),
      NiveauDette(d.totalDette || 0).label
    ]);
    const csvContent = [entetes.join(','), ...lignes.map(l => l.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dettes_etudiantes_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:300,gap:12 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:36,height:36,border:`3px solid ${C.red}30`,borderTopColor:C.red,borderRadius:'50%',animation:'spin 0.8s linear infinite' }} />
      <span style={{ color:'var(--text-muted)',fontSize:14 }}>Chargement des dettes...</span>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',sans-serif", padding:'24px 20px', maxWidth:1100, margin:'0 auto' }}>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ color:'var(--text-primary)', fontSize:24, fontWeight:900, margin:0 }}>Dettes étudiantes</h1>
          <p style={{ color:'var(--text-muted)', fontSize:14, margin:'4px 0 0' }}>Suivi des impayés et créances en cours</p>
        </div>
        <button onClick={exporterCSV} disabled={dettesFiltrees.length === 0} style={{ padding:'9px 16px', background:C.orange, color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor: dettesFiltrees.length === 0 ? 'default' : 'pointer', opacity: dettesFiltrees.length === 0 ? 0.6 : 1, display:'flex', alignItems:'center', gap:7 }}>
          <FaDownload /> Exporter CSV
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'Total des dettes', val:`${totalDettes.toLocaleString()} USD`, color:C.red,    desc:`${dettes.length} étudiants concernés` },
          { label:'Cas critiques',    val:nbCritiques,                            color:C.orange, desc:'Dettes supérieures à 500 USD' },
          { label:'Dette moyenne',    val:`${moyenneDette.toFixed(0)} USD`,       color:C.blue,   desc:'Par étudiant débiteur' },
          { label:'Taux recouvrement',val:dettes.length?`${Math.round((dettes.filter(d=>d.totalDette===0).length/dettes.length)*100)}%`:'—', color:C.green, desc:'Comptes soldés' },
        ].map(k => (
          <div key={k.label} style={{ background:'var(--bg-card)', borderRadius:16, padding:'18px 20px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderTop:`3px solid ${k.color}` }}>
            <div style={{ fontSize:26, fontWeight:900, color:k.color }}>{k.val}</div>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', marginTop:4 }}>{k.label}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{k.desc}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:'1', minWidth:220 }}>
          <FaSearch style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', fontSize:13 }} />
          <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Nom, matricule..."
            style={{ width:'100%', padding:'10px 12px 10px 36px', borderRadius:10, border:'1.5px solid var(--border-color)', fontSize:14, outline:'none', boxSizing:'border-box' }} />
        </div>
        <select value={filtreNiveau} onChange={e => setFiltreNiveau(e.target.value)}
          style={{ padding:'10px 14px', border:'1.5px solid var(--border-color)', borderRadius:10, fontSize:13, outline:'none', background:'var(--bg-card)', color:'var(--text-primary)' }}>
          <option value="">Tous les niveaux</option>
          <option value="Critique">Critique (&gt;500 USD)</option>
          <option value="Élevée">Élevée (200–500 USD)</option>
          <option value="Modérée">Modérée (&lt;200 USD)</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background:'var(--bg-card)', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--bg-secondary)' }}>
              {[['etudiant','Étudiant'],['matricule','Matricule'],['promotion','Promotion'],['totalDette','Total dû'],['niveau','Niveau'],['action','Action']].map(([champ,label]) => (
                <th key={champ} onClick={() => champ!=='action'&&champ!=='niveau'&&handleTri(champ)}
                  style={{ padding:'13px 16px', textAlign:'left', fontSize:12, color:'var(--text-muted)', fontWeight:700, borderBottom:'1px solid var(--border-color)', cursor:champ!=='action'&&champ!=='niveau'?'pointer':'default', userSelect:'none', whiteSpace:'nowrap' }}>
                  {label} {triChamp===champ?(triAsc?'↑':'↓'):''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dettesFiltrees.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign:'center', padding:50, color:'#bbb', fontSize:14 }}>
                <FaExclamationTriangle style={{ fontSize:36, display:'block', margin:'0 auto 12px', color:'#ddd' }} />
                Aucune dette correspondante
              </td></tr>
            ) : dettesFiltrees.map((d, i) => {
              const niv = NiveauDette(d.totalDette||0);
              const pct = Math.min(100, ((d.totalDette||0) / 1000) * 100);
              return (
                <tr key={i} style={{ borderBottom:'1px solid var(--border-color, #f5f5f5)', transition:'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--bg-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:`${niv.color}18`, color:niv.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, flexShrink:0 }}>
                        {(d.etudiant||'?').charAt(0)}
                      </div>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{d.etudiant || '—'}</span>
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:13, color:'var(--text-muted)', fontFamily:'monospace' }}>{d.matricule || '—'}</td>
                  <td style={{ padding:'12px 16px', fontSize:13, color:'var(--text-secondary)' }}>{d.promotion || '—'}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ fontWeight:800, fontSize:15, color:niv.color }}>{(d.totalDette||0).toLocaleString()} <span style={{ fontSize:11, fontWeight:500, color:'var(--text-muted)' }}>USD</span></div>
                    <div style={{ height:4, background:'#f0f0f0', borderRadius:2, marginTop:4, width:100 }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:niv.color, borderRadius:2 }} />
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:niv.bg, color:niv.color }}>{niv.label}</span>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <button style={{ padding:'5px 12px', background:'#f0f4ff', color:C.blue, border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                      Voir détail
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {dettesFiltrees.length > 0 && (
          <div style={{ padding:'12px 16px', background:'var(--bg-secondary)', borderTop:'1px solid var(--border-color)', display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>{dettesFiltrees.length} résultat{dettesFiltrees.length>1?'s':''}</span>
            <span style={{ fontSize:13, fontWeight:700, color:C.red }}>Total : {dettesFiltrees.reduce((s,d)=>s+(d.totalDette||0),0).toLocaleString()} USD</span>
          </div>
        )}
      </div>
    </div>
  );
}

const DETTES_DEMO = [
  { etudiant:'Mukendi Jean-Paul', matricule:'UNIKIN/2023/001', promotion:'L1 Informatique', totalDette:750 },
  { etudiant:'Nsimba Espérance',  matricule:'UNIKIN/2023/047', promotion:'L2 Droit',         totalDette:350 },
  { etudiant:'Katumba Patrick',   matricule:'UNIKIN/2022/113', promotion:'L3 Médecine',       totalDette:120 },
  { etudiant:'Lukusa Marie',      matricule:'UNIKIN/2023/078', promotion:'L1 Gestion',        totalDette:900 },
  { etudiant:'Bula David',        matricule:'UNIKIN/2021/205', promotion:'M1 Chimie',         totalDette:200 },
];
