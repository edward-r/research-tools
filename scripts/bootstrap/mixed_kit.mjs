// Creates a mixed Node-only kit directory with assets, tools, notes, tests.
import { join } from "node:path";
import { promises as fs } from "node:fs";
import { ensureDir, writeText, absPath } from "./utils.mjs";
import { seedNotes } from "./notes_setup.mjs";
import { seedAssets } from "./assets_setup.mjs";

export async function bootstrapMixedKit(
  here,
  NAME,
  outBase,
  { force = false } = {},
) {
  const kitName = `${NAME}_NODEONLY`;
  const root = join(outBase, kitName);

  // Guard existing dir
  try {
    const stat = await fs.stat(root).catch(() => null);
    if (stat && !force) {
      await ensureDir(root);
    } else if (stat && force) {
      await fs.rm(root, { recursive: true, force: true });
      await ensureDir(root);
    } else {
      await ensureDir(root);
    }
  } catch {
    await ensureDir(root);
  }

  // Standard kit tree
  const dirs = [
    "assets",
    "assets/code",
    "assets/code_py",
    "assets/datasets",
    "assets/images",
    "assets/metadata/transcripts",
    "assets/texts",
    "assets/audio",
    "assets/video",
    "logs",
    "notes",
    "tests",
    "tools",
  ];
  for (const d of dirs) await ensureDir(join(root, d));

  // Seed: assets, tools, notes, tests
  await seedAssets(root);
  await seedNotes(root, kitName);
  await seedTools(root);
  await seedTests(root);

  console.log(`   • tree ready: ${absPath(root)}`);
  return root;
}

