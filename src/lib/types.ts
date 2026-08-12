export type TranslationCode = 'kjv' | 'asv' | 'ylt' | 'bbe'

export interface BookMeta {
  /** Canonical index, 0 = Genesis … 65 = Revelation */
  i: number
  /** Full name, e.g. "1 Corinthians" */
  n: string
  /** OSIS abbreviation, e.g. "1Cor" */
  a: string
  t: 'ot' | 'nt'
  /** Verse count per chapter */
  c: number[]
}

export interface Meta {
  books: BookMeta[]
  verseTotal: number
  translations: { code: TranslationCode; name: string; year: number; note: string }[]
}

/** A display run of verse text. flags: bit 1 = words of Jesus, bit 2 = supplied word. */
export type Seg = [text: string, flags: number]

/** KJV verse = list of runs. Other translations = plain string. */
export type KjvVerse = Seg[]

/** [englishGloss, "G2316 G3588", "N-NSM T-NSM"] */
export type StrongsWord = [en: string, ids: string, morph: string]

export interface StrongsEntry {
  /** Original-language lemma */
  w: string
  /** Transliteration */
  x: string
  /** Pronunciation (Hebrew only) */
  p: string
  /** Strong's definition */
  d: string
  /** How the KJV renders it */
  k: string
  /** Derivation / etymology */
  e: string
}

/** [book, chapter, verse, endVerse, votes] */
export type XRef = [number, number, number, number, number]

/** A verse address. */
export interface Ref {
  b: number
  c: number
  v: number
}

export const refKey = (r: Ref) => `${r.b}.${r.c}.${r.v}`

export const parseRefKey = (key: string): Ref => {
  const [b, c, v] = key.split('.').map(Number)
  return { b, c, v }
}

export interface Note {
  key: string
  text: string
  updated: number
}

export interface Highlight {
  key: string
  color: string
  created: number
}
