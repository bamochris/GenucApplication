// src/pages/professeur/ProfesseurDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDesign } from '../../context/DesignContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import QuickActionsGrid from '../../components/QuickActionsGrid';
import ProfesseurDashboardPremium from './ProfesseurDashboardPremium';
import './ProfesseurDashboard.css';

import { FaBook, FaUserGraduate, FaCheckCircle, FaEdit, FaExclamationTriangle, FaCalendarAlt, FaBell, FaEnvelope } from 'react-icons/fa';

export default function ProfesseurDashboard() {
  const { user } = useAuth();
  const { design } = useDesign();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [presences, setPresences] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const statsRes = await api.get(`/api/professeur/stats/${user.id}`);
        setStats(statsRes.data);
        const presenceRes = await api.get(`/api/professeur/presences/${user.id}`);
        setPresences(presenceRes.data);
        const scheduleRes = await api.get(`/api/professeur/schedule/today/${user.id}`);
        setTodaySchedule(scheduleRes.data);
        const alertRes = await api.get(`/api/professeur/alertes/${user.id}`);
        setAlerts(alertRes.data);
        setError(null);
      } catch (err) {
        console.error('Erreur chargement dashboard:', err);
        setError('Impossible de charger vos données. Veuillez réessayer plus tard.');
        toast.error('Impossible de charger votre tableau de bord.');
        setStats(null);
        setPresences(null);
        setTodaySchedule([]);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (!user) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement du profil...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

  const displayName = user.prenom || user.nom || 'Cher';

  // ── Variante « premium » (opt-in, réversible) ──────────────────────────
  if (design === 'premium') {
    return (
      <ProfesseurDashboardPremium
        user={user}
        stats={stats}
        presences={presences}
        todaySchedule={todaySchedule}
        alerts={alerts}
        error={error}
      />
    );
  }

  return (
    <div className="professeur-dashboard">
      <section className="welcome-section">
        <div className="welcome-card">
          <div className="welcome-content">
            <h1 className="welcome-title">
              Bonjour, <span className="name">{displayName}</span> ! 👋
            </h1>
            <p className="welcome-subtitle">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            {error && (
              <div style={{ marginTop: 12, padding: 8, background: 'rgba(255,200,0,0.2)', borderRadius: 6, color: '#fff', fontSize: 13 }}>
                ⚠️ {error}
              </div>
            )}
          </div>
          <div className="weather-widget">
            <div className="weather-icon">⛅</div>
            <div className="weather-info">
              <div className="temp">24°C</div>
              <div className="condition">Kinshasa</div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="section-header">
          <h2 className="section-title">📊 Vos statistiques clés</h2>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon"><FaBook size={32} /></div>
            <div className="stat-content">
              <div className="stat-value">{stats?.totalCours ?? 0}</div>
              <div className="stat-label">Cours attribués</div>
              <div className="stat-detail">{stats?.coursAujourdhui ?? 0} aujourd'hui</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FaUserGraduate size={32} /></div>
            <div className="stat-content">
              <div className="stat-value">{stats?.totalEtudiants ?? 0}</div>
              <div className="stat-label">Étudiants</div>
              <div className="stat-detail">Tous niveaux confondus</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FaCheckCircle size={32} /></div>
            <div className="stat-content">
              <div className="stat-value">{stats?.tauxPresence ?? 0}%</div>
              <div className="stat-label">Taux de présence</div>
              <div className="stat-detail">{presences?.total ?? 0} présences relevées</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FaEdit size={32} /></div>
            <div className="stat-content">
              <div className="stat-value">{stats?.notesACorriger ?? 0}</div>
              <div className="stat-label">Notes à corriger</div>
              <div className="stat-detail">{stats?.notesEnAttente ?? 0} en attente de validation</div>
            </div>
          </div>
        </div>
      </section>

      <section className="today-schedule">
        <div className="section-header">
          <h2 className="section-title"><FaCalendarAlt /> Emploi du temps d'aujourd'hui</h2>
          <Link to="/professeur/mes-cours/planning" className="link-more">Voir tout</Link>
        </div>
        <div className="schedule-cards">
          {todaySchedule.length === 0 ? (
            <div className="card">
              <p style={{ color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>
                Aucun cours prévu aujourd'hui.
              </p>
            </div>
          ) : (
            todaySchedule.map((cours, idx) => (
              <div key={idx} className="schedule-card">
                <div className="schedule-time">{cours.heureDebut} - {cours.heureFin}</div>
                <div className="schedule-course">
                  <div className="course-name">{cours.titre}</div>
                  <div className="course-room">{cours.salle} • {cours.nbEtudiants} étudiants</div>
                </div>
                <div className={`schedule-status ${cours.statut}`}>
                  {cours.statut === 'done' ? '✓ Enseigné' :
                   cours.statut === 'active' ? '● En cours' :
                   '◯ À venir'}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="alerts-section">
        <div className="section-header">
          <h2 className="section-title"><FaBell /> Alertes & Actions urgentes</h2>
        </div>
        <div className="alerts-container">
          {alerts.length === 0 ? (
            <div className="card">
              <p style={{ color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>
                Aucune alerte pour le moment.
              </p>
            </div>
          ) : (
            alerts.map((alert, idx) => (
              <div key={idx} className={`alert-item alert-${alert.type}`}>
                <div className="alert-icon"><FaExclamationTriangle /></div>
                <div className="alert-content">
                  <div className="alert-title">{alert.titre}</div>
                  <div className="alert-message">{alert.message}</div>
                  <div className="alert-time">{alert.date}</div>
                </div>
                <Link to={alert.lien} className="alert-action">
                  {alert.action}
                </Link>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="quick-actions">
        <div className="section-header">
          <h2 className="section-title">⚡ Actions rapides</h2>
        </div>
        <QuickActionsGrid
          actions={[
            {
              icon: <FaCheckCircle />, label: 'Saisir les présences', to: '/professeur/presences/saisie',
              color: '#1D9E75', bg: '#E1F5EE',
              description: 'Choisissez la séance : la feuille de présences sera pré-remplie.',
              applyLabel: 'Ouvrir la saisie',
              fields: [
                { name: 'date', label: 'Date de la séance', type: 'date', defaultValue: new Date().toISOString().slice(0, 10) },
              ],
            },
            {
              icon: <FaEdit />, label: 'Encoder les notes', to: '/professeur/notes/saisie',
              color: '#185FA5', bg: '#E6F1FB',
              description: 'Sélectionnez la session d\'évaluation à encoder.',
              applyLabel: 'Ouvrir l\'encodage',
              fields: [
                { name: 'session', label: 'Session', type: 'select', options: ['Session ordinaire', 'Session de rattrapage', 'Contrôle continu'] },
              ],
            },
            {
              icon: <FaBook />, label: 'Publier un support', to: '/professeur/mes-cours/supports',
              color: '#854F0B', bg: '#FAEEDA',
              description: 'Préparez la publication d\'un support de cours pour vos étudiants.',
              applyLabel: 'Continuer',
              fields: [
                { name: 'type', label: 'Type de support', type: 'select', options: ['Notes de cours', 'Travaux pratiques', 'Syllabus', 'Examen corrigé'] },
              ],
            },
            {
              icon: <FaEnvelope />, label: 'Envoyer un message', to: '/professeur/messagerie',
              color: '#6B21A8', bg: '#F3E8FF',
              description: 'Préparez un message : il sera pré-rempli dans la messagerie.',
              applyLabel: 'Rédiger le message',
              fields: [
                { name: 'destinataire', label: 'Destinataire', type: 'text', placeholder: 'Étudiant, promotion ou collègue' },
                { name: 'sujet', label: 'Sujet', type: 'text', placeholder: 'Objet du message' },
              ],
            },
          ]}
        />
      </section>
    </div>
  );
}