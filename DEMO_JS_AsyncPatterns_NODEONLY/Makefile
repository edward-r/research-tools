# Makefile — DEMO_JS_AsyncPatterns Node + optional Python
SHELL := /bin/bash
JS_FILE  ?= assets/code/sample_csv_stats.mjs
PY_FILE  ?= assets/code_py/sample_llm_primitives.py
EVIDENCE ?= notes/DEMO_JS_AsyncPatterns_EvidenceLog.md

.PHONY: help run-js watch-js run-tests log-tail dev dev-3 dev-tests run-py watch-py run-tests-py dev-3-py ingest-ref probe-video sample-frames import-transcript pack-context

help: ## Show available targets
	@grep -E '^[a-zA-Z0-9_.-]+:.*?## ' $(MAKEFILE_LIST) | sed 's/:.*##/: /' | sort

run-js: ## Run JS demo → log → append
	@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \
	node $(JS_FILE) > "$$out" 2>&1; status=$$?; cat "$$out"; \
	node tools/append_evidence_row.mjs --log $(EVIDENCE) --label $$(basename $(JS_FILE)) --status $$status --input "$$out"; exit $$status

watch-js: ## Watch JS file; on save: run → log → append
	@node tools/watch_and_log_node.mjs --file $(JS_FILE) --run "node $(JS_FILE)" --log $(EVIDENCE) --label $$(basename $(JS_FILE))

run-tests: ## Run JS tests → log → append
	@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \
	node tests/run_tests.mjs > "$$out" 2>&1; status=$$?; cat "$$out"; \
	node tools/append_evidence_row.mjs --log $(EVIDENCE) --label tests_js --status $$status --input "$$out"; exit $$status

run-py: ## Run PY demo (python3) → log → append
	@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \
	python3 $(PY_FILE) > "$$out" 2>&1 || true; status=$$?; cat "$$out"; \
	node tools/append_evidence_row.mjs --log $(EVIDENCE) --label $$(basename $(PY_FILE)) --status $$status --input "$$out"; exit $$status

watch-py: ## Watch PY file; on save: run → log → append
	@node tools/watch_and_log_node.mjs --file $(PY_FILE) --run "python3 $(PY_FILE)" --log $(EVIDENCE) --label $$(basename $(PY_FILE))

run-tests-py: ## Run PY tests → log → append
	@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \
	python3 tests/run_tests_py.py > "$$out" 2>&1 || true; status=$$?; cat "$$out"; \
	node tools/append_evidence_row.mjs --log $(EVIDENCE) --label tests_py --status $$status --input "$$out"; exit $$status

log-tail: ## Tail newest log
	@bash -lc 'tail -n 40 "$$(ls -1t logs/run_*.log 2>/dev/null | head -n 1)"'

dev: ## NeoVim: Evidence Log (L) + watch-js (R)
	@nvim "$(EVIDENCE)" -c 'vsplit | terminal make watch-js'

dev-3: ## NeoVim: Evidence Log (L), watch-js (TR), newest log tail (BR)
	@nvim "$(EVIDENCE)" \
	  -c 'vsplit | terminal make watch-js' \
	  -c 'wincmd h | botright split | terminal bash tools/tail_latest.sh'

dev-tests: ## NeoVim: Evidence Log (L), run-tests (TR), newest log tail (BR)
	@nvim "$(EVIDENCE)" \
	  -c 'vsplit | terminal make run-tests' \
	  -c 'wincmd h | botright split | terminal bash tools/tail_latest.sh'

dev-3-py: ## NeoVim: Evidence Log (L), watch-py (TR), newest log tail (BR)
	@nvim "$(EVIDENCE)" \
	  -c 'vsplit | terminal make watch-py' \
	  -c 'wincmd h | botright split | terminal bash tools/tail_latest.sh'

ingest-ref: ## Append normalized reference row (ARGS='--type book --title "…" --author "…" --year 2016 --url … --tags "…" --notes "…"')
	@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \
	node tools/ingest_reference.mjs $${ARGS} > "$$out" 2>&1; status=$$?; cat "$$out"; \
	node tools/append_evidence_row.mjs --log $(EVIDENCE) --label ingest_reference --status $$status --input "$$out"; exit $$status

probe-video: ## Log video info (FILE=assets/video/clip.mp4) (needs ffprobe)
	@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \
	node tools/video_probe.mjs --file "$(FILE)" > "$$out" 2>&1; status=$$?; cat "$$out"; \
	node tools/append_evidence_row.mjs --log $(EVIDENCE) --label video_probe --status $$status --input "$$out"; exit $$status

sample-frames: ## Extract frames (FILE=…, EVERY=10, OUTDIR=assets/images) (needs ffmpeg)
	@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \
	node tools/video_frames_sample.mjs --file "$(FILE)" --every "$(EVERY)" --outdir "$(OUTDIR)" > "$$out" 2>&1; status=$$?; cat "$$out"; \
	node tools/append_evidence_row.mjs --log $(EVIDENCE) --label video_frames_sample --status $$status --input "$$out"; exit $$status

import-transcript: ## Import transcript (.srt/.vtt/.json/.jsonl) (FILE=…, SRC=whisperx)
	@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \
	node tools/transcript_import.mjs --file "$(FILE)" --source "$(SRC)" > "$$out" 2>&1; status=$$?; cat "$$out"; \
	node tools/append_evidence_row.mjs --log $(EVIDENCE) --label transcript_import --status $$status --input "$$out"; exit $$status

pack-context: ## Zip curated notes+metadata for NotebookLM/ChatGPT (NAME=context_pack)
	@bash -lc 'name=$${NAME:-context_pack}; rm -f "$$name.zip"; zip -r "$$name.zip" notes/*.md assets/metadata/*.jsonl assets/metadata/transcripts/*.jsonl 2>/dev/null || true; echo "Created $$name.zip"'
