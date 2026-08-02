// src/pages/MotDePasseOublie.jsx
// Récupération de mot de passe par matricule : l'étudiant saisit son
// matricule et une adresse email de contact. Si le compte possède déjà un
// email, le mot de passe temporaire part vers CET email (aucun détournement
// possible) ; sinon l'adresse fournie est rattachée au compte. La réponse
// est toujours identique — aucune fuite sur l'existence du matricule.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function MotDePasseOublie() {
  const [matricule, setMatricule] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoye, setEnvoye] = useState(false);
  const [chargement, setChargement] = useState(false);

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur(''); setMessage('');
    if (!matricule.trim()) { setErreur('Saisissez votre matricule.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErreur('Saisissez une adresse email valide pour recevoir le mot de passe temporaire.');
      return;
    }
    setChargement(true);
    try {
      const res = await api.post('/api/auth/mot-de-passe-oublie', {
        matricule: matricule.trim(),
        email: email.trim(),
      });
      setMessage(res.data?.message
        || 'Si ce matricule correspond à un compte, un mot de passe temporaire a été envoyé.');
      setEnvoye(true);
    } catch {
      // Même message : ne jamais révéler si le matricule existe
      setMessage('Si ce matricule correspond à un compte, un mot de passe temporaire a été envoyé.');
      setEnvoye(true);
    } finally {
      setChargement(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div className="card" style={{ width: 'min(440px, 100%)', padding: '30px 28px' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{
            width: 58, height: 58, margin: '0 auto 12px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #185FA5, #0B1F4A)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>🔑</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Mot de passe oublié
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
            Saisissez votre <strong>matricule</strong> et une <strong>adresse email</strong> :
            un mot de passe temporaire vous sera envoyé pour vous reconnecter.
          </p>
        </div>

        {message && <div className="alert-success" style={{ marginBottom: 14 }}>{message}</div>}
        {erreur && <div className="alert-erreur" style={{ marginBottom: 14 }} onClick={() => setErreur('')}>{erreur}</div>}

        {!envoye ? (
          <form onSubmit={soumettre}>
            <div className="form-group">
              <label>🎓 Matricule</label>
              <input
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                placeholder="Ex : HEC-2024-001"
                autoFocus
                required
              />
            </div>
            <div className="form-group">
              <label>📧 Adresse email de contact</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@exemple.cd"
                required
              />
              <small style={{ color: 'var(--text-muted)' }}>
                Si votre compte a déjà une adresse email, le mot de passe temporaire sera
                envoyé à cette adresse-là (sécurité).
              </small>
            </div>
            <button type="submit" className="btn-primary" disabled={chargement}
              style={{ width: '100%', marginTop: 6 }}>
              {chargement ? '⏳ Envoi…' : '📨 Réinitialiser mon mot de passe'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Vérifiez votre boîte de réception (et vos indésirables), puis connectez-vous
            avec votre matricule et le mot de passe temporaire. Pensez à le changer ensuite
            depuis <strong>Paramètres → Sécurité</strong>.
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <Link to="/login" style={{ fontSize: 13, color: '#185FA5', fontWeight: 600 }}>
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
