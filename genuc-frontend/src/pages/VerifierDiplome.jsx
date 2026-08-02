import { useState } from 'react';
import api from '../api/axios';
import './Dashboard.css';

export default function VerifierDiplome() {
  const [uuid, setUuid] = useState('');
  const [resultat, setResultat] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  const verifier = async (e) => {
    e.preventDefault();
    if (!uuid.trim()) return;
    setChargement(true);
    setErreur('');
    setResultat(null);
    try {
      const response = await api.get(`/api/verifier/${uuid.trim()}`);
      setResultat(response.data);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Diplôme introuvable ou code invalide.');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 700, margin: '40px auto' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <h1 className="page-title">🎓 Vérification de diplôme</h1>
        <p className="page-sub">Entrez le code unique figurant sur le diplôme ou dans le QR code</p>

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
          <button type="submit" className="btn-primary" disabled={chargement}>
            {chargement ? 'Vérification...' : '🔍 Vérifier l\'authenticité'}
          </button>
        </form>

        {erreur && <div className="alert-erreur" style={{ marginTop: 24 }}>{erreur}</div>}

        {resultat && resultat.valide && (
          <div style={{ marginTop: 32, textAlign: 'left', borderTop: '1px solid var(--border-color)', paddingTop: 24 }}>
            <div className="alert-success" style={{ textAlign: 'center', marginBottom: 20 }}>
              ✓ Diplôme authentique et certifié par GENUC
            </div>
            <div className="detail-grid">
              <div><strong>Titulaire :</strong> {resultat.titulaire}</div>
              <div><strong>Université :</strong> {resultat.universite}</div>
              <div><strong>Département :</strong> {resultat.departement}</div>
              <div><strong>Niveau :</strong> {resultat.niveau}</div>
              <div><strong>Mention :</strong> {resultat.mention}</div>
              <div><strong>Moyenne :</strong> {resultat.moyenneGenerale}/20</div>
              <div><strong>Date d'obtention :</strong> {new Date(resultat.dateObtention).toLocaleDateString('fr-FR')}</div>
              <div><strong>Code diplôme :</strong> {resultat.codeDiplome}</div>
            </div>
          </div>
        )}

        {resultat && !resultat.valide && (
          <div className="alert-erreur" style={{ marginTop: 24 }}>
            {resultat.message || 'Ce document n\'est pas reconnu comme un diplôme GENUC valide.'}
          </div>
        )}
      </div>
    </div>
  );
}