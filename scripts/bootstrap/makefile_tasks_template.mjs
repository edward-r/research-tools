// Emits the full text of per-kit makefile_tasks.mjs (no external deps).
// Used by scripts/bootstrap/index.mjs.

export function makefileTasksTemplate() {
  return `#!/usr/bin/env node
/**
 * makefile_tasks.mjs — kit-local task wrappers (functional, no classes)
 * Guards (directory creation, Evidence Log seeding) live in the Makefile.
 * These helpers just run commands and small utilities.
 */

import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { join, basename } from 'node:path';

const sh = (cmd, args = [], opts = {}) =>
  new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: false, ...opts });
    p.on('close', (code) => resolve(code));
  });

const shCap = (cmd, args = [], opts = {}) =>
  new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: false, ...opts });
    let out = '';
    p.stdout.on('data', (d) => (out += d.toString()));
    p.stderr.on('data', (d) => (out += d.toString()));
    p.on('close', (code) => resolve({ code, out }));
  });

const exists = async (p) => !!(await fs.stat(p).catch(() => null));
const readText = (p) => fs.readFile(p, 'utf8').catch(() => '');

const kitName = () => basename(process.cwd());

const defaults = {
  JS_FILE: process.env.JS_FILE || 'assets/code/sample_csv_stats.mjs',
  PY_FILE: process.env.PY_FILE || 'assets/code_py/sample_llm_primitives.py',
  EVIDENCE: process.env.EVIDENCE || join('notes', kitName() + '_EvidenceLog.md'),
};

/* ---------- Public tasks (invoked by Make or CLI) ---------- */
export const runJS   = async (f = defaults.JS_FILE) => sh(process.execPath, [f]);
export const runPy   = async (f = defaults.PY_FILE) => sh('python3', [f]);
export const watchJS = async (f = defaults.JS_FILE, ev = defaults.EVIDENCE) =>
  sh(process.execPath, ['tools/watch_and_log_node.mjs', '--file', f, '--run', \`node \${f}\`, '--log', ev, '--label', basename(f)]);
export const watchPy = async (f = defaults.PY_FILE, ev = defaults.EVIDENCE) =>
  sh(process.execPath, ['tools/watch_and_log_node.mjs', '--file', f, '--run', \`python3 \${f}\`, '--log', ev, '--label', basename(f)]);

export const jsonToCsv = async (inPath, outPath = 'out.csv') => {
  if (!inPath) { console.error('jsonToCsv: --file required'); return 2; }
  const { code, out } = await shCap(process.execPath, ['tools/json_to_csv.mjs', '--file', inPath]);
  if (code !== 0) return code;
  await fs.writeFile(outPath, out, 'utf8');
  process.stdout.write(\`Wrote \${outPath}\\n\`);
  return 0;
};

/* ---------- Tiny CLI so you can call without Make ---------- */
const kv = () =>
  Object.fromEntries(
    process.argv
      .slice(3)
      .map((a, i, xs) => (a.startsWith('--') ? [a.slice(2), xs[i + 1]] : null))
      .filter(Boolean),
  );

if (import.meta.url === 'file://' + process.argv[1]) {
  const cmd = process.argv[2] || '';
  const args = kv();
  const main = async () => {
    if (cmd === 'run-js')      return await runJS(args.js || defaults.JS_FILE);
    if (cmd === 'watch-js')    return await watchJS(args.js || defaults.JS_FILE, args.evidence || defaults.EVIDENCE);
    if (cmd === 'run-py')      return await runPy(args.py || defaults.PY_FILE);
    if (cmd === 'watch-py')    return await watchPy(args.py || defaults.PY_FILE, args.evidence || defaults.EVIDENCE);
    if (cmd === 'json-to-csv') return await jsonToCsv(args.file, args.out || 'out.csv');

    console.log([
      'Usage:',
      '  node makefile_tasks.mjs run-js [--js assets/code/sample_csv_stats.mjs]',
      '  node makefile_tasks.mjs watch-js [--js <file>] [--evidence notes/<KIT>_EvidenceLog.md]',
      '  node makefile_tasks.mjs run-py [--py assets/code_py/sample_llm_primitives.py]',
      '  node makefile_tasks.mjs watch-py [--py <file>] [--evidence ...]',
      '  node makefile_tasks.mjs json-to-csv --file assets/metadata/articles_index.jsonl [--out out.csv]',
      ''
    ].join('\\n'));
    return 0;
  };
  main().then((c) => process.exit(c || 0)).catch((e) => { console.error(e); process.exit(1); });
}
`;
}
