// bootstrap_all_kits.mjs
// Builds two kits with Node core + optional Python lane for LLM study.
// Kits: PROJECT_NAME_NODEONLY/ and DEMO_JS_AsyncPatterns_NODEONLY/

import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const write = async (p, text) => {
  await fs.mkdir(dirname(p), { recursive: true });
  await fs.writeFile(p, text, "utf8");
};

// ---------- Shared content ----------
const sampleCsv = `id,category,value,ok
1,alpha,10,1
2,beta,5,1
3,alpha,15,1
4,gamma,9,0
5,beta,7,1
6,alpha,20,1
`;

const sampleCsvStatsMjs = `// assets/code/sample_csv_stats.mjs
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
  const byCat = okRows.reduce((m,r)=> (m.set(r.category,[...(m.get(r.category)||[]), r.value]), m), new Map());
  const by_category = Object.fromEntries([...byCat].map(([k,xs])=>[k,{count:xs.length, mean: fmean(xs)}]));
  const summary = { count: values.length, sum: values.reduce((a,b)=>a+b,0), mean: fmean(values), by_category };
  console.log(JSON.stringify(summary, null, 2));
};
run().catch(e => { console.error(e.message||String(e)); process.exit(1); });
`;

const appendEvidenceRowMjs = `// tools/append_evidence_row.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
const args = Object.fromEntries(process.argv.slice(2).map((a,i,arr)=>a.startsWith('--')?[a.slice(2),arr[i+1]]:null).filter(Boolean));
const tailLines = async (p,n=4)=>{try{const t=await readFile(p,'utf8');const ls=t.split(/\\r?\\n/).map(s=>s.trim()).filter(Boolean);return ls.slice(-n).join(' / ');}catch{return '(no log found)';}};
const today = ()=>{const d=new Date(),pad=n=>String(n).padStart(2,'0');return \`\${d.getFullYear()}-\${pad(d.getMonth()+1)}-\${pad(d.getDate())}\`;};
const main = async () => {
  const { log, label, status, input } = args;
  if(!log||!label||typeof status==='undefined'||!input){ console.error('Usage: --log <path> --label <text> --status <code> --input <logfile>'); process.exit(2); }
  const statusTag = String(status)==='0' ? '#Confirmed' : '#Bug';
  const summary = await tailLines(input, 6);
  const row = \`| \${today()} | Code | \${label} run | #Code #Experiment \${statusTag} | Output: {\${summary}} |\\n\`;
  await mkdir(dirname(log), { recursive: true });
  let prev=''; try{ prev=await readFile(log,'utf8'); }catch{}
  await writeFile(log, prev+row, 'utf8'); process.stdout.write(row);
};
main().catch(e=>{ console.error(e); process.exit(1); });
`;

const watchAndLogNodeMjs = `// tools/watch_and_log_node.mjs
import { watch } from 'node:fs';
import { writeFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
const kv = ()=>Object.fromEntries(process.argv.slice(2).map((a,i,arr)=>a.startsWith('--')?[a.slice(2),arr[i+1]]:null).filter(Boolean));
const ts = ()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return \`\${d.getFullYear()}\${p(d.getMonth()+1)}\${p(d.getDate())}_\${p(d.getHours())}\${p(d.getMinutes())}\${p(d.getSeconds())}\`;};
const runCmd = (s)=>new Promise(res=>{const [c,...a]=s.split(' ');const ps=spawn(c,a,{stdio:['ignore','pipe','pipe']});let out='';ps.stdout.on('data',d=>out+=d);ps.stderr.on('data',d=>out+=d);ps.on('close',code=>res({code,out}));});
const debounce=(f,ms)=>{let t;return(...xs)=>{clearTimeout(t);t=setTimeout(()=>f(...xs),ms);};};
const main=async()=>{
  const { file, run, log, label } = kv();
  if(!file||!run||!log||!label){ console.error('Usage: --file <path> --run "<cmd>" --log <evidencelog.md> --label <label>'); process.exit(2); }
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

const tailLatestSh = `#!/usr/bin/env bash
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

