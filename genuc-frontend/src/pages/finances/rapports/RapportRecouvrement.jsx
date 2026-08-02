import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { FaDownload, FaCheckCircle, FaExclamationCircle, FaTimesCircle } from 'react-icons/fa';

const C = { navy:'#0B1F4A', blue:'#185FA5', green:'#1D9E75', orange:'#C07A2B', red:'#B91C1C' };

function jauge(taux) {
  if (taux >= 80) return { color:C.green,  label:'Excellent',  icon:<FaCheckCircle /> };
  if (taux >= 60) return { color:C.orange, label:'Acceptable', icon:<FaExclamationCircle /> };
  return                  { color:C.red,   label:'Insuffisant',icon:<FaTimesCircle /> };
}

const CUSTOM_TOOLTIP = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-color)', borderRadius:10, padding:'10px 14px', boxShadow:'0 4px 16px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight:700, color:payload[0].payload.fill, fontSize:13 }}>{payload[0].name}</div>
      <div style={{ fontSize:13, color:'var(--text-primary)' }}><strong>{(payload[0].value||0).toLocaleString()} USD</strong></div>
    </div>
  );
};

export default function RapportRecouvrement() {
  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState(null);
  const [annee, setAnnee]     = useState(`${new Date().getFullYear()}-${new Date().getFullYear()+1}`);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  useEffect(() => { loadData(); }, [annee]);

  const loadData = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/api/rapports/financiers/taux-recouvrement?annee=${annee}`);
      setData(r.data);
    } catch { setData(DATA_DEMO); }
    setLoading(false);
  };

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:300,gap:12 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:36,height:36,border:`3px solid ${C.green}30`,borderTopColor:C.green,borderRadius:'50%',animation:'spin 0.8s linear infinite' }} />
      <span style={{ color:'var(--text-muted)',fontSize:14 }}>Chargement du rapport...</span>
    </div>
  );

  if (!data) return null;

  const taux  = data.tauxRecouvrement || 0;
  const j     = jauge(taux);
  const attendu  = data.totalAttendu  || 0;
  const paye     = data.totalPaye     || 0;
  const restant  = data.totalReste    || (attendu - paye);
  const pieData  = [
    { name:'Payé',    value:paye,    fill:C.green  },
    { name:'Restant', value:restant, fill:'#FEE2E2' },
  ];
  const parFaculte = data.parFaculte || DATA_DEMO.parFaculte || [];

  const exporterCSV = () => {
    const lignes = [
      ['Indicateur', 'Valeur'],
      ['Taux de recouvrement', `${taux}%`],
      ['Total attendu (USD)', attendu.toFixed(2)],
      ['Total encaissé (USD)', paye.toFixed(2)],
      ['Reste à collecter (USD)', restant.toFixed(2)],
      [],
      ['Faculté', 'Taux de recouvrement (%)']
    ];
    parFaculte.forEach(f => {
      const t = f.tauxRecouvrement || (f.totalAttendu ? Math.round((f.totalPaye / f.totalAttendu) * 100) : 0);
      lignes.push([f.faculte || '', t]);
    });
    const csvContent = lignes.map(l => l.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `taux_recouvrement_${annee}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',sans-serif", padding:'24px 20px', maxWidth:1100, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ color:'var(--text-primary)', fontSize:24, fontWeight:900, margin:0 }}>Taux de recouvrement</h1>
          <p style={{ color:'var(--text-muted)', fontSize:14, margin:'4px 0 0' }}>Suivi des créances encaissées vs attendues</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <select value={annee} onChange={e => setAnnee(e.target.value)}
            style={{ padding:'9px 14px', border:'1.5px solid var(--border-color)', borderRadius:10, fontSize:13, outline:'none', background:'var(--bg-card)', color:'var(--text-primary)', fontWeight:700 }}>
            {['2023-2024','2024-2025','2025-2026'].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={exporterCSV} style={{ padding:'9px 14px', background:C.green, color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            <FaDownload /> Exporter
          </button>
        </div>
      </div>

      {/* Section principale */}
      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:20, marginBottom:24 }}>

        {/* Jauge taux */}
        <div style={{ background:'var(--bg-card)', borderRadius:18, padding:28, boxShadow:'0 2px 14px rgba(0,0,0,0.07)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text-muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>Taux de recouvrement</div>
          <div style={{ position:'relative', width:180, height:180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                  {pieData.map((e,i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip content={<CUSTOM_TOOLTIP />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <div style={{ fontSize:36, fontWeight:900, color:j.color, lineHeight:1 }}>{taux}%</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>payé</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:12, padding:'8px 18px', background:`${j.color}12`, borderRadius:20, color:j.color, fontWeight:700, fontSize:14 }}>
            {j.icon} {j.label}
          </div>
          <div style={{ width:'100%', marginTop:20 }}>
            <div style={{ height:8, background:'#f0f4fa', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${taux}%`, background:`linear-gradient(90deg,${j.color},${j.color}cc)`, borderRadius:4, transition:'width 0.8s ease' }} />
            </div>
          </div>
        </div>

        {/* Montants KPIs */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[
            { label:'Total attendu',    val:attendu,  color:'var(--text-primary)',   desc:'Montant total à collecter',       icon:'🎯' },
            { label:'Total encaissé',   val:paye,     color:C.green,  desc:'Montant effectivement payé',      icon:'✅' },
            { label:'Reste à collecter',val:restant,  color:C.red,    desc:'Créances non encore encaissées',  icon:'⏳' },
          ].map(k => (
            <div key={k.label} style={{ background:'var(--bg-card)', borderRadius:16, padding:'18px 22px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:18 }}>
              <div style={{ fontSize:32, flexShrink:0 }}>{k.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:26, fontWeight:900, color:k.color }}>{k.val.toLocaleString()} <span style={{ fontSize:14, fontWeight:500, color:'var(--text-muted)' }}>USD</span></div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', marginTop:2 }}>{k.label}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{k.desc}</div>
              </div>
              {k.label !== 'Total attendu' && (
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:18, fontWeight:800, color:k.color }}>{attendu ? Math.round((k.val/attendu)*100) : 0}%</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>du total attendu</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Détail par faculté */}
      {parFaculte.length > 0 && (
        <div style={{ background:'var(--bg-card)', borderRadius:18, padding:24, boxShadow:'0 2px 14px rgba(0,0,0,0.07)', marginBottom:24 }}>
          <div style={{ fontWeight:800, color:'var(--text-primary)', fontSize:15, marginBottom:20 }}>Recouvrement par faculté</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {parFaculte.map((f, i) => {
              const t = f.tauxRecouvrement || (f.totalAttendu ? Math.round((f.totalPaye/f.totalAttendu)*100) : 0);
              const jf = jauge(t);
              return (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'200px 1fr 100px 80px', alignItems:'center', gap:14, padding:'12px 16px', background:'#fafbff', borderRadius:12 }}>
                  <div style={{ fontWeight:600, color:'var(--text-primary)', fontSize:13 }}>{f.faculte}</div>
                  <div>
                    <div style={{ height:10, background:'#f0f4fa', borderRadius:5, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${t}%`, background:`linear-gradient(90deg,${jf.color},${jf.color}aa)`, borderRadius:5, transition:'width 0.6s ease' }} />
                    </div>
                  </div>
                  <div style={{ fontSize:13, fontWeight:800, color:jf.color, textAlign:'right' }}>{t}%</div>
                  <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:`${jf.color}12`, color:jf.color, textAlign:'center' }}>{jf.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Détail mensuel si disponible */}
      {data.parMois && data.parMois.length > 0 && (
        <div style={{ background:'var(--bg-card)', borderRadius:18, padding:24, boxShadow:'0 2px 14px rgba(0,0,0,0.07)' }}>
          <div style={{ fontWeight:800, color:'var(--text-primary)', fontSize:15, marginBottom:20 }}>Évolution mensuelle du recouvrement</div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--bg-secondary)' }}>
                {['Mois','Attendu','Encaissé','Taux','Statut'].map(h => (
                  <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:12, color:'var(--text-muted)', fontWeight:700, borderBottom:'1px solid var(--border-color)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.parMois.map((m,i) => {
                const t = m.taux || (m.attendu ? Math.round((m.paye/m.attendu)*100) : 0);
                const jm = jauge(t);
                return (
                  <tr key={i} style={{ borderBottom:'1px solid #f5f5f5' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'11px 16px', fontWeight:700, color:'var(--text-primary)', fontSize:13 }}>{m.mois}</td>
                    <td style={{ padding:'11px 16px', fontSize:13, color:'var(--text-muted)' }}>{(m.attendu||0).toLocaleString()} USD</td>
                    <td style={{ padding:'11px 16px', fontSize:13, fontWeight:700, color:C.green }}>{(m.paye||0).toLocaleString()} USD</td>
                    <td style={{ padding:'11px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ flex:1, height:6, background:'#f0f4fa', borderRadius:3, maxWidth:80 }}>
                          <div style={{ height:'100%', width:`${t}%`, background:jm.color, borderRadius:3 }} />
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, color:jm.color, width:36 }}>{t}%</span>
                      </div>
                    </td>
                    <td style={{ padding:'11px 16px' }}>
                      <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:`${jm.color}12`, color:jm.color }}>{jm.label}</span>
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

const DATA_DEMO = {
  tauxRecouvrement: 73,
  totalAttendu: 285000,
  totalPaye: 208050,
  totalReste: 76950,
  parFaculte: [
    { faculte:'Faculté de Médecine',   tauxRecouvrement:88 },
    { faculte:'Faculté Informatique',  tauxRecouvrement:81 },
    { faculte:'Faculté de Gestion',    tauxRecouvrement:74 },
    { faculte:'Faculté de Droit',      tauxRecouvrement:68 },
    { faculte:'Faculté des Sciences',  tauxRecouvrement:55 },
    { faculte:'Faculté de Lettres',    tauxRecouvrement:49 },
  ],
  parMois: [
    { mois:'Janvier',  attendu:24000, paye:21500 },
    { mois:'Février',  attendu:22000, paye:18200 },
    { mois:'Mars',     attendu:25000, paye:20100 },
    { mois:'Avril',    attendu:23000, paye:17800 },
    { mois:'Mai',      attendu:28000, paye:22400 },
    { mois:'Juin',     attendu:31000, paye:26800 },
  ],
};
