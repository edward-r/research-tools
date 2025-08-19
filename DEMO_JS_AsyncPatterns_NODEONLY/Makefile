# Makefile — DEMO_JS_AsyncPatterns_NODEONLY (guarded)
SHELL := /bin/bash
JS_FILE  ?= assets/code/sample_csv_stats.mjs
PY_FILE  ?= assets/code_py/sample_llm_primitives.py
EVIDENCE ?= notes/DEMO_JS_AsyncPatterns_NODEONLY_EvidenceLog.md

.PHONY: help .ensure-kit run-js watch-js run-tests run-py watch-py run-tests-py log.tail dev dev-3 dev-tests ingest-ref probe-video sample-frames import-transcript json-to-csv pack-context ingest.smoke ingest.smoke.transcript

help: ## Show available targets
	@grep -E '^[a-zA-Z0-9_.-]+:.*?## ' $(MAKEFILE_LIST) | sed 's/:.*##/: /' | sort

.ensure-kit: ## Create dirs + seed Evidence header if missing
	@mkdir -p notes logs assets/metadata/transcripts assets/articles
	@if [ ! -f "$(EVIDENCE)" ]; then \
	  printf '# 📜 %s — Evidence & Source Log\n#%s #EvidenceLog\n\n' "$(notdir $(CURDIR))" "$(notdir $(CURDIR))" > "$(EVIDENCE)"; \
	  printf '| Date Added | Source Type | Title / Description | Tags | Notes |\n' >> "$(EVIDENCE)"; \
	  printf '|------------|-------------|---------------------|------|-------|\n' >> "$(EVIDENCE)"; \
	  echo "Initialized $(EVIDENCE)"; \
	fi

run-js: ## Run JS demo → log → Evidence
	@$(MAKE) .ensure-kit
	@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \
	node $(JS_FILE) > "$$out" 2>&1; status=$$?; cat "$$out"; \
	node tools/append_evidence_row.mjs --log $(EVIDENCE) --label $$(basename $(JS_FILE)) --status $$status --input "$$out"; exit $$status

watch-js: ## Watch JS → run → log → Evidence
	@$(MAKE) .ensure-kit
	@node tools/watch_and_log_node.mjs --file $(JS_FILE) --run "node $(JS_FILE)" --log $(EVIDENCE) --label $$(basename $(JS_FILE))

run-tests: ## Run JS tests → log → Evidence
	@$(MAKE) .ensure-kit
	@node tests/run_tests.mjs || true

run-py: ## Run PY demo (if python3 available)
	@$(MAKE) .ensure-kit
	@python3 $(PY_FILE) || true

watch-py: ## Watch PY → run → log → Evidence
	@$(MAKE) .ensure-kit
	@node tools/watch_and_log_node.mjs --file $(PY_FILE) --run "python3 $(PY_FILE)" --log $(EVIDENCE) --label $$(basename $(PY_FILE))

run-tests-py: ## Run PY tests (placeholder)
	@$(MAKE) .ensure-kit
	@python3 tests/run_tests_py.py || true

log.tail: ## Tail newest log
	@$(MAKE) .ensure-kit
	@bash -lc 'f=$$(ls -1t logs/run_*.log 2>/dev/null | head -n1); if [ -n "$$f" ]; then echo "== $$f =="; tail -n 60 "$$f"; else echo "(no logs yet)"; fi'

dev: ## nvim: Evidence (L) + watch-js (R)
	@nvim "$(EVIDENCE)" -c 'vsplit | terminal make watch-js'

dev-3: ## nvim: Evidence (L), watch-js (TR), log tail (BR)
	@nvim "$(EVIDENCE)" \
	  -c 'vsplit | terminal make watch-js' \
	  -c 'wincmd h | botright split | terminal bash tools/tail_latest.sh'

dev-tests: ## nvim: Evidence (L), run-tests (TR), log tail (BR)
	@nvim "$(EVIDENCE)" \
	  -c 'vsplit | terminal make run-tests' \
	  -c 'wincmd h | botright split | terminal bash tools/tail_latest.sh'

ingest-ref: ## Append reference row (ARGS='--type book --title "…" --author "…" --year 2016 --url … --tags "…" --notes "…"')
	@$(MAKE) .ensure-kit
	@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \
	node tools/ingest_reference.mjs $${ARGS} > "$$out" 2>&1; status=$$?; cat "$$out"; \
	node tools/append_evidence_row.mjs --log $(EVIDENCE) --label ingest_reference --status $$status --input "$$out"; exit $$status

probe-video: ## Log video info (FILE=assets/video/clip.mp4) (needs ffprobe)
	@$(MAKE) .ensure-kit
	@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \
	node tools/video_probe.mjs --file "$(FILE)" > "$$out" 2>&1; status=$$?; cat "$$out"; \
	node tools/append_evidence_row.mjs --log $(EVIDENCE) --label video_probe --status $$status --input "$$out"; exit $$status

sample-frames: ## Extract frames (FILE=…, EVERY=10, OUTDIR=assets/images) (needs ffmpeg)
	@$(MAKE) .ensure-kit
	@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \
	node tools/video_frames_sample.mjs --file "$(FILE)" --every "$(EVERY)" --outdir "$(OUTDIR)" > "$$out" 2>&1; status=$$?; cat "$$out"; \
	node tools/append_evidence_row.mjs --log $(EVIDENCE) --label video_frames_sample --status $$status --input "$$out"; exit $$status

import-transcript: ## Import transcript (.srt/.vtt/.json/.jsonl) (FILE=…, SRC=whisperx)
	@$(MAKE) .ensure-kit
	@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \
	node tools/transcript_import.mjs --file "$(FILE)" --source "$(SRC)" > "$$out" 2>&1; status=$$?; cat "$$out"; \
	node tools/append_evidence_row.mjs --log $(EVIDENCE) --label transcript_import --status $$status --input "$$out"; exit $$status

json-to-csv: ## Convert JSON/JSONL → CSV (JSON_FILE=… CSV_OUT=out.csv)
	@$(MAKE) .ensure-kit
	@node tools/json_to_csv.mjs --file "$(JSON_FILE)" > "$(CSV_OUT)"
	@echo "Wrote $(CSV_OUT)"

pack-context: ## Zip notes + metadata → context_pack.zip (NAME=context_pack)
	@$(MAKE) .ensure-kit
	@bash -lc 'name=$${NAME:-context_pack}; rm -f "$$name.zip"; \
	  zip -r "$$name.zip" notes/*.md assets/metadata/*.jsonl assets/metadata/transcripts/*.jsonl 2>/dev/null || true; \
	  echo "Created $$name.zip"'

ingest.smoke: ## trivial ingest smoke
	@$(MAKE) .ensure-kit; echo "OK ingest smoke"
ingest.smoke.transcript: ## transcript ingest smoke
	@$(MAKE) .ensure-kit; echo "OK transcript ingest smoke"
