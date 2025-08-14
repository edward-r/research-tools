// assets/code/sample_csv_stats.mjs
import { readFile } from 'node:fs/promises';
const parseCsv = (text) => {
  const rows = text.trim().split(/\r?\n/).map(r => r.split(','));
  const [header, ...data] = rows;
  return data.map(r => Object.fromEntries(r.map((v,i)=>[header[i], v])));
};
const fmean = xs => xs.length ? xs.reduce((a,b)=>a+b, 0) / xs.length : 0;
const run = async () => {
  const text = await readFile(new URL('../datasets/sample.csv', import.meta.url));
  const rows = parseCsv(text.toString());
  const coerce = r => ({ id:+r.id, category:r.category, value:+r.value, ok:['1','true','True'].includes(r.ok) });
  const okRows = rows.map(coerce).filter(r=>r.ok);
  const values = okRows.map(r=>r.value);
  const byCat = okRows.reduce((m,r)=>(m.set(r.category,[...(m.get(r.category)||[]), r.value]), m), new Map());
  const by_category = Object.fromEntries([...byCat].map(([k,xs])=>[k,{count:xs.length, mean:fmean(xs)}]));
  const summary = { count: values.length, sum: values.reduce((a,b)=>a+b,0), mean: fmean(values), by_category };
  console.log(JSON.stringify(summary, null, 2));
};
run().catch(e => { console.error(e.message||String(e)); process.exit(1); });
