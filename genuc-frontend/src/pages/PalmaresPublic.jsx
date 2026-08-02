// src/pages/PalmaresPublic.jsx
import { useEffect, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import api from '../api/axios';
import CertificatPalmaresPDF from '../components/CertificatPalmaresPDF';
import './Dashboard.css';

export default function PalmaresPublic() {
  const [laureats, setLaureats] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [universites, setUniversites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [filtres, setFiltres] = useState({ annee: '', universite: '', filiere: '' });
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, mentions: {}, topMoyenne: 0 });
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadAnnees();
    loadUniversites();
    loadPalmares();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, []);

  const loadAnnees = async () => {
    try {
      const res = await api.get('/api/palmares/public/annees');
      setAnnees(res.data);
      if (res.data.length > 0) {
        setFiltres(prev => ({ ...prev, annee: res.data[0] }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadUniversites = async () => {
    try {
      const res = await api.get('/api/universites/public');
      setUniversites(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPalmares = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ annee: filtres.annee });
      if (filtres.universite) params.append('universite', filtres.universite);
      if (filtres.filiere) params.append('filiere', filtres.filiere);
      const res = await api.get(`/api/palmares/public/filtres?${params}`);
      const data = res.data || [];
      setLaureats(data);
      
      // Calculer les statistiques
      const mentions = {};
      let maxMoyenne = 0;
      data.forEach(l => {
        mentions[l.mention] = (mentions[l.mention] || 0) + 1;
        if (l.moyenneGenerale > maxMoyenne) maxMoyenne = l.moyenneGenerale;
      });
      setStats({
        total: data.length,
        mentions,
        topMoyenne: maxMoyenne
      });
    } catch (err) {
      setError('Erreur chargement du palmarès');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ annee: filtres.annee });
      if (filtres.universite) params.append('universiteId', filtres.universite);
      const response = await api.get(`/api/palmares/export/excel?${params}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `palmares_${filtres.annee}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erreur lors de l\'export');
    }
  };

  const downloadCertificate = async (laureat) => {
    setDownloadLoading(true);
    try {
      const blob = await pdf(
        <CertificatPalmaresPDF
          nomComplet={laureat.nomComplet}
          filiere={laureat.filiereNom}
          universite={laureat.universiteNom}
          moyenne={laureat.moyenneGenerale}
          mention={laureat.mention}
          annee={laureat.anneeObtention}
          rang={laureat.rang}
          photoUrl={laureat.photoUrl}
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificat_${laureat.nomComplet.replace(/\s/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erreur lors du téléchargement du certificat');
    } finally {
      setDownloadLoading(false);
    }
  };

  const getMedalEmoji = (rang) => {
    if (rang === 1) return '🥇';
    if (rang === 2) return '🥈';
    if (rang === 3) return '🥉';
    return '🏅';
  };

  const getMentionColor = (mention) => {
    const colors = {
      'TRES_GRANDE_DISTINCTION': '#1D9E75',
      'GRANDE_DISTINCTION': '#185FA5',
      'DISTINCTION': '#854F0B',
      'SATISFACTION': '#0F6E56',
      'REUSSITE': '#0B1F4A',
      'AJOURNE': '#cc0000'
    };
    return colors[mention] || '#0B1F4A';
  };

  const getMentionLabel = (mention) => {
    const labels = {
      'TRES_GRANDE_DISTINCTION': 'Très Grande Distinction',
      'GRANDE_DISTINCTION': 'Grande Distinction',
      'DISTINCTION': 'Distinction',
      'SATISFACTION': 'Satisfaction',
      'REUSSITE': 'Réussite',
      'AJOURNE': 'Ajourné'
    };
    return labels[mention] || mention;
  };

  if (loading) return <div className="loading">Chargement du palmarès...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏆 Palmarès de l'excellence académique</h1>
          <p className="page-sub">Découvrez les meilleurs étudiants de l'année</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" onClick={handleExport} title="Exporter en Excel">
            📥 Excel
          </button>
          <button className="btn-outline" onClick={loadPalmares} title="Rafraîchir">
            🔄
          </button>
        </div>
      </div>

      {error && <div className="alert-erreur">{error}</div>}

      {/* Statistiques */}
      {laureats.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total lauréats</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{Object.keys(stats.mentions).length}</div>
            <div className="stat-label">Mentions différentes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.topMoyenne.toFixed(2)}</div>
            <div className="stat-label">Meilleure moyenne</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {Object.entries(stats.mentions)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 1)
                .map(([mention]) => getMentionLabel(mention))[0] || '-'}
            </div>
            <div className="stat-label">Mention la plus fréquente</div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
          <div className="form-group">
            <label>Année académique</label>
            <select
              value={filtres.annee}
              onChange={e => setFiltres({ ...filtres, annee: e.target.value })}
            >
              {annees.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Université</label>
            <select
              value={filtres.universite}
              onChange={e => setFiltres({ ...filtres, universite: e.target.value })}
            >
              <option value="">Toutes</option>
              {universites.map(u => <option key={u.id} value={u.nom}>{u.nom}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: 'span 1' }}>
            <label>Filière</label>
            <input
              type="text"
              placeholder="Toutes"
              value={filtres.filiere}
              onChange={e => setFiltres({ ...filtres, filiere: e.target.value })}
            />
          </div>
        </div>
        <button className="btn-primary" onClick={loadPalmares} style={{ marginTop: 8 }}>
          🔍 Filtrer
        </button>
      </div>

      {/* Liste des lauréats */}
      {laureats.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
            Aucun lauréat pour cette année.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {laureats.map(laureat => (
            <div key={laureat.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              {/* Badge de rang */}
              <div style={{
                position: 'absolute',
                top: 10,
                right: 10,
                fontSize: 32,
                zIndex: 1
              }}>
                {getMedalEmoji(laureat.rang)}
              </div>

              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                {/* Photo */}
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'rgba(24,95,165,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: `3px solid ${getMentionColor(laureat.mention)}`
                }}>
                  {laureat.photoUrl ? (
                    <img src={laureat.photoUrl} alt={laureat.nomComplet} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 32 }}>👤</span>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 16 }}>{laureat.nomComplet}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{laureat.filiereNom}</div>
                  <div style={{ fontSize: 12, color: '#185FA5' }}>{laureat.universiteNom}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Niveau {laureat.niveau} • {laureat.anneeObtention}</div>
                </div>
              </div>

              {/* Détails */}
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Moyenne</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#185FA5' }}>{laureat.moyenneGenerale}/20</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Mention</div>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: getMentionColor(laureat.mention),
                    background: `${getMentionColor(laureat.mention)}15`,
                    padding: '2px 10px',
                    borderRadius: 12
                  }}>
                    {getMentionLabel(laureat.mention)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Rang</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#854F0B' }}>#{laureat.rang}</div>
                </div>
              </div>

              {/* Biographie */}
              {laureat.biographie && (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.4 }}>
                  {laureat.biographie}
                </p>
              )}

              {/* Actions */}
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1, fontSize: 12, padding: '6px' }}
                  onClick={() => downloadCertificate(laureat)}
                  disabled={downloadLoading}
                >
                  {downloadLoading ? '⏳...' : '📜 Certificat'}
                </button>
                <button
                  className="btn-outline"
                  style={{ fontSize: 12, padding: '6px 12px', color: copiedId === laureat.id ? '#1D9E75' : undefined }}
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      `🏆 ${laureat.nomComplet} - ${getMentionLabel(laureat.mention)} (${laureat.moyenneGenerale}/20) - ${laureat.filiereNom} - ${laureat.universiteNom}`
                    ).then(() => {
                      setCopiedId(laureat.id);
                      setTimeout(() => setCopiedId(null), 2000);
                    });
                  }}
                >
                  {copiedId === laureat.id ? '✅' : '📋'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}