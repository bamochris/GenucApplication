// src/pages/VerifierAttestation.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import './Dashboard.css';

export default function VerifierAttestation() {
  const { uuid: uuidParam } = useParams();
  const [uuid, setUuid] = useState(uuidParam || '');
  const [resultat, setResultat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const verifierCode = useCallback(async (code) => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setResultat(null);
    try {
      const res = await api.get(`/api/attestations/verifier/${code.trim()}`);
      setResultat(res.data);
    } catch (err) {
      setError('Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  }, []);

  // Vérification automatique si l'UUID arrive via l'URL (scan du QR code)
  useEffect(() => {
    if (uuidParam) verifierCode(uuidParam);
  }, [uuidParam, verifierCode]);

  const verifier = async (e) => {
    e.preventDefault();
    verifierCode(uuid);
  };

  return (
    <div className="page" style={{ maxWidth: 700, margin: '40px auto' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <h1 className="page-title">📜 Vérification d'attestation</h1>
        <p className="page-sub">Entrez le code unique figurant sur l'attestation</p>

        <form onSubmit={verifier} style={{ marginTop: 24 }}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Code de vérification (ex: a1b2c3d4-e5f6-...)"
              value={uuid}
              onChange={(e) => setUuid(e.target.value)}
              style={{ width: '100%', padding: '12px', fontSize: '14px' }}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Vérification...' : '🔍 Vérifier l\'authenticité'}
          </button>
        </form>

        {error && <div className="alert-erreur" style={{ marginTop: 24 }}>{error}</div>}

        {resultat && resultat.valide && (
          <div style={{ marginTop: 32, textAlign: 'left', borderTop: '1px solid var(--border-color)', paddingTop: 24 }}>
            <div className="alert-success" style={{ textAlign: 'center', marginBottom: 20 }}>
              ✓ Attestation authentique
            </div>
            <div className="detail-grid">
              <div><strong>N° Attestation :</strong> {resultat.numero}</div>
              <div><strong>Type :</strong> {resultat.type}</div>
              <div><strong>Étudiant :</strong> {resultat.etudiant}</div>
              <div><strong>Université :</strong> {resultat.universite}</div>
              <div><strong>Date émission :</strong> {resultat.dateEmission}</div>
            </div>

            {resultat.signeElectroniquement && (
              <div style={{
                marginTop: 20, padding: 16, borderRadius: 8,
                background: resultat.signatureRevoquee ? '#fdecea' : '#e8f5e9',
              }}>
                {resultat.signatureRevoquee ? (
                  <>
                    <strong>⚠️ Signature révoquée</strong>
                    <p style={{ margin: '6px 0 0' }}>{resultat.motifRevocation || 'Cette signature a été révoquée.'}</p>
                  </>
                ) : (
                  <>
                    <strong>🖋️ Signé électroniquement</strong>
                    <p style={{ margin: '6px 0 0' }}>
                      {resultat.signataire} — {resultat.signataireFonction}
                      {resultat.dateSignature && <><br />le {new Date(resultat.dateSignature).toLocaleString('fr-FR')}</>}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {resultat && !resultat.valide && (
          <div className="alert-erreur" style={{ marginTop: 24 }}>
            {resultat.message || 'Ce document n\'est pas reconnu comme une attestation GENUC valide.'}
          </div>
        )}
      </div>
    </div>
  );
}