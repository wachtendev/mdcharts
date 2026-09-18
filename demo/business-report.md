# Business status — last 30 days

Revenue is ahead of target for the third straight month, driven by the
Northwind and Acme shops. Two things need attention: the EU checkout funnel
has a wider cart-abandon gap than usual, and three high-value orders are
stuck in a failed payment state.

## Revenue vs. target

```chart
{
  "type": "line",
  "data": {
    "labels": ["Apr", "May", "Jun", "Jul", "Aug", "Sep"],
    "datasets": [
      { "label": "Actual", "data": [38200, 41100, 43900, 46200, 47800, 51200] },
      { "label": "Target", "data": [39000, 41000, 43000, 45000, 47000, 49000], "borderDash": [6, 4] }
    ]
  },
  "options": {
    "plugins": {
      "annotation": {
        "annotations": {
          "target-line": { "type": "line", "yMin": 49000, "yMax": 49000, "borderDash": [4, 4], "label": { "display": true, "content": "Q3 target" } }
        }
      }
    }
  }
}
```

## Orders vs. returns per week

```chart
{
  "type": "bar",
  "data": {
    "labels": ["W1", "W2", "W3", "W4"],
    "datasets": [
      { "label": "Orders", "data": [312, 340, 298, 355] },
      { "label": "Returns", "data": [18, 22, 15, 24] }
    ]
  }
}
```

## Revenue share by shop

```chart
{ "type": "doughnut", "data": { "labels": ["Northwind", "Acme", "Fabrikam", "Contoso"], "datasets": [{ "data": [42, 27, 19, 12] }] } }
```

## Checkout funnel

```chart
{ "type": "funnel", "data": { "labels": ["Viewed", "Added to cart", "Checkout started", "Paid"], "datasets": [{ "data": [18400, 6200, 3100, 2480] }] } }
```

## Traffic → shop → category flow

```chart
{
  "type": "sankey",
  "data": {
    "datasets": [{
      "data": [
        { "from": "Organic", "to": "Northwind", "flow": 4200 },
        { "from": "Paid ads", "to": "Northwind", "flow": 2100 },
        { "from": "Organic", "to": "Acme", "flow": 3100 },
        { "from": "Northwind", "to": "Apparel", "flow": 3800 },
        { "from": "Northwind", "to": "Home", "flow": 2500 },
        { "from": "Acme", "to": "Electronics", "flow": 3100 }
      ]
    }]
  }
}
```

## Catalog revenue by category and SKU

```chart
{
  "type": "treemap",
  "data": {
    "datasets": [{
      "tree": [
        { "category": "Apparel", "sku": "Jacket", "value": 12400 },
        { "category": "Apparel", "sku": "Boots", "value": 8100 },
        { "category": "Home", "sku": "Lamp", "value": 6200 },
        { "category": "Electronics", "sku": "Headphones", "value": 15800 }
      ],
      "key": "value",
      "groups": ["category", "sku"],
      "data": []
    }]
  }
}
```

## Order volume by weekday × hour

```chart
{
  "type": "matrix",
  "data": {
    "datasets": [{
      "data": [
        { "x": "Mon", "y": "9-12", "v": 22 }, { "x": "Mon", "y": "12-15", "v": 35 }, { "x": "Mon", "y": "15-18", "v": 41 },
        { "x": "Tue", "y": "9-12", "v": 28 }, { "x": "Tue", "y": "12-15", "v": 30 }, { "x": "Tue", "y": "15-18", "v": 44 },
        { "x": "Sat", "y": "9-12", "v": 60 }, { "x": "Sat", "y": "12-15", "v": 71 }, { "x": "Sat", "y": "15-18", "v": 52 }
      ],
      "width": 24,
      "height": 24
    }]
  }
}
```

## Top search terms across shops

```chart
{ "type": "wordCloud", "data": { "labels": ["boots", "jacket", "lamp", "headphones", "gift card", "sale", "returns policy"], "datasets": [{ "data": [80, 65, 40, 55, 30, 70, 20] }] } }
```

## Basket size distribution by segment

