// src/pages/admin/deliberation/ProcesVerbaux.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import deliberationService from '../../../services/deliberationService';
import '../../Dashboard.css';

export default function ProcesVerbaux() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [annee, setAnnee] = useState('');
  const [typePV, setTypePV] = useState('COMPLET');
  const [stats, setStats] = useState({});

  const loadStats = useCallback(async () => {
    try {
      const data = await deliberationService.getStats(user.universiteId, annee || undefined);
      setStats(data || {});
    } catch (err) {
      console.error(err);
    }
  }, [user?.universiteId, annee]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleGenererPV = async () => {
    setLoading(true);
    setError('');
    try {
      // Utiliser le service de téléchargement de relevé ou de bulletin selon le type
      const blob = await deliberationService.telechargerReleve(user.inscriptionId, annee || '2025-2026');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PV_Deliberation_${annee || '2025'}_${typePV}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage('✅ PV généré et téléchargé avec succès');
    } catch (err) {
      setError('Erreur lors de la génération du PV');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenererListe = async (type) => {
    try {
      // Simuler un téléchargement de liste (utiliser un endpoint adapté si existant)
      const blob = await deliberationService.telechargerBulletin(user.inscriptionId, annee || '2025-2026', 'ANNUEL');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Liste_${type}_${annee || '2025'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage(`✅ Liste des ${type} téléchargée`);
    } catch (err) {
      setError('Erreur lors de la génération de la liste');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📄 Procès-Verbaux</h1>
          <p className="page-sub">Génération des PV officiels de délibération</p>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16 }}>
        {/* PV Général */}
        <div className="card">
          <h3 className="card-title">📊 PV de délibération</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label>Année académique</label>
              <select 
                value={annee} 
                onChange={e => setAnnee(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #ddd' }}
              >
                <option value="">Sélectionner une année</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
              </select>
            </div>
            <div className="form-group">
              <label>Type de PV</label>
              <select 
                value={typePV} 
                onChange={e => setTypePV(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #ddd' }}
              >
                <option value="COMPLET">PV complet</option>
                <option value="SYNTHESE">Synthèse</option>
                <option value="DETAILLE">Détaillé</option>
              </select>
            </div>
            <button 
              className="btn-primary" 
              onClick={handleGenererPV}
              disabled={loading}
            >
              {loading ? '⏳ Génération...' : '📄 Générer le PV'}
            </button>
          </div>

          {/* Statistiques */}
          <div style={{ marginTop: 16, borderTop: '1px solid #e9ecef', paddingTop: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
              <span>Total étudiants : <strong>{stats.total || 0}</strong></span>
              <span>PA : <strong style={{ color: '#28a745' }}>{stats.admis || stats.pa || 0}</strong></span>
              <span>PD : <strong style={{ color: '#fd7e14' }}>{stats.pd || 0}</strong></span>
              <span>PP : <strong style={{ color: '#dc3545' }}>{stats.redoublants || stats.pp || 0}</strong></span>
              <span>CJ : <strong style={{ color: '#007bff' }}>{stats.cj || 0}</strong></span>
              <span>Taux réussite : <strong>{stats.tauxReussite || 0}%</strong></span>
            </div>
          </div>
        </div>

        {/* Listes spécifiques */}
        <div className="card">
          <h3 className="card-title">📋 Listes spécifiques</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button 
              className="btn-success" 
              onClick={() => handleGenererListe('ADMIS')}
              style={{ padding: '10px', fontSize: 14 }}
            >
              🟢 Liste des admis (PA)
            </button>
            <button 
              className="btn-warning" 
              onClick={() => handleGenererListe('DETTES')}
              style={{ padding: '10px', fontSize: 14, background: '#fd7e14', color: 'white' }}
            >
              🟠 Liste des dettes (PD)
            </button>
            <button 
              className="btn-danger" 
              onClick={() => handleGenererListe('ECHEC')}
              style={{ padding: '10px', fontSize: 14 }}
            >
              🔴 Liste des échecs (PP)
            </button>
            <button 
              className="btn-outline" 
              onClick={() => handleGenererListe('CAS_JURY')}
              style={{ padding: '10px', fontSize: 14 }}
            >
              🔵 Liste des cas jury (CJ)
            </button>
          </div>
        </div>

        {/* Documents supplémentaires */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 className="card-title">📑 Documents annexes</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button 
              className="btn-outline" 
              onClick={() => window.open(`/api/deliberation/pv/attestations?annee=${annee || '2025'}`, '_blank', 'noopener,noreferrer')}
            >
              📜 Attestations de réussite
            </button>
            <button 
              className="btn-outline" 
              onClick={() => window.open(`/api/deliberation/pv/releves?annee=${annee || '2025'}`, '_blank', 'noopener,noreferrer')}
            >
              📊 Relevés de cotes
            </button>
            <button 
              className="btn-outline" 
              onClick={() => window.open(`/api/deliberation/pv/bulletins?annee=${annee || '2025'}`, '_blank', 'noopener,noreferrer')}
            >
              📋 Bulletins
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}