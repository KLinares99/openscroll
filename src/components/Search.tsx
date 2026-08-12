import { useEffect, useMemo, useRef, useState } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import { Canon, getCorpus } from '../lib/data'
import type { Ref } from '../lib/types'

interface Props {
  canon: Canon
  onGoto: (r: Ref) => void
}

interface Hit {
  ordinal: number
  text: string
}

const LIMIT = 200

export default function Search({ canon, onGoto }: Props) {
  const [query, setQuery] = useState('')
  const [corpus, setCorpus] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [scope, setScope] = useState<'all' | 'ot' | 'nt'>('all')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLoading(true)
    getCorpus()
      .then(setCorpus)
      .finally(() => setLoading(false))
    input.current?.focus()
  }, [])

  const hits = useMemo<Hit[]>(() => {
    const q = query.trim()
    if (!corpus || q.length < 2) return []

    // Quoted input searches the exact phrase; otherwise every word must appear.
    const phrase = /^".*"$/.test(q)
    const needles = phrase
      ? [q.slice(1, -1).toLowerCase()]
      : q.toLowerCase().split(/\s+/).filter(Boolean)

    const out: Hit[] = []
    for (let i = 0; i < corpus.length && out.length < LIMIT; i++) {
      if (scope !== 'all') {
        const isNt = i >= canon.toOrdinal({ b: 39, c: 1, v: 1 })
        if ((scope === 'nt') !== isNt) continue
      }
      const lower = corpus[i].toLowerCase()
      let ok = true
      for (const n of needles) {
        if (!lower.includes(n)) {
          ok = false
          break
        }
      }
      if (ok) out.push({ ordinal: i, text: corpus[i] })
    }
    return out
  }, [query, corpus, scope, canon])

  const terms = useMemo(() => {
    const q = query.trim()
    if (/^".*"$/.test(q)) return [q.slice(1, -1)]
    return q.split(/\s+/).filter((t) => t.length > 1)
  }, [query])

  return (
    <div className="safe-top flex h-full flex-col">
      <div className="px-5 pb-3 pt-4">
        <div
          className="flex items-center gap-2 rounded-full border px-4 py-2.5"
          style={{ borderColor: 'var(--line)', background: 'var(--bg-soft)' }}
        >
          <SearchIcon size={16} style={{ color: 'var(--fg-dim)' }} />
          <input
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search all 31,102 verses — "quote for exact phrase"'
            className="w-full bg-transparent text-sm outline-none"
            style={{ color: 'var(--fg)' }}
            enterKeyHint="search"
          />
        </div>
        <div className="mt-3 flex gap-1.5">
          {([['all', 'Whole Bible'], ['ot', 'Old Testament'], ['nt', 'New Testament']] as const).map(
            ([id, label]) => (
              <button
                key={id}
                onClick={() => setScope(id)}
                className="rounded-full border px-3 py-1 text-xs"
                style={{
                  borderColor: scope === id ? 'var(--accent)' : 'var(--line)',
                  color: scope === id ? 'var(--accent)' : 'var(--fg-dim)',
                }}
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-28">
        {loading && (
          <p className="py-8 text-center text-sm" style={{ color: 'var(--fg-dim)' }}>
            Loading the text — this happens once, then search works offline.
          </p>
        )}
        {!loading && query.trim().length >= 2 && (
          <p className="mb-3 text-xs" style={{ color: 'var(--fg-dim)' }}>
            {hits.length === LIMIT ? `First ${LIMIT}` : hits.length} match
            {hits.length === 1 ? '' : 'es'}
          </p>
        )}
        {hits.map((hit) => {
          const r = canon.fromOrdinal(hit.ordinal)
          return (
            <button
              key={hit.ordinal}
              onClick={() => onGoto(r)}
              className="mb-2 block w-full rounded-xl border p-3 text-left"
              style={{ borderColor: 'var(--line)' }}
            >
              <div className="mb-1 text-xs font-medium" style={{ color: 'var(--accent)' }}>
                {canon.label(r)}
              </div>
              <p className="text-sm" style={{ color: 'var(--fg-dim)' }}>
                {highlight(hit.text, terms)}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Wrap each matched term so readers can see why a verse came back. */
function highlight(text: string, terms: string[]) {
  if (!terms.length) return text
  const pattern = new RegExp(`(${terms.map(escapeRegex).join('|')})`, 'gi')
  const lowered = terms.map((t) => t.toLowerCase())
  return text.split(pattern).map((part, i) =>
    lowered.includes(part.toLowerCase()) ? (
      <mark key={i} style={{ background: 'transparent', color: 'var(--fg)', fontWeight: 600 }}>
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
