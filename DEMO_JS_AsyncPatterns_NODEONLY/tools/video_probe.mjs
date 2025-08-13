// tools/video_probe.mjs
const parseKV=()=>Object.fromEntries(process.argv.slice(2).map((a,i,arr)=>a.startsWith('--')?[a.slice(2),arr[i+1]]:null).filter(Boolean));
const ensureDir=async(p)=>{const {mkdir}=await import('node:fs/promises'); const {dirname}=await import('node:path'); await mkdir(dirname(p),{recursive:true});};
const ap=(x)=>process.stdout.write((typeof x==='string'? x: JSON.stringify(x,null,2))+'\n');
import { spawn } from 'node:child_process'; import { appendFile } from 'node:fs/promises';
const run=(c,a=[])=>new Promise(r=>{const p=spawn(c,a,{stdio:['ignore','pipe','pipe']});let out='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>out+=d);p.on('close',code=>r({code,out}))});
const main=async()=>{
  const { file } = parseKV(); if(!file){ console.error('Usage: --file <video>'); process.exit(2); }
  const args=['-hide_banner','-v','error','-show_format','-show_streams','-print_format','json',file];
  const { code, out } = await run('ffprobe', args);
  if(code!==0){ console.error('ffprobe missing or failed'); process.stdout.write(out); process.exit(1); }
  let j={}; try{ j=JSON.parse(out);}catch{}
  const idx='assets/metadata/video_index.jsonl'; await ensureDir(idx);
  await appendFile(idx, JSON.stringify({ file, probed_at:new Date().toISOString(), format:j.format||{}, streams:j.streams||[] })+'\n','utf8');
  ap({ok:true,wrote:idx,file,duration:j.format?.duration,size:j.format?.size});
};
main().catch(e=>{ console.error(e); process.exit(1); });
