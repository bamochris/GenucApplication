// src/pages/admin/AdminUniversiteDashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDesign } from '../../context/DesignContext';
import api from '../../api/axios';
import { resolveFileUrl } from '../../utils/fileUrl';
import AdminUniversiteDashboardPremium from './AdminUniversiteDashboardPremium';
import '../Dashboard.css';

import { FaBook, FaUserGraduate, FaChalkboardTeacher, FaClipboardList, FaPlus, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import AvatarUtilisateur from '../../components/AvatarUtilisateur';
import QuickActionsGrid from '../../components/QuickActionsGrid';

// Logo de l'université en tête de dashboard : logo uploadé → initiales.
function LogoUniversite({ universite }) {
  const [imgError, setImgError] = useState(false);
  const logoSrc = resolveFileUrl(universite?.logo);
  const initiales = (universite?.code || universite?.nom || 'U').slice(0, 3).toUpperCase();

  if (logoSrc && !imgError) {
    return (
      <img
        src={logoSrc}
        alt={`Logo ${universite?.nom || ''}`}
        onError={() => setImgError(true)}
        style={{
          width: 56, height: 56, objectFit: 'contain', flexShrink: 0,
          borderRadius: 12, background: '#fff', padding: 4,
          border: '1.5px solid var(--border-color)',
        }}
      />
    );
  }
  return (
    <div style={{
      width: 56, height: 56, borderRadius: 12, flexShrink: 0,
      background: 'linear-gradient(135deg, #185FA5, #0B1F4A)', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 16, fontWeight: 800, letterSpacing: '-0.5px',
    }}>
      {initiales}
    </div>
  );
}

export default function AdminUniversiteDashboard() {
  const { user } = useAuth();
  const { design } = useDesign();
  const [stats, setStats] = useState(null);
  const [universite, setUniversite] = useState(null);
  const [departements, setDepartements] = useState([]);
  const [inscriptionsEnAttente, setInscriptionsEnAttente] = useState([]);
  const [paiementsEnAttente, setPaiementsEnAttente] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [deptForm, setDeptForm] = useState({
    nom: '', code: '', type: 'DEPARTEMENT', description: ''
  });
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, []);

  const loadData = async () => {
    try {
      const universiteId = user?.universiteId;
      if (!universiteId) {
        console.error("Aucune université associée à cet utilisateur");
        setLoading(false);
        return;
      }

      const [statsRes, uniRes, deptsRes, inscriptionsRes, paiementsRes] = await Promise.all([
        api.get(`/api/universites/${universiteId}/stats`).catch(() => ({ data: null })),
        api.get(`/api/universites/public/${universiteId}`).catch(() => ({ data: null })),
        api.get(`/api/universites/public/${universiteId}/departements`).catch(() => ({ data: [] })),
        api.get(`/api/inscriptions/universite/${universiteId}/en-attente`).catch(() => ({ data: [] })),
        api.get(`/api/paiements/gestion/universite/${universiteId}`).catch(() => ({ data: [] }))
      ]);

      setStats(statsRes.data);
      setUniversite(uniRes.data);
      setDepartements(deptsRes.data || []);
      setInscriptionsEnAttente(inscriptionsRes.data || []);
      const tousLesPaiements = paiementsRes.data?.content || paiementsRes.data || [];
      setPaiementsEnAttente(Array.isArray(tousLesPaiements) ? tousLesPaiements.filter(p => p.statut === 'EN_ATTENTE' || p.statut === 'SOUMIS') : []);
    } catch (err) {
      console.error("Erreur chargement dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const ajouterDepartement = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/universites/${user.universiteId}/departements`, deptForm);
      setShowDeptForm(false);
      setDeptForm({ nom: '', code: '', type: 'DEPARTEMENT', description: '' });
      loadData();
      setFeedback({ type: 'success', message: 'Département ajouté avec succès' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.erreur || 'Erreur lors de l\'ajout' });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  if (loading) return (
    <div className="loading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border-color)', borderTopColor: '#185FA5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      Chargement du tableau de bord...
    </div>
  );

  const totalInscriptionsAttente = inscriptionsEnAttente.length;
  const totalPaiementsAttente = paiementsEnAttente.length;

  // ── Variante « premium » (opt-in, réversible) ──────────────────────────
  if (design === 'premium') {
    return (
      <AdminUniversiteDashboardPremium
        user={user}
        universite={universite}
        stats={stats}
        departements={departements}
        inscriptionsEnAttente={inscriptionsEnAttente}
        paiementsEnAttente={paiementsEnAttente}
      />
    );
  }

  return (
    <div className="page">
      {feedback && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '14px 20px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
          background: feedback.type === 'success' ? '#E1F5EE' : '#fff0f0',
          border: `1px solid ${feedback.type === 'success' ? '#b2dfdb' : '#ffcccc'}`,
          color: feedback.type === 'success' ? '#0F6E56' : '#cc0000',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 14, fontWeight: 500
        }}>
          {feedback.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
          {feedback.message}
        </div>
      )}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <LogoUniversite universite={universite} />
          <div style={{ minWidth: 0 }}>
            <h1 className="page-title" style={{ marginBottom: 2 }}>
              {universite?.nom || 'Administration Université'}
            </h1>
            <p className="page-sub" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
              <AvatarUtilisateur taille={22} />
              {user?.nomComplet || user?.email} — Administrateur
              {universite?.ville ? ` · ${universite.ville}` : ''}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={() => setShowDeptForm(!showDeptForm)}>
            {showDeptForm ? 'Annuler' : <><FaPlus /> Nouveau département</>}
          </button>
          <Link to="/admin/enseignants/ajouter" className="btn-outline">
            <FaChalkboardTeacher /> Nouvel enseignant
          </Link>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head"><h2 className="card-title">⚡ Actions rapides</h2></div>
        <QuickActionsGrid
          actions={[
            { icon: '📋', label: 'Dossiers d\'inscription', to: '/admin/dossiers', color: '#185FA5', bg: '#E6F1FB', description: 'Traiter les dossiers d\'inscription en attente.', applyLabel: 'Ouvrir les dossiers' },
            { icon: '👥', label: 'Utilisateurs', to: '/admin/utilisateurs', color: '#1D9E75', bg: '#E1F5EE', description: 'Gérer les comptes de l\'université.', applyLabel: 'Ouvrir les utilisateurs' },
            { icon: '⚖️', label: 'Délibérations', to: '/admin/deliberations', color: '#854F0B', bg: '#FAEEDA', description: 'Lancer et suivre les délibérations.', applyLabel: 'Ouvrir les délibérations' },
            { icon: '📊', label: 'Rapports', to: '/admin/rapports', color: '#6B21A8', bg: '#F3E8FF', description: 'Rapports et statistiques de l\'université.', applyLabel: 'Ouvrir les rapports' },
          ]}
        />
      </div>

      {showDeptForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">Ajouter un département</h2>
          <form onSubmit={ajouterDepartement} className="form-grid">
            <div className="form-group">
              <label>Nom *</label>
              <input 
                value={deptForm.nom} 
                onChange={e => setDeptForm({...deptForm, nom: e.target.value})} 
                required 
                placeholder="Ex: Faculté de Droit"
              />
            </div>
            <div className="form-group">
              <label>Code *</label>
              <input 
                value={deptForm.code} 
                onChange={e => setDeptForm({...deptForm, code: e.target.value.toUpperCase()})} 
                required 
                placeholder="Ex: DROIT"
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={deptForm.type} onChange={e => setDeptForm({...deptForm, type: e.target.value})}>
                <option value="FACULTE">Faculté</option>
                <option value="DEPARTEMENT">Département</option>
                <option value="SECTION">Section</option>
                <option value="INSTITUT">Institut</option>
                <option value="ECOLE">École</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Description</label>
              <textarea 
                value={deptForm.description} 
                onChange={e => setDeptForm({...deptForm, description: e.target.value})} 
                rows="3"
                placeholder="Description du département"
              />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>
              Enregistrer le département
            </button>
          </form>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E6F1FB' }}><FaBook size={32} /></div>
          <div>
            <div className="stat-value">{stats?.nbDepartements || 0}</div>
            <div className="stat-label">Départements</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E1F5EE' }}><FaUserGraduate size={32} /></div>
          <div>
            <div className="stat-value">{stats?.nbEtudiants || 0}</div>
            <div className="stat-label">Étudiants</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FAEEDA' }}><FaChalkboardTeacher size={32} /></div>
          <div>
            <div className="stat-value">{stats?.nbEnseignants || 0}</div>
            <div className="stat-label">Enseignants</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FBEAF0' }}><FaClipboardList size={32} /></div>
          <div>
            <div className="stat-value" style={{ color: totalInscriptionsAttente > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}>
              {totalInscriptionsAttente}
            </div>
            <div className="stat-label">Inscriptions en attente</div>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <h2 className="card-title">
            📋 Inscriptions à valider
            {totalInscriptionsAttente > 0 && (
              <span className="badge badge-danger" style={{ marginLeft: 10 }}>{totalInscriptionsAttente}</span>
            )}
          </h2>
          {totalInscriptionsAttente === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
              Aucune inscription en attente
            </p>
          ) : (
            <div className="activity-list">
              {inscriptionsEnAttente.slice(0, 5).map(ins => (
                <div key={ins.id} className="activity-item">
                  <div className="activity-dot" style={{ background: '#185FA5' }}></div>
                  <div style={{ flex: 1 }}>
                    <div className="activity-text">
                      <strong>{ins.prenom} {ins.nom}</strong> - {ins.niveau}
                    </div>
                    <div className="activity-meta">
                      {ins.email} • {new Date(ins.dateInscription).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <Link to={`/admin/inscriptions/${ins.id}`} className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }}>
                    Traiter
                  </Link>
                </div>
              ))}
            </div>
          )}
          {totalInscriptionsAttente > 5 && (
            <Link to="/admin/inscriptions/en-attente" style={{ marginTop: 12, display: 'block', textAlign: 'center', fontSize: 12 }}>
              Voir toutes les inscriptions ({totalInscriptionsAttente}) →
            </Link>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">
            💰 Paiements à valider
            {totalPaiementsAttente > 0 && (
              <span className="badge badge-warning" style={{ marginLeft: 10 }}>{totalPaiementsAttente}</span>
            )}
          </h2>
          {totalPaiementsAttente === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
              Aucun paiement en attente
            </p>
          ) : (
            <div className="activity-list">
              {paiementsEnAttente.slice(0, 5).map(p => (
                <div key={p.id} className="activity-item">
                  <div className="activity-dot" style={{ background: '#993556' }}></div>
                  <div style={{ flex: 1 }}>
                    <div className="activity-text">
                      <strong>{p.montant} {p.devise}</strong> - {p.type?.replace('_', ' ')}
                    </div>
                    <div className="activity-meta">
                      Réf: {p.reference} • {new Date(p.datePaiement).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <Link to={`/admin/paiements/${p.id}`} className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }}>
                    Valider
                  </Link>
                </div>
              ))}
            </div>
          )}
          {totalPaiementsAttente > 5 && (
            <Link to="/admin/paiements/en-attente" style={{ marginTop: 12, display: 'block', textAlign: 'center', fontSize: 12 }}>
              Voir tous les paiements ({totalPaiementsAttente}) →
            </Link>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-head">
          <h2 className="card-title">📚 Départements et facultés</h2>
        </div>
        {departements.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
            Aucun département. Cliquez sur "Nouveau département" pour commencer.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom</th>
                <th>Type</th>
                <th>Filières</th>
              </tr>
            </thead>
            <tbody>
              {departements.map(dept => (
                <tr key={dept.id}>
                  <td className="uni-code">{dept.code}</td>
                  <td>{dept.nom}</td>
                  <td><span className="badge badge-neutral">{dept.type}</span></td>
                  <td>
                    <Link to={`/admin/departement/${dept.id}/filieres`} className="btn-outline" style={{ fontSize: 11, padding: '4px 10px', textDecoration: 'none' }}>
                      Voir filières ({dept.filieres?.length || 0})
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Link to="/admin/departements" style={{ marginTop: 12, display: 'block', textAlign: 'center', fontSize: 12 }}>
          Gérer tous les départements →
        </Link>
      </div>

      {/* Accès rapides */}
      <div className="card" style={{ marginTop: 20 }}>
        <h2 className="card-title">🔗 Accès rapides</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 4 }}>
          <Link to="/admin/utilisateurs" style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
            background: 'rgba(24,95,165,0.12)', border: '1.5px solid #bfdbfe', borderRadius: 10,
            textDecoration: 'none', color: '#185FA5', fontWeight: 600, fontSize: 14,
          }}>
            👥 Gérer le personnel universitaire
          </Link>
          <Link to="/admin/dossiers" style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
            background: 'rgba(29,158,117,0.12)', border: '1.5px solid #bbf7d0', borderRadius: 10,
            textDecoration: 'none', color: '#15803d', fontWeight: 600, fontSize: 14,
          }}>
            📋 Dossiers d'inscription
          </Link>
          <Link to="/admin/tachpay/frais" style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
            background: '#faf5ff', border: '1.5px solid #e9d5ff', borderRadius: 10,
            textDecoration: 'none', color: '#7e22ce', fontWeight: 600, fontSize: 14,
          }}>
            💳 Frais académiques TachPay
          </Link>
          <Link to="/admin/annees-academiques" style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
            background: 'rgba(192,122,43,0.15)', border: '1.5px solid #fed7aa', borderRadius: 10,
            textDecoration: 'none', color: '#c2410c', fontWeight: 600, fontSize: 14,
          }}>
            📅 Années académiques
          </Link>
          <Link to="/admin/vacations" style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
            background: '#eef2ff', border: '1.5px solid #c7d2fe', borderRadius: 10,
            textDecoration: 'none', color: '#4338ca', fontWeight: 600, fontSize: 14,
          }}>
            🌓 Vacations (Jour / Soir)
          </Link>
        </div>
      </div>
    </div>
  );
}