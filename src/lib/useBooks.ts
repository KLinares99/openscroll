import { useEffect, useState } from 'react'
import { getKjvBook, getPlainBook } from './data'
import type { KjvVerse, TranslationCode } from './types'

export type BookData = KjvVerse[][] | string[][]

/**
 * Loads whole books on demand and keeps them in component state.
 *
 * A book is the natural unit here: one fetch (~70 KB) covers every verse the
 * feed will show for a long stretch of scrolling, and `data.ts` dedupes the
 * request across components.
 */
export function useBooks(translation: TranslationCode, needed: number[]) {
  const [books, setBooks] = useState<Record<string, BookData>>({})

  const key = `${translation}:${[...new Set(needed)].sort((a, b) => a - b).join(',')}`

  useEffect(() => {
    let cancelled = false
    const wanted = [...new Set(needed)].filter((b) => b >= 0 && b < 66)

    Promise.all(
      wanted.map(async (b) => {
        const id = `${translation}-${b}`
        const data =
          translation === 'kjv' ? await getKjvBook(b) : await getPlainBook(translation, b)
        return [id, data] as const
      })
    )
      .then((entries) => {
        if (cancelled) return
        setBooks((prev) => {
          const next = { ...prev }
          let changed = false
          for (const [id, data] of entries) {
            if (!next[id]) {
              next[id] = data as BookData
              changed = true
            }
          }
          return changed ? next : prev
        })
      })
      .catch(() => {
        /* a failed chapter simply renders blank rather than crashing the feed */
      })

    return () => {
      cancelled = true
    }
    // `key` captures the meaningful contents of `needed` without re-running on
    // every new array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return books
}
