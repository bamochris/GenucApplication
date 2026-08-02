// src/components/SignatureBanner.jsx
// Bandeau global du flux de signature électronique :
//  - invite le responsable à déposer sa signature tant qu'elle manque ;
//  - signale les demandes de signature en attente de validation.
// Monté dans AppLayout : visible sur toutes les pages privées.
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FaSignature, FaTimes, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import './SignatureBanner.css';

export default function SignatureBanner() {
  const { user } = useAuth();
  const [statut, setStatut] = useState(null);      // réponse de /ma-signature
  const [modalOuvert, setModalOuvert] = useState(false);
  const [apercu, setApercu] = useState(null);      // dataURL de l'image choisie
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState(null);
  const [masque, setMasque] = useState(false);     // fermeture temporaire (session)
  const fileRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    api.get('/api/signature/ma-signature')
      .then((res) => setStatut(res.data))
      .catch(() => setStatut(null));
  }, [user]);

  if (!user || !statut || !statut.estSignataire || masque) return null;

  const doitDeposer = !statut.aSignature;
  const enAttente = statut.demandesEnAttente || 0;
  if (!doitDeposer && enAttente === 0) return null;

  const choisirFichier = (e) => {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    const lecteur = new FileReader();
    lecteur.onload = () => setApercu(lecteur.result);
    lecteur.readAsDataURL(fichier);
  };

  const enregistrer = async () => {
    if (!apercu) return;
    setEnvoi(true);
    setMessage(null);
    try {
      await api.post('/api/signature/ma-signature', { signatureImage: apercu });
      setMessage({ type: 'ok', texte: 'Signature enregistrée. Elle sera apposée sur les documents que vous validerez.' });
      setStatut((s) => ({ ...s, aSignature: true }));
      setTimeout(() => setModalOuvert(false), 1600);
    } catch (err) {
      setMessage({ type: 'err', texte: err.response?.data?.erreur || 'Échec de l\'enregistrement.' });
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <>
      <div className={`sig-banner ${doitDeposer ? 'sig-banner-warn' : 'sig-banner-info'}`}>
        <FaSignature className="sig-banner-icon" />
        <div className="sig-banner-texte">
          {doitDeposer ? (
            <>
              <strong>Ajoutez votre signature électronique.</strong>{' '}
              En tant que {statut.fonction || 'responsable'}, votre signature est requise
              pour émettre les documents officiels.
            </>
          ) : (
            <>
              <strong>{enAttente} demande{enAttente > 1 ? 's' : ''} de signature</strong>{' '}
              attend{enAttente > 1 ? 'ent' : ''} votre validation.
            </>
          )}
        </div>
        {doitDeposer ? (
          <button type="button" className="sig-banner-action" onClick={() => setModalOuvert(true)}>
            Ajouter ma signature
          </button>
        ) : (
          <Link to="/signature/demandes" className="sig-banner-action">
            Voir les demandes
          </Link>
        )}
        <button type="button" className="sig-banner-fermer" onClick={() => setMasque(true)}
                aria-label="Masquer ce message">
          <FaTimes />
        </button>
      </div>

      {modalOuvert && (
        <div className="sig-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setModalOuvert(false); }}>
          <div className="sig-modal" role="dialog" aria-modal="true" aria-label="Ajouter ma signature électronique">
            <h3><FaSignature /> Ma signature électronique</h3>
            <p>
              Importez une image de votre signature (PNG de préférence, fond transparent).
              Elle sera enregistrée dans le registre des signataires de votre université
              et apposée sur les documents que vous validerez.
            </p>

            {message && (
              <div className={`sig-flash ${message.type === 'ok' ? 'sig-flash-ok' : 'sig-flash-err'}`}>
                {message.type === 'ok' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                <span>{message.texte}</span>
              </div>
            )}

            <div className="sig-zone-apercu" onClick={() => fileRef.current?.click()}>
              {apercu
                ? <img src={apercu} alt="Aperçu de la signature" />
                : <span>Cliquez pour choisir l'image de votre signature</span>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={choisirFichier} />

            <div className="sig-modal-actions">
              <button type="button" className="sig-btn-ghost" onClick={() => setModalOuvert(false)}>
                Annuler
              </button>
              <button type="button" className="sig-btn-primary" onClick={enregistrer}
                      disabled={!apercu || envoi}>
                {envoi ? 'Enregistrement…' : 'Enregistrer ma signature'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
