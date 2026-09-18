// A `map` series (choropleth) or `geo` component needs a registered GeoJSON
// map under the name it references -- ECharts ships no map data of its own.
// Resolves a bundled world atlas once and registers it as `"world"`, so the
// fence stays as cheap to emit as any other chart type: a plain country name
// string in `series[].data[].name`, e.g. `{"name": "Germany", "value": 42}`.

let registered: Promise<void> | null = null

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

/** Registers the bundled world map as `"world"` on this echarts instance. Safe to call repeatedly. */
export function ensureWorldMap(echarts: any): Promise<void> {
  if (!registered) {
    registered = Promise.all([importWorldTopology(), import('topojson-client')]).then(
      ([{ default: topology }, topojsonMod]) => {
        const features = (topojsonMod as any).feature(topology, topology.objects.countries).features
        echarts.registerMap('world', { type: 'FeatureCollection', features } as any)
      },
    )
  }
  return registered
}