```chart
{
  "type": "boxplot",
  "data": {
    "labels": ["New", "Returning", "VIP"],
    "datasets": [{ "data": [[18, 24, 30, 42, 65], [22, 34, 48, 60, 90], [55, 80, 120, 160, 240]] }]
  }
}
```

## Price vs. units sold per SKU

```chart
{
  "type": "bubble",
  "data": {
    "datasets": [{
      "label": "SKUs",
      "data": [
        { "x": 29, "y": 420, "r": 8 }, { "x": 59, "y": 210, "r": 12 },
        { "x": 89, "y": 130, "r": 6 }, { "x": 149, "y": 60, "r": 14 }
      ]
    }]
  }
}
```

## Sales by country

```chart
{
  "type": "choropleth",
  "data": {
    "labels": ["Germany", "France", "Netherlands", "Spain"],
    "datasets": [{ "outline": [], "data": [
      { "feature": "Germany", "value": 41000 },
      { "feature": "France", "value": 22000 },
      { "feature": "Netherlands", "value": 12000 },
      { "feature": "Spain", "value": 9000 }
    ] }]
  }
}
```

## Related-product recommendation graph

```chart
{
  "type": "graph",
  "data": {
    "labels": ["Boots", "Jacket", "Socks", "Scarf"],
    "datasets": [{
      "data": [{}, {}, {}, {}],
      "edges": [{ "source": 0, "target": 1 }, { "source": 0, "target": 2 }, { "source": 1, "target": 3 }]
    }]
  }
}
```

## Customer segment overlap

```chart
{
  "type": "venn",
  "data": {
    "datasets": [{ "data": [
      { "sets": ["Newsletter"], "size": 4200 },
      { "sets": ["VIP"], "size": 1100 },
      { "sets": ["Newsletter", "VIP"], "size": 480 }
    ] }]
  }
}
```

## Supplier price history

```chart
{
  "type": "candlestick",
  "data": {
    "datasets": [{ "data": [
      { "x": "2025-07-01", "o": 12.4, "h": 13.1, "l": 12.0, "c": 12.9 },
      { "x": "2025-07-02", "o": 12.9, "h": 13.4, "l": 12.6, "c": 13.2 },
      { "x": "2025-07-03", "o": 13.2, "h": 13.3, "l": 12.5, "c": 12.7 }
    ] }]
  }
}
```

## Delivery time ± variance per carrier

```chart
{
  "type": "barWithErrorBars",
  "data": {
    "labels": ["CarrierA", "CarrierB", "CarrierC"],
    "datasets": [{ "label": "Days", "data": [
      { "y": 2.4, "yMin": 1.8, "yMax": 3.1 },
      { "y": 3.1, "yMin": 2.2, "yMax": 4.4 },
      { "y": 1.9, "yMin": 1.5, "yMax": 2.6 }
    ] }]
  }
}
```

## Shop performance comparison

```chart
{
  "type": "radar",
  "data": {
    "labels": ["Revenue", "Return rate", "NPS", "Fulfillment speed", "Repeat rate"],
    "datasets": [
      { "label": "Northwind", "data": [90, 60, 82, 75, 70] },
      { "label": "Acme", "data": [65, 80, 60, 88, 55] }
    ]
  }
}
```

## Open orders

| Order | Shop | Customer | Total | Status |
|---|---|---|---|---|
| #4821 | Northwind | J. Ortiz | €128.00 | paid |
| #4822 | Northwind | M. Weber | €64.50 | pending |
| #4823 | Acme | S. Novak | €212.00 | failed |
| #4824 | Fabrikam | L. Dubois | €41.20 | processing |
| #4825 | Acme | R. Haas | €340.00 | failed |
| #4826 | Contoso | T. Berg | €18.90 | delivered |

## Per-shop progress vs. last month

| Shop | Revenue | Orders | Δ Revenue |
|---|---|---|---|
| Northwind | €21,504 | 412 | +8.1% |
| Acme | €13,824 | 260 | +2.4% |
| Fabrikam | €9,728 | 190 | -3.2% |
| Contoso | €6,144 | 128 | +11.6% |

> [!warning] Three orders need attention
> #4823, #4825, and #4829 all failed on the same card issuer in the last hour.
> Worth checking with the payment provider before it grows.
