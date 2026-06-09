// Generate PWA icons with zero dependencies (pure Node PNG encoder).
// Draws a simple barbell mark on the app's dark background. Run: npm run icons

import zlib from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const BG = [11, 11, 12] // #0b0b0c
const BAR = [229, 229, 231] // #e5e5e7
const ACCENT = [255, 107, 53] // #ff6b35

// --- minimal PNG encoder (8-bit RGBA) ---------------------------------------
const CRC_TABLE = (() => {
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
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeData))
  return Buffer.concat([len, typeData, crc])
}

function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type RGBA
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// --- draw the barbell -------------------------------------------------------
function drawIcon(size) {
  const px = Buffer.alloc(size * size * 4)
  const set = (x, y, [r, g, b]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    px[i] = r
    px[i + 1] = g
    px[i + 2] = b
    px[i + 3] = 255
  }
  const rect = (x0, y0, x1, y1, color) => {
    for (let y = Math.round(y0); y < Math.round(y1); y++)
      for (let x = Math.round(x0); x < Math.round(x1); x++) set(x, y, color)
  }

  rect(0, 0, size, size, BG)
  const cy = size / 2
  const s = (f) => size * f
  // bar
  rect(s(0.2), cy - s(0.028), s(0.8), cy + s(0.028), BAR)
  // plates: inner (tall) + outer (short), each side
  rect(s(0.24), cy - s(0.2), s(0.29), cy + s(0.2), ACCENT) // left inner
  rect(s(0.18), cy - s(0.13), s(0.225), cy + s(0.13), ACCENT) // left outer
  rect(s(0.71), cy - s(0.2), s(0.76), cy + s(0.2), ACCENT) // right inner
  rect(s(0.775), cy - s(0.13), s(0.82), cy + s(0.13), ACCENT) // right outer
  return px
}

mkdirSync('public', { recursive: true })
for (const size of [192, 512, 180]) {
  const png = encodePNG(size, drawIcon(size))
  const name =
    size === 180 ? 'apple-touch-icon.png' : size === 512 ? 'pwa-512.png' : 'pwa-192.png'
  writeFileSync(`public/${name}`, png)
  console.log(`wrote public/${name} (${png.length} bytes)`)
}
// Maskable reuses the 512 art (barbell sits inside the safe zone).
writeFileSync('public/maskable-512.png', encodePNG(512, drawIcon(512)))
console.log('wrote public/maskable-512.png')

// Simple SVG favicon.
writeFileSync(
  'public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#0b0b0c"/><rect x="20" y="47" width="60" height="6" fill="#e5e5e7"/><rect x="24" y="30" width="5" height="40" fill="#ff6b35"/><rect x="18" y="37" width="4.5" height="26" fill="#ff6b35"/><rect x="71" y="30" width="5" height="40" fill="#ff6b35"/><rect x="77.5" y="37" width="4.5" height="26" fill="#ff6b35"/></svg>`,
)
console.log('wrote public/favicon.svg')
