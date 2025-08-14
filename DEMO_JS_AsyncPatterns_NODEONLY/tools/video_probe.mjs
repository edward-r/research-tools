// tools/video_probe.mjs
const parseKV=()=>Object.fromEntries(process.argv.slice(2).map((a,i,arr)=>a.startsWith('--')?[a.slice(2),arr[i+1]]:null).filter(Boolean));
const appendJsonl=async(file,obj)=>{const {appendFile, mkdir}=await import('node:fs/promises'); const {dirname}=await import('node:path'); await mkdir(dirname(file),{recursive:true}); await appendFile(file, JSON.stringify(obj)+'\n','utf8');};
import { spawn } from 'node:child_process';
const run=(c,a=[])=>new Promise(r=>{const p=spawn(c,a,{stdio:['ignore','pipe','pipe']});let out='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>out+=d);p.on('close',code=>r({code,out}))});
const main=async()=>{
  const {file}=parseKV(); if(!file){ console.error('Usage: --file <video>'); process.exit(2); }
  const {code,out}=await run('ffprobe',['-hide_banner','-v','error','-show_format','-show_streams','-print_format','json',file]);
  if(code!==0){ console.error('ffprobe missing or failed'); process.stdout.write(out); process.exit(1); }
  let j={}; try{ j=JSON.parse(out);}catch{}
  const entry={file, probed_at:new Date().toISOString(), format:j.format||{}, streams:j.streams||[]};
  await appendJsonl('assets/metadata/video_index.jsonl', entry);
  process.stdout.write(JSON.stringify({ok:true,file,duration:j.format?.duration,size:j.format?.size},null,2)+'\n');
};
main().catch(e=>{ console.error(e); process.exit(1); });
