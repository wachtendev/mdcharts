import { renderMarkdown, type MdChartOptions } from './md.ts'
import { mountCharts, unmountCharts } from './chart.ts'
import { mountStatCards } from './statcard.ts'
import { setBrandPalette, type BrandPalette } from './theme.ts'

/**
 * <md-chart-view source="# hi\n```chart\n{...}\n```"></md-chart-view>
 *
 * Light DOM by default: Shiki/MathJax/mermaid all inject styles into
 * <head> and would be inert inside a shadow root, and a host admin app
 * wants this to inherit its page theme via CSS custom properties (see
 * theme.ts) rather than be isolated from it.
 */
export class MdChartView extends HTMLElement {
  static get observedAttributes() {
    return ['src', 'theme']
  }

  private _source = ''
  private renderToken = 0

  get source(): string { return this._source }
  set source(value: string) {
    this._source = value
    this.scheduleRender()
  }

  get options(): MdChartOptions { return this._options }
  set options(value: MdChartOptions) { this._options = value; this.scheduleRender() }
  private _options: MdChartOptions = {}

  connectedCallback() {
    this.classList.add('mdchart-root')
    if (this.hasAttribute('src')) this.loadFromSrc(this.getAttribute('src')!)
    this.applyTheme()
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue) return
    if (name === 'src' && newValue) this.loadFromSrc(newValue)
    if (name === 'theme') this.applyTheme()
  }

  disconnectedCallback() {
    unmountCharts(this)
  }

  setBrand(palette: Partial<BrandPalette>) {
    setBrandPalette(palette)
    this.scheduleRender()
  }

  private applyTheme() {
    const theme = this.getAttribute('theme')
    if (theme) this.setAttribute('data-theme', theme)
  }

  private async loadFromSrc(url: string) {
    const res = await fetch(url)
    this.source = await res.text()
  }

  private scheduleRender() {
    const token = ++this.renderToken
    renderMarkdown(this._source, this._options).then((html) => {
      if (token !== this.renderToken || !this.isConnected) return
      // Dispose the previous render's ECharts instances before discarding
      // their containers -- innerHTML replace alone orphans them, and an
      // orphaned instance keeps its resize listener and animation frames
      // alive with nowhere to draw.
      unmountCharts(this)
      this.innerHTML = html
      mountStatCards(this)
      mountCharts(this)
    })
  }
}

export function defineMdChartView(tagName = 'md-chart-view') {
  if (!customElements.get(tagName)) customElements.define(tagName, MdChartView)
}
