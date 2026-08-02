// Variante « premium » (bleu nuit & or) du tableau de bord Admin Université.
// Rendue uniquement quand le design premium est actif (opt-in, réversible).
// Utilise Tailwind préfixé tw- + les classes .glass (scopées sous .design-premium).
import { Link } from 'react-router-dom';
import { resolveFileUrl } from '../../utils/fileUrl';
import {
  FaUserGraduate, FaBook, FaClipboardList, FaMoneyBillWave,
  FaArrowRight, FaChevronRight, FaCircle,
} from 'react-icons/fa';

function Kpi({ icon: Icon, label, value, hint, delay }) {
  return (
    <article
      className="glass tw-relative tw-overflow-hidden tw-rounded-xl tw-p-5 tw-animate-gu-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="tw-pointer-events-none tw-absolute -tw-right-8 -tw-top-10 tw-h-28 tw-w-28 tw-rounded-full tw-bg-primary/10 tw-blur-2xl" />
      <div className="tw-grid tw-h-11 tw-w-11 tw-place-items-center tw-rounded-xl tw-border tw-border-primary/20 tw-bg-primary/10 tw-text-primary">
        <Icon />
      </div>
      <p className="tw-mt-4 tw-text-sm tw-text-muted-foreground">{label}</p>
      <p className="tw-mt-1 tw-text-3xl tw-font-extrabold tw-tracking-tight tw-text-foreground">{value}</p>
      {hint && <p className="tw-mt-1 tw-text-xs tw-text-muted-foreground">{hint}</p>}
    </article>
  );
}

