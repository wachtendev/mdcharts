import { test } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.getComputedStyle = dom.window.getComputedStyle

const { mountStatCards } = await import('../src/statcard.ts')

function makeContainer(dataStatcards) {
  const div = document.createElement('div')
  div.className = 'mdchart-statcards'
  div.dataset.statcards = dataStatcards
  document.body.appendChild(div)
  return div
}

test('a truncated (streaming) statcard fence never throws and shows a placeholder', () => {
  const full = JSON.stringify([{ label: 'Revenue', value: '€51,200', delta: '+8.1%' }])
  for (let i = 1; i < full.length; i++) {
    const container = makeContainer(full.slice(0, i))
    assert.doesNotThrow(() => mountStatCards(document.body))
    container.remove()
  }
})

test('renders label, value, and a green delta for a positive sign', () => {
  const container = makeContainer(JSON.stringify([{ label: 'Revenue', value: '€51,200', delta: '+8.1%' }]))
  mountStatCards(document.body)
  assert.match(container.innerHTML, /Revenue/)
  assert.match(container.innerHTML, /€51,200/)
  assert.match(container.innerHTML, /\+8\.1%/)
  container.remove()
})

test('a tone with no delta still colors the card', () => {
  const container = makeContainer(JSON.stringify([{ label: 'Payments failed', value: 3, tone: 'danger' }]))
  mountStatCards(document.body)
  assert.match(container.innerHTML, /color-mix/)
  container.remove()
})

test('a malformed body (not an array of {label,value}) renders an error placeholder, not a throw', () => {
  const container = makeContainer(JSON.stringify({ label: 'oops' }))
  assert.doesNotThrow(() => mountStatCards(document.body))
  assert.match(container.innerHTML, /mdchart-placeholder/)
  container.remove()
})

test('label and value are escaped, not injected as HTML', () => {
  const container = makeContainer(JSON.stringify([{ label: '<script>x</script>', value: 1 }]))
  mountStatCards(document.body)
  assert.doesNotMatch(container.innerHTML, /<script>x/)
  container.remove()
})
