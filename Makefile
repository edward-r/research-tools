# ========= Makefile (Node-only, pre-set for PROJECT_NAME) =========
KIT_NAME := PROJECT_NAME
JS_FILE := assets/code/sample_csv_stats.mjs
EVIDENCE := notes/$(KIT_NAME)_EvidenceLog.md

SHELL := /bin/bash

GREEN  := \033[32m
YELLOW := \033[33m
RESET  := \033[0m

.PHONY: help kits:build run:js watch:js run:tests log:tail dev

help: ## Show available targets
	@echo -e "$(GREEN)Available targets$(RESET)"
	@grep -E '^[a-zA-Z0-9_:-]+.*?## ' $(MAKEFILE_LIST) | sed 's/:.*##/: /' | sort

kits:build ## Build/refresh both Node-only kits + augment (Project + Demo)
	@node setup_research_kits_node_only_plus.mjs
	@node augment_nodeonly_kits.mjs
	@echo -e "$(GREEN)Kits built. Next:$(RESET) cd $(KIT_NAME)_NODEONLY && make run:js"

run:js ## Run JS demo, save logs, append Evidence Log
	@mkdir -p logs
	@ts=$$(date +%Y%m%d_%H%M%S); \
	  out="logs/run_$$ts.log"; \
	  echo -e "$(YELLOW)▶ Running: node $(JS_FILE)$(RESET)"; \
	  node $(JS_FILE) > "$$out" 2>&1; status=$$?; \
	  cat "$$out"; \
	  echo -e "$(YELLOW)▶ Appending Evidence Log → $(EVIDENCE)$(RESET)"; \
	  node tools/append_evidence_row.mjs --log $(EVIDENCE) --label $$(basename $(JS_FILE)) --status $$status --input "$$out"; \
	  exit $$status

watch:js ## Watch JS file; on save: run → log → append
	@echo -e "$(YELLOW)▶ Watching: $(JS_FILE)$(RESET)"
	@node tools/watch_and_log_node.mjs --file $(JS_FILE) --run "node $(JS_FILE)" --log $(EVIDENCE) --label $$(basename $(JS_FILE))

run:tests ## Run tests; log pass/fail; append Evidence Log
	@mkdir -p logs
	@ts=$$(date +%Y%m%d_%H%M%S); \
	  out="logs/run_$$ts.log"; \
	  echo -e "$(YELLOW)▶ Running tests$(RESET)"; \
	  node tests/run_tests.mjs > "$$out" 2>&1; status=$$?; \
	  cat "$$out"; \
	  echo -e "$(YELLOW)▶ Appending Evidence Log → $(EVIDENCE)$(RESET)"; \
	  node tools/append_evidence_row.mjs --log $(EVIDENCE) --label tests --status $$status --input "$$out"; \
	  exit $$status

log:tail ## Show the newest run log
	@tail -n 40 $$(ls -1t logs/run_*.log | head -n 1)

dev ## Open Evidence Log in NeoVim split + run watcher
	@echo -e "$(YELLOW)▶ Starting dev mode: Evidence Log + watcher$(RESET)"
	@nvim -O $(EVIDENCE) -c "terminal make watch:js"
# ========= end Makefile =========

# --- 3-pane NeoVim dev mode ---
.PHONY: dev3
dev3 ## NeoVim: Evidence Log (L), watcher (TR), newest log tail (BR)
	@echo -e "$(YELLOW)▶ Starting 3-pane dev mode$(RESET)"
	@nvim "$(EVIDENCE)" \
	  -c "vsplit | terminal make watch:js" \
	  -c "wincmd h | botright split | terminal bash -lc 'while true; do f=$$(ls -1t logs/run_*.log 2>/dev/null | head -n1); if [ -n \"$$f\" ]; then clear; echo \"== $$f ==\"; tail -n 60 \"$$f\"; else printf \"(waiting for first log…)\n\"; fi; sleep 2; done'"

# --- 3-pane NeoVim test mode ---
.PHONY: dev:tests
dev:tests ## NeoVim: Evidence Log (L), run tests (TR), newest log tail (BR)
	@echo -e "$(YELLOW)▶ Starting 3-pane test mode$(RESET)"
	@nvim "$(EVIDENCE)" \
	  -c "vsplit | terminal make run:tests" \
	  -c "wincmd h | botright split | terminal bash -lc 'while true; do f=$$(ls -1t logs/run_*.log 2>/dev/null | head -n1); if [ -n \"$$f\" ]; then clear; echo \"== $$f ==\"; tail -n 60 \"$$f\"; else printf \"(waiting for first test run…)\\n\"; fi; sleep 2; done'"
