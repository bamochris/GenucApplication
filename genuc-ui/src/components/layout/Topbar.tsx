import { Menu, Search, Bell, LifeBuoy, ChevronDown } from 'lucide-react'
import { Avatar, Kbd } from '@/components/ui/misc'

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 glass-strong px-4 sm:px-6">
      <button
        onClick={onOpenMenu}
        aria-label="Ouvrir le menu"
        className="grid h-10 w-10 place-items-center rounded-lg text-muted-foreground hover:bg-white/[0.06] lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Recherche */}
      <div className="relative hidden max-w-md flex-1 items-center sm:flex">
        <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Rechercher étudiants, dossiers, facultés…"
          aria-label="Rechercher"
          className="h-10 w-full rounded-lg border border-input bg-white/[0.03] pl-10 pr-16 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        />
        <div className="absolute right-3 hidden items-center gap-1 md:flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button
          aria-label="Aide"
          className="hidden h-10 w-10 place-items-center rounded-lg text-muted-foreground hover:bg-white/[0.06] hover:text-foreground sm:grid"
        >
          <LifeBuoy className="h-[18px] w-[18px]" />
        </button>
        <button
          aria-label="Notifications"
          className="relative grid h-10 w-10 place-items-center rounded-lg text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 animate-pulse-ring rounded-full bg-primary" />
        </button>

        <div className="mx-1 hidden h-6 w-px bg-border/70 sm:block" />

        <button className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 text-left transition-colors hover:bg-white/[0.05]">
          <Avatar initials="CB" seed={1} className="h-9 w-9" />
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold text-foreground">Christian Bamo</p>
            <p className="text-[11px] text-muted-foreground">Admin — HEC Kinshasa</p>
          </div>
          <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
        </button>
      </div>
    </header>
  )
}
