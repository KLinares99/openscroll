/**
 * Generates the OpenScroll PWA icons as PNGs with no external dependencies —
 * just Node's built-in zlib for the image data.
 *
 * The mark is a bevelled cross standing on an open book, over a blue gradient.
 * It is drawn rather than embedded so every size stays pixel-crisp, the whole
 * set weighs a few KB, and the artwork can be tweaked in one place.
 *
 * Everything is composed at 4x and box-filtered down, which gives clean
 * anti-aliased edges without a canvas library.
 *
 * Run: npm run icons
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = new URL('../public/', import.meta.url)
mkdirSync(OUT, { recursive: true })

const BLUE_LIGHT = [79, 169, 243]
const BLUE_DEEP = [74, 79, 226]
const CREAM = [253, 251, 240]
const GOLD = [235, 216, 160]
const GOLD_DEEP = [211, 185, 116]
// The far page needs a clear value step, not just a hue shift, or the two
// pages merge into one silhouette once the icon is scaled down.
const GOLD_SHADE = [188, 156, 84]

/* ------------------------------------------------------------ PNG writing */

const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crc])
}

function png(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ------------------------------------------------------------------ paths */

/** Sample a quadratic Bezier, so page edges can curve. */
function curve(p0, p1, p2, steps = 14) {
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const u = 1 - t
    pts.push([
      u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    ])
  }
  return pts
}

const mirror = (pts) => pts.map(([x, y]) => [1 - x, y])

/* -------------------------------------------------------------- rendering */

/** A tiny supersampled painter: draw in unit coordinates, get clean edges. */
function paint(size, scale, draw) {
  const s = size * scale
  const buf = Buffer.alloc(s * s * 4)

  const set = (x, y, [r, g, b], a = 1) => {
    if (x < 0 || y < 0 || x >= s || y >= s) return
    const i = (y * s + x) * 4
    const inv = 1 - a
    buf[i] = buf[i] * inv + r * a
    buf[i + 1] = buf[i + 1] * inv + g * a
    buf[i + 2] = buf[i + 2] * inv + b * a
    buf[i + 3] = Math.max(buf[i + 3], Math.round(255 * a))
  }

  const api = {
    /** Diagonal linear gradient across the whole canvas. */
    gradient(from, to) {
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          const t = (x / s + y / s) / 2
          set(x, y, [
            from[0] + (to[0] - from[0]) * t,
            from[1] + (to[1] - from[1]) * t,
            from[2] + (to[2] - from[2]) * t,
          ])
        }
      }
    },

    /** Filled polygon in 0..1 space, via even-odd ray casting. */
    poly(points, color, alpha = 1) {
      const pts = points.map(([x, y]) => [x * s, y * s])
      let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity
      for (const [x, y] of pts) {
        if (y < minY) minY = y
        if (y > maxY) maxY = y
        if (x < minX) minX = x
        if (x > maxX) maxX = x
      }
      for (let y = Math.max(0, Math.floor(minY)); y <= Math.min(s - 1, Math.ceil(maxY)); y++) {
        const cy = y + 0.5
        for (let x = Math.max(0, Math.floor(minX)); x <= Math.min(s - 1, Math.ceil(maxX)); x++) {
          const cx = x + 0.5
          let inside = false
          for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const [xi, yi] = pts[i]
            const [xj, yj] = pts[j]
            if ((yi > cy) !== (yj > cy) && cx < ((xj - xi) * (cy - yi)) / (yj - yi) + xi) {
              inside = !inside
            }
          }
          if (inside) set(x, y, color, alpha)
        }
      }
    },

    ellipse(cx, cy, rx, ry, color, alpha = 1) {
      const CX = cx * s, CY = cy * s, RX = rx * s, RY = ry * s
      for (let y = Math.floor(CY - RY); y <= Math.ceil(CY + RY); y++) {
        for (let x = Math.floor(CX - RX); x <= Math.ceil(CX + RX); x++) {
          const nx = (x - CX) / RX
          const ny = (y - CY) / RY
          if (nx * nx + ny * ny <= 1) set(x, y, color, alpha)
        }
      }
    },
  }

  draw(api)

  // Box-filter down to the requested size.
  const out = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const i = ((y * scale + dy) * s + x * scale + dx) * 4
          r += buf[i]; g += buf[i + 1]; b += buf[i + 2]; a += buf[i + 3]
        }
      }
      const n = scale * scale
      const i = (y * size + x) * 4
      out[i] = r / n; out[i + 1] = g / n; out[i + 2] = b / n; out[i + 3] = a / n
    }
  }
  return out
}

