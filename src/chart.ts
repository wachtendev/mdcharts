import { ensureChartType, resolveLocalPlugins, UnknownChartTypeError } from './registry.ts'
import { resolvePalette, categoricalColor, sequentialScale, readableTextOn, type BrandPalette } from './theme.ts'

const VALUE_COLORED_TYPES = new Set(['treemap', 'matrix', 'choropleth', 'bubbleMap'])
// These draw one shape per data point within a single dataset (slices,
// wedges, stages) -- a single flat backgroundColor makes every slice the
// same color. Bar/line/scatter/etc. are colored per *series*, not per point.
const PER_POINT_COLORED_TYPES = new Set(['pie', 'doughnut', 'polarArea', 'funnel', 'venn', 'euler'])
const WIDE_TYPES = new Set(['sankey', 'choropleth', 'bubbleMap', 'pcp'])

interface MountedChart {
  instance: any
  configHash: string
  resizeObserver?: ResizeObserver
}

const mounted = new WeakMap<HTMLElement, MountedChart>()

function hashString(s: string): string {
  // ponytail: not cryptographic, just cheap change-detection for the
  // "don't rebuild an unchanged chart mid-stream" check.
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return h.toString(36)
}

function collectPluginKeys(config: any): string[] {
  return Object.keys(config?.options?.plugins ?? {})
}

function applyStrictBrandColors(config: any, palette: BrandPalette) {
  const datasets: any[] = config?.data?.datasets ?? []
  const valueColored = VALUE_COLORED_TYPES.has(config.type)

  if (valueColored) {
    // Colored by value, not by series -- backgroundColor becomes a function
    // over the data point's value using a sequential ramp.
    const ramp = sequentialScale(palette, 9)
    datasets.forEach((ds) => {
      // treemap's `data` is an empty placeholder array at config time --
      // the real per-node values live in `tree` (keyed by `ds.key`) until
      // Chart.js parses it, so computing max from `data` here always saw an
      // empty array and fell back to 1, clamping every box to one color.
      const treemapKey = config.type === 'treemap' ? ds.key || 'value' : null
      const source = treemapKey && ds.tree ? ds.tree : ds.data
      const values = (source ?? []).map((d: any) =>
        treemapKey ? +d[treemapKey] || 0 : typeof d === 'object' ? d.v ?? d.value ?? 0 : d,
      )
      const max = Math.max(1, ...values)
      ds.backgroundColor = (ctx: any) => {
        const raw = ctx.raw
        const v = typeof raw === 'object' ? raw.v ?? raw.value ?? 0 : raw
        const idx = Math.min(ramp.length - 1, Math.max(0, Math.round((v / max) * (ramp.length - 1))))
        return ramp[idx]
      }
      if (config.type === 'treemap') {
        ds.color = (ctx: any) => readableTextOn(typeof ds.backgroundColor === 'function' ? ds.backgroundColor(ctx) : ds.backgroundColor)
      }
    })
    return
  }

  if (PER_POINT_COLORED_TYPES.has(config.type)) {
    datasets.forEach((ds) => {
      const n = (ds.data ?? []).length
      ds.backgroundColor = ds.backgroundColor ?? Array.from({ length: n }, (_, i) => categoricalColor(palette, i))
    })
    return
  }

  datasets.forEach((ds, i) => {
    const color = categoricalColor(palette, i)
    ds.backgroundColor = ds.backgroundColor ?? (['line'].includes(config.type) ? color + '33' : color)
    ds.borderColor = ds.borderColor ?? color
  })
}

