// src/pages/superadmin/SuperAdminDashboard.jsx
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useDesign } from '../../context/DesignContext';
import SuperAdminDashboardPremium from './SuperAdminDashboardPremium';
import { resolveFileUrl } from '../../utils/fileUrl';
import StatsChart from '../../components/StatsChart';
import ErrorDisplay from '../../components/common/ErrorDisplay';
import PasswordConfirmModal from '../../components/PasswordConfirmModal';
import ModifierUniversiteModal from '../../components/superadmin/ModifierUniversiteModal';
import QuickActionsGrid from '../../components/QuickActionsGrid';
import '../Dashboard.css';
import './SuperAdminDashboard.css';
import {
  FaUniversity, FaBook, FaUserGraduate, FaMoneyBillWave, FaPlusCircle,
  FaEdit, FaTrash,
} from 'react-icons/fa';
import axios from 'axios'; // ← IMPORT AJOUTÉ

const UNIVERSITES_LOGOS = {
  'UNIKIN':  '/assets/UNIKIN.png',
  'UPN':     '/assets/UPN.png',
  'HEC-KIN' :    '/assets/HEC-KIN.png',
  'ISIPA':   '/assets/ISIPA.png',
  'ISP':     '/assets/ISP.jpg',
  'REV KIM': '/assets/REV_KIM.jpg',
  'UCC':     '/assets/UCC.jpg',
  'UNILU':   '/assets/UNILU.jpg',
  'UNIGOM':  '/assets/UNIGOM.jpg',
  'UNIKIS':  '/assets/UNIKIS.png',
  'UNISIC':  '/assets/UNISIC.png',
  'UPC':     '/assets/UPC.png',
};

