# 🛠 Dataset Wrangling Scratchpad (JS)
#Dataset #CodeRecipes

## CSV → Array of Objects
```javascript
const parseCsv = (text) => {
  const [h,...rows]=text.trim().split(/\r?\n/).map(r=>r.split(','));
  return rows.map(r=>Object.fromEntries(r.map((v,i)=>[h[i],v])));
};
```
