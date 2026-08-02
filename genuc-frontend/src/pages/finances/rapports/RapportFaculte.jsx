import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { FaDownload, FaTrophy } from 'react-icons/fa';

const C = { navy:'#0B1F4A', blue:'#185FA5', green:'#1D9E75', orange:'#C07A2B', red:'#B91C1C', purple:'#6B21A8' };
const PALETTE = [C.blue, C.green, C.orange, C.purple, C.red, '#0E7490', '#15803D', '#7C3AED'];

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-color)', borderRadius:10, padding:'10px 14px', boxShadow:'0 4px 16px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight:700, color:'var(--text-primary)', marginBottom:4, fontSize:13 }}>{label}</div>
      <div style={{ fontSize:13, color:C.blue }}>Total payé : <strong>{(payload[0]?.value||0).toLocaleString()} USD</strong></div>
    </div>
  );
};

export default function RapportFaculte() {
  const [loading, setLoading] = useState(true);
  const [data, setData]     = useState([]);
  const [annee, setAnnee]   = useState(`${new Date().getFullYear()}-${new Date().getFullYear()+1}`);
  const [vue, setVue]       = useState('chart');

  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  useEffect(() => { loadData(); }, [annee]);

  const loadData = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/api/rapports/financiers/par-faculte?annee=${annee}`);
      setData(Array.isArray(r.data) ? r.data : DATA_DEMO);
    } catch { setData(DATA_DEMO); }
    setLoading(false);
  };

  const total        = data.reduce((s,d) => s+(d.total||0), 0);
  const meilleur     = [...data].sort((a,b) => (b.total||0)-(a.total||0))[0];
  const anneesDisp   = ['2023-2024','2024-2025','2025-2026'];

  const exporterCSV = () => {
    if (data.length === 0) return;
    const entetes = ['Faculté', 'Total payé (USD)', '% du total'];
    const lignes = [...data].sort((a,b) => (b.total||0)-(a.total||0)).map(f => [
      f.faculte || '',
      (f.total || 0).toFixed(2),
      total ? Math.round((f.total / total) * 100) : 0
    ]);
    const csvContent = [entetes.join(','), ...lignes.map(l => l.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `paiements_par_faculte_${annee}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:300,gap:12 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:36,height:36,border:`3px solid ${C.blue}30`,borderTopColor:C.blue,borderRadius:'50%',animation:'spin 0.8s linear infinite' }} />
      <span style={{ color:'var(--text-muted)',fontSize:14 }}>Chargement des données...</span>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',sans-serif", padding:'24px 20px', maxWidth:1100, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ color:'var(--text-primary)', fontSize:24, fontWeight:900, margin:0 }}>Paiements par faculté</h1>
          <p style={{ color:'var(--text-muted)', fontSize:14, margin:'4px 0 0' }}>Répartition des recettes par département académique</p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <select value={annee} onChange={e => setAnnee(e.target.value)}
            style={{ padding:'9px 14px', border:'1.5px solid var(--border-color)', borderRadius:10, fontSize:13, outline:'none', background:'var(--bg-card)', color:'var(--text-primary)', fontWeight:700 }}>
            {anneesDisp.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <div style={{ display:'flex', gap:3, background:'#f0f4fa', borderRadius:9, padding:3 }}>
            {[['chart','Graphique'],['table','Tableau']].map(([v,l]) => (
              <button key={v} onClick={() => setVue(v)} style={{ padding:'6px 14px', borderRadius:7, border:'none', background:vue===v?'white':'transparent', color:vue===v?C.navy:'#888', fontWeight:vue===v?700:500, fontSize:12, cursor:'pointer', boxShadow:vue===v?'0 1px 4px rgba(0,0,0,0.08)':'none' }}>{l}</button>
            ))}
          </div>
          <button onClick={exporterCSV} disabled={data.length === 0} style={{ padding:'9px 14px', background:C.green, color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor: data.length === 0 ? 'default' : 'pointer', opacity: data.length === 0 ? 0.6 : 1, display:'flex', alignItems:'center', gap:6 }}>
            <FaDownload /> Exporter
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'Total toutes facultés', val:`${total.toLocaleString()} USD`,             color:C.blue,   icon:'💰' },
          { label:'Nb facultés',           val:data.length,                                 color:'var(--text-primary)',   icon:'🏛️' },
          { label:'Meilleure faculté',     val:meilleur?.faculte?.split(' ')[0] || '—',     color:C.green,  icon:'🏆' },
          { label:'Moyenne par faculté',   val:`${data.length?(total/data.length).toFixed(0):0} USD`, color:C.orange, icon:'📊' },
        ].map(k => (
          <div key={k.label} style={{ background:'var(--bg-card)', borderRadius:16, padding:'18px 20px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:26, marginBottom:6 }}>{k.icon}</div>
            <div style={{ fontSize:22, fontWeight:900, color:k.color }}>{k.val}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Podium top 3 */}
      {data.length >= 3 && (
        <div style={{ background:'var(--bg-card)', borderRadius:18, padding:22, boxShadow:'0 2px 14px rgba(0,0,0,0.07)', marginBottom:24 }}>
          <div style={{ fontWeight:800, color:'var(--text-primary)', fontSize:14, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <FaTrophy style={{ color:C.orange }} /> Top 3 facultés
          </div>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            {[...data].sort((a,b)=>(b.total||0)-(a.total||0)).slice(0,3).map((f,i) => {
              const medals = ['🥇','🥈','🥉'];
              const colors = [C.orange, '#9CA3AF', '#92400E'];
              const pct = total ? Math.round((f.total/total)*100) : 0;
              return (
                <div key={f.faculte} style={{ flex:'1 1 200px', background:`${colors[i]}08`, border:`2px solid ${colors[i]}30`, borderRadius:16, padding:'18px 20px', textAlign:'center', minWidth:160 }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>{medals[i]}</div>
                  <div style={{ fontWeight:800, color:'var(--text-primary)', fontSize:14, marginBottom:4 }}>{f.faculte}</div>
                  <div style={{ fontSize:20, fontWeight:900, color:colors[i] }}>{(f.total||0).toLocaleString()} USD</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{pct}% du total</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vue chart ou table */}
      <div style={{ background:'var(--bg-card)', borderRadius:18, padding:'24px 20px', boxShadow:'0 2px 14px rgba(0,0,0,0.07)' }}>
        {vue === 'chart' ? (
          <>
            <div style={{ fontWeight:800, color:'var(--text-primary)', fontSize:14, marginBottom:20 }}>Recettes par faculté — {annee}</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data} layout="vertical" margin={{ top:0, right:40, left:120, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize:11 }} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="faculte" tick={{ fontSize:12, fill:'#444' }} width={115} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Bar dataKey="total" radius={[0,6,6,0]} name="Total payé (USD)">
                  {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--bg-secondary)' }}>
                {['#','Faculté','Total payé','% du total','Progression'].map(h => (
                  <th key={h} style={{ padding:'13px 16px', textAlign:'left', fontSize:12, color:'var(--text-muted)', fontWeight:700, borderBottom:'1px solid var(--border-color)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...data].sort((a,b)=>(b.total||0)-(a.total||0)).map((f,i) => {
                const pct = total ? Math.round((f.total/total)*100) : 0;
                const color = PALETTE[i % PALETTE.length];
                return (
                  <tr key={f.faculte} style={{ borderBottom:'1px solid #f5f5f5', transition:'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ width:28, height:28, borderRadius:'50%', background:`${color}18`, color, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800 }}>{i+1}</span>
                    </td>
                    <td style={{ padding:'12px 16px', fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{f.faculte}</td>
                    <td style={{ padding:'12px 16px', fontSize:14, fontWeight:800, color }}>{(f.total||0).toLocaleString()} <span style={{ fontSize:11, fontWeight:400, color:'var(--text-muted)' }}>USD</span></td>
                    <td style={{ padding:'12px 16px', fontSize:13, color:'var(--text-muted)', fontWeight:600 }}>{pct}%</td>
                    <td style={{ padding:'12px 16px', minWidth:140 }}>
                      <div style={{ height:8, background:'#f0f4fa', borderRadius:4, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:4, transition:'width 0.5s' }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background:'var(--bg-secondary)', borderTop:'2px solid var(--border-color)' }}>
                <td colSpan={2} style={{ padding:'12px 16px', fontWeight:800, color:'var(--text-primary)', fontSize:13 }}>TOTAL</td>
                <td style={{ padding:'12px 16px', fontWeight:900, color:C.green, fontSize:15 }}>{total.toLocaleString()} USD</td>
                <td style={{ padding:'12px 16px', fontWeight:700, color:'var(--text-muted)' }}>100%</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}

const DATA_DEMO = [
  { faculte:'Faculté Informatique',  total:45200 },
  { faculte:'Faculté de Droit',      total:38700 },
  { faculte:'Faculté de Médecine',   total:62100 },
  { faculte:'Faculté des Sciences',  total:29400 },
  { faculte:'Faculté de Gestion',    total:41800 },
  { faculte:'Faculté de Lettres',    total:18300 },
  { faculte:'Faculté d\'Agronomie',  total:22600 },
];
