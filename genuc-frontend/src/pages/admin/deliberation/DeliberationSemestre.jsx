// src/pages/admin/deliberation/DeliberationSemestre.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import deliberationService from '../../../services/deliberationService';
import FiltresRapides from '../../../components/deliberation/FiltresRapides';
import TableauJury from '../../../components/deliberation/TableauJury';
import '../../Dashboard.css';

export default function DeliberationSemestre() {
  const { user } = useAuth();
  const { semestreId } = useParams(); // ex: 'S1' ou 'S2'
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [filtreStatut, setFiltreStatut] = useState('');
  const [stats, setStats] = useState({ total: 0, PA: 0, PD: 0, PP: 0, CJ: 0 });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [annee, setAnnee] = useState('2025-2026');
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null });

  const loadDeliberation = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Récupérer les délibérations pour l'université et l'année
      const response = await deliberationService.getListe(user.universiteId, annee);
      const items = response.content || [];
      setData(items);
      
      // Calcul des stats
      const statsCalc = items.reduce((acc, curr) => {
        acc.total++;
        const statut = curr.statut || curr.decision;
        if (statut === 'PA' || statut === 'ADMIS' || statut === 'DIPLOME') acc.PA++;
        else if (statut === 'PD' || statut === 'ADMIS_RATTRAPAGE') acc.PD++;
        else if (statut === 'PP' || statut === 'REDOUBLE') acc.PP++;
        else if (statut === 'CJ' || statut === 'EXCLU') acc.CJ++;
        return acc;
      }, { total: 0, PA: 0, PD: 0, PP: 0, CJ: 0 });
      setStats(statsCalc);
    } catch (err) {
      setError('Erreur lors du chargement de la délibération');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user.universiteId, annee]);

  useEffect(() => {
    loadDeliberation();
  }, [loadDeliberation]);

  const handleFiltreChange = (statut) => {
    setFiltreStatut(statut);
  };

  const filteredData = filtreStatut
    ? data.filter(item => {
        const statut = item.statut || item.decision;
        return statut === filtreStatut;
      })
    : data;

  const handleValidation = () => setConfirmModal({ open: true, type: 'valider' });
  const handleConsolidation = () => setConfirmModal({ open: true, type: 'consolider' });

  const confirmerAction = async () => {
    const type = confirmModal.type;
    setConfirmModal({ open: false, type: null });
    try {
      if (type === 'valider') {
        await deliberationService.publierDepartement(user.departementId, annee);
        setMessage('✅ Délibération validée avec succès');
        loadDeliberation();
      } else if (type === 'consolider') {
        const { jobId } = await deliberationService.lancerConsolidation(user.universiteId, annee);
        setMessage(`✅ Consolidation lancée (job: ${jobId})`);
        setTimeout(() => loadDeliberation(), 3000);
      }
    } catch (err) {
      setError(type === 'valider' ? 'Erreur lors de la validation' : 'Erreur lors de la consolidation');
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Délibération {semestreId}</h1>
          <p className="page-sub">Gestion des résultats du semestre</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={annee} onChange={e => setAnnee(e.target.value)} className="btn-outline" style={{ padding: '6px 12px' }}>
            <option value="2024-2025">2024-2025</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
          </select>
          <button className="btn-outline" onClick={handleConsolidation}>🔄 Consolider</button>
          <button className="btn-success" onClick={handleValidation}>✅ Valider</button>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {/* Cartes de stats */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 16, borderLeft: '4px solid #1D9E75' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1D9E75' }}>{stats.PA}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PA</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 16, borderLeft: '4px solid #F39C12' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#F39C12' }}>{stats.PD}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PD</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 16, borderLeft: '4px solid #E74C3C' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#E74C3C' }}>{stats.PP}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PP</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 16, borderLeft: '4px solid #3498DB' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#3498DB' }}>{stats.CJ}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>CJ</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <FiltresRapides filtreActif={filtreStatut} onFiltreChange={handleFiltreChange} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {filteredData.length} étudiant{filteredData.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Modal de confirmation */}
      {confirmModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 420, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>
              {confirmModal.type === 'valider' ? '✅ Valider la délibération' : '🔄 Lancer la consolidation'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>
              {confirmModal.type === 'valider'
                ? 'Valider définitivement cette délibération ? Les résultats seront verrouillés.'
                : 'Lancer la consolidation ? Les bulletins et relevés seront générés.'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setConfirmModal({ open: false, type: null })}>Annuler</button>
              <button className={confirmModal.type === 'valider' ? 'btn-success' : 'btn-primary'} onClick={confirmerAction}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* Tableau */}
      <div className="card">
        <TableauJury 
          data={filteredData} 
          loading={loading} 
          showActions={true}
          actions={(etudiant) => (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn-outline"
                style={{ fontSize: 11, padding: '3px 10px', opacity: 0.5, cursor: 'not-allowed' }}
                title={`Modifier ${etudiant.matricule} — fonctionnalité à venir`}
                disabled
              >
                ✏️
              </button>
              {(etudiant.statut === 'CJ' || etudiant.decision === 'CJ' || etudiant.decision === 'EXCLU') && (
                <button className="btn-outline" style={{ fontSize: 11, padding: '3px 10px', color: '#3498DB' }}>
                  📋
                </button>
              )}
            </div>
          )}
        />
      </div>
    </div>
  );
}