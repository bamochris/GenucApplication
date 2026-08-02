// src/pages/professeur/ImportNotes.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { importService } from '../../services/importService';
import ImportReport from './ImportReport';
import '../Dashboard.css';

export default function ImportNotes() {
  const { user } = useAuth();
  const [cours, setCours] = useState([]);
  const [selectedCours, setSelectedCours] = useState('');
  const [anneeAcademique, setAnneeAcademique] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [rapport, setRapport] = useState(null);
  const [etape, setEtape] = useState('selection'); // selection | analyse | validation

  const loadCours = useCallback(async () => {
    try {
      const res = await api.get(`/api/professeur/${user.id}/cours`);
      setCours(res.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des cours');
    }
  }, [user.id]);

  useEffect(() => {
    loadCours();
    setAnneeAcademique(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
  }, [loadCours]);

  const handleFileChange = (e) => {
    const fichier = e.target.files[0];
    if (fichier) {
      const validTypes = ['.xlsx', '.xls', '.csv'];
      const extension = fichier.name.substring(fichier.name.lastIndexOf('.')).toLowerCase();
      if (!validTypes.includes(extension)) {
        setError('Format de fichier non supporté. Utilisez .xlsx, .xls ou .csv');
        return;
      }
      if (fichier.size > 5 * 1024 * 1024) {
        setError('Le fichier ne doit pas dépasser 5 Mo');
        return;
      }
      setFile(fichier);
      setError('');
      setMessage(`✅ Fichier sélectionné : ${fichier.name} (${(fichier.size / 1024).toFixed(0)} Ko)`);
    }
  };

  const handleAnalyser = async () => {
    if (!selectedCours) {
      setError('Veuillez sélectionner un cours');
      return;
    }
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await importService.analyserFichier(file, selectedCours, anneeAcademique);
      setRapport(result);
      setEtape('analyse');
      if (result.anomalies.length === 0) {
        setMessage('✅ Aucune anomalie détectée. Vous pouvez valider l\'import.');
      } else {
        setMessage(`⚠️ ${result.anomalies.length} anomalies détectées. Veuillez les vérifier.`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'analyse du fichier');
    } finally {
      setLoading(false);
    }
  };

  const handleValider = async () => {
    if (!rapport) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Récupérer les notes corrigées (si des corrections ont été faites)
      const notes = rapport.lignes.map((ligne, index) => ({
        matricule: ligne.matricule,
        nom: ligne.nom,
        note: ligne.note,
      }));

      const result = await importService.validerImport(selectedCours, notes, anneeAcademique);
      setMessage(`✅ Import réussi : ${result.nbNotesImportees} notes enregistrées`);
      setEtape('selection');
      setRapport(null);
      setFile(null);
      // Réinitialiser le champ file
      document.getElementById('fileInput').value = '';
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleAnnuler = () => {
    setEtape('selection');
    setRapport(null);
    setFile(null);
    document.getElementById('fileInput').value = '';
    setMessage('');
  };

  const handleDownloadModele = async (format) => {
    try {
      await importService.telechargerModele(format);
    } catch (err) {
      setError('Erreur lors du téléchargement du modèle');
    }
  };

  // Télécharger un PDF structuré (exemple)
  const handleDownloadPDFModele = async () => {
    try {
      const response = await api.get('/api/notes/import/modele-pdf', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'modele_import_notes.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erreur lors du téléchargement du modèle PDF');
    }
  };

  if (loading && !rapport) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Analyse du fichier en cours...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📤 Import intelligent des notes</h1>
          <p className="page-sub">Import Excel, CSV ou PDF avec détection automatique des anomalies</p>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {etape === 'selection' && (
        <>
          {/* Sélecteur de cours et année */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Cours *</label>
                <select 
                  value={selectedCours} 
                  onChange={e => setSelectedCours(e.target.value)}
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  {cours.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.nom}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Année académique *</label>
                <select 
                  value={anneeAcademique} 
                  onChange={e => setAnneeAcademique(e.target.value)}
                >
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                </select>
              </div>
            </div>
          </div>

          {/* Zone de dépôt de fichier */}
          <div className="card" style={{ marginBottom: 20, padding: 30, textAlign: 'center', border: '2px dashed #ccc' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
            <h3 style={{ marginBottom: 8 }}>Déposez votre fichier ici</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
              Formats acceptés : .xlsx, .xls, .csv, .pdf (structuré)
            </p>
            <input 
              id="fileInput"
              type="file" 
              accept=".xlsx,.xls,.csv,.pdf" 
              onChange={handleFileChange}
              style={{ display: 'block', margin: '0 auto', maxWidth: 300 }}
            />
            {file && (
              <div style={{ marginTop: 12, padding: 10, background: 'rgba(24,95,165,0.12)', borderRadius: 6 }}>
                <strong>Fichier sélectionné :</strong> {file.name}
                <br />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Taille : {(file.size / 1024).toFixed(0)} Ko</span>
              </div>
            )}
          </div>

          {/* Téléchargement des modèles */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 className="card-title">📥 Télécharger un modèle</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
              Utilisez nos modèles pour préparer vos fichiers d'import.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn-outline" onClick={() => handleDownloadModele('xlsx')}>
                📊 Modèle Excel (.xlsx)
              </button>
              <button className="btn-outline" onClick={() => handleDownloadModele('csv')}>
                📄 Modèle CSV
              </button>
              <button className="btn-outline" onClick={handleDownloadPDFModele}>
                📑 Modèle PDF structuré
              </button>
            </div>
          </div>

          {/* Bouton d'analyse */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button 
              className="btn-primary" 
              onClick={handleAnalyser}
              disabled={!selectedCours || !file || loading}
              style={{ fontSize: 16, padding: '10px 30px' }}
            >
              {loading ? '⏳ Analyse en cours...' : '🔍 Analyser le fichier'}
            </button>
          </div>
        </>
      )}

      {etape === 'analyse' && rapport && (
        <ImportReport
          rapport={rapport}
          onValider={handleValider}
          onAnnuler={handleAnnuler}
          onCorriger={(index, champ, valeur) => {
            // Mise à jour locale du rapport
            const nouvellesLignes = [...rapport.lignes];
            nouvellesLignes[index] = { ...nouvellesLignes[index], [champ]: valeur };
            setRapport({ ...rapport, lignes: nouvellesLignes });
          }}
          loading={loading}
        />
      )}
    </div>
  );
}