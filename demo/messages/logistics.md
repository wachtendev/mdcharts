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

## Warehouse shipment volume by hub

```chart
{
  "type": "bubbleMap",
  "data": {
    "labels": ["Rotterdam", "Hamburg", "Lyon", "Milan"],
    "datasets": [{ "data": [
      { "longitude": 4.48, "latitude": 51.92, "value": 820 },
      { "longitude": 9.99, "latitude": 53.55, "value": 540 },
      { "longitude": 4.83, "latitude": 45.76, "value": 310 },
      { "longitude": 9.19, "latitude": 45.46, "value": 260 }
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
</extended-info-md>