async function seedTools(root) {
  // append_evidence_row.mjs
  await writeText(
    join(root, "tools/append_evidence_row.mjs"),
    `#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const argv = Object.fromEntries(
  process.argv.slice(2)
    .map((a,i,arr)=>a.startsWith('--')?[a.replace(/^--/,''),
      arr[i+1]]:null).filter(Boolean)
);

const tailLines = async (path, n=4) => {
  try {
    const text = await readFile(path, 'utf8');
    const lines = text.split(/\\r?\\n/).map(s=>s.trim()).filter(Boolean);
    return lines.slice(-n).join(' / ');
  } catch {
    return '(no log found)';
  }
};

const today = () => {
  const d = new Date(); const P=n=>String(n).padStart(2,'0');
  return \`\${d.getFullYear()}-\${P(d.getMonth()+1)}-\${P(d.getDate())}\`;
};

const main = async () => {
  const { log, label, status, input } = argv;
  if (!log || !label || typeof status==='undefined' || !input) {
    console.error('Usage: node tools/append_evidence_row.mjs --log <path> --label <text> --status <code> --input <logfile>');
    process.exit(2);
  }
  const statusTag = String(status)==='0' ? '#Confirmed' : '#Bug';
  const summary = await tailLines(input, 6);
  const row = \`| \${today()} | Code | \${label} run | #Code #Experiment \${statusTag} | Output: {\${summary}} |\\n\`;

  await mkdir(dirname(log), { recursive: true });
  let prev = '';
  try { prev = await readFile(log, 'utf8'); } catch {}
  await writeFile(log, prev + row, 'utf8');
  process.stdout.write(row);
};
main().catch(e=>{ console.error(e); process.exit(1); });
`,
  );

  // watch_and_log_node.mjs
  await writeText(
    join(root, "tools/watch_and_log_node.mjs"),
    `#!/usr/bin/env node
import { watch } from 'node:fs';
import { writeFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const args = Object.fromEntries(
  process.argv.slice(2)
    .map((a,i,x)=>a.startsWith('--')?[a.slice(2), x[i+1]]:null)
    .filter(Boolean)
);

const ts = () => {
  const d=new Date(), P=n=>String(n).padStart(2,'0');
  return \`\${d.getFullYear()}\${P(d.getMonth()+1)}\${P(d.getDate())}_\${P(d.getHours())}\${P(d.getMinutes())}\${P(d.getSeconds())}\`;
};

const runCmd = (cmd) => new Promise(resolve=>{
  const [c, ...as] = cmd.split(' ');
  const p = spawn(c, as, { stdio: ['ignore','pipe','pipe'] });
  let out=''; p.stdout.on('data',d=>out+=d); p.stderr.on('data',d=>out+=d);
  p.on('close', code => resolve({ code, out }));
});

const debounce=(fn,ms)=>{ let t; return (...xs)=>{clearTimeout(t); t=setTimeout(()=>fn(...xs),ms);} };

const main = async () => {
  const { file, run, log, label } = args;
  if (!file || !run || !log || !label) {
    console.error('Usage: node tools/watch_and_log_node.mjs --file <path> --run "node <file>" --log <evidence.md> --label <label>');
    process.exit(2);
  }
  await mkdir('logs', { recursive: true });

  const execute = async () => {
    const outFile = \`logs/run_\${ts()}.log\`;
    const { code, out } = await runCmd(run);
    await writeFile(outFile, out, 'utf8');
    const a = spawn(process.execPath, ['tools/append_evidence_row.mjs',
      '--log', log, '--label', label, '--status', String(code ?? 1), '--input', outFile
    ], { stdio: 'inherit' });
    a.on('close', ()=>{});
  };

  await execute();
  const go = debounce(execute, 150);
  console.log('▶ watching', file);
  watch(file, { persistent: true }, () => go());
};
main().catch(e=>{ console.error(e); process.exit(1); });
`,
  );

  // json_to_csv.mjs
  await writeText(
    join(root, "tools/json_to_csv.mjs"),
    `#!/usr/bin/env node
import { promises as fs } from 'node:fs';

const kv=()=>Object.fromEntries(process.argv.slice(2).map((a,i,x)=>a.startsWith('--')?[a.slice(2),x[i+1]]:null).filter(Boolean));

const readLines = async (p) => (await fs.readFile(p,'utf8')).split(/\\r?\\n/).map(s=>s.trim()).filter(Boolean);

const toCsv = (rows) => {
  const keys = [...new Set(rows.flatMap(r => Object.keys(r)))];
  const esc = s => \`"\${String(s ?? '').replace(/"/g,'""')}"\`;
  const header = keys.join(',');
  const body = rows.map(r => keys.map(k => esc(r[k])).join(',')).join('\\n');
  return header + '\\n' + (rows.length ? body + '\\n' : '');
};

const main = async () => {
  const { file } = kv();
  if (!file) { console.error('Usage: node tools/json_to_csv.mjs --file <in.jsonl|json>'); process.exit(2); }
  const text = await fs.readFile(file,'utf8');
  let rows = [];
  if (file.endsWith('.jsonl')) {
    rows = text.split(/\\r?\\n/).map(s=>s.trim()).filter(Boolean).map(JSON.parse);
  } else {
    rows = JSON.parse(text);
  }
  process.stdout.write(toCsv(rows));
};
main().catch(e=>{ console.error(e); process.exit(1); });
`,
  );

  // ingest_reference.mjs
  await writeText(
    join(root, "tools/ingest_reference.mjs"),
    `#!/usr/bin/env node
import { promises as fs } from 'node:fs';

const kv=()=>Object.fromEntries(process.argv.slice(2).map((a,i,x)=>a.startsWith('--')?[a.slice(2),x[i+1]]:null).filter(Boolean));
const line = (o)=>JSON.stringify(o)+'\\n';

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
`,
  );

  // transcript_import.mjs
  await writeText(
    join(root, "tools/transcript_import.mjs"),
    `#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { basename } from 'node:path';

const kv=()=>Object.fromEntries(process.argv.slice(2).map((a,i,x)=>a.startsWith('--')?[a.slice(2),x[i+1]]:null).filter(Boolean));
const toJsonl = (rows) => rows.map(o=>JSON.stringify(o)).join('\\n')+'\\n';

const parseSrt = (text) => {
  const blocks = text.split(/\\r?\\n\\r?\\n/).map(b=>b.trim()).filter(Boolean);
  return blocks.map(b=>{
    const lines=b.split(/\\r?\\n/).filter(Boolean);
    const timing = lines[1] || '';
    const m = timing.match(/(\\d+:\\d+:\\d+,\\d+) --> (\\d+:\\d+:\\d+,\\d+)/);
    return { t0: m?m[1]:'', t1: m?m[2]:'', text: lines.slice(2).join(' ') };
  });
};

const parseVtt = (text) => {
  const lines = text.split(/\\r?\\n/);
  const out=[]; let buf=null;
  for (const ln of lines) {
    if (/-->/i.test(ln)) { buf={ timing: ln, text: '' }; out.push(buf); continue; }
    if (buf) buf.text += (buf.text?' ':'') + ln.trim();
  }
  return out.map(b=>{
    const m=b.timing.match(/(\\d+:\\d+:\\d+\\.\\d+) --> (\\d+:\\d+:\\d+\\.\\d+)/);
    return { t0: m?m[1]:'', t1: m?m[2]:'', text: (b.text||'').trim() };
  });
};

const main = async () => {
  const { file, source='manual' } = kv();
  if (!file) { console.error('Usage: node tools/transcript_import.mjs --file <.srt|.vtt|.json|.jsonl> --source <tag>'); process.exit(2); }
  const text = await fs.readFile(file,'utf8');
  let rows=[];
  if (file.endsWith('.jsonl')) rows = text.split(/\\r?\\n/).map(s=>s.trim()).filter(Boolean).map(JSON.parse);
  else if (file.endsWith('.json')) rows = JSON.parse(text);
  else if (file.endsWith('.srt')) rows = parseSrt(text);
  else if (file.endsWith('.vtt')) rows = parseVtt(text);
  else { console.error('Unsupported file type'); process.exit(2); }

  const outRow = { id: basename(file), source, items: rows.length };
  await fs.mkdir('assets/metadata/transcripts', { recursive:true });
  await fs.appendFile('assets/metadata/transcripts/transcripts_index.jsonl', JSON.stringify(outRow)+'\\n', 'utf8');
  console.log(\`Indexed transcript (\${rows.length} items)\`);
};
main().catch(e=>{ console.error(e); process.exit(1); });
`,
  );

  // video_probe.mjs
  await writeText(
    join(root, "tools/video_probe.mjs"),
    `#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const kv=()=>Object.fromEntries(process.argv.slice(2).map((a,i,x)=>a.startsWith('--')?[a.slice(2),x[i+1]]:null).filter(Boolean));

const main = () => {
  const { file } = kv();
  if (!file) { console.error('Usage: node tools/video_probe.mjs --file <video>'); process.exit(2); }
  const { status, stdout, stderr } = spawnSync('ffprobe', ['-hide_banner','-v','error','-show_format','-show_streams', file], { encoding:'utf8' });
  if (status!==0) { console.error(stderr || 'ffprobe failed'); process.exit(status||1); }
  process.stdout.write(stdout);
};
main();
`,
  );

  // video_frames_sample.mjs
  await writeText(
    join(root, "tools/video_frames_sample.mjs"),
    `#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';

const kv=()=>Object.fromEntries(process.argv.slice(2).map((a,i,x)=>a.startsWith('--')?[a.slice(2),x[i+1]]:null).filter(Boolean));

const main = async () => {
  const { file, every='10', outdir='assets/images' } = kv();
  if (!file) { console.error('Usage: node tools/video_frames_sample.mjs --file <video> --every <N seconds> --outdir assets/images'); process.exit(2); }
  await fs.mkdir(outdir, { recursive:true });
  const vf = \`fps=1/\\\${every}\`;             // keep as literal template at runtime
  const out = \`\${outdir}/frame_%05d.jpg\`;   // literal %05d is fine
  const args = ['-hide_banner','-i', file, '-vf', vf, out];
  const { status, stderr } = spawnSync('ffmpeg', args, { encoding:'utf8' });
  if (status!==0) { console.error(stderr || 'ffmpeg failed'); process.exit(status||1); }
  console.log('Frames extracted to', outdir);
};
main().catch(e=>{ console.error(e); process.exit(1); });
`,
  );

  // tail_latest.sh
  await writeText(
    join(root, "tools/tail_latest.sh"),
    `#!/usr/bin/env bash
while true; do
  f=$(ls -1t logs/run_*.log 2>/dev/null | head -n1)
  if [ -n "$f" ]; then clear; echo "== $f =="; tail -n 60 "$f"; else echo "(waiting for first log…)"; fi
  sleep 2
done
`,
  );
}

async function seedTests(root) {
  // JS tests
  await writeText(
    join(root, "tests/run_tests.mjs"),
    `#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
const run = (cmd,args)=>spawnSync(cmd,args,{encoding:'utf8'});
const { status, stdout, stderr } = run(process.execPath,['assets/code/sample_csv_stats.mjs']);
if (status!==0) { console.error(stderr||stdout); process.exit(status); }
let o; try { o = JSON.parse(stdout); } catch { console.error('Output is not JSON'); process.exit(2); }
if (typeof o.count!=='number' || typeof o.sum!=='number') { console.error('Missing fields'); process.exit(3); }
console.log('OK: JS tests passed');
`,
  );
  // PY tests (placeholder)
  await writeText(
    join(root, "tests/run_tests_py.py"),
    `# Minimal Python smoke (only runs if python3 available in your env)
print("OK: PY tests placeholder")`,
  );
}
