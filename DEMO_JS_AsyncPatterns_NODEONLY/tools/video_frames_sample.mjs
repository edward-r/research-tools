// tools/video_frames_sample.mjs
const parseKV=()=>Object.fromEntries(process.argv.slice(2).map((a,i,arr)=>a.startsWith('--')?[a.slice(2),arr[i+1]]:null).filter(Boolean));
const appendJsonl=async(file,obj)=>{const {appendFile, mkdir}=await import('node:fs/promises'); const {dirname}=await import('node:path'); await mkdir(dirname(file),{recursive:true}); await appendFile(file, JSON.stringify(obj)+'\n','utf8');};
import { spawn } from 'node:child_process'; import { readdir } from 'node:fs/promises'; import { join, parse } from 'node:path';
const run=(c,a=[])=>new Promise(r=>{const p=spawn(c,a,{stdio:['ignore','pipe','pipe']});let out='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>out+=d);p.on('close',code=>r({code,out}))});
const main=async()=>{
  const a=parseKV(); const file=a.file; const every=Number(a.every||10); const outdir=a.outdir||'assets/images';
  if(!file){ console.error('Usage: --file <video> [--every 10] [--outdir assets/images]'); process.exit(2); }
  const base=parse(file).name; const pattern=join(outdir, base+'_%04d.jpg');
  const {code,out}=await run('ffmpeg',['-hide_banner','-y','-i',file,'-vf',`fps=1/${every}`,pattern]);
  if(code!==0){ console.error('ffmpeg missing or failed'); process.stdout.write(out); process.exit(1); }
  const files=await readdir(outdir).catch(()=>[]); const produced=files.filter(x=>x.startsWith(base+'_')).length;
  await appendJsonl('assets/metadata/video_frames.jsonl',{file,outdir,every,produced,at:new Date().toISOString()});
  process.stdout.write(JSON.stringify({ok:true,produced,outdir},null,2)+'\n');
};
main().catch(e=>{ console.error(e); process.exit(1); });
