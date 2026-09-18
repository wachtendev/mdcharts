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
{ "type": "line", "data": { ... } }
```

| Order | Status |
|---|---|
| #4823 | failed |
</extended-info-md>
```

Only add `<extended-info-md>` when there is real detail to show — a plain
answer needs nothing extra.

## Charts — a ```chart fence with a Chart.js config

```chart
{
  "type": "bar",
  "data": {
    "labels": ["Jan", "Feb", "Mar"],
    "datasets": [{ "label": "Revenue", "data": [42100, 47800, 48250] }]
  }
}
```

- The body is a normal [Chart.js](https://www.chartjs.org/docs/latest/) config
  object: `{ "type", "data", "options" }`. `options` is optional.
- **Omit colors.** Don't set `backgroundColor`, `borderColor`, or any
  legend/scale color — the renderer applies the host's brand palette
  automatically: one color per series for `bar`/`line`/etc., one color per
  slice for `pie`/`doughnut`/`polarArea`/`funnel`/`venn`. Setting a color
  yourself overrides that, so only do it when you specifically need a fixed
  color (e.g. calling out one bad month in red).
- **Omit sizing options** (`responsive`, `maintainAspectRatio`) — handled for you.
- Full JSON Schema: `schemas/chart.schema.json`.

### Supported `type` values

Core: `bar`, `line`, `pie`, `doughnut`, `radar`, `polarArea`, `scatter`, `bubble`.

Extended (each needs a different `data.datasets[].data` element shape — see
the schema's conditional branches before using one):

| type | data shape | use for |
|---|---|---|
| `sankey` | `{from, to, flow}` | flow between stages (checkout funnel by step, traffic → channel → category) |
| `treemap` | normal, colored by value | revenue by category/SKU |
| `matrix` | `{x, y, v}` | orders by weekday × hour |
| `wordCloud` | `labels` + numeric weights | top search terms |
| `funnel` | normal | conversion funnel |
| `venn` / `euler` | `{sets, size}` | segment overlap |
| `forceDirectedGraph` | `labels` + `edges: [{source, target}]`, no x/y needed | recommendation networks (layout is automatic — prefer this over plain `graph`) |
| `graph` / `tree` / `dendrogram` | like `forceDirectedGraph`, but `graph` needs explicit `{x, y}` per node (no auto-layout); `tree`/`dendrogram` use `parent` instead of `edges` | manually-laid-out or hierarchical node graphs |
| `choropleth` | `{feature: "Germany", value}` — a plain country **name**, never raw GeoJSON | sales by country |
| `bubbleMap` | `{longitude, latitude, value}` | sales by exact location (shipping hubs, warehouses) |
| `boxplot` / `violin` | normal | distribution (basket size) |
| `candlestick` / `ohlc` | `{x, o, h, l, c}` | price history |
| `pcp` | **one dataset per axis** (`labels` names the rows, each dataset is `{label: axisName, data: [...]}` — not one dataset of multi-key row objects) | multi-attribute comparison |
| `barWithErrorBars` etc. | `{y, yMin, yMax}` | a value with a range (delivery time ± variance) |

### Plugins

Set `options.plugins.<name>` and it loads automatically: `datalabels`,
`annotation` (target lines), `zoom`, `trendline`. Only ask for what you use.

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
{ "type": "line", "data": { ... } }
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
