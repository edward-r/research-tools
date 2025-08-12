// tests/run_tests.mjs
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
