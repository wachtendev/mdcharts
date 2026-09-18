import { test } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.customElements = dom.window.customElements
globalThis.ResizeObserver = class { observe() {} disconnect() {} }
globalThis.getComputedStyle = dom.window.getComputedStyle
globalThis.devicePixelRatio = 1
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0)
globalThis.cancelAnimationFrame = (id) => clearTimeout(id)

// ECharts needs a canvas 2D context, which jsdom doesn't implement. Stub just
// enough for `echarts.init()` to not throw -- we're testing the
// streaming/lifecycle contract in chart.ts, not ECharts' own rendering.
dom.window.HTMLCanvasElement.prototype.getContext = () => ({
  save() {}, restore() {}, scale() {}, clearRect() {}, fillRect() {}, strokeRect() {},
  beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, stroke() {}, fill() {}, arc() {},
  arcTo() {}, bezierCurveTo() {}, quadraticCurveTo() {}, rect() {}, clip() {},
  measureText: () => ({ width: 0 }), fillText() {}, strokeText() {}, translate() {}, rotate() {},
  setTransform() {}, transform() {}, drawImage() {}, setLineDash() {}, getLineDash: () => [],
  createLinearGradient: () => ({ addColorStop() {} }),
  createRadialGradient: () => ({ addColorStop() {} }),
  createPattern: () => ({}),
  getImageData: () => ({ data: [] }),
  putImageData() {},
})
dom.window.HTMLCanvasElement.prototype.toDataURL = () => 'data:,'
// jsdom never lays out anything, so clientWidth/Height are always 0 and
// echarts.init() refuses to size a chart against that -- give every element
// a fixed size, since we're testing chart.ts's own lifecycle, not layout.
Object.defineProperty(dom.window.HTMLElement.prototype, 'clientWidth', { value: 400, configurable: true })
Object.defineProperty(dom.window.HTMLElement.prototype, 'clientHeight', { value: 300, configurable: true })

const { mountCharts, unmountCharts } = await import('../src/chart.ts')

function makeContainer(dataChart) {
  const div = document.createElement('div')
  div.className = 'mdchart-chart'
  div.dataset.chart = dataChart
  document.body.appendChild(div)
  return div
}

const barOption = () =>
  JSON.stringify({ xAxis: { type: 'category', data: ['a', 'b', 'c'] }, yAxis: { type: 'value' }, series: [{ type: 'bar', data: [1, 2, 3] }] })

test('an unparseable (streaming, truncated) chart fence never throws and shows a placeholder', async () => {
  const full = barOption()
  for (let i = 1; i < full.length; i++) {
    const container = makeContainer(full.slice(0, i))
    await assert.doesNotReject(mountCharts(document.body))
    if (container.querySelector('.mdchart-chart-mount') == null) {
      assert.match(container.innerHTML, /mdchart-placeholder/)
    }
    container.remove()
  }
})

test('an option with no series renders an error placeholder instead of throwing', async () => {
  const container = makeContainer(JSON.stringify({ title: { text: 'no series here' } }))
  await assert.doesNotReject(mountCharts(document.body))
  assert.match(container.innerHTML, /mdchart-placeholder/)
  container.remove()
})

test('remounting with an identical config does not recreate the chart instance', async () => {
  const config = barOption()
  const container = makeContainer(config)
  await mountCharts(document.body)
  const mountBefore = container.querySelector('.mdchart-chart-mount')
  await mountCharts(document.body) // same config, second pass (simulates a debounced re-render mid-stream)
  const mountAfter = container.querySelector('.mdchart-chart-mount')
  assert.equal(mountBefore, mountAfter, 'mount element should be untouched when config is unchanged')
  container.remove()
})

test('a changed config disposes the previous instance and mounts a fresh one', async () => {
  const container = makeContainer(barOption())
  await mountCharts(document.body)
  container.dataset.chart = JSON.stringify({
    xAxis: { type: 'category', data: ['a', 'b', 'c', 'd'] },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: [1, 2, 3, 4] }],
  })
  await assert.doesNotReject(mountCharts(document.body))
  assert.ok(container.querySelector('.mdchart-chart-mount'))
  container.remove()
})

test('unmountCharts clears tracked instances without throwing', async () => {
  const container = makeContainer(barOption())
  await mountCharts(document.body)
  assert.doesNotThrow(() => unmountCharts(document.body))
  container.remove()
})
