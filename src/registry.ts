import type { Chart as ChartJS } from 'chart.js'

type Registrar = () => Promise<void>

// ponytail: one entry per package, not per type -- multiple `type` values can
// share a loader (e.g. graph/tree/dendrogram all come from chartjs-chart-graph).
const TYPE_LOADERS: Record<string, Registrar> = {
  sankey: async () => {
    const { SankeyController, Flow } = await import('chartjs-chart-sankey')
    getChart().register(SankeyController, Flow)
  },
  treemap: async () => {
    const { TreemapController, TreemapElement } = await import('chartjs-chart-treemap')
    getChart().register(TreemapController, TreemapElement)
  },
  matrix: async () => {
    const { MatrixController, MatrixElement } = await import('chartjs-chart-matrix')
    getChart().register(MatrixController, MatrixElement)
  },
  wordCloud: async () => {
    const { WordCloudController, WordElement } = await import('chartjs-chart-wordcloud')
    getChart().register(WordCloudController, WordElement)
  },
  funnel: async () => {
    const { FunnelController, TrapezoidElement } = await import('chartjs-chart-funnel')
    getChart().register(FunnelController, TrapezoidElement)
  },
  venn: async () => {
    const mod = await import('chartjs-chart-venn')
    getChart().register(mod.VennDiagramController, mod.ArcSlice)
  },
  euler: async () => {
    const mod = await import('chartjs-chart-venn')
    getChart().register(mod.EulerDiagramController, mod.ArcSlice)
  },
  // Each graph variant is its own controller in this package (not one shared
  // "graph" controller with a mode flag) -- they all share the EdgeLine element.
  graph: async () => {
    const mod = await import('chartjs-chart-graph')
    getChart().register(mod.GraphController, mod.EdgeLine)
  },
  forceDirectedGraph: async () => {
    const mod = await import('chartjs-chart-graph')
    getChart().register(mod.ForceDirectedGraphController, mod.EdgeLine)
  },
  dendrogram: async () => {
    const mod = await import('chartjs-chart-graph')
    getChart().register(mod.DendrogramController, mod.EdgeLine)
  },
  tree: async () => {
    const mod = await import('chartjs-chart-graph')
    getChart().register(mod.TreeController, mod.EdgeLine)
  },
  choropleth: async () => {
    const mod = await import('chartjs-chart-geo')
    getChart().register(mod.ChoroplethController, mod.GeoFeature, mod.ColorScale, mod.ProjectionScale)
  },
  bubbleMap: async () => {
    const mod = await import('chartjs-chart-geo')
    getChart().register(mod.BubbleMapController, mod.GeoFeature, mod.SizeScale, mod.ProjectionScale)
  },
  boxplot: async () => {
    const mod = await import('@sgratzl/chartjs-chart-boxplot')
    getChart().register(mod.BoxPlotController, mod.BoxAndWiskers)
  },
  violin: async () => {
    const mod = await import('@sgratzl/chartjs-chart-boxplot')
    getChart().register(mod.ViolinController, mod.Violin)
  },
  candlestick: async () => {
    // financial charts default to a 'time' x-scale, which throws without a
    // date adapter registered -- side-effect import only, nothing to pass to register().
    await import('chartjs-adapter-date-fns')
    const mod = await import('chartjs-chart-financial')
    getChart().register(mod.CandlestickController, mod.CandlestickElement)
  },
  ohlc: async () => {
    await import('chartjs-adapter-date-fns')
    const mod = await import('chartjs-chart-financial')
    getChart().register(mod.OhlcController, mod.OhlcElement)
  },
  pcp: async () => {
    const mod = await import('chartjs-chart-pcp')
    // Generic register() only files LinearAxis under scales (it extends
    // LinearScale) even though the controller also needs it as an element
    // for datasetElementType -- match the package's own test setup, which
    // registers these granularly rather than through the auto-detecting
    // register() helper.
    const Chart = getChart()
    Chart.registry.addControllers(mod.ParallelCoordinatesController)
    Chart.registry.addElements(mod.LineSegment, mod.LinearAxis)
    Chart.registry.addScales(mod.PCPScale)
  },
  barWithErrorBars: async () => {
    const mod = await import('chartjs-chart-error-bars')
    getChart().register(mod.BarWithErrorBarsController, mod.BarWithErrorBar)
  },
  lineWithErrorBars: async () => {
    const mod = await import('chartjs-chart-error-bars')
    getChart().register(mod.LineWithErrorBarsController, mod.PointWithErrorBar)
  },
  scatterWithErrorBars: async () => {
    const mod = await import('chartjs-chart-error-bars')
    getChart().register(mod.ScatterWithErrorBarsController, mod.PointWithErrorBar)
  },
}

