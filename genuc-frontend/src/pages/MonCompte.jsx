// src/pages/MonCompte.jsx
// Page « Mon compte » commune à TOUS les rôles : identité du compte,
// photo de profil (affichée dans l'entête des portails) et photo passeport
// (utilisée par les services administratifs pour l'identification).
import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import usePhotosIdentite, { urlPhoto } from '../hooks/usePhotosIdentite';
import './Dashboard.css';

function CartePhoto({ titre, description, type, cheminActuel, rond, onMaj }) {
  const inputRef = useRef(null);
  const [apercu, setApercu] = useState(null);
  const [fichier, setFichier] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [ok, setOk] = useState('');

  const choisir = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { setErreur('Choisissez une image (JPG ou PNG).'); return; }
    if (f.size > 5 * 1024 * 1024) { setErreur('Image trop lourde (5 Mo maximum).'); return; }
    setErreur(''); setOk('');
    setFichier(f);
    setApercu(URL.createObjectURL(f));
  };

  const televerser = async () => {
    if (!fichier) return;
    setEnvoi(true); setErreur(''); setOk('');
    try {
      const fd = new FormData();
      fd.append('fichier', fichier);
      await api.post(`/api/auth/photo?type=${type}`, fd);
      setOk('✅ Photo enregistrée.');
      setFichier(null); setApercu(null);
      window.dispatchEvent(new Event('photos-maj'));
      onMaj?.();
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Échec du téléversement.');
    } finally {
      setEnvoi(false);
    }
  };

  const image = apercu || urlPhoto(cheminActuel);
  const dimensions = rond
    ? { width: 130, height: 130, borderRadius: '50%' }
    : { width: 130, height: 165, borderRadius: 10 };

  return (
    <div className="card" style={{ flex: 1, minWidth: 280 }}>
      <h3 className="card-title">{titre}</h3>
      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '4px 0 14px' }}>{description}</p>
      {erreur && <div className="alert-erreur" onClick={() => setErreur('')}>{erreur}</div>}
      {ok && <div className="alert-success" onClick={() => setOk('')}>{ok}</div>}

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{
          ...dimensions, flexShrink: 0, overflow: 'hidden',
          border: '2px solid var(--border-color)', background: 'var(--bg-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {image ? (
            <img key={image} src={image} alt={titre}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 40, opacity: 0.4 }}>{rond ? '👤' : '🪪'}</span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png" hidden onChange={choisir} />
          <button type="button" className="btn-outline" onClick={() => inputRef.current?.click()}>
            📁 1. Choisir une image
          </button>
          <button
            type="button"
            onClick={televerser}
            disabled={!fichier || envoi}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '11px 20px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 700,
              cursor: (!fichier || envoi) ? 'not-allowed' : 'pointer',
              background: (!fichier || envoi) ? 'var(--border-color)' : 'linear-gradient(135deg, #1D9E75, #0F6E56)',
              color: (!fichier || envoi) ? 'var(--text-muted)' : '#fff',
              boxShadow: (!fichier || envoi) ? 'none' : '0 4px 14px rgba(29,158,117,0.4)',
            }}
          >
            {envoi ? '⏳ Enregistrement…' : '💾 2. Enregistrer la photo'}
          </button>
          {fichier
            ? <small style={{ color: 'var(--text-muted)' }}>📎 {fichier.name} — cliquez sur « Enregistrer »</small>
            : <small style={{ color: 'var(--text-muted)' }}>Choisissez d'abord une image, puis enregistrez.</small>}
        </div>
      </div>
    </div>
  );
}

export default function MonCompte() {
  const { user } = useAuth();
  const photos = usePhotosIdentite(!!user);

  if (!user) return null;
  const nomAffiche = user.nomComplet || `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">👤 Mon compte</h1>
          <p className="page-sub">Identité du compte et photos d'identification</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h3 className="card-title">🪪 Identité</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>NOM COMPLET</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{nomAffiche}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>EMAIL</div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{user.email || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>RÔLE</div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{user.role}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <CartePhoto
          titre="📸 Photo de profil"
          description="Affichée dans l'entête de votre portail et à côté de votre nom."
          type="profil"
          rond
          cheminActuel={photos.photoProfil}
        />
        <CartePhoto
          titre="🛂 Photo passeport"
          description="Photo d'identité officielle (format passeport, fond clair) : elle sert aux services administratifs de l'université pour vous identifier."
          type="passeport"
          cheminActuel={photos.photoPasseport}
        />
      </div>
    </div>
  );
}
