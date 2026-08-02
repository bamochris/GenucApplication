// Variante « premium » (bleu nuit & or) du tableau de bord Professeur.
// Rendue uniquement quand le design premium est actif (opt-in, réversible).
// Tailwind préfixé tw- + classes .glass (scopées sous .design-premium).
import { Link } from 'react-router-dom';
import {
  FaBook, FaUserGraduate, FaCheckCircle, FaEdit, FaExclamationTriangle,
  FaCalendarAlt, FaBell, FaEnvelope, FaClock, FaMapMarkerAlt, FaArrowRight,
} from 'react-icons/fa';

const GOLD = 'hsl(41 84% 60%)';
const TEAL = 'hsl(152 55% 45%)';
const BLUE = 'hsl(212 92% 62%)';
const RED = 'hsl(0 72% 55%)';

// Applique une opacité à une couleur hsl(...) sans virgule finale.
const alpha = (color, a) => color.replace(')', ` / ${a})`);

function Kpi({ icon: Icon, label, value, hint, tone = GOLD, delay = 0 }) {
  return (
    <article
      className="glass tw-relative tw-overflow-hidden tw-rounded-xl tw-p-5 tw-animate-gu-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="tw-pointer-events-none tw-absolute -tw-right-8 -tw-top-10 tw-h-28 tw-w-28 tw-rounded-full tw-blur-2xl" style={{ background: alpha(tone, 0.14) }} />
      <div className="tw-grid tw-h-11 tw-w-11 tw-place-items-center tw-rounded-xl tw-border" style={{ borderColor: alpha(tone, 0.25), background: alpha(tone, 0.12), color: tone }}>
        <Icon />
      </div>
      <p className="tw-mt-4 tw-text-sm tw-text-muted-foreground">{label}</p>
      <p className="tw-mt-1 tw-text-2xl tw-font-extrabold tw-tracking-tight tw-text-foreground sm:tw-text-3xl">{value}</p>
      {hint && <p className="tw-mt-1 tw-text-xs tw-text-muted-foreground">{hint}</p>}
    </article>
  );
}

