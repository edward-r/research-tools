// tools/append_evidence_row.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const argv = Object.fromEntries(
  process.argv.slice(2).map((a,i,arr)=>a.startsWith('--')? [a.replace(/^--/, ''), arr[i+1]]: null).filter(Boolean)
);

const tailLines = async (path, n=4) => {
  try {
    const text = await readFile(path, 'utf8');
    const lines = text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    return lines.slice(-n).join(' / ');
  } catch {
    return '(no log found)';
  }
};

const today = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
};

const main = async () => {
  const { log, label, status, input } = argv;
  if (!log || !label || typeof status === 'undefined' || !input) {
    console.error('Usage: node tools/append_evidence_row.mjs --log <path> --label <text> --status <code> --input <logfile>');
    process.exit(2);
  }
  const statusTag = String(status) === '0' ? '#Confirmed' : '#Bug';
  const summary = await tailLines(input, 4);
  const row = `| ${today()} | Code | ${label} run | #Code #Experiment ${statusTag} | Output: {${summary}} |\n`;

  await mkdir(dirname(log), { recursive: true });
  let prev = '';
  try { prev = await readFile(log, 'utf8'); } catch {}
  await writeFile(log, prev + row, 'utf8');
  process.stdout.write(row);
};

main().catch(e => { console.error(e); process.exit(1); });
