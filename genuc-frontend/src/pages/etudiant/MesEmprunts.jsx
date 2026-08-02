// src/pages/etudiant/MesEmprunts.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function MesEmprunts() {
  const { user } = useAuth();
  const [emprunts, setEmprunts] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ actifs: 0, retards: 0, penalites: 0 });
  const [prolongerModal, setProlongerModal] = useState({ open: false, empruntId: null, jours: '7' });
  const [annulerResModal, setAnnulerResModal] = useState({ open: false, id: null });

  const etudiantId = user?.inscriptionId ? user.inscriptionId : null;

  useEffect(() => {
    if (etudiantId) loadEmprunts();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [etudiantId]);

  const loadEmprunts = async () => {
    try {
      setLoading(true);
      const [empruntsRes, reservationsRes] = await Promise.all([
        api.get(`/api/bibliotheque/mes-emprunts/${etudiantId}`),
        api.get(`/api/bibliotheque/avancee/mes-reservations/${etudiantId}`).catch(() => ({ data: [] }))
      ]);
      const empruntsData = empruntsRes.data || [];
      setEmprunts(empruntsData);
      setReservations(reservationsRes.data || []);

      // Calculer les stats
      const actifs = empruntsData.filter(e => e.statut === 'EN_COURS').length;
      const retards = empruntsData.filter(e => e.statut === 'EN_COURS' && e.enRetard).length;
      const penalites = empruntsData.reduce((sum, e) => sum + (e.penalite || 0), 0);
      setStats({ actifs, retards, penalites });
    } catch (err) {
      setError('Erreur chargement des emprunts');
    } finally {
      setLoading(false);
    }
  };

  const retourner = async (empruntId) => {
    try {
      await api.put(`/api/bibliotheque/retourner/${empruntId}`);
      setMessage('✅ Livre retourné avec succès !');
      loadEmprunts();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors du retour');
    }
  };

  const prolonger = (empruntId) => setProlongerModal({ open: true, empruntId, jours: '7' });

  const confirmerProlongation = async () => {
    const jours = parseInt(prolongerModal.jours, 10);
    if (isNaN(jours) || jours < 1 || jours > 14) {
      setError('Veuillez entrer un nombre de jours entre 1 et 14.');
      return;
    }
    const { empruntId } = prolongerModal;
    setProlongerModal({ open: false, empruntId: null, jours: '7' });
    try {
      await api.patch(`/api/bibliotheque/prolonger/${empruntId}?jours=${jours}`);
      setMessage(`✅ Emprunt prolongé de ${jours} jour(s) !`);
      loadEmprunts();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la prolongation');
    }
  };

  const annulerReservation = (reservationId) => setAnnulerResModal({ open: true, id: reservationId });

  const confirmerAnnulerRes = async () => {
    const id = annulerResModal.id;
    setAnnulerResModal({ open: false, id: null });
    try {
      await api.delete(`/api/bibliotheque/reservations/${id}/annuler`);
      setMessage('✅ Réservation annulée');
      loadEmprunts();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur');
    }
  };

  const getStatutBadge = (statut, enRetard = false) => {
    if (statut === 'RENDU') return 'badge-neutral';
    if (statut === 'PERDU') return 'badge-danger';
    if (enRetard) return 'badge-danger';
    return 'badge-success';
  };

  const getStatutLabel = (statut, enRetard = false) => {
    if (statut === 'RENDU') return '✅ Rendu';
    if (statut === 'PERDU') return '❌ Perdu';
    if (enRetard) return '⛔ En retard';
    return '📖 En cours';
  };

  const getPenaliteColor = (penalite) => {
    if (penalite > 0) return '#cc0000';
    return '#888';
  };

  if (loading) return <div className="loading">Chargement de vos emprunts...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📖 Mes emprunts</h1>
          <p className="page-sub">Consultez et gérez vos emprunts et réservations</p>
        </div>
        <button className="btn-outline" onClick={loadEmprunts}>🔄 Rafraîchir</button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.actifs}</div>
          <div className="stat-label">Emprunts en cours</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: stats.retards > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}>
            {stats.retards}
          </div>
          <div className="stat-label">En retard</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: getPenaliteColor(stats.penalites) }}>
            {stats.penalites.toFixed(2)} USD
          </div>
          <div className="stat-label">Pénalités totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{reservations.length}</div>
          <div className="stat-label">Réservations actives</div>
        </div>
      </div>

      {/* Liste des emprunts */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 className="card-title">📋 Emprunts en cours</h2>
        {emprunts.filter(e => e.statut === 'EN_COURS').length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
            Aucun emprunt en cours.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ouvrage</th>
                <th>Date emprunt</th>
                <th>Retour prévu</th>
                <th>Statut</th>
                <th>Pénalité</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {emprunts.filter(e => e.statut === 'EN_COURS').map(e => {
                const enRetard = e.enRetard || (new Date(e.dateRetourPrevue) < new Date());
                return (
                  <tr key={e.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{e.livre?.titre}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.livre?.auteur}</div>
                    </td>
                    <td>{new Date(e.dateEmprunt).toLocaleDateString('fr-FR')}</td>
                    <td style={{ color: enRetard ? '#cc0000' : '#333' }}>
                      {new Date(e.dateRetourPrevue).toLocaleDateString('fr-FR')}
                      {enRetard && <span className="badge badge-danger" style={{ marginLeft: 8, fontSize: 10 }}>⚠️ Retard</span>}
                    </td>
                    <td>
                      <span className={`badge ${getStatutBadge(e.statut, enRetard)}`}>
                        {getStatutLabel(e.statut, enRetard)}
                      </span>
                    </td>
                    <td style={{ color: getPenaliteColor(e.penalite || 0), fontWeight: 600 }}>
                      {e.penalite > 0 ? `${e.penalite.toFixed(2)} USD` : '-'}
                    </td>
                    <td>
                      {e.statut === 'EN_COURS' && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button className="btn-outline" style={{ fontSize: 11 }} onClick={() => retourner(e.id)}>
                            Retourner
                          </button>
                          {!enRetard && (
                            <button className="btn-outline" style={{ fontSize: 11 }} onClick={() => prolonger(e.id)}>
                              Prolonger
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Historique des emprunts */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 className="card-title">📜 Historique des emprunts</h2>
        {emprunts.filter(e => e.statut === 'RENDU').length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
            Aucun historique d'emprunt.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ouvrage</th>
                <th>Date retour</th>
                <th>Pénalité payée</th>
              </tr>
            </thead>
            <tbody>
              {emprunts.filter(e => e.statut === 'RENDU').slice(0, 10).map(e => (
                <tr key={e.id}>
                  <td>{e.livre?.titre}</td>
                  <td>{new Date(e.dateRetourReelle).toLocaleDateString('fr-FR')}</td>
                  <td style={{ color: e.penalite > 0 ? '#cc0000' : '#888' }}>
                    {e.penalite > 0 ? `${e.penalite.toFixed(2)} USD` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Réservations */}
      <div className="card">
        <h2 className="card-title">📥 Mes réservations</h2>
        {reservations.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
            Aucune réservation active.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ouvrage</th>
                <th>Date réservation</th>
                <th>Expiration</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(r => {
                const expiree = new Date(r.dateExpiration) < new Date();
                return (
                  <tr key={r.id}>
                    <td>{r.livre?.titre}</td>
                    <td>{new Date(r.dateReservation).toLocaleDateString('fr-FR')}</td>
                    <td style={{ color: expiree ? '#cc0000' : '#333' }}>
                      {new Date(r.dateExpiration).toLocaleDateString('fr-FR')}
                      {expiree && <span className="badge badge-danger" style={{ marginLeft: 8, fontSize: 10 }}>Expirée</span>}
                    </td>
                    <td>
                      <span className={`badge ${r.statut === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>
                        {r.statut}
                      </span>
                    </td>
                    <td>
                      {r.statut === 'ACTIVE' && !expiree && (
                        <button className="btn-danger" style={{ fontSize: 11 }} onClick={() => annulerReservation(r.id)}>
                          Annuler
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {annulerResModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 360, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>Annuler la réservation</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>Annuler cette réservation ? Vous perdrez votre place en attente.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setAnnulerResModal({ open: false, id: null })}>Non</button>
              <button className="btn-danger" onClick={confirmerAnnulerRes}>Oui, annuler</button>
            </div>
          </div>
        </div>
      )}

      {prolongerModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 360, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, color: 'var(--text-primary)' }}>📅 Prolonger l'emprunt</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)' }}>Nombre de jours supplémentaires (1–14) :</p>
            <input
              type="number"
              min="1"
              max="14"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 16, boxSizing: 'border-box', textAlign: 'center' }}
              value={prolongerModal.jours}
              onChange={e => setProlongerModal(m => ({ ...m, jours: e.target.value }))}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setProlongerModal({ open: false, empruntId: null, jours: '7' })}>Annuler</button>
              <button className="btn-primary" onClick={confirmerProlongation}>Prolonger</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}