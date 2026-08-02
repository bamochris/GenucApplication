// src/pages/etudiant/EtudiantDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDesign } from '../../context/DesignContext';
import api from '../../api/axios';
import axios from 'axios'; // Ajout pour utiliser isCancel
import QuickActionsGrid from '../../components/QuickActionsGrid';
import { DonutPaiement, CircularGauge } from '../../components/etudiant/CircularProgress';
import EtudiantDashboardPremium from './EtudiantDashboardPremium';
import './EtudiantDashboard.css';

import {
  FaUserGraduate, FaUniversity, FaBook, FaCalendarAlt,
  FaMoneyBillWave, FaCheckCircle, FaExclamationTriangle,
  FaChartBar, FaBell, FaCalendarDay, FaClock, FaLocationArrow,
  FaFileInvoice, FaCreditCard, FaGraduationCap, FaUser,
  FaDownload, FaEnvelope, FaClipboardList, FaIdCard,
  FaFileAlt, FaChartLine, FaHandshake,
} from 'react-icons/fa';

export default function EtudiantDashboard() {
  const { user } = useAuth();
  const { design } = useDesign();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    etudiant: {
      nom: '',
      prenom: '',
      matricule: '',
      photo: null
    },
    academique: {
      universite: '',
      departement: '',
      filiere: '',
      promotion: '',
      anneeAcademique: ''
    },
    financier: {
      montantTotal: 0,
      montantPaye: 0,
      soldeRestant: 0,
      pourcentage: 0
    },
    notes: {
      moyenneGenerale: 0,
      creditsValides: 0
    },
    dettes: [],
    notifications: [],
    coursDuJour: [],
    evenements: []
  });

  useEffect(() => {
    const abortController = new AbortController();
    if (user) {
      loadDashboard(abortController.signal);
    } else {
      setLoading(false);
    }
    return () => abortController.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user]);

  const loadDashboard = async (signal) => {
    try {
      const inscriptionId = user?.inscriptionId;
      if (!inscriptionId) {
        // Données fictives pour développement
        setDashboardData({
          etudiant: { nom: 'Elonga', prenom: 'Christian', matricule: 'HEC-2025-001' },
          academique: {
            universite: 'Université de Kinshasa',
            departement: 'Faculté des Sciences',
            filiere: 'Informatique',
            promotion: 'L3',
            anneeAcademique: '2025-2026'
          },
          financier: {
            montantTotal: 520,
            montantPaye: 300,
            soldeRestant: 150,
            pourcentage: 75
          },
          notes: {
            moyenneGenerale: 14.5,
            creditsValides: 180
          },
          dettes: [
            { id: 1, fraisLibelle: 'Frais académiques', reste: 150, dateEcheance: '2025-06-30', estEnRetard: false },
            { id: 2, fraisLibelle: 'Frais de laboratoire', reste: 70, dateEcheance: '2025-07-15', estEnRetard: false }
          ],
          notifications: [
            { id: 1, message: 'Résultat de l\'examen de Mathématiques publié', date: '2025-06-20', type: 'INFO' },
            { id: 2, message: 'Paiement de la tranche 3 dû avant le 30/06', date: '2025-06-18', type: 'URGENT' }
          ],
          coursDuJour: [
            { id: 1, titre: 'Algorithmique Avancée', heure: '08:00 - 10:00', salle: 'B103', professeur: 'Pr. Mvumbi' },
            { id: 2, titre: 'Programmation JAVA', heure: '10:30 - 12:30', salle: 'A205', professeur: 'Dr. Kabasele' }
          ],
          evenements: [
            { id: 1, titre: 'Examen de Programmation', date: '2025-06-25', salle: 'Amphi A' },
            { id: 2, titre: 'Soutenance de stage', date: '2025-06-28', salle: 'Salle de conférence' }
          ]
        });
        setLoading(false);
        return;
      }

      const [dashboardRes, situationRes, dettesRes, notesRes] = await Promise.all([
        api.get(`/api/etudiant/portal/dashboard/${inscriptionId}`, { signal }),
        api.get('/api/etudiant/frais/situation', { signal }),
        api.get('/api/etudiant/frais/a-payer', { signal }),
        api.get(`/api/etudiant/portal/${inscriptionId}/notes`, { signal })
      ]);

      const dettes = Array.isArray(dettesRes.data) ? dettesRes.data : [];

      const data = {
        etudiant: {
          nom: dashboardRes.data.nomComplet?.split(' ')[1] || '',
          prenom: dashboardRes.data.nomComplet?.split(' ')[0] || '',
          matricule: dashboardRes.data.matricule || '',
          photo: null
        },
        academique: {
          universite: dashboardRes.data.universite || '',
          departement: dashboardRes.data.departement || '',
          filiere: dashboardRes.data.filiere || '',
          promotion: dashboardRes.data.promotion || '',
          anneeAcademique: dashboardRes.data.anneeAcademique || ''
        },
        financier: {
          montantTotal: situationRes.data.totalAttendu || 0,
          montantPaye: situationRes.data.totalPaye || 0,
          soldeRestant: situationRes.data.totalReste || 0,
          pourcentage: situationRes.data.pourcentage || 0
        },
        notes: {
          moyenneGenerale: notesRes.data.moyenneGenerale || 0,
          creditsValides: notesRes.data.creditsValides || 0
        },
        dettes,
        notifications: dashboardRes.data.notifications || [],
        coursDuJour: dashboardRes.data.prochainsCours || [],
        evenements: dashboardRes.data.prochainsExamens || []
      };

      setDashboardData(data);
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('Requête annulée:', err.message);
        return;
      }
      console.error('Erreur chargement dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de votre tableau de bord...</p>
      </div>
    );
  }

  const getMentionColor = (moyenne) => {
    if (moyenne >= 16) return '#1D9E75';
    if (moyenne >= 14) return '#185FA5';
    if (moyenne >= 12) return '#854F0B';
    if (moyenne >= 10) return '#0F6E56';
    return '#cc0000';
  };

  const getMentionLabel = (moyenne) => {
    if (moyenne >= 18) return 'Très Grande Distinction';
    if (moyenne >= 16) return 'Grande Distinction';
    if (moyenne >= 14) return 'Distinction';
    if (moyenne >= 12) return 'Satisfaction';
    if (moyenne >= 10) return 'Réussite';
    return 'Ajourné';
  };

  // ── Variante « premium » (opt-in, réversible) ──────────────────────────
  if (design === 'premium') {
    return <EtudiantDashboardPremium user={user} data={dashboardData} />;
  }

  return (
    <div className="etudiant-dashboard">
      {/* ─── Carte de bienvenue ─────────────────────────────────── */}
      <section className="welcome-section">
        <div className="welcome-card">
          <div className="welcome-content">
            <h1 className="welcome-title">
              Bienvenue, <span className="name">{dashboardData.etudiant.prenom}</span> 👋
            </h1>
            <p className="welcome-subtitle">
              <FaUniversity className="inline-icon" /> {dashboardData.academique.universite} • 
              <FaBook className="inline-icon" /> {dashboardData.academique.filiere} • 
              <FaGraduationCap className="inline-icon" /> {dashboardData.academique.promotion}
            </p>
            <div className="student-badge">
              <span className="badge badge-info">
                <FaUserGraduate className="badge-icon" /> Matricule: {dashboardData.etudiant.matricule}
              </span>
              <span className="badge badge-neutral">
                <FaCalendarAlt className="badge-icon" /> {dashboardData.academique.anneeAcademique}
              </span>
            </div>
          </div>
          <div className="welcome-stats">
            <div className="stat-mini">
              <div className="stat-mini-value" style={{ color: getMentionColor(dashboardData.notes.moyenneGenerale) }}>
                {dashboardData.notes.moyenneGenerale}/20
              </div>
              <div className="stat-mini-label">{getMentionLabel(dashboardData.notes.moyenneGenerale)}</div>
            </div>
            <div className="stat-mini">
              <div className="stat-mini-value">{dashboardData.notes.creditsValides}</div>
              <div className="stat-mini-label"><FaGraduationCap className="inline-icon" /> Crédits validés</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Statistiques financières ────────────────────────── */}
      <section className="stats-section">
        <div className="section-header">
          <h2 className="section-title"><FaMoneyBillWave className="section-icon" /> Situation financière</h2>
          <Link to="/etudiant/frais" className="link-more">Voir détails →</Link>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <DonutPaiement paye={dashboardData.financier.montantPaye} reste={dashboardData.financier.soldeRestant} />
          <div className="stats-grid" style={{ flex: 1, minWidth: 260 }}>
            <div className="stat-card">
              <div className="stat-icon"><FaFileInvoice size={28} /></div>
              <div className="stat-content">
                <div className="stat-value">{dashboardData.financier.montantTotal} USD</div>
                <div className="stat-label">Total attendu</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><FaCheckCircle size={28} /></div>
              <div className="stat-content">
                <div className="stat-value" style={{ color: 'var(--color-success-text)' }}>{dashboardData.financier.montantPaye} USD</div>
                <div className="stat-label">Déjà payé</div>
              </div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: dashboardData.financier.soldeRestant > 0 ? '#cc0000' : '#1D9E75' }}>
              <div className="stat-icon"><FaExclamationTriangle size={28} /></div>
              <div className="stat-content">
                <div className="stat-value" style={{ color: dashboardData.financier.soldeRestant > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}>
                  {dashboardData.financier.soldeRestant} USD
                </div>
                <div className="stat-label">{dashboardData.financier.soldeRestant > 0 ? 'Reste à payer' : 'Soldé ✓'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="section-header">
          <h2 className="section-title"><FaCreditCard className="section-icon" /> Frais TachPay à payer</h2>
          <Link to="/etudiant/frais" className="link-more">Payer maintenant →</Link>
        </div>
        {dashboardData.dettes.length === 0 ? (
          <div className="card" style={{ padding: 20 }}>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Aucun frais en attente pour le moment.</p>
          </div>
        ) : (
          <div className="stats-grid">
            {dashboardData.dettes.slice(0, 4).map((dette) => (
              <div key={dette.id} className="stat-card" style={{ borderLeftColor: dette.estEnRetard ? '#cc0000' : '#185FA5' }}>
                <div className="stat-icon"><FaFileInvoice size={28} /></div>
                <div className="stat-content">
                  <div className="stat-label" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{dette.libelle || dette.fraisLibelle || 'Frais à payer'}</div>
                  <div className="stat-value">{dette.reste || 0} USD</div>
                  <div className="stat-label">
                    {dette.dateEcheance ? `Échéance: ${dette.dateEcheance}` : 'Paiement disponible via TachPay'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── Cours du jour ────────────────────────────────────── */}
      <section className="today-schedule">
        <div className="section-header">
          <h2 className="section-title"><FaCalendarDay className="section-icon" /> Cours du jour</h2>
          <Link to="/etudiant/horaire" className="link-more">Voir l'emploi du temps →</Link>
        </div>
        <div className="schedule-cards">
          {dashboardData.coursDuJour.length === 0 ? (
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                Aucun cours prévu aujourd'hui. 🎉
              </p>
            </div>
          ) : (
            dashboardData.coursDuJour.map((cours, idx) => (
              <div key={idx} className="schedule-card">
                <div className="schedule-time">
                  <FaClock className="time-icon" /> {cours.heure}
                </div>
                <div className="schedule-course">
                  <div className="course-name">{cours.titre}</div>
                  <div className="course-room">
                    <FaLocationArrow className="room-icon" /> {cours.salle || 'À définir'} • 
                    <FaUser className="teacher-icon" /> {cours.professeur || 'À définir'}
                  </div>
                </div>
                <div className="schedule-status active">● En cours</div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ─── Actions rapides (boîtes de dialogue) ────────────── */}
      <section className="quick-actions-section">
        <div className="section-header">
          <h2 className="section-title"><FaChartLine className="section-icon" /> Actions rapides</h2>
        </div>
        <QuickActionsGrid
          actions={[
            {
              icon: <FaCreditCard />, label: 'Payer mes frais', to: '/etudiant/frais',
              color: '#1D9E75', bg: '#E1F5EE',
              description: `Solde restant : ${dashboardData.financier.soldeRestant} USD sur ${dashboardData.financier.montantTotal} USD attendus.`,
              applyLabel: 'Continuer le paiement',
              fields: [
                { name: 'montant', label: 'Montant à payer (USD)', type: 'number', min: 1, defaultValue: dashboardData.financier.soldeRestant || '' },
                { name: 'methode', label: 'Méthode de paiement', type: 'select', options: ['M-Pesa', 'Orange Money', 'Airtel Money', 'Carte bancaire', 'Espèces (guichet)'] },
              ],
            },
            {
              icon: <FaDownload />, label: 'Télécharger bulletin', to: '/etudiant/bulletins',
              color: '#185FA5', bg: '#E6F1FB',
              description: 'Choisissez la période du bulletin à télécharger.',
              applyLabel: 'Télécharger',
              fields: [
                { name: 'annee', label: 'Année académique', type: 'select', options: [...new Set([dashboardData.academique.anneeAcademique || '2025-2026', '2024-2025', '2023-2024'])] },
                { name: 'semestre', label: 'Semestre', type: 'select', options: ['Semestre 1', 'Semestre 2', 'Année complète'] },
              ],
            },
            {
              icon: <FaChartBar />, label: 'Mes résultats', to: '/etudiant/resultats',
              color: '#854F0B', bg: '#FAEEDA',
              description: 'Consultez vos notes et moyennes par session.',
              applyLabel: 'Afficher les résultats',
              fields: [
                { name: 'session', label: 'Session', type: 'select', options: ['Toutes les sessions', 'Session ordinaire', 'Session de rattrapage'] },
              ],
            },
            {
              icon: <FaBook />, label: 'Mes cours', to: '/etudiant/mes-cours',
              color: 'var(--text-primary)', bg: '#F0F4FF',
              description: 'Accédez à vos cours, supports et travaux pratiques.',
              applyLabel: 'Ouvrir mes cours',
              fields: [
                { name: 'semestre', label: 'Semestre', type: 'select', options: ['Tous', 'Semestre 1', 'Semestre 2'] },
              ],
            },
            {
              icon: <FaEnvelope />, label: 'Messagerie', to: '/etudiant/messagerie',
              color: '#6B21A8', bg: '#F3E8FF',
              description: 'Préparez un nouveau message : il sera pré-rempli dans la messagerie.',
              applyLabel: 'Rédiger le message',
              fields: [
                { name: 'destinataire', label: 'Destinataire', type: 'text', placeholder: 'Nom ou adresse du destinataire' },
                { name: 'sujet', label: 'Sujet', type: 'text', placeholder: 'Objet du message' },
              ],
            },
            {
              icon: <FaIdCard />, label: 'Carte étudiant', to: '/etudiant/carte',
              color: '#C07A2B', bg: '#FFF8E7',
              description: `Carte de ${dashboardData.etudiant.prenom} ${dashboardData.etudiant.nom} — matricule ${dashboardData.etudiant.matricule}. Affichez ou téléchargez votre carte d'étudiant numérique.`,
              applyLabel: 'Afficher ma carte',
            },
            {
              icon: <FaFileAlt />, label: 'Demander attestation', to: '/etudiant/demander-attestation',
              color: '#1D9E75', bg: '#E1F5EE',
              description: 'Sélectionnez le type d\'attestation : la demande sera pré-remplie.',
              applyLabel: 'Continuer la demande',
              fields: [
                { name: 'type', label: 'Type d\'attestation', type: 'select', options: ['Attestation de fréquentation', 'Attestation de réussite', 'Attestation d\'inscription'] },
                { name: 'exemplaires', label: 'Nombre d\'exemplaires', type: 'number', min: 1, max: 5, defaultValue: 1 },
              ],
            },
            {
              icon: <FaClipboardList />, label: 'Recours', to: '/etudiant/recours',
              color: '#993556', bg: '#FBEAF0',
              description: 'Décrivez brièvement votre recours : il sera pré-rempli dans le formulaire.',
              applyLabel: 'Continuer le recours',
              fields: [
                { name: 'type', label: 'Type de recours', type: 'select', options: ['Recours de notes', 'Recours de délibération', 'Recours administratif'] },
                { name: 'motif', label: 'Motif', type: 'textarea', placeholder: 'Expliquez brièvement le motif du recours…' },
              ],
            },
          ]}
        />
      </section>

      {/* ─── Progression académique ──────────────────────────── */}
      <section className="academic-progress">
        <div className="section-header">
          <h2 className="section-title"><FaHandshake className="section-icon" /> Progression académique</h2>
          <Link to="/etudiant/parcours" className="link-more">Voir le parcours →</Link>
        </div>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'space-around', padding: '12px 0' }}>
          <CircularGauge
            percent={(dashboardData.notes.creditsValides / 240) * 100}
            color="#185FA5"
            label={<>Crédits validés<br /><strong>{dashboardData.notes.creditsValides} / 240</strong></>}
          />
          <CircularGauge percent={85} color="#1D9E75" label="Taux de présence général" />
          <CircularGauge
            percent={dashboardData.financier.pourcentage}
            color={dashboardData.financier.pourcentage >= 80 ? '#1D9E75' : '#cc0000'}
            label="Couverture financière"
          />
        </div>
      </section>

      {/* ─── Notifications et événements ────────────────────── */}
      <div className="dash-grid">
        <section className="notifications-section">
          <div className="section-header">
            <h2 className="section-title"><FaBell className="section-icon" /> Notifications récentes</h2>
            <Link to="/etudiant/notifications" className="link-more">Voir tout →</Link>
          </div>
          <div className="notifications-list">
            {dashboardData.notifications.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune notification</p>
            ) : (
              dashboardData.notifications.slice(0, 4).map((notif, idx) => (
                <div key={idx} className="notification-item">
                  <div className="notification-dot" style={{ background: notif.type === 'URGENT' ? '#cc0000' : '#185FA5' }} />
                  <div className="notification-content">
                    <div className="notification-text">{notif.message}</div>
                    <div className="notification-time">
                      <FaClock className="time-icon" /> {notif.date || 'Récent'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="events-section">
          <div className="section-header">
            <h2 className="section-title"><FaCalendarAlt className="section-icon" /> Événements à venir</h2>
            <Link to="/etudiant/horaire" className="link-more">Voir tout →</Link>
          </div>
          <div className="events-list">
            {dashboardData.evenements.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucun événement à venir</p>
            ) : (
              dashboardData.evenements.slice(0, 4).map((event, idx) => (
                <div key={idx} className="event-item">
                  <div className="event-date">
                    <span className="event-day">{new Date(event.date).getDate()}</span>
                    <span className="event-month">{new Date(event.date).toLocaleString('fr-FR', { month: 'short' })}</span>
                  </div>
                  <div className="event-content">
                    <div className="event-title">{event.titre}</div>
                    <div className="event-location">
                      <FaLocationArrow className="location-icon" /> {event.salle || 'À définir'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}