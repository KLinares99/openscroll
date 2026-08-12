/**
 * OpenScroll data pipeline.
 *
 * Downloads public-domain / open-licensed scripture data and compiles it into
 * small static JSON files under `public/data`, so the running app needs no
 * server, no API key and no network after first load.
 *
 * Sources (all public domain or CC-BY):
 *   - KJV OSIS  : scrollmapper/bible_databases — KJV 1769 with Strong's numbers,
 *                 Robinson/strongMorph morphology and `<q who="Jesus">` red-letter.
 *   - ASV/BBE/YLT: scrollmapper/bible_databases plain-text JSON.
 *   - Strong's  : openscriptures/strongs Greek + Hebrew dictionaries.
 *   - Cross-refs: openbible.info voted cross-references (CC-BY), via scrollmapper.
 *
 * Run: npm run data
 */
import { mkdir, writeFile, readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const CACHE = path.join(ROOT, '.data-cache')
const OUT = path.join(ROOT, 'public', 'data')

const SM = 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master'
const OS = 'https://raw.githubusercontent.com/openscriptures/strongs/master'

const SOURCES = {
  'kjv-osis.json': `${SM}/sources/en/KJV/KJV-osis.json`,
  'asv.json': `${SM}/formats/json/ASV.json`,
  'bbe.json': `${SM}/formats/json/BBE.json`,
  'ylt.json': `${SM}/formats/json/YLT.json`,
  'xref.txt': `${SM}/sources/extras/cross_references.txt`,
  'strongs-greek.js': `${OS}/greek/strongs-greek-dictionary.js`,
  'strongs-hebrew.js': `${OS}/hebrew/strongs-hebrew-dictionary.js`,
}

/* ------------------------------------------------------------------ fetch */

async function cached(name, url) {
  const dest = path.join(CACHE, name)
  if (existsSync(dest) && (await stat(dest)).size > 1024) return dest
  process.stdout.write(`  ↓ ${name} … `)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(dest, buf)
  console.log(`${(buf.length / 1e6).toFixed(1)} MB`)
  return dest
}

const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'))

/* ------------------------------------------------------- OSIS verse parser */

const VOID_TAGS = new Set(['milestone', 'chapter', 'div', 'title', 'note'])

/**
 * Parse one OSIS verse string into:
 *   segs  — display runs: [text, flags]  (flag 1 = words of Jesus, 2 = supplied)
 *   words — original-language words: [english, strongIds, morphCode]
 *
 * `<note>` blocks (translator apparatus, catchWord/rdg) are dropped entirely.
 * Self-closing `<w/>` carry a lemma with no English gloss — kept in `words`
 * (they matter for the original-language view) but contribute no display text.
 */
function parseOsis(src) {
  const segs = []
  const words = []
  let jesus = 0
  let added = 0
  let noteDepth = 0
  let i = 0

  const push = (text) => {
    if (!text || noteDepth) return
    const flags = (jesus ? 1 : 0) | (added ? 2 : 0)
    const last = segs[segs.length - 1]
    if (last && last[1] === flags) last[0] += text
    else segs.push([text, flags])
  }

  const decode = (s) =>
    s
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))

  while (i < src.length) {
    const lt = src.indexOf('<', i)
    if (lt === -1) {
      push(decode(src.slice(i)))
      break
    }
    if (lt > i) push(decode(src.slice(i, lt)))

    const gt = src.indexOf('>', lt)
    if (gt === -1) break
    const rawTag = src.slice(lt + 1, gt)
    i = gt + 1

    const closing = rawTag[0] === '/'
    const selfClosing = rawTag.endsWith('/')
    const name = rawTag.replace(/^\//, '').match(/^([a-zA-Z]+)/)?.[1]
    if (!name) continue

    const attr = (key) => {
      const m = rawTag.match(new RegExp(`${key}="([^"]*)"`))
      return m ? m[1] : ''
    }

    if (name === 'note') {
      if (closing) noteDepth = Math.max(0, noteDepth - 1)
      else if (!selfClosing) noteDepth++
      continue
    }
    if (noteDepth) continue

    if (name === 'q') {
      if (attr('who') === 'Jesus' || closing) jesus = closing ? 0 : 1
      continue
    }
    if (name === 'transChange') {
      added = closing ? 0 : 1
      continue
    }
    if (name === 'w') {
      if (closing) continue
      const lemma = attr('lemma')
      const strongs = [...lemma.matchAll(/strong:([GH]\d+)/g)]
        .map((m) => m[1].replace(/^([GH])0+(\d)/, '$1$2'))
        .join(' ')
      const morph = [...attr('morph').matchAll(/(?:robinson|strongMorph):([^\s"]+)/g)]
        .map((m) => m[1])
        .join(' ')

      if (selfClosing) {
        if (strongs) words.push(['', strongs, morph])
        continue
      }
      // Consume the element body so we can record its English gloss.
      const close = src.indexOf('</w>', i)
      const body = close === -1 ? '' : src.slice(i, close)
      const text = decode(body.replace(/<[^>]*>/g, ''))
      if (close !== -1) i = close + 4
      if (strongs || text) words.push([text, strongs, morph])
      push(text)
      continue
    }
    if (VOID_TAGS.has(name)) continue
    // divineName, foreign, inscription, seg … contribute their text only.
  }

  // Tidy whitespace without disturbing run boundaries.
  for (const s of segs) s[0] = s[0].replace(/\s+/g, ' ')
  const cleaned = segs.filter((s) => s[0] !== '')
  if (cleaned.length) {
    cleaned[0][0] = cleaned[0][0].replace(/^ /, '')
    const last = cleaned[cleaned.length - 1]
    last[0] = last[0].replace(/ $/, '')
  }
  return { segs: cleaned, words }
}

/* --------------------------------------------------------- Strong's dicts */

/** The openscriptures dictionaries are JS modules: `var strongsX = { … };` */
function parseStrongsModule(js) {
  const start = js.indexOf('{')
  const end = js.lastIndexOf('}')
  return JSON.parse(js.slice(start, end + 1))
}

function compactStrongs(dict, prefix) {
  const out = {}
  for (const [key, entry] of Object.entries(dict)) {
    const id = key.replace(/^([GH])0+(\d)/, '$1$2')
    if (!id.startsWith(prefix)) continue
    out[id] = {
      w: entry.lemma || entry.unicode || '',
      x: entry.xlit || entry.translit || '',
      p: entry.pron || entry.beta || '',
      d: (entry.strongs_def || entry.meaning || '').trim(),
      k: (entry.kjv_def || entry.kjv_usage || '').trim(),
      e: (entry.derivation || '').trim(),
    }
  }
  return out
}

/* ------------------------------------------------------------ cross-refs */

// OSIS book abbreviations used by the openbible.info cross-reference file.
const OSIS_ABBR = [
  'Gen', 'Exod', 'Lev', 'Num', 'Deut', 'Josh', 'Judg', 'Ruth', '1Sam', '2Sam',
  '1Kgs', '2Kgs', '1Chr', '2Chr', 'Ezra', 'Neh', 'Esth', 'Job', 'Ps', 'Prov',
  'Eccl', 'Song', 'Isa', 'Jer', 'Lam', 'Ezek', 'Dan', 'Hos', 'Joel', 'Amos',
  'Obad', 'Jonah', 'Mic', 'Nah', 'Hab', 'Zeph', 'Hag', 'Zech', 'Mal',
  'Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom', '1Cor', '2Cor', 'Gal', 'Eph',
  'Phil', 'Col', '1Thess', '2Thess', '1Tim', '2Tim', 'Titus', 'Phlm', 'Heb',
  'Jas', '1Pet', '2Pet', '1John', '2John', '3John', 'Jude', 'Rev',
]

/**
 * The OSIS source uses older English book titles ("I John", "Revelation of
 * John"). Readers expect the modern forms, so names come from this list rather
 * than the source file. Order is canonical and matches every dataset here.
 */
const BOOK_NAMES = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges',
  'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles',
  '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah',
  'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians',
  '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians',
  '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus',
  'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John',
  '3 John', 'Jude', 'Revelation',
]

/* ------------------------------------------------------------------- main */

async function main() {
  await mkdir(CACHE, { recursive: true })
  console.log('Fetching sources (cached in .data-cache):')
  const files = {}
  for (const [name, url] of Object.entries(SOURCES)) files[name] = await cached(name, url)

  for (const dir of ['t', 's', 'x', 'strongs']) {
    await mkdir(path.join(OUT, dir), { recursive: true })
  }

  /* ---- KJV: display text + red-letter + Strong's ---- */
  console.log('Parsing KJV OSIS …')
  const osis = await readJson(files['kjv-osis.json'])
  const books = []
  let verseTotal = 0
  const flatKjv = [] // plain text, canonical order — powers search

  for (let bi = 0; bi < osis.books.length; bi++) {
    const book = osis.books[bi]
    const chapters = []
    const strongsChapters = []
    for (const ch of book.chapters) {
      const verses = []
      const sVerses = []
      for (const v of ch.verses) {
        const { segs, words } = parseOsis(v.text)
        verses.push(segs)
        sVerses.push(words)
        flatKjv.push(segs.map((s) => s[0]).join(''))
        verseTotal++
      }
      chapters.push(verses)
      strongsChapters.push(sVerses)
    }
    books.push({
      i: bi,
      n: BOOK_NAMES[bi],
      a: OSIS_ABBR[bi],
      t: bi < 39 ? 'ot' : 'nt',
      c: chapters.map((c) => c.length),
    })
    await writeFile(path.join(OUT, 't', `kjv-${bi}.json`), JSON.stringify(chapters))
    await writeFile(path.join(OUT, 's', `${bi}.json`), JSON.stringify(strongsChapters))
  }
  console.log(`  ${books.length} books, ${verseTotal} verses`)

  /* ---- Other translations ---- */
  for (const [code, file] of [['asv', 'asv.json'], ['bbe', 'bbe.json'], ['ylt', 'ylt.json']]) {
    console.log(`Parsing ${code.toUpperCase()} …`)
    const src = await readJson(files[file])
    for (let bi = 0; bi < src.books.length; bi++) {
      const chapters = src.books[bi].chapters.map((c) => c.verses.map((v) => v.text))
      await writeFile(path.join(OUT, 't', `${code}-${bi}.json`), JSON.stringify(chapters))
    }
  }

  /* ---- Search corpus: one verse per line, canonical order ---- */
  await writeFile(path.join(OUT, 'search-kjv.txt'), flatKjv.join('\n'))
  console.log(`  search corpus ${(flatKjv.join('\n').length / 1e6).toFixed(1)} MB`)

  /* ---- Strong's dictionaries ---- */
  console.log('Compiling Strong\'s dictionaries …')
  const greek = compactStrongs(
    parseStrongsModule(await readFile(files['strongs-greek.js'], 'utf8')), 'G')
  const hebrew = compactStrongs(
    parseStrongsModule(await readFile(files['strongs-hebrew.js'], 'utf8')), 'H')
  await writeFile(path.join(OUT, 'strongs', 'G.json'), JSON.stringify(greek))
  await writeFile(path.join(OUT, 'strongs', 'H.json'), JSON.stringify(hebrew))
  console.log(`  ${Object.keys(greek).length} Greek, ${Object.keys(hebrew).length} Hebrew entries`)

  /* ---- Cross references ---- */
  console.log('Compiling cross references …')
  const abbrIndex = new Map(OSIS_ABBR.map((a, i) => [a.toLowerCase(), i]))
  const ref = (s) => {
    const m = s.match(/^(.+?)\.(\d+)\.(\d+)$/)
    if (!m) return null
    const bi = abbrIndex.get(m[1].toLowerCase())
    return bi === undefined ? null : [bi, +m[2], +m[3]]
  }

  const byBook = Array.from({ length: 66 }, () => ({}))
  const lines = (await readFile(files['xref.txt'], 'utf8')).split('\n')
  let kept = 0
  for (let li = 1; li < lines.length; li++) {
    const parts = lines[li].split('\t')
    if (parts.length < 3) continue
    const from = ref(parts[0])
    if (!from) continue
    const [toStart, toEnd] = parts[1].split('-')
    const a = ref(toStart)
    if (!a) continue
    const b = toEnd ? ref(toEnd) : null
    const votes = parseInt(parts[2], 10) || 0
    const key = `${from[1]}:${from[2]}`
    const bucket = (byBook[from[0]][key] ||= [])
    // [book, chapter, verse, endVerse, votes]
    bucket.push([a[0], a[1], a[2], b && b[0] === a[0] && b[1] === a[1] ? b[2] : a[2], votes])
    kept++
  }
  for (let bi = 0; bi < 66; bi++) {
    for (const key of Object.keys(byBook[bi])) {
      byBook[bi][key].sort((p, q) => q[4] - p[4])
      byBook[bi][key] = byBook[bi][key].slice(0, 24)
    }
    await writeFile(path.join(OUT, 'x', `${bi}.json`), JSON.stringify(byBook[bi]))
  }
  console.log(`  ${kept} cross references`)

  /* ---- Manifest ---- */
  await writeFile(
    path.join(OUT, 'meta.json'),
    JSON.stringify({
      books,
      verseTotal,
      translations: [
        { code: 'kjv', name: 'King James Version', year: 1769, note: 'Red-letter, Strong\'s tagged' },
        { code: 'asv', name: 'American Standard Version', year: 1901, note: 'Literal, classic' },
        { code: 'ylt', name: "Young's Literal Translation", year: 1898, note: 'Word-for-word' },
        { code: 'bbe', name: 'Bible in Basic English', year: 1949, note: 'Plain 1,000-word English' },
      ],
    })
  )
  console.log('Done → public/data')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
