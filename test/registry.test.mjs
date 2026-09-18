import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadEcharts, ensureSeriesExtensions } from '../src/registry.ts'

test('loadEcharts resolves the echarts module and caches it across calls', async () => {
  const a = await loadEcharts()
  const b = await loadEcharts()
  assert.equal(a, b, 'repeated calls should return the same cached module, not re-import')
  assert.equal(typeof a.init, 'function')
})

test('ensureSeriesExtensions is a no-op for series types with no optional extension', async () => {
  await assert.doesNotReject(ensureSeriesExtensions(['bar', 'line', 'pie']))
})

// wordCloud/liquidFill packages assume a browser/bundler environment (a UMD
// `self` global, an ESM `exports` map only a bundler resolves) -- loading
// them for real belongs to the live-browser verification this project
// already does (see demo/all-charts.md), not a plain-Node unit test.
