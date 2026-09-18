import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderMarkdown } from '../src/md.ts'

test('::: card wraps its content in a bordered card with a headline', async () => {
  const html = await renderMarkdown('::: card Revenue trend\nSome text.\n:::\n')
  assert.match(html, /<div class="mdchart-card">/)
  assert.match(html, /<div class="mdchart-card-head">Revenue trend<\/div>/)
  assert.match(html, /<div class="mdchart-card-body">/)
  assert.match(html, /Some text\./)
})

test('::: card with no title omits the head but still wraps the body', async () => {
  const html = await renderMarkdown('::: card\nJust content.\n:::\n')
  assert.match(html, /<div class="mdchart-card">/)
  assert.doesNotMatch(html, /mdchart-card-head/)
  assert.match(html, /Just content\./)
})

test('a ```chart fence nests correctly inside a card', async () => {
  const html = await renderMarkdown('::: card Revenue\n```chart\n{"type":"bar","data":{"datasets":[]}}\n```\n:::\n')
  assert.match(html, /<div class="mdchart-card">/)
  assert.match(html, /class="mdchart-chart"/)
})

test('::: cards lays out multiple ::: card blocks as siblings in a row', async () => {
  const html = await renderMarkdown(':::: cards\n::: card A\nFirst.\n:::\n\n::: card B\nSecond.\n:::\n::::\n')
  assert.match(html, /<div class="mdchart-card-row">/)
  const cardCount = html.match(/<div class="mdchart-card">/g)?.length ?? 0
  assert.equal(cardCount, 2, 'both cards should survive as siblings inside the row, not get merged into one')
  assert.match(html, /First\./)
  assert.match(html, /Second\./)
})
