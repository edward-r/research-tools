// tools/transcript_import.mjs
const parseKV=()=>Object.fromEntries(process.argv.slice(2).map((a,i,arr)=>a.startsWith('--')?[a.slice(2),arr[i+1]]:null).filter(Boolean));
const ensureDir=async(p)=>{const {mkdir}=await import('node:fs/promises'); const {dirname}=await import('node:path'); await mkdir(dirname(p),{recursive:true});};
const ap=(x)=>process.stdout.write((typeof x==='string'? x: JSON.stringify(x,null,2))+'\n');
import { readFile, appendFile } from 'node:fs/promises'; import { parse as p } from 'node:path';
const parseTime=s=>{const m=s.trim().replace(',','.').match(/^(\d+):(\d+):(\d+)(?:\.(\d+))?$/); if(!m) return 0; const[_,H,M,S,ms='0']=m; return (+H)*3600+(+M)*60+(+S)+(+('0.'+ms));};
const parseSrt=t=>t.split(/\r?\n\r?\n/).map(ch=>{const ls=ch.trim().split(/\r?\n/).filter(Boolean); if(ls.length<2)return null; const [a,b]=ls[1].split(/-->|→/); return {start:parseTime(a), end:parseTime(b||a), text:ls.slice(2).join(' ')};}).filter(Boolean);
const parseVtt=t=>parseSrt(t.replace(/^WEBVTT.*\n/,''));
const main=async()=>{
  const a=parseKV(); const file=a.file; const source=a.source||'unknown'; if(!file){ console.error('Usage: --file <.srt|.vtt|.json|.jsonl> [--source X]'); process.exit(2); }
  const raw=await readFile(file,'utf8'); let segs=[];
  if(file.endsWith('.srt')) segs=parseSrt(raw); else if(file.endsWith('.vtt')) segs=parseVtt(raw);
  else if(file.endsWith('.jsonl')) segs=raw.trim().split(/\n+/).map(l=>JSON.parse(l));
  else if(file.endsWith('.json')){ const j=JSON.parse(raw); segs=Array.isArray(j)?j:(j.segments||[]); }
  else { console.error('Unsupported transcript format'); process.exit(2); }
  const base=p(file).name; const out=`assets/metadata/transcripts/${base}.jsonl`; await ensureDir(out);
  for(const s of segs) await appendFile(out, JSON.stringify(s)+'\n','utf8');
  const idx='assets/metadata/transcript_index.jsonl'; await ensureDir(idx);
  await appendFile(idx, JSON.stringify({ file: out, imported_from:file, count:segs.length, source, at:new Date().toISOString() })+'\n','utf8');
  ap({ok:true,wrote:out,count:segs.length});
};
main().catch(e=>{ console.error(e); process.exit(1); });
