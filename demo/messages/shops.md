Northwind leads on revenue and NPS; Acme has the best fulfillment speed but a higher return rate.
<extended-info-md>
# Shop performance

```chart
{
  "legend": {},
  "radar": {
    "indicator": [
      { "name": "Revenue", "max": 100 },
      { "name": "Return rate", "max": 100 },
      { "name": "NPS", "max": 100 },
      { "name": "Fulfillment speed", "max": 100 },
      { "name": "Repeat rate", "max": 100 }
    ]
  },
  "series": [{
    "type": "radar",
    "data": [
      { "name": "Northwind", "value": [90, 60, 82, 75, 70] },
      { "name": "Acme", "value": [65, 80, 60, 88, 55] }
    ]
  }]
}
```

## Catalog revenue by category and SKU

```chart
{
  "series": [{
    "type": "treemap",
    "data": [
      { "name": "Apparel", "children": [
        { "name": "Jacket", "value": 12400 },
        { "name": "Boots", "value": 8100 }
      ] },
      { "name": "Home", "children": [{ "name": "Lamp", "value": 6200 }] },
      { "name": "Electronics", "children": [{ "name": "Headphones", "value": 15800 }] }
    ]
  }]
}
```

## Traffic → shop → category flow

```chart
{
  "series": [{
    "type": "sankey",
    "data": [
      { "name": "Organic" }, { "name": "Paid ads" }, { "name": "Northwind" }, { "name": "Acme" },
      { "name": "Apparel" }, { "name": "Home" }, { "name": "Electronics" }
    ],
    "links": [
      { "source": "Organic", "target": "Northwind", "value": 4200 },
      { "source": "Paid ads", "target": "Northwind", "value": 2100 },
      { "source": "Organic", "target": "Acme", "value": 3100 },
      { "source": "Northwind", "target": "Apparel", "value": 3800 },
      { "source": "Northwind", "target": "Home", "value": 2500 },
      { "source": "Acme", "target": "Electronics", "value": 3100 }
    ]
  }]
}
```
</extended-info-md>
