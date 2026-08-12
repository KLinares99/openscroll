/**
 * Generates the OpenScroll PWA icons as PNGs with no external dependencies —
 * just Node's built-in zlib for the image data.
 *
 * The mark is a gold scroll: two rolled ends, a parchment body, and three lines
 * of text. Everything is drawn at 4x and box-filtered down, which gives clean
 * anti-aliased edges without a canvas library.
 *
 * Run: npm run icons
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = new URL('../public/', import.meta.url)
mkdirSync(OUT, { recursive: true })

const BG = [11, 11, 15]
const GOLD = [212, 172, 96]
const GOLD_DEEP = [166, 128, 60]
const PARCHMENT = [244, 233, 210]

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
    size: s,
    /** Rounded rectangle in 0..1 space. */
    rect(x0, y0, w, h, radius, color, alpha = 1) {
      const X = x0 * s, Y = y0 * s, W = w * s, H = h * s, R = radius * s
      for (let y = Math.floor(Y); y < Math.ceil(Y + H); y++) {
        for (let x = Math.floor(X); x < Math.ceil(X + W); x++) {
          const dx = Math.max(X + R - x, 0, x - (X + W - R))
          const dy = Math.max(Y + R - y, 0, y - (Y + H - R))
          if (dx * dx + dy * dy <= R * R || (dx === 0 && dy === 0)) set(x, y, color, alpha)
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
    fill(color) {
      for (let i = 0; i < s * s; i++) {
        buf[i * 4] = color[0]
        buf[i * 4 + 1] = color[1]
        buf[i * 4 + 2] = color[2]
        buf[i * 4 + 3] = 255
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
 * The mark: a scroll held between two thick gold rods.
 *
 * Proportions were settled by generating candidate artwork and checking which
 * silhouette survived being shrunk to 40px — the winner filled the frame, used
 * heavy rods, and carried almost no interior detail. Drawing it rather than
 * embedding a bitmap keeps every size pixel-crisp and the whole mark under 6 KB.
 */
function drawMark(p, inset = 0) {
  const k = 1 - inset * 2
  const at = (v) => inset + v * k
  const s = (v) => v * k

  p.fill(BG)

  // Parchment panel, spanning the gap between the two rods.
  p.rect(at(0.235), at(0.285), s(0.53), s(0.43), s(0.025), PARCHMENT)

  // A single soft crease keeps the panel from reading as a plain rectangle
  // without adding detail that would muddy at small sizes.
  p.rect(at(0.235), at(0.495), s(0.53), s(0.012), 0, GOLD_DEEP, 0.16)

  // The two rods, wider than the panel so the silhouette reads as a scroll.
  for (const y of [0.205, 0.715]) {
    p.rect(at(0.125), at(y), s(0.75), s(0.08), s(0.04), GOLD)
  }

  // Darker caps at each rod end, which is what sells the rolled form.
  for (const y of [0.245, 0.755]) {
    for (const x of [0.125, 0.875]) {
      p.ellipse(at(x), at(y), s(0.052), s(0.058), GOLD_DEEP)
    }
  }
}

const targets = [
  ['icon-192.png', 192, 0],
  ['icon-512.png', 512, 0],
  ['apple-touch-icon.png', 180, 0],
  // Maskable icons must survive an aggressive circular crop.
  ['icon-maskable.png', 512, 0.1],
]

for (const [name, size, inset] of targets) {
  const rgba = paint(size, 4, (p) => drawMark(p, inset))
  writeFileSync(new URL(name, OUT), png(size, size, rgba))
  console.log(`  ${name} (${size}×${size})`)
}
console.log('Icons written to public/')
