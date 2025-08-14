// Build the Makefile using array + join('\n') to avoid ${...} interpolation pitfalls.
export function makefileFor(NAME) {
  const L = [];

  L.push("# Makefile — " + NAME + " Node + optional Python");
  L.push("SHELL := /bin/bash");
  L.push("JS_FILE  ?= assets/code/sample_csv_stats.mjs");
  L.push("PY_FILE  ?= assets/code_py/sample_llm_primitives.py");
  L.push("EVIDENCE ?= notes/" + NAME + "_EvidenceLog.md");
  L.push("");
  L.push(
    ".PHONY: help run-js watch-js run-tests log-tail dev dev-3 dev-tests run-py watch-py run-tests-py dev-3-py ingest-ref probe-video sample-frames import-transcript pack-context",
  );
  L.push("");
  L.push("help: ## Show available targets");
  L.push(
    "\t@grep -E '^[a-zA-Z0-9_.-]+:.*?## ' $(MAKEFILE_LIST) | sed 's/:.*##/: /' | sort",
  );
  L.push("");
  // Node lane
  L.push("run-js: ## Run JS demo → log → append");
  L.push(
    '\t@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \\',
  );
  L.push('\tnode $(JS_FILE) > "$$out" 2>&1; status=$$?; cat "$$out"; \\');
  L.push(
    '\tnode tools/append_evidence_row.mjs --log $(EVIDENCE) --label $$(basename $(JS_FILE)) --status $$status --input "$$out"; exit $$status',
  );
  L.push("");
  L.push("watch-js: ## Watch JS file; on save: run → log → append");
  L.push(
    '\t@node tools/watch_and_log_node.mjs --file $(JS_FILE) --run "node $(JS_FILE)" --log $(EVIDENCE) --label $$(basename $(JS_FILE))',
  );
  L.push("");
  L.push("run-tests: ## Run JS tests → log → append");
  L.push(
    '\t@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \\',
  );
  L.push(
    '\tnode tests/run_tests.mjs > "$$out" 2>&1; status=$$?; cat "$$out"; \\',
  );
  L.push(
    '\tnode tools/append_evidence_row.mjs --log $(EVIDENCE) --label tests_js --status $$status --input "$$out"; exit $$status',
  );
  L.push("");
  // Python lane
  L.push("run-py: ## Run PY demo (python3) → log → append");
  L.push(
    '\t@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \\',
  );
  L.push(
    '\tpython3 $(PY_FILE) > "$$out" 2>&1 || true; status=$$?; cat "$$out"; \\',
  );
  L.push(
    '\tnode tools/append_evidence_row.mjs --log $(EVIDENCE) --label $$(basename $(PY_FILE)) --status $$status --input "$$out"; exit $$status',
  );
  L.push("");
  L.push("watch-py: ## Watch PY file; on save: run → log → append");
  L.push(
    '\t@node tools/watch_and_log_node.mjs --file $(PY_FILE) --run "python3 $(PY_FILE)" --log $(EVIDENCE) --label $$(basename $(PY_FILE))',
  );
  L.push("");
  L.push("run-tests-py: ## Run PY tests → log → append");
  L.push(
    '\t@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \\',
  );
  L.push(
    '\tpython3 tests/run_tests_py.py > "$$out" 2>&1 || true; status=$$?; cat "$$out"; \\',
  );
  L.push(
    '\tnode tools/append_evidence_row.mjs --log $(EVIDENCE) --label tests_py --status $$status --input "$$out"; exit $$status',
  );
  L.push("");
  // Logs + NeoVim panes
  L.push("log-tail: ## Tail newest log");
  L.push(
    "\t@bash -lc 'tail -n 40 \"$$(ls -1t logs/run_*.log 2>/dev/null | head -n 1)\"'",
  );
  L.push("");
  L.push("dev: ## NeoVim: Evidence Log (L) + watch-js (R)");
  L.push("\t@nvim \"$(EVIDENCE)\" -c 'vsplit | terminal make watch-js'");
  L.push("");
  L.push(
    "dev-3: ## NeoVim: Evidence Log (L), watch-js (TR), newest log tail (BR)",
  );
  L.push('\t@nvim "$(EVIDENCE)" \\');
  L.push("\t  -c 'vsplit | terminal make watch-js' \\");
  L.push(
    "\t  -c 'wincmd h | botright split | terminal bash tools/tail_latest.sh'",
  );
  L.push("");
  L.push(
    "dev-tests: ## NeoVim: Evidence Log (L), run-tests (TR), newest log tail (BR)",
  );
  L.push('\t@nvim "$(EVIDENCE)" \\');
  L.push("\t  -c 'vsplit | terminal make run-tests' \\");
  L.push(
    "\t  -c 'wincmd h | botright split | terminal bash tools/tail_latest.sh'",
  );
  L.push("");
  L.push(
    "dev-3-py: ## NeoVim: Evidence Log (L), watch-py (TR), newest log tail (BR)",
  );
  L.push('\t@nvim "$(EVIDENCE)" \\');
  L.push("\t  -c 'vsplit | terminal make watch-py' \\");
  L.push(
    "\t  -c 'wincmd h | botright split | terminal bash tools/tail_latest.sh'",
  );
  L.push("");
  // Research add‑ons
  L.push(
    'ingest-ref: ## Append normalized reference row (ARGS=\'--type book --title "…" --author "…" --year 2016 --url … --tags "…" --notes "…"\')',
  );
  L.push(
    '\t@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \\',
  );
  L.push(
    '\tnode tools/ingest_reference.mjs $${ARGS} > "$$out" 2>&1; status=$$?; cat "$$out"; \\',
  );
  L.push(
    '\tnode tools/append_evidence_row.mjs --log $(EVIDENCE) --label ingest_reference --status $$status --input "$$out"; exit $$status',
  );
  L.push("");
  L.push(
    "probe-video: ## Log video info (FILE=assets/video/clip.mp4) (needs ffprobe)",
  );
  L.push(
    '\t@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \\',
  );
  L.push(
    '\tnode tools/video_probe.mjs --file "$(FILE)" > "$$out" 2>&1; status=$$?; cat "$$out"; \\',
  );
  L.push(
    '\tnode tools/append_evidence_row.mjs --log $(EVIDENCE) --label video_probe --status $$status --input "$$out"; exit $$status',
  );
  L.push("");
  L.push(
    "sample-frames: ## Extract frames (FILE=…, EVERY=10, OUTDIR=assets/images) (needs ffmpeg)",
  );
  L.push(
    '\t@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \\',
  );
  L.push(
    '\tnode tools/video_frames_sample.mjs --file "$(FILE)" --every "$(EVERY)" --outdir "$(OUTDIR)" > "$$out" 2>&1; status=$$?; cat "$$out"; \\',
  );
  L.push(
    '\tnode tools/append_evidence_row.mjs --log $(EVIDENCE) --label video_frames_sample --status $$status --input "$$out"; exit $$status',
  );
  L.push("");
  L.push(
    "import-transcript: ## Import transcript (.srt/.vtt/.json/.jsonl) (FILE=…, SRC=whisperx)",
  );
  L.push(
    '\t@mkdir -p logs; ts=$$(date +%Y%m%d_%H%M%S); out="logs/run_$$ts.log"; \\',
  );
  L.push(
    '\tnode tools/transcript_import.mjs --file "$(FILE)" --source "$(SRC)" > "$$out" 2>&1; status=$$?; cat "$$out"; \\',
  );
  L.push(
    '\tnode tools/append_evidence_row.mjs --log $(EVIDENCE) --label transcript_import --status $$status --input "$$out"; exit $$status',
  );
  L.push("");
  // Keep ${NAME:-…} literal for Bash by using $${…} (Make → Bash), and we are not in a template literal here.
  L.push(
    "pack-context: ## Zip curated notes+metadata for NotebookLM/ChatGPT (NAME=context_pack)",
  );
  L.push(
    '\t@bash -lc \'name=$${NAME:-context_pack}; rm -f "$$name.zip"; zip -r "$$name.zip" notes/*.md assets/metadata/*.jsonl assets/metadata/transcripts/*.jsonl 2>/dev/null || true; echo "Created $$name.zip"\'',
  );
  L.push("");

  return L.join("\n");
}
