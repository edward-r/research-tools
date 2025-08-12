// tools/watch_and_log_node.mjs — watch a file, re-run on save, append Evidence Log
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
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
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
    const logFile = `logs/run_${ts}.log`;
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
