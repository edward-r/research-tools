# Developer Reference

This document explains **how the system works** at a code level.

## Bootstrap Layer

- `scripts/bootstrap/index.mjs`

  - Parses `--kits`, `--out`, and `--force`.
  - Calls `bootstrapMixedKit(here, NAME, outBase, { force })`.
  - Writes into the **returned absolute kit directory**:
    - `Makefile` (from `makefile_templates.mjs`)
    - `makefile_tasks.mjs` (from `makefile_tasks_template.mjs`)
  - Uses **absolute paths** in logs.

- `scripts/bootstrap/mixed_kit.mjs`

  - Creates `NAME_NODEONLY` under `--out` or CWD.
  - Guard: if directory is **non-empty** and no `--force`, **skip** (idempotent).
  - Ensures seed directories: `notes/`, `logs/`, `assets/**`, `tools/`, `tests/`.
  - Returns **absolute** `kitRoot`.

- `scripts/bootstrap/makefile_templates.mjs`

  - `makefileFor(NAME)` returns a **guarded kit Makefile**:
    - `.ensure-kit` creates dirs + seeds Evidence Log header.
    - All targets call `.ensure-kit` before work.
    - Targets: JS/Py lanes, ingest tools, transcripts, packaging, dev UX, smoke tests.

- `scripts/bootstrap/makefile_tasks_template.mjs`
  - `makefileTasksTemplate()` returns **functional** JS with small task wrappers:
    - `runJS`, `watchJS`, `runPy`, `watchPy`, `importYouTube`, `importPodcast`, `importWeb`, `jsonToCsv`, etc.
  - Also a tiny CLI mode for quick calls without Make.

## Per-Kit Layout

```
<KIT>/
  Makefile                 # guarded (recipes call .ensure-kit)
  makefile_tasks.mjs       # functional wrappers (no guards here)
  notes/
    <KIT>_EvidenceLog.md   # table header + appended rows
    exports/               # transcript exports (md, txt, jsonl)
  logs/
    run_*.log              # per-run logs (tail with log.tail)
  assets/
    code/                  # JS examples
    metadata/
      *.jsonl              # registries and custom indexes
      transcripts/*.jsonl  # imported/cleaned transcripts
    images/                # frames, GIF stubs
    articles/              # saved markdowns
  tools/
    append_evidence_row.mjs
    watch_and_log_node.mjs
    json_to_csv.mjs
    (optional) metadata_ingest.mjs, registry_rebuild.mjs, transcript_* etc.
  tests/
    run_tests.mjs, run_tests_py.py (optional)
```

## Guard Pattern

- **Makefiles own guards** (directories + Evidence Log init).
- **Node scripts do work** and assume the environment exists.

This split keeps boot time reliable and scripts focused.

## Evidence Log Format

```
| Date Added | Source Type | Title / Description | Tags | Notes |
|------------|-------------|---------------------|------|-------|
| 2025-08-19 | Code        | sample_csv_stats.mjs run | #Code #Experiment #Confirmed | Output: {…tail of latest log…} |
```

Rows are appended by `tools/append_evidence_row.mjs` after each run.

## Functional Utilities (no classes)

Prefer small helpers, example:

```javascript
// tools/json_to_csv.mjs (snippet)
import { promises as fs } from "node:fs";

const parseJsonl = async (p) =>
  (await fs.readFile(p, "utf8"))
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));

const toCsv = (rows) => {
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const esc = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const head = keys.join(",");
  const body = rows.map((r) => keys.map((k) => esc(r[k])).join(",")).join("\n");
  return `${head}\n${body}\n`;
};

const main = async () => {
  const file = process.argv[2];
  const rows = await parseJsonl(file);
  process.stdout.write(toCsv(rows));
};
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

## CI Overview

- `.github/workflows/node.yml`
  - Node setup + cache
  - Optional Python setup + pip cache
  - Smoke jobs can call `make ingest:smoke` and `make ingest:smoke:transcript`
  - Guarded kits prevent failures on fresh runners

See comments in the workflow for matrix/toggles.
