import { useState } from 'react';
import presenceService from '../../services/presenceService';
import '../Dashboard.css';

export default function GenererQR() {
  const [coursId, setCoursId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [qrUrl, setQrUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!coursId) return;
    setLoading(true);
    setError(null);
    try {
      // Le backend attend un seanceId numérique optionnel, pas une date : on ne transmet
      // que le coursId (le QR est valable pour la séance du jour côté serveur).
      const response = await presenceService.genererQR(coursId);
      const url = URL.createObjectURL(response.data);
      setQrUrl(url);
    } catch (err) {
      setError("Erreur lors de la génération du QR code. Vérifiez l'identifiant du cours.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">📱 Générer QR code de présence</h1>
      {error && <div className="alert-erreur" onClick={() => setError(null)}>{error}</div>}
      <div className="card">
        <div className="form-group">
          <label>ID du cours</label>
          <input type="number" value={coursId} onChange={e => setCoursId(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Génération...' : 'Générer QR code'}
        </button>
        {qrUrl && (
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <img src={qrUrl} alt="QR code" style={{ width: 200, height: 200 }} />
            <br />
            <a href={qrUrl} download="qrcode.png" className="btn-outline">Télécharger</a>
          </div>
        )}
      </div>
    </div>
  );
}