import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import { FaPlus, FaTimes, FaEdit, FaTrash, FaCheckCircle, FaStar, FaGraduationCap } from 'react-icons/fa';

const C = { navy:'#0B1F4A', blue:'#185FA5', green:'#1D9E75', orange:'#C07A2B', red:'#B91C1C', purple:'#6B21A8' };

const MENTION_COLORS = {
  'Excellent':   { bg:'#E8F8F2', color:C.green,  border:'#A7F3D0' },
  'Très Bien':   { bg:'#E6F1FB', color:C.blue,   border:'#BFDBFE' },
  'Bien':        { bg:'#EDE9FE', color:C.purple,  border:'#C4B5FD' },
  'Assez Bien':  { bg:'#FEF3C7', color:C.orange, border:'#FDE68A' },
  'Passable':    { bg:'#FEE2E2', color:C.red,     border:'#FECACA' },
};

const BAREME_DEFAUT = [
  { mention:'Excellent',  min:18, max:20, points:'A', description:'Maîtrise parfaite du contenu' },
  { mention:'Très Bien',  min:15, max:17, points:'B', description:'Très bonne compréhension' },
  { mention:'Bien',       min:12, max:14, points:'C', description:'Bonne compréhension générale' },
  { mention:'Assez Bien', min:10, max:11, points:'D', description:'Compréhension suffisante' },
  { mention:'Passable',   min:5,  max:9,  points:'E', description:'Compréhension minimale' },
];

const FORM_VIDE = { nom:'', coursId:'', ponderationTP:30, ponderationInterro:20, ponderationExamen:50, lignes: BAREME_DEFAUT.map(l=>({...l})) };

