export { renderMarkdown, markdownIt, type MdChartOptions } from './md.ts'
export { extractExtendedInfo, type ExtractedMessage } from './extract.ts'
export { mountCharts, unmountCharts } from './chart.ts'
export { mountStatCards, type StatCardSpec } from './statcard.ts'
export { ensureChartType, registerAll, UnknownChartTypeError } from './registry.ts'
export { setBrandPalette, categoricalColor, sequentialScale, divergingScale, contrastRatio, readableTextOn, type BrandPalette } from './theme.ts'
export { MdChartView, defineMdChartView } from './element.ts'
export { MdDetailPanel, defineMdDetailPanel } from './panel.ts'

import { defineMdChartView } from './element.ts'
import { defineMdDetailPanel } from './panel.ts'

/** Registers both custom elements. Call once at app startup. */
export function defineMdChart() {
  defineMdChartView()
  defineMdDetailPanel()
}
