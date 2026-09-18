import MarkdownIt from 'markdown-it'
import { attachStatusTables, type StatusTableToggle, type MdInstance } from './table.ts'

export interface MdChartOptions {
  /** Turn off status/delta pill coloring in tables. Default true. */
  tableTone?: boolean
  /** Additional markdown-it plugins/hooks a host wants layered in (e.g. claude-web's wikilinks). */
  extend?: (md: MdInstance) => void
}

const md = new MarkdownIt({ html: false, linkify: true, breaks: false })

const tableToneToggle: StatusTableToggle = { tone: true }
attachStatusTables(md, tableToneToggle)

let extras: Promise<void> | null = null

// Optional-peer plugins: only load if the host installed them, so a consumer
// who doesn't need footnotes/math/task-lists doesn't pay for them.
async function ensureExtras() {
  if (extras) return extras
  extras = (async () => {
    await Promise.allSettled([
      import('markdown-it-footnote').then((m) => md.use(m.default)),
      import('markdown-it-task-lists').then((m) => md.use(m.default, { enabled: true })),
      import('markdown-it-deflist').then((m) => md.use(m.default)),
      import('markdown-it-mathjax3').then((m) => md.use(m.default)),
    ])
  })()
  return extras
}

// Obsidian-style callouts -- `> [!type] Title` blockquotes become a styled
// callout div. Ported as-is from claude-web/app/utils/md.ts.
function findBlockquoteClose(tokens: any[], openIdx: number): number {
  let depth = 0
  for (let i = openIdx; i < tokens.length; i++) {
    if (tokens[i].type === 'blockquote_open') depth++
    else if (tokens[i].type === 'blockquote_close') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

md.core.ruler.push('mdchart_callout', (state) => {
  const tokens = state.tokens
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type !== 'blockquote_open') continue
    const openIdx = i
    const paraOpenIdx = i + 1
    if (tokens[paraOpenIdx]?.type !== 'paragraph_open') continue
    const inlineIdx = paraOpenIdx + 1
    const inlineTok = tokens[inlineIdx]
    if (!inlineTok || inlineTok.type !== 'inline') continue

    const lines = inlineTok.content.split('\n')
    const m = /^\[!([\w-]+)\][+-]?\s*(.*)$/.exec(lines[0])
    if (!m) continue
    const [, rawType, titleText] = m
    const type = rawType.toLowerCase()
    const closeIdx = findBlockquoteClose(tokens, openIdx)
    if (closeIdx === -1) continue

    tokens[openIdx].tag = 'div'
    tokens[openIdx].attrSet('class', `mdchart-callout mdchart-callout-${type}`)
    tokens[openIdx].attrSet('data-callout', type)
    tokens[closeIdx].tag = 'div'

    tokens[paraOpenIdx].tag = 'div'
    tokens[paraOpenIdx].attrSet('class', 'mdchart-callout-title')
    const paraCloseIdx = inlineIdx + 1
    if (tokens[paraCloseIdx]?.type === 'paragraph_close') tokens[paraCloseIdx].tag = 'div'

    const title = titleText.trim() || type.charAt(0).toUpperCase() + type.slice(1)
    inlineTok.content = title
    inlineTok.children = md.parseInline(title, state.env)[0].children

    const restLines = lines.slice(1)
    if (restLines.some((l) => l.trim() !== '')) {
      const bodyContent = restLines.join('\n')
      const bodyInline = new state.Token('inline', '', 0)
      bodyInline.content = bodyContent
      bodyInline.children = md.parseInline(bodyContent, state.env)[0].children
      bodyInline.level = inlineTok.level

      const bodyOpen = new state.Token('paragraph_open', 'div', 1)
      bodyOpen.attrSet('class', 'mdchart-callout-content')
      bodyOpen.level = tokens[paraOpenIdx].level
      const bodyClose = new state.Token('paragraph_close', 'div', -1)
      bodyClose.level = tokens[paraOpenIdx].level

      tokens.splice(paraCloseIdx + 1, 0, bodyOpen, bodyInline, bodyClose)
    }
  }
})

const defaultFence = md.renderer.rules.fence!.bind(md.renderer.rules)
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const info = token.info.trim()
  if (info === 'mermaid') {
    return `<pre class="mermaid">${md.utils.escapeHtml(token.content)}</pre>`
  }
  if (info === 'chart') {
    // Body is escaped, inert text at this point -- parsed as strict JSON at
    // mount time (chart.ts), never evaluated. See table.ts/theme.ts for why
    // that matters with AI-generated input.
    return `<div class="mdchart-chart" data-chart="${md.utils.escapeHtml(token.content)}"></div>`
  }
  if (info === 'statcard') {
    return `<div class="mdchart-statcards" data-statcards="${md.utils.escapeHtml(token.content)}"></div>`
  }
  return defaultFence(tokens, idx, options, env, self)
}

let shikiReady: Promise<void> | null = null
function ensureShiki() {
  if (shikiReady) return shikiReady
  shikiReady = Promise.allSettled([
    import('@shikijs/markdown-it'),
  ]).then(([shikiResult]) => {
    if (shikiResult.status !== 'fulfilled') return
    return shikiResult.value
      .default({
        themes: { light: 'github-light-default', dark: 'github-dark-default' },
        langs: ['typescript', 'javascript', 'json', 'bash', 'python', 'yaml', 'markdown', 'html', 'css'],
      })
      .then((plugin: any) => md.use(plugin))
  }).then(() => undefined)
  return shikiReady
}

let extended = false

export async function renderMarkdown(source: string, options: MdChartOptions = {}): Promise<string> {
  tableToneToggle.tone = options.tableTone !== false
  await Promise.all([ensureShiki(), ensureExtras()])
  if (options.extend && !extended) {
    options.extend(md)
    extended = true
  }
  return md.render(source)
}

export { md as markdownIt }
