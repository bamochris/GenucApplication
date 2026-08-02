// Kit partagé du design « premium » (bleu nuit & or) pour les dashboards de rôle.
// Primitives réutilisables : palette, helper d'opacité, wrapper, en-tête, KPI,
// panneaux, anneau SVG, tuiles d'actions, pastilles de statut. Utilisé par les
// variantes *DashboardPremium.jsx (opt-in via le sélecteur de design, réversible).
// Tailwind préfixé tw- + classes .glass (scopées sous .design-premium).
import { Link } from 'react-router-dom';

// Palette premium (or, teal, bleu, rouge, violet).
export const GOLD = 'hsl(41 84% 60%)';
export const TEAL = 'hsl(152 55% 45%)';
export const BLUE = 'hsl(212 92% 62%)';
export const RED = 'hsl(0 72% 55%)';
export const PURPLE = 'hsl(263 70% 68%)';

// Applique une opacité à une couleur hsl(...) sans virgule finale.
export const alpha = (color, a) => color.replace(')', ` / ${a})`);

// Wrapper de page premium (rétablit le scope .design-premium pour les classes tw-).
export function PremiumPage({ children }) {
  return <div className="design-premium tw-min-h-full">{children}</div>;
}

// En-tête standard : pastille d'initiales dorée + eyebrow + titre + sous-titre + badges/action.
export function PremiumHeader({ initials = 'GU', eyebrow, title, subtitle, badges = null, action = null }) {
  return (
    <header className="tw-mb-6 tw-flex tw-flex-col tw-gap-5 tw-animate-gu-fade-up sm:tw-mb-8 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between">
      <div className="tw-flex tw-items-center tw-gap-4">
        <span className="tw-grid tw-h-14 tw-w-14 tw-shrink-0 tw-place-items-center tw-rounded-2xl tw-bg-gradient-to-br tw-from-primary tw-to-[hsl(38,80%,48%)] tw-text-lg tw-font-extrabold tw-text-[hsl(222,47%,10%)] tw-shadow-gold">
          {initials}
        </span>
        <div>
          {eyebrow && <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-primary/90">{eyebrow}</p>}
          <h1 className="tw-text-2xl tw-font-extrabold tw-tracking-tight tw-text-foreground sm:tw-text-[28px]">{title}</h1>
          {subtitle && <p className="tw-mt-1 tw-text-sm tw-text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {(badges || action) && (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          {badges}
          {action}
        </div>
      )}
    </header>
  );
}

// Badge d'en-tête (info doré par défaut).
export function HeaderBadge({ icon: Icon, children, tone = 'gold' }) {
  const cls = tone === 'gold'
    ? 'tw-border-primary/20 tw-bg-primary/10 tw-text-primary'
    : 'tw-border-white/10 tw-bg-white/[0.04] tw-text-muted-foreground';
  return (
    <span className={`tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium ${cls}`}>
      {Icon && <Icon />} {children}
    </span>
  );
}

// Bouton d'action principal (dégradé doré).
export function PrimaryButton({ to, icon: Icon, children }) {
  return (
    <Link
      to={to}
      className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-bg-gradient-to-b tw-from-primary tw-to-[hsl(41,84%,52%)] tw-px-4 tw-text-sm tw-font-semibold tw-text-primary-foreground tw-shadow-gold hover:tw-brightness-105"
    >
      {children} {Icon && <Icon />}
    </Link>
  );
}

// Carte KPI avec pastille d'icône teintée + halo.
export function Kpi({ icon: Icon, label, value, hint, tone = GOLD, delay = 0 }) {
  return (
    <article
      className="glass tw-relative tw-overflow-hidden tw-rounded-xl tw-p-5 tw-animate-gu-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="tw-pointer-events-none tw-absolute -tw-right-8 -tw-top-10 tw-h-28 tw-w-28 tw-rounded-full tw-blur-2xl" style={{ background: alpha(tone, 0.14) }} />
      {Icon && (
        <div className="tw-grid tw-h-11 tw-w-11 tw-place-items-center tw-rounded-xl tw-border" style={{ borderColor: alpha(tone, 0.25), background: alpha(tone, 0.12), color: tone }}>
          <Icon />
        </div>
      )}
      <p className="tw-mt-4 tw-text-sm tw-text-muted-foreground">{label}</p>
      <p className="tw-mt-1 tw-text-2xl tw-font-extrabold tw-tracking-tight tw-text-foreground sm:tw-text-3xl">{value}</p>
      {hint && <p className="tw-mt-1 tw-text-xs tw-text-muted-foreground">{hint}</p>}
    </article>
  );
}

// Grille de KPI (1→2→4 colonnes).
export function KpiGrid({ children }) {
  return <div className="tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 xl:tw-grid-cols-4">{children}</div>;
}

