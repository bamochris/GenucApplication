// src/pages/etudiant/bulletins/Bulletins.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import { financeService } from '../../../services/financeService';
import '../EtudiantDashboard.css';

export default function Bulletins() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bulletinData, setBulletinData] = useState([]);
  const [anneesDisponibles, setAnneesDisponibles] = useState([]);
  const [selectedAnnee, setSelectedAnnee] = useState('');
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');

  // Phase 4 : états pour le blocage financier
  const [bloque, setBloque] = useState(false);
  const [messageBlocage, setMessageBlocage] = useState('');
  const [, setSolde] = useState(null);

  const inscriptionId = user?.inscriptionId;

  // Chargement initial : vérifier le solde puis charger les années
  useEffect(() => {
    if (!inscriptionId) {
      setError("Aucune inscription trouvée");
      setLoading(false);
      return;
    }
    verifierSoldeEtCharger();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId, user?.id]);

  const verifierSoldeEtCharger = useCallback(async () => {
    setLoading(true);
    setError(null);
    setBloque(false);

    try {
      // 1. Vérification du solde
      const soldeData = await financeService.getSolde(user.id);
      setSolde(soldeData);

      if (soldeData.montantRestant > 0) {
        setBloque(true);
        setMessageBlocage(
          `⚠️ Bulletins bloqués. Solde impayé : ${soldeData.montantRestant} ${soldeData.devise || 'USD'}. ` +
          `Veuillez régulariser votre situation auprès de la caisse.`
        );
        setLoading(false);
        return;
      }

      // 2. Si à jour, charger les années disponibles
      await loadAnneesDisponibles();
    } catch (err) {
      setError("Erreur lors de la vérification de votre situation financière");
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user?.id, inscriptionId]);

  const loadAnneesDisponibles = async () => {
    try {
      const res = await api.get(`/api/etudiant/portal/${inscriptionId}/annees-disponibles`);
      const data = res.data || ['2024-2025', '2025-2026'];
      setAnneesDisponibles(data);
      if (data.length > 0) {
        setSelectedAnnee(data[0]);
      }
    } catch (err) {
      console.error('Erreur chargement années:', err);
      setAnneesDisponibles(['2024-2025', '2025-2026']);
      setSelectedAnnee('2024-2025');
    } finally {
      setLoading(false);
    }
  };

  // Chargement des bulletins quand l'année change (si non bloqué)
  useEffect(() => {
    if (inscriptionId && selectedAnnee && !bloque) {
      loadBulletins();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId, selectedAnnee, bloque]);

  const loadBulletins = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/etudiant/portal/${inscriptionId}/bulletins`, {
        params: { annee: selectedAnnee }
      });
      setBulletinData(response.data || []);
    } catch (err) {
      setError(err.response?.data?.erreur || "Erreur de chargement des bulletins");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBulletin = async (type) => {
    setGenerating(true);
    setMessage('');
    try {
      const response = await api.get(`/api/deliberation/bulletin/${inscriptionId}`, {
        params: { annee: selectedAnnee, type },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const typeLabel = type === 'ANNUEL' ? 'annuel' : 'semestriel';
      link.setAttribute('download', `bulletin_${typeLabel}_${inscriptionId}_${selectedAnnee}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage('✅ Bulletin téléchargé avec succès');
    } catch (err) {
      setMessage('❌ Erreur lors du téléchargement du bulletin');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReleve = async () => {
    setGenerating(true);
    setMessage('');
    try {
      const response = await api.get(`/api/etudiant/portal/${inscriptionId}/releve/telecharger`, {
        params: { annee: selectedAnnee },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `releve_notes_${inscriptionId}_${selectedAnnee}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage('✅ Relevé de notes téléchargé avec succès');
    } catch (err) {
      setMessage('❌ Erreur lors du téléchargement du relevé');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = (type) => {
    window.print();
  };

  const formatDate = (date) => {
    if (!date) return 'Non disponible';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Affichage du blocage
  if (bloque) {
    return (
      <div className="etudiant-dashboard">
        <div className="card" style={{ 
          maxWidth: 600, 
          margin: '40px auto', 
          padding: 30, 
          textAlign: 'center',
          border: '2px solid #dc3545',
          background: 'rgba(220,53,69,0.10)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ color: '#dc3545', marginBottom: 12 }}>Bulletins bloqués</h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>{messageBlocage}</p>
          <Link
            to="/etudiant/frais"
            className="btn-primary"
            style={{ marginTop: 16, display: 'inline-block', textDecoration: 'none' }}
          >
            💳 Voir ma situation financière
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de vos bulletins...</p>
      </div>
    );
  }

  return (
    <div className="etudiant-dashboard">
      <div className="section-header">
        <h2 className="section-title">📄 Bulletins et Relevés</h2>
      </div>

      {message && (
        <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>
          {message}
        </div>
      )}

      {/* Sélecteur d'année */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 600, fontSize: 13 }}>Année académique :</label>
          <select 
            value={selectedAnnee} 
            onChange={e => setSelectedAnnee(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border-color)', minWidth: 150, background: 'var(--bg-card)', color: 'var(--text-primary)' }}
          >
            {anneesDisponibles.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button className="btn-outline" onClick={loadBulletins} style={{ marginLeft: 'auto' }}>
            🔄 Rafraîchir
          </button>
        </div>
      </div>

      {/* Documents disponibles */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ borderLeftColor: '#185FA5' }}>
          <div className="stat-icon">📄</div>
          <div className="stat-content">
            <div className="stat-value">{bulletinData.filter(b => b.type === 'ANNUEL').length}</div>
            <div className="stat-label">Bulletins annuels</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#1D9E75' }}>
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{bulletinData.filter(b => b.type === 'SEMESTRIEL').length}</div>
            <div className="stat-label">Bulletins semestriels</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#854F0B' }}>
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{bulletinData.length}</div>
            <div className="stat-label">Total documents</div>
          </div>
        </div>
      </div>

      {/* Options de téléchargement */}
      <div className="dash-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Bulletin annuel */}
        <div className="card">
          <h3 className="card-title">📄 Bulletin annuel</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Téléchargez votre bulletin annuel complet pour l'année {selectedAnnee}.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button 
              className="btn-primary" 
              onClick={() => handleDownloadBulletin('ANNUEL')}
              disabled={generating}
              style={{ width: '100%' }}
            >
              {generating ? '⏳ Génération...' : '📥 Télécharger le bulletin annuel'}
            </button>
            <button 
              className="btn-outline" 
              onClick={() => handlePrint('ANNUEL')}
              style={{ width: '100%' }}
            >
              🖨️ Imprimer
            </button>
          </div>
          {bulletinData.find(b => b.type === 'ANNUEL' && b.date) && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
              Dernière génération : {formatDate(bulletinData.find(b => b.type === 'ANNUEL').date)}
            </div>
          )}
        </div>

        {/* Bulletin semestriel */}
        <div className="card">
          <h3 className="card-title">📊 Bulletin semestriel</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Téléchargez votre bulletin semestriel pour l'année {selectedAnnee}.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button 
              className="btn-primary" 
              onClick={() => handleDownloadBulletin('SEMESTRIEL')}
              disabled={generating}
              style={{ width: '100%' }}
            >
              {generating ? '⏳ Génération...' : '📥 Télécharger le bulletin semestriel'}
            </button>
            <button 
              className="btn-outline" 
              onClick={() => handlePrint('SEMESTRIEL')}
              style={{ width: '100%' }}
            >
              🖨️ Imprimer
            </button>
          </div>
          {bulletinData.find(b => b.type === 'SEMESTRIEL' && b.date) && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
              Dernière génération : {formatDate(bulletinData.find(b => b.type === 'SEMESTRIEL').date)}
            </div>
          )}
        </div>
      </div>

      {/* Relevé de notes */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title">📋 Relevé de notes officiel</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          Téléchargez votre relevé de notes officiel pour l'année {selectedAnnee}.
          Document authentique avec QR code de vérification.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            className="btn-primary" 
            onClick={handleDownloadReleve}
            disabled={generating}
          >
            {generating ? '⏳ Génération...' : '📥 Télécharger le relevé'}
          </button>
          <button className="btn-outline" onClick={() => window.print()}>
            🖨️ Imprimer
          </button>
        </div>
        <div style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(24,95,165,0.12)', border: '1px solid rgba(24,95,165,0.3)', color: 'var(--text-primary)', borderRadius: 8, fontSize: 12 }}>
          <strong>ℹ️ Informations :</strong><br />
          • Format : PDF officiel avec QR code<br />
          • Contient toutes les notes de l'année académique<br />
          • Document vérifiable en ligne
        </div>
      </div>

      {/* Historique des téléchargements */}
      {bulletinData.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 className="card-title">📜 Historique des téléchargements</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Année</th>
                <th>Date de génération</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bulletinData.map((b, idx) => (
                <tr key={idx}>
                  <td>
                    <span className="badge badge-neutral">
                      {b.type === 'ANNUEL' ? '📄 Annuel' : '📊 Semestriel'}
                    </span>
                  </td>
                  <td>{b.annee}</td>
                  <td>{b.date ? new Date(b.date).toLocaleDateString('fr-FR') : 'Non disponible'}</td>
                  <td>
                    <button 
                      className="btn-outline" 
                      style={{ fontSize: 11, padding: '4px 10px' }}
                      onClick={() => handleDownloadBulletin(b.type)}
                      disabled={generating}
                    >
                      📥 Télécharger
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && (
        <div className="alert-erreur" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}
    </div>
  );
}
