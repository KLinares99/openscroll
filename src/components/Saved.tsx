import { useEffect, useState } from 'react'
import { Bookmark, Highlighter, MessageSquareText, Trash2 } from 'lucide-react'
import { Canon, getVerseText } from '../lib/data'
import { setHighlight, setNote, toggleSaved, useStore } from '../lib/store'
import { parseRefKey, type Ref } from '../lib/types'

type Filter = 'saved' | 'notes' | 'highlights'

interface Props {
  canon: Canon
  onGoto: (r: Ref) => void
}

export default function Saved({ canon, onGoto }: Props) {
  const store = useStore()
  const [filter, setFilter] = useState<Filter>('saved')
  const [texts, setTexts] = useState<Record<string, string>>({})

  const keys =
    filter === 'saved'
      ? store.saved
      : filter === 'notes'
        ? Object.keys(store.notes)
        : Object.keys(store.highlights)

  useEffect(() => {
    let cancelled = false
    Promise.all(
      keys
        .filter((k) => !texts[k])
        .slice(0, 60)
        .map(async (k) => [k, await getVerseText('kjv', parseRefKey(k))] as const)
    )
      .then((rows) => {
        if (cancelled || !rows.length) return
        setTexts((prev) => ({ ...prev, ...Object.fromEntries(rows) }))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.join(',')])

  const tabs: { id: Filter; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'saved', label: 'Saved', icon: <Bookmark size={14} />, count: store.saved.length },
    {
      id: 'notes',
      label: 'Notes',
      icon: <MessageSquareText size={14} />,
      count: Object.keys(store.notes).length,
    },
    {
      id: 'highlights',
      label: 'Highlights',
      icon: <Highlighter size={14} />,
      count: Object.keys(store.highlights).length,
    },
  ]

  return (
    <div className="safe-top h-full overflow-y-auto px-5 pb-28 pt-4">
      <h1 className="mb-4 text-xl font-semibold">Your marks</h1>
      <div className="mb-4 flex gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs"
            style={{
              borderColor: filter === t.id ? 'var(--accent)' : 'var(--line)',
              color: filter === t.id ? 'var(--accent)' : 'var(--fg-dim)',
            }}
          >
            {t.icon}
            {t.label} {t.count > 0 && <span className="opacity-70">{t.count}</span>}
          </button>
        ))}
      </div>

      {keys.length === 0 && (
        <p className="py-10 text-center text-sm" style={{ color: 'var(--fg-dim)' }}>
          Nothing here yet. Tap the icons beside a verse while you scroll.
        </p>
      )}

      {keys.map((key) => {
        const r = parseRefKey(key)
        return (
          <div
            key={key}
            className="mb-2 rounded-xl border p-3"
            style={{
              borderColor: 'var(--line)',
              borderLeftWidth: filter === 'highlights' ? 4 : 1,
              borderLeftColor: filter === 'highlights' ? store.highlights[key] : 'var(--line)',
            }}
          >
            <div className="mb-1 flex items-center justify-between">
              <button
                onClick={() => onGoto(r)}
                className="text-xs font-medium"
                style={{ color: 'var(--accent)' }}
              >
                {canon.label(r)}
              </button>
              <button
                aria-label="Remove"
                onClick={() => {
                  if (filter === 'saved') toggleSaved(key)
                  else if (filter === 'notes') setNote(key, '')
                  else setHighlight(key, null)
                }}
                style={{ color: 'var(--fg-dim)' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
            <p className="text-sm" style={{ color: 'var(--fg-dim)' }}>
              {texts[key] ?? '…'}
            </p>
            {filter === 'notes' && (
              <p className="mt-2 border-l-2 pl-2 text-sm italic" style={{ borderColor: 'var(--accent)' }}>
                {store.notes[key]}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
