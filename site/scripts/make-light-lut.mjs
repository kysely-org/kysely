// Builds a Dark+ -> Light+ 3D LUT (.cube) from known VS Code token pairs.
// Anchors: exact palette mappings + blend-line samples for antialiased edges.
import { writeFileSync } from 'node:fs'

const hex = (h) => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
]

// [dark+, light+] pairs
const PAIRS = [
  ['#1E1E1E', '#FFFFFF'], // editor bg
  ['#D4D4D4', '#000000'], // default fg
  ['#569CD6', '#0000FF'], // keyword
  ['#C586C0', '#AF00DB'], // control keyword
  ['#CE9178', '#A31515'], // string
  ['#DCDCAA', '#795E26'], // function
  ['#9CDCFE', '#001080'], // variable/property
  ['#4FC1FF', '#0070C1'], // const variable
  ['#B5CEA8', '#098658'], // number
  ['#6A9955', '#008000'], // comment
  ['#4EC9B0', '#267F99'], // type/class
  ['#858585', '#237893'], // line numbers
  ['#264F78', '#ADD6FF'], // selection bg
  ['#252526', '#F3F3F3'], // widget/popup bg
  ['#2D2D2D', '#ECECEC'], // tab bar bg
  ['#3C3C3C', '#DDDDDD'], // title bar bg
  ['#454545', '#C8C8C8'], // widget border
  ['#CCCCCC', '#616161'], // popup fg
  ['#AEAFAD', '#000000'], // cursor
  ['#F14C4C', '#E51400'], // error squiggle
  ['#007ACC', '#007ACC'], // status bar blue (identity)
  ['#FF5F57', '#FF5F57'], // traffic light red (identity)
  ['#FEBC2E', '#FEBC2E'], // traffic light yellow (identity)
  ['#28C840', '#28C840'], // traffic light green (identity)
]

const EDITOR_BG = { dark: hex('#1E1E1E'), light: hex('#FFFFFF') }
const POPUP_BG = { dark: hex('#252526'), light: hex('#F3F3F3') }

const mix = (a, b, t) => a.map((v, i) => v * (1 - t) + b[i] * t)

// Build anchor set: exact pairs + antialiasing blend lines toward both
// background surfaces (editor and popup), so glyph edges land on Light+ ramps.
const anchors = []
for (const [d, l] of PAIRS) {
  const dark = hex(d)
  const light = hex(l)
  anchors.push([dark, light])
  for (const bg of [EDITOR_BG, POPUP_BG]) {
    for (const t of [0.25, 0.5, 0.75]) {
      anchors.push([mix(dark, bg.dark, t), mix(light, bg.light, t)])
    }
  }
}

const dist2 = (a, b) =>
  (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2

// Shepard inverse-distance interpolation over anchors.
function map(p) {
  let wsum = 0
  const out = [0, 0, 0]
  for (const [src, dst] of anchors) {
    const d2 = dist2(p, src)
    if (d2 < 1e-8) return dst
    const w = 1 / d2 ** 2 // power 4 — localizes each anchor's influence
    wsum += w
    out[0] += dst[0] * w
    out[1] += dst[1] * w
    out[2] += dst[2] * w
  }
  return out.map((v) => Math.min(1, Math.max(0, v / wsum)))
}

const SIZE = 33
let cube = `TITLE "dark-plus to light-plus"\nLUT_3D_SIZE ${SIZE}\n`
for (let b = 0; b < SIZE; b++) {
  for (let g = 0; g < SIZE; g++) {
    for (let r = 0; r < SIZE; r++) {
      const p = [r / (SIZE - 1), g / (SIZE - 1), b / (SIZE - 1)]
      const [or, og, ob] = map(p)
      cube += `${or.toFixed(6)} ${og.toFixed(6)} ${ob.toFixed(6)}\n`
    }
  }
}

writeFileSync(new URL('./dark-to-light.cube', import.meta.url), cube)
console.log(`wrote dark-to-light.cube (${anchors.length} anchors, ${SIZE}^3)`)
