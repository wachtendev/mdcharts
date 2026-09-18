4,200 newsletter subscribers, 480 of whom are also VIP — search traffic is mostly boots and jackets right now.
<extended-info-md>
# Users & search

```chart
{
  "series": [{
    "type": "wordCloud",
    "shape": "circle",
    "sizeRange": [14, 60],
    "data": [
      { "name": "boots", "value": 80 },
      { "name": "jacket", "value": 65 },
      { "name": "lamp", "value": 40 },
      { "name": "headphones", "value": 55 },
      { "name": "gift card", "value": 30 },
      { "name": "sale", "value": 70 },
      { "name": "returns policy", "value": 20 }
    ]
  }]
}
```

## Customer segment overlap

```chart
{
  "xAxis": { "type": "category", "data": ["Newsletter", "VIP", "Both"] },
  "yAxis": { "type": "value" },
  "series": [{ "type": "bar", "data": [4200, 1100, 480] }]
}
```

## Basket size distribution by segment

```chart
{
  "xAxis": { "type": "category", "data": ["New", "Returning", "VIP"] },
  "yAxis": { "type": "value" },
  "series": [{ "type": "boxplot", "data": [[18, 24, 30, 42, 65], [22, 34, 48, 60, 90], [55, 80, 120, 160, 240]] }]
}
```
</extended-info-md>
