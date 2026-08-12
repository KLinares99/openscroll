import type {
  KjvVerse, Meta, Ref, StrongsEntry, StrongsWord, TranslationCode, XRef,
} from './types'

const BASE = import.meta.env.BASE_URL + 'data/'

/** In-memory promise cache — every asset is immutable, so one fetch each. */
const cache = new Map<string, Promise<unknown>>()

function load<T>(file: string): Promise<T> {
  let hit = cache.get(file) as Promise<T> | undefined
  if (!hit) {
    hit = fetch(BASE + file).then((r) => {
      if (!r.ok) throw new Error(`Failed to load ${file} (${r.status})`)
      return r.json() as Promise<T>
    })
    cache.set(file, hit as Promise<unknown>)
  }
  return hit
}

export const getMeta = () => load<Meta>('meta.json')

/** KJV: runs carrying red-letter / supplied-word flags. */
export const getKjvBook = (book: number) => load<KjvVerse[][]>(`t/kjv-${book}.json`)

/** ASV / YLT / BBE: plain strings. */
export const getPlainBook = (t: Exclude<TranslationCode, 'kjv'>, book: number) =>
  load<string[][]>(`t/${t}-${book}.json`)

export const getStrongsBook = (book: number) => load<StrongsWord[][][]>(`s/${book}.json`)

export const getXrefBook = (book: number) => load<Record<string, XRef[]>>(`x/${book}.json`)

export const getStrongsDict = (kind: 'G' | 'H') =>
  load<Record<string, StrongsEntry>>(`strongs/${kind}.json`)

/** Plain text of a single verse in any translation. */
export async function getVerseText(t: TranslationCode, r: Ref): Promise<string> {
  if (t === 'kjv') {
    const book = await getKjvBook(r.b)
    return (book[r.c - 1]?.[r.v - 1] ?? []).map((s) => s[0]).join('')
  }
  const book = await getPlainBook(t, r.b)
  return book[r.c - 1]?.[r.v - 1] ?? ''
}

/* ---------------------------------------------------------------- ordinals */

/**
 * The feed is a single flat list of all 31,102 verses. These helpers convert
 * between a verse address and its position in that list.
 */
export class Canon {
  readonly meta: Meta
  /** Cumulative verse count at the start of each book. */
  private bookStart: number[] = []
  /** Cumulative verse count at the start of each chapter, per book. */
  private chapStart: number[][] = []

  constructor(meta: Meta) {
    this.meta = meta
    let running = 0
    for (const book of meta.books) {
      this.bookStart.push(running)
      const starts: number[] = []
      for (const count of book.c) {
        starts.push(running)
        running += count
      }
      this.chapStart.push(starts)
    }
  }

  get total() {
    return this.meta.verseTotal
  }

  toOrdinal(r: Ref): number {
    return (this.chapStart[r.b]?.[r.c - 1] ?? 0) + (r.v - 1)
  }

  fromOrdinal(n: number): Ref {
    const clamped = Math.max(0, Math.min(this.total - 1, n))
    let b = 0
    while (b + 1 < this.bookStart.length && this.bookStart[b + 1] <= clamped) b++
    const starts = this.chapStart[b]
    let c = 0
    while (c + 1 < starts.length && starts[c + 1] <= clamped) c++
    return { b, c: c + 1, v: clamped - starts[c] + 1 }
  }

  label(r: Ref): string {
    return `${this.meta.books[r.b]?.n ?? '?'} ${r.c}:${r.v}`
  }

  /** Chapter count for a book. */
  chapters(b: number) {
    return this.meta.books[b]?.c.length ?? 0
  }

  /** Verse count for a chapter. */
  verses(b: number, c: number) {
    return this.meta.books[b]?.c[c - 1] ?? 0
  }
}

/* ----------------------------------------------------------------- search */

let corpus: Promise<string[]> | null = null

/** The whole KJV as one verse-per-line file — fetched once, then searched in memory. */
export function getCorpus(): Promise<string[]> {
  if (!corpus) {
    corpus = fetch(BASE + 'search-kjv.txt')
      .then((r) => r.text())
      .then((t) => t.split('\n'))
  }
  return corpus
}
