// src/components/FileUploadPreview.jsx
// Champ de téléversement avec prévisualisation : vignette cliquable pour les
// images (agrandissement dans une visionneuse), bouton « Aperçu » pour les
// PDF (ouverture dans un nouvel onglet via une URL objet temporaire).
import { useEffect, useState } from 'react';

export default function FileUploadPreview({ label, name, accept, onFileChange, initialFile }) {
  const [file, setFile] = useState(initialFile || null);
  const [preview, setPreview] = useState(null);
  const [zoom, setZoom] = useState(false);

  // Régénère l'aperçu même quand le fichier vient du parent (brouillon).
  useEffect(() => {
    if (file && file.type?.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }, [file]);

  const handleChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (onFileChange) onFileChange(selectedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (onFileChange) onFileChange(null);
    const input = document.getElementById(`file-${name}`);
    if (input) input.value = '';
  };

  const ouvrirPdf = () => {
    const url = URL.createObjectURL(file);
    window.open(url, '_blank', 'noopener');
    // Laisse le temps à l'onglet de charger le blob avant de libérer l'URL.
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };

  const estPdf = file && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name || ''));

  return (
    <div className="form-group">
      <label>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          id={`file-${name}`}
          type="file"
          name={name}
          accept={accept}
          onChange={handleChange}
          style={{ flex: 1, minWidth: 0 }}
        />
        {file && (
          <button
            type="button"
            className="btn-danger"
            style={{ fontSize: '11px', padding: '4px 8px', flexShrink: 0 }}
            onClick={clearFile}
          >
            ✕ Supprimer
          </button>
        )}
      </div>

      {preview && (
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <img
            src={preview}
            alt={`Aperçu — ${label}`}
            title="Cliquer pour agrandir"
            onClick={() => setZoom(true)}
            style={{ maxWidth: '110px', maxHeight: '110px', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'zoom-in' }}
          />
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            📎 {file.name} ({Math.round(file.size / 1024)} Ko)
            <br />
            <button
              type="button"
              className="btn-outline"
              style={{ fontSize: '11px', padding: '3px 10px', marginTop: 4 }}
              onClick={() => setZoom(true)}
            >
              🔍 Prévisualiser
            </button>
          </div>
        </div>
      )}

      {file && !preview && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span>📎 {file.name} ({Math.round(file.size / 1024)} Ko)</span>
          {estPdf && (
            <button
              type="button"
              className="btn-outline"
              style={{ fontSize: '11px', padding: '3px 10px' }}
              onClick={ouvrirPdf}
            >
              👁️ Aperçu PDF
            </button>
          )}
        </div>
      )}

      {/* Visionneuse plein écran pour les images */}
      {zoom && preview && (
        <div
          onClick={() => setZoom(false)}
          role="presentation"
          style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, cursor: 'zoom-out',
          }}
        >
          <img
            src={preview}
            alt={`Aperçu agrandi — ${label}`}
            style={{ maxWidth: '92vw', maxHeight: '90vh', borderRadius: 8, boxShadow: '0 20px 80px rgba(0,0,0,0.5)' }}
          />
          <button
            type="button"
            onClick={() => setZoom(false)}
            aria-label="Fermer l'aperçu"
            style={{
              position: 'absolute', top: 18, right: 22,
              background: 'rgba(255,255,255,0.15)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.4)', borderRadius: '50%',
              width: 38, height: 38, fontSize: 17, cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
