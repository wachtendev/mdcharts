// Node-only test workaround: plain Node ESM resolution follows package.json
// "main" (a UMD build expecting a global `Chart`), while every real consumer
// of this library (Vite/webpack/Rollup) follows "module" and gets the proper
// ESM build. This redirects just this one specifier so the visual-check
// harness sees what a bundled app actually sees. Not used by the library.
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'chartjs-chart-financial') {
    return nextResolve('chartjs-chart-financial/dist/chartjs-chart-financial.esm.js', context)
  }
  return nextResolve(specifier, context)
}
