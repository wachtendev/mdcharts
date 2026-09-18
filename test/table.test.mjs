import { test } from 'node:test'
import assert from 'node:assert/strict'
import MarkdownIt from 'markdown-it'
import { attachStatusTables } from '../src/table.ts'

function render(src) {
  const md = new MarkdownIt()
  attachStatusTables(md, { tone: true })
  return md.render(src)
}

test('known status words get a toned pill', () => {
  const html = render('| A | Status |\n|---|---|\n| x | paid |\n| y | failed |\n')
  assert.match(html, /mdchart-tone-success/)
  assert.match(html, /mdchart-tone-danger/)
})

test('percent deltas get toned by sign', () => {
  const html = render('| A | Delta |\n|---|---|\n| x | +8.1% |\n| y | -3.2% |\n')
  assert.match(html, /mdchart-tone-success/)
  assert.match(html, /mdchart-tone-danger/)
})

test('unrecognized words are left as plain text, not injected as HTML', () => {
  const html = render('| A | Note |\n|---|---|\n| x | <script>alert(1)</script> |\n')
  assert.doesNotMatch(html, /<script>alert/)
  assert.match(html, /&lt;script&gt;/)
})

test('numeric columns get right-align class, text columns do not', () => {
  const html = render('| Name | Total |\n|---|---|\n| Acme | 128.00 |\n| Beta | 64.50 |\n')
  assert.match(html, /mdchart-td-numeric/)
  const rows = html.split('<tr>')
  assert.doesNotMatch(rows[1] ?? '', /Acme.*mdchart-td-numeric/s)
})

test('tone can be disabled', () => {
  const md = new MarkdownIt()
  attachStatusTables(md, { tone: false })
  const html = md.render('| A | Status |\n|---|---|\n| x | paid |\n')
  assert.doesNotMatch(html, /mdchart-tone-success/)
})
