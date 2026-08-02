import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  FaDownload, FaSearch, FaCreditCard, FaMobileAlt, FaMoneyBillWave, FaUniversity
} from 'react-icons/fa';

const C = { navy:'#0B1F4A', blue:'#185FA5', green:'#1D9E75', orange:'#C07A2B', red:'#B91C1C' };

const METHODE_STYLES = {
  'MOBILE_MONEY': { label:'Mobile Money', color:'#F97316', bg:'#FFF7ED', icon:<FaMobileAlt /> },
  'ESPECES':      { label:'Espèces',       color:C.green,   bg:'#E8F8F2', icon:<FaMoneyBillWave /> },
  'VIREMENT':     { label:'Virement',      color:C.blue,    bg:'#EBF4FF', icon:<FaUniversity /> },
  'CARTE':        { label:'Carte',         color:'var(--text-primary)',    bg:'#F0F4FF', icon:<FaCreditCard /> },
};

export default function RapportsCaisse() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ totalEncaisse:0, nbTransactions:0, moyenne:0, parMethode:{} });
  const [periode, setPeriode] = useState('today');
  const [recherche, setRecherche] = useState('');
  const [filtreMethode, setFiltreMethode] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  useEffect(() => { loadData(); }, [periode]);

  const loadData = async () => {
    setLoading(true);
    const params = new URLSearchParams({ periode, caissierId: user?.id || '' });
    const [txRes, statsRes] = await Promise.allSettled([
      api.get(`/api/caisse/transactions?${params}`),
      api.get(`/api/caisse/stats?${params}`),
    ]);
    const txData = txRes.status==='fulfilled' ? (txRes.value.data?.content ?? txRes.value.data ?? []) : TX_DEMO;
    const stData = statsRes.status==='fulfilled' ? statsRes.value.data : null;
    setTransactions(txData);
    if (stData) {
      setStats(stData);
    } else {
      const total = txData.reduce((s,t) => s + (t.montant||0), 0);
      const par = txData.reduce((acc,t) => { acc[t.methode||'ESPECES'] = (acc[t.methode||'ESPECES']||0) + (t.montant||0); return acc; }, {});
      setStats({ totalEncaisse:total, nbTransactions:txData.length, moyenne:txData.length?total/txData.length:0, parMethode:par });
    }
    setLoading(false);
  };

  const exporterCSV = () => {
    if (txFiltrees.length === 0) return;
    const entetes = ['Référence', 'Étudiant', 'Montant (USD)', 'Mode', 'Heure', 'Statut'];
    const lignes = txFiltrees.map((t, i) => [
      t.reference || `TRX-${i + 1000}`,
      t.etudiant || t.etudiantNom || '',
      (t.montant || 0).toFixed(2),
      (METHODE_STYLES[t.methode] || { label: t.methode || '' }).label,
      t.createdAt ? new Date(t.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '',
      t.statut === 'VALIDE' || t.statut === 'SUCCESS' ? 'Validé' : (t.statut || 'En attente')
    ]);
    const csvContent = [entetes.join(','), ...lignes.map(l => l.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_caisse_${periode}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const txFiltrees = transactions.filter(t =>
    (!filtreMethode || t.methode === filtreMethode) &&
    (!recherche || (t.etudiant||'').toLowerCase().includes(recherche.toLowerCase()) ||
      (t.reference||'').toLowerCase().includes(recherche.toLowerCase()))
  );

  const KPIS = [
    { label:'Total encaissé',    val:`${stats.totalEncaisse?.toLocaleString()} USD`, color:C.green,  bg:'#E8F8F2' },
    { label:'Nb transactions',   val:stats.nbTransactions,                            color:C.blue,   bg:'#EBF4FF' },
    { label:'Valeur moyenne',    val:`${(stats.moyenne||0).toFixed(2)} USD`,          color:C.orange, bg:'#FEF3C7' },
    { label:'En attente',        val:transactions.filter(t=>t.statut==='EN_ATTENTE').length, color:C.red, bg:'#FEE2E2' },
  ];

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:300,gap:12 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:36,height:36,border:`3px solid ${C.blue}30`,borderTopColor:C.blue,borderRadius:'50%',animation:'spin 0.8s linear infinite' }} />
      <span style={{ color:'var(--text-muted)',fontSize:14 }}>Chargement des rapports...</span>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',sans-serif", padding:'24px 20px', maxWidth:1200, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ color:'var(--text-primary)', fontSize:24, fontWeight:900, margin:0 }}>Rapports de caisse</h1>
          <p style={{ color:'var(--text-muted)', fontSize:14, margin:'4px 0 0' }}>Suivi des encaissements — {user?.prenom} {user?.nom}</p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {/* Sélecteur période */}
          <div style={{ display:'flex', gap:4, background:'#f0f4fa', borderRadius:10, padding:4 }}>
            {[['today',"Aujourd'hui"],['week','Cette semaine'],['month','Ce mois']].map(([v,l]) => (
              <button key={v} onClick={() => setPeriode(v)} style={{ padding:'7px 14px', borderRadius:7, border:'none', background:periode===v?'white':'transparent', color:periode===v?C.navy:'#888', fontWeight:periode===v?700:500, fontSize:12, cursor:'pointer', boxShadow:periode===v?'0 1px 4px rgba(0,0,0,0.08)':'none', transition:'all 0.15s' }}>{l}</button>
            ))}
          </div>
          <button onClick={exporterCSV} disabled={txFiltrees.length === 0} style={{ padding:'9px 16px', background:C.green, color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor: txFiltrees.length === 0 ? 'default' : 'pointer', opacity: txFiltrees.length === 0 ? 0.6 : 1, display:'flex', alignItems:'center', gap:7 }}>
            <FaDownload /> Exporter
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:14, marginBottom:24 }}>
        {KPIS.map(k => (
          <div key={k.label} style={{ background:'var(--bg-card)', borderRadius:16, padding:'18px 20px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:24, fontWeight:900, color:k.color, marginBottom:4 }}>{k.val}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>{k.label}</div>
            <div style={{ height:3, background:k.bg, borderRadius:2, marginTop:10 }}>
              <div style={{ height:'100%', width:'70%', background:k.color, borderRadius:2 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Répartition par méthode */}
      {Object.keys(stats.parMethode||{}).length > 0 && (
        <div style={{ background:'var(--bg-card)', borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:20 }}>
          <div style={{ fontWeight:800, color:'var(--text-primary)', fontSize:14, marginBottom:16 }}>Répartition par mode de paiement</div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {Object.entries(stats.parMethode).map(([methode, montant]) => {
              const m = METHODE_STYLES[methode] || { label:methode, color:'var(--text-primary)', bg:'#f0f4fa', icon:<FaCreditCard /> };
              const pct = stats.totalEncaisse ? Math.round((montant/stats.totalEncaisse)*100) : 0;
              return (
                <div key={methode} style={{ flex:'1 1 180px', padding:'14px 18px', background:m.bg, borderRadius:14, minWidth:150 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <span style={{ color:m.color, fontSize:16 }}>{m.icon}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:m.color }}>{m.label}</span>
                  </div>
                  <div style={{ fontSize:20, fontWeight:900, color:m.color }}>{montant?.toLocaleString()} USD</div>
                  <div style={{ marginTop:6, height:4, background:'rgba(0,0,0,0.08)', borderRadius:2 }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:m.color, borderRadius:2 }} />
                  </div>
                  <div style={{ fontSize:11, color:m.color, marginTop:4, fontWeight:600 }}>{pct}% du total</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:'1', minWidth:220 }}>
          <FaSearch style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', fontSize:13 }} />
          <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Étudiant, référence..."
            style={{ width:'100%', padding:'10px 12px 10px 36px', borderRadius:10, border:'1.5px solid var(--border-color)', fontSize:14, outline:'none', boxSizing:'border-box' }} />
        </div>
        <select value={filtreMethode} onChange={e => setFiltreMethode(e.target.value)}
          style={{ padding:'10px 14px', border:'1.5px solid var(--border-color)', borderRadius:10, fontSize:13, outline:'none', background:'var(--bg-card)', color:'var(--text-primary)' }}>
          <option value="">Tous les modes</option>
          {Object.entries(METHODE_STYLES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Table transactions */}
      <div style={{ background:'var(--bg-card)', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--bg-secondary)' }}>
              {['Référence','Étudiant','Montant','Mode','Heure','Statut'].map(h => (
                <th key={h} style={{ padding:'13px 16px', textAlign:'left', fontSize:12, color:'var(--text-muted)', fontWeight:700, borderBottom:'1px solid var(--border-color)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {txFiltrees.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign:'center', padding:50, color:'#bbb', fontSize:14 }}>
                Aucune transaction pour cette période
              </td></tr>
            ) : txFiltrees.map((t, i) => {
              const m = METHODE_STYLES[t.methode] || { label:t.methode||'—', color:'var(--text-primary)', bg:'#f0f4fa', icon:<FaCreditCard /> };
              const ok = t.statut === 'VALIDE' || t.statut === 'SUCCESS';
              return (
                <tr key={i} style={{ borderBottom:'1px solid #f5f5f5', transition:'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--bg-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'12px 16px', fontSize:13, fontFamily:'monospace', color:'var(--text-muted)' }}>{t.reference || `TRX-${i+1000}`}</td>
                  <td style={{ padding:'12px 16px', fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{t.etudiant || t.etudiantNom || '—'}</td>
                  <td style={{ padding:'12px 16px', fontSize:14, fontWeight:800, color:C.green }}>{(t.montant||0).toLocaleString()} <span style={{ fontSize:11, fontWeight:500, color:'var(--text-muted)' }}>USD</span></td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:20, background:m.bg, color:m.color, fontSize:12, fontWeight:700 }}>
                      {m.icon} {m.label}
                    </span>
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:13, color:'var(--text-muted)' }}>
                    {t.createdAt ? new Date(t.createdAt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : '—'}
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:ok?'#E8F8F2':'#FEF3C7', color:ok?C.green:C.orange }}>
                      {ok ? '✓ Validé' : t.statut || 'En attente'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {txFiltrees.length > 0 && (
          <div style={{ padding:'12px 16px', background:'var(--bg-secondary)', borderTop:'1px solid var(--border-color)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>{txFiltrees.length} transaction{txFiltrees.length>1?'s':''}</span>
            <span style={{ fontSize:13, fontWeight:700, color:C.green }}>
              Total affiché : {txFiltrees.reduce((s,t) => s+(t.montant||0),0).toLocaleString()} USD
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const TX_DEMO = [
  { reference:'TRX-2001', etudiant:'Jean-Paul Mukendi', montant:250, methode:'MOBILE_MONEY', statut:'VALIDE',    createdAt:new Date().toISOString() },
  { reference:'TRX-2002', etudiant:'Espérance Nsimba',  montant:150, methode:'ESPECES',      statut:'VALIDE',    createdAt:new Date().toISOString() },
  { reference:'TRX-2003', etudiant:'Patrick Katumba',   montant:500, methode:'VIREMENT',     statut:'EN_ATTENTE',createdAt:new Date().toISOString() },
  { reference:'TRX-2004', etudiant:'Marie Lukusa',       montant:250, methode:'ESPECES',      statut:'VALIDE',    createdAt:new Date().toISOString() },
  { reference:'TRX-2005', etudiant:'David Bula',         montant:300, methode:'MOBILE_MONEY', statut:'VALIDE',    createdAt:new Date().toISOString() },
];
