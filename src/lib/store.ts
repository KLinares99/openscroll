import { useCallback, useEffect, useState } from 'react'
import type { TranslationCode } from './types'

const KEY = 'openscroll:v1'

export interface Settings {
  translation: TranslationCode
  fontScale: number
  redLetter: boolean
  showSupplied: boolean
  theme: 'dark' | 'light' | 'sepia'
  autoAdvanceSeconds: number
}

export interface Store {
  /** Verse keys ("42.3.16") the reader saved. */
  saved: string[]
  /** Verse key → note text. */
  notes: Record<string, string>
  /** Verse key → highlight colour. */
  highlights: Record<string, string>
  /** Book index → set of chapters fully scrolled, stored as arrays. */
  read: Record<string, number[]>
  /** ISO dates (YYYY-MM-DD) on which the reader opened a verse. */
  days: string[]
  /** Last feed position, so the app reopens where it left off. */
  lastOrdinal: number
  /** Total verses scrolled, all-time. */
  versesSeen: number
  settings: Settings
  onboarded: boolean
}

const DEFAULTS: Store = {
  saved: [],
  notes: {},
  highlights: {},
  read: {},
  days: [],
  lastOrdinal: 0,
  versesSeen: 0,
  settings: {
    translation: 'kjv',
    fontScale: 1,
    redLetter: true,
    showSupplied: false,
    theme: 'dark',
    autoAdvanceSeconds: 0,
  },
  onboarded: false,
}

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(DEFAULTS)
    const parsed = JSON.parse(raw) as Partial<Store>
    return {
      ...structuredClone(DEFAULTS),
      ...parsed,
      settings: { ...DEFAULTS.settings, ...(parsed.settings ?? {}) },
    }
  } catch {
    return structuredClone(DEFAULTS)
  }
}

let state: Store = typeof localStorage === 'undefined' ? structuredClone(DEFAULTS) : read()
const listeners = new Set<() => void>()

function commit(next: Store) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* private browsing / quota — keep working from memory */
  }
  listeners.forEach((fn) => fn())
}

export function getStore(): Store {
  return state
}

export function update(fn: (draft: Store) => void) {
  const next = structuredClone(state)
  fn(next)
  commit(next)
}

/** Subscribe a component to the whole store. */
export function useStore(): Store {
  const [, force] = useState(0)
  useEffect(() => {
    const fn = () => force((n) => n + 1)
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  }, [])
  return state
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const store = useStore()
  const set = useCallback((patch: Partial<Settings>) => {
    update((d) => {
      Object.assign(d.settings, patch)
    })
  }, [])
  return [store.settings, set]
}

/* ------------------------------------------------------------- mutations */

export const today = () => new Date().toISOString().slice(0, 10)

export function toggleSaved(key: string) {
  update((d) => {
    const at = d.saved.indexOf(key)
    if (at === -1) d.saved.unshift(key)
    else d.saved.splice(at, 1)
  })
}

export function setNote(key: string, text: string) {
  update((d) => {
    if (text.trim()) d.notes[key] = text
    else delete d.notes[key]
  })
}

export function setHighlight(key: string, color: string | null) {
  update((d) => {
    if (color) d.highlights[key] = color
    else delete d.highlights[key]
  })
}

/** Record that a verse was on screen: drives streak, progress and resume. */
export function markSeen(ordinal: number, book: number, chapter: number) {
  const day = today()
  update((d) => {
    d.lastOrdinal = ordinal
    d.versesSeen++
    if (d.days[d.days.length - 1] !== day) d.days.push(day)
    const chapters = (d.read[book] ||= [])
    if (!chapters.includes(chapter)) chapters.push(chapter)
  })
}

/** Consecutive days ending today (or yesterday, so a streak survives until midnight). */
export function streak(days: string[]): number {
  if (!days.length) return 0
  const set = new Set(days)
  const cursor = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  if (!set.has(iso(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
    if (!set.has(iso(cursor))) return 0
  }
  let n = 0
  while (set.has(iso(cursor))) {
    n++
    cursor.setDate(cursor.getDate() - 1)
  }
  return n
}

export function exportData(): string {
  return JSON.stringify(state, null, 2)
}

export function importData(json: string) {
  const parsed = JSON.parse(json) as Partial<Store>
  commit({
    ...structuredClone(DEFAULTS),
    ...parsed,
    settings: { ...DEFAULTS.settings, ...(parsed.settings ?? {}) },
  })
}

export function resetData() {
  commit(structuredClone(DEFAULTS))
}
