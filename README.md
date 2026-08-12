# OpenScroll

**The Bible, one verse at a time — free, offline, and ad-free.**

An infinite-scroll scripture reader: full-screen verses you swipe through like a
short-video feed, with real study tools behind every verse. No subscription, no
adverts, no account, no analytics. Install it to a phone home screen and the
whole Bible works with the network off.

This is a clean-room reimplementation of the *category* — a scrollable Bible with
per-verse study — built entirely on public-domain and openly licensed data. It
shares no code, text, or assets with any commercial app.

## What it does

| | |
|---|---|
| **Scroll** | All 31,102 verses in one snapping vertical feed, resuming where you left off |
| **Red letter** | The words of Jesus in red, from the source markup rather than guesswork |
| **Deep Study** | Book context, where the verse sits, plain-English rendering, key words — with a Basic/Advanced toggle |
| **Original Language** | Word-by-word Greek and Hebrew with Strong's numbers, transliteration, definitions, and morphology decoded into English grammar |
| **Explain It Easier** | The Bible in Basic English — a real translation limited to ~1,000 English words — plus all four translations side by side |
| **Related Verses** | 344,799 cross references ranked by community votes, tappable to jump straight there |
| **Search** | Full-text across the whole Bible, word or `"exact phrase"`, scoped to either testament |
| **Library** | Every book and chapter, with per-book reading progress |
| **Marks** | Saved verses, personal notes, and five highlight colours |
| **You** | Day streak, verses read, percentage of the Bible covered, and one-tap backup |
| **Read aloud** | Built-in speech synthesis, no audio files to license |
| **Themes** | Dark, light, and sepia; adjustable text size; optional auto-advance |

Four translations ship: **KJV** (1769, red-letter and Strong's tagged), **ASV**
(1901), **YLT** (1898), and **BBE** (1949).

## Why the study tools are free

The paid apps in this category generate per-verse study with an LLM, which costs
money per tap and needs a network. OpenScroll instead compiles openly licensed
scholarly data at build time:

- **Deep Study** — book context authored in `src/data/books.ts`, combined with
  canonical position, key-word definitions, and cross references.
- **Original Language** — Strong's numbers and Robinson/strongMorph morphology
  come tagged in the KJV OSIS source; `src/lib/morph.ts` expands the codes into
  plain English. Codes it cannot decode with confidence are shown verbatim
  rather than guessed at.
- **Explain It Easier** — the BBE is an actual translation into restricted
  vocabulary, which is more trustworthy than a machine paraphrase.

The result costs nothing to run, works offline, and cites its sources.

## Stack

React + Vite + TypeScript + Tailwind. No backend, no database, no accounts.
Everything you save lives in `localStorage` on your device; the Profile tab can
export and re-import it as JSON.

Roughly 66 KB of gzipped JavaScript. Scripture data is fetched per book
(~70 KB each) and cached permanently by the service worker, so the app gets
faster the more you read.

## Develop

```bash
npm install
npm run data     # download sources and compile public/data (~39 MB, once)
npm run dev
npm run build
npm run preview  # serves at /openscroll/
npm run icons    # regenerate PWA icons
```

End-to-end test (needs `npm run preview` running in another shell):

```bash
node smoke.mjs
```

## Deploy

`.github/workflows/deploy.yml` builds the data and publishes to GitHub Pages on
every push to `main`. Enable Pages with **Settings → Pages → Source: GitHub
Actions**. The base path is taken from the repository name; for a custom domain,
build with `OPENSCROLL_BASE=/`.

## Sources and licensing

| Data | Source | Licence |
|---|---|---|
| KJV with Strong's, morphology and red-letter markup | [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases) (OSIS) | Public domain |
| ASV, YLT, BBE | scrollmapper/bible_databases | Public domain |
| Strong's Greek & Hebrew dictionaries | [openscriptures/strongs](https://github.com/openscriptures/strongs) | Public domain |
| 344,799 cross references | [OpenBible.info](https://www.openbible.info/labs/cross-references/) | CC-BY |

All four translations are out of copyright, which is precisely why the app can
be given away. Modern translations (NIV, ESV, NLT) are licensed and cannot be
bundled into a free app without permission.

Application code: MIT.
