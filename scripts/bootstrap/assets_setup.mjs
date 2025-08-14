import { writeText, mkdirp, chmodx } from "./utils.mjs";
import { join } from "node:path";

export const SAMPLE_CSV = `id,category,value,ok
1,alpha,10,1
2,beta,5,1
3,alpha,15,1
4,gamma,9,0
5,beta,7,1
6,alpha,20,1
`;

export const JS_STATS = `// assets/code/sample_csv_stats.mjs
import { readFile } from 'node:fs/promises';
const parseCsv = (text) => {
  const rows = text.trim().split(/\\r?\\n/).map(r => r.split(','));
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
`;

export const PY_PRIMS = `# assets/code_py/sample_llm_primitives.py
import json, math, sys
def softmax(xs):
    m = max(xs) if xs else 0.0
    ex = [math.exp(x - m) for x in xs]
    s = sum(ex)
    return [e / s for e in ex] if s else [0.0 for _ in xs]
def cross_entropy(probs, target_index):
    eps = 1e-12
    p = max(min(probs[target_index], 1.0 - eps), eps)
    return -math.log(p)
def main():
    logits = [1.2, -0.3, 0.7]; target = 0
    probs = softmax(logits); loss = cross_entropy(probs, target)
    print(json.dumps({"probs":[round(p,6) for p in probs], "loss":round(loss,6), "sum_probs":round(sum(probs),6)}, indent=2))
if __name__ == "__main__":
    try: main()
    except Exception as e:
        sys.stderr.write(str(e)+"\\n"); sys.exit(1)
`;

export const JS_TESTS = `// tests/run_tests.mjs
import { spawn } from 'node:child_process';
const run=(c,a=[])=>new Promise(r=>{const p=spawn(c,a,{stdio:['ignore','pipe','pipe']});let out='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>out+=d);p.on('close',code=>r({code,out}))});
const main=async()=>{
  const {code,out}=await run(process.execPath,['assets/code/sample_csv_stats.mjs']);
  if(code!==0){ console.log('❌ non-zero'); console.log(out); process.exit(1); }
  let j; try{ j=JSON.parse(out);}catch(e){ console.log('❌ not JSON',e.message); console.log(out); process.exit(1); }
  const need=['count','sum','mean','by_category']; if(!need.every(k=>Object.hasOwn(j,k))){ console.log('❌ missing keys'); process.exit(1); }
  const exp=j.count>0? j.sum/j.count : 0; if(Math.abs(j.mean-exp)>1e-9){ console.log('❌ mean!=sum/count'); process.exit(1); }
  console.log('✅ JS tests passed'); process.exit(0);
};
main().catch(e=>{ console.error(e); process.exit(1); });
`;

export const PY_TESTS = `# tests/run_tests_py.py
import json, subprocess, sys
def run_py():
    p = subprocess.Popen(["python3","assets/code_py/sample_llm_primitives.py"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    out, err = p.communicate(); return p.returncode, out, err
def approx(a,b,eps=1e-9): return abs(a-b) <= eps
def main():
    code,out,err = run_py()
    if code != 0: print("❌ Python demo exited non-zero"); print(err); sys.exit(1)
    try: j = json.loads(out)
    except Exception as e: print("❌ Output not JSON:", e); print(out); sys.exit(1)
    if not approx(j.get("sum_probs", 0.0), 1.0): print("❌ softmax probs != 1.0"); sys.exit(1)
    print("✅ Python tests passed"); sys.exit(0)
if __name__ == "__main__": main()
`;

export const TAIL_SH = `#!/usr/bin/env bash
set -euo pipefail
while true; do
  f=$(ls -1t logs/run_*.log 2>/dev/null | head -n1 || true)
  if [[ -n "\${f:-}" ]]; then
    clear; echo "== $f =="; tail -n 60 "$f"
  else
    printf '(waiting for first log...)\\n'
  fi
  sleep 2
done
`;

