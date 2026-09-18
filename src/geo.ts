// Choropleth/bubbleMap need real country geometry to draw anything --
// chartjs-chart-geo intentionally ships no map data of its own (see its
// README). Without this, a `feature` value has to be a full GeoJSON Feature
// object, which no AI is going to hand-write. This resolves a plain country
// *name* string against a bundled world atlas instead, so the fence stays as
// cheap to emit as every other chart type: `{ "feature": "Germany", ... }`.

interface WorldAtlas {
  countries: any[]
  outline: any
}

let worldPromise: Promise<WorldAtlas> | null = null

async function importWorldTopology(): Promise<{ default: any }> {
  // Bundlers (Vite/webpack/Rollup) resolve a bare JSON import with no
  // ceremony; a spec-compliant ESM runtime (plain Node 20+) requires an
  // import attribute for it. Try the plain form first since that's every
  // real consumer of this library, fall back for the rare bare-Node case.
  try {
    return (await import('world-atlas/countries-110m.json')) as { default: any }
  } catch {
    return (await import(/* @vite-ignore */ 'world-atlas/countries-110m.json', { with: { type: 'json' } } as any)) as { default: any }
  }
}

function loadWorldAtlas(): Promise<WorldAtlas> {
  if (!worldPromise) {
    worldPromise = Promise.all([
      importWorldTopology(),
      import('chartjs-chart-geo') as Promise<any>,
    ]).then(([{ default: topology }, geoMod]) => {
      const countries = geoMod.topojson.feature(topology, topology.objects.countries).features
      const landFeatures = geoMod.topojson.feature(topology, topology.objects.land).features
      const outline = landFeatures[0] ?? { type: 'Sphere' }
      return { countries, outline }
    })
  }
  return worldPromise
}

function findCountry(countries: any[], name: string): any | null {
  const norm = (s: string) => s.toLowerCase().trim()
  const target = norm(name)
  return countries.find((f) => norm(f.properties?.name ?? '') === target) ?? null
}

/**
 * Mutates a choropleth/bubbleMap config in place: resolves any string
 * `feature` values (choropleth) against the bundled world atlas, and fills
 * in a default `outline` (a world land mass) so bubbles/regions render on a
 * recognizable base map instead of a blank canvas. Leaves anything the
 * caller already set (a real GeoJSON feature, a custom outline) untouched.
 */
export async function resolveGeoFeatures(config: any): Promise<void> {
  const { countries, outline } = await loadWorldAtlas()
  const datasets: any[] = config?.data?.datasets ?? []

  // chartjs-chart-geo defaults to 'albersUsa' -- a projection defined only
  // for the continental US, which maps every other country's coordinates
  // off-canvas (or to nothing) rather than merely distorting them. A world
  // projection is the only sane default for a chart type an AI can point at
  // any country.
  config.options = config.options ?? {}
  config.options.scales = config.options.scales ?? {}
  // Chart.js 4.5.x's scale-merge step calls determineAxis() on our supplied
  // partial scale config before merging in the controller's own overrides
  // (which normally supply axis/type for this key) -- a plain
  // `{ projection: '...' }` throws there. Supply axis/type explicitly
  // ourselves rather than depend on that merge order.
  config.options.scales.projection = {
    axis: 'x',
    type: 'projection',
    projection: 'naturalEarth1',
    ...config.options.scales.projection,
  }

  datasets.forEach((ds) => {
    if (ds.outline === undefined) ds.outline = outline

    if (config.type === 'choropleth') {
      ds.data = (ds.data ?? []).map((d: any) => {
        if (d && typeof d.feature === 'string') {
          const resolved = findCountry(countries, d.feature)
          return resolved ? { ...d, feature: resolved } : d
        }
        return d
      })
    }
  })
}
