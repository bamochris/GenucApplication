import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { FaArrowUp, FaArrowDown, FaDownload } from 'react-icons/fa';

const C = { navy:'#0B1F4A', blue:'#185FA5', green:'#1D9E75', orange:'#C07A2B', red:'#B91C1C' };

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-color)', borderRadius:10, padding:'10px 14px', boxShadow:'0 4px 16px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize:13, color:p.color }}>
          {p.name} : <strong>{(p.value||0).toLocaleString()} USD</strong>
        </div>
      ))}
    </div>
  );
};

export default function RapportEvolution() {
  const [loading, setLoading] = useState(true);
  const [data, setData]   = useState({});
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [vue, setVue]     = useState('area');

  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  useEffect(() => { loadData(); }, [annee]);

  const loadData = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/api/rapports/financiers/evolution?annee=${annee}`);
      setData(r.data || {});
    } catch { setData({ evolution: EVOLUTION_DEMO, totalAnnee: EVOLUTION_DEMO.reduce((s,m)=>s+m.montant,0) }); }
    setLoading(false);
  };

  const evolutionData = data.evolution
    ? (Array.isArray(data.evolution)
        ? data.evolution
        : Object.entries(data.evolution).map(([mois,montant])=>({ mois, montant })))
    : [];

  const totalAnnee = data.totalAnnee || evolutionData.reduce((s,m)=>s+(m.montant||0),0);

  // Calcul croissance vs mois précédent
  const dernierMois = evolutionData[evolutionData.length - 1];
  const avantDernierMois = evolutionData[evolutionData.length - 2];
  const croissance = avantDernierMois?.montant
    ? Math.round(((dernierMois?.montant - avantDernierMois?.montant) / avantDernierMois.montant) * 100)
    : null;

  const meilleurMois = evolutionData.reduce((best,m) => m.montant > (best?.montant||0) ? m : best, null);
  const moyenneMensuelle = evolutionData.length ? totalAnnee / evolutionData.length : 0;

  const exporterCSV = () => {
    if (evolutionData.length === 0) return;
    const entetes = ['Mois', 'Recettes (USD)', '% du total'];
    const lignes = evolutionData.map(m => [
      m.mois,
      (m.montant || 0).toFixed(2),
      totalAnnee ? Math.round((m.montant / totalAnnee) * 100) : 0
    ]);
    const csvContent = [entetes.join(','), ...lignes.map(l => l.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `evolution_recettes_${annee}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:300,gap:12 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:36,height:36,border:`3px solid ${C.blue}30`,borderTopColor:C.blue,borderRadius:'50%',animation:'spin 0.8s linear infinite' }} />
      <span style={{ color:'var(--text-muted)',fontSize:14 }}>Chargement de l'évolution...</span>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',sans-serif", padding:'24px 20px', maxWidth:1100, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ color:'var(--text-primary)', fontSize:24, fontWeight:900, margin:0 }}>Évolution des recettes</h1>
          <p style={{ color:'var(--text-muted)', fontSize:14, margin:'4px 0 0' }}>Analyse mensuelle des encaissements</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <select value={annee} onChange={e => setAnnee(+e.target.value)}
            style={{ padding:'9px 14px', border:'1.5px solid var(--border-color)', borderRadius:10, fontSize:13, outline:'none', background:'var(--bg-card)', color:'var(--text-primary)', fontWeight:700 }}>
            {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div style={{ display:'flex', gap:3, background:'#f0f4fa', borderRadius:9, padding:3 }}>
            {[['area','Aire'],['bar','Barres']].map(([v,l]) => (
              <button key={v} onClick={() => setVue(v)} style={{ padding:'6px 14px', borderRadius:7, border:'none', background:vue===v?'white':'transparent', color:vue===v?C.navy:'#888', fontWeight:vue===v?700:500, fontSize:12, cursor:'pointer', boxShadow:vue===v?'0 1px 4px rgba(0,0,0,0.08)':'none' }}>{l}</button>
            ))}
          </div>
          <button onClick={exporterCSV} disabled={evolutionData.length === 0} style={{ padding:'9px 14px', background:C.green, color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor: evolutionData.length === 0 ? 'default' : 'pointer', opacity: evolutionData.length === 0 ? 0.6 : 1, display:'flex', alignItems:'center', gap:6 }}>
            <FaDownload /> Exporter
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'Total annuel',      val:`${totalAnnee.toLocaleString()} USD`, color:C.blue,   sub:`Exercice ${annee}` },
          { label:'Moyenne mensuelle', val:`${moyenneMensuelle.toFixed(0)} USD`, color:C.green,  sub:'Par mois' },
          { label:'Meilleur mois',     val:meilleurMois?.mois || '—',            color:C.orange, sub:meilleurMois ? `${meilleurMois.montant?.toLocaleString()} USD` : '' },
          { label:'Croissance',        val:croissance!==null ? `${croissance>0?'+':''}${croissance}%` : '—', color:croissance>=0?C.green:C.red, sub:'vs mois précédent' },
        ].map(k => (
          <div key={k.label} style={{ background:'var(--bg-card)', borderRadius:16, padding:'18px 20px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderLeft:`4px solid ${k.color}` }}>
            <div style={{ fontSize:24, fontWeight:900, color:k.color, display:'flex', alignItems:'center', gap:8 }}>
              {k.val}
              {k.label==='Croissance' && croissance!==null && (
                croissance >= 0 ? <FaArrowUp style={{ fontSize:14 }} /> : <FaArrowDown style={{ fontSize:14 }} />
              )}
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', marginTop:4 }}>{k.label}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Graphique */}
      <div style={{ background:'var(--bg-card)', borderRadius:18, padding:'24px 20px', boxShadow:'0 2px 14px rgba(0,0,0,0.07)', marginBottom:24 }}>
        <div style={{ fontWeight:800, color:'var(--text-primary)', fontSize:15, marginBottom:20 }}>
          Recettes mensuelles — {annee}
        </div>
        {evolutionData.length === 0 ? (
          <div style={{ textAlign:'center', padding:60, color:'#bbb', fontSize:14 }}>Aucune donnée pour cette année</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            {vue === 'area' ? (
              <AreaChart data={evolutionData} margin={{ top:5, right:20, left:10, bottom:5 }}>
                <defs>
                  <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.blue} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={C.blue} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois" tick={{ fontSize:12 }} />
                <YAxis tick={{ fontSize:11 }} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Area type="monotone" dataKey="montant" stroke={C.blue} strokeWidth={2.5} fill="url(#gradBlue)" name="Recettes (USD)" dot={{ fill:C.blue, r:4 }} activeDot={{ r:6 }} />
              </AreaChart>
            ) : (
              <BarChart data={evolutionData} margin={{ top:5, right:20, left:10, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois" tick={{ fontSize:12 }} />
                <YAxis tick={{ fontSize:11 }} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Bar dataKey="montant" fill={C.blue} radius={[6,6,0,0]} name="Recettes (USD)" />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Table mensuelle */}
      <div style={{ background:'var(--bg-card)', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border-color)', fontWeight:800, color:'var(--text-primary)', fontSize:14 }}>Détail mensuel</div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--bg-secondary)' }}>
              {['Mois','Recettes','vs Mois préc.','% du total','Tendance'].map(h => (
                <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:12, color:'var(--text-muted)', fontWeight:700, borderBottom:'1px solid var(--border-color)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {evolutionData.map((m, i) => {
              const prev = evolutionData[i-1];
              const diff = prev ? m.montant - prev.montant : 0;
              const diffPct = prev?.montant ? Math.round((diff/prev.montant)*100) : null;
              const pctTotal = totalAnnee ? Math.round((m.montant/totalAnnee)*100) : 0;
              return (
                <tr key={i} style={{ borderBottom:'1px solid #f5f5f5', transition:'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--bg-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'11px 16px', fontWeight:700, color:'var(--text-primary)', fontSize:13 }}>{m.mois}</td>
                  <td style={{ padding:'11px 16px', fontSize:14, fontWeight:800, color:C.blue }}>{(m.montant||0).toLocaleString()} <span style={{ fontSize:11, fontWeight:400, color:'var(--text-muted)' }}>USD</span></td>
                  <td style={{ padding:'11px 16px', fontSize:13, color:diff>=0?C.green:C.red, fontWeight:600 }}>
                    {diffPct!==null ? `${diff>=0?'+':''}${diffPct}%` : '—'}
                  </td>
                  <td style={{ padding:'11px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ flex:1, height:6, background:'#f0f4fa', borderRadius:3, maxWidth:80 }}>
                        <div style={{ height:'100%', width:`${pctTotal}%`, background:C.blue, borderRadius:3 }} />
                      </div>
                      <span style={{ fontSize:12, color:'var(--text-muted)', width:30 }}>{pctTotal}%</span>
                    </div>
                  </td>
                  <td style={{ padding:'11px 16px', fontSize:18 }}>
                    {diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const EVOLUTION_DEMO = [
  { mois:'Jan', montant:12500 }, { mois:'Fév', montant:18300 }, { mois:'Mar', montant:22100 },
  { mois:'Avr', montant:19800 }, { mois:'Mai', montant:24600 }, { mois:'Jun', montant:31200 },
  { mois:'Jul', montant:15400 }, { mois:'Aoû', montant:28700 }, { mois:'Sep', montant:35100 },
  { mois:'Oct', montant:41200 }, { mois:'Nov', montant:38900 }, { mois:'Déc', montant:45600 },
];
