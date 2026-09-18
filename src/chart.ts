import { loadEcharts, ensureSeriesExtensions } from './registry.ts'
import { ensureWorldMap } from './geo.ts'
import { resolvePalette, categoricalColor, sequentialScale, type BrandPalette } from './theme.ts'

// Types that read visually best with more horizontal room than the panel's
// default column width -- sankey/graph/tree node labels, parallel-coordinate
// axes, and a world map all crowd badly in a narrow column.
const WIDE_TYPES = new Set(['sankey', 'graph', 'tree', 'treemap', 'parallel', 'map', 'themeRiver'])
// Types colored by a continuous value (a heat/choropleth ramp) rather than by
// series or category -- these get a visualMap-driven sequential ramp instead
// of the flat categorical palette every other type gets.
const VALUE_COLORED_TYPES = new Set(['heatmap', 'map'])

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

// A timeline chart (`{baseOption, timeline, options}`) carries its series
// inside `baseOption`, not at the top level -- resolve to whichever object
// actually holds `series` so type detection and palette application see it.
function themeTarget(option: any): any {
  return option?.baseOption ?? option
}

function seriesTypes(option: any): string[] {
  option = themeTarget(option)
  const series = Array.isArray(option.series) ? option.series : option.series ? [option.series] : []
  return series.map((s: any) => s?.type).filter(Boolean)
}

function seriesValues(option: any): number[] {
  option = themeTarget(option)
  const series = Array.isArray(option.series) ? option.series : option.series ? [option.series] : []
  const values: number[] = []
  for (const s of series) {
    for (const d of s?.data ?? []) {
      const v = typeof d === 'number' ? d : Array.isArray(d) ? d[d.length - 1] : d?.value
      if (typeof v === 'number' && Number.isFinite(v)) values.push(v)
    }
  }
  return values
}

/**
 * Fills in CI-derived color where the AI's own option left it unset --
 * mirrors the fence contract everywhere else: the AI omits colors and gets
 * the host's brand for free, but an explicit value it did provide always
 * wins. `mdchartStrictBrand: false` opts a chart out of this entirely,
 * falling back to ECharts' own built-in palette instead.
 */
function applyPalette(rawOption: any, palette: BrandPalette, types: string[]) {
  const option = themeTarget(rawOption)
  const isValueColored = types.some((t) => VALUE_COLORED_TYPES.has(t))

  if (isValueColored && !option.visualMap) {
    const values = seriesValues(option)
    const min = values.length ? Math.min(...values) : 0
    const max = values.length ? Math.max(...values) : 1
    option.visualMap = {
      min,
      max: max > min ? max : min + 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      textStyle: { color: palette.text },
      inRange: { color: sequentialScale(palette, 7) },
    }
  }

  if (!option.color) {
    const n = Math.max(
      8,
      ...(Array.isArray(option.series) ? option.series : option.series ? [option.series] : []).map(
        (s: any) => s?.data?.length ?? 0,
      ),
    )
    option.color = Array.from({ length: n }, (_, i) => categoricalColor(palette, i))
  }

  option.textStyle = { color: palette.text, ...option.textStyle }
  option.backgroundColor = option.backgroundColor ?? 'transparent'

  // liquidFill ignores the top-level `color` array every other series reads
  // -- it needs its own `series.color`.
  if (types.includes('liquidFill')) {
    const series = Array.isArray(option.series) ? option.series : [option.series]
    series.forEach((s: any) => {
      if (s.type === 'liquidFill' && !s.color) s.color = [categoricalColor(palette, 0)]
    })
  }

  if (option.legend) option.legend = { textStyle: { color: palette.text }, ...option.legend }
  if (option.title) {
    const titles = Array.isArray(option.title) ? option.title : [option.title]
    titles.forEach((t: any) => {
      t.textStyle = { color: palette.text, ...t.textStyle }
      t.subtextStyle = { color: palette.text, ...t.subtextStyle }
    })
  }

  for (const axisKey of ['xAxis', 'yAxis', 'radiusAxis', 'angleAxis'] as const) {
    const axes = option[axisKey]
    if (!axes) continue
    const list = Array.isArray(axes) ? axes : [axes]
    list.forEach((axis: any) => {
      axis.axisLine = { lineStyle: { color: palette.grid }, ...axis.axisLine }
      axis.axisLabel = { color: palette.text, ...axis.axisLabel }
      axis.splitLine = { lineStyle: { color: palette.grid }, ...axis.splitLine }
    })
  }
}

function renderPlaceholder(container: HTMLElement, message: string, tone: 'loading' | 'error' = 'loading') {
  container.innerHTML = `<div class="mdchart-placeholder mdchart-placeholder-${tone}">${message}</div>`
}

/**
 * Finds every `.mdchart-chart[data-chart]` under `root` and mounts/updates an
 * ECharts instance for it. Safe to call repeatedly on the same root during a
 * streaming render: invalid/partial JSON is expected (message still typing)
 * and renders a quiet placeholder rather than throwing, unchanged configs are
 * skipped, and changed configs dispose the previous instance before creating
 * a new one.
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

  let option: any
  try {
    option = JSON.parse(raw)
    if (!option || typeof option !== 'object' || !themeTarget(option).series) {
      throw new Error('missing series')
    }
  } catch {
    // Expected while the assistant is still streaming a fence -- not an error.
    renderPlaceholder(container, 'Chart loading…')
    return
  }

  let mount = container.querySelector<HTMLDivElement>('.mdchart-chart-mount')
  if (!mount) {
    container.innerHTML = ''
    mount = document.createElement('div')
    mount.className = 'mdchart-chart-mount'
    mount.style.cssText = 'width:100%;height:100%'
    container.appendChild(mount)
  }

  try {
    const types = seriesTypes(option)
    const echarts = await loadEcharts()
    await ensureSeriesExtensions(types)
    const target = themeTarget(option)
    if (types.includes('map') || target.geo) {
      await ensureWorldMap(echarts)
      const series = Array.isArray(target.series) ? target.series : [target.series]
      series.forEach((s: any) => { if (s.type === 'map') s.map = s.map ?? 'world' })
      if (target.geo) target.geo.map = target.geo.map ?? 'world'
    }

    const palette = resolvePalette(container)
    const strictBrand = option.mdchartStrictBrand !== false
    delete option.mdchartStrictBrand
    if (strictBrand) applyPalette(option, palette, types)

    if (types.some((t) => WIDE_TYPES.has(t))) {
      container.classList.add('mdchart-wide')
    }

    existing?.instance?.dispose()
    existing?.resizeObserver?.disconnect()

    const instance = echarts.init(mount, null, { renderer: 'canvas' })
    instance.setOption(option)

    let resizeObserver: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => instance.resize())
      resizeObserver.observe(container)
    }

    mounted.set(container, { instance, configHash: hash, resizeObserver })
  } catch (err) {
    existing?.instance?.dispose()
    existing?.resizeObserver?.disconnect()
    mounted.delete(container)
    renderPlaceholder(container, `Chart failed to render: ${(err as Error).message}`, 'error')
  }
}

/** Destroys every chart instance mounted under `root`. Call before discarding the DOM subtree wholesale (e.g. before a `v-html` replace) to avoid leaking canvases. */
export function unmountCharts(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('.mdchart-chart').forEach((container) => {
    const entry = mounted.get(container)
    entry?.instance?.dispose()
    entry?.resizeObserver?.disconnect()
    mounted.delete(container)
  })
}
