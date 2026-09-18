# mdchart — every supported chart type

One example of each `series[].type` mdchart supports, exercising the CI
palette (categorical color, sequential ramps, axis/text colors) and the
built-in annotation primitives (`markLine`/`markPoint`/`markArea`) across
every type. See `PROMPT.md` for the full authoring contract.

## Core cartesian: line + bar (mixed, with markLine/markPoint/markArea)

```chart
{
  "legend": {},
  "tooltip": { "trigger": "axis" },
  "xAxis": { "type": "category", "data": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] },
  "yAxis": { "type": "value" },
  "series": [
    {
      "name": "Revenue", "type": "bar",
      "data": [32000, 34500, 33100, 36800, 38200, 41100, 43900, 46200, 47800, 51200, 49800, 55200],
      "markPoint": { "data": [{ "type": "max", "name": "peak" }, { "type": "min", "name": "low" }] }
    },
    {
      "name": "Target", "type": "line",
      "data": [33000, 33000, 34000, 34000, 36000, 39000, 41000, 43000, 45000, 47000, 49000, 51000],
      "lineStyle": { "type": "dashed" },
      "markLine": { "symbol": "none", "data": [{ "type": "average", "name": "avg" }] },
      "markArea": { "data": [[{ "xAxis": "Jul" }, { "xAxis": "Sep" }]] }
    }
  ]
}
```

## Pie / donut

```chart
{
  "tooltip": {},
  "series": [{
    "type": "pie",
    "radius": ["45%", "70%"],
    "data": [
      { "name": "Direct", "value": 4200 },
      { "name": "Organic search", "value": 3100 },
      { "name": "Paid ads", "value": 2400 },
      { "name": "Referral", "value": 1100 },
      { "name": "Email", "value": 900 }
    ]
  }]
}
```

## Scatter (bubble via symbolSize)

```chart
{
  "tooltip": {},
  "xAxis": { "type": "value", "name": "price (€)" },
  "yAxis": { "type": "value", "name": "units sold" },
  "visualMap": { "dimension": 2, "min": 5, "max": 40, "show": false, "inRange": { "symbolSize": [8, 40] } },
  "series": [{
    "type": "scatter",
    "data": [[19, 320, 12], [29, 210, 22], [39, 140, 8], [15, 480, 30], [59, 60, 40], [9, 610, 15], [49, 95, 18]]
  }]
}
```

## Radar

```chart
{
  "legend": {},
  "radar": {
    "indicator": [
      { "name": "Revenue", "max": 100 }, { "name": "Return rate", "max": 100 },
      { "name": "NPS", "max": 100 }, { "name": "Fulfillment speed", "max": 100 }, { "name": "Repeat rate", "max": 100 }
    ]
  },
  "series": [{
    "type": "radar",
    "data": [
      { "name": "Northwind", "value": [90, 60, 82, 75, 70] },
      { "name": "Acme", "value": [65, 80, 60, 88, 55] },
      { "name": "Fabrikam", "value": [55, 45, 70, 62, 80] }
    ]
  }]
}
```

## Boxplot

```chart
{
  "xAxis": { "type": "category", "data": ["New", "Returning", "VIP", "Wholesale"] },
  "yAxis": { "type": "value", "name": "€" },
  "series": [{
    "type": "boxplot",
    "data": [[18, 24, 30, 42, 65], [22, 34, 48, 60, 90], [55, 80, 120, 160, 240], [80, 140, 210, 300, 420]]
  }]
}
```

## Candlestick

```chart
{
  "xAxis": { "type": "category", "data": ["Jul 1", "Jul 2", "Jul 3", "Jul 4", "Jul 5", "Jul 8", "Jul 9"] },
  "yAxis": { "type": "value", "scale": true },
  "series": [{
    "type": "candlestick",
    "data": [
      [12.4, 12.9, 12.0, 13.1], [12.9, 13.2, 12.6, 13.4], [13.2, 12.7, 12.5, 13.3],
      [12.7, 12.5, 12.1, 12.9], [12.5, 12.8, 12.3, 13.0], [12.8, 13.6, 12.7, 13.7], [13.6, 13.4, 13.0, 13.9]
    ]
  }]
}
```

## Heatmap

