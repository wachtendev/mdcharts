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

```chart
{ "type": "funnel", "data": { "labels": ["Viewed", "Added to cart", "Checkout started", "Paid"], "datasets": [{ "data": [18400, 6200, 3100, 2480] }] } }
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
