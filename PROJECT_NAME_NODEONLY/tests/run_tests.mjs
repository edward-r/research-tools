#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
const run = (cmd,args)=>spawnSync(cmd,args,{encoding:'utf8'});
const { status, stdout, stderr } = run(process.execPath,['assets/code/sample_csv_stats.mjs']);
if (status!==0) { console.error(stderr||stdout); process.exit(status); }
let o; try { o = JSON.parse(stdout); } catch { console.error('Output is not JSON'); process.exit(2); }
if (typeof o.count!=='number' || typeof o.sum!=='number') { console.error('Missing fields'); process.exit(3); }
console.log('OK: JS tests passed');