```chart
{
  "tooltip": {},
  "xAxis": { "type": "category", "data": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
  "yAxis": { "type": "category", "data": ["6am", "9am", "12pm", "3pm", "6pm", "9pm"] },
  "series": [{
    "type": "heatmap",
    "data": [
      [0,0,5],[0,1,20],[0,2,35],[0,3,28],[0,4,42],[0,5,18],
      [1,0,6],[1,1,22],[1,2,38],[1,3,30],[1,4,45],[1,5,20],
      [2,0,7],[2,1,25],[2,2,41],[2,3,33],[2,4,48],[2,5,22],
      [3,0,8],[3,1,26],[3,2,40],[3,3,34],[3,4,50],[3,5,24],
      [4,0,10],[4,1,30],[4,2,44],[4,3,38],[4,4,60],[4,5,32],
      [5,0,14],[5,1,34],[5,2,36],[5,3,40],[5,4,55],[5,5,45],
      [6,0,12],[6,1,28],[6,2,24],[6,3,32],[6,4,40],[6,5,38]
    ]
  }]
}
```

## Treemap

```chart
{
  "series": [{
    "type": "treemap",
    "data": [
      { "name": "Apparel", "children": [{ "name": "Jacket", "value": 12400 }, { "name": "Boots", "value": 8100 }, { "name": "Scarf", "value": 2200 }] },
      { "name": "Home", "children": [{ "name": "Lamp", "value": 6200 }, { "name": "Rug", "value": 4100 }] },
      { "name": "Electronics", "children": [{ "name": "Headphones", "value": 15800 }, { "name": "Charger", "value": 3300 }] }
    ]
  }]
}
```

## Sunburst

```chart
{
  "series": [{
    "type": "sunburst",
    "radius": [0, "90%"],
    "data": [
      { "name": "Apparel", "children": [{ "name": "Jacket", "value": 12400 }, { "name": "Boots", "value": 8100 }] },
      { "name": "Home", "children": [{ "name": "Lamp", "value": 6200 }, { "name": "Rug", "value": 4100 }] },
      { "name": "Electronics", "children": [{ "name": "Headphones", "value": 15800 }] }
    ]
  }]
}
```

## Funnel

```chart
{
  "tooltip": {},
  "series": [{
    "type": "funnel",
    "left": "10%", "width": "80%",
    "data": [
      { "name": "Viewed", "value": 18400 }, { "name": "Added to cart", "value": 6200 },
      { "name": "Checkout started", "value": 3100 }, { "name": "Paid", "value": 2480 }
    ]
  }]
}
```

## Sankey

```chart
{
  "series": [{
    "type": "sankey",
    "data": [
      { "name": "Organic" }, { "name": "Paid ads" }, { "name": "Email" },
      { "name": "Northwind" }, { "name": "Acme" },
      { "name": "Apparel" }, { "name": "Home" }, { "name": "Electronics" }
    ],
    "links": [
      { "source": "Organic", "target": "Northwind", "value": 4200 },
      { "source": "Paid ads", "target": "Northwind", "value": 2100 },
      { "source": "Email", "target": "Acme", "value": 900 },
      { "source": "Organic", "target": "Acme", "value": 3100 },
      { "source": "Northwind", "target": "Apparel", "value": 3800 },
      { "source": "Northwind", "target": "Home", "value": 2500 },
      { "source": "Acme", "target": "Electronics", "value": 3100 }
    ]
  }]
}
```

## Graph (force-directed network)

```chart
{
  "series": [{
    "type": "graph",
    "layout": "force",
    "roam": true,
    "force": { "repulsion": 120, "edgeLength": 60 },
    "data": [
      { "name": "Jacket", "value": 40, "symbolSize": 40 },
      { "name": "Boots", "value": 32, "symbolSize": 32 },
      { "name": "Scarf", "value": 18, "symbolSize": 18 },
      { "name": "Gloves", "value": 16, "symbolSize": 16 },
      { "name": "Beanie", "value": 14, "symbolSize": 14 },
      { "name": "Backpack", "value": 22, "symbolSize": 22 }
    ],
    "links": [
      { "source": "Jacket", "target": "Boots" }, { "source": "Jacket", "target": "Scarf" },
      { "source": "Jacket", "target": "Gloves" }, { "source": "Boots", "target": "Backpack" },
      { "source": "Scarf", "target": "Beanie" }, { "source": "Gloves", "target": "Beanie" }
    ]
  }]
}
```

