// Variante « premium » (bleu nuit & or) du tableau de bord Étudiant.
// Rendue uniquement quand le design premium est actif (opt-in, réversible).
// Tailwind préfixé tw- + classes .glass (scopées sous .design-premium).
import { Link } from 'react-router-dom';
import {
  FaUserGraduate, FaUniversity, FaBook, FaGraduationCap, FaCalendarAlt,
  FaFileInvoice, FaCheckCircle, FaExclamationTriangle, FaChartBar,
  FaCreditCard, FaIdCard, FaFileAlt, FaEnvelope, FaBell, FaCalendarDay,
  FaClock, FaLocationArrow, FaUser, FaArrowRight, FaChevronRight,
} from 'react-icons/fa';

const GOLD = 'hsl(41 84% 60%)';
const TEAL = 'hsl(152 55% 45%)';
const BLUE = 'hsl(212 92% 62%)';
const RED = 'hsl(0 72% 55%)';

// Applique une opacité à une couleur hsl(...) sans virgule finale.
const alpha = (color, a) => color.replace(')', ` / ${a})`);

function mentionLabel(m) {
  if (m >= 18) return 'Très Grande Distinction';
  if (m >= 16) return 'Grande Distinction';
  if (m >= 14) return 'Distinction';
  if (m >= 12) return 'Satisfaction';
  if (m >= 10) return 'Réussite';
  return 'À consolider';
}

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

function Ring({ percent = 0, label, value, color = GOLD, size = 128 }) {
  const p = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (p / 100) * c;
  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-gap-2.5">
      <div className="tw-relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" stroke="hsl(214 33% 22% / 0.5)" />
          <circle
            cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none"
            stroke={color} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
            style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)' }}
          />
        </svg>
        <div className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center">
          <span className="tw-text-2xl tw-font-extrabold tw-text-foreground">{value ?? `${Math.round(p)}%`}</span>
        </div>
      </div>
      <p className="tw-max-w-[140px] tw-text-center tw-text-xs tw-text-muted-foreground">{label}</p>
    </div>
  );
}

const ACTIONS = [
  { icon: FaCreditCard, label: 'Payer mes frais', to: '/etudiant/frais', tone: TEAL },
  { icon: FaChartBar, label: 'Mes résultats', to: '/etudiant/resultats', tone: GOLD },
  { icon: FaBook, label: 'Mes cours', to: '/etudiant/mes-cours', tone: BLUE },
  { icon: FaIdCard, label: 'Carte étudiant', to: '/etudiant/carte', tone: GOLD },
  { icon: FaFileAlt, label: 'Attestation', to: '/etudiant/demander-attestation', tone: TEAL },
  { icon: FaEnvelope, label: 'Messagerie', to: '/etudiant/messagerie', tone: BLUE },
];

