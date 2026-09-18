// ECharts ships every native chart type (line, bar, pie, scatter, radar,
// boxplot, candlestick, heatmap, treemap, sunburst, graph, sankey, funnel,
// gauge, parallel, tree, themeRiver, pictorialBar, map, custom, ...) in one
// package with no per-type registration step -- unlike Chart.js's
// core+extension-per-package model, there's no registry to build here. The
// only things that still need lazy setup are the couple of series types
// that live in a separate optional package and self-register into this same
// echarts instance on import (word clouds, liquid-fill gauges), and the
// world map GeoJSON a `map`/`geo` series needs (see geo.ts).

let echartsPromise: Promise<any> | null = null

/** Resolves the consumer's own `echarts` peer install. Never bundles echarts itself. */
export function loadEcharts(): Promise<any> {
  if (!echartsPromise) echartsPromise = import('echarts')
  return echartsPromise
}

const extensionLoaded = new Set<string>()

/** Series types that need an optional peer package loaded before use, keyed by `series[].type`. */
const SERIES_EXTENSIONS: Record<string, () => Promise<any>> = {
  wordCloud: () => import('echarts-wordcloud'),
  liquidFill: () => import('echarts-liquidfill'),
}

/** Loads whichever optional series-type extensions `seriesTypes` actually needs. Idempotent. */
export async function ensureSeriesExtensions(seriesTypes: string[]): Promise<void> {
  await loadEcharts()
  await Promise.all(
    seriesTypes
      .filter((t) => t in SERIES_EXTENSIONS && !extensionLoaded.has(t))
      .map(async (t) => {
        await SERIES_EXTENSIONS[t]()
        extensionLoaded.add(t)
      }),
  )
}
