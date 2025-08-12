// bootstrap_all_kits.mjs
// Rebuilds two pure-Node kits with dashboards, scratchpad, tests, watcher,
// tail helper script, and Makefiles using hyphen targets + NeoVim panes.

import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const write = async (p, text) => {
  await fs.mkdir(dirname(p), { recursive: true });
  await fs.writeFile(p, text, "utf8");
};

// ---------- Content blobs ----------
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

const watchAndLogNodeMjs = `// tools/watch_and_log_node.mjs — watch a file, re-run on save, append Evidence Log
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

  await execute();

  const trigger = debounce(execute, 150);
  console.log('▶ Watching', file);
  watch(file, { persistent: true }, () => trigger());
};

main().catch(e => { console.error(e); process.exit(1); });
`;

// NEW: tail helper script to avoid nested quoting issues in NeoVim commands
const tailLatestSh = `#!/usr/bin/env bash
set -euo pipefail
while true; do
  f=$(ls -1t logs/run_*.log 2>/dev/null | head -n1 || true)
  if [[ -n "\${f:-}" ]]; then
    clear
    echo "== $f =="
    tail -n 60 "$f"
  else
    printf '(waiting for first log...)\\n'
  fi
  sleep 2
done
`;

// Evidence log + notes
const evidenceLogHeader = (NAME) => `# 📜 ${NAME} — Evidence & Source Log
#${NAME} #EvidenceLog

| Date Added | Source Type | Title / Description | Tags | Notes |
|------------|-------------|---------------------|------|-------|
`;

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

const projectDashboard = (NAME) => `# 📊 Project Dashboard — ${NAME}
#${NAME} #Dashboard

## Core Notes
- [Evidence Log](bear://x-callback-url/search?term=%23${NAME}%20AND%20%23EvidenceLog)
- [Smart Search Index](bear://x-callback-url/open-note?title=SmartSearch_Index)

## Quick Commands
\`\`\`bash
make run-js
make run-tests
make watch-js
make dev-3
make log-tail
\`\`\`

## Common Filters (Bear)
- [Active Tasks](bear://x-callback-url/search?term=%23${NAME}%20AND%20%23ToDo)
- [Confirmed Evidence](bear://x-callback-url/search?term=%23${NAME}%20AND%20%23Confirmed)
- [Code](bear://x-callback-url/search?term=%23${NAME}%20AND%20%23Code)
- [Datasets](bear://x-callback-url/search?term=%23${NAME}%20AND%20%23Dataset)
- [Bugs](bear://x-callback-url/search?term=%23${NAME}%20AND%20%23Bug)
`;

// Dataset wrangling scratchpad — functional JS utilities (FIX: previously missing)
const datasetScratchpad = `# 🛠 Dataset Wrangling Scratchpad
#Dataset #CodeRecipes

## CSV → Array of Objects
\`\`\`javascript
const parseCsv = (text) => {
  const [header, ...rows] = text.trim().split(/\\r?\\n/).map(r => r.split(','));
  return rows.map(r => Object.fromEntries(r.map((v, i) => [header[i], v])));
};
\`\`\`

## JSON file → Object
\`\`\`javascript
import { readFile } from 'node:fs/promises';
const obj = JSON.parse(await readFile('data.json', 'utf8'));
\`\`\`

## NDJSON (newline-delimited JSON) → Array
\`\`\`javascript
import { readFile } from 'node:fs/promises';
const rows = (await readFile('data.ndjson', 'utf8'))
  .trim().split(/\\n+/)
  .map(line => JSON.parse(line));
\`\`\`

## Array of Objects → CSV
\`\`\`javascript
const toCsv = (arr) => {
  if (!arr.length) return '';
  const header = Object.keys(arr[0]);
  const rows = arr.map(obj => header.map(k => obj[k]).join(','));
  return [header.join(','), ...rows].join('\\n');
};
\`\`\`

## Filter rows by value
\`\`\`javascript
const filterBy = (arr, key, value) => arr.filter(r => r[key] === value);
\`\`\`
`;

