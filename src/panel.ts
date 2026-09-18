import { MdChartView, defineMdChartView } from './element.ts'
import { resizeChartsForPrint } from './chart.ts'

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
    // including real selectable text and vector-quality chart canvases.
    // Scope the "hide everything else" rule to only while this is open
    // (see styles.css) rather than a blanket @media print, so a host page
    // printing itself some other way is never affected by this component.
    downloadBtn.addEventListener('click', () => {
      document.body.classList.add('mdchart-printing')
      // Force the print layout to settle, then resize charts to it, before
      // calling print() -- see resizeChartsForPrint's comment for why.
      this.view.offsetHeight
      resizeChartsForPrint(this.view)
      window.print()
    })
    window.addEventListener('afterprint', () => document.body.classList.remove('mdchart-printing'))

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