// Logo d'université avec repli sûr : logo réellement uploadé
// (universite.logo) → mapping connu → initiales. L'état React (et non une
// mutation directe du DOM dans onError) évite toute boucle de rechargement.
function UniLogoCell({ uni }) {
  const [imgError, setImgError] = useState(false);
  const logoSrc = resolveFileUrl(uni.logo) || UNIVERSITES_LOGOS[uni.code];

  if (logoSrc && !imgError) {
    return (
      <img
        src={logoSrc}
        alt={uni.nom}
        style={{ width: '36px', height: '36px', objectFit: 'contain' }}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div style={{
      width: '36px', height: '36px', borderRadius: '8px',
      background: '#0B1F4A', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '11px', fontWeight: 700, flexShrink: 0,
    }}>
      {(uni.code || uni.nom || '?').slice(0, 3).toUpperCase()}
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { user, hasRole } = useAuth(); // ← hasRole ajouté
  const { design } = useDesign();
  const [stats, setStats] = useState({
    totalUniversites: 0,
    totalDepartements: 0,
    totalEtudiants: 0,
    totalPaiements: 0
  });
  const [universites, setUniversites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anneeGraph, setAnneeGraph] = useState(2026);
  const [error, setError] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [editPasswordModal, setEditPasswordModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, universitesRes] = await Promise.all([
        api.get('/api/super-admin/stats'),
        api.get('/api/universites/public')
      ]);
      setStats(statsRes.data || {});
      setUniversites(universitesRes.data || []);
      setError('');
    } catch (err) {
      // Ignorer les annulations
      if (axios.isCancel(err) || err.code === 'ERR_CANCELED' || err.name === 'CanceledError') {
        return;
      }
      console.error(err);
      setError("Impossible de charger les données du tableau de bord.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleInscriptions = async (id) => {
    try {
      await api.patch(`/api/universites/${id}/inscriptions`);
      const universitesRes = await api.get('/api/universites/public');
      setUniversites(universitesRes.data);
      toast.success('Statut des inscriptions mis à jour');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const confirmerSuppression = async () => {
    await api.delete(`/api/universites/${deleteModal.id}/definitivement`);
    toast.success(`${deleteModal.nom} a été supprimée définitivement.`);
    loadData();
  };

  // eslint-disable-next-line require-await -- onConfirm de PasswordConfirmModal attend une fonction async
  const debloquerEdition = async () => {
    setEditModal(editPasswordModal);
  };

  // Vérification du rôle
  if (user && !hasRole('SUPER_ADMIN')) {
    return <div className="dashboard-content">Accès refusé : vous n'avez pas les droits super-admin.</div>;
  }

  if (loading) return <div className="loading">Chargement...</div>;

  if (error && universites.length === 0) {
    return (
      <div className="dashboard-content">
        <ErrorDisplay message={error} onRetry={loadData} />
      </div>
    );
  }


  // Modales partagées par les deux designs (édition / suppression d'université).
  const modals = (
    <>
      {editPasswordModal && (
        <PasswordConfirmModal
          title={`Modifier ${editPasswordModal.nom}`}
          message="Confirmez votre mot de passe pour accéder au formulaire de modification."
          confirmLabel="Continuer"
          onConfirm={debloquerEdition}
          onClose={() => setEditPasswordModal(null)}
        />
      )}
      {editModal && (
        <ModifierUniversiteModal
          universite={editModal}
          onClose={() => setEditModal(null)}
          onSaved={() => { toast.success('Université mise à jour.'); loadData(); }}
        />
      )}
      {deleteModal && (
        <PasswordConfirmModal
          title={`Supprimer ${deleteModal.nom}`}
          message={`Cette action supprimera définitivement "${deleteModal.nom}" ainsi que tous ses départements, promotions et inscriptions rattachés. Cette action est irréversible.`}
          confirmLabel="Supprimer définitivement"
          danger
          onConfirm={confirmerSuppression}
          onClose={() => setDeleteModal(null)}
        />
      )}
    </>
  );

  // ── Variante « premium » (opt-in, réversible) ──────────────────────────
  if (design === 'premium') {
    return (
      <>
        <SuperAdminDashboardPremium
          user={user}
          stats={stats}
          universites={universites}
          onToggleInscriptions={toggleInscriptions}
          onEdit={setEditPasswordModal}
          onDelete={setDeleteModal}
        />
        {modals}
      </>
    );
  }

  return (
    <div className="dashboard-layout">
      <div className="dashboard-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">🏛️ Super Administration GENUC</h1>
            <p className="page-sub">
              Bienvenue, {user?.nomComplet || user?.email || 'Super Admin'} — Vue nationale
            </p>
          </div>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#E6F1FB' }}><FaUniversity size={32} /></div>
            <div>
              <div className="stat-value">{stats.totalUniversites}</div>
              <div className="stat-label">Universités</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#E1F5EE' }}><FaBook size={32} /></div>
            <div>
              <div className="stat-value">{stats.totalDepartements}</div>
              <div className="stat-label">Départements</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#FAEEDA' }}><FaUserGraduate size={32} /></div>
            <div>
              <div className="stat-value">{(stats.totalEtudiants || 0).toLocaleString()}</div>
              <div className="stat-label">Étudiants</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#FBEAF0' }}><FaMoneyBillWave size={32} /></div>
            <div>
              <div className="stat-value">{(stats.totalPaiements || 0).toLocaleString()} USD</div>
              <div className="stat-label">Paiements</div>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-head"><h2 className="card-title">⚡ Actions rapides</h2></div>
          <QuickActionsGrid
            actions={[
              { icon: '🏛️', label: 'Enregistrer une université', to: '/superadmin/enregistrement-universite', color: '#185FA5', bg: '#E6F1FB', description: 'Ajouter une nouvelle université à la plateforme nationale.', applyLabel: 'Ouvrir le formulaire' },
              { icon: '🎓', label: 'Universités', to: '/universites', color: '#1D9E75', bg: '#E1F5EE', description: 'Consulter et gérer les universités.', applyLabel: 'Ouvrir les universités' },
              { icon: '📋', label: 'Dossiers', to: '/admin/dossiers', color: '#854F0B', bg: '#FAEEDA', description: 'Consulter les dossiers d\'inscription.', applyLabel: 'Ouvrir les dossiers' },
              { icon: '🏆', label: 'Palmarès', to: '/admin/generer-palmares', color: '#6B21A8', bg: '#F3E8FF', description: 'Générer le palmarès national.', applyLabel: 'Ouvrir le palmarès' },
            ]}
          />
        </div>

        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">📊 Évolution annuelle</h2>
            <select className="year-selector" value={anneeGraph} onChange={e => setAnneeGraph(parseInt(e.target.value))}>
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
          <StatsChart annee={anneeGraph} />
        </div>

        <div className="card">
          <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">🏛️ Universités connectées</h2>
            <Link to="/superadmin/enregistrement-universite" className="btn-ajout-universite">
              <FaPlusCircle size={22} />
              <span>Ajouter une université</span>
            </Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Code</th>
                <th>Nom</th>
                <th>Ville</th>
                <th>Statut inscriptions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {universites.map(uni => (
                <tr key={uni.id}>
                  <td>
                    <UniLogoCell uni={uni} />
                  </td>
                  <td className="uni-code">{uni.code || '—'}</td>
                  <td style={{ fontWeight: '500' }}>{uni.nom}</td>
                  <td>{uni.ville}</td>
                  <td>
                    <span className={`badge ${uni.inscriptionsOuvertes ? 'badge-success' : 'badge-neutral'}`}>
                      {uni.inscriptionsOuvertes ? 'Ouvertes' : 'Fermées'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <Link to={`/admin/universite/${uni.id}`} className="btn-outline" style={{ fontSize: '11px', textDecoration: 'none' }}>
                        Gérer
                      </Link>
                      <button className="btn-outline" style={{ fontSize: '11px' }} onClick={() => toggleInscriptions(uni.id)}>
                        {uni.inscriptionsOuvertes ? 'Fermer' : 'Ouvrir'}
                      </button>
                      <button
                        className="btn-outline"
                        style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        onClick={() => setEditPasswordModal(uni)}
                        title="Modifier les informations, le logo et l'autorité"
                      >
                        <FaEdit size={11} /> Modifier
                      </button>
                      <button
                        className="btn-danger"
                        style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        onClick={() => setDeleteModal(uni)}
                        title="Supprimer définitivement cette université"
                      >
                        <FaTrash size={11} /> Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modals}
    </div>
  );
}