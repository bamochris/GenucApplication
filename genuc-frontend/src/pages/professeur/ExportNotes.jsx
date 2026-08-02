// src/pages/professeur/ExportNotes.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function ExportNotes() {
  const { user } = useAuth();
  const [cours, setCours] = useState([]);
  const [selectedCours, setSelectedCours] = useState('');
  const [annee, setAnnee] = useState('2024-2025');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/cours/professeur/${user.id}`)
      .then(res => setCours(res.data))
      .catch(() => setError('Erreur chargement des cours'));
  }, [user.id]);

  const handleExport = async () => {
    if (!selectedCours) {
      setError('Veuillez sélectionner un cours');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.get(`/api/notes/import-export/export/${selectedCours}/${annee}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      const coursInfo = cours.find(c => c.id === parseInt(selectedCours));
      link.href = url;
      link.setAttribute('download', `notes_${coursInfo?.code || selectedCours}_${annee}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage('✅ Export terminé !');
    } catch (err) {
      setError('Erreur lors de l\'export');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📥 Exporter les notes (Excel)</h1>
          <p className="page-sub">Téléchargez les notes d'un cours au format Excel</p>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      <div className="card">
        <div className="form-grid">
          <div className="form-group">
            <label>Cours *</label>
            <select
              value={selectedCours}
              onChange={e => setSelectedCours(e.target.value)}
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
              placeholder="Ex: 2024-2025"
            />
          </div>

          <button
            className="btn-primary"
            style={{ gridColumn: '1 / span 2' }}
            onClick={handleExport}
            disabled={loading || !selectedCours}
          >
            {loading ? '⏳ Génération...' : '📥 Télécharger le fichier Excel'}
          </button>
        </div>

        <div style={{ marginTop: 16, padding: '12px', background: 'rgba(24,95,165,0.12)', borderRadius: 8, fontSize: 12 }}>
          <strong>📋 Contenu de l'export :</strong><br />
          • Matricule, Nom, Prénom, TP, Interrogation, Examen, Note finale, Mention, Appréciation<br />
          • Les notes sont colorées (vert pour réussi, rouge pour échec)<br />
          • Format : .xlsx (Excel 2007+)
        </div>
      </div>
    </div>
  );
}