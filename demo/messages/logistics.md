Delivery times are holding steady across carriers, and EU sales are still concentrated in three countries.
<extended-info-md>
# Logistics & markets

```statcard
[
  { "label": "Avg. delivery time", "value": "2.4 days", "delta": "-0.3" },
  { "label": "On-time rate", "value": "94%", "delta": "+1.2%" },
  { "label": "Countries shipped to", "value": 14 }
]
```

## Sales by country

```chart
{
  "tooltip": {},
  "series": [{
    "type": "map",
    "map": "world",
    "roam": true,
    "data": [
      { "name": "Germany", "value": 41000 },
      { "name": "France", "value": 22000 },
      { "name": "Netherlands", "value": 12000 },
      { "name": "Spain", "value": 9000 }
    ]
  }]
}
```

## Warehouse shipment volume by hub

```chart
{
  "geo": { "map": "world", "roam": true },
  "tooltip": {},
  "visualMap": {
    "dimension": 2, "min": 260, "max": 820, "show": false,
    "inRange": { "symbolSize": [12, 36] }
  },
  "series": [{
    "type": "scatter",
    "coordinateSystem": "geo",
    "data": [
      { "name": "Rotterdam", "value": [4.48, 51.92, 820] },
      { "name": "Hamburg", "value": [9.99, 53.55, 540] },
      { "name": "Lyon", "value": [4.83, 45.76, 310] },
      { "name": "Milan", "value": [9.19, 45.46, 260] }
    ]
  }]
}
```

## Avg. delivery time per carrier

```chart
{
  "xAxis": { "type": "category", "data": ["CarrierA", "CarrierB", "CarrierC"] },
  "yAxis": { "type": "value", "name": "days" },
  "series": [{
    "type": "bar",
    "data": [2.4, 3.1, 1.9],
    "markLine": {
      "symbol": "none",
      "label": { "show": false },
      "data": [
        [{ "xAxis": 0, "yAxis": 1.8 }, { "xAxis": 0, "yAxis": 3.1 }],
        [{ "xAxis": 1, "yAxis": 2.2 }, { "xAxis": 1, "yAxis": 4.4 }],
        [{ "xAxis": 2, "yAxis": 1.5 }, { "xAxis": 2, "yAxis": 2.6 }]
      ]
    }
  }]
}
```

## Supplier price history

```chart
{
  "xAxis": { "type": "category", "data": ["Jul 1", "Jul 2", "Jul 3"] },
  "yAxis": { "type": "value", "scale": true },
  "series": [{
    "type": "candlestick",
    "data": [
      [12.4, 12.9, 12.0, 13.1],
      [12.9, 13.2, 12.6, 13.4],
      [13.2, 12.7, 12.5, 13.3]
    ]
  }]
}
```
</extended-info-md>
