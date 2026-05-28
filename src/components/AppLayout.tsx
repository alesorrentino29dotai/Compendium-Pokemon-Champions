import type { ReactNode } from 'react'

export type AppTab = 'teambuilder' | 'calc' | 'speed'

export interface AppLayoutProps {
  children: ReactNode
  activeTab: AppTab
  onTabChange?: (tab: AppTab) => void
}

const TABS: {
  id: AppTab
  label: string
  shortLabel: string
  enabled: boolean
}[] = [
  { id: 'teambuilder', label: 'Teambuilder', shortLabel: 'Team', enabled: true },
  { id: 'calc', label: 'Damage Calc', shortLabel: 'Calc', enabled: true },
  { id: 'speed', label: 'Speed Tiers', shortLabel: 'Speed', enabled: true },
]

function tabButtonClass(isActive: boolean, mobile?: boolean): string {
  if (mobile) {
    const base =
      'flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px]'
    return isActive
      ? `${base} font-semibold text-showdown-accent`
      : `${base} font-medium text-gray-500 dark:text-gray-400`
  }

  return isActive
    ? 'shrink-0 rounded px-3 py-2 text-sm bg-showdown-accent text-white transition-colors'
    : 'shrink-0 rounded px-3 py-2 text-sm text-showdown-accent transition-colors hover:bg-showdown-hover dark:hover:bg-showdown-dark-panel'
}

export function AppLayout({
  children,
  activeTab,
  onTabChange,
}: AppLayoutProps) {
  const renderTab = (
    tab: (typeof TABS)[number],
    mobile: boolean,
  ) => {
    const isActive = tab.id === activeTab
    const canNavigate = tab.enabled && onTabChange
    const label = mobile ? tab.shortLabel : tab.label

    if (canNavigate) {
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={tabButtonClass(isActive, mobile)}
          aria-current={isActive ? 'page' : undefined}
        >
          {mobile && (
            <span
              className={`h-1 w-8 rounded-full ${
                isActive ? 'bg-showdown-accent' : 'bg-transparent'
              }`}
              aria-hidden
            />
          )}
          {label}
        </button>
      )
    }

    return (
      <span
        key={tab.id}
        className={`${tabButtonClass(isActive, mobile)} cursor-not-allowed opacity-60`}
        title="Prossimamente"
      >
        {label}
      </span>
    )
  }

  return (
    <div className="flex min-h-dvh min-w-0 flex-col overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-showdown-border bg-showdown-panel/95 pt-safe backdrop-blur dark:border-showdown-dark-border dark:bg-showdown-dark-panel/95">
        <div className="mx-auto flex w-full max-w-6xl min-w-0 items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
          <h1 className="shrink-0 text-base font-semibold text-showdown-accent sm:text-lg">
            Compendium
          </h1>
          <nav className="hidden flex-1 gap-1 overflow-x-auto md:flex">
            {TABS.map((tab) => renderTab(tab, false))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl min-w-0 flex-1 px-3 py-3 pb-24 sm:px-4 sm:py-4 md:px-6 md:py-6 md:pb-6">
        {children}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-showdown-border bg-showdown-panel/95 pb-safe backdrop-blur md:hidden dark:border-showdown-dark-border dark:bg-showdown-dark-panel/95"
        aria-label="Navigazione principale"
      >
        <div className="mx-auto flex max-w-6xl">
          {TABS.map((tab) => renderTab(tab, true))}
        </div>
      </nav>
    </div>
  )
}
