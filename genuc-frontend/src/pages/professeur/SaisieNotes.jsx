// src/pages/professeur/SaisieNotes.jsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function SaisieNotes() {
  const { user } = useAuth();
  const [cours, setCours] = useState([]);
  const [coursId, setCoursId] = useState('');
  const [annee, setAnnee] = useState('2024-2025');
  const [etudiants, setEtudiants] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const fileInputRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const notesRef = useRef({});
  const coursIdRef = useRef('');
  const anneeRef = useRef('2024-2025');
  const etudiantsRef = useRef([]);

  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { coursIdRef.current = coursId; }, [coursId]);
  useEffect(() => { anneeRef.current = annee; }, [annee]);
  useEffect(() => { etudiantsRef.current = etudiants; }, [etudiants]);


  useEffect(() => {
    api.get(`/api/cours/professeur/${user.id}`)
      .then(res => setCours(res.data))
      .catch(() => setError('Erreur chargement des cours'));
  }, [user.id]);

  const chargerEtudiants = async () => {
    if (!coursId) {
      setError('Veuillez sélectionner un cours');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.get(`/api/cours/${coursId}/etudiants`);
      const liste = res.data;
      setEtudiants(liste);
      
      // Charger les notes existantes
      const notesRes = await api.get(`/api/notes/cours/${coursId}/${annee}`);
      const notesMap = {};
      notesRes.data.forEach(n => {
        notesMap[n.inscriptionId] = {
          noteTP: n.noteTP || '',
          noteInterrogation: n.noteInterrogation || '',
          noteExamen: n.noteExamen || '',
          id: n.id
        };
      });
      
      // Initialiser pour tous les étudiants
      const initial = {};
      liste.forEach(et => {
        initial[et.id] = notesMap[et.id] || { noteTP: '', noteInterrogation: '', noteExamen: '' };
      });
      setNotes(initial);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur chargement étudiants");
    } finally {
      setLoading(false);
    }
  };

  const buildPayload = useCallback((notesData) => {
    return Object.entries(notesData).map(([etudiantId, note]) => ({
      inscriptionId: parseInt(etudiantId),
      noteTP: parseFloat(note.noteTP) || null,
      noteInterrogation: parseFloat(note.noteInterrogation) || null,
      noteExamen: parseFloat(note.noteExamen) || null,
      professeurId: user.id
    }));
  }, [user.id]);

  const performSave = useCallback(async (notesData, cId, anneeVal, isAuto = false) => {
    if (!etudiantsRef.current.length || !cId) return;
    if (isAuto) setAutoSaving(true);
    try {
      const payload = buildPayload(notesData);
      await api.post(`/api/notes/lot/${cId}/${anneeVal}`, payload);
      if (isAuto) {
        setLastSaved(new Date());
      } else {
        setMessage('✅ Toutes les notes ont été enregistrées avec succès');
        chargerEtudiants();
      }
    } catch (err) {
      if (!isAuto) setError(err.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      if (isAuto) setAutoSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [buildPayload]);

  const handleChange = (etudiantId, field, value) => {
    setNotes(prev => {
      const updated = { ...prev, [etudiantId]: { ...prev[etudiantId], [field]: value } };
      notesRef.current = updated;
      return updated;
    });

    // Sauvegarde automatique après 5 secondes d'inactivité
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      performSave(notesRef.current, coursIdRef.current, anneeRef.current, true);
    }, 5000);
  };

  const soumettreLot = async () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    await performSave(notesRef.current, coursId, annee, false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('coursId', coursId);
    formData.append('anneeAcademique', annee);
    formData.append('professeurId', user.id);

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.post('/api/notes/import-export/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(`✅ Import terminé : ${response.data.ligneImportees} notes importées, ${response.data.erreurs} erreurs`);
      chargerEtudiants();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de l\'import');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const exportExcel = async () => {
    if (!coursId) {
      setError('Veuillez sélectionner un cours');
      return;
    }
    setExportLoading(true);
    try {
      const response = await api.get(`/api/notes/import-export/export/${coursId}/${annee}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      const coursInfo = cours.find(c => c.id === parseInt(coursId));
      link.href = url;
      link.setAttribute('download', `notes_${coursInfo?.code || coursId}_${annee}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erreur lors de l\'export');
    } finally {
      setExportLoading(false);
    }
  };

  const downloadTemplate = async () => {
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
      <h1 className="page-title">✏️ Saisie des notes</h1>
      <p className="page-sub">Saisissez les notes par cours ou importez un fichier Excel</p>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}
      {(autoSaving || lastSaved) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          {autoSaving
            ? <><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#ff9800', animation: 'pulse 1s infinite' }} />Sauvegarde automatique...</>
            : <><span style={{ color: '#1D9E75' }}>✓</span>Sauvegardé automatiquement à {lastSaved?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</>
          }
        </div>
      )}

      <div className="card">
        <div className="form-grid">
          <div className="form-group">
            <label>Cours *</label>
            <select value={coursId} onChange={e => setCoursId(e.target.value)}>
              <option value="">-- Sélectionner --</option>
              {cours.map(c => <option key={c.id} value={c.id}>{c.code} - {c.titre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Année académique</label>
            <input value={annee} onChange={e => setAnnee(e.target.value)} placeholder="2024-2025" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          <button className="btn-primary" onClick={chargerEtudiants} disabled={loading}>
            {loading ? 'Chargement...' : '📋 Charger les étudiants'}
          </button>
          <button className="btn-outline" onClick={exportExcel} disabled={exportLoading || !coursId}>
            {exportLoading ? '⏳' : '📥 Exporter Excel'}
          </button>
          <button className="btn-outline" onClick={downloadTemplate}>
            📄 Télécharger le modèle
          </button>
          <input
            type="file"
            accept=".xlsx,.xls"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="file-upload"
          />
          <label htmlFor="file-upload" className="btn-outline" style={{ cursor: 'pointer' }}>
            📤 Importer Excel
          </label>
        </div>
      </div>

      {etudiants.length > 0 && (
        <div className="card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 150 }}>Étudiant</th>
                  <th style={{ minWidth: 100 }}>Matricule</th>
                  <th>TP /20</th>
                  <th>Interrogation /20</th>
                  <th>Examen /20</th>
                  <th>Note finale</th>
                </tr>
              </thead>
              <tbody>
                {etudiants.map(et => {
                  const note = notes[et.id] || {};
                  const noteFinale = note.noteTP && note.noteInterrogation && note.noteExamen
                    ? (parseFloat(note.noteTP) * 0.3 + parseFloat(note.noteInterrogation) * 0.2 + parseFloat(note.noteExamen) * 0.5).toFixed(2)
                    : '-';
                  return (
                    <tr key={et.id}>
                      <td>{et.prenom} {et.nom}</td>
                      <td className="uni-code">{et.matricule}</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="20"
                          value={note.noteTP || ''}
                          onChange={e => handleChange(et.id, 'noteTP', e.target.value)}
                          style={{ width: 70, padding: '4px 6px', borderRadius: 4, border: '1px solid #ddd' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="20"
                          value={note.noteInterrogation || ''}
                          onChange={e => handleChange(et.id, 'noteInterrogation', e.target.value)}
                          style={{ width: 70, padding: '4px 6px', borderRadius: 4, border: '1px solid #ddd' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="20"
                          value={note.noteExamen || ''}
                          onChange={e => handleChange(et.id, 'noteExamen', e.target.value)}
                          style={{ width: 70, padding: '4px 6px', borderRadius: 4, border: '1px solid #ddd' }}
                        />
                      </td>
                      <td style={{ fontWeight: 700, color: parseFloat(noteFinale) >= 10 ? '#1D9E75' : '#cc0000' }}>
                        {noteFinale}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
            <button className="btn-primary" onClick={soumettreLot}>
              💾 Enregistrer toutes les notes
            </button>
            {lastSaved && !autoSaving && (
              <span style={{ fontSize: 12, color: '#1D9E75' }}>
                ✓ Auto-sauvegardé à {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}