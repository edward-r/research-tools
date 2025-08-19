#!/usr/bin/env node
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