function applyThemeDefaults(config: any, palette: BrandPalette, container: HTMLElement) {
  config.options = config.options ?? {}
  const opts = config.options
  opts.responsive = opts.responsive ?? true
  // Chart.js's animated first frame renders via a separate async Animator
  // loop, not synchronously during update() -- and chartjs-plugin-annotation
  // has a real, reproducible bug there: its own per-chart state isn't ready
  // yet when that first frame's draw() fires, throwing
  // "Cannot read properties of undefined (reading 'visibleElements')" (see
  // chartjs/chartjs-plugin-annotation#909, a similar resize-triggered
  // variant of the same root cause). Disabling animation makes draw() run
  // synchronously inside update() instead, sidestepping the whole timing
  // window. A reporting dashboard doesn't need charts to animate in anyway.
  opts.animation = opts.animation ?? false
  opts.maintainAspectRatio = false
  opts.color = opts.color ?? palette.text

  opts.plugins = opts.plugins ?? {}
  opts.plugins.legend = opts.plugins.legend ?? {}
  opts.plugins.legend.labels = opts.plugins.legend.labels ?? {}
  opts.plugins.legend.labels.color = opts.plugins.legend.labels.color ?? palette.text

  // A single dataset with no `label` still gets a legend entry from Chart.js
  // -- reading literally "undefined", since that's dataset.label's value.
  // Most single-series chart types (boxplot, candlestick, treemap, venn,
  // graph, matrix) have no real use for a legend anyway; hide it rather than
  // show a nonsense entry.
  const datasets = config.data?.datasets ?? []
  if (datasets.length === 1 && !datasets[0].label && opts.plugins.legend.display === undefined) {
    opts.plugins.legend.display = false
  }
  if (container.clientWidth > 0 && container.clientWidth < 520 && !opts.plugins.legend.position) {
    opts.plugins.legend.position = 'bottom'
  }

  for (const scaleKey of Object.keys(opts.scales ?? {})) {
    const scale = opts.scales[scaleKey]
    scale.grid = scale.grid ?? {}
    scale.grid.color = scale.grid.color ?? palette.grid
    scale.ticks = scale.ticks ?? {}
    scale.ticks.color = scale.ticks.color ?? palette.text
    if (container.clientWidth > 0 && container.clientWidth < 480) {
      scale.ticks.autoSkip = scale.ticks.autoSkip ?? true
      scale.ticks.maxRotation = scale.ticks.maxRotation ?? 45
    }
  }
}

function renderPlaceholder(container: HTMLElement, message: string, tone: 'loading' | 'error' = 'loading') {
  container.innerHTML = `<div class="mdchart-placeholder mdchart-placeholder-${tone}">${message}</div>`
}

/**
 * Finds every `.mdchart-chart[data-chart]` under `root` and mounts/updates a
 * Chart.js instance for it. Safe to call repeatedly on the same root during
 * a streaming render: invalid/partial JSON is expected (message still
 * typing) and renders a quiet placeholder rather than throwing, unchanged
 * configs are skipped, and changed configs destroy the previous instance
 * before creating a new one.
 */
export async function mountCharts(root: ParentNode): Promise<void> {
  const containers = root.querySelectorAll<HTMLElement>('.mdchart-chart')
  await Promise.all(Array.from(containers).map(mountOne))
}

