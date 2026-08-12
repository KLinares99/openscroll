import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import type { Canon } from '../lib/data'
import { useStore } from '../lib/store'
import type { Ref } from '../lib/types'

interface Props {
  canon: Canon
  onGoto: (r: Ref) => void
}

export default function Library({ canon, onGoto }: Props) {
  const store = useStore()
  const [book, setBook] = useState<number | null>(null)

  if (book === null) {
    return (
      <div className="safe-top h-full overflow-y-auto px-5 pb-28 pt-4">
        <h1 className="mb-4 text-xl font-semibold">Library</h1>
        {(['ot', 'nt'] as const).map((testament) => (
          <section key={testament} className="mb-6">
            <h2
              className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: 'var(--accent)' }}
            >
              {testament === 'ot' ? 'Old Testament' : 'New Testament'}
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {canon.meta.books
                .filter((b) => b.t === testament)
                .map((b) => {
                  const readCount = store.read[b.i]?.length ?? 0
                  const pct = Math.round((readCount / b.c.length) * 100)
                  return (
                    <button
                      key={b.i}
                      onClick={() => setBook(b.i)}
                      className="relative overflow-hidden rounded-xl border p-3 text-left"
                      style={{ borderColor: 'var(--line)' }}
                    >
                      <div className="text-sm font-medium">{b.n}</div>
                      <div className="text-[11px]" style={{ color: 'var(--fg-dim)' }}>
                        {b.c.length} chapter{b.c.length === 1 ? '' : 's'}
                        {pct > 0 && ` · ${pct}%`}
                      </div>
                      <div
                        className="absolute bottom-0 left-0 h-0.5"
                        style={{ width: `${pct}%`, background: 'var(--accent)' }}
                      />
                    </button>
                  )
                })}
            </div>
          </section>
        ))}
      </div>
    )
  }

  const meta = canon.meta.books[book]
  const readChapters = new Set(store.read[book] ?? [])

  return (
    <div className="safe-top h-full overflow-y-auto px-5 pb-28 pt-4">
      <button
        onClick={() => setBook(null)}
        className="mb-3 flex items-center gap-1 text-sm"
        style={{ color: 'var(--fg-dim)' }}
      >
        <ChevronLeft size={16} /> All books
      </button>
      <h1 className="text-xl font-semibold">{meta.n}</h1>
      <p className="mb-4 text-xs" style={{ color: 'var(--fg-dim)' }}>
        {meta.c.length} chapters · {meta.c.reduce((a, b) => a + b, 0)} verses
      </p>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
        {meta.c.map((_, i) => {
          const chapter = i + 1
          const done = readChapters.has(chapter)
          return (
            <button
              key={chapter}
              onClick={() => onGoto({ b: book, c: chapter, v: 1 })}
              className="aspect-square rounded-lg border text-sm"
              style={{
                borderColor: done ? 'var(--accent)' : 'var(--line)',
                color: done ? 'var(--accent)' : 'var(--fg)',
              }}
            >
              {chapter}
            </button>
          )
        })}
      </div>
    </div>
  )
}
