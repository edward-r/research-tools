# 🛠 Dataset Wrangling Scratchpad
#Dataset #CodeRecipes

## CSV → Array of Objects
```javascript
const parseCsv = (text) => {
  const [header, ...rows] = text.trim().split(/\r?\n/).map(r => r.split(','));
  return rows.map(r => Object.fromEntries(r.map((v, i) => [header[i], v])));
};
```

## JSON file → Object
```javascript
import { readFile } from 'node:fs/promises';
const obj = JSON.parse(await readFile('data.json', 'utf8'));
```

## NDJSON (newline-delimited JSON) → Array
```javascript
import { readFile } from 'node:fs/promises';
const rows = (await readFile('data.ndjson', 'utf8'))
  .trim().split(/\n+/)
  .map(line => JSON.parse(line));
```

## Array of Objects → CSV
```javascript
const toCsv = (arr) => {
  if (!arr.length) return '';
  const header = Object.keys(arr[0]);
  const rows = arr.map(obj => header.map(k => obj[k]).join(','));
  return [header.join(','), ...rows].join('\n');
};
```

## Filter rows by value
```javascript
const filterBy = (arr, key, value) => arr.filter(r => r[key] === value);
```
