import type MarkdownIt from 'markdown-it'

export type MdInstance = InstanceType<typeof MarkdownIt>

// Status/delta vocabulary an AI can rely on -- documented in PROMPT.md too.
// Semantic tones (success/warn/danger) stay fixed regardless of brand so a
// failed payment always reads as failed.
const TONE_WORDS: Record<string, 'success' | 'warn' | 'danger' | 'neutral'> = {
  paid: 'success', delivered: 'success', shipped: 'success', active: 'success', completed: 'success',
  pending: 'warn', processing: 'warn', 'in transit': 'warn',
  failed: 'danger', cancelled: 'danger', canceled: 'danger', refunded: 'danger', inactive: 'danger', overdue: 'danger',
}

const DELTA_RE = /^([+-])\s?\d+(\.\d+)?%$/
const NUMERIC_RE = /^-?[$€£]?\s?[\d,]+(\.\d+)?%?$/

function toneClassFor(raw: string): string | null {
  const trimmed = raw.trim()
  const lower = trimmed.toLowerCase()
  if (lower in TONE_WORDS) return `mdchart-tone-${TONE_WORDS[lower]}`
  const delta = DELTA_RE.exec(trimmed)
  if (delta) return delta[1] === '+' ? 'mdchart-tone-success' : 'mdchart-tone-danger'
  return null
}

/**
 * Registered as a core rule: after the table is tokenized, walk each cell's
 * inline content and (a) mark numeric/currency columns for right-alignment,
 * (b) wrap recognized status words / +-% deltas in a toned span.
 * Purely additive over markdown-it's own token stream -- no new syntax.
 */
export interface StatusTableToggle {
  tone: boolean
}

export function attachStatusTables(md: MdInstance, toggle: StatusTableToggle = { tone: true }): void {
  md.core.ruler.push('mdchart_tables', (state: any) => {
    const toneEnabled = toggle.tone
    const tokens = state.tokens
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'table_open') continue
      tokens[i].attrSet('class', 'mdchart-table')
      const bodyStart = tokens.findIndex((t: any, j: number) => j > i && t.type === 'tbody_open')
      const bodyEnd = tokens.findIndex((t: any, j: number) => j > i && t.type === 'tbody_close')
      if (bodyStart === -1 || bodyEnd === -1) continue

      // Column numeric-ness: a column is numeric if every body cell in it is
      // numeric/currency/percent or empty.
      const rows: number[][] = []
      let row: number[] = []
      for (let j = bodyStart; j < bodyEnd; j++) {
        if (tokens[j].type === 'tr_open') row = []
        if (tokens[j].type === 'inline') row.push(j)
        if (tokens[j].type === 'tr_close') rows.push(row)
      }
      const colCount = Math.max(0, ...rows.map((r) => r.length))
      const colNumeric: boolean[] = []
      for (let c = 0; c < colCount; c++) {
        colNumeric[c] = rows.every((r) => {
          const content = r[c] !== undefined ? tokens[r[c]].content.trim() : ''
          return content === '' || NUMERIC_RE.test(content)
        })
      }

      rows.forEach((r) => {
        r.forEach((tokIdx, c) => {
          const inline = tokens[tokIdx]
          const openIdx = tokIdx - 1
          if (colNumeric[c] && tokens[openIdx]?.type === 'td_open') {
            tokens[openIdx].attrJoin('class', 'mdchart-td-numeric')
          }
          if (toneEnabled && inline.children?.length === 1 && inline.children[0].type === 'text') {
            const cls = toneClassFor(inline.children[0].content)
            if (cls) {
              inline.children[0].content = inline.children[0].content.trim()
              const openTok = new state.Token('html_inline', '', 0)
              openTok.content = `<span class="mdchart-pill ${cls}">`
              const closeTok = new state.Token('html_inline', '', 0)
              closeTok.content = '</span>'
              inline.children.unshift(openTok)
              inline.children.push(closeTok)
            }
          }
        })
      })
    }
  })
}
