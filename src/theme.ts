// CI-derived color for every chart. Categorical series rotate through the
// brand list; sequential/diverging ramps (treemap, matrix, choropleth) are
// interpolated from it. See PROMPT.md / plan for why: colors must come from
// the host's brand, never from Chart.js defaults.

export interface BrandPalette {
  brand: string[]
  surface: string
  text: string
  grid: string
  success: string
  warn: string
  danger: string
}

// Muted, lower-chroma tones rather than saturated primaries -- reads as a
// professional reporting dashboard by default, not a marketing site. Hosts
// with their own CI still override every one of these (see resolvePalette).
const FALLBACK: BrandPalette = {
  brand: ['#4A6FA5', '#6B9080', '#B8834A', '#8E7CC3', '#4F9DA6', '#A6685C'],
  surface: '#ffffff',
  text: '#1e293b',
  grid: '#e2e8f0',
  success: '#5B8C5A',
  warn: '#B8863B',
  danger: '#B85C5C',
}

let overridePalette: Partial<BrandPalette> | null = null

/** Escape hatch for hosts holding brand config in JS rather than CSS. */
export function setBrandPalette(palette: Partial<BrandPalette>): void {
  overridePalette = palette
}

const CSS_VARS: Record<keyof BrandPalette, string | null> = {
  brand: null, // handled separately, --mdchart-brand-1..n
  surface: '--mdchart-surface',
  text: '--mdchart-text',
  grid: '--mdchart-grid',
  success: '--mdchart-success',
  warn: '--mdchart-warn',
  danger: '--mdchart-danger',
}

function readCssPalette(el: Element): Partial<BrandPalette> {
  const style = getComputedStyle(el)
  const brand: string[] = []
  for (let i = 1; i <= 24; i++) {
    const v = style.getPropertyValue(`--mdchart-brand-${i}`).trim()
    if (!v) break
    brand.push(v)
  }
  const out: Partial<BrandPalette> = {}
  if (brand.length) out.brand = brand
  for (const key of Object.keys(CSS_VARS) as (keyof BrandPalette)[]) {
    const varName = CSS_VARS[key]
    if (!varName) continue
    const v = style.getPropertyValue(varName).trim()
    if (v) (out as any)[key] = v
  }
  return out
}

export function resolvePalette(el: Element): BrandPalette {
  return { ...FALLBACK, ...readCssPalette(el), ...(overridePalette ?? {}) }
}

// --- OKLCH-based extension for categorical series beyond the brand list ---

function hexToOklch(hex: string): { l: number; c: number; h: number } {
  const [r, g, b] = hexToLinearRgb(hex)
  // linear sRGB -> OKLab (Björn Ottosson's matrices)
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
  const c = Math.sqrt(a * a + bb * bb)
  const h = (Math.atan2(bb, a) * 180) / Math.PI
  return { l: L, c, h: h < 0 ? h + 360 : h }
}

function oklchToHex(l: number, c: number, h: number): string {
  const hr = (h * Math.PI) / 180
  const a = Math.cos(hr) * c
  const bb = Math.sin(hr) * c
  const l_ = l + 0.3963377774 * a + 0.2158037573 * bb
  const m_ = l - 0.1055613458 * a - 0.0638541728 * bb
  const s_ = l - 0.0894841775 * a - 1.291485548 * bb
  const l3 = l_ ** 3, m3 = m_ ** 3, s3 = s_ ** 3
  const r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3
  const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3
  const b = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3
  return linearRgbToHex([r, g, b])
}

function hexToLinearRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  const srgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255)
  return srgb.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as [number, number, number]
}

function linearRgbToHex(rgb: number[]): string {
  const srgb = rgb.map((v) => {
    const clamped = Math.min(1, Math.max(0, v))
    return clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * clamped ** (1 / 2.4) - 0.055
  })
  const toByte = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255)
  return '#' + srgb.map((v) => toByte(v).toString(16).padStart(2, '0')).join('')
}

/** Deterministic categorical color for series index n, extending past the brand list by rotating hue in OKLCH. */
export function categoricalColor(palette: BrandPalette, n: number): string {
  if (n < palette.brand.length) return palette.brand[n]
  const base = hexToOklch(palette.brand[n % palette.brand.length])
  const cycle = Math.floor(n / palette.brand.length)
  const hueStep = 47 // irrational-ish w.r.t. 360 so repeats don't line up quickly
  const h = (base.h + cycle * hueStep) % 360
  const l = Math.min(0.9, Math.max(0.35, base.l + (cycle % 2 === 0 ? 0.06 : -0.06)))
  return oklchToHex(l, base.c, h)
}

/** Sequential ramp from surface-adjacent to full brand color, for value-colored charts (treemap/matrix/choropleth). */
export function sequentialScale(palette: BrandPalette, steps: number): string[] {
  const base = hexToOklch(palette.brand[0])
  const out: string[] = []
  for (let i = 0; i < steps; i++) {
    const t = steps === 1 ? 1 : i / (steps - 1)
    const l = 0.94 - t * (0.94 - Math.max(0.32, base.l - 0.1))
    const c = base.c * (0.15 + t * 0.85)
    out.push(oklchToHex(l, c, base.h))
  }
  return out
}

/** Diverging ramp: danger -> surface -> brand, for +/- style value charts. */
export function divergingScale(palette: BrandPalette, steps: number): string[] {
  const neg = hexToOklch(palette.danger)
  const pos = hexToOklch(palette.brand[0])
  const mid = steps % 2 === 1 ? Math.floor(steps / 2) : -1
  const out: string[] = []
  for (let i = 0; i < steps; i++) {
    if (i === mid) { out.push(oklchToHex(0.94, 0.01, pos.h)); continue }
    const half = i < steps / 2
    const base = half ? neg : pos
    const localSteps = Math.ceil(steps / 2)
    const localI = half ? i : i - Math.floor(steps / 2)
    const t = localSteps === 1 ? 1 : localI / (localSteps - 1)
    const l = half ? 0.94 - t * (0.94 - base.l) : 0.94 - (1 - t) * (0.94 - base.l)
    out.push(oklchToHex(l, base.c * (0.2 + Math.abs(half ? t : 1 - t) * 0.8), base.h))
  }
  return out
}

/** Relative luminance contrast ratio per WCAG, for verifying text-on-fill legibility (wordcloud/treemap labels). */
export function contrastRatio(fgHex: string, bgHex: string): number {
  const lum = (hex: string) => {
    const [r, g, b] = hexToLinearRgb(hex)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const l1 = lum(fgHex) + 0.05
  const l2 = lum(bgHex) + 0.05
  return l1 > l2 ? l1 / l2 : l2 / l1
}

/** Pick black or white text for legible contrast against a given fill. */
export function readableTextOn(fillHex: string): string {
  return contrastRatio('#000000', fillHex) >= contrastRatio('#ffffff', fillHex) ? '#0f172a' : '#f8fafc'
}
