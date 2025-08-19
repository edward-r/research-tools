#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { basename } from 'node:path';

const kv=()=>Object.fromEntries(process.argv.slice(2).map((a,i,x)=>a.startsWith('--')?[a.slice(2),x[i+1]]:null).filter(Boolean));
const toJsonl = (rows) => rows.map(o=>JSON.stringify(o)).join('\n')+'\n';

const parseSrt = (text) => {
  const blocks = text.split(/\r?\n\r?\n/).map(b=>b.trim()).filter(Boolean);
  return blocks.map(b=>{
    const lines=b.split(/\r?\n/).filter(Boolean);
    const timing = lines[1] || '';
    const m = timing.match(/(\d+:\d+:\d+,\d+) --> (\d+:\d+:\d+,\d+)/);
    return { t0: m?m[1]:'', t1: m?m[2]:'', text: lines.slice(2).join(' ') };
  });
};

const parseVtt = (text) => {
  const lines = text.split(/\r?\n/);
  const out=[]; let buf=null;
  for (const ln of lines) {
    if (/-->/i.test(ln)) { buf={ timing: ln, text: '' }; out.push(buf); continue; }
    if (buf) buf.text += (buf.text?' ':'') + ln.trim();
  }
  return out.map(b=>{
    const m=b.timing.match(/(\d+:\d+:\d+\.\d+) --> (\d+:\d+:\d+\.\d+)/);
    return { t0: m?m[1]:'', t1: m?m[2]:'', text: (b.text||'').trim() };
  });
};

const main = async () => {
  const { file, source='manual' } = kv();
  if (!file) { console.error('Usage: node tools/transcript_import.mjs --file <.srt|.vtt|.json|.jsonl> --source <tag>'); process.exit(2); }
  const text = await fs.readFile(file,'utf8');
  let rows=[];
  if (file.endsWith('.jsonl')) rows = text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map(JSON.parse);
  else if (file.endsWith('.json')) rows = JSON.parse(text);
  else if (file.endsWith('.srt')) rows = parseSrt(text);
  else if (file.endsWith('.vtt')) rows = parseVtt(text);
  else { console.error('Unsupported file type'); process.exit(2); }

  const outRow = { id: basename(file), source, items: rows.length };
  await fs.mkdir('assets/metadata/transcripts', { recursive:true });
  await fs.appendFile('assets/metadata/transcripts/transcripts_index.jsonl', JSON.stringify(outRow)+'\n', 'utf8');
  console.log(`Indexed transcript (${rows.length} items)`);
};
main().catch(e=>{ console.error(e); process.exit(1); });