export const APPEND_EVIDENCE = `// tools/append_evidence_row.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
const args = Object.fromEntries(process.argv.slice(2).map((a,i,arr)=>a.startsWith('--')?[a.slice(2),arr[i+1]]:null).filter(Boolean));
const tailLines = async (p,n=6)=>{try{const t=await readFile(p,'utf8');const ls=t.split(/\\r?\\n/).map(s=>s.trim()).filter(Boolean);return ls.slice(-n).join(' / ');}catch{return '(no log found)';}};
const today = ()=>{const d=new Date(),pad=n=>String(n).padStart(2,'0');return \`\${d.getFullYear()}-\${pad(d.getMonth()+1)}-\${pad(d.getDate())}\`;};
const main = async () => {
  const { log, label, status, input } = args;
  if(!log||!label||typeof status==='undefined'||!input){ console.error('Usage: --log <path> --label <text> --status <code> --input <logfile>'); process.exit(2); }
  const statusTag = String(status)==='0' ? '#Confirmed' : '#Bug';
  const summary = await tailLines(input, 6);
  const row = \`| \${today()} | Code | \${label} run | #Code #Experiment \${statusTag} | Output: {\${summary}} |\\n\`;
  await mkdir(dirname(log), { recursive: true });
  let prev=''; try{ prev=await readFile(log,'utf8'); }catch{}
  await writeFile(log, prev + row, 'utf8');
  process.stdout.write(row);
};
main().catch(e=>{ console.error(e); process.exit(1); });
`;

export const WATCH_AND_LOG = `// tools/watch_and_log_node.mjs
import { watch } from 'node:fs';
import { writeFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
const kv = ()=>Object.fromEntries(process.argv.slice(2).map((a,i,arr)=>a.startsWith('--')?[a.slice(2),arr[i+1]]:null).filter(Boolean));
const ts = ()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return \`\${d.getFullYear()}\${p(d.getMonth()+1)}\${p(d.getDate())}_\${p(d.getHours())}\${p(d.getMinutes())}\${p(d.getSeconds())}\`;};
const runCmd = (s)=>new Promise(res=>{const [c,...a]=s.split(' ');const ps=spawn(c,a,{stdio:['ignore','pipe','pipe']});let out='';ps.stdout.on('data',d=>out+=d);ps.stderr.on('data',d=>out+=d);ps.on('close',code=>res({code,out}))});
const debounce=(f,ms)=>{let t;return(...xs)=>{clearTimeout(t);t=setTimeout(()=>f(...xs),ms);};};
const main=async()=>{
  const { file, run, log, label } = kv();
  if(!file||!run||!log||!label){ console.error('Usage: --file <path> --run \"<cmd>\" --log <evidencelog.md> --label <label>'); process.exit(2); }
  await mkdir('logs',{recursive:true});
  const execOnce=async()=>{
    const stamp=ts(), lf=\`logs/run_\${stamp}.log\`;
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
`;

export const INGEST_REFERENCE = `// tools/ingest_reference.mjs
const parseKV=()=>Object.fromEntries(process.argv.slice(2).map((a,i,arr)=>a.startsWith('--')?[a.slice(2),arr[i+1]]:null).filter(Boolean));
const ensureDir=async(p)=>{const {mkdir}=await import('node:fs/promises'); const {dirname}=await import('node:path'); await mkdir(dirname(p),{recursive:true});};
const appendJsonl=async(file,obj)=>{const {appendFile}=await import('node:fs/promises'); await ensureDir(file); await appendFile(file, JSON.stringify(obj)+'\\n','utf8');};
const print=(x)=>process.stdout.write((typeof x==='string'? x: JSON.stringify(x,null,2))+'\\n');
const main=async()=>{
  const a=parseKV();
  const ref={ type:a.type||'ref', title:a.title||'(untitled)', author:a.author||'', year:a.year?+a.year:undefined, url:a.url||'', tags:a.tags||'', notes:a.notes||'', added_at:new Date().toISOString() };
  await appendJsonl('assets/metadata/references.jsonl', ref);
  print({ok:true, wrote:'assets/metadata/references.jsonl', ref});
};
main().catch(e=>{ console.error(e); process.exit(1); });
`;

