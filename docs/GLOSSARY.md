# Glossary

**Kit** — self-contained research workspace (code, data, logs, notes).  
**Bootstrap** — script that generates kits from templates.  
**Guard** — Makefile rule `.ensure-kit` that prepares dirs + Evidence header.  
**Evidence Log** — Markdown table in `notes/*EvidenceLog.md` with one row per run.  
**Watcher** — `tools/watch_and_log_node.mjs` re-runs on save and appends Evidence.  
**Registry** — JSONL files under `assets/metadata/` (e.g., `references_index.jsonl`).  
**Context pack** — zip of notes + metadata for LLM tools (`pack-context`).  
**Node-only** — kits rely solely on Node scripts; Python lane is optional.  
**CI artifacts** — logs and Evidence notes uploaded by GitHub Actions.