export default function EtudiantDashboardPremium({ user, data }) {
  const etu = data?.etudiant || {};
  const aca = data?.academique || {};
  const fin = data?.financier || {};
  const notes = data?.notes || {};
  const dettes = data?.dettes || [];
  const notifications = data?.notifications || [];
  const coursDuJour = data?.coursDuJour || [];
  const evenements = data?.evenements || [];

  const prenom = etu.prenom || user?.prenom || '';
  const nom = etu.nom || '';
  const initiales = `${(prenom[0] || '')}${(nom[0] || '')}`.toUpperCase() || 'ET';
  const moyenne = notes.moyenneGenerale ?? 0;
  const solde = fin.soldeRestant ?? 0;

  return (
    <div className="design-premium tw-min-h-full">
      {/* En-tête */}
      <header className="tw-mb-6 tw-flex tw-flex-col tw-gap-5 tw-animate-gu-fade-up sm:tw-mb-8 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between">
        <div className="tw-flex tw-items-center tw-gap-4">
          <span className="tw-grid tw-h-14 tw-w-14 tw-shrink-0 tw-place-items-center tw-rounded-2xl tw-bg-gradient-to-br tw-from-primary tw-to-[hsl(38,80%,48%)] tw-text-lg tw-font-extrabold tw-text-[hsl(222,47%,10%)] tw-shadow-gold">
            {initiales}
          </span>
          <div>
            <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-primary/90">Espace étudiant</p>
            <h1 className="tw-text-2xl tw-font-extrabold tw-tracking-tight tw-text-foreground sm:tw-text-[28px]">
              Bienvenue, {prenom || 'étudiant'} 👋
            </h1>
            <p className="tw-mt-1 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-sm tw-text-muted-foreground">
              <span className="tw-inline-flex tw-items-center tw-gap-1.5"><FaUniversity className="tw-text-primary/70" /> {aca.universite || '—'}</span>
              <span className="tw-text-muted-foreground/40">•</span>
              <span className="tw-inline-flex tw-items-center tw-gap-1.5"><FaBook className="tw-text-primary/70" /> {aca.filiere || '—'}</span>
              <span className="tw-text-muted-foreground/40">•</span>
              <span className="tw-inline-flex tw-items-center tw-gap-1.5"><FaGraduationCap className="tw-text-primary/70" /> {aca.promotion || '—'}</span>
            </p>
          </div>
        </div>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          <span className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-primary/20 tw-bg-primary/10 tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-text-primary">
            <FaUserGraduate /> {etu.matricule || '—'}
          </span>
          <span className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-white/10 tw-bg-white/[0.04] tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-text-muted-foreground">
            <FaCalendarAlt /> {aca.anneeAcademique || '—'}
          </span>
        </div>
      </header>

      {/* KPI */}
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
        <Kpi icon={FaFileInvoice} label="Total attendu" value={`${fin.montantTotal ?? 0} USD`} hint="Frais de l'année" tone={GOLD} delay={0} />
        <Kpi icon={FaCheckCircle} label="Déjà payé" value={`${fin.montantPaye ?? 0} USD`} hint={`${fin.pourcentage ?? 0}% couvert`} tone={TEAL} delay={70} />
        <Kpi icon={FaExclamationTriangle} label={solde > 0 ? 'Reste à payer' : 'Solde'} value={solde > 0 ? `${solde} USD` : 'Soldé ✓'} hint={solde > 0 ? 'À régler' : 'À jour'} tone={solde > 0 ? RED : TEAL} delay={140} />
        <Kpi icon={FaGraduationCap} label="Moyenne générale" value={`${moyenne}/20`} hint={mentionLabel(moyenne)} tone={BLUE} delay={210} />
      </div>

      {/* Situation financière + frais à payer */}
      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-3">
        <Panel
          title="Situation financière"
          subtitle="Couverture des frais académiques"
          icon={FaCreditCard}
          className="lg:tw-col-span-2"
          action={<Link to="/etudiant/frais" className="tw-text-sm tw-font-semibold tw-text-primary hover:tw-underline">Détails</Link>}
        >
          <div className="tw-flex tw-flex-col tw-items-center tw-gap-6 sm:tw-flex-row sm:tw-gap-8">
            <Ring percent={fin.pourcentage ?? 0} label="Couverture financière" color={(fin.pourcentage ?? 0) >= 80 ? TEAL : GOLD} />
            <div className="tw-grid tw-w-full tw-grid-cols-1 tw-gap-2.5 sm:tw-grid-cols-3">
              <div className="tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-3">
                <p className="tw-text-xs tw-text-muted-foreground">Total</p>
                <p className="tw-mt-1 tw-text-lg tw-font-bold tw-text-foreground">{fin.montantTotal ?? 0} USD</p>
              </div>
              <div className="tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-3">
                <p className="tw-text-xs tw-text-muted-foreground">Payé</p>
                <p className="tw-mt-1 tw-text-lg tw-font-bold" style={{ color: TEAL }}>{fin.montantPaye ?? 0} USD</p>
              </div>
              <div className="tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-3">
                <p className="tw-text-xs tw-text-muted-foreground">Reste</p>
                <p className="tw-mt-1 tw-text-lg tw-font-bold" style={{ color: solde > 0 ? RED : TEAL }}>{solde} USD</p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title="Frais à payer"
          subtitle={`${dettes.length} frais en attente`}
          icon={FaFileInvoice}
          action={<Link to="/etudiant/frais" className="tw-text-sm tw-font-semibold tw-text-primary hover:tw-underline">Payer</Link>}
        >
          {dettes.length === 0 ? (
            <p className="tw-py-6 tw-text-center tw-text-sm tw-text-muted-foreground">Aucun frais en attente. 🎉</p>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-2.5">
              {dettes.slice(0, 5).map((d, i) => (
                <div key={d.id || i} className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-3">
                  <span className="tw-grid tw-h-9 tw-w-9 tw-shrink-0 tw-place-items-center tw-rounded-lg tw-bg-primary/10 tw-text-primary"><FaFileInvoice /></span>
                  <div className="tw-min-w-0 tw-flex-1">
                    <p className="tw-truncate tw-text-sm tw-font-semibold tw-text-foreground">{d.libelle || d.fraisLibelle || 'Frais à payer'}</p>
                    <p className="tw-truncate tw-text-xs tw-text-muted-foreground">{d.dateEcheance ? `Échéance : ${d.dateEcheance}` : 'Via TachPay'}</p>
                  </div>
                  <span className="tw-shrink-0 tw-text-sm tw-font-bold" style={{ color: d.estEnRetard ? RED : GOLD }}>{d.reste || 0} USD</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Cours du jour + progression */}
      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-3">
        <Panel
          title="Cours du jour"
          subtitle="Votre emploi du temps du jour"
          icon={FaCalendarDay}
          className="lg:tw-col-span-2"
          action={<Link to="/etudiant/horaire" className="tw-text-sm tw-font-semibold tw-text-primary hover:tw-underline">Emploi du temps</Link>}
        >
          {coursDuJour.length === 0 ? (
            <p className="tw-py-6 tw-text-center tw-text-sm tw-text-muted-foreground">Aucun cours prévu aujourd'hui. 🎉</p>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-2.5">
              {coursDuJour.map((c, i) => (
                <div key={i} className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-3">
                  <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-1.5 tw-rounded-md tw-bg-primary/10 tw-px-2.5 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-primary">
                    <FaClock /> {c.heure || '—'}
                  </div>
                  <div className="tw-min-w-0 tw-flex-1">
                    <p className="tw-truncate tw-text-sm tw-font-semibold tw-text-foreground">{c.titre}</p>
                    <p className="tw-truncate tw-text-xs tw-text-muted-foreground">
                      <FaLocationArrow className="tw-mr-1 tw-inline" />{c.salle || 'À définir'} · <FaUser className="tw-mx-1 tw-inline" />{c.professeur || 'À définir'}
                    </p>
                  </div>
                  <span className="tw-inline-flex tw-shrink-0 tw-items-center tw-gap-1.5 tw-rounded-full tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-medium" style={{ background: alpha(TEAL, 0.12), color: TEAL }}>● En cours</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Progression" subtitle="Parcours académique" icon={FaChartBar}>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-around tw-gap-4">
            <Ring size={116} percent={(notes.creditsValides / 240) * 100} value={`${notes.creditsValides ?? 0}`} label="Crédits / 240" color={BLUE} />
            <Ring size={116} percent={moyenne * 5} value={`${moyenne}`} label="Moyenne / 20" color={GOLD} />
          </div>
        </Panel>
      </div>

      {/* Actions rapides */}
      <section className="tw-mt-6 tw-animate-gu-fade-up">
        <h2 className="tw-mb-3 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-muted-foreground">Actions rapides</h2>
        <div className="tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-grid-cols-3 lg:tw-grid-cols-6">
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

      {/* Notifications + événements */}
      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2">
        <Panel
          title="Notifications récentes"
          icon={FaBell}
          action={<Link to="/etudiant/notifications" className="tw-text-sm tw-font-semibold tw-text-primary hover:tw-underline">Tout voir</Link>}
        >
          {notifications.length === 0 ? (
            <p className="tw-py-6 tw-text-center tw-text-sm tw-text-muted-foreground">Aucune notification.</p>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-3">
              {notifications.slice(0, 4).map((n, i) => (
                <div key={i} className="tw-flex tw-items-start tw-gap-3">
                  <span className="tw-mt-1.5 tw-h-2 tw-w-2 tw-shrink-0 tw-rounded-full" style={{ background: n.type === 'URGENT' ? RED : BLUE }} />
                  <div className="tw-min-w-0 tw-flex-1">
                    <p className="tw-text-sm tw-text-foreground">{n.message}</p>
                    <p className="tw-mt-0.5 tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-text-muted-foreground"><FaClock /> {n.date || 'Récent'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Événements à venir"
          icon={FaCalendarAlt}
          action={<Link to="/etudiant/horaire" className="tw-text-sm tw-font-semibold tw-text-primary hover:tw-underline">Tout voir</Link>}
        >
          {evenements.length === 0 ? (
            <p className="tw-py-6 tw-text-center tw-text-sm tw-text-muted-foreground">Aucun événement à venir.</p>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-3">
              {evenements.slice(0, 4).map((e, i) => {
                const dt = e.date ? new Date(e.date) : null;
                return (
                  <div key={i} className="tw-flex tw-items-center tw-gap-3">
                    <div className="tw-grid tw-h-12 tw-w-12 tw-shrink-0 tw-place-items-center tw-rounded-lg tw-border tw-border-primary/20 tw-bg-primary/10">
                      <span className="tw-text-base tw-font-extrabold tw-leading-none tw-text-primary">{dt ? dt.getDate() : '—'}</span>
                      <span className="tw-text-[10px] tw-uppercase tw-text-primary/70">{dt ? dt.toLocaleString('fr-FR', { month: 'short' }) : ''}</span>
                    </div>
                    <div className="tw-min-w-0 tw-flex-1">
                      <p className="tw-truncate tw-text-sm tw-font-semibold tw-text-foreground">{e.titre}</p>
                      <p className="tw-truncate tw-text-xs tw-text-muted-foreground"><FaLocationArrow className="tw-mr-1 tw-inline" />{e.salle || 'À définir'}</p>
                    </div>
                    <FaChevronRight className="tw-shrink-0 tw-text-muted-foreground/50" />
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      {/* Pied : accès complet */}
      <div className="tw-mt-6 tw-flex tw-justify-center tw-animate-gu-fade-up">
        <Link
          to="/etudiant/parcours"
          className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-primary/25 tw-bg-primary/10 tw-px-4 tw-text-sm tw-font-semibold tw-text-primary hover:tw-bg-primary/15"
        >
          Voir mon parcours complet <FaArrowRight />
        </Link>
      </div>
    </div>
  );
}