export const VIDEO_PROBE = `// tools/video_probe.mjs
const parseKV=()=>Object.fromEntries(process.argv.slice(2).map((a,i,arr)=>a.startsWith('--')?[a.slice(2),arr[i+1]]:null).filter(Boolean));
const appendJsonl=async(file,obj)=>{const {appendFile, mkdir}=await import('node:fs/promises'); const {dirname}=await import('node:path'); await mkdir(dirname(file),{recursive:true}); await appendFile(file, JSON.stringify(obj)+'\\n','utf8');};
import { spawn } from 'node:child_process';
const run=(c,a=[])=>new Promise(r=>{const p=spawn(c,a,{stdio:['ignore','pipe','pipe']});let out='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>out+=d);p.on('close',code=>r({code,out}))});
const main=async()=>{
  const {file}=parseKV(); if(!file){ console.error('Usage: --file <video>'); process.exit(2); }
  const {code,out}=await run('ffprobe',['-hide_banner','-v','error','-show_format','-show_streams','-print_format','json',file]);
  if(code!==0){ console.error('ffprobe missing or failed'); process.stdout.write(out); process.exit(1); }
  let j={}; try{ j=JSON.parse(out);}catch{}
  const entry={file, probed_at:new Date().toISOString(), format:j.format||{}, streams:j.streams||[]};
  await appendJsonl('assets/metadata/video_index.jsonl', entry);
  process.stdout.write(JSON.stringify({ok:true,file,duration:j.format?.duration,size:j.format?.size},null,2)+'\\n');
};
main().catch(e=>{ console.error(e); process.exit(1); });
`;

export const FRAMES_SAMPLE = `// tools/video_frames_sample.mjs
const parseKV=()=>Object.fromEntries(process.argv.slice(2).map((a,i,arr)=>a.startsWith('--')?[a.slice(2),arr[i+1]]:null).filter(Boolean));
const appendJsonl=async(file,obj)=>{const {appendFile, mkdir}=await import('node:fs/promises'); const {dirname}=await import('node:path'); await mkdir(dirname(file),{recursive:true}); await appendFile(file, JSON.stringify(obj)+'\\n','utf8');};
import { spawn } from 'node:child_process'; import { readdir } from 'node:fs/promises'; import { join, parse } from 'node:path';
const run=(c,a=[])=>new Promise(r=>{const p=spawn(c,a,{stdio:['ignore','pipe','pipe']});let out='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>out+=d);p.on('close',code=>r({code,out}))});
const main=async()=>{
  const a=parseKV(); const file=a.file; const every=Number(a.every||10); const outdir=a.outdir||'assets/images';
  if(!file){ console.error('Usage: --file <video> [--every 10] [--outdir assets/images]'); process.exit(2); }
  const base=parse(file).name; const pattern=join(outdir, base+'_%04d.jpg');
  const {code,out}=await run('ffmpeg',['-hide_banner','-y','-i',file,'-vf',\`fps=1/\${every}\`,pattern]);
  if(code!==0){ console.error('ffmpeg missing or failed'); process.stdout.write(out); process.exit(1); }
  const files=await readdir(outdir).catch(()=>[]); const produced=files.filter(x=>x.startsWith(base+'_')).length;
  await appendJsonl('assets/metadata/video_frames.jsonl',{file,outdir,every,produced,at:new Date().toISOString()});
  process.stdout.write(JSON.stringify({ok:true,produced,outdir},null,2)+'\\n');
};
main().catch(e=>{ console.error(e); process.exit(1); });
`;

