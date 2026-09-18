4,200 newsletter subscribers, 480 of whom are also VIP — search traffic is mostly boots and jackets right now.
<extended-info-md>
# Users & search

```chart
{ "type": "wordCloud", "data": { "labels": ["boots", "jacket", "lamp", "headphones", "gift card", "sale", "returns policy"], "datasets": [{ "data": [80, 65, 40, 55, 30, 70, 20] }] } }
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
</extended-info-md>
