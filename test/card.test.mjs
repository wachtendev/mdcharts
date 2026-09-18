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
