#!/usr/bin/env node
// CI watcher demo: bootstrap DEMO kit, run JS+PY watchers once, verify logs.

import { spawn, execSync } from "node:child_process";
import { promises as fs } from "node:fs";
import { join } from "node:path";

const KIT = process.env.KIT || "DEMO_JS_AsyncPatterns_NODEONLY";
const JS_FILE = "assets/code/sample_csv_stats.mjs";
const PY_FILE = "assets/code_py/sample_llm_primitives.py";
const EVIDENCE = "notes/DEMO_JS_AsyncPatterns_EvidenceLog.md";

const sh = (cmd, args = [], opts = {}) =>
  new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: "inherit", shell: false, ...opts });
    p.on("close", (code) => resolve(code));
  });

const fileExists = async (p) => !!(await fs.stat(p).catch(() => null));

const hasPython = () => {
  try {
    execSync("python3 --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

(async () => {
  // 1) Bootstrap kits if missing
  if (!(await fileExists(KIT))) {
    const code = await sh(process.execPath, ["scripts/bootstrap/index.mjs"]);
    if (code !== 0) process.exit(code);
  }

  // 2) Start JS watcher, trigger change, stop
  {
    const cwd = KIT;
    const watcher = spawn(
      process.execPath,
      [
        "tools/watch_and_log_node.mjs",
        "--file",
        JS_FILE,
        "--run",
        `node ${JS_FILE}`,
        "--log",
        EVIDENCE,
        "--label",
        JS_FILE.split("/").pop(),
      ],
      { cwd, stdio: ["ignore", "pipe", "pipe"] },
    );

    await new Promise((r) => setTimeout(r, 1200));
    await fs.appendFile(join(cwd, JS_FILE), "\n"); // trigger
    await new Promise((r) => setTimeout(r, 2500));
    watcher.kill("SIGTERM");
  }

  // 3) Conditionally start PY watcher
  if (hasPython()) {
    const cwd = KIT;
    const watcher = spawn(
      process.execPath,
      [
        "tools/watch_and_log_node.mjs",
        "--file",
        PY_FILE,
        "--run",
        `python3 ${PY_FILE}`,
        "--log",
        EVIDENCE,
        "--label",
        PY_FILE.split("/").pop(),
      ],
      { cwd, stdio: ["ignore", "pipe", "pipe"] },
    );

    await new Promise((r) => setTimeout(r, 1200));
    await fs.appendFile(join(cwd, PY_FILE), "\n"); // trigger
    await new Promise((r) => setTimeout(r, 2500));
    watcher.kill("SIGTERM");
  } else {
    console.log("⚠️ python3 not found, skipping Python watcher demo.");
  }

  // 4) Verify logs exist
  const logsDir = join(KIT, "logs");
  const files = (await fs.readdir(logsDir).catch(() => [])).filter(
    (f) => f.startsWith("run_") && f.endsWith(".log"),
  );

  console.log(`Logs produced: ${files.length}`);
  if (files.length < 1) {
    console.error("ERROR: No logs produced by watcher demo.");
    process.exit(1);
  }

  // Print tail of newest log
  files.sort().reverse();
  const newest = join(logsDir, files[0]);
  const tail = (await fs.readFile(newest, "utf8"))
    .split(/\r?\n/)
    .slice(-60)
    .join("\n");
  console.log("== tail of newest log ==\n" + tail);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
