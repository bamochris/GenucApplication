// src/pages/etudiant/CompleterDossier.jsx
// Portail restreint : seule action disponible à l'étudiant tant que le
// secrétariat attend des documents complémentaires (statut DOCUMENTS_MANQUANTS).
import { useState } from 'react';
import api from '../../api/axios';

const DOC_LABELS = {
  urlPhoto: "Pièce d'identité (électeur/passeport)",
  urlPhotoPasseport: 'Photo passeport',
  urlDiplomeEtat: "Diplôme d'État",
  urlAttestationReussite: 'Attestation de réussite',
  urlReleveNotes: 'Relevé des notes / bulletin',
  urlActeNaissance: 'Acte de naissance',
  urlAttestationNationalite: 'Attestation de nationalité',
  urlCarteIdentite: "Carte d'identité nationale (optionnel)",
  urlLettreRecommandation: 'Lettre de recommandation',
  urlAttestationPhysique: "Attestation d'aptitude physique",
  urlAttestationConduite: 'Attestation de bonne conduite',
};

// Clé du champ (backend) → nom de la partie multipart attendue.
const PART_NAME = {
  urlPhoto: 'photoIdentite',
  urlPhotoPasseport: 'photoPasseport',
  urlDiplomeEtat: 'diplomeEtat',
  urlAttestationReussite: 'attestationReussite',
  urlReleveNotes: 'relevePoints',
  urlActeNaissance: 'acteNaissance',
  urlAttestationNationalite: 'attestationNationalite',
  urlCarteIdentite: 'carteIdentite',
  urlLettreRecommandation: 'lettreRecommandation',
  urlAttestationPhysique: 'attestationPhysique',
  urlAttestationConduite: 'attestationConduite',
};

export default function CompleterDossier({ dossier, onLogout, onDone }) {
  const requis = (dossier?.documentsDemandes || '').split(',').map(s => s.trim()).filter(Boolean);
  const fournis = dossier?.documentsFournis || {};
  const [files, setFiles] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const aTraiter = requis.length ? requis : Object.keys(DOC_LABELS);

  const submit = async () => {
    const aEnvoyer = Object.entries(files).filter(([, f]) => f);
    if (aEnvoyer.length === 0) { setError('Veuillez sélectionner au moins un document.'); return; }
    setSubmitting(true); setError('');
    try {
      const fd = new FormData();
      aEnvoyer.forEach(([key, f]) => fd.append(PART_NAME[key] || key, f));
      await api.post('/api/etudiant/mon-dossier/documents', fd, { timeout: 60000 });
      setDone(true);
      if (onDone) onDone();
    } catch (e) {
      setError(e.response?.data?.erreur || e.message || "Échec de l'envoi des documents.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg-secondary, #f1f5f9)' }}>
      <div style={{ maxWidth: 620, width: '100%', background: 'var(--bg-card, #fff)', borderRadius: 16, padding: '32px 28px', boxShadow: '0 10px 40px rgba(0,0,0,0.10)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ color: '#185FA5', margin: 0, fontSize: 20 }}>Compléter mon dossier</h2>
          <button onClick={onLogout} style={{ background: 'none', border: '1px solid var(--border-color, #cbd5e1)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>Déconnexion</button>
        </div>
        <p style={{ color: 'var(--text-muted, #64748b)', fontSize: 14, marginTop: 0 }}>
          Bonjour {dossier?.prenom} {dossier?.nom} — dossier <strong>{dossier?.numeroDossier}</strong>.
        </p>

        {done ? (
          <div style={{ background: 'rgba(29,158,117,0.12)', border: '1px solid #86efac', borderRadius: 12, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 40 }}>✅</div>
            <h3 style={{ color: '#1D9E75', margin: '8px 0' }}>Documents envoyés !</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary, #475569)' }}>
              Votre dossier est de nouveau en cours d'examen par le secrétariat. Dès sa validation, vous accéderez à votre portail complet et recevrez votre lettre d'acceptation.
            </p>
          </div>
        ) : (
          <>
            {dossier?.messageSecretaire && (
              <div style={{ background: 'rgba(24,95,165,0.10)', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 16px', margin: '12px 0', fontSize: 13, color: '#185FA5' }}>
                💬 {dossier.messageSecretaire}
              </div>
            )}
            <div style={{ background: 'rgba(192,122,43,0.12)', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 16px', margin: '12px 0 20px', fontSize: 13, color: '#92600a' }}>
              Le secrétariat demande les documents suivants pour valider votre inscription :
            </div>

            {aTraiter.map(key => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  {DOC_LABELS[key] || key}
                  {fournis[key] && <span style={{ color: '#16a34a', fontSize: 11 }}> (déjà fourni — remplaçable)</span>}
                </label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setFiles(prev => ({ ...prev, [key]: e.target.files[0] }))} />
              </div>
            ))}

            {error && <div style={{ background: 'rgba(220,53,69,0.10)', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, margin: '10px 0' }}>{error}</div>}

            <button onClick={submit} disabled={submitting}
              style={{ width: '100%', padding: 12, marginTop: 8, background: '#185FA5', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? '⏳ Envoi...' : '📤 Envoyer les documents'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
