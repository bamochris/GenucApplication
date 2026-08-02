// src/pages/VerifierAdmission.jsx
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import './Dashboard.css';

export default function VerifierAdmission() {
  const [searchParams] = useSearchParams();
  const [numeroDossier, setNumeroDossier] = useState(searchParams.get('numeroDossier') || '');
  const [matricule, setMatricule] = useState(searchParams.get('matricule') || '');
  const [universiteCode, setUniversiteCode] = useState(searchParams.get('universiteCode') || '');
  const [resultat, setResultat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const verifierCode = useCallback(async (dossier, mat, uniCode) => {
    if (!dossier.trim() || !mat.trim() || !uniCode.trim()) return;
    setLoading(true);
    setError('');
    setResultat(null);
    try {
      const res = await api.get('/api/public/admission/verifier', {
        params: { numeroDossier: dossier.trim(), matricule: mat.trim(), universiteCode: uniCode.trim() },
      });
      setResultat(res.data);
    } catch (err) {
      setError(err.response?.data?.erreur || 'Document introuvable ou informations invalides');
    } finally {
      setLoading(false);
    }
  }, []);

  // Vérification automatique si les paramètres arrivent via l'URL (scan du QR code)
  useEffect(() => {
    if (numeroDossier && matricule && universiteCode) {
      verifierCode(numeroDossier, matricule, universiteCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifier = (e) => {
    e.preventDefault();
    verifierCode(numeroDossier, matricule, universiteCode);
  };

  return (
    <div className="page" style={{ maxWidth: 700, margin: '40px auto' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <h1 className="page-title">🎓 Vérification de lettre d'admission</h1>
        <p className="page-sub">Entrez le n° de dossier, le matricule et le code de l'université figurant sur la lettre</p>

        <form onSubmit={verifier} style={{ marginTop: 24, textAlign: 'left' }}>
          <div className="form-group">
            <label>N° de dossier</label>
            <input
              type="text"
              placeholder="ex: HADOS-2026-000001"
              value={numeroDossier}
              onChange={(e) => setNumeroDossier(e.target.value)}
              style={{ width: '100%', padding: '12px', fontSize: '14px' }}
              required
            />
          </div>
          <div className="form-group">
            <label>Matricule</label>
            <input
              type="text"
              placeholder="ex: UNIKIN202500001"
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              style={{ width: '100%', padding: '12px', fontSize: '14px' }}
              required
            />
          </div>
          <div className="form-group">
            <label>Code de l'université</label>
            <input
              type="text"
              placeholder="ex: UNIKIN"
              value={universiteCode}
              onChange={(e) => setUniversiteCode(e.target.value)}
              style={{ width: '100%', padding: '12px', fontSize: '14px' }}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Vérification...' : '🔍 Vérifier l\'authenticité'}
          </button>
        </form>

        {error && <div className="alert-erreur" style={{ marginTop: 24 }}>{error}</div>}

        {resultat && (
          <div style={{ marginTop: 32, textAlign: 'left', borderTop: '1px solid var(--border-color)', paddingTop: 24 }}>
            <div className="alert-success" style={{ textAlign: 'center', marginBottom: 20 }}>
              ✓ Admission validée — document authentique
            </div>
            <div className="detail-grid">
              <div><strong>Étudiant :</strong> {resultat.etudiant}</div>
              <div><strong>Matricule :</strong> {resultat.matricule}</div>
              <div><strong>N° Dossier :</strong> {resultat.numeroDossier}</div>
              <div><strong>Université :</strong> {resultat.universite} ({resultat.universiteCode})</div>
              <div><strong>Département :</strong> {resultat.departement}</div>
              <div><strong>Filière :</strong> {resultat.filiere}</div>
              <div><strong>Niveau :</strong> {resultat.niveau}</div>
              <div><strong>Année académique :</strong> {resultat.anneeAcademique}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
