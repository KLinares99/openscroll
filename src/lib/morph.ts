/**
 * Morphology decoding.
 *
 * Greek words carry Robinson codes (e.g. `V-2AAI-3S`, `N-GSM`); Hebrew words
 * carry Strong's morphology numbers (e.g. `TH8804`). Both are expanded into
 * plain-English grammar so a reader with no Greek or Hebrew can still see what
 * the original word is doing.
 *
 * Anything this module cannot decode with confidence is passed through as the
 * raw code rather than guessed at — a wrong parsing is worse than no parsing.
 */

/* ------------------------------------------------------------------ Greek */

const POS: Record<string, string> = {
  N: 'Noun', A: 'Adjective', T: 'Article', V: 'Verb',
  P: 'Personal pronoun', R: 'Relative pronoun', C: 'Reciprocal pronoun',
  D: 'Demonstrative pronoun', K: 'Correlative pronoun', I: 'Interrogative pronoun',
  X: 'Indefinite pronoun', Q: 'Correlative/interrogative pronoun',
  F: 'Reflexive pronoun', S: 'Possessive pronoun',
}

const STANDALONE: Record<string, string> = {
  ADV: 'Adverb',
  CONJ: 'Conjunction',
  COND: 'Conditional particle',
  PRT: 'Particle',
  PREP: 'Preposition',
  INJ: 'Interjection',
  ARAM: 'Aramaic transliterated word',
  HEB: 'Hebrew transliterated word',
  'N-PRI': 'Proper noun (indeclinable)',
  'A-NUI': 'Numeral (indeclinable)',
  'N-LI': 'Letter (indeclinable)',
  'N-OI': 'Noun (indeclinable)',
  'PRT-N': 'Negative particle',
  'PRT-I': 'Interrogative particle',
  INTERJ: 'Interjection',
}

const CASE: Record<string, string> = {
  N: 'nominative', V: 'vocative', G: 'genitive', D: 'dative', A: 'accusative',
}
const NUMBER: Record<string, string> = { S: 'singular', P: 'plural' }
const GENDER: Record<string, string> = { M: 'masculine', F: 'feminine', N: 'neuter' }

const TENSE: Record<string, string> = {
  P: 'present', I: 'imperfect', F: 'future', A: 'aorist',
  R: 'perfect', L: 'pluperfect',
}
const VOICE: Record<string, string> = {
  A: 'active', M: 'middle', P: 'passive', E: 'middle or passive',
  D: 'middle deponent', O: 'passive deponent', N: 'middle/passive deponent',
}
const MOOD: Record<string, string> = {
  I: 'indicative', S: 'subjunctive', O: 'optative', M: 'imperative',
  N: 'infinitive', P: 'participle',
}

function decodeGreek(code: string): string | null {
  if (STANDALONE[code]) return STANDALONE[code]

  const parts = code.split('-')
  const head = parts[0]

  if (head === 'V') {
    // V-[2]TVM[-PN | -CaseNumberGender]
    let tvm = parts[1] ?? ''
    let second = ''
    if (/^\d/.test(tvm)) {
      second = 'second '
      tvm = tvm.slice(1)
    }
    const tense = TENSE[tvm[0]]
    const voice = VOICE[tvm[1]]
    const mood = MOOD[tvm[2]]
    if (!tense || !voice || !mood) return null

    let out = `Verb — ${second}${tense} ${voice} ${mood}`
    const tail = parts[2]
    if (tail) {
      if (/^[123][SP]$/.test(tail)) {
        const person = { 1: '1st', 2: '2nd', 3: '3rd' }[tail[0] as '1' | '2' | '3']
        out += `, ${person} person ${NUMBER[tail[1]]}`
      } else if (tail.length === 3 && CASE[tail[0]]) {
        out += `, ${CASE[tail[0]]} ${NUMBER[tail[1]]} ${GENDER[tail[2]]}`
      }
    }
    return out
  }

  if (POS[head]) {
    const tail = parts[1] ?? ''
    if (tail.length >= 3 && CASE[tail[0]] && NUMBER[tail[1]] && GENDER[tail[2]]) {
      return `${POS[head]} — ${CASE[tail[0]]} ${NUMBER[tail[1]]} ${GENDER[tail[2]]}`
    }
    return POS[head]
  }
  return null
}

/* ----------------------------------------------------------------- Hebrew */

/**
 * Strong's Hebrew morphology numbers are laid out in per-stem blocks. The Qal
 * block runs 8798–8804 in the order below; every derived stem uses the same
 * ordering in a five-code block (no separate infinitive-absolute or passive
 * participle slot).
 */
const QAL_ORDER = [
  'imperative', 'imperfect', 'infinitive construct', 'infinitive absolute',
  'active participle', 'passive participle', 'perfect',
]
const STEM_ORDER = [
  'imperative', 'imperfect', 'infinitive construct', 'participle', 'perfect',
]

const HEBREW: Record<number, string> = {}
QAL_ORDER.forEach((form, i) => {
  HEBREW[8798 + i] = `Qal ${form}`
})
for (const [stem, start] of [
  ['Niphal', 8734], ['Hiphil', 8685], ['Piel', 8761],
  ['Hithpael', 8690], ['Hophal', 8713], ['Pual', 8791],
] as const) {
  STEM_ORDER.forEach((form, i) => {
    HEBREW[start + i] = `${stem} ${form}`
  })
}

const HEBREW_NOTES: Record<number, string> = {
  8675: 'Alternate parsing (Ketiv/Qere variant)',
  8676: 'Alternate parsing (variant reading)',
}

const STEM_SENSE: Record<string, string> = {
  Qal: 'simple action, active voice',
  Niphal: 'simple action, passive or reflexive',
  Piel: 'intensive or causative action, active',
  Pual: 'intensive action, passive',
  Hiphil: 'causative action, active',
  Hophal: 'causative action, passive',
  Hithpael: 'intensive action, reflexive',
}

function decodeHebrew(code: string): string | null {
  const n = parseInt(code.replace(/^TH/i, ''), 10)
  if (!n) return null
  return HEBREW[n] ?? HEBREW_NOTES[n] ?? null
}

/* ------------------------------------------------------------------- API */

export interface Parsed {
  /** Human-readable parsing, or the raw code if it could not be decoded. */
  label: string
  /** Extra note on what the Hebrew stem means, when applicable. */
  hint?: string
  decoded: boolean
}

export function parseMorph(code: string): Parsed[] {
  if (!code) return []
  return code.split(/\s+/).filter(Boolean).map((token) => {
    const hebrew = /^TH/i.test(token)
    const label = hebrew ? decodeHebrew(token) : decodeGreek(token)
    if (!label) return { label: token, decoded: false }
    const stem = label.split(' ')[0]
    return {
      label,
      hint: hebrew && STEM_SENSE[stem] ? `${stem}: ${STEM_SENSE[stem]}` : undefined,
      decoded: true,
    }
  })
}

/** "G2316" → "Greek", "H430" → "Hebrew". */
export const languageOf = (id: string) => (id[0] === 'G' ? 'Greek' : 'Hebrew')
