# 🛠 Dataset Wrangling Scratchpad
#Dataset #CodeRecipes

## CSV → Array of Objects (JS)
```javascript
const parseCsv = (text) => {
  const [header, ...rows] = text.trim().split(/\r?\n/).map(r => r.split(','));
  return rows.map(r => Object.fromEntries(r.map((v, i) => [header[i], v])));
};
```
