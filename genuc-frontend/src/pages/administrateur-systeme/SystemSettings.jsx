// src/pages/administrateur-systeme/SystemSettings.jsx
// Paramètres système globaleux — configuration, logs applicatifs, maintenance.
// API : /api/systeme/backup, /api/systeme/restore (SystemeController)
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import '../Dashboard.css';

export default function SystemSettings() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [error, setError] = useState('');
  const [systemInfo, setSystemInfo] = useState(null);

  const [file, setFile] = useState(null);
  const [confirmRestore, setConfirmRestore] = useState(false);

  useEffect(() => {
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    try {
      const res = await api.get('/actuator/health').catch(() => ({ data: {} }));
      const envRes = await api.get('/actuator/env').catch(() => ({ data: {} }));
      setSystemInfo({
        health: res.data,
        env: envRes.data,
      });
    } catch (err) {
      setError('Erreur lors du chargement des informations système');
    }
  };

  const telechargerBackup = async () => {
    setLoading(true);
    setError('');
    setMessage({ type: '', text: '' });
    try {
      const response = await api.get('/api/systeme/backup', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let filename = `backup_genuc_${new Date().toISOString().slice(0, 10)}.sql`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename=(.+)/);
        if (match) filename = match[1].replace(/"/g, '');
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: '✅ Sauvegarde téléchargée avec succès' });
    } catch (err) {
      setError('Erreur lors de la génération de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const restaurer = async () => {
    setConfirmRestore(false);
    if (!file) {
      setError('Veuillez sélectionner un fichier .sql');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError('');
    setMessage({ type: '', text: '' });
    try {
      await api.post('/api/systeme/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage({ type: 'success', text: '✅ Base de données restaurée avec succès' });
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la restauration');
    } finally {
      setLoading(false);
    }
  };

  const demanderRestauration = () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier .sql');
      return;
    }
    setConfirmRestore(true);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">⚙️ Paramètres Système</h1>
        <p className="page-sub">
          Sauvegarde / restauration base de données, information serveur, logs
        </p>
      </div>

      {message.text && (
        <div
          className={`alert-${message.type === 'success' ? 'success' : 'erreur'}`}
          onClick={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </div>
      )}
      {error && (
        <div className="alert-erreur" onClick={() => setError('')}>
          {error}
        </div>
      )}

      <div className="dash-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Sauvegarde / Restauration */}
        <div className="card">
          <h2 className="card-title">💾 Sauvegarde (Backup)</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 13 }}>
            Téléchargez une sauvegarde complète de la base de données au format SQL.
          </p>
          <button
            className="btn-primary"
            onClick={telechargerBackup}
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? '⏳ Génération...' : '📥 Télécharger la sauvegarde'}
          </button>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            ⚠️ La sauvegarde peut prendre quelques secondes selon la taille de la base.
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">🔄 Restauration</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 13 }}>
            Restaurez la base de données à partir d'un fichier SQL.
          </p>
          <div className="form-group">
            <label>Fichier SQL (.sql)</label>
            <input
              type="file"
              accept=".sql"
              onChange={e => setFile(e.target.files[0])}
              style={{ width: '100%' }}
            />
            {file && (
              <div style={{ fontSize: 12, color: '#185FA5', marginTop: 4 }}>
                📎 {file.name} ({Math.round(file.size / 1024)} Ko)
              </div>
            )}
          </div>
          <button
            className="btn-danger"
            onClick={demanderRestauration}
            disabled={loading || !file}
            style={{ width: '100%' }}
          >
            {loading ? '⏳ Restauration...' : '🚨 Restaurer la base'}
          </button>
          <div style={{ marginTop: 12, fontSize: 12, color: '#cc0000' }}>
            ⚠️ Cette opération est irréversible. Assurez-vous d'avoir une sauvegarde récente.
          </div>
        </div>
      </div>

      {/* Informations serveur */}
      <div className="card" style={{ marginTop: 20 }}>
        <h2 className="card-title">🖥️ Informations serveur</h2>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <div><strong>Status :</strong> {systemInfo?.health?.status || 'Inconnu'}</div>
          <div style={{ marginTop: 8 }}>
            <strong>Composants :</strong>
            <table className="data-table" style={{ marginTop: 8, fontSize: 12 }}>
              <tbody>
                {systemInfo?.health?.components &&
                  Object.entries(systemInfo.health.components).map(([key, val]) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>
                        <span className={`badge ${val?.status === 'UP' ? 'badge-success' : 'badge-danger'}`}>
                          {val?.status || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de confirmation restauration */}
      {confirmRestore && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 420, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#cc0000' }}>🚨 Restaurer la base de données</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>
              Vous êtes sur le point d'écraser <strong>toute la base de données</strong> avec le contenu de
              « {file?.name} ». Cette action est <strong>irréversible</strong> et supprimera toutes les données actuelles.
              Voulez-vous vraiment continuer ?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setConfirmRestore(false)}>Annuler</button>
              <button className="btn-danger" onClick={restaurer}>Oui, restaurer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