// Real Chart.js plugin OBJECTS (they export lifecycle hooks -- beforeUpdate,
// afterDraw, event handlers) get resolved here and passed into a chart's own
// `config.plugins` array (see resolveLocalPlugins/chart.ts), never through
// `Chart.register()`. A globally-registered plugin's hooks fire on *every*
// chart on the page, not just the ones that opted in via
// `options.plugins.<key>` -- chartjs-plugin-annotation in particular throws
// when its hooks run against a chart whose own per-chart state was never
// initialized (see chartjs/chartjs-plugin-annotation#909 and its resize/
// mouse-event variants), so a chart using it would corrupt every *other*
// chart on the page too. Local registration makes that structurally
// impossible instead of trying to opt back out per chart.
const LOCAL_PLUGIN_LOADERS: Record<string, () => Promise<any>> = {
  datalabels: async () => (await import('chartjs-plugin-datalabels')).default,
  annotation: async () => (await import('chartjs-plugin-annotation')).default,
  zoom: async () => (await import('chartjs-plugin-zoom')).default,
  gradient: async () => (await import('chartjs-plugin-gradient')).default,
  dragData: async () => (await import('chartjs-plugin-dragdata')).default,
}

// These two are opt-in by their own design already -- trendline only
// activates per-dataset (`dataset.trendlineLinear`), hierarchical is a scale
// *type* a chart must explicitly request (`scales.x.type: 'hierarchical'`) --
// so the usual global-registration side effects are safe for them.
const SIDE_EFFECT_PLUGIN_LOADERS: Record<string, Registrar> = {
  trendlineLinear: async () => { await import('chartjs-plugin-trendline') },
  hierarchical: async () => { await import('chartjs-plugin-hierarchical') },
}

let chartModPromise: Promise<typeof ChartJS> | null = null
let chartMod: any = null

// The consumer's own `chart.js` peer install is what gets loaded here --
// this module never bundles Chart.js itself.
async function loadChart() {
  if (!chartModPromise) {
    chartModPromise = import('chart.js').then((m) => {
      chartMod = m
      m.Chart.register(...m.registerables)
      return m.Chart
    })
  }
  return chartModPromise
}

function getChart(): { register: (...args: any[]) => void; registry: any } {
  if (!chartMod) throw new Error('mdchart: call ensureChartType()/registerAll() (which awaits Chart.js) before using getChart()')
  return chartMod.Chart
}

const registered = new Set<string>()

export class UnknownChartTypeError extends Error {
  constructor(type: string) {
    super(`mdchart: unknown chart type "${type}" -- not a core Chart.js type or a registered chartjs/awesome extension. See schemas/chart.schema.json for the supported list.`)
    this.name = 'UnknownChartTypeError'
  }
}

/** Resolves the chart.js peer and registers whatever `type` + plugin keys this config needs. Idempotent. */
export async function ensureChartType(type: string, pluginKeys: string[] = []): Promise<typeof ChartJS> {
  const Chart = await loadChart()

  const isCore = ['bar', 'line', 'pie', 'doughnut', 'radar', 'polarArea', 'scatter', 'bubble'].includes(type)
  if (!isCore) {
    const loader = TYPE_LOADERS[type]
    if (!loader) throw new UnknownChartTypeError(type)
    if (!registered.has(type)) {
      await loader()
      registered.add(type)
    }
  }

  for (const key of pluginKeys) {
    const loader = SIDE_EFFECT_PLUGIN_LOADERS[key]
    if (loader && !registered.has(`plugin:${key}`)) {
      await loader()
      registered.add(`plugin:${key}`)
    }
  }

  return Chart
}

const localPluginCache = new Map<string, Promise<any>>()

/**
 * Resolves the given plugin keys to actual plugin objects for a chart's own
 * `config.plugins` array -- never through `Chart.register()`. See
 * LOCAL_PLUGIN_LOADERS above for why: local registration only affects the
 * one chart that asked for it, structurally, rather than needing every other
 * chart to opt back out.
 */
export async function resolveLocalPlugins(pluginKeys: string[]): Promise<any[]> {
  const resolved = await Promise.all(
    pluginKeys
      .filter((key) => key in LOCAL_PLUGIN_LOADERS)
      .map((key) => {
        if (!localPluginCache.has(key)) localPluginCache.set(key, LOCAL_PLUGIN_LOADERS[key]())
        return localPluginCache.get(key)!
      }),
  )
  return resolved.filter(Boolean)
}

/** Escape hatch: eager-load every known extension type and plugin. */
export async function registerAll(): Promise<void> {
  await loadChart()
  await Promise.all([
    ...Object.keys(TYPE_LOADERS).map((t) => ensureChartType(t)),
    ...Object.keys(SIDE_EFFECT_PLUGIN_LOADERS).map((k) => ensureChartType('bar', [k])),
    resolveLocalPlugins(Object.keys(LOCAL_PLUGIN_LOADERS)),
  ])
}
