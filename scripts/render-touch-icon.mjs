import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { Resvg } = require('@resvg/resvg-js')

// favicon.svg 와 같은 P path. iOS가 모서리를 깎으므로 rx 없이 full-bleed.
const favicon = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8')
const svg = favicon
  .replace(/rx="7"\s*/, '')
  .replace('<svg', '<svg width="180" height="180"')

const png = new Resvg(svg, { fitTo: { mode: 'width', value: 180 } }).render().asPng()
writeFileSync(new URL('../public/apple-touch-icon.png', import.meta.url), png)
console.log('wrote apple-touch-icon.png', png.length, 'bytes')