function Panel({ title, subtitle, action, children }) {
  return (
    <section className="glass tw-rounded-xl tw-p-5 tw-shadow-glass tw-animate-gu-fade-up">
      <div className="tw-mb-4 tw-flex tw-items-start tw-justify-between tw-gap-3">
        <div>
          <h2 className="tw-text-base tw-font-semibold tw-text-foreground">{title}</h2>
          {subtitle && <p className="tw-text-sm tw-text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Initials({ text, i = 0 }) {
  const tones = [
    'tw-from-[hsl(41,84%,60%)] tw-to-[hsl(38,80%,48%)] tw-text-[hsl(222,47%,10%)]',
    'tw-from-[hsl(212,92%,62%)] tw-to-[hsl(224,80%,52%)] tw-text-white',
    'tw-from-[hsl(263,70%,68%)] tw-to-[hsl(272,70%,54%)] tw-text-white',
  ];
  const ini = String(text || '?').split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  return (
    <span className={`tw-inline-flex tw-h-9 tw-w-9 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-gradient-to-br tw-text-xs tw-font-bold tw-ring-1 tw-ring-white/10 ${tones[i % 3]}`}>
      {ini}
    </span>
  );
}

export default function AdminUniversiteDashboardPremium({
  user, universite, stats, departements = [], inscriptionsEnAttente = [], paiementsEnAttente = [],
}) {
  const logo = resolveFileUrl(universite?.logo);
  const nbEtudiants = stats?.nbEtudiants ?? stats?.nombreEtudiants ?? '—';

  return (
    <div className="design-premium tw-min-h-full">
      {/* En-tête */}
      <header className="tw-mb-6 tw-flex tw-flex-col tw-gap-4 tw-animate-gu-fade-up sm:tw-mb-8 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
        <div className="tw-flex tw-items-center tw-gap-4">
          {logo ? (
            <img src={logo} alt="" className="tw-h-14 tw-w-14 tw-rounded-2xl tw-border tw-border-white/10 tw-bg-white tw-object-contain tw-p-1.5" />
          ) : (
            <span className="tw-grid tw-h-14 tw-w-14 tw-place-items-center tw-rounded-2xl tw-bg-gradient-to-br tw-from-primary tw-to-[hsl(38,80%,48%)] tw-text-lg tw-font-extrabold tw-text-[hsl(222,47%,10%)]">
              {(universite?.code || 'U').slice(0, 3).toUpperCase()}
            </span>
          )}
          <div>
            <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-primary/90">Tableau de bord</p>
            <h1 className="tw-text-2xl tw-font-extrabold tw-tracking-tight tw-text-foreground sm:tw-text-[28px]">
              {universite?.nom || 'Mon université'}
            </h1>
            <p className="tw-mt-0.5 tw-text-sm tw-text-muted-foreground">
              Bienvenue, {user?.nomComplet || user?.email} · Année {universite?.anneeAcademique || '2025–2026'}
            </p>
          </div>
        </div>
        <Link
          to="/admin/dossiers"
          className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-bg-gradient-to-b tw-from-primary tw-to-[hsl(41,84%,52%)] tw-px-4 tw-text-sm tw-font-semibold tw-text-primary-foreground tw-shadow-gold hover:tw-brightness-105"
        >
          Traiter les dossiers <FaArrowRight />
        </Link>
      </header>

      {/* KPI */}
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
        <Kpi icon={FaUserGraduate} label="Étudiants inscrits" value={nbEtudiants} hint="Total établissement" delay={0} />
        <Kpi icon={FaBook} label="Départements" value={departements.length} hint="Actifs" delay={70} />
        <Kpi icon={FaClipboardList} label="Dossiers en attente" value={inscriptionsEnAttente.length} hint="À valider" delay={140} />
        <Kpi icon={FaMoneyBillWave} label="Paiements en attente" value={paiementsEnAttente.length} hint="À rapprocher" delay={210} />
      </div>

      {/* Contenu */}
      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-3">
        <div className="lg:tw-col-span-2">
          <Panel
            title="Départements"
            subtitle={`${departements.length} département(s)`}
            action={<Link to={`/admin/universites/${universite?.id}/departements`} className="tw-text-sm tw-font-semibold tw-text-primary hover:tw-underline">Gérer</Link>}
          >
            {departements.length === 0 ? (
              <p className="tw-py-6 tw-text-center tw-text-sm tw-text-muted-foreground">Aucun département pour le moment.</p>
            ) : (
              <div className="tw-grid tw-grid-cols-1 tw-gap-2.5 sm:tw-grid-cols-2">
                {departements.slice(0, 8).map((d, i) => (
                  <div key={d.id || i} className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-3">
                    <Initials text={d.nom} i={i} />
                    <div className="tw-min-w-0 tw-flex-1">
                      <p className="tw-truncate tw-text-sm tw-font-semibold tw-text-foreground">{d.nom}</p>
                      <p className="tw-truncate tw-text-xs tw-text-muted-foreground">{d.code}{d.type ? ` · ${d.type}` : ''}</p>
                    </div>
                    <FaChevronRight className="tw-text-muted-foreground/50" />
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <Panel
          title="Dossiers en attente"
          subtitle="Derniers dépôts"
          action={<Link to="/admin/dossiers" className="tw-text-sm tw-font-semibold tw-text-primary hover:tw-underline">Tout voir</Link>}
        >
          {inscriptionsEnAttente.length === 0 ? (
            <p className="tw-py-6 tw-text-center tw-text-sm tw-text-muted-foreground">Aucun dossier en attente.</p>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-3">
              {inscriptionsEnAttente.slice(0, 6).map((d, i) => (
                <div key={d.id || i} className="tw-flex tw-items-center tw-gap-3">
                  <Initials text={`${d.prenom || ''} ${d.nom || ''}`} i={i} />
                  <div className="tw-min-w-0 tw-flex-1">
                    <p className="tw-truncate tw-text-sm tw-font-semibold tw-text-foreground">{d.prenom} {d.nom}</p>
                    <p className="tw-truncate tw-text-xs tw-text-muted-foreground">{d.numeroDossier || d.email}</p>
                  </div>
                  <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-[hsl(38,90%,55%)]/25 tw-bg-[hsl(38,90%,55%)]/12 tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-medium tw-text-[hsl(38,90%,66%)]">
                    <FaCircle style={{ fontSize: 6 }} /> En attente
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
