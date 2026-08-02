// src/pages/secretaire/SecretaireDashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDesign } from '../../context/DesignContext';
import api from '../../api/axios';
import QuickActionsGrid from '../../components/QuickActionsGrid';
import '../../pages/Dashboard.css';
import AvatarUtilisateur from '../../components/AvatarUtilisateur';
import SecretaireDashboardPremium from './SecretaireDashboardPremium';

export default function SecretaireDashboard() {
  const { user } = useAuth();
  const { design } = useDesign();
  const [stats, setStats] = useState(null);
  const [dossiersEnAttente, setDossiersEnAttente] = useState([]);
  const [inscriptionsRecentes, setInscriptionsRecentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const universiteId = user?.universiteId;

  useEffect(() => {
    if (universiteId) {
      loadData();
    } else {
      setLoading(false);
      setError('Aucune université associée à votre compte.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [universiteId]);

  const loadData = async () => {
    try {
      // Récupérer les statistiques générales de l'université
      const statsRes = await api.get(`/api/universites/${universiteId}/stats`).catch(() => ({ data: {} }));
      setStats(statsRes.data || {});

      // Récupérer les dossiers d'inscription en attente
      const dossiersRes = await api.get(`/api/public/admin/dossiers?universiteId=${universiteId}&statut=EN_ATTENTE`).catch(() => ({ data: [] }));
      setDossiersEnAttente(dossiersRes.data || []);

      // Récupérer les inscriptions récentes (validées)
      const inscriptionsRes = await api.get(`/api/inscriptions/universite/${universiteId}`).catch(() => ({ data: [] }));
      // Trier par date et prendre les 5 plus récentes
      const recentes = (inscriptionsRes.data || [])
        .sort((a, b) => new Date(b.creeLe) - new Date(a.creeLe))
        .slice(0, 5);
      setInscriptionsRecentes(recentes);

    } catch (err) {
      console.error('Erreur chargement données secrétaire :', err);
      setError('Impossible de charger les données du tableau de bord.');
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut) => {
    switch(statut) {
      case 'EN_ATTENTE': return 'badge-warning';
      case 'VALIDE': return 'badge-success';
      case 'REJETE': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  const getStatutLabel = (statut) => {
    switch(statut) {
      case 'EN_ATTENTE': return '⏳ En attente';
      case 'VALIDE': return '✅ Validé';
      case 'REJETE': return '❌ Rejeté';
      default: return statut;
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Chargement du tableau de bord Secrétaire...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert-erreur">{error}</div>
      </div>
    );
  }

  // ── Variante « premium » (opt-in, réversible) ──────────────────────────
  if (design === 'premium') {
    return (
      <SecretaireDashboardPremium
        user={user}
        stats={stats}
        dossiersEnAttente={dossiersEnAttente}
        inscriptionsRecentes={inscriptionsRecentes}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">👨‍💼 Tableau de bord – Secrétaire Académique</h1>
          <p className="page-sub">
            Bienvenue, <AvatarUtilisateur taille={22} style={{ marginRight: 7 }} />{user?.nomComplet || user?.email} – Gérez les dossiers et inscriptions
          </p>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          📅 {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Statistiques clés */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E6F1FB' }}>📋</div>
          <div>
            <div className="stat-value">{stats?.nbInscriptionsEnAttente || dossiersEnAttente.length}</div>
            <div className="stat-label">Dossiers en attente</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E1F5EE' }}>✅</div>
          <div>
            <div className="stat-value">{stats?.nbEtudiants || 0}</div>
            <div className="stat-label">Étudiants inscrits</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FAEEDA' }}>📝</div>
          <div>
            <div className="stat-value">{stats?.nbDepartements || 0}</div>
            <div className="stat-label">Départements</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FBEAF0' }}>📄</div>
          <div>
            <div className="stat-value">{stats?.nbAttestationsEnAttente || 0}</div>
            <div className="stat-label">Attestations à traiter</div>
          </div>
        </div>
      </div>

      {/* Grille principale */}
      <div className="dash-grid">
        {/* Dossiers en attente */}
        <div className="card">
          <div className="card-head">
            <h2 className="card-title">📋 Dossiers d'inscription en attente</h2>
          </div>
          {dossiersEnAttente.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
              Aucun dossier en attente de validation.
            </p>
          ) : (
            <div className="activity-list">
              {dossiersEnAttente.slice(0, 5).map(dossier => (
                <div key={dossier.id} className="activity-item">
                  <div className="activity-dot" style={{ background: '#185FA5' }}></div>
                  <div style={{ flex: 1 }}>
                    <div className="activity-text">
                      <strong>{dossier.prenom} {dossier.nom}</strong> – {dossier.niveauVise}
                    </div>
                    <div className="activity-meta">
                      {dossier.email} • N° {dossier.numeroDossier} • {new Date(dossier.creeLe).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <Link to={`/admin/dossiers/${dossier.id}`} className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }}>
                    Traiter
                  </Link>
                </div>
              ))}
              {dossiersEnAttente.length > 5 && (
                <Link to="/admin/dossiers" style={{ marginTop: 12, display: 'block', textAlign: 'center', fontSize: 12 }}>
                  Voir tous les dossiers ({dossiersEnAttente.length}) →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Inscriptions récentes */}
        <div className="card">
          <div className="card-head">
            <h2 className="card-title">📝 Inscriptions récentes</h2>
          </div>
          {inscriptionsRecentes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
              Aucune inscription récente.
            </p>
          ) : (
            <div className="activity-list">
              {inscriptionsRecentes.map(ins => (
                <div key={ins.id} className="activity-item">
                  <div className="activity-dot" style={{ background: '#1D9E75' }}></div>
                  <div style={{ flex: 1 }}>
                    <div className="activity-text">
                      <strong>{ins.prenom} {ins.nom}</strong> – {ins.niveau}
                    </div>
                    <div className="activity-meta">
                      Matricule: {ins.matricule} • {new Date(ins.creeLe).toLocaleDateString('fr-FR')}
                      <span className={`badge ${getStatutBadge(ins.statut)}`} style={{ marginLeft: 8 }}>
                        {getStatutLabel(ins.statut)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions rapides (boîtes de dialogue) */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-head">
          <h2 className="card-title">⚡ Actions rapides</h2>
        </div>
        <QuickActionsGrid
          actions={[
            {
              icon: '📋', label: 'Gérer les dossiers', to: '/admin/dossiers',
              color: '#185FA5', bg: '#E6F1FB',
              description: 'Filtrez les dossiers étudiants avant d\'ouvrir la gestion.',
              applyLabel: 'Ouvrir les dossiers',
              fields: [
                { name: 'statut', label: 'Statut', type: 'select', options: ['Tous', 'En attente', 'Validés', 'Rejetés'] },
              ],
            },
            {
              icon: '📝', label: 'Gérer les inscriptions', to: '/inscriptions',
              color: '#1D9E75', bg: '#E1F5EE',
              description: 'Choisissez la vacation à traiter.',
              applyLabel: 'Ouvrir les inscriptions',
              fields: [
                { name: 'vacation', label: 'Vacation', type: 'select', options: ['Toutes', 'Jour', 'Soir'] },
              ],
            },
            {
              icon: '📄', label: 'Gérer les attestations', to: '/admin/attestations',
              color: '#854F0B', bg: '#FAEEDA',
              description: 'Filtrez les demandes d\'attestations à traiter.',
              applyLabel: 'Ouvrir les attestations',
              fields: [
                { name: 'etat', label: 'État des demandes', type: 'select', options: ['En attente', 'Approuvées', 'Délivrées', 'Toutes'] },
              ],
            },
            {
              icon: '📝', label: "Test d'admission par filière", to: '/secretaire/test-admission',
              color: '#C07A2B', bg: '#FAEEDA',
              description: "Choisissez les filières qui exigent un test d'admission pour tous leurs candidats.",
              applyLabel: 'Ouvrir la gestion',
            },
            {
              icon: '📎', label: 'Documents étudiants', to: '/admin/documents',
              color: '#6B21A8', bg: '#F3E8FF',
              description: 'Recherchez les documents d\'un étudiant.',
              applyLabel: 'Ouvrir les documents',
              fields: [
                { name: 'matricule', label: 'Matricule (optionnel)', type: 'text', placeholder: 'Ex. ETU-2025-001' },
              ],
            },
            {
              icon: '📊', label: 'Voir les statistiques', to: '/admin/statistiques',
              color: '#1D9E75', bg: '#E1F5EE',
              description: 'Choisissez la période des statistiques à afficher.',
              applyLabel: 'Afficher',
              fields: [
                { name: 'periode', label: 'Période', type: 'select', options: ['Année en cours', 'Semestre en cours', 'Mois en cours'] },
              ],
            },
          ]}
        />
      </div>
    </div>
  );
}