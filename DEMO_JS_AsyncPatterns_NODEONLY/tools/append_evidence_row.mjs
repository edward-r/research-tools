// tools/append_evidence_row.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
const args = Object.fromEntries(process.argv.slice(2).map((a,i,arr)=>a.startsWith('--')?[a.slice(2),arr[i+1]]:null).filter(Boolean));
const tailLines = async (p,n=4)=>{try{const t=await readFile(p,'utf8');const ls=t.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);return ls.slice(-n).join(' / ');}catch{return '(no log found)';}};
const today = ()=>{const d=new Date(),pad=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;};
const main = async () => {
  const { log, label, status, input } = args;
  if(!log||!label||typeof status==='undefined'||!input){ console.error('Usage: --log <path> --label <text> --status <code> --input <logfile>'); process.exit(2); }
  const statusTag = String(status)==='0' ? '#Confirmed' : '#Bug';
  const summary = await tailLines(input, 6);
  const row = `| ${today()} | Code | ${label} run | #Code #Experiment ${statusTag} | Output: {${summary}} |\n`;
  await mkdir(dirname(log), { recursive: true });
  let prev=''; try{ prev=await readFile(log,'utf8'); }catch{}
  await writeFile(log, prev+row, 'utf8'); process.stdout.write(row);
};
main().catch(e=>{ console.error(e); process.exit(1); });
