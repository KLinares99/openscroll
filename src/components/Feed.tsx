import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen, Bookmark, Highlighter, MessageSquareText, Share2, Sparkles, Volume2,
} from 'lucide-react'
import type { Canon } from '../lib/data'
import { useBooks } from '../lib/useBooks'
import { markSeen, setHighlight, toggleSaved, useStore } from '../lib/store'
import { refKey } from '../lib/types'
import VerseText from './VerseText'
import { shareVerse } from '../lib/share'
import { speak, stopSpeaking } from '../lib/tts'

/** Slides kept in the DOM at once, and how close to an edge triggers a shift. */
const WINDOW = 40
const EDGE = 10

const HIGHLIGHTS = ['#e8c98a', '#8fd0a5', '#8fb8e8', '#e0a0c8', '#e0674f']

interface Props {
  canon: Canon
  start: number
  onOpenStudy: (ordinal: number) => void
  onOpenNote: (ordinal: number) => void
}

export default function Feed({ canon, start, onOpenStudy, onOpenNote }: Props) {
  const store = useStore()
  const { settings } = store
  const scroller = useRef<HTMLDivElement>(null)

  // First ordinal currently rendered.
  const [windowStart, setWindowStart] = useState(() =>
    Math.max(0, Math.min(canon.total - WINDOW, start - Math.floor(WINDOW / 2)))
  )
  const [active, setActive] = useState(start)
  const [showColors, setShowColors] = useState(false)

  const ordinals = useMemo(
    () => Array.from({ length: WINDOW }, (_, i) => windowStart + i).filter((n) => n < canon.total),
    [windowStart, canon.total]
  )

  const refs = useMemo(() => ordinals.map((n) => canon.fromOrdinal(n)), [ordinals, canon])
  const books = useBooks(settings.translation, refs.map((r) => r.b))

  /** Scroll so `ordinal` sits at the top of the viewport. */
  const scrollTo = useCallback(
    (ordinal: number, behavior: ScrollBehavior = 'auto') => {
      const el = scroller.current
      if (!el) return
      const h = el.clientHeight || 1
      el.scrollTo({ top: (ordinal - windowStart) * h, behavior })
    },
    [windowStart]
  )

  // Jump when the caller changes `start` (Library, Search, Saved, resume).
  const lastStart = useRef(start)
  useLayoutEffect(() => {
    if (lastStart.current === start) return
    lastStart.current = start
    const nextWindow = Math.max(0, Math.min(canon.total - WINDOW, start - Math.floor(WINDOW / 2)))
    setWindowStart(nextWindow)
    setActive(start)
    requestAnimationFrame(() => {
      const el = scroller.current
      if (el) el.scrollTop = (start - nextWindow) * (el.clientHeight || 1)
    })
  }, [start, canon.total])

  // Position on first paint.
  useLayoutEffect(() => {
    scrollTo(active)
    // Only on mount — later positioning is handled by the branches above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Recentre the rendered window when the reader nears an edge. Shifting by a
   * whole number of slides and compensating scrollTop in the same frame keeps
   * the scroll position visually fixed.
   */
  const onScroll = useCallback(() => {
    const el = scroller.current
    if (!el) return
    const h = el.clientHeight || 1
    const current = windowStart + Math.round(el.scrollTop / h)
    if (current !== active) setActive(current)

    const fromStart = current - windowStart
    const fromEnd = windowStart + WINDOW - current
    if (fromStart < EDGE || fromEnd < EDGE) {
      const desired = Math.max(
        0,
        Math.min(canon.total - WINDOW, current - Math.floor(WINDOW / 2))
      )
      if (desired !== windowStart) {
        const delta = desired - windowStart
        setWindowStart(desired)
        el.scrollTop -= delta * h
      }
    }
  }, [windowStart, active, canon.total])

  // Record progress once the reader settles on a verse.
  useEffect(() => {
    const timer = setTimeout(() => {
      const r = canon.fromOrdinal(active)
      markSeen(active, r.b, r.c)
    }, 600)
    return () => clearTimeout(timer)
  }, [active, canon])

  // Optional hands-free auto-advance.
  useEffect(() => {
    const seconds = settings.autoAdvanceSeconds
    if (!seconds) return
    const timer = setInterval(() => {
      const el = scroller.current
      if (!el) return
      el.scrollBy({ top: el.clientHeight, behavior: 'smooth' })
    }, seconds * 1000)
    return () => clearInterval(timer)
  }, [settings.autoAdvanceSeconds])

  useEffect(() => () => stopSpeaking(), [])

  const activeRef = canon.fromOrdinal(active)
  const activeKey = refKey(activeRef)
  const isSaved = store.saved.includes(activeKey)
  const hasNote = Boolean(store.notes[activeKey])
  const highlight = store.highlights[activeKey]

  const verseOf = (ordinal: number) => {
    const r = canon.fromOrdinal(ordinal)
    const data = books[`${settings.translation}-${r.b}`]
    return data?.[r.c - 1]?.[r.v - 1]
  }

  const onShare = async () => {
    const text = plainText(verseOf(active))
    await shareVerse(canon.label(activeRef), text, settings.translation.toUpperCase())
  }

  const onSpeak = () => {
    const text = plainText(verseOf(active))
    speak(`${canon.label(activeRef)}. ${text}`)
  }

  return (
    <div className="relative h-full">
      <div ref={scroller} className="feed" onScroll={onScroll}>
        {ordinals.map((ordinal, i) => {
          const r = refs[i]
          const value = verseOf(ordinal)
          const key = refKey(r)
          const color = store.highlights[key]
          return (
            <section
              key={ordinal}
              // Right padding clears the action rail; bottom padding clears the nav.
              className="slide flex flex-col justify-center py-24 pl-6 pr-20"
            >
              <div className="mx-auto w-full max-w-2xl">
                <div className="mb-5 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em]"
                  style={{ color: 'var(--fg-dim)' }}>
                  <BookOpen size={13} />
                  {canon.label(r)}
                  <span className="opacity-50">· {settings.translation.toUpperCase()}</span>
                </div>
                <p
                  className="verse-type"
                  style={{
                    fontSize: `${1.6 * settings.fontScale}rem`,
                    background: color ? `linear-gradient(transparent 62%, ${color}66 62%)` : undefined,
                  }}
                >
                  <VerseText
                    value={value}
                    redLetter={settings.redLetter}
                    showSupplied={settings.showSupplied}
                  />
                </p>
                {store.notes[key] && (
                  <p
                    className="mt-6 border-l-2 pl-3 text-sm italic"
                    style={{ borderColor: 'var(--accent)', color: 'var(--fg-dim)' }}
                  >
                    {store.notes[key]}
                  </p>
                )}
              </div>
            </section>
          )
        })}
      </div>

      {/* Action rail — always acts on the verse currently in view. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <div className="pointer-events-auto flex flex-col gap-1.5">
          <Action
            label="Study"
            active
            onClick={() => onOpenStudy(active)}
            icon={<Sparkles size={20} />}
          />
          <Action
            label="Save"
            active={isSaved}
            onClick={() => toggleSaved(activeKey)}
            icon={<Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />}
          />
          <Action
            label="Note"
            active={hasNote}
            onClick={() => onOpenNote(active)}
            icon={<MessageSquareText size={20} />}
          />
          <div className="relative">
            <Action
              label="Highlight"
              active={Boolean(highlight)}
              onClick={() => setShowColors((v) => !v)}
              icon={<Highlighter size={20} />}
            />
            {showColors && (
              <div
                className="fade-in absolute right-12 top-0 flex gap-1.5 rounded-full border p-1.5"
                style={{ background: 'var(--bg-soft)', borderColor: 'var(--line)' }}
              >
                {HIGHLIGHTS.map((c) => (
                  <button
                    key={c}
                    aria-label={`Highlight ${c}`}
                    className="h-6 w-6 rounded-full"
                    style={{ background: c }}
                    onClick={() => {
                      setHighlight(activeKey, highlight === c ? null : c)
                      setShowColors(false)
                    }}
                  />
                ))}
                <button
                  aria-label="Remove highlight"
                  className="h-6 w-6 rounded-full border text-xs"
                  style={{ borderColor: 'var(--line)', color: 'var(--fg-dim)' }}
                  onClick={() => {
                    setHighlight(activeKey, null)
                    setShowColors(false)
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
          <Action label="Listen" onClick={onSpeak} icon={<Volume2 size={20} />} />
          <Action label="Share" onClick={onShare} icon={<Share2 size={20} />} />
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-24 left-0 right-0 text-center text-[10px] uppercase tracking-[0.2em]"
        style={{ color: 'var(--fg-dim)' }}
      >
        {active + 1} / {canon.total}
      </div>
    </div>
  )
}

function Action({
  icon, label, onClick, active,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border transition active:scale-90"
      style={{
        background: 'color-mix(in srgb, var(--bg-soft) 82%, transparent)',
        borderColor: active ? 'var(--accent)' : 'var(--line)',
        color: active ? 'var(--accent)' : 'var(--fg-dim)',
      }}
    >
      {icon}
    </button>
  )
}

export function plainText(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return (value as [string, number][]).map((s) => s[0]).join('')
  return ''
}