export const TRANSCRIPT_IMPORT = `// tools/transcript_import.mjs
const parseKV=()=>Object.fromEntries(process.argv.slice(2).map((a,i,arr)=>a.startsWith('--')?[a.slice(2),arr[i+1]]:null).filter(Boolean));
const ensureDir=async(p)=>{const {mkdir}=await import('node:fs/promises'); const {dirname}=await import('node:path'); await mkdir(dirname(p),{recursive:true});};
const appendJsonl=async(file,obj)=>{const {appendFile}=await import('node:fs/promises'); await ensureDir(file); await appendFile(file, JSON.stringify(obj)+'\\n','utf8');};
import { readFile, appendFile } from 'node:fs/promises'; import { parse as p } from 'node:path';
const parseTime=s=>{const m=s.trim().replace(',','.').match(/^(\\d+):(\\d+):(\\d+)(?:\\.(\\d+))?$/); if(!m) return 0; const[_,H,M,S,ms='0']=m; return (+H)*3600+(+M)*60+(+S)+(+('0.'+ms));};
const parseSrt=t=>t.split(/\\r?\\n\\r?\\n/).map(ch=>{const ls=ch.trim().split(/\\r?\\n/).filter(Boolean); if(ls.length<2)return null; const [a,b]=ls[1].split(/-->|→/); return {start:parseTime(a), end:parseTime(b||a), text:ls.slice(2).join(' ')};}).filter(Boolean);
const parseVtt=t=>parseSrt(t.replace(/^WEBVTT.*\\n/,''));
const main=async()=>{
  const a=parseKV(); const file=a.file; const source=a.source||'unknown'; if(!file){ console.error('Usage: --file <.srt|.vtt|.json|.jsonl> [--source X]'); process.exit(2); }
  const raw=await readFile(file,'utf8'); let segs=[];
  if(file.endsWith('.srt')) segs=parseSrt(raw); else if(file.endsWith('.vtt')) segs=parseVtt(raw);
  else if(file.endsWith('.jsonl')) segs=raw.trim().split(/\\n+/).map(l=>JSON.parse(l));
  else if(file.endsWith('.json')){ const j=JSON.parse(raw); segs=Array.isArray(j)?j:(j.segments||[]); }
  else { console.error('Unsupported transcript format'); process.exit(2); }
  const base=p(file).name; const out=\`assets/metadata/transcripts/\${base}.jsonl\`; await ensureDir(out);
  for(const s of segs) await appendFile(out, JSON.stringify(s)+'\\n','utf8');
  await appendJsonl('assets/metadata/transcript_index.jsonl',{file:out, imported_from:file, count:segs.length, source, at:new Date().toISOString()});
  process.stdout.write(JSON.stringify({ok:true,wrote:out,count:segs.length},null,2)+'\\n');
};
main().catch(e=>{ console.error(e); process.exit(1); });
`;

// Write all standard assets/tools/tests for a kit
export async function writeStandardAssets(root, NAME) {
  // Dirs
  for (const d of [
    "datasets",
    "texts",
    "images",
    "audio",
    "video",
    "metadata",
    "metadata/transcripts",
  ]) {
    await mkdirp(join(root, "assets", d));
  }
  // Data + code
  await writeText(join(root, "assets/datasets/sample.csv"), SAMPLE_CSV);
  await writeText(join(root, "assets/code/sample_csv_stats.mjs"), JS_STATS);
  await writeText(
    join(root, "assets/code_py/sample_llm_primitives.py"),
    PY_PRIMS,
  );

  // Tools
  await writeText(join(root, "tools/append_evidence_row.mjs"), APPEND_EVIDENCE);
  await writeText(join(root, "tools/watch_and_log_node.mjs"), WATCH_AND_LOG);
  await writeText(join(root, "tools/ingest_reference.mjs"), INGEST_REFERENCE);
  await writeText(join(root, "tools/video_probe.mjs"), VIDEO_PROBE);
  await writeText(join(root, "tools/video_frames_sample.mjs"), FRAMES_SAMPLE);
  await writeText(join(root, "tools/transcript_import.mjs"), TRANSCRIPT_IMPORT);

  // Tail helper
  await writeText(join(root, "tools/tail_latest.sh"), TAIL_SH);
  await chmodx(join(root, "tools/tail_latest.sh"));

  // Tests
  await writeText(join(root, "tests/run_tests.mjs"), JS_TESTS);
  await writeText(join(root, "tests/run_tests_py.py"), PY_TESTS);
}
