import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { Resvg } = require('@resvg/resvg-js')

/** favicon.svg 와 동일 심볼 · 앱 아이콘용 full-bleed (외곽 rx 없음) */
const icon = readFileSync(new URL('../public/icon.svg', import.meta.url))

function writePng(size, outRel) {
  const png = new Resvg(icon, {
    fitTo: { mode: 'width', value: size },
  })
    .render()
    .asPng()
  writeFileSync(new URL(outRel, import.meta.url), png)
  console.log('wrote', outRel, png.length)
}

writePng(180, '../public/apple-touch-icon.png')
writePng(192, '../public/icon-192.png')
writePng(512, '../public/icon-512.png')
writePng(1024, '../public/iphone-app-icon-1024.png')
