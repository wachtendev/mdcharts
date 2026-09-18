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

// Chart.js needs a canvas 2D context, which jsdom doesn't implement. Stub
// just enough of CanvasRenderingContext2D for `new Chart()` to not throw --
// we're testing the streaming/lifecycle contract in chart.ts, not Chart.js's
// own rendering.
dom.window.HTMLCanvasElement.prototype.getContext = () => ({
  save() {}, restore() {}, scale() {}, clearRect() {}, fillRect() {}, beginPath() {},
  moveTo() {}, lineTo() {}, closePath() {}, stroke() {}, fill() {}, arc() {},
  measureText: () => ({ width: 0 }), fillText() {}, translate() {}, rotate() {},
  setTransform() {}, drawImage() {}, createLinearGradient: () => ({ addColorStop() {} }),
})

const { mountCharts, unmountCharts } = await import('../src/chart.ts')

function makeContainer(dataChart) {
  const div = document.createElement('div')
  div.className = 'mdchart-chart'
  div.dataset.chart = dataChart
  document.body.appendChild(div)
  return div
}

test('an unparseable (streaming, truncated) chart fence never throws and shows a placeholder', async () => {
  const full = JSON.stringify({ type: 'bar', data: { labels: ['a'], datasets: [{ data: [1] }] } })
  for (let i = 1; i < full.length; i++) {
    const container = makeContainer(full.slice(0, i))
    await assert.doesNotReject(mountCharts(document.body))
    if (container.querySelector('canvas') == null) {
      assert.match(container.innerHTML, /mdchart-placeholder/)
    }
    container.remove()
  }
})

test('an unknown chart type renders an error placeholder instead of throwing', async () => {
  const container = makeContainer(JSON.stringify({ type: 'not-a-real-type', data: { datasets: [{ data: [1] }] } }))
  await assert.doesNotReject(mountCharts(document.body))
  assert.match(container.innerHTML, /mdchart-placeholder-error/)
  container.remove()
})

test('remounting with an identical config does not recreate the chart instance', async () => {
  const config = JSON.stringify({ type: 'bar', data: { labels: ['a'], datasets: [{ data: [1] }] } })
  const container = makeContainer(config)
  await mountCharts(document.body)
  const canvasBefore = container.querySelector('canvas')
  await mountCharts(document.body) // same config, second pass (simulates a debounced re-render mid-stream)
  const canvasAfter = container.querySelector('canvas')
  assert.equal(canvasBefore, canvasAfter, 'canvas element should be untouched when config is unchanged')
  container.remove()
})

test('a changed config destroys the previous instance and mounts a fresh one', async () => {
  const container = makeContainer(JSON.stringify({ type: 'bar', data: { labels: ['a'], datasets: [{ data: [1] }] } }))
  await mountCharts(document.body)
  container.dataset.chart = JSON.stringify({ type: 'bar', data: { labels: ['a', 'b'], datasets: [{ data: [1, 2] }] } })
  await assert.doesNotReject(mountCharts(document.body))
  assert.ok(container.querySelector('canvas'))
  container.remove()
})

test('unmountCharts clears tracked instances without throwing', async () => {
  const container = makeContainer(JSON.stringify({ type: 'bar', data: { labels: ['a'], datasets: [{ data: [1] }] } }))
  await mountCharts(document.body)
  assert.doesNotThrow(() => unmountCharts(document.body))
  container.remove()
})