// ---------- Notes ----------
const evidenceLogHeader = (NAME) => `# 📜 ${NAME} — Evidence & Source Log
#${NAME} #EvidenceLog

| Date Added | Source Type | Title / Description | Tags | Notes |
|------------|-------------|---------------------|------|-------|
`;

const smartSearchNotes = (NAME) => {
  const enc = (s) => encodeURIComponent(s);
  const mk = (label, q) =>
    `- [${label}](bear://x-callback-url/search?term=${enc(q)}) — \`${q}\``;
  return `# 🔎 Smart Searches — ${NAME}
#${NAME} #SearchIndex

${mk("Active Tasks", `#${NAME} AND #ToDo`)}
${mk("Confirmed Evidence", `#${NAME} AND #Confirmed`)}
${mk("Code", `#${NAME} AND #Code`)}
${mk("Datasets", `#${NAME} AND #Dataset`)}
${mk("Bugs", `#${NAME} AND #Bug`)}
`;
};

const projectDashboard = (NAME) => `# 📊 Project Dashboard — ${NAME}
#${NAME} #Dashboard

## Quick Commands
\`\`\`bash
make run-js
make watch-js
make run-tests
make dev-3
make run-py
make watch-py
make dev-3-py
\`\`\`

## Core Notes
- Evidence Log (smart search): bear://x-callback-url/search?term=%23${NAME}%20AND%20%23EvidenceLog
- Smart Search Index: SmartSearch_Index

## Filters
- #Code #Dataset #Bug #Confirmed
`;

// Dataset scratchpad
const datasetScratchpad = `# 🛠 Dataset Wrangling Scratchpad (JS)
#Dataset #CodeRecipes

## CSV → Array of Objects
\`\`\`javascript
const parseCsv = (text) => {
  const [h,...rows]=text.trim().split(/\\r?\\n/).map(r=>r.split(','));
  return rows.map(r=>Object.fromEntries(r.map((v,i)=>[h[i],v])));
};
\`\`\`
`;

// ---------- Tests (JS) ----------
const testRunner = `// tests/run_tests.mjs
import { spawn } from 'node:child_process';
const run=(c,a=[])=>new Promise(r=>{const p=spawn(c,a,{stdio:['ignore','pipe','pipe']});let out='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>out+=d);p.on('close',code=>r({code,out}))});
const approx=(a,b,eps=1e-9)=>Math.abs(a-b)<=eps;
const main=async()=>{
  const {code,out}=await run(process.execPath,['assets/code/sample_csv_stats.mjs']);
  if(code!==0){ console.log('❌ non-zero'); console.log(out); process.exit(1); }
  let j; try{ j=JSON.parse(out);}catch(e){ console.log('❌ not JSON',e.message); console.log(out); process.exit(1); }
  const need=['count','sum','mean','by_category']; if(!need.every(k=>Object.hasOwn(j,k))){ console.log('❌ missing keys'); process.exit(1); }
  const exp=j.count>0? j.sum/j.count : 0; if(!approx(j.mean,exp)){ console.log('❌ mean!=sum/count'); process.exit(1); }
  console.log('✅ JS tests passed'); process.exit(0);
};
main().catch(e=>{ console.error(e); process.exit(1); });
`;

// ---------- Research add‑ons (Node wrappers) ----------
const toolCommonHelpers = `const parseKV=()=>Object.fromEntries(process.argv.slice(2).map((a,i,arr)=>a.startsWith('--')?[a.slice(2),arr[i+1]]:null).filter(Boolean));
const ensureDir=async(p)=>{const {mkdir}=await import('node:fs/promises'); const {dirname}=await import('node:path'); await mkdir(dirname(p),{recursive:true});};
const ap=(x)=>process.stdout.write((typeof x==='string'? x: JSON.stringify(x,null,2))+'\\n');`;

const ingestReferenceMjs = `// tools/ingest_reference.mjs
${toolCommonHelpers}
import { appendFile } from 'node:fs/promises';
const main=async()=>{
  const a=parseKV();
  const ref={ type:a.type||'ref', title:a.title||'(untitled)', author:a.author||'', year:a.year?+a.year:undefined, url:a.url||'', tags:a.tags||'', notes:a.notes||'', added_at:new Date().toISOString() };
  const file='assets/metadata/references.jsonl'; await ensureDir(file); await appendFile(file, JSON.stringify(ref)+'\\n','utf8'); ap({ok:true,wrote:file,ref});
};
main().catch(e=>{ console.error(e); process.exit(1); });
`;

const videoProbeMjs = `// tools/video_probe.mjs
${toolCommonHelpers}
import { spawn } from 'node:child_process'; import { appendFile } from 'node:fs/promises';
const run=(c,a=[])=>new Promise(r=>{const p=spawn(c,a,{stdio:['ignore','pipe','pipe']});let out='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>out+=d);p.on('close',code=>r({code,out}))});
const main=async()=>{
  const { file } = parseKV(); if(!file){ console.error('Usage: --file <video>'); process.exit(2); }
  const args=['-hide_banner','-v','error','-show_format','-show_streams','-print_format','json',file];
  const { code, out } = await run('ffprobe', args);
  if(code!==0){ console.error('ffprobe missing or failed'); process.stdout.write(out); process.exit(1); }
  let j={}; try{ j=JSON.parse(out);}catch{}
  const idx='assets/metadata/video_index.jsonl'; await ensureDir(idx);
  await appendFile(idx, JSON.stringify({ file, probed_at:new Date().toISOString(), format:j.format||{}, streams:j.streams||[] })+'\\n','utf8');
  ap({ok:true,wrote:idx,file,duration:j.format?.duration,size:j.format?.size});
};
main().catch(e=>{ console.error(e); process.exit(1); });
`;

const videoFramesSampleMjs = `// tools/video_frames_sample.mjs
${toolCommonHelpers}
import { spawn } from 'node:child_process'; import { readdir, appendFile } from 'node:fs/promises'; import { join, parse } from 'node:path';
const run=(c,a=[])=>new Promise(r=>{const p=spawn(c,a,{stdio:['ignore','pipe','pipe']});let out='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>out+=d);p.on('close',code=>r({code,out}))});
const main=async()=>{
  const a=parseKV(); const file=a.file; const every=Number(a.every||10); const outdir=a.outdir||'assets/images';
  if(!file){ console.error('Usage: --file <video> [--every 10] [--outdir assets/images]'); process.exit(2); }
  const base=parse(file).name; const pattern=join(outdir, base+'_%04d.jpg');
  const args=['-hide_banner','-y','-i',file,'-vf',\`fps=1/\${every}\`,pattern];
  const { code, out } = await run('ffmpeg', args);
  if(code!==0){ console.error('ffmpeg missing or failed'); process.stdout.write(out); process.exit(1); }
  const files = await readdir(outdir).catch(()=>[]);
  const produced = files.filter(x=>x.startsWith(base+'_')).length;
  const idx='assets/metadata/video_frames.jsonl'; await ensureDir(idx);
  await appendFile(idx, JSON.stringify({ file, outdir, every, produced, at:new Date().toISOString() })+'\\n','utf8');
  ap({ok:true,wrote:idx,produced,outdir});
};
main().catch(e=>{ console.error(e); process.exit(1); });
`;

const transcriptImportMjs = `// tools/transcript_import.mjs
${toolCommonHelpers}
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
  const idx='assets/metadata/transcript_index.jsonl'; await ensureDir(idx);
  await appendFile(idx, JSON.stringify({ file: out, imported_from:file, count:segs.length, source, at:new Date().toISOString() })+'\\n','utf8');
  ap({ok:true,wrote:out,count:segs.length});
};
main().catch(e=>{ console.error(e); process.exit(1); });
`;

// ---------- Python lane (no external deps) ----------
const samplePy = `# assets/code_py/sample_llm_primitives.py
# Pure-Python (no deps) demo: tokenizer, softmax, cross-entropy on toy logits.
# Prints JSON so it integrates with the existing logging pipeline.

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

def tokenize(text):
    # naive whitespace tokenizer
    return text.strip().split()

def forward(logits, target_index):
    probs = softmax(logits)
    loss = cross_entropy(probs, target_index)
    return probs, loss

def main():
    # toy example
    vocab = tokenize("hello world hello LLM")
    logits = [1.2, -0.3, 0.7]  # pretend model outputs for 3 classes
    target = 0  # index of correct class
    probs, loss = forward(logits, target)
    out = {
        "vocab_size": len(set(vocab)),
        "probs": [round(p, 6) for p in probs],
        "loss": round(loss, 6),
        "sum_probs": round(sum(probs), 6)
    }
    print(json.dumps(out, indent=2))

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        sys.stderr.write(str(e) + "\\n")
        sys.exit(1)
`;

const testRunnerPy = `# tests/run_tests_py.py
# Simple checks for the Python lane demo (no deps).
import json, subprocess, sys

def run_py():
    p = subprocess.Popen(
        ["python3", "assets/code_py/sample_llm_primitives.py"],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
    out, err = p.communicate()
    return p.returncode, out, err

def approx(a, b, eps=1e-9):
    return abs(a - b) <= eps

def main():
    code, out, err = run_py()
    if code != 0:
        print("❌ Python demo exited non-zero")
        print(err)
        sys.exit(1)
    try:
        j = json.loads(out)
    except Exception as e:
        print("❌ Output not JSON:", e)
        print(out)
        sys.exit(1)
    if not approx(j.get("sum_probs", 0.0), 1.0, 1e-9):
        print("❌ softmax probabilities do not sum to 1.0")
        print(j)
        sys.exit(1)
    print("✅ Python tests passed")
    sys.exit(0)

if __name__ == "__main__":
    main()
`;

// ---------- Makefile (Node + optional Python lane) ----------

function makefileFor(NAME) {
  const L = [];

  L.push("# Makefile — " + NAME + " Node + optional Python");
  L.push("SHELL := /bin/bash");
  L.push("JS_FILE  ?= assets/code/sample_csv_stats.mjs");
  L.push("PY_FILE  ?= assets/code_py/sample_llm_primitives.py");
  L.push("EVIDENCE ?= notes/" + NAME + "_EvidenceLog.md");
  L.push("");
  L.push(
    ".PHONY: help run-js watch-js run-tests log-tail dev dev-3 dev-tests run-py watch-py run-tests-py dev-3-py ingest-ref probe-video sample-frames import-transcript pack-context",
  );
  L.push("");
  L.push("help: ## Show available targets");
  L.push(
    "\t@grep -E '^[a-zA-Z0-9_.-]+:.*?## ' $(MAKEFILE_LIST) | sed 's/:.*##/: /' | sort",
  );
  L.push("");
  // --- Node lane ---
  L.push("run-js: ## Run JS demo → log → append");
  L.push(
    '\t@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \\',
  );
  L.push('\tnode $(JS_FILE) > "$$out" 2>&1; status=$$?; cat "$$out"; \\');
  L.push(
    '\tnode tools/append_evidence_row.mjs --log $(EVIDENCE) --label $$(basename $(JS_FILE)) --status $$status --input "$$out"; exit $$status',
  );
  L.push("");
  L.push("watch-js: ## Watch JS file; on save: run → log → append");
  L.push(
    '\t@node tools/watch_and_log_node.mjs --file $(JS_FILE) --run "node $(JS_FILE)" --log $(EVIDENCE) --label $$(basename $(JS_FILE))',
  );
  L.push("");
  L.push("run-tests: ## Run JS tests → log → append");
  L.push(
    '\t@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \\',
  );
  L.push(
    '\tnode tests/run_tests.mjs > "$$out" 2>&1; status=$$?; cat "$$out"; \\',
  );
  L.push(
    '\tnode tools/append_evidence_row.mjs --log $(EVIDENCE) --label tests_js --status $$status --input "$$out"; exit $$status',
  );
  L.push("");
  // --- Python lane ---
  L.push("run-py: ## Run PY demo (python3) → log → append");
  L.push(
    '\t@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \\',
  );
  L.push(
    '\tpython3 $(PY_FILE) > "$$out" 2>&1 || true; status=$$?; cat "$$out"; \\',
  );
  L.push(
    '\tnode tools/append_evidence_row.mjs --log $(EVIDENCE) --label $$(basename $(PY_FILE)) --status $$status --input "$$out"; exit $$status',
  );
  L.push("");
  L.push("watch-py: ## Watch PY file; on save: run → log → append");
  L.push(
    '\t@node tools/watch_and_log_node.mjs --file $(PY_FILE) --run "python3 $(PY_FILE)" --log $(EVIDENCE) --label $$(basename $(PY_FILE))',
  );
  L.push("");
  L.push("run-tests-py: ## Run PY tests → log → append");
  L.push(
    '\t@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \\',
  );
  L.push(
    '\tpython3 tests/run_tests_py.py > "$$out" 2>&1 || true; status=$$?; cat "$$out"; \\',
  );
  L.push(
    '\tnode tools/append_evidence_row.mjs --log $(EVIDENCE) --label tests_py --status $$status --input "$$out"; exit $$status',
  );
  L.push("");
  // --- Logs + NeoVim panes ---
  L.push("log-tail: ## Tail newest log");
  L.push(
    "\t@bash -lc 'tail -n 40 \"$$(ls -1t logs/run_*.log 2>/dev/null | head -n 1)\"'",
  );
  L.push("");
  L.push("dev: ## NeoVim: Evidence Log (L) + watch-js (R)");
  L.push("\t@nvim \"$(EVIDENCE)\" -c 'vsplit | terminal make watch-js'");
  L.push("");
  L.push(
    "dev-3: ## NeoVim: Evidence Log (L), watch-js (TR), newest log tail (BR)",
  );
  L.push('\t@nvim "$(EVIDENCE)" \\');
  L.push("\t  -c 'vsplit | terminal make watch-js' \\");
  L.push(
    "\t  -c 'wincmd h | botright split | terminal bash tools/tail_latest.sh'",
  );
  L.push("");
  L.push(
    "dev-tests: ## NeoVim: Evidence Log (L), run-tests (TR), newest log tail (BR)",
  );
  L.push('\t@nvim "$(EVIDENCE)" \\');
  L.push("\t  -c 'vsplit | terminal make run-tests' \\");
  L.push(
    "\t  -c 'wincmd h | botright split | terminal bash tools/tail_latest.sh'",
  );
  L.push("");
  L.push(
    "dev-3-py: ## NeoVim: Evidence Log (L), watch-py (TR), newest log tail (BR)",
  );
  L.push('\t@nvim "$(EVIDENCE)" \\');
  L.push("\t  -c 'vsplit | terminal make watch-py' \\");
  L.push(
    "\t  -c 'wincmd h | botright split | terminal bash tools/tail_latest.sh'",
  );
  L.push("");
  // --- Research add-ons (safe in CI even if unused) ---
  L.push(
    'ingest-ref: ## Append normalized reference row (ARGS=\'--type book --title "…" --author "…" --year 2016 --url … --tags "…" --notes "…"\')',
  );
  L.push(
    '\t@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \\',
  );
  L.push(
    '\tnode tools/ingest_reference.mjs $${ARGS} > "$$out" 2>&1; status=$$?; cat "$$out"; \\',
  );
  L.push(
    '\tnode tools/append_evidence_row.mjs --log $(EVIDENCE) --label ingest_reference --status $$status --input "$$out"; exit $$status',
  );
  L.push("");
  L.push(
    "probe-video: ## Log video info (FILE=assets/video/clip.mp4) (needs ffprobe)",
  );
  L.push(
    '\t@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \\',
  );
  L.push(
    '\tnode tools/video_probe.mjs --file "$(FILE)" > "$$out" 2>&1; status=$$?; cat "$$out"; \\',
  );
  L.push(
    '\tnode tools/append_evidence_row.mjs --log $(EVIDENCE) --label video_probe --status $$status --input "$$out"; exit $$status',
  );
  L.push("");
  L.push(
    "sample-frames: ## Extract frames (FILE=…, EVERY=10, OUTDIR=assets/images) (needs ffmpeg)",
  );
  L.push(
    '\t@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \\',
  );
  L.push(
    '\tnode tools/video_frames_sample.mjs --file "$(FILE)" --every "$(EVERY)" --outdir "$(OUTDIR)" > "$$out" 2>&1; status=$$?; cat "$$out"; \\',
  );
  L.push(
    '\tnode tools/append_evidence_row.mjs --log $(EVIDENCE) --label video_frames_sample --status $$status --input "$$out"; exit $$status',
  );
  L.push("");
  L.push(
    "import-transcript: ## Import transcript (.srt/.vtt/.json/.jsonl) (FILE=…, SRC=whisperx)",
  );
  L.push(
    '\t@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \\',
  );
  L.push(
    '\tnode tools/transcript_import.mjs --file "$(FILE)" --source "$(SRC)" > "$$out" 2>&1; status=$$?; cat "$$out"; \\',
  );
  L.push(
    '\tnode tools/append_evidence_row.mjs --log $(EVIDENCE) --label transcript_import --status $$status --input "$$out"; exit $$status',
  );
  L.push("");
  // This is the tricky one; we keep ${…} literal for Bash by writing $${ and we’re in a *single-quoted* JS string, so no JS interpolation occurs.
  L.push(
    "pack-context: ## Zip curated notes+metadata for NotebookLM/ChatGPT (NAME=context_pack)",
  );
  L.push(
    '\t@bash -lc \'name=$${NAME:-context_pack}; rm -f "$$name.zip"; zip -r "$$name.zip" notes/*.md assets/metadata/*.jsonl assets/metadata/transcripts/*.jsonl 2>/dev/null || true; echo "Created $$name.zip"\'',
  );
  L.push("");

  return L.join("\n");
}

// ---------- Builder ----------
async function makeKit(NAME) {
  const root = join(here, `${NAME}_NODEONLY`);

  // Assets
  await write(join(root, "assets/datasets/sample.csv"), sampleCsv);
  await write(
    join(root, "assets/code/sample_csv_stats.mjs"),
    sampleCsvStatsMjs,
  );
  await write(join(root, "assets/code_py/sample_llm_primitives.py"), samplePy);

  // Multimodal dirs
  for (const d of [
    "texts",
    "images",
    "audio",
    "video",
    "metadata",
    "metadata/transcripts",
  ])
    await fs.mkdir(join(root, "assets", d), { recursive: true });

  // Tools
  await write(
    join(root, "tools/append_evidence_row.mjs"),
    appendEvidenceRowMjs,
  );
  await write(join(root, "tools/watch_and_log_node.mjs"), watchAndLogNodeMjs);
  await write(join(root, "tools/tail_latest.sh"), tailLatestSh);
  await fs.chmod(join(root, "tools/tail_latest.sh"), 0o755).catch(() => {});

  // Research add‑ons
  await write(join(root, "tools/ingest_reference.mjs"), ingestReferenceMjs);
  await write(join(root, "tools/video_probe.mjs"), videoProbeMjs);
  await write(
    join(root, "tools/video_frames_sample.mjs"),
    videoFramesSampleMjs,
  );
  await write(join(root, "tools/transcript_import.mjs"), transcriptImportMjs);

  // Notes
  await write(
    join(root, `notes/${NAME}_EvidenceLog.md`),
    evidenceLogHeader(NAME),
  );
  await write(join(root, "notes/SmartSearch_Index.md"), smartSearchNotes(NAME));
  await write(join(root, "notes/Project_Dashboard.md"), projectDashboard(NAME));
  await write(
    join(root, "notes/Dataset_Wrangling_Scratchpad.md"),
    datasetScratchpad,
  );

  // Tests
  await write(join(root, "tests/run_tests.mjs"), testRunner);
  await write(join(root, "tests/run_tests_py.py"), testRunnerPy);

  // Makefile
  await write(join(root, "Makefile"), makefileFor(NAME));

  return root;
}

(async function main() {
  for (const k of ["PROJECT_NAME", "DEMO_JS_AsyncPatterns"]) {
    const root = await makeKit(k);
    console.log(`✅ Created ${root}`);
    console.log(
      `Next steps:\n` +
        `  cd ${basename(root)}\n` +
        `  # Node lane\n` +
        `  make run-js && make run-tests && make dev-3\n` +
        `  # Python lane (requires python3)\n` +
        `  make run-py && make run-tests-py && make dev-3-py\n`,
    );
    console.log("---");
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
