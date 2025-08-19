#!/usr/bin/env node
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
  return `${d.getFullYear()}${P(d.getMonth()+1)}${P(d.getDate())}_${P(d.getHours())}${P(d.getMinutes())}${P(d.getSeconds())}`;
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
    const outFile = `logs/run_${ts()}.log`;
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
