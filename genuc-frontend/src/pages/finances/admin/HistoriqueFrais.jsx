// src/pages/finances/admin/HistoriqueFrais.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../../api/axios';
import '../FinanceDashboard.css'; // <- corrigé

export default function HistoriqueFrais() {
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtreEtudiant, setFiltreEtudiant] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const loadHistorique = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filtreStatut) params.append('statut', filtreStatut);
      if (filtreEtudiant) params.append('q', filtreEtudiant);
      if (dateDebut) params.append('dateDebut', dateDebut);
      if (dateFin) params.append('dateFin', dateFin);

      const res = await api.get(`/api/admin/frais/historique?${params.toString()}`);
      setHistorique(res.data || []);
    } catch (err) {
      setError('Erreur lors du chargement de l’historique');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filtreStatut, filtreEtudiant, dateDebut, dateFin]);

  useEffect(() => {
    loadHistorique();
  }, [loadHistorique]);

  const historiqueFiltre = useMemo(() => historique, [historique]);

  const exporterCSV = () => {
    if (historiqueFiltre.length === 0) {
      setMessage('Aucune donnée à exporter');
      return;
    }
    const entetes = ['Étudiant', 'Matricule', 'Frais', 'Montant', 'Payé', 'Reste', 'Statut', 'Date affectation', 'Échéance'];
    const lignes = historiqueFiltre.map(a => {
      const montant = a.montant || 0;
      const reste = a.reste || 0;
      return [
        `${a.inscription?.prenom || ''} ${a.inscription?.nom || ''}`,
        a.inscription?.matricule || '',
        a.frais?.libelle || '',
        montant,
        (montant - reste).toFixed(2),
        reste,
        a.statut || '',
        a.dateAffectation ? new Date(a.dateAffectation).toLocaleDateString('fr-FR') : '',
        a.dateEcheance ? new Date(a.dateEcheance).toLocaleDateString('fr-FR') : '-'
      ];
    });
    const csvContent = [entetes.join(','), ...lignes.map(l => l.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historique_frais_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const getStatutBadge = (statut) => {
    const map = {
      'EN_ATTENTE': 'badge-warning',
      'PARTIEL': 'badge-warning',
      'PAYE': 'badge-success',
      'ANNULE': 'badge-danger'
    };
    return map[statut] || 'badge-neutral';
  };

  const getStatutLabel = (statut) => {
    const map = {
      'EN_ATTENTE': '⏳ En attente',
      'PARTIEL': '🔄 Partiel',
      'PAYE': '✅ Payé',
      'ANNULE': '❌ Annulé'
    };
    return map[statut] || statut;
  };

  if (loading && historique.length === 0) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de l’historique...</p>
      </div>
    );
  }

  return (
    <div className="finance-dashboard">
      <div className="section-header">
        <h2 className="section-title">📜 Historique des affectations</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" onClick={exporterCSV}>
            📥 Exporter CSV
          </button>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
            <label>Statut</label>
            <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}>
              <option value="">Tous</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="PARTIEL">Partiel</option>
              <option value="PAYE">Payé</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 2, minWidth: 200 }}>
            <label>Rechercher un étudiant</label>
            <input
              type="text"
              placeholder="Nom, prénom ou matricule"
              value={filtreEtudiant}
              onChange={e => setFiltreEtudiant(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Date de début</label>
            <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Date de fin</label>
            <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} />
          </div>
          <button className="btn-outline" onClick={() => {
            setFiltreStatut('');
            setFiltreEtudiant('');
            setDateDebut('');
            setDateFin('');
          }} style={{ marginBottom: 4 }}>
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Matricule</th>
                <th>Frais</th>
                <th>Montant (USD)</th>
                <th>Payé (USD)</th>
                <th>Reste (USD)</th>
                <th>Statut</th>
                <th>Date affectation</th>
                <th>Échéance</th>
              </tr>
            </thead>
            <tbody>
              {historiqueFiltre.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>Aucune affectation trouvée</td></tr>
              ) : (
                historiqueFiltre.map(a => {
                  const montant = a.montant || 0;
                  const reste = a.reste || 0;
                  return (
                    <tr key={a.id}>
                      <td>{a.inscription?.prenom || ''} {a.inscription?.nom || ''}</td>
                      <td><span className="uni-code">{a.inscription?.matricule || ''}</span></td>
                      <td>{a.frais?.libelle || ''} <br/><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.frais?.code || ''}</span></td>
                      <td>{montant.toFixed(2)}</td>
                      <td>{(montant - reste).toFixed(2)}</td>
                      <td style={{ fontWeight: 600, color: reste > 0 ? '#cc0000' : '#1D9E75' }}>{reste.toFixed(2)}</td>
                      <td><span className={`badge ${getStatutBadge(a.statut)}`}>{getStatutLabel(a.statut)}</span></td>
                      <td>{a.dateAffectation ? new Date(a.dateAffectation).toLocaleDateString('fr-FR') : '-'}</td>
                      <td>{a.dateEcheance ? new Date(a.dateEcheance).toLocaleDateString('fr-FR') : '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}