import { useEffect, useId, useMemo, useRef, useState } from 'react'

export interface SearchableSelectProps {
  value: string
  options: string[]
  onChange: (value: string) => void
  placeholder?: string
  allowEmpty?: boolean
  emptyLabel?: string
  className?: string
}

export function SearchableSelect({
  value,
  options,
  onChange,
  placeholder = 'Cerca…',
  allowEmpty = true,
  emptyLabel = '—',
  className = '',
}: SearchableSelectProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? options.filter((o) => o.toLowerCase().includes(q))
      : options
    return list.slice(0, 80)
  }, [options, query])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded border border-showdown-border bg-white px-2 py-1.5 text-left text-sm hover:border-showdown-accent dark:border-showdown-dark-border dark:bg-showdown-dark-panel"
      >
        <span className="min-w-0 truncate">{value || emptyLabel}</span>
        <span className="text-gray-400">▾</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-hidden rounded border border-showdown-border bg-white shadow-lg dark:border-showdown-dark-border dark:bg-showdown-dark-panel">
          <div className="border-b border-showdown-border p-2 dark:border-showdown-dark-border">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded border border-showdown-border px-2 py-1 text-sm dark:border-showdown-dark-border dark:bg-showdown-dark-bg"
              autoFocus
            />
          </div>
          <ul id={listId} className="max-h-40 overflow-y-auto text-sm">
            {allowEmpty && (
              <li>
                <button
                  type="button"
                  className="w-full px-2 py-1.5 text-left text-gray-400 hover:bg-showdown-hover dark:hover:bg-showdown-dark-border/40"
                  onClick={() => {
                    onChange('')
                    setOpen(false)
                    setQuery('')
                  }}
                >
                  {emptyLabel}
                </button>
              </li>
            )}
            {filtered.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  className={`w-full px-2 py-1.5 text-left hover:bg-showdown-hover dark:hover:bg-showdown-dark-border/40 ${
                    opt === value ? 'text-showdown-accent font-medium' : ''
                  }`}
                  onClick={() => {
                    onChange(opt)
                    setOpen(false)
                    setQuery('')
                  }}
                >
                  {opt}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-2 py-3 text-center text-gray-400">Nessun risultato</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
