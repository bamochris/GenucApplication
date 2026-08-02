// src/pages/comptable/RapportsFinanciers.jsx
// Rapports financiers détaillés (RapportFinancierController /api/rapports/financiers)
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function RapportsFinanciers() {
  const { user } = useAuth();
  const universiteId = user?.universiteId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dettes');
  const [dettes, setDettes] = useState([]);
  const [recouvrement, setRecouvrement] = useState([]);
  const [faculte, setFaculte] = useState([]);
  const [evolution, setEvolution] = useState([]);
  const [previsions, setPrevisions] = useState([]);

  const currentYear = new Date().getFullYear();
  const annees = Array.from({ length: 4 }, (_, i) => currentYear - 1 + i);
  const [selectedAnnee, setSelectedAnnee] = useState(currentYear);

  useEffect(() => {
    if (universiteId) loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universiteId, selectedAnnee]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [dettesRes, recouvrementRes, faculteRes, evolutionRes, previsionsRes] = await Promise.all([
        api.get(`/api/rapports/financiers/dettes?universiteId=${universiteId}&annee=${selectedAnnee}`).catch(() => ({ data: [] })),
        api.get(`/api/rapports/financiers/taux-recouvrement?universiteId=${universiteId}`).catch(() => ({ data: [] })),
        api.get(`/api/rapports/financiers/par-faculte?universiteId=${universiteId}`).catch(() => ({ data: [] })),
        api.get(`/api/rapports/financiers/evolution?universiteId=${universiteId}`).catch(() => ({ data: [] })),
        api.get(`/api/rapports/financiers/previsions?universiteId=${universiteId}`).catch(() => ({ data: [] })),
      ]);
      setDettes(dettesRes.data || []);
      setRecouvrement(recouvrementRes.data || []);
      setFaculte(faculteRes.data || []);
      setEvolution(evolutionRes.data || []);
      setPrevisions(previsionsRes.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des rapports financiers');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return '-';
    return Number(amount).toLocaleString('fr-FR', { style: 'currency', currency: 'USD' });
  };

  const getTauxColor = (taux) => taux >= 80 ? '#1D9E75' : taux >= 50 ? '#854F0B' : '#cc0000';

  const tabs = [
    { id: 'dettes', label: 'Dettes étudiantes', icon: '💸' },
    { id: 'recouvrement', label: 'Taux de recouvrement', icon: '📈' },
    { id: 'faculte', label: 'Par faculté', icon: '🏛️' },
    { id: 'evolution', label: 'Évolution', icon: '📊' },
    { id: 'previsions', label: 'Prévisions', icon: '🔮' },
  ];

  if (loading) return (
    <div className="page">
      <div className="loading">Chargement des rapports financiers...</div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Rapports Financiers</h1>
          <p className="page-sub">
            Analyse détaillée de la situation financière de l'université
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={selectedAnnee}
            onChange={e => setSelectedAnnee(Number(e.target.value))}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }}
          >
            {annees.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button className="btn-outline" onClick={loadData} style={{ fontSize: 12 }}>🔄 Actualiser</button>
        </div>
      </div>

      {error && <div className="alert-erreur">{error}</div>}

      {/* Onglets */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'btn-primary' : 'btn-outline'}
              onClick={() => setActiveTab(tab.id)}
              style={{ fontSize: 12 }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Onglet Dettes étudiantes */}
      {activeTab === 'dettes' && (
        <div className="card">
          <h2 className="card-title">Dettes étudiantes — Année {selectedAnnee}</h2>
          {dettes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
              Aucune dette étudiante enregistrée.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Matricule</th>
                  <th>Promotion</th>
                  <th>Montant dû</th>
                  <th>Montant payé</th>
                  <th>Lsoldé</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {dettes.map(d => (
                  <tr key={d.id}>
                    <td>{d.etudiant?.nom || '-'} {d.etudiant?.prenom || ''}</td>
                    <td className="uni-code">{d.matricule || d.inscription?.matricule || '-'}</td>
                    <td>{d.promotion?.libelle || d.inscription?.promotion?.libelle || '-'}</td>
                    <td>{formatAmount(d.montantDu)}</td>
                    <td>{formatAmount(d.montantPaye)}</td>
                    <td>{formatAmount((Number(d.montantDu) || 0) - (Number(d.montantPaye) || 0))}</td>
                    <td>
                      <span className={`badge ${
                        (Number(d.montantDu) || 0) - (Number(d.montantPaye) || 0) === 0
                          ? 'badge-success'
                          : 'badge-danger'
                      }`}>
                        {(Number(d.montantDu) || 0) - (Number(d.montantPaye) || 0) === 0 ? 'Soldé' : 'En dette'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Onglet Taux de recouvrement */}
      {activeTab === 'recouvrement' && (
        <div className="card">
          <h2 className="card-title">Taux de recouvrement par promotion</h2>
          {recouvrement.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
              Aucune donnée disponible.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Promotion</th>
                  <th>Total dû</th>
                  <th>Total payé</th>
                  <th>Recouvré</th>
                  <th>Encaissé</th>
                </tr>
              </thead>
              <tbody>
                {recouvrement.map(r => {
                  const taux = Number(r.tauxRecouvrement) || 0;
                  return (
                    <tr key={r.promotion || r.id}>
                      <td>{r.promotion || '-'}</td>
                      <td>{formatAmount(r.totalDu)}</td>
                      <td>{formatAmount(r.totalPaye)}</td>
                      <td style={{ color: getTauxColor(taux), fontWeight: 600 }}>{taux}%</td>
                      <td>{formatAmount(r.encaisse)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Onglet Par faculté */}
      {activeTab === 'faculte' && (
        <div className="card">
          <h2 className="card-title">Répartition par faculté</h2>
          {faculte.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
              Aucune donnée disponible.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Faculté / Département</th>
                  <th>Total encaissé</th>
                  <th>Total dû</th>
                  <th>Taux de recouvrement</th>
                </tr>
              </thead>
              <tbody>
                {faculte.map(f => (
                  <tr key={f.departement || f.id}>
                    <td>{f.departement || f.nom || '-'}</td>
                    <td>{formatAmount(f.totalEncaisse)}</td>
                    <td>{formatAmount(f.totalDu)}</td>
                    <td style={{ color: getTauxColor(Number(f.tauxRecouvrement) || 0) }}>
                      {Number(f.tauxRecouvrement) || 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Onglet Évolution */}
      {activeTab === 'evolution' && (
        <div className="card">
          <h2 className="card-title">Évolution financière</h2>
          {evolution.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
              Aucune donnée disponible.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mois</th>
                  <th>Encaissé</th>
                  <th>Décaissé</th>
                  <th>Résultat net</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {evolution.map(e => (
                  <tr key={e.mois || e.period || e.id}>
                    <td>{e.mois || e.period || '-'}</td>
                    <td>{formatAmount(e.encaisse)}</td>
                    <td>{formatAmount(e.decaisse)}</td>
                    <td style={{ color: (Number(e.encaisse) || 0) - (Number(e.decaisse) || 0) >= 0 ? '#1D9E75' : '#cc0000' }}>
                      {formatAmount((Number(e.encaisse) || 0) - (Number(e.decaisse) || 0))}
                    </td>
                    <td>{formatAmount(e.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Onglet Prévisions */}
      {activeTab === 'previsions' && (
        <div className="card">
          <h2 className="card-title">Prévisions budgétaires</h2>
          {previsions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
              Aucune prévision disponible.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Compte / Catégorie</th>
                  <th>Prévisionnel</th>
                  <th>Réel</th>
                  <th>Écart</th>
                </tr>
              </thead>
              <tbody>
                {previsions.map(p => (
                  <tr key={p.id || p.compte}>
                    <td>{p.libelle || p.compte || '-'}</td>
                    <td>{formatAmount(p.previsionnel)}</td>
                    <td>{formatAmount(p.reel)}</td>
                    <td style={{ color: (Number(p.reel) || 0) - (Number(p.previsionnel) || 0) >= 0 ? '#cc0000' : '#1D9E75' }}>
                      {formatAmount((Number(p.reel) || 0) - (Number(p.previsionnel) || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
