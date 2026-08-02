// src/pages/etudiant/EcheancierDetailEtudiant.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function EcheancierDetailEtudiant() {
  const { user } = useAuth();
  const [echeanciers, setEcheanciers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    if (inscriptionId) loadEcheanciers();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId]);

  const loadEcheanciers = async () => {
    try {
      const res = await api.get(`/api/echeanciers/inscription/${inscriptionId}`);
      setEcheanciers(res.data);
    } catch (err) {
      setError("Erreur chargement des échéanciers");
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut) => {
    const map = {
      'EN_ATTENTE': 'badge-warning',
      'PAYEE': 'badge-success',
      'PARTIELLE': 'badge-warning',
      'EN_RETARD': 'badge-danger',
      'ANNULEE': 'badge-neutral'
    };
    return map[statut] || 'badge-neutral';
  };

  const getStatutLabel = (statut) => {
    const map = {
      'EN_ATTENTE': '⏳ En attente',
      'PAYEE': '✅ Payée',
      'PARTIELLE': '🔄 Partielle',
      'EN_RETARD': '❌ En retard',
      'ANNULEE': '⛔ Annulée'
    };
    return map[statut] || statut;
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Mes échéanciers</h1>
          <p className="page-sub">Suivez vos paiements par tranches</p>
        </div>
      </div>

      {error && <div className="alert-erreur">{error}</div>}

      {echeanciers.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
            Aucun échéancier pour votre inscription.
          </p>
        </div>
      ) : (
        echeanciers.map(ech => {
          const payees = ech.echeances?.filter(e => e.statut === 'PAYEE').length || 0;
          const total = ech.echeances?.length || 0;
          const progress = total > 0 ? Math.round((payees / total) * 100) : 0;
          const totalRestant = ech.montantTotal - ech.echeances?.filter(e => e.statut === 'PAYEE')
            .reduce((sum, e) => sum + e.montant, 0) || 0;

          return (
            <div key={ech.id} className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{ech.libelle}</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {ech.description} • {ech.nombreEcheances} tranches • Total: {ech.montantTotal} USD
                  </div>
                </div>
                <span className={`badge ${ech.statut === 'ACTIF' ? 'badge-success' : 'badge-neutral'}`}>
                  {ech.statut}
                </span>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>Progression</span>
                  <span>{payees}/{total} payées ({progress}%)</span>
                </div>
                <div style={{ background: 'var(--bg-secondary)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    width: `${progress}%`,
                    background: progress === 100 ? '#1D9E75' : '#185FA5',
                    height: '100%',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontWeight: 600 }}>
                  <span>Reste à payer</span>
                  <span style={{ color: totalRestant > 0 ? '#cc0000' : '#1D9E75' }}>
                    {Math.round(totalRestant * 100) / 100} USD
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <table className="data-table" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Montant</th>
                      <th>Date échéance</th>
                      <th>Pénalité</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ech.echeances?.sort((a,b) => a.numeroEcheance - b.numeroEcheance).map(e => (
                      <tr key={e.id}>
                        <td>{e.numeroEcheance}</td>
                        <td>{e.montant} USD</td>
                        <td>{new Date(e.dateEcheance).toLocaleDateString('fr-FR')}</td>
                        <td style={{ color: e.penalite > 0 ? '#cc0000' : '#888' }}>
                          {e.penalite > 0 ? e.penalite + ' USD' : '-'}
                        </td>
                        <td>
                          <span className={`badge ${getStatutBadge(e.statut)}`}>
                            {getStatutLabel(e.statut)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