## Tree (hierarchical breakdown)

```chart
{
  "series": [{
    "type": "tree",
    "left": "10%", "right": "20%",
    "symbolSize": 8,
    "data": [{
      "name": "All shops",
      "children": [
        { "name": "Northwind", "children": [{ "name": "Apparel" }, { "name": "Home" }] },
        { "name": "Acme", "children": [{ "name": "Electronics" }] },
        { "name": "Fabrikam", "children": [{ "name": "Apparel" }, { "name": "Electronics" }] }
      ]
    }]
  }]
}
```

## Parallel coordinates

```chart
{
  "parallelAxis": [
    { "dim": 0, "name": "Revenue" }, { "dim": 1, "name": "Return rate" },
    { "dim": 2, "name": "NPS" }, { "dim": 3, "name": "Fulfillment speed" }
  ],
  "series": [{
    "type": "parallel",
    "data": [
      [90, 60, 82, 75], [65, 80, 60, 88], [55, 45, 70, 62], [80, 55, 75, 68]
    ]
  }]
}
```

## Theme river

```chart
{
  "tooltip": {},
  "singleAxis": { "type": "time" },
  "series": [{
    "type": "themeRiver",
    "data": [
      ["2025-01-01", 12, "Apparel"], ["2025-02-01", 15, "Apparel"], ["2025-03-01", 18, "Apparel"], ["2025-04-01", 14, "Apparel"],
      ["2025-01-01", 8, "Home"], ["2025-02-01", 10, "Home"], ["2025-03-01", 9, "Home"], ["2025-04-01", 12, "Home"],
      ["2025-01-01", 20, "Electronics"], ["2025-02-01", 18, "Electronics"], ["2025-03-01", 24, "Electronics"], ["2025-04-01", 28, "Electronics"]
    ]
  }]
}
```

## Gauge

```chart
{
  "series": [{
    "type": "gauge",
    "data": [{ "value": 94, "name": "On-time rate" }],
    "detail": { "formatter": "{value}%" }
  }]
}
```

## Word cloud

```chart
{
  "series": [{
    "type": "wordCloud",
    "shape": "circle",
    "sizeRange": [14, 64],
    "data": [
      { "name": "boots", "value": 80 }, { "name": "jacket", "value": 65 }, { "name": "lamp", "value": 40 },
      { "name": "headphones", "value": 55 }, { "name": "gift card", "value": 30 }, { "name": "sale", "value": 70 },
      { "name": "returns policy", "value": 20 }, { "name": "shipping", "value": 35 }, { "name": "discount", "value": 28 }
    ]
  }]
}
```

## Map (choropleth)

```chart
{
  "tooltip": {},
  "series": [{
    "type": "map",
    "map": "world",
    "roam": true,
    "data": [
      { "name": "Germany", "value": 41000 }, { "name": "France", "value": 22000 },
      { "name": "Netherlands", "value": 12000 }, { "name": "Spain", "value": 9000 },
      { "name": "United States of America", "value": 38000 }, { "name": "United Kingdom", "value": 17000 }
    ]
  }]
}
```

## Geo scatter (exact locations)

```chart
{
  "geo": { "map": "world", "roam": true },
  "tooltip": {},
  "visualMap": { "dimension": 2, "min": 260, "max": 820, "show": false, "inRange": { "symbolSize": [10, 34] } },
  "series": [{
    "type": "scatter",
    "coordinateSystem": "geo",
    "data": [
      { "name": "Rotterdam", "value": [4.48, 51.92, 820] },
      { "name": "Hamburg", "value": [9.99, 53.55, 540] },
      { "name": "New York", "value": [-74.0, 40.71, 610] },
      { "name": "Singapore", "value": [103.82, 1.35, 390] }
    ]
  }]
}
```

## Stacked area (line + areaStyle + stack)

```chart
{
  "legend": {},
  "tooltip": { "trigger": "axis" },
  "xAxis": { "type": "category", "boundaryGap": false, "data": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
  "yAxis": { "type": "value" },
  "series": [
    { "name": "Apparel", "type": "line", "stack": "total", "areaStyle": {}, "data": [420, 380, 460, 510, 600, 780, 690] },
    { "name": "Home", "type": "line", "stack": "total", "areaStyle": {}, "data": [220, 240, 210, 260, 300, 340, 310] },
    { "name": "Electronics", "type": "line", "stack": "total", "areaStyle": {}, "data": [180, 190, 230, 250, 280, 320, 290] }
  ]
}
```

