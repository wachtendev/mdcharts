Northwind leads on revenue and NPS; Acme has the best fulfillment speed but a higher return rate.
<extended-info-md>
# Shop performance

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
</extended-info-md>
