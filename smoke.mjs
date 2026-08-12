/**
 * End-to-end smoke test for OpenScroll.
 * Requires `npm run preview` to be serving on 127.0.0.1:4174.
 */
import { chromium } from 'playwright'

const URL = 'http://127.0.0.1:4174/openscroll/'
const SHOT = process.env.SHOT_DIR ?? './shots'
const fails = []
const ok = (name, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
  if (!cond) fails.push(name)
}

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })

const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

/** Text of the slide currently snapped into view. */
const activeSlide = () =>
  page.locator('.feed').evaluate((el) => {
    const index = Math.round(el.scrollTop / el.clientHeight)
    return el.children[index]?.innerText ?? ''
  })

const scrollFeed = async (times) => {
  for (let i = 0; i < times; i++) {
    await page.locator('.feed').evaluate((el) => el.scrollBy({ top: el.clientHeight }))
    await page.waitForTimeout(160)
  }
  await page.waitForTimeout(500)
}

await page.goto(URL, { waitUntil: 'networkidle' })

/* ---- Onboarding ---- */
ok('onboarding shows', await page.getByText('Scroll the Word').isVisible())
await page.screenshot({ path: `${SHOT}/1-onboarding.png` })
await page.getByRole('button', { name: 'Next' }).click()
await page.getByRole('button', { name: 'Next' }).click()
await page.getByRole('button', { name: /Start at Genesis/ }).click()
await page.waitForTimeout(1200)

/* ---- Feed ---- */
let slide = await activeSlide()
ok('feed opens at Genesis 1:1', /GENESIS 1:1/i.test(slide), slide.split('\n')[0])
ok('verse text rendered', /In the beginning God created/.test(slide))
await page.screenshot({ path: `${SHOT}/2-feed.png` })

await scrollFeed(3)
const counter = (await page.locator('text=/\\d+ \\/ 31102/').innerText()).trim()
ok('scroll advances position', counter.startsWith('4 /'), counter)
ok('scrolled verse is Genesis 1:4', /GENESIS 1:4/i.test(await activeSlide()))

/* ---- Study sheet ---- */
await page.getByRole('button', { name: 'Study' }).click()
await page.waitForTimeout(1600)
const study = await page.locator('[role=dialog]').innerText()
ok('study sheet opens on the active verse', /Genesis 1:4/.test(study), study.split('\n')[0])
ok('context section present', /Theme|Beginnings/.test(study))
ok('plain-English section present', /Plain English/i.test(study))
ok('key words present', /Key words/i.test(study))
await page.screenshot({ path: `${SHOT}/3-study.png` })

await page.getByRole('button', { name: 'Original' }).click()
await page.waitForTimeout(1400)
const orig = await page.locator('[role=dialog]').innerText()
ok('Hebrew lemma shown', /[֐-׿]/.test(orig), orig.match(/[֐-׿]+/)?.[0])
ok('morphology decoded to English', /Qal|Noun|Verb/.test(orig), orig.match(/(Qal|Noun|Verb)[^\n]*/)?.[0])
await page.screenshot({ path: `${SHOT}/4-original.png` })

await page.getByRole('button', { name: 'Related' }).click()
await page.waitForTimeout(1400)
const rel = await page.locator('[role=dialog]').innerText()
ok('cross references listed with votes', /votes/.test(rel), rel.match(/[\w ]+\d+:\d+/)?.[0])
await page.screenshot({ path: `${SHOT}/5-related.png` })
await page.locator('[role=dialog] button[aria-label=Close]').click()
await page.waitForTimeout(300)

/* ---- Search ---- */
await page.getByRole('button', { name: 'Search' }).click()
await page.waitForTimeout(400)
await page.locator('input').fill('shepherd')
await page.waitForTimeout(3000)
const searchText = await page.locator('body').innerText()
ok('search returns matches', /\d+ matches/.test(searchText), searchText.match(/\d+ matches/)?.[0])
ok('expected verse in results', /The LORD is my shepherd/i.test(searchText))
await page.screenshot({ path: `${SHOT}/6-search.png` })

await page.locator('button:has-text("Psalms 23:1")').first().click()
await page.waitForTimeout(1400)
ok('search result navigates the feed', /PSALMS 23:1/i.test(await activeSlide()), (await activeSlide()).split('\n')[0])

/* ---- Red letter ---- */
await page.getByRole('button', { name: 'Library' }).click()
await page.waitForTimeout(500)
await page.locator('button').filter({ has: page.getByText('John', { exact: true }) }).first().click()
await page.waitForTimeout(500)
await page.getByRole('button', { name: '3', exact: true }).click()
await page.waitForTimeout(1300)
await scrollFeed(15)
ok('red-letter words of Jesus render', (await page.locator('.jesus').count()) > 0,
  `${await page.locator('.jesus').count()} red runs`)
ok('landed in John 3', /JOHN 3:/i.test(await activeSlide()), (await activeSlide()).split('\n')[0])
await page.screenshot({ path: `${SHOT}/7-redletter.png` })

/* ---- Save + marks ---- */
await page.getByRole('button', { name: 'Save' }).click()
await page.waitForTimeout(300)
await page.getByRole('button', { name: 'Marks' }).click()
await page.waitForTimeout(1200)
const marks = await page.locator('body').innerText()
ok('saved verse appears in Marks', /John 3:/.test(marks), marks.match(/John 3:\d+/)?.[0])
await page.screenshot({ path: `${SHOT}/8-marks.png` })

/* ---- Profile ---- */
await page.getByRole('button', { name: 'You' }).click()
await page.waitForTimeout(700)
const prof = await page.locator('body').innerText()
ok('stats render', /day streak/.test(prof) && /verses read/.test(prof),
  prof.match(/[\d.]+%/)?.[0] + ' of the Bible')
await page.screenshot({ path: `${SHOT}/9-profile.png` })

await page.getByRole('button', { name: 'Sepia' }).click()
await page.waitForTimeout(400)
ok('theme switch applies', (await page.locator('html').getAttribute('data-theme')) === 'sepia')

/* ---- Translation switch ---- */
await page.locator('button:has-text("BBE")').first().click()
await page.waitForTimeout(400)
await page.getByRole('button', { name: 'Scroll' }).click()
await page.waitForTimeout(1500)
ok('translation switch changes the text', /· BBE/i.test(await activeSlide()),
  (await activeSlide()).split('\n').slice(0, 3).join(' ').slice(0, 60))
await page.screenshot({ path: `${SHOT}/10-bbe-sepia.png` })

/* ---- Persistence ---- */
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1800)
const afterReload = await page.locator('body').innerText()
ok('no onboarding after reload', !/Scroll the Word/.test(afterReload))
ok('resumes where reading stopped', /JOHN 3:/i.test(await activeSlide()), (await activeSlide()).split('\n')[0])

console.log('\nconsole errors:', errors.length ? errors.slice(0, 6) : 'none')
console.log(fails.length ? `\n${fails.length} FAILING: ${fails.join(', ')}` : '\nALL PASS')
await browser.close()
process.exit(fails.length ? 1 : 0)
