# Writing mdchart documents

You are writing a markdown document that will be rendered with charts and
status tables. Use plain markdown for everything else. Two things behave
specially, plus one convention for chat replies:

## Chat replies with a detail report — `<extended-info-md>`

When replying in the chat widget, keep your visible reply short — one or two
sentences. If there's a fuller report behind it (a breakdown, a set of
charts), put it inside an `<extended-info-md>` block at the end of the same
message. The host renders the short text as the chat bubble and the
`<extended-info-md>` content as the detail panel when the shopper/operator
clicks that message — it is never shown inline in the chat itself.

```
Revenue is up 8.1% this month, ahead of target. Three orders just failed
payment though — worth a look.
<extended-info-md>
# Revenue — last 30 days

```chart
{ "xAxis": {...}, "yAxis": {...}, "series": [{ "type": "line", "data": [...] }] }
```

| Order | Status |
|---|---|
| #4823 | failed |
</extended-info-md>
```

Only add `<extended-info-md>` when there is real detail to show — a plain
answer needs nothing extra.

## Charts — a ```chart fence with an ECharts `option`

```chart
{
  "xAxis": { "type": "category", "data": ["Jan", "Feb", "Mar"] },
  "yAxis": { "type": "value" },
  "series": [{ "name": "Revenue", "type": "bar", "data": [42100, 47800, 48250] }]
}
```

- The body is a normal [Apache ECharts](https://echarts.apache.org/en/option.html)
  `option` object — whatever you'd pass to `chart.setOption(...)`. There's no
  separate `type`/`data` wrapper: each entry in `series` carries its own
  `type`, and a chart can mix several.
- **Omit colors.** Don't set `color`, `itemStyle.color`, `textStyle.color`, or
  axis line/label colors — the renderer fills in the host's brand palette
  automatically: one color per series/category for most types, a sequential
  ramp (via `visualMap`) for value-colored types (`heatmap`, `map`). Setting a
  color yourself overrides that, so only do it when you specifically need a
  fixed color (e.g. calling out one bad month in red).
- **Omit sizing** (`width`, `height`, `grid`) — handled for you; the chart
  fills its container.
- Full JSON Schema: `schemas/chart.schema.json`.

### Supported `series[].type` values

Core: `bar`, `line`, `pie`, `scatter`, `radar`, `boxplot`, `candlestick`.

Extended (each needs a shape that differs from the norm — see the schema's
conditional branches before using one):

| type | data shape | use for |
|---|---|---|
| `heatmap` | `[xIndex, yIndex, value]` triples + category `xAxis`/`yAxis` | orders by weekday × hour |
| `treemap` | `{name, value, children}`, nested | revenue by category/SKU |
| `sunburst` | like `treemap` but radial | the same, as a ring instead of boxes |
| `funnel` | `{name, value}` | conversion funnel |
| `sankey` | top-level `data: [{name}]` + `links: [{source, target, value}]` | flow between stages (checkout funnel by step, traffic → channel → category) |
| `graph` | `data: [{name, value?}]` + `links: [{source, target}]`; add `"layout": "force"` for automatic layout, `"layout": "none"` with explicit `{x, y}` per node otherwise | recommendation networks, org charts |
| `tree` | one root `{name, children: [...]}` | hierarchical breakdowns (dendrograms) |
| `map` | `data: [{name: "Germany", value}]` — a plain country **name**, never raw GeoJSON | sales by country (choropleth) |
| `scatter` on a `geo` coordinate system (top-level `"geo": {}`) | `{name, value: [lng, lat, size]}` | sales by exact location (shipping hubs, warehouses) |
| `parallel` | top-level `parallelAxis: [{dim, name}, ...]` + `series[0].data: [[v1, v2, ...], ...]` | multi-attribute comparison |
| `themeRiver` | `[date, value, name]` triples | a metric's mix over time by category |
| `wordCloud` | `{name, value}` | top search terms |
| `gauge` | `{value, name}` | a single metric against a 0–100 (or custom) range |
| `liquidFill` | array of 0–1 fill ratios | the same, drawn as a filling container |

Not supported: `custom` (ECharts' `renderItem` API needs a JavaScript
function, which has no JSON form — incompatible with this fence's strict,
never-eval'd JSON contract) and the `echarts-gl` 3D chart family
(`bar3D`/`scatter3D`/`surface`/`globe`), not wired in by default.

### Target lines and highlights — no plugin needed

ECharts has these built into every cartesian series — set them directly on
the series, no extra setup:

- `markLine: { data: [{ yAxis: 49000, label: { formatter: "Q3 target" } }] }` — a target/threshold line.
- `markPoint: { data: [{ type: "max", name: "peak" }] }` — call out a specific point.
- `markArea: { data: [[{ xAxis: "Apr" }, { xAxis: "Jun" }]] }` — shade a range.

## A single number — a ```statcard fence

For one KPI (a value, a label, maybe a comparison), don't build a table row —
use a stat card instead:

```statcard
[
  { "label": "Revenue (MTD)", "value": "€51,200", "delta": "+8.1%" },
  { "label": "Orders", "value": 1205, "delta": "+4.3%" },
  { "label": "Payments failed", "value": 3, "tone": "danger" }
]
```

- Always an array, even for one card — they render as a row.
- `delta` colors itself green/red by its `+`/`-` sign automatically. Don't set
  `tone` alongside it.
- `tone` (`success` | `warn` | `danger`) is for a card with **no** delta that
  still needs to read as urgent — a plain alert count, not a trend.
- Full schema: `schemas/statcard.schema.json`.

## Wrapping something in a card — `::: card Title`

To give a chart (or a table, or anything else) its own bordered card with a
headline — for a report made of several distinct sections rather than one
long scroll:

```
::: card Revenue vs. target
```chart
{ "xAxis": {...}, "yAxis": {...}, "series": [{ "type": "line", "data": [...] }] }
```
:::
```

- The title is optional — `::: card` on its own still wraps the content in a
  card, just without a header row.
- Put whatever you like inside: a chart, a table, prose, more than one of
  those. It's a wrapper, not a special content type.
- Don't use this as a substitute for a `##` heading on a report with only one
  section — reach for it when you're presenting more than one distinct block
  and want each visually separated, the way the stat cards already look.

## Status tables — just write a normal markdown table

No special syntax. Two things happen automatically:

- **Numeric/currency/percent columns right-align** with tabular figures.
- **These words, in any cell, get a colored status pill:** `paid`,
  `delivered`, `shipped`, `active`, `completed` (success) · `pending`,
  `processing`, `in transit` (warn) · `failed`, `cancelled`, `refunded`,
  `inactive`, `overdue` (danger). A `+12%` / `-4%` style delta also colors
  green/red automatically. Anything else renders as plain text — don't rely on
  other words getting colored.

```markdown
| Order | Shop | Total | Status |
|---|---|---|---|
| #4821 | Northwind | €128.00 | paid |
| #4822 | Northwind | €64.50 | pending |
| #4819 | Acme | €212.00 | failed |
```

## Everything else

Standard markdown — headings, lists, bold/italic, links, code fences (syntax
highlighted), `> [!warning]` callouts, math (`$...$`), footnotes, task lists,
and ` ```mermaid ` fences for flow/sequence diagrams. Don't invent other custom
syntax — if it isn't one of the two things above, write it as plain markdown.
