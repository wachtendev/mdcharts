import { resolvePalette } from './theme.ts'

export interface StatCardSpec {
  label: string
  value: string | number
  delta?: string
  tone?: 'success' | 'warn' | 'danger' | 'neutral'
}

const DELTA_RE = /^([+-])\s?\d+(\.\d+)?%?$/

function deltaTone(delta: string): 'success' | 'danger' | null {
  const m = DELTA_RE.exec(delta.trim())
  if (!m) return null
  return m[1] === '+' ? 'success' : 'danger'
}

function renderCard(card: StatCardSpec, palette: ReturnType<typeof resolvePalette>): string {
  const tone = card.tone && card.tone !== 'neutral' ? card.tone : (card.delta ? deltaTone(card.delta) : null)
  const toneColor = tone === 'success' ? palette.success : tone === 'warn' ? palette.warn : tone === 'danger' ? palette.danger : null
  const surfaceStyle = toneColor && card.tone ? `background:color-mix(in srgb, ${toneColor} 12%, transparent);` : ''
  const labelStyle = toneColor && card.tone ? `color:${toneColor};font-weight:500;` : ''
  const valueStyle = toneColor && card.tone ? `color:${toneColor};` : ''

  const deltaHtml = card.delta
    ? `<span class="mdchart-statcard-delta" style="${tone ? `color:${tone === 'success' ? palette.success : palette.danger};background:color-mix(in srgb, ${tone === 'success' ? palette.success : palette.danger} 14%, transparent);` : ''}">${escapeHtml(card.delta)}</span>`
    : ''

  return `<div class="mdchart-statcard" style="${surfaceStyle}">
    <div class="mdchart-statcard-label" style="${labelStyle}">${escapeHtml(card.label)}</div>
    <div class="mdchart-statcard-row">
      <div class="mdchart-statcard-value" style="${valueStyle}">${escapeHtml(String(card.value))}</div>
      ${deltaHtml}
    </div>
  </div>`
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
}

function renderPlaceholder(container: HTMLElement, message: string, tone: 'loading' | 'error' = 'loading') {
  container.innerHTML = `<div class="mdchart-placeholder mdchart-placeholder-${tone}">${message}</div>`
}

/**
 * Finds every `.mdchart-statcards[data-statcards]` under `root` and renders
 * its JSON array as a row of stat cards. Same streaming contract as
 * mountCharts: invalid/partial JSON (message still typing) is expected and
 * renders a quiet placeholder rather than throwing.
 */
export function mountStatCards(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('.mdchart-statcards').forEach((container) => {
    const raw = container.dataset.statcards ?? ''
    let cards: StatCardSpec[]
    try {
      cards = JSON.parse(raw)
      if (!Array.isArray(cards) || !cards.every((c) => c && typeof c.label === 'string' && 'value' in c)) {
        throw new Error('expected an array of {label, value}')
      }
    } catch {
      renderPlaceholder(container, 'Stat cards loading…')
      return
    }

    try {
      const palette = resolvePalette(container)
      container.innerHTML = cards.map((c) => renderCard(c, palette)).join('')
    } catch (err) {
      renderPlaceholder(container, `Stat cards failed to render: ${(err as Error).message}`, 'error')
    }
  })
}
