#!/usr/bin/env node
import { promises as fs } from 'node:fs';

const kv=()=>Object.fromEntries(process.argv.slice(2).map((a,i,x)=>a.startsWith('--')?[a.slice(2),x[i+1]]:null).filter(Boolean));

const readLines = async (p) => (await fs.readFile(p,'utf8')).split(/\r?\n/).map(s=>s.trim()).filter(Boolean);

const toCsv = (rows) => {
  const keys = [...new Set(rows.flatMap(r => Object.keys(r)))];
  const esc = s => `"${String(s ?? '').replace(/"/g,'""')}"`;
  const header = keys.join(',');
  const body = rows.map(r => keys.map(k => esc(r[k])).join(',')).join('\n');
  return header + '\n' + (rows.length ? body + '\n' : '');
};

const main = async () => {
  const { file } = kv();
  if (!file) { console.error('Usage: node tools/json_to_csv.mjs --file <in.jsonl|json>'); process.exit(2); }
  const text = await fs.readFile(file,'utf8');
  let rows = [];
  if (file.endsWith('.jsonl')) {
    rows = text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map(JSON.parse);
  } else {
    rows = JSON.parse(text);
  }
  process.stdout.write(toCsv(rows));
};
main().catch(e=>{ console.error(e); process.exit(1); });
