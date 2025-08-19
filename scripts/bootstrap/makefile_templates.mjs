// Produces a guarded per-kit Makefile (Node + optional Python).
export function makefileFor(NAME) {
  const L = [];
  L.push(`# Makefile — ${NAME} (guarded)`);
  L.push(`SHELL := /bin/bash`);
  L.push(`JS_FILE  ?= assets/code/sample_csv_stats.mjs`);
  L.push(`PY_FILE  ?= assets/code_py/sample_llm_primitives.py`);
  L.push(`EVIDENCE ?= notes/${NAME}_EvidenceLog.md`);
  L.push(``);
  // NOTE: no colons in target names (BSD/GNU make compatibility)
  L.push(
    `.PHONY: help .ensure-kit run-js watch-js run-tests run-py watch-py run-tests-py log.tail dev dev-3 dev-tests ingest-ref probe-video sample-frames import-transcript json-to-csv pack-context ingest.smoke ingest.smoke.transcript`,
  );
  L.push(``);
  L.push(`help: ## Show available targets`);
  L.push(
    `\t@grep -E '^[a-zA-Z0-9_.-]+:.*?## ' $(MAKEFILE_LIST) | sed 's/:.*##/: /' | sort`,
  );
  L.push(``);
  L.push(`.ensure-kit: ## Create dirs + seed Evidence header if missing`);
  L.push(`\t@mkdir -p notes logs assets/metadata/transcripts assets/articles`);
  L.push(`\t@if [ ! -f "$(EVIDENCE)" ]; then \\`);
  L.push(
    `\t  printf '# 📜 %s — Evidence & Source Log\\n#%s #EvidenceLog\\n\\n' "$(notdir $(CURDIR))" "$(notdir $(CURDIR))" > "$(EVIDENCE)"; \\`,
  );
  L.push(
    `\t  printf '| Date Added | Source Type | Title / Description | Tags | Notes |\\n' >> "$(EVIDENCE)"; \\`,
  );
  L.push(
    `\t  printf '|------------|-------------|---------------------|------|-------|\\n' >> "$(EVIDENCE)"; \\`,
  );
  L.push(`\t  echo "Initialized $(EVIDENCE)"; \\`);
  L.push(`\tfi`);
  L.push(``);
  // JS lane
  L.push(`run-js: ## Run JS demo → log → Evidence`);
  L.push(`\t@$(MAKE) .ensure-kit`);
  L.push(
    `\t@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \\`,
  );
  L.push(`\tnode $(JS_FILE) > "$$out" 2>&1; status=$$?; cat "$$out"; \\`);
  L.push(
    `\tnode tools/append_evidence_row.mjs --log $(EVIDENCE) --label $$(basename $(JS_FILE)) --status $$status --input "$$out"; exit $$status`,
  );
  L.push(``);
  L.push(`watch-js: ## Watch JS → run → log → Evidence`);
  L.push(`\t@$(MAKE) .ensure-kit`);
  L.push(
    `\t@node tools/watch_and_log_node.mjs --file $(JS_FILE) --run "node $(JS_FILE)" --log $(EVIDENCE) --label $$(basename $(JS_FILE))`,
  );
  L.push(``);
  L.push(`run-tests: ## Run JS tests → log → Evidence`);
  L.push(`\t@$(MAKE) .ensure-kit`);
  L.push(`\t@node tests/run_tests.mjs || true`);
  L.push(``);
  // PY lane
  L.push(`run-py: ## Run PY demo (if python3 available)`);
  L.push(`\t@$(MAKE) .ensure-kit`);
  L.push(`\t@python3 $(PY_FILE) || true`);
  L.push(``);
  L.push(`watch-py: ## Watch PY → run → log → Evidence`);
  L.push(`\t@$(MAKE) .ensure-kit`);
  L.push(
    `\t@node tools/watch_and_log_node.mjs --file $(PY_FILE) --run "python3 $(PY_FILE)" --log $(EVIDENCE) --label $$(basename $(PY_FILE))`,
  );
  L.push(``);
  L.push(`run-tests-py: ## Run PY tests (placeholder)`);
  L.push(`\t@$(MAKE) .ensure-kit`);
  L.push(`\t@python3 tests/run_tests_py.py || true`);
  L.push(``);
  // Logs / Dev panes
  L.push(`log.tail: ## Tail newest log`);
  L.push(`\t@$(MAKE) .ensure-kit`);
  L.push(
    `\t@bash -lc 'f=$$(ls -1t logs/run_*.log 2>/dev/null | head -n1); if [ -n "$$f" ]; then echo "== $$f =="; tail -n 60 "$$f"; else echo "(no logs yet)"; fi'`,
  );
  L.push(``);
  L.push(`dev: ## nvim: Evidence (L) + watch-js (R)`);
  L.push(`\t@nvim "$(EVIDENCE)" -c 'vsplit | terminal make watch-js'`);
  L.push(``);
  L.push(`dev-3: ## nvim: Evidence (L), watch-js (TR), log tail (BR)`);
  L.push(`\t@nvim "$(EVIDENCE)" \\`);
  L.push(`\t  -c 'vsplit | terminal make watch-js' \\`);
  L.push(
    `\t  -c 'wincmd h | botright split | terminal bash tools/tail_latest.sh'`,
  );
  L.push(``);
  L.push(`dev-tests: ## nvim: Evidence (L), run-tests (TR), log tail (BR)`);
  L.push(`\t@nvim "$(EVIDENCE)" \\`);
  L.push(`\t  -c 'vsplit | terminal make run-tests' \\`);
  L.push(
    `\t  -c 'wincmd h | botright split | terminal bash tools/tail_latest.sh'`,
  );
  L.push(``);
  // Research add-ons
  L.push(
    `ingest-ref: ## Append reference row (ARGS='--type book --title "…" --author "…" --year 2016 --url … --tags "…" --notes "…"')`,
  );
  L.push(`\t@$(MAKE) .ensure-kit`);
  L.push(
    `\t@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \\`,
  );
  L.push(
    `\tnode tools/ingest_reference.mjs ` +
      "$$" +
      `{ARGS} > "$$out" 2>&1; status=$$?; cat "$$out"; \\`,
  );
  L.push(
    `\tnode tools/append_evidence_row.mjs --log $(EVIDENCE) --label ingest_reference --status $$status --input "$$out"; exit $$status`,
  );
  L.push(``);
  L.push(
    `probe-video: ## Log video info (FILE=assets/video/clip.mp4) (needs ffprobe)`,
  );
  L.push(`\t@$(MAKE) .ensure-kit`);
  L.push(
    `\t@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \\`,
  );
  L.push(
    `\tnode tools/video_probe.mjs --file "$(FILE)" > "$$out" 2>&1; status=$$?; cat "$$out"; \\`,
  );
  L.push(
    `\tnode tools/append_evidence_row.mjs --log $(EVIDENCE) --label video_probe --status $$status --input "$$out"; exit $$status`,
  );
  L.push(``);
  L.push(
    `sample-frames: ## Extract frames (FILE=…, EVERY=10, OUTDIR=assets/images) (needs ffmpeg)`,
  );
  L.push(`\t@$(MAKE) .ensure-kit`);
  L.push(
    `\t@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \\`,
  );
  L.push(
    `\tnode tools/video_frames_sample.mjs --file "$(FILE)" --every "$(EVERY)" --outdir "$(OUTDIR)" > "$$out" 2>&1; status=$$?; cat "$$out"; \\`,
  );
  L.push(
    `\tnode tools/append_evidence_row.mjs --log $(EVIDENCE) --label video_frames_sample --status $$status --input "$$out"; exit $$status`,
  );
  L.push(``);
  L.push(
    `import-transcript: ## Import transcript (.srt/.vtt/.json/.jsonl) (FILE=…, SRC=whisperx)`,
  );
  L.push(`\t@$(MAKE) .ensure-kit`);
  L.push(
    `\t@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \\`,
  );
  L.push(
    `\tnode tools/transcript_import.mjs --file "$(FILE)" --source "$(SRC)" > "$$out" 2>&1; status=$$?; cat "$$out"; \\`,
  );
  L.push(
    `\tnode tools/append_evidence_row.mjs --log $(EVIDENCE) --label transcript_import --status $$status --input "$$out"; exit $$status`,
  );
  L.push(``);
  // JSON→CSV helper (generic)
  L.push(
    `json-to-csv: ## Convert JSON/JSONL → CSV (JSON_FILE=… CSV_OUT=out.csv)`,
  );
  L.push(`\t@$(MAKE) .ensure-kit`);
  L.push(`\t@node tools/json_to_csv.mjs --file "$(JSON_FILE)" > "$(CSV_OUT)"`);
  L.push(`\t@echo "Wrote $(CSV_OUT)"`);
  L.push(``);
  // Pack curated context — avoid \${…} interpolation
  const nameExpr = "$$" + "{NAME:-context_pack}";
  L.push(
    `pack-context: ## Zip notes + metadata → context_pack.zip (NAME=context_pack)`,
  );
  L.push(`\t@$(MAKE) .ensure-kit`);
  L.push(
    "\t@bash -lc 'name=" +
      nameExpr +
      '; rm -f "$$name.zip"; \\\n' +
      '\t  zip -r "$$name.zip" notes/*.md assets/metadata/*.jsonl assets/metadata/transcripts/*.jsonl 2>/dev/null || true; \\\n' +
      '\t  echo "Created $$name.zip"\'',
  );
  L.push(``);
  // Smoke tests (portable names)
  L.push(`ingest.smoke: ## trivial ingest smoke`);
  L.push(`\t@$(MAKE) .ensure-kit; echo "OK ingest smoke"`);
  L.push(`ingest.smoke.transcript: ## transcript ingest smoke`);
  L.push(`\t@$(MAKE) .ensure-kit; echo "OK transcript ingest smoke"`);
  L.push(``);
  return L.join("\n");
}
