Revenue is up **8.1%** this month and ahead of target — Northwind is carrying most of the growth.
<extended-info-md>
# Revenue — last 30 days

```statcard
[
  { "label": "Revenue (MTD)", "value": "€51,200", "delta": "+8.1%" },
  { "label": "Orders", "value": 1205, "delta": "+4.3%" },
  { "label": "Avg. order value", "value": "€42.50", "delta": "+0.4%" },
  { "label": "Payments failed", "value": 3, "tone": "danger" }
]
```

::: card Revenue vs. target
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
:::

::: card Revenue share by shop
```chart
{ "type": "doughnut", "data": { "labels": ["Northwind", "Acme", "Fabrikam", "Contoso"], "datasets": [{ "data": [42, 27, 19, 12] }] } }
```
:::

## Per-shop progress vs. last month

| Shop | Revenue | Orders | Δ Revenue |
|---|---|---|---|
| Northwind | €21,504 | 412 | +8.1% |
| Acme | €13,824 | 260 | +2.4% |
| Fabrikam | €9,728 | 190 | -3.2% |
| Contoso | €6,144 | 128 | +11.6% |
</extended-info-md>
