// src/pages/admin/deliberation/DeliberationAnnuelle.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import deliberationService from '../../../services/deliberationService';
import StatutBadge from '../../../components/deliberation/StatutBadge';
import '../../Dashboard.css';

export default function DeliberationAnnuelle() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [annee, setAnnee] = useState('');
  const [filter, setFilter] = useState('TOUS');
  const [stats, setStats] = useState({});
  const [validerModal, setValiderModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await deliberationService.getListe(user.universiteId, annee || undefined);
      const resultats = response.content || [];
      setData(resultats);
      
      // Calculer les stats
      const total = resultats.length;
      const pa = resultats.filter(s => {
        const statut = s.statut || s.decision;
        return statut === 'PA' || statut === 'ADMIS' || statut === 'DIPLOME';
      }).length;
      const pd = resultats.filter(s => {
        const statut = s.statut || s.decision;
        return statut === 'PD' || statut === 'ADMIS_RATTRAPAGE';
      }).length;
      const pp = resultats.filter(s => {
        const statut = s.statut || s.decision;
        return statut === 'PP' || statut === 'REDOUBLE';
      }).length;
      const cj = resultats.filter(s => {
        const statut = s.statut || s.decision;
        return statut === 'CJ' || statut === 'EXCLU';
      }).length;
      
      setStats({
        total,
        pa,
        pd,
        pp,
        cj,
        tauxReussite: total > 0 ? Math.round(((pa + pd) / total) * 100) : 0,
        mentions: {
          'TB': resultats.filter(s => s.mention === 'TRES_BIEN').length,
          'B': resultats.filter(s => s.mention === 'BIEN').length,
          'AB': resultats.filter(s => s.mention === 'ASSEZ_BIEN').length,
          'P': resultats.filter(s => s.mention === 'PASSABLE').length,
        }
      });
    } catch (err) {
      setError('Erreur lors du chargement des données annuelles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.universiteId, annee]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleValiderAnnuelle = () => setValiderModal(true);

  const confirmerValiderAnnuelle = async () => {
    setValiderModal(false);
    try {
      await deliberationService.publierDepartement(user.departementId, annee || '2025-2026');
      setMessage('✅ Délibération annuelle validée avec succès');
      loadData();
    } catch (err) {
      setError('Erreur lors de la validation');
    }
  };

  const getStatut = (item) => {
    return item.statut || item.decision;
  };

  const filteredData = filter === 'TOUS' 
    ? data 
    : data.filter(s => getStatut(s) === filter);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de la délibération annuelle...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📆 Délibération Annuelle</h1>
          <p className="page-sub">Fusion S1 + S2 - Décision finale</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={annee} onChange={e => setAnnee(e.target.value)} className="btn-outline" style={{ padding: '6px 12px' }}>
            <option value="">Toutes</option>
            <option value="2024-2025">2024-2025</option>
            <option value="2025-2026">2025-2026</option>
          </select>
          <button className="btn-outline" onClick={loadData}>🔄 Actualiser</button>
          <button className="btn-primary" onClick={handleValiderAnnuelle}>✅ Valider l'année</button>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {/* Cartes statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ padding: 12, textAlign: 'center', background: 'var(--bg-secondary)' }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.total}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: 'center', borderLeft: '4px solid #28a745' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#28a745' }}>{stats.pa}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PA</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: 'center', borderLeft: '4px solid #fd7e14' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#fd7e14' }}>{stats.pd}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PD</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: 'center', borderLeft: '4px solid #dc3545' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#dc3545' }}>{stats.pp}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PP</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: 'center', borderLeft: '4px solid #007bff' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#007bff' }}>{stats.cj}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>CJ</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: 'center', borderLeft: '4px solid #6f42c1' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#6f42c1' }}>{stats.tauxReussite}%</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Réussite</div>
        </div>
      </div>

      {/* Mentions */}
      <div className="card" style={{ marginBottom: 16, padding: 12 }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <strong>Mentions :</strong>
          <span><span style={{ color: '#28a745' }}>TB</span> : {stats.mentions?.TB || 0}</span>
          <span><span style={{ color: '#17a2b8' }}>B</span> : {stats.mentions?.B || 0}</span>
          <span><span style={{ color: '#ffc107' }}>AB</span> : {stats.mentions?.AB || 0}</span>
          <span><span style={{ color: '#fd7e14' }}>P</span> : {stats.mentions?.P || 0}</span>
        </div>
      </div>

      {/* Filtres */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontWeight: 600 }}>Filtrer :</label>
          {['TOUS', 'PA', 'PD', 'PP', 'CJ'].map(s => (
            <button
              key={s}
              className={filter === s ? 'btn-primary' : 'btn-outline'}
              style={{ fontSize: 12, padding: '4px 14px' }}
              onClick={() => setFilter(s)}
            >
              {s === 'TOUS' ? 'Tous' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Matricule</th>
                <th>Nom</th>
                <th>Moyenne S1</th>
                <th>Moyenne S2</th>
                <th>Moyenne Annuelle</th>
                <th>Crédits S1</th>
                <th>Crédits S2</th>
                <th>Total</th>
                <th>Mention</th>
                <th>Décision</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr><td colSpan="10" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>Aucun étudiant</td></tr>
              ) : (
                filteredData.map(s => (
                  <tr key={s.id}>
                    <td><span className="uni-code">{s.matricule}</span></td>
                    <td>{s.nom} {s.prenom}</td>
                    <td>{s.moyenneS1?.toFixed(2) || '-'}</td>
                    <td>{s.moyenneS2?.toFixed(2) || '-'}</td>
                    <td><strong>{s.moyenneAnnuelle?.toFixed(2) || s.moyenneGenerale?.toFixed(2) || '-'}</strong></td>
                    <td>{s.creditsS1 || 0}</td>
                    <td>{s.creditsS2 || 0}</td>
                    <td>{s.creditsValides || s.creditsTotal || 0}</td>
                    <td>
                      <span style={{
                        color: s.mention === 'TRES_BIEN' ? '#28a745' :
                               s.mention === 'BIEN' ? '#17a2b8' :
                               s.mention === 'ASSEZ_BIEN' ? '#ffc107' :
                               s.mention === 'PASSABLE' ? '#fd7e14' :
                               '#6c757d'
                      }}>
                        {s.mention || '-'}
                      </span>
                    </td>
                    <td><StatutBadge statut={getStatut(s)} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {validerModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 420, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>✅ Valider la délibération annuelle</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>
              Valider la délibération annuelle {annee || ''}? Les résultats seront publiés et cette action est définitive.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setValiderModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={confirmerValiderAnnuelle}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}