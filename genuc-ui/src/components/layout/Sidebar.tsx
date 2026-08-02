import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, ChevronLeft, Sparkles, X } from 'lucide-react'
import { navSections } from './nav'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn('flex items-center gap-3 px-3 py-1', collapsed && 'justify-center px-0')}>
      <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-[hsl(38,80%,48%)] text-[hsl(222,47%,10%)] shadow-gold">
        <GraduationCap className="h-5 w-5" />
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <p className="text-sm font-extrabold tracking-tight text-foreground">GENUC</p>
          <p className="text-[11px] font-medium text-muted-foreground">University Suite</p>
        </div>
      )}
    </div>
  )
}

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-2">
      {navSections.map((section) => (
        <div key={section.title}>
          {!collapsed && (
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">
              {section.title}
            </p>
          )}
          <ul className="flex flex-col gap-1">
            {section.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      collapsed && 'justify-center px-0',
                      isActive
                        ? 'bg-primary/12 text-primary'
                        : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="active-pill"
                          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                          transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                        />
                      )}
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {!collapsed && item.badge && (
                        <Badge variant="neutral" className="ml-auto py-0 text-[10px]">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function UpgradeCard() {
  return (
    <div className="mx-3 mb-3 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.14] to-transparent p-4">
      <div className="mb-2 inline-flex items-center gap-1.5 text-primary">
        <Sparkles className="h-4 w-4" />
        <span className="text-xs font-semibold">Année 2025–2026</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Campagne d’admission ouverte. 18 dossiers en attente de validation.
      </p>
    </div>
  )
}

/** Sidebar desktop (rétractable) */
export function DesktopSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/60 glass-strong lg:flex transition-[width] duration-300',
        collapsed ? 'w-[76px]' : 'w-[264px]',
      )}
    >
      <div className="flex h-16 items-center justify-between px-3">
        <Brand collapsed={collapsed} />
        {!collapsed && (
          <button
            onClick={onToggle}
            aria-label="Réduire le menu"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>
      <NavList collapsed={collapsed} />
      {!collapsed && <UpgradeCard />}
      {collapsed && (
        <button
          onClick={onToggle}
          aria-label="Agrandir le menu"
          className="mx-auto mb-4 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 rotate-180" />
        </button>
      )}
    </aside>
  )
}

/** Sidebar mobile (drawer) */
export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className="absolute left-0 top-0 flex h-full w-[280px] flex-col glass-strong border-r border-border/60"
          >
            <div className="flex h-16 items-center justify-between px-4">
              <Brand collapsed={false} />
              <button
                onClick={onClose}
                aria-label="Fermer le menu"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-white/[0.06]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavList collapsed={false} onNavigate={onClose} />
            <UpgradeCard />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
