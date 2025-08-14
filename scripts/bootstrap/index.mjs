#!/usr/bin/env node
/**
 * Orchestrator: builds mixed kits (Node + Python + research add‑ons).
 * Default kits: PROJECT_NAME_NODEONLY, DEMO_JS_AsyncPatterns_NODEONLY
 *
 * Usage:
 *   node scripts/bootstrap/index.mjs
 *   node scripts/bootstrap/index.mjs --kits PROJECT_NAME,DEMO_JS_AsyncPatterns
 */

import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { bootstrapMixedKit } from "./mixed_kit.mjs";

const here = dirname(fileURLToPath(import.meta.url));

const parseArgs = () =>
  Object.fromEntries(
    process.argv
      .slice(2)
      .map((a, i, arr) =>
        a.startsWith("--") ? [a.slice(2), arr[i + 1]] : null,
      )
      .filter(Boolean),
  );

(async function main() {
  const args = parseArgs();
  const kits = (
    args.kits ? args.kits.split(",") : ["PROJECT_NAME", "DEMO_JS_AsyncPatterns"]
  )
    .map((s) => s.trim())
    .filter(Boolean);

  // Optional: allow --out /absolute/or/relative/path
  const outBase = args.out ? args.out : undefined;

  for (const NAME of kits) {
    const root = await bootstrapMixedKit(here, NAME, outBase);
    console.log(`✅ Created ${root}`);
    console.log(
      `Next steps:\n` +
        `  cd ${root}\n` +
        `  make run-js && make run-tests\n` +
        `  make run-py && make run-tests-py\n` +
        `  make dev-3\n` +
        `  make pack-context NAME=my_context\n---`,
    );
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
