// src/pages/professeur/ImportNotes.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function ImportNotes() {
  const { user } = useAuth();
  const [cours, setCours] = useState([]);
  const [selectedCours, setSelectedCours] = useState('');
  const [annee, setAnnee] = useState('2024-2025');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resultat, setResultat] = useState(null);

  useEffect(() => {
    api.get(`/api/cours/professeur/${user.id}`)
      .then(res => setCours(res.data))
      .catch(() => setError('Erreur chargement des cours'));
  }, [user.id]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      const ext = selected.name.split('.').pop().toLowerCase();
      if (!['xlsx', 'xls'].includes(ext)) {
        setError('Format non supporté. Utilisez .xlsx ou .xls');
        setFile(null);
        return;
      }
      setFile(selected);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCours || !file) {
      setError('Veuillez sélectionner un cours et un fichier');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    setResultat(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('coursId', selectedCours);
    formData.append('anneeAcademique', annee);
    formData.append('professeurId', user.id);

    try {
      const response = await api.post('/api/notes/import-export/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResultat(response.data);
      setMessage('✅ Import terminé !');
      setFile(null);
      // Réinitialiser l'input file
      document.getElementById('fileInput').value = '';
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de l\'import');
    } finally {
      setLoading(false);
    }
  };

  const telechargerModele = async () => {
    try {
      const response = await api.get('/api/notes/import-export/modele', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'modele_import_notes.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erreur lors du téléchargement du modèle');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📤 Importer des notes (Excel)</h1>
          <p className="page-sub">Chargez un fichier Excel pour importer les notes en lot</p>
        </div>
        <button className="btn-outline" onClick={telechargerModele}>
          📥 Télécharger le modèle
        </button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>Cours *</label>
            <select
              value={selectedCours}
              onChange={e => setSelectedCours(e.target.value)}
              required
            >
              <option value="">-- Sélectionner un cours --</option>
              {cours.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.titre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Année académique *</label>
            <input
              type="text"
              value={annee}
              onChange={e => setAnnee(e.target.value)}
              required
              placeholder="Ex: 2024-2025"
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
            <label>Fichier Excel (.xlsx ou .xls) *</label>
            <input
              id="fileInput"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              required
            />
            {file && (
              <div style={{ fontSize: 12, color: '#185FA5', marginTop: 4 }}>
                📎 {file.name} ({Math.round(file.size / 1024)} Ko)
              </div>
            )}
          </div>

          <div style={{ gridColumn: '1 / span 2', padding: '12px', background: 'rgba(24,95,165,0.12)', borderRadius: 8, fontSize: 12 }}>
            <strong>📋 Format attendu :</strong><br />
            • Colonnes : MATRICULE, NOTE_TP, NOTE_INTERRO, NOTE_EXAMEN, APPRECIATION<br />
            • Seul le MATRICULE est obligatoire, les notes sont optionnelles<br />
            • Le matricule doit correspondre exactement à celui du système
          </div>

          <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }} disabled={loading}>
            {loading ? '⏳ Import en cours...' : '📤 Importer les notes'}
          </button>
        </form>
      </div>

      {resultat && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 className="card-title">📊 Résultat de l'import</h2>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--color-success-text)' }}>{resultat.ligneImportees}</div>
              <div className="stat-label">Importées</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--color-danger-text)' }}>{resultat.erreurs}</div>
              <div className="stat-label">Erreurs</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{resultat.totalLignes}</div>
              <div className="stat-label">Total lignes traitées</div>
            </div>
          </div>

          {resultat.erreursMessages?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 600, color: 'var(--color-danger-text)', marginBottom: 8 }}>❌ Détail des erreurs :</div>
              <ul style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {resultat.erreursMessages.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {resultat.resultats?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>✅ Détail des notes importées :</div>
              <table className="data-table" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>Matricule</th>
                    <th>Étudiant</th>
                    <th>Note</th>
                    <th>Mention</th>
                  </tr>
                </thead>
                <tbody>
                  {resultat.resultats.slice(0, 20).map((r, idx) => (
                    <tr key={idx}>
                      <td>{r.matricule}</td>
                      <td>{r.nom}</td>
                      <td>{r.noteFinale}</td>
                      <td>{r.mention}</td>
                    </tr>
                  ))}
                  {resultat.resultats.length > 20 && (
                    <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      ... et {resultat.resultats.length - 20} autres
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}