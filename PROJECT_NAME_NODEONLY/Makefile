# Makefile — PROJECT_NAME Node-only demo
SHELL := /bin/bash

JS_FILE    ?= assets/code/sample_csv_stats.mjs
EVIDENCE   ?= notes/PROJECT_NAME_EvidenceLog.md

.PHONY: help run-js watch-js log-tail run-tests dev dev-3 dev-tests

help: ## Show available targets
	@grep -E '^[a-zA-Z0-9_.-]+:.*?## ' $(MAKEFILE_LIST) | sed 's/:.*##/: /' | sort

run-js: ## Run Node demo, log output, append Evidence Log
	@mkdir -p logs
	@ts=$$(date +%Y%m%d_%H%M%S); \
	  out="logs/run_$$ts.log"; \
	  node $(JS_FILE) > "$$out" 2>&1; status=$$?; \
	  cat "$$out"; \
	  node tools/append_evidence_row.mjs --log $(EVIDENCE) --label $$(basename $(JS_FILE)) --status $$status --input "$$out"; \
	  exit $$status

watch-js: ## Watch JS file; on save: run → log → append
	@node tools/watch_and_log_node.mjs --file $(JS_FILE) --run "node $(JS_FILE)" --log $(EVIDENCE) --label $$(basename $(JS_FILE))

run-tests: ## Run tests; log pass/fail; append Evidence Log
	@mkdir -p logs
	@ts=$$(date +%Y%m%d_%H%M%S); \
	  out="logs/run_$$ts.log"; \
	  node tests/run_tests.mjs > "$$out" 2>&1; status=$$?; \
	  cat "$$out"; \
	  node tools/append_evidence_row.mjs --log $(EVIDENCE) --label tests --status $$status --input "$$out"; \
	  exit $$status

log-tail: ## Show the newest run log
	@bash -lc 'tail -n 40 "$$(ls -1t logs/run_*.log 2>/dev/null | head -n 1)"'

dev: ## NeoVim: Evidence Log (L) + watcher (R)
	@nvim "$(EVIDENCE)" -c 'vsplit | terminal make watch-js'

dev-3: ## NeoVim: Evidence Log (L), watcher (TR), newest log tail (BR)
	@nvim "$(EVIDENCE)" \
	  -c 'vsplit | terminal make watch-js' \
	  -c 'wincmd h | botright split | terminal bash tools/tail_latest.sh'

dev-tests: ## NeoVim: Evidence Log (L), run-tests (TR), newest log tail (BR)
	@nvim "$(EVIDENCE)" \
	  -c 'vsplit | terminal make run-tests' \
	  -c 'wincmd h | botright split | terminal bash tools/tail_latest.sh'
