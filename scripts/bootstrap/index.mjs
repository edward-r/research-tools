#!/usr/bin/env node
/**
 * Orchestrator: builds kits to the repo root (or --out PATH)
 * Defaults: PROJECT_NAME and DEMO_JS_AsyncPatterns
 */

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { promises as fs } from "node:fs";
import { bootstrapMixedKit } from "./mixed_kit.mjs";
import { makefileFor } from "./makefile_templates.mjs";
import { makefileTasksTemplate } from "./makefile_tasks_template.mjs";

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

const writeText = async (p, s) => {
  await fs
    .mkdir(p.substring(0, p.lastIndexOf("/")), { recursive: true })
    .catch(() => {});
  await fs.writeFile(p, s, "utf8");
};

async function writeKitGlue(rootDir, kitName) {
  // Generate guarded Makefile and per-kit makefile_tasks.mjs
  await writeText(join(rootDir, "Makefile"), makefileFor(kitName));
  await writeText(join(rootDir, "makefile_tasks.mjs"), makefileTasksTemplate());
  await fs.chmod(join(rootDir, "makefile_tasks.mjs"), 0o755);
  console.log(
    `✅ Wrote kit files → ${kitName}/Makefile, ${kitName}/makefile_tasks.mjs`,
  );
}

(async function main() {
  const args = parseArgs();
  const list = (
    args.kits ? args.kits.split(",") : ["PROJECT_NAME", "DEMO_JS_AsyncPatterns"]
  )
    .map((s) => s.trim())
    .filter(Boolean);

  const outBase = args.out ? args.out : process.cwd();
  console.log(`➡️  Bootstrap kits → ${outBase}`);

  for (const NAME of list) {
    // bootstrapMixedKit appends _NODEONLY
    const root = await bootstrapMixedKit(here, NAME, outBase);
    const kitName = `${NAME}_NODEONLY`;
    console.log(`\n✅ Created kit directory: ${root}`);
    await writeKitGlue(root, kitName);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
