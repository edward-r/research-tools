#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';

const kv=()=>Object.fromEntries(process.argv.slice(2).map((a,i,x)=>a.startsWith('--')?[a.slice(2),x[i+1]]:null).filter(Boolean));

const main = async () => {
  const { file, every='10', outdir='assets/images' } = kv();
  if (!file) { console.error('Usage: node tools/video_frames_sample.mjs --file <video> --every <N seconds> --outdir assets/images'); process.exit(2); }
  await fs.mkdir(outdir, { recursive:true });
  const vf = `fps=1/\${every}`;             // keep as literal template at runtime
  const out = `${outdir}/frame_%05d.jpg`;   // literal %05d is fine
  const args = ['-hide_banner','-i', file, '-vf', vf, out];
  const { status, stderr } = spawnSync('ffmpeg', args, { encoding:'utf8' });
  if (status!==0) { console.error(stderr || 'ffmpeg failed'); process.exit(status||1); }
  console.log('Frames extracted to', outdir);
};
main().catch(e=>{ console.error(e); process.exit(1); });
