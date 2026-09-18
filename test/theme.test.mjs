import { test } from 'node:test'
import assert from 'node:assert/strict'
import { categoricalColor, sequentialScale, contrastRatio, readableTextOn } from '../src/theme.ts'

const palette = {
  brand: ['#7c3aed', '#0ea5e9', '#14b8a6'],
  surface: '#ffffff',
  text: '#0f172a',
  grid: '#e2e8f0',
  success: '#16a34a',
  warn: '#d97706',
  danger: '#dc2626',
}

test('categoricalColor returns brand colors in order within range', () => {
  assert.equal(categoricalColor(palette, 0), '#7c3aed')
  assert.equal(categoricalColor(palette, 2), '#14b8a6')
})

test('categoricalColor is deterministic and distinct beyond the brand list', () => {
  const a = categoricalColor(palette, 5)
  const b = categoricalColor(palette, 5)
  assert.equal(a, b)
  const colors = Array.from({ length: 9 }, (_, i) => categoricalColor(palette, i))
  assert.equal(new Set(colors).size, 9)
})

test('sequentialScale produces the requested number of distinct steps', () => {
  const ramp = sequentialScale(palette, 9)
  assert.equal(ramp.length, 9)
  assert.equal(new Set(ramp).size, 9)
})

test('contrastRatio and readableTextOn stay within WCAG bounds', () => {
  assert.ok(contrastRatio('#000000', '#ffffff') > 20)
  assert.equal(readableTextOn('#111111'), '#f8fafc')
  assert.equal(readableTextOn('#f5f5f5'), '#0f172a')
})
