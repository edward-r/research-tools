#!/usr/bin/env node
import { promises as fs } from 'node:fs';

const kv=()=>Object.fromEntries(process.argv.slice(2).map((a,i,x)=>a.startsWith('--')?[a.slice(2),x[i+1]]:null).filter(Boolean));
const line = (o)=>JSON.stringify(o)+'\n';

const main = async () => {
  const args = kv();
  const row = {
    type: args.type || 'book',
    title: args.title || '',
    author: args.author || args.authors || '',
    year: args.year || '',
    url: args.url || '',
    tags: args.tags || '',
    notes: args.notes || ''
  };
  await fs.mkdir('assets/metadata',{recursive:true});
  await fs.appendFile('assets/metadata/references_index.jsonl', line(row), 'utf8');
  console.log('Appended to assets/metadata/references_index.jsonl');
};
main().catch(e=>{ console.error(e); process.exit(1); });
