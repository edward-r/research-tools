// tools/watch_and_log_node.mjs
import { watch } from 'node:fs';
import { writeFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
const kv = ()=>Object.fromEntries(process.argv.slice(2).map((a,i,arr)=>a.startsWith('--')?[a.slice(2),arr[i+1]]:null).filter(Boolean));
const ts = ()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;};
const runCmd = (s)=>new Promise(res=>{const [c,...a]=s.split(' ');const ps=spawn(c,a,{stdio:['ignore','pipe','pipe']});let out='';ps.stdout.on('data',d=>out+=d);ps.stderr.on('data',d=>out+=d);ps.on('close',code=>res({code,out}))});
const debounce=(f,ms)=>{let t;return(...xs)=>{clearTimeout(t);t=setTimeout(()=>f(...xs),ms);};};
const main=async()=>{
  const { file, run, log, label } = kv();
  if(!file||!run||!log||!label){ console.error('Usage: --file <path> --run "<cmd>" --log <evidencelog.md> --label <label>'); process.exit(2); }
  await mkdir('logs',{recursive:true});
  const execOnce=async()=>{
    const stamp=ts(), lf=`logs/run_${stamp}.log`;
    const { code, out } = await runCmd(run);
    await writeFile(lf,out,'utf8');
    const app = spawn(process.execPath,['tools/append_evidence_row.mjs','--log',log,'--label',label,'--status',String(code??1),'--input',lf],{stdio:'inherit'});
    app.on('close',()=>{});
  };
  await execOnce();
  const trig=debounce(execOnce,150);
  console.log('▶ Watching', file);
  watch(file,{persistent:true},()=>trig());
};
main().catch(e=>{ console.error(e); process.exit(1); });
