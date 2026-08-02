// src/pages/rh/GestionPaieRH.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function GestionPaieRH() {
  const { user } = useAuth();
  const [personnel, setPersonnel] = useState([]);
  const [bulletins, setBulletins] = useState([]);
  const [enAttente, setEnAttente] = useState([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState('');
  const [mois, setMois] = useState('');
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [generationAutoLoading, setGenerationAutoLoading] = useState(false);
  const [genTousModal, setGenTousModal] = useState(false);

  const universiteId = user?.universiteId;

  useEffect(() => {
    if (universiteId) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [universiteId]);

  const loadData = async () => {
    try {
      const [persoRes, attenteRes] = await Promise.all([
        api.get(`/api/rh/personnel/universite/${universiteId}`),
        api.get(`/api/rh/paie/en-attente-validation?universiteId=${universiteId}`),
      ]);
      setPersonnel(persoRes.data || []);
      setEnAttente(attenteRes.data || []);
      // NOTE : il n'existe pas d'endpoint backend pour lister tous les bulletins de paie
      // d'une université (seulement /api/rh/paie/personnel/{id}). On reconstitue donc un
      // historique en agrégeant les bulletins par employé (limité aux 100 premiers pour
      // éviter un trop grand nombre de requêtes sur une grande université).
      const bulletinsParPersonnel = await Promise.all(
        (persoRes.data || []).slice(0, 100).map(p =>
          api.get(`/api/rh/paie/personnel/${p.id}`).then(r => r.data || []).catch(() => [])
        )
      );
      setBulletins(bulletinsParPersonnel.flat().sort((a, b) => (b.id || 0) - (a.id || 0)));
    } catch (err) {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const genererBulletin = async () => {
    if (!selectedPersonnel || !mois) {
      setError('Veuillez sélectionner un employé et un mois');
      return;
    }
    try {
      await api.post('/api/rh/paie/generer', {
        personnelId: parseInt(selectedPersonnel),
        mois,
        annee: parseInt(annee),
      });
      setMessage('✅ Bulletin généré avec succès');
      loadData();
      setSelectedPersonnel('');
      setMois('');
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur');
    }
  };

  const genererPourTous = () => {
    if (!mois) {
      setError('Veuillez sélectionner un mois');
      return;
    }
    setGenTousModal(true);
  };

  const confirmerGenTous = async () => {
    setGenTousModal(false);
    setGenerationAutoLoading(true);
    setError('');
    try {
      // Pas d'endpoint backend de génération en masse : on appelle la génération
      // unitaire existante pour chaque employé.
      const resultats = await Promise.allSettled(
        personnel.map(p =>
          api.post('/api/rh/paie/generer', { personnelId: p.id, mois, annee: parseInt(annee) })
        )
      );
      const succes = resultats.filter(r => r.status === 'fulfilled').length;
      const echecs = resultats.length - succes;
      if (echecs === 0) {
        setMessage(`✅ ${succes} bulletin(s) généré(s) pour ${mois} ${annee}`);
      } else {
        setMessage(`✅ ${succes} bulletin(s) généré(s), ${echecs} échec(s) (déjà générés ou incomplets)`);
      }
      loadData();
    } catch (err) {
      setError('Erreur lors de la génération en masse');
    } finally {
      setGenerationAutoLoading(false);
    }
  };

  const telechargerPdf = async (id) => {
    try {
      const response = await api.get(`/api/rh/paie/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bulletin_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erreur de téléchargement');
    }
  };

  const marquerPaye = async (id) => {
    try {
      await api.patch(`/api/rh/paie/${id}/payer`);
      setMessage('✅ Bulletin marqué comme payé');
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur');
    }
  };

  const getStatutBadge = (statut) => {
    const map = {
      EN_ATTENTE: 'badge-warning',
      VALIDE: 'badge-success',
      REJETE: 'badge-danger',
      PAYE: 'badge-success',
    };
    return map[statut] || 'badge-neutral';
  };

  const getStatutLabel = (statut) => {
    const map = {
      EN_ATTENTE: '⏳ En attente',
      VALIDE: '✅ Validé',
      REJETE: '❌ Rejeté',
      PAYE: '💰 Payé',
    };
    return map[statut] || statut;
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">💰 Gestion de la paie</h1>
          <p className="page-sub">Générez, validez et gérez les bulletins de paie</p>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      {/* En attente de validation */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 className="card-title">⏳ Bulletins en attente de validation ({enAttente.length})</h2>
        {enAttente.length === 0 ? (
          <p>Aucun bulletin en attente.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Employé</th>
                <th>Mois</th>
                <th>Net à payer</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enAttente.map(v => (
                <tr key={v.id}>
                  <td>{v.paie.numeroBulletin}</td>
                  <td>{v.paie.personnel.prenom} {v.paie.personnel.nom}</td>
                  <td>{v.paie.mois} {v.paie.annee}</td>
                  <td>{v.paie.netAPayer} USD</td>
                  <td><span className={`badge ${getStatutBadge(v.paie.statut)}`}>{getStatutLabel(v.paie.statut)}</span></td>
                  <td>
                    <button className="btn-outline" style={{ fontSize: 11 }} onClick={() => telechargerPdf(v.paie.id)}>
                      📥 PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Générer un bulletin */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 className="card-title">📄 Générer un bulletin</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Employé</label>
            <select value={selectedPersonnel} onChange={e => setSelectedPersonnel(e.target.value)}>
              <option value="">-- Sélectionner --</option>
              {personnel.map(p => (
                <option key={p.id} value={p.id}>{p.prenom} {p.nom} ({p.matriculePersonnel})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Mois</label>
            <select value={mois} onChange={e => setMois(e.target.value)}>
              <option value="">-- Mois --</option>
              {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Année</label>
            <input type="number" value={annee} onChange={e => setAnnee(parseInt(e.target.value))} />
          </div>
          <button className="btn-primary" onClick={genererBulletin} style={{ alignSelf: 'flex-end' }}>
            🚀 Générer le bulletin
          </button>
          <button className="btn-outline" onClick={genererPourTous} disabled={generationAutoLoading} style={{ alignSelf: 'flex-end' }}>
            {generationAutoLoading ? '⏳ Génération...' : '📦 Pour tous les employés'}
          </button>
        </div>
      </div>

      {/* Historique des bulletins */}
      <div className="card">
        <h2 className="card-title">📋 Historique des bulletins</h2>
        {bulletins.length === 0 ? (
          <p>Aucun bulletin généré.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Employé</th>
                <th>Mois</th>
                <th>Net</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bulletins.map(p => (
                <tr key={p.id}>
                  <td>{p.numeroBulletin}</td>
                  <td>{p.personnel.prenom} {p.personnel.nom}</td>
                  <td>{p.mois} {p.annee}</td>
                  <td>{p.netAPayer} USD</td>
                  <td><span className={`badge ${getStatutBadge(p.statut)}`}>{getStatutLabel(p.statut)}</span></td>
                  <td>
                    <button className="btn-outline" style={{ fontSize: 11, marginRight: 4 }} onClick={() => telechargerPdf(p.id)}>
                      📥 PDF
                    </button>
                    {p.statut === 'EN_ATTENTE' && (
                      <button className="btn-success" style={{ fontSize: 11 }} onClick={() => marquerPaye(p.id)}>
                        💰 Payer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {genTousModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 420, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>📋 Génération en masse</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>
              Générer les bulletins pour <strong>tous les employés</strong> pour {mois} {annee} ?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setGenTousModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={confirmerGenTous}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}