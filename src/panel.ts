import { MdChartView, defineMdChartView } from './element.ts'

/**
 * <md-detail-panel><md-chart-view></md-chart-view></md-detail-panel>
 *
 * An overlay that reads as the docked chat extending to its left, not as
 * something covering it: its right edge sits flush against
 * `--mdchart-panel-dock-width` (set by the host to the chat column's width;
 * 0 with no docked chat), margined off the other three edges. The chat stays
 * fully visible and interactive while this is open -- give it a z-index
 * above the backdrop's (55) so the dim layer only darkens the page behind
 * both. Below ~640px viewport width this becomes a full-screen sheet
 * instead (dock width collapses to 0 there too).
 */
export class MdDetailPanel extends HTMLElement {
  private view!: MdChartView
  private backdrop!: HTMLDivElement
  private lastFocused: HTMLElement | null = null

  connectedCallback() {
    defineMdChartView()
    this.setAttribute('role', 'dialog')
    this.setAttribute('aria-modal', 'true')
    this.classList.add('mdchart-panel')

    this.backdrop = document.createElement('div')
    this.backdrop.className = 'mdchart-panel-backdrop'
    this.backdrop.addEventListener('click', () => this.close())

    const closeBtn = document.createElement('button')
    closeBtn.className = 'mdchart-panel-close'
    closeBtn.type = 'button'
    closeBtn.setAttribute('aria-label', 'Close')
    closeBtn.innerHTML = '&times;'
    closeBtn.addEventListener('click', () => this.close())

    const downloadBtn = document.createElement('button')
    downloadBtn.className = 'mdchart-panel-download'
    downloadBtn.type = 'button'
    downloadBtn.setAttribute('aria-label', 'Download as PDF')
    downloadBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>'
    // The browser's own print dialog, not a bundled PDF library: every
    // browser's "Save as PDF" destination already does this correctly,
    // including real selectable text and vector-quality output. Printed in
    // an isolated iframe carrying only mdchart's own CSS rules and a
    // rasterized snapshot of the panel -- this host embeds the chat on
    // multiple different pages, each with its own stylesheet, and printing
    // the live document (even with everything else hidden) means whatever
    // that host's CSS does to a `@media print` reflow -- its own print
    // rules, its own cascade -- can leak into the export. An isolated
    // document sidesteps that instead of trying to out-specificity it.
    downloadBtn.addEventListener('click', () => this.printPanel())

    if (!this.querySelector('md-chart-view')) {
      this.view = document.createElement('md-chart-view') as MdChartView
      this.appendChild(this.view)
    } else {
      this.view = this.querySelector('md-chart-view') as MdChartView
    }

    this.prepend(downloadBtn, closeBtn)
    document.body.appendChild(this.backdrop)

    this.addEventListener('keydown', this.onKeydown)
  }

  disconnectedCallback() {
    this.backdrop?.remove()
    this.removeEventListener('keydown', this.onKeydown)
  }

  get source(): string { return this.view.source }
  set source(value: string) { this.view.source = value }

  open(opener?: HTMLElement) {
    this.lastFocused = opener ?? (document.activeElement as HTMLElement)
    this.setAttribute('open', '')
    this.backdrop.setAttribute('open', '')
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => this.focus())
  }

  close() {
    this.removeAttribute('open')
    this.backdrop.removeAttribute('open')
    document.body.style.overflow = ''
    this.lastFocused?.focus()
  }

  /**
   * Prints only the panel's own content, isolated from the host page: a
   * hidden iframe gets a standalone document containing just mdchart's own
   * CSS rules (pulled live from the host's stylesheets/CSSOM, filtered to
   * ones that actually target mdchart classes) plus the CI custom
   * properties resolved off this panel, and a clone of the panel where
   * every <canvas> is replaced by a rasterized <img> -- innerHTML/cloneNode
   * never carries a canvas's drawn pixels, and the clone lives outside the
   * document Chart.js is managing anyway.
   */
  private printPanel() {
    const clone = this.view.cloneNode(true) as HTMLElement
    const liveCanvases = this.view.querySelectorAll('canvas')
    const cloneCanvases = clone.querySelectorAll('canvas')
    liveCanvases.forEach((live, i) => {
      const img = document.createElement('img')
      img.src = live.toDataURL('image/png')
      img.style.cssText = 'width:100%;height:100%;display:block'
      cloneCanvases[i].replaceWith(img)
    })

    let mdchartRules = ''
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList
      try {
        rules = sheet.cssRules
      } catch {
        continue // cross-origin stylesheet, inaccessible -- can't be ours
      }
      for (const rule of Array.from(rules)) {
        if (rule.cssText.includes('mdchart')) mdchartRules += rule.cssText + '\n'
      }
    }

    const computed = getComputedStyle(this.view)
    let brandVars = ':root{'
    for (const prop of Array.from(computed)) {
      if (prop.startsWith('--mdchart')) brandVars += `${prop}:${computed.getPropertyValue(prop)};`
    }
    brandVars += '}'

    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:0;height:0;border:0'
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument!
    doc.open()
    doc.write(
      `<!doctype html><html><head><meta charset="utf-8">` +
        `<style>${brandVars}\n${mdchartRules}\nhtml,body{margin:0;background:var(--mdchart-surface,#fff)}` +
        `.mdchart-panel{position:static!important;inset:auto!important;transform:none!important;` +
        `opacity:1!important;box-shadow:none!important;border-radius:0!important;width:auto!important;height:auto!important}` +
        `.mdchart-panel-close,.mdchart-panel-download{display:none!important}` +
        `.mdchart-panel md-chart-view{overflow:visible!important;height:auto!important;padding:1.5rem}` +
        `.mdchart-chart{height:280px!important;break-inside:avoid}</style>` +
        `</head><body class="mdchart-root"><div class="mdchart-panel" open>${clone.outerHTML}</div></body></html>`,
    )
    doc.close()

    iframe.onload = () => {
      iframe.contentWindow!.focus()
      iframe.contentWindow!.print()
      setTimeout(() => iframe.remove(), 1000)
    }
  }

  private onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { this.close(); return }
    if (e.key === 'Tab') this.trapFocus(e)
  }

  private trapFocus(e: KeyboardEvent) {
    const focusables = this.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    if (!focusables.length) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault() }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault() }
  }
}

export function defineMdDetailPanel(tagName = 'md-detail-panel') {
  if (!customElements.get(tagName)) customElements.define(tagName, MdDetailPanel)
}