// Panneau en verre avec en-tête (icône + titre + sous-titre + action).
export function Panel({ title, subtitle, icon: Icon, action, children, className = '' }) {
  return (
    <section className={`glass tw-rounded-xl tw-p-5 tw-shadow-glass tw-animate-gu-fade-up ${className}`}>
      {(title || action) && (
        <div className="tw-mb-4 tw-flex tw-items-start tw-justify-between tw-gap-3">
          <div className="tw-flex tw-items-center tw-gap-2.5">
            {Icon && (
              <span className="tw-grid tw-h-8 tw-w-8 tw-place-items-center tw-rounded-lg tw-bg-primary/10 tw-text-primary">
                <Icon />
              </span>
            )}
            <div>
              {title && <h2 className="tw-text-base tw-font-semibold tw-text-foreground">{title}</h2>}
              {subtitle && <p className="tw-text-sm tw-text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// Lien « voir tout » discret.
export function PanelLink({ to, children }) {
  return <Link to={to} className="tw-text-sm tw-font-semibold tw-text-primary hover:tw-underline">{children}</Link>;
}

// Message d'état vide centré.
export function Empty({ children }) {
  return <p className="tw-py-6 tw-text-center tw-text-sm tw-text-muted-foreground">{children}</p>;
}

// Pastille de statut colorée.
export function Pill({ children, tone = GOLD }) {
  return (
    <span className="tw-inline-flex tw-shrink-0 tw-items-center tw-gap-1.5 tw-rounded-full tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-medium" style={{ background: alpha(tone, 0.12), color: tone }}>
      {children}
    </span>
  );
}

// Anneau de progression SVG.
export function Ring({ percent = 0, label, value, color = GOLD, size = 128 }) {
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
      {label && <p className="tw-max-w-[140px] tw-text-center tw-text-xs tw-text-muted-foreground">{label}</p>}
    </div>
  );
}

// Ligne de liste générique : avatar/icône teintée + titre + sous-titre + valeur/à-droite.
export function Row({ icon: Icon, iconTone = GOLD, title, subtitle, right }) {
  return (
    <div className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-3">
      {Icon && (
        <span className="tw-grid tw-h-9 tw-w-9 tw-shrink-0 tw-place-items-center tw-rounded-lg" style={{ background: alpha(iconTone, 0.12), color: iconTone }}>
          <Icon />
        </span>
      )}
      <div className="tw-min-w-0 tw-flex-1">
        <p className="tw-truncate tw-text-sm tw-font-semibold tw-text-foreground">{title}</p>
        {subtitle && <p className="tw-truncate tw-text-xs tw-text-muted-foreground">{subtitle}</p>}
      </div>
      {right != null && <div className="tw-shrink-0 tw-text-right">{right}</div>}
    </div>
  );
}

// Petit bouton premium (action inline dans une liste).
export function SmallButton({ onClick, tone = GOLD, danger = false, children, title, icon: Icon }) {
  const c = danger ? RED : tone;
  return (
    <button
      type="button" onClick={onClick} title={title}
      className="tw-inline-flex tw-h-8 tw-shrink-0 tw-items-center tw-gap-1.5 tw-rounded-md tw-px-2.5 tw-text-xs tw-font-semibold tw-transition hover:tw-brightness-110"
      style={{ background: alpha(c, 0.14), color: c, border: `1px solid ${alpha(c, 0.3)}` }}
    >
      {Icon && <Icon />} {children}
    </button>
  );
}

// Petit lien premium stylé comme un bouton.
export function SmallLink({ to, tone = GOLD, children, icon: Icon }) {
  return (
    <Link
      to={to}
      className="tw-inline-flex tw-h-8 tw-shrink-0 tw-items-center tw-gap-1.5 tw-rounded-md tw-px-2.5 tw-text-xs tw-font-semibold tw-transition hover:tw-brightness-110"
      style={{ background: alpha(tone, 0.14), color: tone, border: `1px solid ${alpha(tone, 0.3)}` }}
    >
      {Icon && <Icon />} {children}
    </Link>
  );
}

// Sélecteur premium (select stylé verre).
export function PremiumSelect({ value, onChange, children, label }) {
  return (
    <label className="tw-flex tw-flex-col tw-gap-1.5">
      {label && <span className="tw-text-xs tw-font-medium tw-text-muted-foreground">{label}</span>}
      <select
        value={value}
        onChange={onChange}
        className="tw-h-10 tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/[0.04] tw-px-3 tw-text-sm tw-text-foreground tw-outline-none focus:tw-border-primary/40"
      >
        {children}
      </select>
    </label>
  );
}

// Grille de tuiles d'actions rapides (actions : {icon,label,to,tone}).
export function ActionTiles({ actions = [], title = 'Actions rapides' }) {
  if (!actions.length) return null;
  return (
    <section className="tw-mt-6 tw-animate-gu-fade-up">
      {title && <h2 className="tw-mb-3 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-muted-foreground">{title}</h2>}
      <div className="tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-grid-cols-3 lg:tw-grid-cols-6">
        {actions.map((a) => (
          <Link
            key={a.to + a.label}
            to={a.to}
            className="glass tw-group tw-flex tw-flex-col tw-items-center tw-gap-2.5 tw-rounded-xl tw-p-4 tw-text-center tw-transition hover:tw-border-primary/30"
          >
            <span className="tw-grid tw-h-11 tw-w-11 tw-place-items-center tw-rounded-xl tw-border tw-transition group-hover:tw-scale-105" style={{ borderColor: alpha(a.tone || GOLD, 0.25), background: alpha(a.tone || GOLD, 0.12), color: a.tone || GOLD }}>
              <a.icon />
            </span>
            <span className="tw-text-xs tw-font-semibold tw-text-foreground">{a.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// Utilitaire : initiales à partir d'un prénom/nom (ou d'une chaîne).
export function initialsOf(a, b) {
  if (b !== undefined) return `${(a?.[0] || '')}${(b?.[0] || '')}`.toUpperCase() || 'GU';
  return String(a || '?').split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'GU';
}
