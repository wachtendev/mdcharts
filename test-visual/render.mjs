// One-off visual verification harness -- NOT part of the library or its test
// suite. Renders every ```chart fence in demo/all-charts.md to a real PNG via
// node-canvas backing a jsdom document, so charts can be inspected by eye
// without a browser. Run: node test-visual/render.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { createCanvas } from 'canvas'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true })
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.customElements = dom.window.customElements
globalThis.getComputedStyle = dom.window.getComputedStyle
globalThis.ResizeObserver = class { observe() {} disconnect() {} }
globalThis.MutationObserver = dom.window.MutationObserver
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame

// Fixed client size for every element so Chart.js's responsive layout has
// real numbers to work with instead of jsdom's default all-zero layout.
Object.defineProperty(dom.window.HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return 900 } })
Object.defineProperty(dom.window.HTMLElement.prototype, 'clientHeight', { configurable: true, get() { return 480 } })

// Back every canvas element with a real node-canvas 2D context so Chart.js
// actually draws pixels we can export, not a no-op stub.
// width/height must stay in sync with the node-canvas backing store even
// when Chart.js resizes the element AFTER getContext() was already called
// (its responsive layout does exactly this) -- plain instance properties
// silently decoupled the two, so every draw call landed outside the actual
// buffer and the export came out fully transparent.
Object.defineProperty(dom.window.HTMLCanvasElement.prototype, 'width', {
  configurable: true,
  get() { return this._w ?? 900 },
  set(v) { this._w = v; if (this._nc && v > 0) this._nc.width = v },
})
Object.defineProperty(dom.window.HTMLCanvasElement.prototype, 'height', {
  configurable: true,
  get() { return this._h ?? 480 },
  set(v) { this._h = v; if (this._nc && v > 0) this._nc.height = v },
})
dom.window.HTMLCanvasElement.prototype.getContext = function (type) {
  if (!this._nc) this._nc = createCanvas(this._w ?? 900, this._h ?? 480)
  const ctx = this._nc.getContext(type)
  // Chart.js's acquireContext verifies `context.canvas === item` and bails
  // out silently (no throw, just a console warning) if it doesn't match --
  // node-canvas's context.canvas points at the node-canvas Canvas, not this
  // jsdom element, so without this the chart "succeeds" but draws nothing.
  try { Object.defineProperty(ctx, 'canvas', { value: this, configurable: true }) } catch { ctx.canvas = this }
  // chartjs-chart-geo's GeoFeature caches shapes to an offscreen canvas via
  // canvas.ownerDocument.createElement('canvas') and blits it with
  // drawImage() -- node-canvas's drawImage only recognizes genuine
  // node-canvas Image/Canvas objects, not a jsdom element that merely has
  // a node-canvas backing on a private property, so it throws "Image or
  // Canvas expected". Unwrap transparently.
  if (!ctx.__mdchartDrawImagePatched) {
    ctx.__mdchartDrawImagePatched = true
    const origDrawImage = ctx.drawImage.bind(ctx)
    ctx.drawImage = (image, ...rest) => origDrawImage(image && image._nc ? image._nc : image, ...rest)
  }
  return ctx
}


const { mountCharts, unmountCharts } = await import('../src/chart.ts')

const md = readFileSync(new URL('../demo/all-charts.md', import.meta.url), 'utf8')
const lines = md.split('\n')
const cases = []
let currentTitle = 'untitled'
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('## ')) currentTitle = lines[i].slice(3).trim()
  if (lines[i].trim() === '```chart') {
    const body = []
    let j = i + 1
    while (j < lines.length && lines[j].trim() !== '```') { body.push(lines[j]); j++ }
    cases.push({ title: currentTitle, json: body.join('\n') })
    i = j
  }
}

mkdirSync(new URL('./out/', import.meta.url), { recursive: true })

const results = []
for (const [idx, c] of cases.entries()) {
  const container = document.createElement('div')
  container.className = 'mdchart-chart'
  // jsdom has no real layout engine -- Chart.js's responsive:true sizing
  // reads getComputedStyle (always 0 here, not clientWidth), so it computes
  // a 0x0 canvas and draws nothing. Force fixed dimensions for this
  // verification pass only; the library's actual default (responsive:true)
  // is correct and works fine in any real browser.
  const parsed = JSON.parse(c.json)
  // animation:false too -- with 20 charts mounted sequentially in one
  // process, jsdom's requestAnimationFrame backlog from earlier charts'
  // animations delays later ones past any reasonable wait, so charts
  // mounted later in the run silently never draw within the wait window.
  parsed.options = { ...(parsed.options ?? {}), responsive: false, animation: false }
  container.dataset.chart = JSON.stringify(parsed)
  document.body.appendChild(container)

  let errorText = null
  const origError = console.error
  console.error = () => {} // Chart.js logs internal warnings we don't need in this pass
  try {
    await mountCharts(document.body)
    // Chart.js defers its first draw to requestAnimationFrame by default;
    // exporting the canvas immediately after mount races that frame.
    await new Promise((resolve) => setTimeout(resolve, 80))
  } catch (e) {
    errorText = String(e)
  }
  console.error = origError

  const placeholder = container.querySelector('.mdchart-placeholder')
  const canvas = container.querySelector('canvas')
  const slug = String(idx + 1).padStart(2, '0') + '-' + c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const outPath = new URL(`./out/${slug}.png`, import.meta.url)

  if (canvas && canvas._nc) {
    writeFileSync(outPath, canvas._nc.toBuffer('image/png'))
    results.push({ title: c.title, status: placeholder ? 'placeholder-and-canvas' : 'rendered', file: slug + '.png' })
  } else if (placeholder) {
    results.push({ title: c.title, status: 'placeholder: ' + placeholder.textContent, file: null })
  } else {
    results.push({ title: c.title, status: 'no canvas, no placeholder' + (errorText ? ' -- threw: ' + errorText : ''), file: null })
  }

  unmountCharts(document.body)
  container.remove()
}

console.log(results.map((r, i) => `${String(i + 1).padStart(2, '0')}. ${r.title} -> ${r.status}${r.file ? ' [' + r.file + ']' : ''}`).join('\n'))