function Panel({ title, subtitle, icon: Icon, action, children, className = '' }) {
  return (
    <section className={`glass tw-rounded-xl tw-p-5 tw-shadow-glass tw-animate-gu-fade-up ${className}`}>
      <div className="tw-mb-4 tw-flex tw-items-start tw-justify-between tw-gap-3">
        <div className="tw-flex tw-items-center tw-gap-2.5">
          {Icon && (
            <span className="tw-grid tw-h-8 tw-w-8 tw-place-items-center tw-rounded-lg tw-bg-primary/10 tw-text-primary">
              <Icon />
            </span>
          )}
          <div>
            <h2 className="tw-text-base tw-font-semibold tw-text-foreground">{title}</h2>
            {subtitle && <p className="tw-text-sm tw-text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const ACTIONS = [
  { icon: FaCheckCircle, label: 'Saisir présences', to: '/professeur/presences/saisie', tone: TEAL },
  { icon: FaEdit, label: 'Encoder notes', to: '/professeur/notes/saisie', tone: BLUE },
  { icon: FaBook, label: 'Publier support', to: '/professeur/mes-cours/supports', tone: GOLD },
  { icon: FaCalendarAlt, label: 'Mon planning', to: '/professeur/mes-cours/planning', tone: BLUE },
  { icon: FaEnvelope, label: 'Messagerie', to: '/professeur/messagerie', tone: GOLD },
];

function scheduleStatus(statut) {
  if (statut === 'done') return { label: '✓ Enseigné', tone: TEAL };
  if (statut === 'active') return { label: '● En cours', tone: GOLD };
  return { label: '◯ À venir', tone: BLUE };
}

function alertTone(type) {
  if (type === 'danger' || type === 'error') return RED;
  if (type === 'success') return TEAL;
  if (type === 'info') return BLUE;
  return GOLD; // warning par défaut
}

export default function ProfesseurDashboardPremium({
  user, stats, presences, todaySchedule = [], alerts = [], error,
}) {
  const displayName = user?.prenom || user?.nom || 'Professeur';
  const initiales = `${(user?.prenom?.[0] || '')}${(user?.nom?.[0] || '')}`.toUpperCase() || 'PR';
  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="design-premium tw-min-h-full">
      {/* En-tête */}
      <header className="tw-mb-6 tw-flex tw-flex-col tw-gap-5 tw-animate-gu-fade-up sm:tw-mb-8 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between">
        <div className="tw-flex tw-items-center tw-gap-4">
          <span className="tw-grid tw-h-14 tw-w-14 tw-shrink-0 tw-place-items-center tw-rounded-2xl tw-bg-gradient-to-br tw-from-primary tw-to-[hsl(38,80%,48%)] tw-text-lg tw-font-extrabold tw-text-[hsl(222,47%,10%)] tw-shadow-gold">
            {initiales}
          </span>
          <div>
            <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-primary/90">Espace enseignant</p>
            <h1 className="tw-text-2xl tw-font-extrabold tw-tracking-tight tw-text-foreground sm:tw-text-[28px]">
              Bonjour, {displayName} 👋
            </h1>
            <p className="tw-mt-1 tw-text-sm tw-capitalize tw-text-muted-foreground">{dateStr}</p>
          </div>
        </div>
        <span className="tw-inline-flex tw-items-center tw-gap-2 tw-self-start tw-rounded-full tw-border tw-border-white/10 tw-bg-white/[0.04] tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-text-muted-foreground lg:tw-self-auto">
          <FaMapMarkerAlt className="tw-text-primary/70" /> Kinshasa · ⛅ 24°C
        </span>
      </header>

      {error && (
        <div className="tw-mb-4 tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-px-4 tw-py-3 tw-text-sm tw-animate-gu-fade-up" style={{ borderColor: alpha(GOLD, 0.3), background: alpha(GOLD, 0.1), color: 'hsl(41 70% 72%)' }}>
          <FaExclamationTriangle /> {error}
        </div>
      )}

      {/* KPI */}
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
        <Kpi icon={FaBook} label="Cours attribués" value={stats?.totalCours ?? 0} hint={`${stats?.coursAujourdhui ?? 0} aujourd'hui`} tone={GOLD} delay={0} />
        <Kpi icon={FaUserGraduate} label="Étudiants" value={stats?.totalEtudiants ?? 0} hint="Tous niveaux confondus" tone={BLUE} delay={70} />
        <Kpi icon={FaCheckCircle} label="Taux de présence" value={`${stats?.tauxPresence ?? 0}%`} hint={`${presences?.total ?? 0} présences relevées`} tone={TEAL} delay={140} />
        <Kpi icon={FaEdit} label="Notes à corriger" value={stats?.notesACorriger ?? 0} hint={`${stats?.notesEnAttente ?? 0} en attente`} tone={(stats?.notesACorriger ?? 0) > 0 ? RED : TEAL} delay={210} />
      </div>

      {/* Emploi du temps + alertes */}
      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-3">
        <Panel
          title="Emploi du temps du jour"
          subtitle="Vos séances d'aujourd'hui"
          icon={FaCalendarAlt}
          className="lg:tw-col-span-2"
          action={<Link to="/professeur/mes-cours/planning" className="tw-text-sm tw-font-semibold tw-text-primary hover:tw-underline">Voir tout</Link>}
        >
          {todaySchedule.length === 0 ? (
            <p className="tw-py-6 tw-text-center tw-text-sm tw-text-muted-foreground">Aucun cours prévu aujourd'hui. 🎉</p>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-2.5">
              {todaySchedule.map((c, i) => {
                const st = scheduleStatus(c.statut);
                return (
                  <div key={i} className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-3">
                    <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-1.5 tw-rounded-md tw-bg-primary/10 tw-px-2.5 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-primary">
                      <FaClock /> {c.heureDebut}–{c.heureFin}
                    </div>
                    <div className="tw-min-w-0 tw-flex-1">
                      <p className="tw-truncate tw-text-sm tw-font-semibold tw-text-foreground">{c.titre}</p>
                      <p className="tw-truncate tw-text-xs tw-text-muted-foreground">
                        <FaMapMarkerAlt className="tw-mr-1 tw-inline" />{c.salle || 'À définir'} · {c.nbEtudiants ?? 0} étudiants
                      </p>
                    </div>
                    <span className="tw-inline-flex tw-shrink-0 tw-items-center tw-rounded-full tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-medium" style={{ background: alpha(st.tone, 0.12), color: st.tone }}>{st.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Alertes & actions" subtitle="À traiter" icon={FaBell}>
          {alerts.length === 0 ? (
            <p className="tw-py-6 tw-text-center tw-text-sm tw-text-muted-foreground">Aucune alerte pour le moment.</p>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-3">
              {alerts.slice(0, 5).map((a, i) => {
                const tone = alertTone(a.type);
                return (
                  <div key={i} className="tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-3" style={{ borderLeft: `3px solid ${tone}` }}>
                    <div className="tw-flex tw-items-start tw-gap-2.5">
                      <span className="tw-mt-0.5 tw-shrink-0" style={{ color: tone }}><FaExclamationTriangle /></span>
                      <div className="tw-min-w-0 tw-flex-1">
                        <p className="tw-text-sm tw-font-semibold tw-text-foreground">{a.titre}</p>
                        <p className="tw-text-xs tw-text-muted-foreground">{a.message}</p>
                        <div className="tw-mt-1.5 tw-flex tw-items-center tw-justify-between tw-gap-2">
                          <span className="tw-text-[11px] tw-text-muted-foreground/70">{a.date}</span>
                          {a.lien && (
                            <Link to={a.lien} className="tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-font-semibold tw-text-primary hover:tw-underline">
                              {a.action || 'Traiter'} <FaArrowRight style={{ fontSize: 10 }} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      {/* Actions rapides */}
      <section className="tw-mt-6 tw-animate-gu-fade-up">
        <h2 className="tw-mb-3 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-muted-foreground">Actions rapides</h2>
        <div className="tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-grid-cols-3 lg:tw-grid-cols-5">
          {ACTIONS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="glass tw-group tw-flex tw-flex-col tw-items-center tw-gap-2.5 tw-rounded-xl tw-p-4 tw-text-center tw-transition hover:tw-border-primary/30"
            >
              <span className="tw-grid tw-h-11 tw-w-11 tw-place-items-center tw-rounded-xl tw-border tw-transition group-hover:tw-scale-105" style={{ borderColor: alpha(a.tone, 0.25), background: alpha(a.tone, 0.12), color: a.tone }}>
                <a.icon />
              </span>
              <span className="tw-text-xs tw-font-semibold tw-text-foreground">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