## Rose (nested/polar pie)

```chart
{
  "tooltip": {},
  "series": [{
    "type": "pie",
    "radius": [30, "75%"],
    "roseType": "area",
    "data": [
      { "name": "Northwind", "value": 42 }, { "name": "Acme", "value": 27 },
      { "name": "Fabrikam", "value": 19 }, { "name": "Contoso", "value": 12 }, { "name": "Adventure Works", "value": 8 }
    ]
  }]
}
```

## Polar bar

```chart
{
  "angleAxis": { "type": "category", "data": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
  "radiusAxis": {},
  "polar": {},
  "series": [{ "type": "bar", "coordinateSystem": "polar", "data": [32, 34, 33, 37, 42, 55, 48] }]
}
```

## Pictorial bar (icon-shaped bars)

```chart
{
  "xAxis": { "type": "category", "data": ["Northwind", "Acme", "Fabrikam", "Contoso"] },
  "yAxis": { "type": "value" },
  "series": [{
    "type": "pictorialBar",
    "symbol": "roundRect",
    "symbolRepeat": true,
    "symbolSize": [18, 10],
    "symbolMargin": 2,
    "data": [21, 14, 10, 6]
  }]
}
```

## Effect scatter (animated highlight points)

```chart
{
  "geo": { "map": "world", "roam": true },
  "series": [{
    "type": "effectScatter",
    "coordinateSystem": "geo",
    "symbolSize": 14,
    "rippleEffect": { "brushType": "stroke" },
    "data": [
      { "name": "Rotterdam", "value": [4.48, 51.92] },
      { "name": "New York", "value": [-74.0, 40.71] },
      { "name": "Singapore", "value": [103.82, 1.35] }
    ]
  }]
}
```

## Lines (flight paths between two points)

```chart
{
  "geo": { "map": "world", "roam": true },
  "series": [{
    "type": "lines",
    "coordinateSystem": "geo",
    "effect": { "show": true, "period": 4, "trailLength": 0.2, "symbol": "arrow", "symbolSize": 6 },
    "lineStyle": { "width": 1.5, "curveness": 0.2 },
    "data": [
      { "coords": [[4.48, 51.92], [-74.0, 40.71]] },
      { "coords": [[4.48, 51.92], [103.82, 1.35]] },
      { "coords": [[9.99, 53.55], [103.82, 1.35]] }
    ]
  }]
}
```

## Calendar heatmap (daily values over a year)

```chart
{
  "tooltip": {},
  "visualMap": { "min": 0, "max": 1000, "show": false },
  "calendar": { "range": "2025", "cellSize": [14, 14] },
  "series": [{
    "type": "heatmap",
    "coordinateSystem": "calendar",
    "data": [
      ["2025-01-05", 320], ["2025-01-12", 480], ["2025-02-02", 610], ["2025-02-14", 900],
      ["2025-03-08", 410], ["2025-04-20", 760], ["2025-05-01", 300], ["2025-06-15", 880],
      ["2025-07-04", 950], ["2025-08-22", 500], ["2025-09-10", 640], ["2025-10-31", 720],
      ["2025-11-28", 990], ["2025-12-24", 850]
    ]
  }]
}
```

## Liquid fill gauge

```chart
{
  "series": [{
    "type": "liquidFill",
    "data": [0.72, 0.68, 0.63],
    "radius": "80%",
    "outline": { "show": false },
    "label": { "formatter": "72%" }
  }]
}
```

Not covered: ECharts' `custom` series (`renderItem`) needs a JavaScript
*function* to draw each data point — there's no JSON representation of a
function, so it can't be expressed in a fence at all without breaking the
"strict JSON, never eval'd" rule every other chart type relies on (see
`src/md.ts` and `PROMPT.md`). 3D charts (`echarts-gl`: `bar3D`, `scatter3D`,
`surface`, `globe`) aren't wired in either — a much heavier optional
dependency for a chart family that doesn't fit a text chat panel well; ask if
you want it added the same way `wordCloud`/`liquidFill` are.
