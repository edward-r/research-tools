// tests/run_tests.mjs
import { spawn } from 'node:child_process';
const run=(c,a=[])=>new Promise(r=>{const p=spawn(c,a,{stdio:['ignore','pipe','pipe']});let out='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>out+=d);p.on('close',code=>r({code,out}))});
const main=async()=>{
  const {code,out}=await run(process.execPath,['assets/code/sample_csv_stats.mjs']);
  if(code!==0){ console.log('❌ non-zero'); console.log(out); process.exit(1); }
  let j; try{ j=JSON.parse(out);}catch(e){ console.log('❌ not JSON',e.message); console.log(out); process.exit(1); }
  const need=['count','sum','mean','by_category']; if(!need.every(k=>Object.hasOwn(j,k))){ console.log('❌ missing keys'); process.exit(1); }
  const exp=j.count>0? j.sum/j.count : 0; if(Math.abs(j.mean-exp)>1e-9){ console.log('❌ mean!=sum/count'); process.exit(1); }
  console.log('✅ JS tests passed'); process.exit(0);
};
main().catch(e=>{ console.error(e); process.exit(1); });
