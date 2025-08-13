// tools/video_frames_sample.mjs
const parseKV=()=>Object.fromEntries(process.argv.slice(2).map((a,i,arr)=>a.startsWith('--')?[a.slice(2),arr[i+1]]:null).filter(Boolean));
const ensureDir=async(p)=>{const {mkdir}=await import('node:fs/promises'); const {dirname}=await import('node:path'); await mkdir(dirname(p),{recursive:true});};
const ap=(x)=>process.stdout.write((typeof x==='string'? x: JSON.stringify(x,null,2))+'\n');
import { spawn } from 'node:child_process'; import { readdir, appendFile } from 'node:fs/promises'; import { join, parse } from 'node:path';
const run=(c,a=[])=>new Promise(r=>{const p=spawn(c,a,{stdio:['ignore','pipe','pipe']});let out='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>out+=d);p.on('close',code=>r({code,out}))});
const main=async()=>{
  const a=parseKV(); const file=a.file; const every=Number(a.every||10); const outdir=a.outdir||'assets/images';
  if(!file){ console.error('Usage: --file <video> [--every 10] [--outdir assets/images]'); process.exit(2); }
  const base=parse(file).name; const pattern=join(outdir, base+'_%04d.jpg');
  const args=['-hide_banner','-y','-i',file,'-vf',`fps=1/${every}`,pattern];
  const { code, out } = await run('ffmpeg', args);
  if(code!==0){ console.error('ffmpeg missing or failed'); process.stdout.write(out); process.exit(1); }
  const files = await readdir(outdir).catch(()=>[]);
  const produced = files.filter(x=>x.startsWith(base+'_')).length;
  const idx='assets/metadata/video_frames.jsonl'; await ensureDir(idx);
  await appendFile(idx, JSON.stringify({ file, outdir, every, produced, at:new Date().toISOString() })+'\n','utf8');
  ap({ok:true,wrote:idx,produced,outdir});
};
main().catch(e=>{ console.error(e); process.exit(1); });