async function mountOne(container: HTMLElement) {
  const raw = container.dataset.chart ?? ''
  const hash = hashString(raw)
  const existing = mounted.get(container)
  if (existing && existing.configHash === hash) return // unchanged, skip (avoids mid-stream flicker)

  let config: any
  try {
    config = JSON.parse(raw)
    if (!config || typeof config !== 'object' || !config.type || !config.data) {
      throw new Error('missing type/data')
    }
  } catch {
    // Expected while the assistant is still streaming a fence -- not an error.
    renderPlaceholder(container, 'Chart loading…')
    return
  }

  let canvas = container.querySelector('canvas') as HTMLCanvasElement | null
  if (!canvas) {
    container.innerHTML = ''
    canvas = document.createElement('canvas')
    container.appendChild(canvas)
  }

  try {
    if (config.type === 'choropleth' || config.type === 'bubbleMap') {
      const { resolveGeoFeatures } = await import('./geo.ts')
      await resolveGeoFeatures(config)
    }
    if (config.type === 'venn' || config.type === 'euler') {
      // The library reads each data point's `.value` (for the on-circle size
      // label and its layout math) -- our schema documents `.size` as the
      // friendlier public field name, so map it across.
      for (const ds of config.data?.datasets ?? []) {
        for (const point of ds.data ?? []) {
          if (point && point.value === undefined && point.size !== undefined) point.value = point.size
        }
      }
    }
    if ((config.type === 'venn' || config.type === 'euler') && !config.data?.labels) {
      // The set-name text drawn on each circle reads from the chart's
      // top-level data.labels, not from each data point -- without it every
      // circle is labeled "undefined". Derive the set names in first-seen
      // order from the data itself so the fence format never needs to
      // repeat them separately.
      const seen: string[] = []
      for (const ds of config.data?.datasets ?? []) {
        for (const point of ds.data ?? []) {
          for (const setName of point?.sets ?? []) {
            if (!seen.includes(setName)) seen.push(setName)
          }
        }
      }
      config.data = config.data ?? {}
      config.data.labels = seen
    }
    if (config.type === 'matrix') {
      // chartjs-chart-matrix's own quickstart uses numeric x/y with explicit
      // linear scale bounds -- category-string coordinates like weekday
      // names or hour labels (the natural shape for "orders by day x hour")
      // need real category scales, which nothing sets up by default.
      const points = (config.data?.datasets ?? []).flatMap((ds: any) => ds.data ?? [])
      const xIsString = points.some((p: any) => typeof p?.x === 'string')
      const yIsString = points.some((p: any) => typeof p?.y === 'string')
      if (xIsString || yIsString) {
        config.options = config.options ?? {}
        config.options.scales = config.options.scales ?? {}
        const uniqueInOrder = (values: any[]) => Array.from(new Set(values))
        if (xIsString && !config.options.scales.x) {
          config.options.scales.x = { type: 'category', labels: uniqueInOrder(points.map((p: any) => p.x)), offset: true }
        }
        if (yIsString && !config.options.scales.y) {
          config.options.scales.y = { type: 'category', labels: uniqueInOrder(points.map((p: any) => p.y)), offset: true }
        }
      }
    }
    if (config.type === 'candlestick' || config.type === 'ohlc') {
      // chartjs-chart-financial sets `parsing: false` on its controllers, so
      // Chart.js's normal scale.parse() step (which would convert a date
      // string via the time adapter) never runs -- the raw `x` value goes
      // straight to pixel positioning. Convert date strings to epoch ms
      // ourselves so the fence format can stay a plain ISO date string.
      for (const ds of config.data?.datasets ?? []) {
        for (const point of ds.data ?? []) {
          if (point && typeof point.x === 'string') point.x = new Date(point.x).getTime()
        }
      }
    }
    const requestedPluginKeys = collectPluginKeys(config)
    const [Chart, localPlugins] = await Promise.all([
      ensureChartType(config.type, requestedPluginKeys),
      resolveLocalPlugins(requestedPluginKeys),
    ])
    // Real plugin objects (annotation, datalabels, zoom, gradient, dragData)
    // go in config.plugins -- LOCAL to this chart instance only, never
    // through Chart.register(), so they can never run against a chart that
    // didn't ask for them. See registry.ts's LOCAL_PLUGIN_LOADERS for why
    // that matters (a real chartjs-plugin-annotation bug, #909 and variants,
    // throws when its hooks run against a chart it wasn't set up for).
    if (localPlugins.length) config.plugins = [...(config.plugins ?? []), ...localPlugins]

    const palette = resolvePalette(container)
    const strictBrand = config.options?.mdchartStrictBrand !== false
    if (strictBrand) applyStrictBrandColors(config, palette)
    applyThemeDefaults(config, palette, container)

    if (WIDE_TYPES.has(config.type)) {
      container.classList.add('mdchart-wide')
    }

    existing?.instance?.destroy()
    existing?.resizeObserver?.disconnect()

    const instance = new (Chart as any)(canvas, config)

    let resizeObserver: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      // ResizeObserver fires once immediately on observe(), reporting the
      // current size even though nothing has changed yet -- Chart.js has
      // already sized itself correctly at construction, and calling
      // resize() again this early races some plugins' own init lifecycle.
      // Skip that first, redundant callback.
      let firstCallback = true
      resizeObserver = new ResizeObserver(() => {
        if (firstCallback) { firstCallback = false; return }
        try {
          instance.resize()
        } catch (err) {
          // chartjs-plugin-annotation has a real, reproducible bug where a
          // resize can land while its own per-chart state isn't ready and
          // throw (chartjs/chartjs-plugin-annotation#909) -- and because
          // Chart.js runs every chart's update/draw through one shared
          // loop, an uncaught throw here can silently break *other*,
          // unrelated charts on the page too, not just this one. There's no
          // fix on our end for the plugin's own bug; contain the blast
          // radius instead of letting it cascade.
          console.error('mdchart: chart resize failed (continuing, other charts are unaffected):', err)
        }
      })
      resizeObserver.observe(container)
    }

    mounted.set(container, { instance, configHash: hash, resizeObserver })
  } catch (err) {
    existing?.instance?.destroy()
    existing?.resizeObserver?.disconnect()
    mounted.delete(container)
    const msg = err instanceof UnknownChartTypeError ? err.message : `Chart failed to render: ${(err as Error).message}`
    renderPlaceholder(container, msg, 'error')
  }
}

/** Destroys every chart instance mounted under `root`. Call before discarding the DOM subtree wholesale (e.g. before a `v-html` replace) to avoid leaking canvases. */
export function unmountCharts(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('.mdchart-chart').forEach((container) => {
    const entry = mounted.get(container)
    entry?.instance?.destroy()
    entry?.resizeObserver?.disconnect()
    mounted.delete(container)
  })
}