// tests
const testRunner = `// tests/run_tests.mjs
import { spawn } from 'node:child_process';

const run = (cmd, args=[]) => new Promise(resolve => {
  const ps = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  ps.stdout.on('data', d => out += d.toString());
  ps.stderr.on('data', d => out += d.toString());
  ps.on('close', code => resolve({ code, out }));
});

const approx = (a, b, eps=1e-9) => Math.abs(a - b) <= eps;

const main = async () => {
  const { code, out } = await run(process.execPath, ['assets/code/sample_csv_stats.mjs']);
  if (code !== 0) {
    console.log('❌ Script exited non-zero. Output:');
    console.log(out);
    process.exit(1);
  }
  let json;
  try { json = JSON.parse(out); }
  catch (e) {
    console.log('❌ Output was not valid JSON:', e.message);
    console.log(out);
    process.exit(1);
  }
  const has = ['count','sum','mean','by_category'].every(k => Object.hasOwn(json, k));
  if (!has) { console.log('❌ Missing required keys'); process.exit(1); }
  const { count, sum, mean } = json;
  const expected = count > 0 ? sum / count : 0;
  if (!approx(mean, expected)) {
    console.log('❌ mean != sum/count', { mean, sum, count, expected });
    process.exit(1);
  }
  console.log('✅ Tests passed.');
  console.log(JSON.stringify({ ok: true, count, sum, mean }, null, 2));
  process.exit(0);
};

main().catch(e => { console.error(e); process.exit(1); });
`;

// Makefile (hyphen targets + NeoVim panes) — uses single quotes in -c to avoid nested-quote issues
const makefileFor = (NAME) => `# Makefile — ${NAME} Node-only demo
SHELL := /bin/bash

JS_FILE    ?= assets/code/sample_csv_stats.mjs
EVIDENCE   ?= notes/${NAME}_EvidenceLog.md

.PHONY: help run-js watch-js log-tail run-tests dev dev-3 dev-tests

help: ## Show available targets
\t@grep -E '^[a-zA-Z0-9_.-]+:.*?## ' $(MAKEFILE_LIST) | sed 's/:.*##/: /' | sort

run-js: ## Run Node demo, log output, append Evidence Log
\t@mkdir -p logs
\t@ts=$$(date +%Y%m%d_%H%M%S); \\
\t  out="logs/run_$$ts.log"; \\
\t  node $(JS_FILE) > "$$out" 2>&1; status=$$?; \\
\t  cat "$$out"; \\
\t  node tools/append_evidence_row.mjs --log $(EVIDENCE) --label $$(basename $(JS_FILE)) --status $$status --input "$$out"; \\
\t  exit $$status

watch-js: ## Watch JS file; on save: run → log → append
\t@node tools/watch_and_log_node.mjs --file $(JS_FILE) --run "node $(JS_FILE)" --log $(EVIDENCE) --label $$(basename $(JS_FILE))

run-tests: ## Run tests; log pass/fail; append Evidence Log
\t@mkdir -p logs
\t@ts=$$(date +%Y%m%d_%H%M%S); \\
\t  out="logs/run_$$ts.log"; \\
\t  node tests/run_tests.mjs > "$$out" 2>&1; status=$$?; \\
\t  cat "$$out"; \\
\t  node tools/append_evidence_row.mjs --log $(EVIDENCE) --label tests --status $$status --input "$$out"; \\
\t  exit $$status

log-tail: ## Show the newest run log
\t@bash -lc 'tail -n 40 "$$(ls -1t logs/run_*.log 2>/dev/null | head -n 1)"'

dev: ## NeoVim: Evidence Log (L) + watcher (R)
\t@nvim "$(EVIDENCE)" -c 'vsplit | terminal make watch-js'

dev-3: ## NeoVim: Evidence Log (L), watcher (TR), newest log tail (BR)
\t@nvim "$(EVIDENCE)" \\
\t  -c 'vsplit | terminal make watch-js' \\
\t  -c 'wincmd h | botright split | terminal bash tools/tail_latest.sh'

dev-tests: ## NeoVim: Evidence Log (L), run-tests (TR), newest log tail (BR)
\t@nvim "$(EVIDENCE)" \\
\t  -c 'vsplit | terminal make run-tests' \\
\t  -c 'wincmd h | botright split | terminal bash tools/tail_latest.sh'
`;

// ---------- Builder ----------
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
  await write(join(root, "tools/tail_latest.sh"), tailLatestSh);
  try {
    await fs.chmod(join(root, "tools/tail_latest.sh"), 0o755);
  } catch {}
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
  await write(join(root, "tests/run_tests.mjs"), testRunner);
  await write(join(root, "Makefile"), makefileFor(NAME));
  return root;
};

const main = async () => {
  for (const k of ["PROJECT_NAME", "DEMO_JS_AsyncPatterns"]) {
    const root = await makeKit(k);
    console.log(`✅ Created ${root}`);
    console.log(
      `Next steps:\n` +
        `  cd ${basename(root)}\n` +
        `  make run-js\n` +
        `  make run-tests   # tests → log pass/fail → append\n` +
        `  make watch-js    # re-run on save → log → append\n` +
        `  make dev-3       # 3-pane NeoVim mission control\n` +
        `  make log-tail    # tail latest run`,
    );
    console.log("---");
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
