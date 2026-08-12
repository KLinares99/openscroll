import { useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
}

/** Bottom sheet used for study, notes and settings. */
export default function Sheet({ open, onClose, title, subtitle, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label={title}
        className="sheet-enter relative flex max-h-[88%] flex-col rounded-t-3xl border-t"
        style={{ background: 'var(--bg-soft)', borderColor: 'var(--line)' }}
      >
        <div
          className="flex items-start justify-between gap-4 border-b px-5 py-4"
          style={{ borderColor: 'var(--line)' }}
        >
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold">{title}</h2>
            {subtitle && (
              <p className="truncate text-xs" style={{ color: 'var(--fg-dim)' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 rounded-full p-2"
            style={{ color: 'var(--fg-dim)' }}
          >
            <X size={18} />
          </button>
        </div>
        <div className="safe-bottom overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
