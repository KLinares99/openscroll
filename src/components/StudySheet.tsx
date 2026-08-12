import { useEffect, useMemo, useState } from 'react'
import { Copy, Layers, Languages, Link2, ScrollText } from 'lucide-react'
import {
  Canon, getPlainBook, getStrongsBook, getStrongsDict, getVerseText, getXrefBook,
} from '../lib/data'
import { languageOf, parseMorph } from '../lib/morph'
import { BOOK_CONTEXT } from '../data/books'
import type { Ref, StrongsEntry, StrongsWord, XRef } from '../lib/types'
import { copy } from '../lib/share'
import Sheet from './ui/Sheet'

type Tab = 'study' | 'original' | 'easier' | 'related'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'study', label: 'Deep Study', icon: <ScrollText size={15} /> },
  { id: 'original', label: 'Original', icon: <Languages size={15} /> },
  { id: 'easier', label: 'Easier', icon: <Layers size={15} /> },
  { id: 'related', label: 'Related', icon: <Link2 size={15} /> },
]

interface Props {
  open: boolean
  onClose: () => void
  canon: Canon
  ref_: Ref
  verseText: string
  onGoto: (r: Ref) => void
}

export default function StudySheet({ open, onClose, canon, ref_, verseText, onGoto }: Props) {
  const [tab, setTab] = useState<Tab>('study')
  const [advanced, setAdvanced] = useState(false)
  const [words, setWords] = useState<StrongsWord[] | null>(null)
  const [xrefs, setXrefs] = useState<XRef[]>([])
  const [dicts, setDicts] = useState<Record<string, StrongsEntry>>({})
  const [easier, setEasier] = useState<string>('')
  const [parallels, setParallels] = useState<{ code: string; text: string }[]>([])
  const [xrefText, setXrefText] = useState<Record<string, string>>({})
  const [toast, setToast] = useState('')

  const context = BOOK_CONTEXT[ref_.b]
  const book = canon.meta.books[ref_.b]

  /* Load everything this verse needs, whenever the verse changes. */
  useEffect(() => {
    if (!open) return
    let cancelled = false

    getStrongsBook(ref_.b)
      .then((b) => !cancelled && setWords(b[ref_.c - 1]?.[ref_.v - 1] ?? []))
      .catch(() => !cancelled && setWords([]))

    getXrefBook(ref_.b)
      .then((x) => !cancelled && setXrefs(x[`${ref_.c}:${ref_.v}`] ?? []))
      .catch(() => !cancelled && setXrefs([]))

    getPlainBook('bbe', ref_.b)
      .then((b) => !cancelled && setEasier(b[ref_.c - 1]?.[ref_.v - 1] ?? ''))
      .catch(() => !cancelled && setEasier(''))

    Promise.all(
      (['kjv', 'asv', 'ylt', 'bbe'] as const).map(async (code) => ({
        code: code.toUpperCase(),
        text: await getVerseText(code, ref_),
      }))
    )
      .then((rows) => !cancelled && setParallels(rows))
      .catch(() => !cancelled && setParallels([]))

    return () => {
      cancelled = true
    }
  }, [open, ref_.b, ref_.c, ref_.v])

  /* Strong's dictionaries are large, so only fetch the ones this verse uses. */
  useEffect(() => {
    if (!words?.length) return
    const kinds = new Set<'G' | 'H'>()
    for (const [, ids] of words) {
      for (const id of ids.split(' ')) if (id) kinds.add(id[0] as 'G' | 'H')
    }
    let cancelled = false
    Promise.all([...kinds].map((k) => getStrongsDict(k)))
      .then((loaded) => {
        if (cancelled) return
        setDicts(Object.assign({}, ...loaded))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [words])

  /* Resolve the text of each cross reference so they can be read in place. */
  useEffect(() => {
    if (!xrefs.length) return
    let cancelled = false
    Promise.all(
      xrefs.slice(0, 12).map(async (x) => {
        const text = await getVerseText('kjv', { b: x[0], c: x[1], v: x[2] })
        return [`${x[0]}.${x[1]}.${x[2]}`, text] as const
      })
    )
      .then((rows) => !cancelled && setXrefText(Object.fromEntries(rows)))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [xrefs])

  /** Distinct Strong's entries in this verse, most substantial first. */
  const keyWords = useMemo(() => {
    if (!words) return []
    const seen = new Map<string, { id: string; english: string; entry: StrongsEntry }>()
    for (const [english, ids] of words) {
      for (const id of ids.split(' ')) {
        const entry = dicts[id]
        if (!entry || seen.has(id)) continue
        seen.set(id, { id, english: english.trim(), entry })
      }
    }
    return [...seen.values()]
      .filter((w) => w.entry.d)
      .sort((a, b) => b.entry.d.length - a.entry.d.length)
  }, [words, dicts])

  const flash = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(''), 1600)
  }

  const exportStudy = async () => {
    const lines = [
      `${canon.label(ref_)} (KJV)`,
      `"${verseText}"`,
      '',
      `CONTEXT — ${book?.n}`,
      `Author: ${context.author}`,
      `Written: ${context.when}`,
      `Genre: ${context.genre}`,
      `Theme: ${context.theme}`,
      context.summary,
      '',
      'IN PLAIN ENGLISH (Bible in Basic English)',
      easier,
      '',
      'KEY WORDS',
      ...keyWords.slice(0, 8).map((w) =>
        `${w.english || '—'} · ${w.id} · ${w.entry.w} (${w.entry.x}) — ${w.entry.d}`),
      '',
      'RELATED VERSES',
      ...xrefs.slice(0, 12).map((x) =>
        `${canon.label({ b: x[0], c: x[1], v: x[2] })} — ${xrefText[`${x[0]}.${x[1]}.${x[2]}`] ?? ''}`),
      '',
      'Exported from OpenScroll',
    ]
    flash((await copy(lines.join('\n'))) === 'copied' ? 'Study copied' : 'Copy failed')
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={canon.label(ref_)}
      subtitle={`${book?.n} · ${context.genre}`}
    >
      <div className="mb-4 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
            style={{
              borderColor: tab === t.id ? 'var(--accent)' : 'var(--line)',
              color: tab === t.id ? 'var(--accent)' : 'var(--fg-dim)',
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <p className="verse-type mb-5 text-lg">{verseText}</p>

      {tab === 'study' && (
        <div className="space-y-5 text-sm">
          <div className="flex gap-1.5">
            {(['Basic', 'Advanced'] as const).map((mode, i) => (
              <button
                key={mode}
                onClick={() => setAdvanced(i === 1)}
                className="rounded-full border px-3 py-1 text-xs"
                style={{
                  borderColor: advanced === (i === 1) ? 'var(--accent)' : 'var(--line)',
                  color: advanced === (i === 1) ? 'var(--accent)' : 'var(--fg-dim)',
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          <Section title="Where this sits">
            <p>
              {book?.n} is {context.genre.toLowerCase()}, chapter {ref_.c} of{' '}
              {canon.chapters(ref_.b)}, verse {ref_.v} of {canon.verses(ref_.b, ref_.c)}.
              {' '}
              {book?.t === 'ot' ? 'Old Testament.' : 'New Testament.'}
            </p>
          </Section>

          <Section title="Context">
            <Row label="Theme" value={context.theme} />
            <Row label="Audience" value={context.audience} />
            {advanced && <Row label="Author" value={context.author} />}
            {advanced && <Row label="Written" value={context.when} />}
            <p className="mt-2">{context.summary}</p>
          </Section>

          <Section title="Plain English">
            <p className="italic">{easier || '—'}</p>
          </Section>

          <Section title={advanced ? 'Every tagged word' : 'Key words'}>
            {keyWords.length === 0 && <p style={{ color: 'var(--fg-dim)' }}>No tagged words.</p>}
            <div className="space-y-3">
              {keyWords.slice(0, advanced ? 40 : 5).map((w) => (
                <div key={w.id}>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium">{w.english || '(untranslated)'}</span>
                    <span style={{ color: 'var(--accent)' }}>{w.entry.w}</span>
                    <span className="text-xs" style={{ color: 'var(--fg-dim)' }}>
                      {w.entry.x} · {w.id}
                    </span>
                  </div>
                  <p style={{ color: 'var(--fg-dim)' }}>{w.entry.d}</p>
                </div>
              ))}
            </div>
          </Section>

          {advanced && (
            <Section title="How other translations render it">
              <div className="space-y-2">
                {parallels.map((p) => (
                  <div key={p.code}>
                    <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
                      {p.code}
                    </div>
                    <p>{p.text}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <button
            onClick={exportStudy}
            className="flex items-center gap-2 rounded-full border px-4 py-2 text-xs"
            style={{ borderColor: 'var(--line)', color: 'var(--fg-dim)' }}
          >
            <Copy size={13} /> Copy this study
          </button>
        </div>
      )}

      {tab === 'original' && (
        <div className="space-y-4 text-sm">
          <p className="text-xs" style={{ color: 'var(--fg-dim)' }}>
            Word-by-word, in the order the {book!.t === 'ot' ? 'Hebrew' : 'Greek'} stands behind the
            King James rendering.
          </p>
          {(words ?? []).length === 0 && <p style={{ color: 'var(--fg-dim)' }}>No tagging for this verse.</p>}
          {(words ?? []).map(([english, ids, morph], i) => {
            const list = ids.split(' ').filter(Boolean)
            if (!list.length) return null
            return (
              <div
                key={i}
                className="rounded-xl border p-3"
                style={{ borderColor: 'var(--line)' }}
              >
                <div className="mb-1 font-medium">{english || '(no English equivalent)'}</div>
                {list.map((id) => {
                  const entry = dicts[id]
                  return (
                    <div key={id} className="mb-1.5">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-base" style={{ color: 'var(--accent)' }}>
                          {entry?.w ?? id}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--fg-dim)' }}>
                          {entry?.x} {entry?.p && `· ${entry.p}`} · {id} · {languageOf(id)}
                        </span>
                      </div>
                      {entry?.d && <p style={{ color: 'var(--fg-dim)' }}>{entry.d}</p>}
                      {entry?.k && (
                        <p className="text-xs" style={{ color: 'var(--fg-dim)' }}>
                          KJV renders: {entry.k}
                        </p>
                      )}
                    </div>
                  )
                })}
                {parseMorph(morph).map((p, j) => (
                  <div key={j} className="mt-1 text-xs">
                    <span
                      className="rounded px-1.5 py-0.5"
                      style={{ background: 'var(--bg)', color: p.decoded ? 'var(--fg)' : 'var(--fg-dim)' }}
                    >
                      {p.label}
                    </span>
                    {p.hint && (
                      <span className="ml-2" style={{ color: 'var(--fg-dim)' }}>
                        {p.hint}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'easier' && (
        <div className="space-y-4 text-sm">
          <Section title="Bible in Basic English">
            <p className="verse-type text-base">{easier || '—'}</p>
            <p className="mt-2 text-xs" style={{ color: 'var(--fg-dim)' }}>
              The BBE renders scripture using a core vocabulary of about 1,000 English words —
              a genuine translation rather than a machine paraphrase.
            </p>
          </Section>
          <Section title="Side by side">
            <div className="space-y-3">
              {parallels.map((p) => (
                <div key={p.code}>
                  <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
                    {p.code}
                  </div>
                  <p>{p.text}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {tab === 'related' && (
        <div className="space-y-2 text-sm">
          <p className="mb-3 text-xs" style={{ color: 'var(--fg-dim)' }}>
            {xrefs.length
              ? `${xrefs.length} cross references, ordered by how strongly readers have voted for the link.`
              : 'No cross references recorded for this verse.'}
          </p>
          {xrefs.slice(0, 12).map((x, i) => {
            const target = { b: x[0], c: x[1], v: x[2] }
            return (
              <button
                key={i}
                onClick={() => {
                  onGoto(target)
                  onClose()
                }}
                className="block w-full rounded-xl border p-3 text-left"
                style={{ borderColor: 'var(--line)' }}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                    {canon.label(target)}
                    {x[3] > x[2] ? `–${x[3]}` : ''}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--fg-dim)' }}>
                    {x[4]} vote{x[4] === 1 ? '' : 's'}
                  </span>
                </div>
                <p style={{ color: 'var(--fg-dim)' }}>{xrefText[`${x[0]}.${x[1]}.${x[2]}`] ?? '…'}</p>
              </button>
            )
          })}
        </div>
      )}

      {toast && (
        <div
          className="fade-in fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 text-xs"
          style={{ background: 'var(--accent)', color: 'var(--bg)' }}
        >
          {toast}
        </div>
      )}
    </Sheet>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3
        className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: 'var(--accent)' }}
      >
        {title}
      </h3>
      {children}
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="shrink-0" style={{ color: 'var(--fg-dim)' }}>
        {label}:
      </span>
      <span>{value}</span>
    </div>
  )
}
