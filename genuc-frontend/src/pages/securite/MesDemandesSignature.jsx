// src/pages/securite/MesDemandesSignature.jsx
// Demandes de signature adressées au responsable connecté : chaque demande
// couvre un document ou un lot. Valider appose sa signature électronique sur
// tous les documents du lot ; Refuser renvoie un motif au demandeur.
import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import {
  FaSignature, FaCheck, FaTimes, FaFileAlt, FaCheckCircle,
  FaExclamationTriangle, FaHourglassHalf,
} from 'react-icons/fa';
import './MesDemandesSignature.css';

const LIBELLES_TYPE = {
  ATTESTATION: 'Attestation',
  DIPLOME: 'Diplôme',
  LETTRE_ACCEPTATION: "Lettre d'acceptation",
  RELEVE_NOTES: 'Relevé de notes',
  BULLETIN: 'Bulletin',
};

export default function MesDemandesSignature() {
  const [demandes, setDemandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [traitement, setTraitement] = useState(null); // id en cours
  const [message, setMessage] = useState(null);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const res = await api.get('/api/signature/demandes/mes');
      setDemandes(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDemandes([]);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const valider = async (id) => {
    setTraitement(id);
    setMessage(null);
    try {
      const res = await api.post(`/api/signature/demandes/${id}/valider`);
      setMessage({ type: 'ok', texte: res.data?.message || 'Documents signés.' });
      charger();
    } catch (err) {
      setMessage({ type: 'err', texte: err.response?.data?.erreur || 'Échec de la validation.' });
    } finally {
      setTraitement(null);
    }
  };

  const refuser = async (id) => {
    const motif = window.prompt('Motif du refus (optionnel) :');
    if (motif === null) return; // annulé
    setTraitement(id);
    setMessage(null);
    try {
      await api.post(`/api/signature/demandes/${id}/refuser`, { motif });
      setMessage({ type: 'ok', texte: 'Demande refusée — le demandeur a été prévenu.' });
      charger();
    } catch (err) {
      setMessage({ type: 'err', texte: err.response?.data?.erreur || 'Échec du refus.' });
    } finally {
      setTraitement(null);
    }
  };

  const enAttente = demandes.filter((d) => d.statut === 'EN_ATTENTE');
  const traitees = demandes.filter((d) => d.statut !== 'EN_ATTENTE');

  return (
    <div className="mds-page">
      <header className="mds-header">
        <div className="mds-header-icon"><FaSignature /></div>
        <div>
          <h1>Demandes de signature</h1>
          <p>Validez un document ou un lot : votre signature électronique y sera apposée puis envoyée.</p>
        </div>
      </header>

      {message && (
        <div className={`mds-flash ${message.type === 'ok' ? 'mds-flash-ok' : 'mds-flash-err'}`}>
          {message.type === 'ok' ? <FaCheckCircle /> : <FaExclamationTriangle />}
          <span>{message.texte}</span>
        </div>
      )}

      {chargement ? (
        <div className="mds-vide">Chargement…</div>
      ) : (
        <>
          <h2 className="mds-sous-titre">
            <FaHourglassHalf /> En attente ({enAttente.length})
          </h2>
          {enAttente.length === 0 ? (
            <div className="mds-vide">Aucune demande en attente. ✓</div>
          ) : (
            <div className="mds-liste">
              {enAttente.map((d) => (
                <div key={d.id} className="mds-carte">
                  <div className="mds-carte-icone"><FaFileAlt /></div>
                  <div className="mds-carte-infos">
                    <div className="mds-carte-titre">
                      {LIBELLES_TYPE[d.typeDocument] || d.typeDocument}
                      <span className="mds-badge">{d.nbDocuments} document{d.nbDocuments > 1 ? 's' : ''}</span>
                    </div>
                    <div className="mds-carte-detail">
                      Demandé par {d.demandeParNom || '—'}
                      {d.commentaire && <> — « {d.commentaire} »</>}
                    </div>
                  </div>
                  <div className="mds-carte-actions">
                    <button
                      type="button"
                      className="mds-btn-valider"
                      onClick={() => valider(d.id)}
                      disabled={traitement === d.id}
                    >
                      <FaCheck /> {traitement === d.id ? 'Signature…' : 'Valider et signer'}
                    </button>
                    <button
                      type="button"
                      className="mds-btn-refuser"
                      onClick={() => refuser(d.id)}
                      disabled={traitement === d.id}
                    >
                      <FaTimes /> Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {traitees.length > 0 && (
            <>
              <h2 className="mds-sous-titre">Historique</h2>
              <div className="mds-liste">
                {traitees.map((d) => (
                  <div key={d.id} className="mds-carte mds-carte-traitee">
                    <div className="mds-carte-icone"><FaFileAlt /></div>
                    <div className="mds-carte-infos">
                      <div className="mds-carte-titre">
                        {LIBELLES_TYPE[d.typeDocument] || d.typeDocument}
                        <span className="mds-badge">{d.nbDocuments} doc{d.nbDocuments > 1 ? 's' : ''}</span>
                      </div>
                      <div className="mds-carte-detail">
                        {d.statut === 'VALIDEE' ? 'Signée' : `Refusée${d.motifRefus ? ` — ${d.motifRefus}` : ''}`}
                      </div>
                    </div>
                    <span className={`mds-statut mds-statut-${d.statut === 'VALIDEE' ? 'ok' : 'ko'}`}>
                      {d.statut === 'VALIDEE' ? 'Validée ✓' : 'Refusée'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
