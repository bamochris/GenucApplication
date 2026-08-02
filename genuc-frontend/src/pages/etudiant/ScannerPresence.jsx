import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import presenceService from '../../services/presenceService';
import { FaQrcode, FaCheckCircle, FaTimesCircle, FaHistory, FaClock, FaCamera } from 'react-icons/fa';

const C = { navy:'#0B1F4A', blue:'#185FA5', green:'#1D9E75', orange:'#C07A2B', red:'#B91C1C' };

let QrReader;
try { QrReader = require('react-qr-reader').default; } catch {}

export default function ScannerPresence() {
  const { user } = useAuth();
  const [result, setResult]     = useState('');
  const [status, setStatus]     = useState(null); // 'success' | 'error' | 'scanning'
  const [message, setMessage]   = useState('');
  const [scanning, setScanning] = useState(false);
  const [historique, setHistorique] = useState([]);
  const [manualCode, setManualCode] = useState('');
  const [inputMode, setInputMode]   = useState('camera'); // 'camera' | 'manual'

  const reset = () => { setStatus(null); setMessage(''); setResult(''); };

  const processQR = async (data) => {
    if (!data || status === 'success') return;
    setResult(data);
    setStatus('scanning');
    // Format émis par le backend : GENUC:PRESENCE:<coursId>:<seanceId>:<uuid>
    // (tolérance pour l'ancien format GENUC|COURS=123|...)
    const match = data.match(/^GENUC:PRESENCE:(\d+):/) || data.match(/COURS=(\d+)/);
    if (!match?.[1]) {
      setStatus('error'); setMessage('QR code invalide — ce code ne correspond pas à un cours GENUC.'); return;
    }
    const coursId = parseInt(match[1]);
    if (!user?.inscriptionId) {
      setStatus('error'); setMessage("Impossible d'identifier votre compte étudiant."); return;
    }
    try {
      await presenceService.scanner(data);
      setStatus('success');
      setMessage('Présence enregistrée avec succès !');
      setHistorique(h => [{ coursId, heure: new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}), date: new Date().toLocaleDateString('fr-FR'), code: data }, ...h.slice(0,4)]);
      setScanning(false);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.erreur || err.response?.data?.message || "Erreur lors de l'enregistrement de la présence.");
    }
  };

  const handleManual = () => {
    if (!manualCode.trim()) return;
    processQR(manualCode.trim());
    setManualCode('');
  };

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',sans-serif", padding:'24px 20px', maxWidth:700, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ color:'var(--text-primary)', fontSize:24, fontWeight:900, margin:0, display:'flex', alignItems:'center', gap:10 }}>
          <FaQrcode style={{ color:C.blue }} /> Scanner ma présence
        </h1>
        <p style={{ color:'var(--text-muted)', fontSize:14, margin:'6px 0 0' }}>
          Scannez le QR code affiché par votre professeur pour enregistrer votre présence
        </p>
      </div>

      {/* Sélecteur de mode */}
      <div style={{ display:'flex', gap:4, background:'#f0f4fa', borderRadius:12, padding:4, marginBottom:24, width:'fit-content' }}>
        {[['camera','📷 Caméra'],['manual','⌨️ Saisie manuelle']].map(([mode,label]) => (
          <button key={mode} onClick={() => { setInputMode(mode); reset(); setScanning(false); }}
            style={{ padding:'8px 18px', borderRadius:9, border:'none', background:inputMode===mode?'white':'transparent', color:inputMode===mode?C.navy:'#888', fontWeight:inputMode===mode?700:500, fontSize:13, cursor:'pointer', boxShadow:inputMode===mode?'0 1px 6px rgba(0,0,0,0.08)':'none', transition:'all 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Zone principale */}
      <div style={{ background:'var(--bg-card)', borderRadius:20, boxShadow:'0 4px 20px rgba(0,0,0,0.08)', overflow:'hidden', marginBottom:20 }}>

        {/* État success */}
        {status === 'success' && (
          <div style={{ padding:48, textAlign:'center' }}>
            <div style={{ width:80, height:80, borderRadius:'50%', background:'#E8F8F2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <FaCheckCircle style={{ fontSize:40, color:C.green }} />
            </div>
            <h2 style={{ color:C.green, fontWeight:900, fontSize:22, margin:'0 0 8px' }}>Présence enregistrée !</h2>
            <p style={{ color:'var(--text-muted)', fontSize:15, margin:'0 0 24px', lineHeight:1.6 }}>{message}</p>
            <div style={{ padding:'12px 20px', background:'#f8f9fb', borderRadius:12, marginBottom:24, fontSize:13, color:'var(--text-muted)', fontFamily:'monospace', wordBreak:'break-all' }}>
              {result}
            </div>
            <button onClick={() => { reset(); setScanning(false); }}
              style={{ padding:'12px 28px', background:C.blue, color:'white', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}>
              Scanner un autre cours
            </button>
          </div>
        )}

        {/* État erreur */}
        {status === 'error' && (
          <div style={{ padding:48, textAlign:'center' }}>
            <div style={{ width:80, height:80, borderRadius:'50%', background:'#FEE2E2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <FaTimesCircle style={{ fontSize:40, color:C.red }} />
            </div>
            <h2 style={{ color:C.red, fontWeight:900, fontSize:20, margin:'0 0 8px' }}>Échec de l'enregistrement</h2>
            <p style={{ color:'var(--text-muted)', fontSize:14, margin:'0 0 24px', lineHeight:1.6 }}>{message}</p>
            <button onClick={() => { reset(); }}
              style={{ padding:'12px 28px', background:C.orange, color:'white', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}>
              Réessayer
            </button>
          </div>
        )}

        {/* État scanning */}
        {status === 'scanning' && (
          <div style={{ padding:48, textAlign:'center' }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ width:60, height:60, border:`5px solid ${C.blue}30`, borderTopColor:C.blue, borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 20px' }} />
            <p style={{ color:'var(--text-primary)', fontWeight:700, fontSize:16 }}>Enregistrement en cours...</p>
          </div>
        )}

        {/* Mode caméra (idle) */}
        {!status && inputMode === 'camera' && (
          <div>
            {!scanning ? (
              <div style={{ padding:48, textAlign:'center' }}>
                <div style={{ width:100, height:100, borderRadius:20, background:'#EBF4FF', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px' }}>
                  <FaQrcode style={{ fontSize:52, color:C.blue }} />
                </div>
                <h3 style={{ color:'var(--text-primary)', fontWeight:800, fontSize:18, margin:'0 0 8px' }}>Prêt à scanner</h3>
                <p style={{ color:'var(--text-muted)', fontSize:14, margin:'0 0 28px', lineHeight:1.6 }}>
                  Cliquez sur le bouton pour activer la caméra et scanner le QR code de votre professeur
                </p>
                <button onClick={() => setScanning(true)}
                  style={{ padding:'14px 36px', background:`linear-gradient(135deg,${C.blue},${C.navy})`, color:'white', border:'none', borderRadius:14, fontSize:15, fontWeight:800, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:10, boxShadow:`0 6px 20px ${C.blue}40` }}>
                  <FaCamera /> Activer la caméra
                </button>
              </div>
            ) : (
              <div>
                <div style={{ position:'relative' }}>
                  {QrReader ? (
                    <QrReader delay={300} onError={err => { setStatus('error'); setMessage("Erreur d'accès à la caméra. Vérifiez les permissions."); setScanning(false); }} onScan={processQR} style={{ width:'100%' }} />
                  ) : (
                    <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>
                      <FaCamera style={{ fontSize:40, marginBottom:12 }} />
                      <p>Module caméra non disponible dans cet environnement.</p>
                      <p style={{ fontSize:12 }}>Utilisez le mode saisie manuelle.</p>
                    </div>
                  )}
                  {/* Overlay */}
                  <div style={{ position:'absolute', inset:0, pointerEvents:'none', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ width:200, height:200, border:'3px solid #fff', borderRadius:16, boxShadow:'0 0 0 9999px rgba(0,0,0,0.4)' }} />
                  </div>
                </div>
                <div style={{ padding:'16px 20px', background:'#f8f9fb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:13, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:C.green, display:'inline-block', animation:'pulse 1.5s infinite' }} />
                    Scanner en cours...
                  </span>
                  <button onClick={() => setScanning(false)}
                    style={{ padding:'6px 14px', background:C.red, color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    Arrêter
                  </button>
                </div>
                <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
              </div>
            )}
          </div>
        )}

        {/* Mode saisie manuelle (idle) */}
        {!status && inputMode === 'manual' && (
          <div style={{ padding:36 }}>
            <div style={{ marginBottom:20, textAlign:'center' }}>
              <div style={{ width:70, height:70, borderRadius:16, background:'#EDE9FE', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <FaQrcode style={{ fontSize:34, color:'#6B21A8' }} />
              </div>
              <h3 style={{ color:'var(--text-primary)', fontWeight:800, fontSize:17, margin:'0 0 6px' }}>Saisie du code QR</h3>
              <p style={{ color:'var(--text-muted)', fontSize:13, margin:0 }}>Entrez le contenu du QR code si votre caméra ne fonctionne pas</p>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'var(--text-muted)', marginBottom:6 }}>Code QR (format : GENUC:PRESENCE:123:...)</label>
              <textarea value={manualCode} onChange={e => setManualCode(e.target.value)}
                placeholder="Collez ici le contenu du QR code..."
                rows={3}
                style={{ width:'100%', padding:'12px', border:'1.5px solid var(--border-color)', borderRadius:10, fontSize:13, outline:'none', resize:'none', boxSizing:'border-box', fontFamily:'monospace' }} />
            </div>
            <button onClick={handleManual} disabled={!manualCode.trim()}
              style={{ width:'100%', padding:'13px', background:C.blue, color:'white', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', opacity:!manualCode.trim()?0.5:1 }}>
              Enregistrer ma présence
            </button>
          </div>
        )}
      </div>

      {/* Historique */}
      {historique.length > 0 && (
        <div style={{ background:'var(--bg-card)', borderRadius:16, padding:22, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight:800, color:'var(--text-primary)', fontSize:15, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
            <FaHistory style={{ color:C.blue }} /> Présences récentes (cette session)
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {historique.map((h, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'#E8F8F2', borderRadius:12 }}>
                <FaCheckCircle style={{ color:C.green, fontSize:16, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>Cours #{h.coursId}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>Enregistré le {h.date}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:13, color:C.green, fontWeight:700 }}>
                  <FaClock style={{ fontSize:11 }} /> {h.heure}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aide */}
      <div style={{ marginTop:20, padding:'16px 20px', background:'#F0F4FF', borderRadius:14, border:'1px solid #C7D9F5' }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.blue, marginBottom:6 }}>Comment ça marche ?</div>
        <ol style={{ margin:0, padding:'0 0 0 18px', fontSize:13, color:'#555', lineHeight:2 }}>
          <li>Le professeur affiche un QR code unique au début du cours</li>
          <li>Activez la caméra et pointez-la vers le QR code</li>
          <li>Votre présence est enregistrée automatiquement en quelques secondes</li>
        </ol>
      </div>
    </div>
  );
}