/**
 * The mark.
 *
 * `inset` shrinks the artwork without shrinking the background, which is what
 * the maskable variant needs so Android's circular crop never clips the cross.
 */
function drawMark(p, inset = 0) {
  const k = 1 - inset * 2
  // Scale about the centre so the composition stays put as it shrinks.
  const at = ([x, y]) => [0.5 + (x - 0.5) * k, 0.5 + (y - 0.5) * k]
  const path = (pts) => pts.map(at)

  p.gradient(BLUE_LIGHT, BLUE_DEEP)

  // Soft halo behind the cross, built from faint stacked ellipses.
  for (let i = 10; i >= 1; i--) {
    const [cx, cy] = at([0.5, 0.44])
    p.ellipse(cx, cy, 0.31 * k * (i / 10), 0.33 * k * (i / 10), [255, 255, 255], 0.022)
  }

  /* ---- Cross ---- */
  // The foot stops just below the spine so the book hides where it lands.
  const vl = 0.437, vr = 0.551, vt = 0.212, vb = 0.752
  const hl = 0.302, hr = 0.686, ht = 0.352, hb = 0.470
  const xc = 0.494 // centre ridge, slightly left of middle so the gold face reads
  const yc = 0.411
  const chamfer = 0.034

  // Horizontal bar: lit top face, shaded lower face.
  p.poly(path([[hl, yc], [hl + chamfer, ht], [hr - chamfer, ht], [hr, yc]]), CREAM)
  p.poly(path([[hl, yc], [hl + chamfer, hb], [hr - chamfer, hb], [hr, yc]]), GOLD)

  // Vertical bar in front: lit left face, shaded right face. The foot is cut
  // square — chamfering it produced a point that read as an anchor fluke once
  // the book's V sat underneath.
  p.poly(path([[vl, vt + chamfer], [xc, vt], [xc, vb], [vl, vb]]), CREAM)
  p.poly(path([[xc, vt], [vr, vt + chamfer], [vr, vb], [xc, vb]]), GOLD)

  /* ---- Open book, drawn last so the cross appears to stand behind it ---- */
  // Each page sweeps from a raised wing tip down to the spine at centre. The
  // two pages meet exactly on the midline so the cross foot stays hidden
  // behind them; the spine is then drawn back in as a seam.
  // Both page edges sweep from a raised outer tip down to the spine. Shading
  // the two pages differently is what keeps that V reading as an open book
  // rather than as one solid chevron.
  const leftPage = [
    ...curve([0.236, 0.666], [0.366, 0.706], [0.5, 0.748]),
    [0.5, 0.802],
    ...curve([0.5, 0.802], [0.354, 0.762], [0.246, 0.722]),
  ]
  const rightPage = mirror(leftPage)
  const underside = (pts) => pts.map(([x, y]) => [x, y + 0.020])

  for (const page of [leftPage, rightPage]) p.poly(path(underside(page)), GOLD_DEEP)
  p.poly(path(leftPage), CREAM)
  p.poly(path(rightPage), GOLD_SHADE)

  // Spine seam, so the two pages read as one open book rather than a wedge.
  p.poly(path([[0.4955, 0.746], [0.5045, 0.746], [0.5045, 0.802], [0.4955, 0.802]]), [150, 120, 60], 0.75)
}

const targets = [
  ['icon-192.png', 192, 0],
  ['icon-512.png', 512, 0],
  ['apple-touch-icon.png', 180, 0],
  // Maskable icons must survive an aggressive circular crop.
  ['icon-maskable.png', 512, 0.11],
]

for (const [name, size, inset] of targets) {
  const rgba = paint(size, 4, (p) => drawMark(p, inset))
  writeFileSync(new URL(name, OUT), png(size, size, rgba))
  console.log(`  ${name} (${size}×${size})`)
}
console.log('Icons written to public/')
