import type { ReactNode } from 'react'

export type AppTab = 'teambuilder' | 'calc' | 'speed'

export interface AppLayoutProps {
  children: ReactNode
  activeTab: AppTab
  onTabChange?: (tab: AppTab) => void
}

const TABS: { id: AppTab; label: string; enabled: boolean }[] = [
  { id: 'teambuilder', label: 'Teambuilder', enabled: true },
  { id: 'calc', label: 'Damage Calc', enabled: true },
  { id: 'speed', label: 'Speed Tiers', enabled: true },
]

export function AppLayout({
  children,
  activeTab,
  onTabChange,
}: AppLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-showdown-border bg-showdown-panel/95 backdrop-blur dark:border-showdown-dark-border dark:bg-showdown-dark-panel/95">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <h1 className="text-lg font-semibold text-showdown-accent shrink-0">
            Compendium
          </h1>
          <nav className="flex flex-1 gap-1 overflow-x-auto">
            {TABS.map((tab) => {
              const isActive = tab.id === activeTab
              const canNavigate = tab.enabled && onTabChange

              if (canNavigate) {
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange(tab.id)}
                    className={`shrink-0 rounded px-3 py-1.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-showdown-accent text-white'
                        : 'text-showdown-accent hover:bg-showdown-hover dark:hover:bg-showdown-dark-panel'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              }

              return (
                <span
                  key={tab.id}
                  className={`shrink-0 rounded px-3 py-1.5 text-sm ${
                    isActive
                      ? 'bg-showdown-accent text-white'
                      : 'cursor-not-allowed text-gray-400'
                  }`}
                  title="Prossimamente"
                >
                  {tab.label}
                  <span className="ml-1 text-[10px] opacity-70">soon</span>
                </span>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  )
}
