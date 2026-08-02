// src/pages/admin/GestionSocialeAdmin.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import DossierDetailModal from '../social/DossierDetailModal';
import '../Dashboard.css';

export default function GestionSocialeAdmin() {
  const { user } = useAuth();
  const [dossiers, setDossiers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('EN_ATTENTE');
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejetModal, setRejetModal] = useState({ open: false, id: null, motif: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const universiteId = user?.universiteId;

  useEffect(() => {
    if (universiteId) loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [universiteId, filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, dossiersRes] = await Promise.all([
        api.get(`/api/social/stats/${universiteId}`),
        api.get(`/api/social/dossiers/statut/${filter}?universiteId=${universiteId}`)
      ]);
      setStats(statsRes.data);
      setDossiers(dossiersRes.data);
    } catch (err) {
      setError('Erreur chargement des données sociales');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action, commentaire = '') => {
    try {
      let endpoint = '';
      let payload = {};
      switch (action) {
        case 'ETUDIER':
          endpoint = `/api/social/dossiers/${id}/statut`;
          payload = { statut: 'EN_ETUDE', commentaire: commentaire || 'Passé en étude', adminId: user.id };
          break;
        case 'VALIDER':
          endpoint = `/api/social/dossiers/${id}/statut`;
          payload = { statut: 'VALIDE', commentaire: commentaire || 'Dossier validé', adminId: user.id };
          break;
        case 'REJETER':
          endpoint = `/api/social/dossiers/${id}/statut`;
          payload = { statut: 'REJETE', commentaire: commentaire || 'Dossier rejeté', adminId: user.id };
          break;
        default:
          return;
      }
      await api.patch(endpoint, payload);
      setMessage(`✅ Dossier ${action === 'ETUDIER' ? 'passé en étude' : action === 'VALIDER' ? 'validé' : 'rejeté'} avec succès`);
      setShowModal(false);
      setSelectedDossier(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de l\'action');
    }
  };

  const handleRejeter = (id) => setRejetModal({ open: true, id, motif: '' });

  const confirmerRejet = () => {
    if (!rejetModal.motif.trim()) { setError('Veuillez saisir un motif.'); return; }
    const id = rejetModal.id;
    setRejetModal({ open: false, id: null, motif: '' });
    handleAction(id, 'REJETER', rejetModal.motif);
  };

  const openDossier = (dossier) => {
    setSelectedDossier(dossier);
    setShowModal(true);
  };

  const getStatutBadge = (statut) => {
    const map = {
      'EN_ATTENTE': 'badge-warning',
      'EN_ETUDE': 'badge-warning',
      'VALIDE': 'badge-success',
      'REJETE': 'badge-danger'
    };
    return map[statut] || 'badge-neutral';
  };

  const getStatutLabel = (statut) => {
    const map = {
      'EN_ATTENTE': '⏳ En attente',
      'EN_ETUDE': '📋 En étude',
      'VALIDE': '✅ Validé',
      'REJETE': '❌ Rejeté'
    };
    return map[statut] || statut;
  };

  // Filtrer par recherche
  const filteredDossiers = dossiers.filter(d => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return d.etudiant?.prenom?.toLowerCase().includes(search) ||
           d.etudiant?.nom?.toLowerCase().includes(search) ||
           d.numeroDossier?.toLowerCase().includes(search) ||
           d.etudiant?.email?.toLowerCase().includes(search);
  });

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏥 Service Social</h1>
          <p className="page-sub">Gérez les dossiers sociaux, bourses et aides</p>
        </div>
        <button className="btn-outline" onClick={loadData}>🔄 Rafraîchir</button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.totalDossiers || 0}</div>
          <div className="stat-label">Total dossiers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--color-danger-text)' }}>{stats?.enAttente || 0}</div>
          <div className="stat-label">En attente</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--color-success-text)' }}>{stats?.boursesActives || 0}</div>
          <div className="stat-label">Bourses actives</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.montantTotalBourses?.toLocaleString() || 0} USD</div>
          <div className="stat-label">Montant total bourses</div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className={`btn-outline ${filter === 'EN_ATTENTE' ? 'active' : ''}`}
            onClick={() => setFilter('EN_ATTENTE')}
            style={{ background: filter === 'EN_ATTENTE' ? '#0B1F4A' : '', color: filter === 'EN_ATTENTE' ? 'white' : '' }}
          >
            En attente
          </button>
          <button
            className={`btn-outline ${filter === 'EN_ETUDE' ? 'active' : ''}`}
            onClick={() => setFilter('EN_ETUDE')}
            style={{ background: filter === 'EN_ETUDE' ? '#0B1F4A' : '', color: filter === 'EN_ETUDE' ? 'white' : '' }}
          >
            En étude
          </button>
          <button
            className={`btn-outline ${filter === 'VALIDE' ? 'active' : ''}`}
            onClick={() => setFilter('VALIDE')}
            style={{ background: filter === 'VALIDE' ? '#0B1F4A' : '', color: filter === 'VALIDE' ? 'white' : '' }}
          >
            Validés
          </button>
          <button
            className={`btn-outline ${filter === 'REJETE' ? 'active' : ''}`}
            onClick={() => setFilter('REJETE')}
            style={{ background: filter === 'REJETE' ? '#0B1F4A' : '', color: filter === 'REJETE' ? 'white' : '' }}
          >
            Rejetés
          </button>
          <div style={{ flex: 1, minWidth: 200, marginLeft: 10 }}>
            <input
              type="text"
              placeholder="🔍 Rechercher par nom, dossier..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
            />
          </div>
        </div>
      </div>

      {/* Liste des dossiers */}
      <div className="card">
        <h2 className="card-title">
          Dossiers {filter !== '' ? `(${getStatutLabel(filter)})` : ''}
          <span style={{ fontSize: 12, marginLeft: 10, color: 'var(--text-muted)' }}>({filteredDossiers.length})</span>
        </h2>
        {filteredDossiers.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucun dossier trouvé.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>N° Dossier</th>
                <th>Étudiant</th>
                <th>Matricule</th>
                <th>Demande bourse</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDossiers.map(d => (
                <tr key={d.id}>
                  <td className="uni-code">{d.numeroDossier}</td>
                  <td>{d.etudiant?.prenom} {d.etudiant?.nom}</td>
                  <td>{d.inscription?.matricule}</td>
                  <td>{d.demandeBourse ? '✅' : '❌'}</td>
                  <td>{new Date(d.creeLe).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <span className={`badge ${getStatutBadge(d.statut)}`}>
                      {getStatutLabel(d.statut)}
                    </span>
                  </td>
                  <td>
                    <button className="btn-outline" style={{ fontSize: 11 }} onClick={() => openDossier(d)}>
                      📋 Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && selectedDossier && (
        <DossierDetailModal
          dossier={selectedDossier}
          onClose={() => { setShowModal(false); setSelectedDossier(null); }}
          onValider={(id) => handleAction(id, 'VALIDER')}
          onRejeter={(id) => handleRejeter(id)}
          onEtudier={(id) => handleAction(id, 'ETUDIER')}
          onRefresh={loadData}
        />
      )}

      {rejetModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 400, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>❌ Motif du rejet</h3>
            <textarea
              rows={4}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Expliquez la raison du rejet du dossier social..."
              value={rejetModal.motif}
              onChange={e => setRejetModal(m => ({ ...m, motif: e.target.value }))}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setRejetModal({ open: false, id: null, motif: '' })}>Annuler</button>
              <button className="btn-danger" onClick={confirmerRejet}>Confirmer le rejet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}