#!/usr/bin/env node
/**
 * CI demo watcher — optional. If present, CI runs it; otherwise skipped.
 * Here we just run each kit's JS once to prove the loop works.
 */
import { spawnSync } from "node:child_process";

const kits = ["PROJECT_NAME_NODEONLY", "DEMO_JS_AsyncPatterns_NODEONLY"].filter(
  Boolean,
);

const run = (cwd, target) => {
  console.log(`\n[watcher_demo] ${cwd} → make ${target}`);
  const { status, stdout, stderr } = spawnSync("make", [target], {
    cwd,
    encoding: "utf8",
  });
  process.stdout.write(stdout || "");
  process.stderr.write(stderr || "");
  if (status !== 0) process.exit(status);
};

for (const k of kits) {
  run(k, "run-js");
  run(k, "run-tests");
}
console.log("\nwatcher_demo: OK");