export default function Baremes() {
  const { user } = useAuth();
  const [baremes, setBaremes] = useState([]);
  const [cours, setCours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...FORM_VIDE, lignes: BAREME_DEFAUT.map(l=>({...l})) });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  useEffect(() => { loadBaremes(); loadCours(); }, []);

  const loadCours = async () => {
    try {
      const r = await api.get(`/api/cours/professeur/${user?.id}`);
      setCours(Array.isArray(r.data) ? r.data : []);
    } catch { setCours([]); }
  };

  const loadBaremes = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/api/baremes/professeur/${user?.id}`);
      setBaremes(Array.isArray(r.data) ? r.data : []);
    } catch { setBaremes(BAREMES_DEMO); }
    setLoading(false);
  };

  const openNew = () => { setEditingId(null); setForm({ ...FORM_VIDE, lignes: BAREME_DEFAUT.map(l=>({...l})) }); setModal(true); };
  const openEdit = (b) => { setEditingId(b.id); setForm({
    nom:b.nom,
    coursId: b.coursId || '',
    ponderationTP: b.ponderationTP ?? 30,
    ponderationInterro: b.ponderationInterro ?? 20,
    ponderationExamen: b.ponderationExamen ?? 50,
    lignes:b.lignes||BAREME_DEFAUT.map(l=>({...l}))
  }); setModal(true); };

  const totalPonderation = (+form.ponderationTP||0) + (+form.ponderationInterro||0) + (+form.ponderationExamen||0);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        nom: form.nom,
        coursId: form.coursId || null,
        ponderationTP: +form.ponderationTP,
        ponderationInterro: +form.ponderationInterro,
        ponderationExamen: +form.ponderationExamen,
        lignes: form.lignes
      };
      if (editingId) await api.put(`/api/baremes/${editingId}`, payload);
      else await api.post('/api/baremes', { ...payload, professeurId: user?.id });
      setModal(false); setSuccess('Barème enregistré avec succès'); setTimeout(()=>setSuccess(''),3000); loadBaremes();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce barème ?')) return;
    try { await api.delete(`/api/baremes/${id}`); loadBaremes(); } catch {}
  };

  const updateLigne = (i, field, val) => {
    setForm(f => { const l=[...f.lignes]; l[i]={...l[i],[field]:val}; return {...f,lignes:l}; });
  };

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:300,gap:12 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:36,height:36,border:`3px solid ${C.blue}30`,borderTopColor:C.blue,borderRadius:'50%',animation:'spin 0.8s linear infinite' }} />
      <span style={{ color:'var(--text-muted)',fontSize:14 }}>Chargement des barèmes...</span>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',sans-serif", padding:'24px 20px', maxWidth:1100, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ color:'var(--text-primary)', fontSize:24, fontWeight:900, margin:0 }}>Barèmes de notation</h1>
          <p style={{ color:'var(--text-muted)', fontSize:14, margin:'4px 0 0' }}>Définissez les échelles de notation pour vos évaluations</p>
        </div>
        <button onClick={openNew} style={{ padding:'10px 20px', background:C.blue, color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
          <FaPlus /> Nouveau barème
        </button>
      </div>

      {success && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 18px', background:'#E8F8F2', border:'1px solid #A7F3D0', borderRadius:10, marginBottom:20, color:C.green, fontWeight:600, fontSize:14 }}>
          <FaCheckCircle /> {success}
        </div>
      )}

      {/* Barème LMD par défaut */}
      <div style={{ background:'var(--bg-card)', borderRadius:18, padding:24, boxShadow:'0 2px 14px rgba(0,0,0,0.07)', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'#EDE9FE', color:C.purple, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <FaGraduationCap />
          </div>
          <div>
            <div style={{ fontWeight:800, color:'var(--text-primary)', fontSize:15 }}>Barème LMD officiel (référence)</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>Échelle nationale RDC — sur 20 points</div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10 }}>
          {BAREME_DEFAUT.map(l => {
            const m = MENTION_COLORS[l.mention] || MENTION_COLORS['Passable'];
            return (
              <div key={l.mention} style={{ padding:'14px 16px', borderRadius:14, background:m.bg, border:`1.5px solid ${m.border}`, textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:900, color:m.color }}>{l.min}–{l.max}</div>
                <div style={{ fontSize:13, fontWeight:700, color:m.color, marginTop:3 }}>{l.mention}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>Grade {l.points}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mes barèmes */}
      {baremes.length === 0 ? (
        <div style={{ background:'var(--bg-card)', borderRadius:18, padding:48, textAlign:'center', boxShadow:'0 2px 14px rgba(0,0,0,0.07)' }}>
          <FaStar style={{ fontSize:40, color:'#ddd', marginBottom:16 }} />
          <p style={{ color:'var(--text-muted)', fontSize:14, margin:0 }}>Aucun barème personnalisé créé — cliquez sur "Nouveau barème" pour commencer</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(380px,1fr))', gap:18 }}>
          {baremes.map(b => (
            <div key={b.id} style={{ background:'var(--bg-card)', borderRadius:18, padding:22, boxShadow:'0 2px 14px rgba(0,0,0,0.07)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <div>
                  <div style={{ fontWeight:800, color:'var(--text-primary)', fontSize:16 }}>{b.nom}</div>
                  {b.coursNom && <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>Cours : {b.coursNom}</div>}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => openEdit(b)} style={{ padding:'6px 12px', background:'#f0f4ff', color:C.blue, border:'none', borderRadius:8, cursor:'pointer', fontSize:13 }}><FaEdit /></button>
                  <button onClick={() => handleDelete(b.id)} style={{ padding:'6px 12px', background:'#fff5f5', color:C.red, border:'none', borderRadius:8, cursor:'pointer', fontSize:13 }}><FaTrash /></button>
                </div>
              </div>
              <div style={{ fontSize:12, color:C.blue, fontWeight:700, marginBottom:12 }}>
                Pondération : TP {b.ponderationTP ?? 30}% / Interro {b.ponderationInterro ?? 20}% / Examen {b.ponderationExamen ?? 50}%
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {(b.lignes || BAREME_DEFAUT).map((l,i) => {
                  const m = MENTION_COLORS[l.mention] || MENTION_COLORS['Passable'];
                  const pct = ((l.max - l.min + 1) / 20) * 100;
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:52, fontWeight:700, fontSize:12, color:m.color, textAlign:'right', flexShrink:0 }}>{l.min}–{l.max}</div>
                      <div style={{ flex:1, height:22, background:'var(--bg-secondary)', borderRadius:6, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:m.bg, border:`1px solid ${m.border}`, borderRadius:6, display:'flex', alignItems:'center', paddingLeft:8 }}>
                          <span style={{ fontSize:11, fontWeight:700, color:m.color, whiteSpace:'nowrap' }}>{l.mention}</span>
                        </div>
                      </div>
                      <div style={{ width:18, textAlign:'center', fontSize:12, fontWeight:800, color:m.color, flexShrink:0 }}>{l.points}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div onClick={() => setModal(false)} style={{ position:'fixed', inset:0, background:'rgba(11,31,74,0.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'var(--bg-card)', borderRadius:20, padding:30, maxWidth:600, width:'100%', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
              <h3 style={{ color:'var(--text-primary)', fontWeight:800, fontSize:18, margin:0 }}>{editingId ? 'Modifier le barème' : 'Nouveau barème'}</h3>
              <button onClick={() => setModal(false)} style={{ background:'#f0f4fa', border:'none', borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'var(--text-muted)' }}><FaTimes /></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:700, color:'var(--text-muted)', marginBottom:5 }}>Nom du barème *</label>
                <input value={form.nom} onChange={e => setForm(f=>({...f,nom:e.target.value}))} placeholder="Ex : Barème Examen Final"
                  style={{ width:'100%', padding:'10px 12px', border:'1.5px solid var(--border-color)', borderRadius:9, fontSize:14, outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:700, color:'var(--text-muted)', marginBottom:5 }}>Cours associé</label>
                <select value={form.coursId} onChange={e => setForm(f=>({...f,coursId:e.target.value}))}
                  style={{ width:'100%', padding:'10px 12px', border:'1.5px solid var(--border-color)', borderRadius:9, fontSize:14, outline:'none', boxSizing:'border-box' }}>
                  <option value="">-- Générique (tous cours) --</option>
                  {cours.map(c => <option key={c.id} value={c.id}>{c.code} - {c.titre}</option>)}
                </select>
              </div>
            </div>

            <div style={{ fontWeight:700, color:'var(--text-primary)', fontSize:13, marginBottom:12 }}>
              Pondération de la note finale (doit totaliser 100%)
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:8 }}>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:700, color:'var(--text-muted)', marginBottom:5 }}>TP (%)</label>
                <input type="number" min={0} max={100} value={form.ponderationTP}
                  onChange={e => setForm(f=>({...f,ponderationTP:e.target.value}))}
                  style={{ width:'100%', padding:'10px 12px', border:'1.5px solid var(--border-color)', borderRadius:9, fontSize:14, outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:700, color:'var(--text-muted)', marginBottom:5 }}>Interro (%)</label>
                <input type="number" min={0} max={100} value={form.ponderationInterro}
                  onChange={e => setForm(f=>({...f,ponderationInterro:e.target.value}))}
                  style={{ width:'100%', padding:'10px 12px', border:'1.5px solid var(--border-color)', borderRadius:9, fontSize:14, outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:700, color:'var(--text-muted)', marginBottom:5 }}>Examen (%)</label>
                <input type="number" min={0} max={100} value={form.ponderationExamen}
                  onChange={e => setForm(f=>({...f,ponderationExamen:e.target.value}))}
                  style={{ width:'100%', padding:'10px 12px', border:'1.5px solid var(--border-color)', borderRadius:9, fontSize:14, outline:'none', boxSizing:'border-box' }} />
              </div>
            </div>
            <div style={{ fontSize:12, fontWeight:700, marginBottom:20, color: totalPonderation===100 ? C.green : C.red }}>
              Total : {totalPonderation}% {totalPonderation!==100 && '(doit être égal à 100%)'}
            </div>

            <div style={{ fontWeight:700, color:'var(--text-primary)', fontSize:13, marginBottom:12 }}>Lignes du barème</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
              {form.lignes.map((l,i) => {
                const m = MENTION_COLORS[l.mention] || MENTION_COLORS['Passable'];
                return (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 70px 70px 60px', gap:8, alignItems:'center', padding:'10px 14px', background:m.bg, borderRadius:10, border:`1px solid ${m.border}` }}>
                    <input value={l.mention} onChange={e => updateLigne(i,'mention',e.target.value)}
                      style={{ padding:'7px 10px', border:'none', background:'var(--bg-card)', borderRadius:7, fontSize:13, fontWeight:600, color:m.color, outline:'none' }} />
                    <input type="number" value={l.min} onChange={e => updateLigne(i,'min',+e.target.value)} placeholder="Min"
                      style={{ padding:'7px 10px', border:'none', background:'var(--bg-card)', borderRadius:7, fontSize:13, textAlign:'center', outline:'none' }} />
                    <input type="number" value={l.max} onChange={e => updateLigne(i,'max',+e.target.value)} placeholder="Max"
                      style={{ padding:'7px 10px', border:'none', background:'var(--bg-card)', borderRadius:7, fontSize:13, textAlign:'center', outline:'none' }} />
                    <input value={l.points} onChange={e => updateLigne(i,'points',e.target.value)} placeholder="A-F"
                      style={{ padding:'7px 10px', border:'none', background:'var(--bg-card)', borderRadius:7, fontSize:13, textAlign:'center', fontWeight:800, color:m.color, outline:'none' }} />
                  </div>
                );
              })}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={handleSave} disabled={saving||!form.nom||totalPonderation!==100}
                style={{ flex:1, padding:'12px', background:C.blue, color:'white', border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer', opacity:(!form.nom||totalPonderation!==100)?0.5:1 }}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button onClick={() => setModal(false)} style={{ flex:1, padding:'12px', background:'#f0f4fa', color:'var(--text-muted)', border:'none', borderRadius:10, fontWeight:600, fontSize:14, cursor:'pointer' }}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const BAREMES_DEMO = [
  { id:1, nom:'Barème Standard L1', coursNom:'Introduction Informatique', ponderationTP:30, ponderationInterro:20, ponderationExamen:50, lignes:BAREME_DEFAUT },
  { id:2, nom:'Barème TPs & Projets', coursNom:'Programmation Web', ponderationTP:40, ponderationInterro:10, ponderationExamen:50, lignes:[
    { mention:'Excellent',  min:17, max:20, points:'A' },
    { mention:'Très Bien',  min:13, max:16, points:'B' },
    { mention:'Bien',       min:10, max:12, points:'C' },
    { mention:'Passable',   min:7,  max:9,  points:'D' },
    { mention:'Insuffisant',min:0,  max:6,  points:'F' },
  ]},
];
