// setup_research_kits_node_only_plus.mjs
// Builds two pure-Node demo kits with Smart Searches + a Node watcher:
//   PROJECT_NAME_NODEONLY/ and DEMO_JS_AsyncPatterns_NODEONLY/
//
// Contents per kit:
//   assets/datasets/sample.csv
//   assets/code/sample_csv_stats.mjs         <-- pure-Node CSV stats (functional)
//   tools/append_evidence_row.mjs            <-- pure-Node Evidence Log appender
//   tools/watch_and_log_node.mjs             <-- pure-Node watcher (re-run on save)
//   notes/<NAME>_EvidenceLog.md
//   notes/SmartSearch_*.md (Bear search stubs)
//   Makefile (run:js, watch:js, log:tail)
//
// Usage:
//   node setup_research_kits_node_only_plus.mjs
//   cd PROJECT_NAME_NODEONLY && make run:js
//   cd PROJECT_NAME_NODEONLY && make watch:js
//
// No external deps, no classes.

import { promises as fs } from "node:fs";
import { spawn, execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const write = async (p, text) => {
  await fs.mkdir(dirname(p), { recursive: true });
  await fs.writeFile(p, text, "utf8");
};

const sampleCsv = `id,category,value,ok
1,alpha,10,1
2,beta,5,1
3,alpha,15,1
4,gamma,9,0
5,beta,7,1
6,alpha,20,1
`;

// Pure Node CSV stats (functional)
const sampleCsvStatsMjs = `// assets/code/sample_csv_stats.mjs
import { readFile } from 'node:fs/promises';

const parseCsv = (text) => {
  const rows = text.trim().split(/\\r?\\n/).map(r => r.split(','));
  const [header, ...data] = rows;
  return data.map(r => Object.fromEntries(r.map((v,i)=>[header[i], v])));
};

const fmean = xs => xs.length ? xs.reduce((a,b)=>a+ b,0) / xs.length : 0;

const run = async () => {
  const text = await readFile(new URL('../datasets/sample.csv', import.meta.url));
  const rows = parseCsv(text.toString());

  const coerce = r => ({
    id: Number(r.id),
    category: r.category,
    value: Number(r.value),
    ok: r.ok === '1' || r.ok === 'true' || r.ok === 'True'
  });

  const okRows = rows.map(coerce).filter(r => r.ok);
  const values = okRows.map(r => r.value);

  const byCat = okRows.reduce((acc, r) => {
    const xs = acc.get(r.category) || [];
    acc.set(r.category, xs.concat([r.value]));
    return acc;
  }, new Map());

  const by_category = Object.fromEntries(
    [...byCat.entries()].map(([k, xs]) => [k, { count: xs.length, mean: fmean(xs) }])
  );

  const summary = {
    count: values.length,
    sum: values.reduce((a,b)=>a+b,0),
    mean: fmean(values),
    by_category
  };

  console.log(JSON.stringify(summary, null, 2));
};

run().catch(e => {
  console.error(e.message || String(e));
  process.exit(1);
});
`;

// Append to Evidence Log (Node-only)
const appendEvidenceRowMjs = `// tools/append_evidence_row.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const argv = Object.fromEntries(
  process.argv.slice(2).map((a,i,arr)=>a.startsWith('--')? [a.replace(/^--/, ''), arr[i+1]]: null).filter(Boolean)
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
  const d = new Date();
  const pad = n => String(n).padStart(2,'0');
  return \`\${d.getFullYear()}-\${pad(d.getMonth()+1)}-\${pad(d.getDate())}\`;
};

const main = async () => {
  const { log, label, status, input } = argv;
  if (!log || !label || typeof status === 'undefined' || !input) {
    console.error('Usage: node tools/append_evidence_row.mjs --log <path> --label <text> --status <code> --input <logfile>');
    process.exit(2);
  }
  const statusTag = String(status) === '0' ? '#Confirmed' : '#Bug';
  const summary = await tailLines(input, 4);
  const row = \`| \${today()} | Code | \${label} run | #Code #Experiment \${statusTag} | Output: {\${summary}} |\\n\`;

  await mkdir(dirname(log), { recursive: true });
  let prev = '';
  try { prev = await readFile(log, 'utf8'); } catch {}
  await writeFile(log, prev + row, 'utf8');
  process.stdout.write(row);
};

main().catch(e => { console.error(e); process.exit(1); });
`;

// Pure Node watcher (no deps, functional)
const watchAndLogNodeMjs = `// tools/watch_and_log_node.mjs — watch a file, re-run on save, append Evidence Log
// Usage:
//   node tools/watch_and_log_node.mjs \\
/* */    --file assets/code/sample_csv_stats.mjs \\
/* */    --run "node assets/code/sample_csv_stats.mjs" \\
/* */    --log notes/PROJECT_NAME_EvidenceLog.md \\
/* */    --label sample_csv_stats.mjs
//
// Notes:
// - Uses fs.watch with debounce. No external deps.

import { watch } from 'node:fs';
import { writeFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const parseArgs = () =>
  Object.fromEntries(process.argv.slice(2)
    .map((a,i,arr)=>a.startsWith('--')? [a.slice(2), arr[i+1]]: null)
    .filter(Boolean));

const timestamp = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2,'0');
  return \`\${d.getFullYear()}\${pad(d.getMonth()+1)}\${pad(d.getDate())}_\${pad(d.getHours())}\${pad(d.getMinutes())}\${pad(d.getSeconds())}\`;
};

const runCmd = (cmdStr) => new Promise(resolve => {
  const [cmd, ...args] = cmdStr.split(' ');
  const ps = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  ps.stdout.on('data', d => out += d.toString());
  ps.stderr.on('data', d => out += d.toString());
  ps.on('close', code => resolve({ code, out }));
});

const debounce = (fn, ms) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

const main = async () => {
  const { file, run, log, label } = parseArgs();
  if (!file || !run || !log || !label) {
    console.error('Usage: node tools/watch_and_log_node.mjs --file <path> --run "<cmd>" --log <evidencelog.md> --label <label>');
    process.exit(2);
  }
  await mkdir('logs', { recursive: true });

  const execute = async () => {
    const ts = timestamp();
    const logFile = \`logs/run_\${ts}.log\`;
    const { code, out } = await runCmd(run);
    await writeFile(logFile, out, 'utf8');
    const codeStr = String(code ?? 1);
    const app = spawn(process.execPath, ['tools/append_evidence_row.mjs',
      '--log', log, '--label', label, '--status', codeStr, '--input', logFile
    ], { stdio: 'inherit' });
    app.on('close', () => {});
  };

  // run once on start
  await execute();

  const trigger = debounce(execute, 150);
  console.log('▶ Watching', file);
  watch(file, { persistent: true }, () => trigger());
};

main().catch(e => { console.error(e); process.exit(1); });
`;

// Evidence Log header
const evidenceLogHeader = (NAME) => `# 📜 ${NAME} — Evidence & Source Log
#${NAME} #EvidenceLog

| Date Added | Source Type | Title / Description | Tags | Notes |
|------------|-------------|---------------------|------|-------|
`;

// Smart Search stubs (Bear)
const smartSearchNotes = (NAME) => {
  const enc = (s) => encodeURIComponent(s);
  const mk = (label, query) =>
    `- [${label}](bear://x-callback-url/search?term=${enc(query)}) — \`${query}\``;
  return `# 🔎 Smart Searches — ${NAME}
#${NAME} #SearchIndex

${mk("Active Tasks", `#${NAME} AND #ToDo`)}
${mk("Confirmed Evidence", `#${NAME} AND #Confirmed`)}
${mk("Code", `#${NAME} AND #Code`)}
${mk("Datasets", `#${NAME} AND #Dataset`)}
${mk("Bugs", `#${NAME} AND #Bug`)}
`;
};

// Makefile with run:js, watch:js, log:tail
const makefileFor = (NAME) => `# Makefile — ${NAME} Node-only demo
SHELL := /bin/bash

JS_FILE ?= assets/code/sample_csv_stats.mjs
EVIDENCE ?= notes/${NAME}_EvidenceLog.md

run:js ## Run Node demo, log output, append Evidence Log
	@mkdir -p logs
	@ts=$$(date +%Y%m%d_%H%M%S); \\
	  out="logs/run_$$ts.log"; \\
	  node $(JS_FILE) > "$$out" 2>&1; status=$$?; \\
	  cat "$$out"; \\
	  node tools/append_evidence_row.mjs --log $(EVIDENCE) --label $$(basename $(JS_FILE)) --status $$status --input "$$out"

watch:js ## Watch JS file and auto-append Evidence Log
	@node tools/watch_and_log_node.mjs --file $(JS_FILE) --run "node $(JS_FILE)" --log $(EVIDENCE) --label $$(basename $(JS_FILE))

log:tail ## Tail newest log
	@bash -lc 'tail -n 20 "$$(ls -1t logs/run_*.log | head -n 1)"'
`;

// Create one kit
const makeKit = async (NAME) => {
  const root = join(here, `${NAME}_NODEONLY`);
  await write(join(root, "assets/datasets/sample.csv"), sampleCsv);
  await write(
    join(root, "assets/code/sample_csv_stats.mjs"),
    sampleCsvStatsMjs,
  );
  await write(
    join(root, "tools/append_evidence_row.mjs"),
    appendEvidenceRowMjs,
  );
  await write(join(root, "tools/watch_and_log_node.mjs"), watchAndLogNodeMjs);
  await write(
    join(root, `notes/${NAME}_EvidenceLog.md`),
    evidenceLogHeader(NAME),
  );
  await write(join(root, `notes/SmartSearch_Index.md`), smartSearchNotes(NAME));
  await write(join(root, "Makefile"), makefileFor(NAME));
  return root;
};

const main = async () => {
  for (const k of ["PROJECT_NAME", "DEMO_JS_AsyncPatterns"]) {
    const root = await makeKit(k);
    console.log(`✅ Created ${root}`);
    console.log(
      `Next steps:\n  cd ${basename(root)}\n  make run:js\n  make watch:js   # re-run on save → log → append\n  make log:tail   # quick tail of latest run`,
    );
    console.log("---");
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
