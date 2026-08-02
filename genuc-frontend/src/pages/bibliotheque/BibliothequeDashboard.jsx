import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDesign } from '../../context/DesignContext';
import api from '../../api/axios';
import BibliothequeDashboardPremium from './BibliothequeDashboardPremium';
import {
  FaBook, FaBookOpen, FaExclamationTriangle, FaBell, FaSearch,
  FaPlus, FaTimes, FaCheck, FaBarcode
} from 'react-icons/fa';

const C = { navy: '#0B1F4A', blue: '#185FA5', green: '#1D9E75', orange: '#C07A2B', red: '#B91C1C' };

export default function BibliothequeDashboard() {
  const { user } = useAuth();
  const { design } = useDesign();
  const [stats, setStats] = useState({ totalLivres: 0, empruntsEnCours: 0, retards: 0, reservations: 0 });
  const [emprunts, setEmprunts] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [livres, setLivres] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('emprunts');
  const [modalAjout, setModalAjout] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newLivre, setNewLivre] = useState({ titre: '', auteur: '', isbn: '', categorie: '', exemplaires: 1 });

  const universiteId = user?.universiteId;

  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  useEffect(() => { if (universiteId) loadAll(); else setLoading(false); }, [universiteId]);

  const loadAll = async () => {
    setLoading(true);
    const [s, e, r, l] = await Promise.allSettled([
      api.get(`/api/bibliotheque/stats/${universiteId}`),
      // Pas d'endpoint listant tous les emprunts en cours : on réutilise l'endpoint des
      // échéances avec une fenêtre large pour obtenir l'ensemble des prêts actifs.
      api.get(`/api/bibliotheque/echeances/${universiteId}?jours=3650`),
      api.get(`/api/bibliotheque/admin/reservations/${universiteId}`),
      api.get(`/api/bibliotheque/livres/${universiteId}`),
    ]);
    if (s.status === 'fulfilled') setStats(s.value.data || {});
    if (e.status === 'fulfilled') setEmprunts(e.value.data ?? []);
    if (r.status === 'fulfilled') setReservations(r.value.data ?? []);
    if (l.status === 'fulfilled') setLivres(l.value.data ?? []);
    setLoading(false);
  };

  const handleAjout = async () => {
    setSaving(true);
    try {
      await api.post('/api/bibliotheque/admin/livres', { ...newLivre, universite: { id: parseInt(universiteId) } });
      setModalAjout(false);
      setNewLivre({ titre:'',auteur:'',isbn:'',categorie:'',exemplaires:1 });
      loadAll();
    } catch (err) {
      // eslint-disable-next-line no-alert
      window.alert(err.response?.data?.erreur || 'Erreur lors de l\'enregistrement du livre');
    }
    setSaving(false);
  };

  const KPIS = [
    { label: 'Total livres',      val: stats.totalLivres ?? livres.length, color: C.blue,   bg: '#EBF4FF', icon: <FaBook /> },
    { label: 'Emprunts en cours', val: stats.totalEmpruntsEnCours ?? emprunts.length, color: C.green, bg: '#E8F8F2', icon: <FaBookOpen /> },
    { label: 'Retards',           val: emprunts.filter(e => e.dateRetourPrevue && new Date(e.dateRetourPrevue) < new Date()).length, color: C.red, bg: '#FEE2E2', icon: <FaExclamationTriangle /> },
    { label: 'Réservations',      val: stats.totalReservations ?? reservations.length,       color: C.orange, bg: '#FEF3C7', icon: <FaBell /> },
  ];

  const empruntsFiltres = emprunts.filter(e =>
    !recherche ||
    (e.livreTitre || '').toLowerCase().includes(recherche.toLowerCase()) ||
    (e.etudiantNom || '').toLowerCase().includes(recherche.toLowerCase()) ||
    (e.etudiantPrenom || '').toLowerCase().includes(recherche.toLowerCase())
  );
  const retards = emprunts.filter(e => e.dateRetourPrevue && new Date(e.dateRetourPrevue) < new Date());
  const livresFiltres = livres.filter(l =>
    !recherche || (l.titre || '').toLowerCase().includes(recherche.toLowerCase()) ||
    (l.auteur || '').toLowerCase().includes(recherche.toLowerCase())
  );

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, gap:16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:40, height:40, border:`4px solid ${C.blue}30`, borderTopColor:C.blue, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <p style={{ color:'var(--text-muted)', fontSize:14 }}>Chargement du tableau de bord...</p>
    </div>
  );

  // Modale d'ajout de livre, partagée par les deux designs.
  const modals = (
    <>
      {modalAjout && (
        <div onClick={() => setModalAjout(false)} style={{ position:'fixed', inset:0, background:'rgba(11,31,74,0.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'var(--bg-card)', borderRadius:20, padding:32, maxWidth:460, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h3 style={{ color:'var(--text-primary)', fontWeight:800, fontSize:18, margin:0 }}>Nouveau livre</h3>
              <button onClick={() => setModalAjout(false)} style={{ background:'#f0f4fa', border:'none', borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'var(--text-muted)', fontSize:14 }}><FaTimes /></button>
            </div>
            {[
              { label:'Titre *', key:'titre', ph:"Titre du livre" },
              { label:'Auteur *', key:'auteur', ph:"Prénom Nom de l'auteur" },
              { label:'ISBN', key:'isbn', ph:"978-..." },
              { label:'Catégorie', key:'categorie', ph:"Informatique, Droit, Médecine..." },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:700, color:'var(--text-muted)', marginBottom:5 }}>{f.label}</label>
                <input value={newLivre[f.key]} onChange={e => setNewLivre(p => ({...p,[f.key]:e.target.value}))} placeholder={f.ph}
                  style={{ width:'100%', padding:'10px 12px', border:'1.5px solid var(--border-color)', borderRadius:9, fontSize:14, outline:'none', boxSizing:'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom:22 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'var(--text-muted)', marginBottom:5 }}>Nombre d'exemplaires</label>
              <input type="number" min="1" value={newLivre.exemplaires} onChange={e => setNewLivre(p => ({...p,exemplaires:+e.target.value}))}
                style={{ width:'100%', padding:'10px 12px', border:'1.5px solid var(--border-color)', borderRadius:9, fontSize:14, outline:'none', boxSizing:'border-box' }} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={handleAjout} disabled={saving || !newLivre.titre || !newLivre.auteur}
                style={{ flex:1, padding:'12px', background:C.blue, color:'white', border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer', opacity:(!newLivre.titre||!newLivre.auteur)?0.5:1 }}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button onClick={() => setModalAjout(false)} style={{ flex:1, padding:'12px', background:'#f0f4fa', color:'var(--text-muted)', border:'none', borderRadius:10, fontWeight:600, fontSize:14, cursor:'pointer' }}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // ── Variante « premium » (opt-in, réversible) ──────────────────────────
  if (design === 'premium') {
    return (
      <>
        <BibliothequeDashboardPremium
          user={user}
          stats={stats}
          emprunts={emprunts}
          reservations={reservations}
          livres={livres}
          onOpenAjout={() => setModalAjout(true)}
        />
        {modals}
      </>
    );
  }

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',sans-serif", padding:'24px 20px', maxWidth:1200, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ color:'var(--text-primary)', fontSize:26, fontWeight:900, margin:0 }}>Bibliothèque</h1>
          <p style={{ color:'var(--text-muted)', fontSize:14, margin:'4px 0 0' }}>
            Bonjour {user?.prenom || 'Bibliothécaire'} — gestion du fonds documentaire
          </p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <Link to="/bibliothecaire/gestion-emprunts" style={{ padding:'10px 18px', background:'#f0f4ff', color:C.blue, borderRadius:10, textDecoration:'none', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:7 }}>
            <FaBarcode /> Gérer les emprunts
          </Link>
          <button onClick={() => setModalAjout(true)} style={{ padding:'10px 18px', background:C.blue, color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:7 }}>
            <FaPlus /> Nouveau livre
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:14, marginBottom:28 }}>
        {KPIS.map(k => (
          <div key={k.label} style={{ background:'var(--bg-card)', borderRadius:16, padding:'18px 20px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:46, height:46, borderRadius:13, background:k.bg, color:k.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:19, flexShrink:0 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize:28, fontWeight:900, color:k.color, lineHeight:1 }}>{k.val}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, background:'#f0f4fa', borderRadius:12, padding:4, marginBottom:20, width:'fit-content' }}>
        {[['emprunts',`Emprunts (${empruntsFiltres.length})`],['livres','Catalogue'],['retards',`Retards (${retards.length})`],['reservations',`Réservations (${reservations.length})`]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:'8px 18px', borderRadius:9, border:'none', background:tab===id?'white':'transparent', color:tab===id?C.navy:'#888', fontWeight:tab===id?700:500, fontSize:13, cursor:'pointer', boxShadow:tab===id?'0 1px 6px rgba(0,0,0,0.08)':'none', transition:'all 0.15s', whiteSpace:'nowrap' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position:'relative', maxWidth:380, marginBottom:16 }}>
        <FaSearch style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', fontSize:13 }} />
        <input value={recherche} onChange={e => setRecherche(e.target.value)}
          placeholder={tab==='livres' ? "Titre, auteur..." : "Rechercher..."}
          style={{ width:'100%', padding:'10px 12px 10px 36px', borderRadius:10, border:'1.5px solid var(--border-color)', fontSize:14, outline:'none', boxSizing:'border-box' }} />
      </div>

      {/* Table */}
      <div style={{ background:'var(--bg-card)', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'hidden' }}>

        {tab === 'emprunts' && (
          <>
            <p style={{ fontSize:12, color:'var(--text-muted)', padding:'12px 16px 0' }}>
              Le retour d'un emprunt est effectué par l'étudiant depuis son propre compte.
            </p>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--bg-secondary)' }}>
                  {['N° emprunt','Livre','Étudiant','Emprunté le','Retour prévu','Statut'].map(h => (
                    <th key={h} style={{ padding:'13px 16px', textAlign:'left', fontSize:12, color:'var(--text-muted)', fontWeight:700, borderBottom:'1px solid var(--border-color)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {empruntsFiltres.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign:'center', padding:50, color:'#bbb', fontSize:14 }}>
                    <FaBookOpen style={{ fontSize:36, display:'block', margin:'0 auto 12px' }} />
                    Aucun emprunt en cours
                  </td></tr>
                ) : empruntsFiltres.map((e, i) => {
                  const retard = e.dateRetourPrevue && new Date(e.dateRetourPrevue) < new Date();
                  return (
                    <tr key={e.id || i} style={{ borderBottom:'1px solid var(--border-color, #f5f5f5)', transition:'background 0.1s' }}
                      onMouseEnter={ev => ev.currentTarget.style.background='var(--bg-secondary)'}
                      onMouseLeave={ev => ev.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'12px 16px', fontFamily:'monospace', color:'var(--text-primary)' }}>#{e.id}</td>
                      <td style={{ padding:'12px 16px', fontSize:13, color:'var(--text-primary)', fontWeight:600 }}>{e.livreTitre || '—'}</td>
                      <td style={{ padding:'12px 16px', fontSize:13, color:'var(--text-secondary)' }}>
                        {[e.etudiantPrenom, e.etudiantNom].filter(Boolean).join(' ') || '—'}
                        {e.etudiantMatricule ? ` (${e.etudiantMatricule})` : ''}
                      </td>
                      <td style={{ padding:'12px 16px', fontSize:13, color:'var(--text-muted)' }}>{e.dateEmprunt ? new Date(e.dateEmprunt).toLocaleDateString('fr-FR') : '—'}</td>
                      <td style={{ padding:'12px 16px', fontSize:13, color:retard?C.red:'var(--text-muted)', fontWeight:retard?700:400 }}>{e.dateRetourPrevue ? new Date(e.dateRetourPrevue).toLocaleDateString('fr-FR') : '—'}</td>
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:retard?'#FEE2E2':'#E8F8F2', color:retard?C.red:C.green }}>
                          {retard ? '⚠ Retard' : '✓ En cours'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {tab === 'reservations' && (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--bg-secondary)' }}>
                {['N°','Livre','Étudiant','Réservé le','Expire le','Statut'].map(h => (
                  <th key={h} style={{ padding:'13px 16px', textAlign:'left', fontSize:12, color:'var(--text-muted)', fontWeight:700, borderBottom:'1px solid var(--border-color)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:50, color:'#bbb', fontSize:14 }}>
                  <FaBell style={{ fontSize:36, display:'block', margin:'0 auto 12px' }} />
                  Aucune réservation
                </td></tr>
              ) : reservations.map((r, i) => (
                <tr key={r.id || i} style={{ borderBottom:'1px solid #f5f5f5' }}>
                  <td style={{ padding:'12px 16px', fontFamily:'monospace', color:'var(--text-primary)' }}>#{r.id}</td>
                  <td style={{ padding:'12px 16px', fontSize:13, color:'var(--text-primary)', fontWeight:600 }}>{r.livreTitre || '—'}</td>
                  <td style={{ padding:'12px 16px', fontSize:13, color:'var(--text-secondary)' }}>
                    {[r.etudiantPrenom, r.etudiantNom].filter(Boolean).join(' ') || '—'}
                    {r.etudiantMatricule ? ` (${r.etudiantMatricule})` : ''}
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:13, color:'var(--text-muted)' }}>{r.dateReservation ? new Date(r.dateReservation).toLocaleDateString('fr-FR') : '—'}</td>
                  <td style={{ padding:'12px 16px', fontSize:13, color:'var(--text-muted)' }}>{r.dateExpiration ? new Date(r.dateExpiration).toLocaleDateString('fr-FR') : '—'}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:'#EBF4FF', color:C.blue }}>{r.statut}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'livres' && (
          <div style={{ padding:20, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))', gap:14 }}>
            {livresFiltres.length === 0 ? (
              <div style={{ gridColumn:'1/-1', textAlign:'center', padding:50, color:'#bbb' }}>
                <FaBook style={{ fontSize:36, display:'block', margin:'0 auto 12px' }} /> Aucun livre trouvé
              </div>
            ) : livresFiltres.map((l, i) => (
              <div key={i} style={{ background:'var(--bg-secondary)', border:'1.5px solid var(--border-color, #eef0f5)', borderRadius:14, padding:16 }}>
                <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                  <div style={{ width:40, height:54, background:`linear-gradient(135deg,${C.blue},${C.navy})`, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <FaBook style={{ color:'white', fontSize:16 }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:'var(--text-primary)', lineHeight:1.3, marginBottom:2 }}>{l.titre || '—'}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>{l.auteur || '—'}</div>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      {l.categorie && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'#E6F1FB', color:C.blue, fontWeight:600 }}>{l.categorie}</span>}
                      <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:(l.quantiteDisponible??1)>0?'#E8F8F2':'#FEE2E2', color:(l.quantiteDisponible??1)>0?C.green:C.red, fontWeight:600 }}>
                        {l.quantiteDisponible ?? l.quantiteTotale ?? 1} dispo.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'retards' && (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'rgba(220, 53, 69, 0.08)' }}>
                {['N° emprunt','Échéance','Retard'].map(h => (
                  <th key={h} style={{ padding:'13px 16px', textAlign:'left', fontSize:12, color:C.red, fontWeight:700, borderBottom:'1px solid rgba(220, 53, 69, 0.25)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {retards.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign:'center', padding:50, color:'var(--text-muted)', fontSize:14 }}>
                  <FaCheck style={{ fontSize:36, color:C.green, display:'block', margin:'0 auto 12px' }} />
                  Tout est à jour — aucun retard
                </td></tr>
              ) : retards.map((e, i) => {
                const jours = Math.floor((Date.now() - new Date(e.dateRetourPrevue)) / 86400000);
                return (
                  <tr key={e.id || i} style={{ borderBottom:'1px solid rgba(220, 53, 69, 0.15)' }}
                    onMouseEnter={ev => ev.currentTarget.style.background='rgba(220, 53, 69, 0.06)'}
                    onMouseLeave={ev => ev.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'12px 16px', fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:'monospace' }}>#{e.id}</td>
                    <td style={{ padding:'12px 16px', fontSize:13, color:C.red, fontWeight:600 }}>{new Date(e.dateRetourPrevue).toLocaleDateString('fr-FR')}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ background:'#FEE2E2', color:C.red, padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>{jours} jour{jours>1?'s':''}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modals}
    </div>
  );
}
