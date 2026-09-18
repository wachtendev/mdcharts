42 orders are pending and 3 just failed payment on the same card issuer — worth a look.
<extended-info-md>
# Order pipeline

```statcard
[
  { "label": "Orders pending", "value": 42, "tone": "warn" },
  { "label": "Payments failed", "value": 3, "tone": "danger" },
  { "label": "Returns this week", "value": 24, "delta": "-3.1%" }
]
```

## Checkout funnel

```chart
{
  "series": [{
    "type": "funnel",
    "left": "10%",
    "width": "80%",
    "data": [
      { "name": "Viewed", "value": 18400 },
      { "name": "Added to cart", "value": 6200 },
      { "name": "Checkout started", "value": 3100 },
      { "name": "Paid", "value": 2480 }
    ]
  }]
}
```

## Orders vs. returns per week

```chart
{
  "xAxis": { "type": "category", "data": ["W1", "W2", "W3", "W4"] },
  "yAxis": { "type": "value" },
  "legend": {},
  "tooltip": { "trigger": "axis" },
  "series": [
    { "name": "Orders", "type": "bar", "data": [312, 340, 298, 355] },
    { "name": "Returns", "type": "bar", "data": [18, 22, 15, 24] }
  ]
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

> [!warning] Three orders need attention
> #4823, #4825, and #4829 all failed on the same card issuer in the last hour.
</extended-info-md>
