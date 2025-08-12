# Research Tools

Node-only research/learning/dev starter with an Evidence Log (run → log → append).

## Quick start

```bash
node setup_research_kits_node_only_plus.mjs
node augment_nodeonly_kits.mjs
cd PROJECT_NAME_NODEONLY
make run:js        # or: npm run run:js
make run:tests     # or: npm run test:node
make watch:js
make log:tail

```

End-to-end guide for using the **Node-only** kits you can generate with
the script I shared (`setup_research_kits_node_only_plus.mjs`).
These kits work the same way for **research**, **learning**,
and **development** projects — the only difference is what you put into them.

`setup_research_kits_node_only_plus.mjs` sets up the project, including a directory
structure, a package.json, and a .gitignore file.
It also installs and configures Node. js, NPM, and Yarn.

## What the script creates

It will create **two** ready-to-use, pure-Node demo folders:

```bash
PROJECT_NAME_NODEONLY/
DEMO_JS_AsyncPatterns_NODEONLY/
```

Each folder contains:

```bash
assets/
  datasets/
    sample.csv                 # demo data
  code/
    sample_csv_stats.mjs       # Node script: reads CSV → computes stats → prints JSON
tools/
  append_evidence_row.mjs      # Node script: appends an Evidence Log row
  watch_and_log_node.mjs       # Node watcher: reruns on save → logs → appends
notes/
  PROJECT_NAME_EvidenceLog.md  # (or DEMO_... for the demo kit)
  SmartSearch_Index.md         # Bear search stubs (bear:// URLs)
Makefile                       # run:js, watch:js, log:tail
logs/                          # created on first run
```

**Concepts baked-in:**

- **Evidence Log**: a running Markdown table that records what you ran, when,
  and the output summary.
- **Run → Log → Append loop**: every time you run your code,
  the output is saved to `logs/…` and a new row is appended to
  the Evidence Log (tagged `#Confirmed` or `#Bug`).
- **Smart Searches** (optional, for Bear): prebuilt “one-click” search links to filter
  notes by tags.

```bash
cd PROJECT_NAME_NODEONLY

# One-off run → saves logs/run_*.log → appends Evidence Log
make run:js

# Watch the JS file; on every save: run → log → append
make watch:js

# Show the tail of the newest run log
make log:tail
```

## How this supports research, learning, and dev projects

### A) Research projects

- **Goal**: Track sources, searches, and findings; capture evidence and outcomes.
- **How to use**:
  - Put any **datasets/documents** into `assets/datasets/` and **scripts/analysis**
    into `assets/code/`.
  - Run your scripts with `make run:js` (or the one-liner).
  - Each run:
    1. Saves the console output to `logs/run_….log`
    2. Appends a row to `notes/…_EvidenceLog.md` with date, label, status (`#Confirmed`
       if exit code 0, otherwise `#Bug`), and a tail of the output.
  - Open `notes/SmartSearch_Index.md` in **Bear** if you use it; those links help
    filter notes by tags like `#Confirmed`, `#Bug`, `#Dataset`, `#Code`, etc.

**Example**: Swap `sample_csv_stats.mjs` for `my_archive_scan.mjs` that parses
PDFs or CSVs, and your Evidence Log becomes a defensible research audit trail.

## Learning projects (new tech / frameworks)

- **Goal**: Experiment in tiny, testable steps and save the results.
- **How to use**:

  - Add small exercises or examples in `assets/code/`, e.g. `exercise_01.mjs`.
  - Update `Makefile`:

    ```make
    JS_FILE ?= assets/code/exercise_01.mjs
    ```

  - Run, see the console output, and auto-append to the Evidence Log.
  - Use the **watcher** while you iterate:

    ```bash
    make watch:js
    ```

  - When something breaks (non-zero exit), the Evidence Log row is tagged `#Bug`.
    Fix it; the next run flips back to `#Confirmed`.

**Tip**: Store “known good” snippets in a separate note in Bear
(e.g., `CodeSnippets.md`) and tag with `#Snippet #Confirmed`.

## Development projects (small utilities, data pipelines)

- **Goal**: Treat every run like a mini CI step with a paper trail.
- **How to use**:

  - Put your build/test scripts in `assets/code/`.
  - Wire the target file in the `Makefile` or run the Node one-liner directly.
  - Use the **watcher** during active development:

    ```bash
    node tools/watch_and_log_node.mjs \
      --file assets/code/my_script.mjs \
      --run "node assets/code/my_script.mjs" \
      --log notes/PROJECT_NAME_EvidenceLog.md \
      --label my_script.mjs
    ```

  - Every save → run → log → append.

**Result**: You get a searchable changelog of runs with
timestamps and outcomes — handy for debugging, demos, and documentation.

## Customizing for your real project

1. **Rename the folder**  
   `PROJECT_NAME_NODEONLY/` → `YOUR_PROJECT_NODEONLY/`.

2. **Point `Makefile` at your main script**  
   Edit:

   ```make
   JS_FILE ?= assets/code/sample_csv_stats.mjs
   ```

   to your script path.

3. **Add tags in your notes**  
   In Bear (optional), tag notes and Evidence Log entries with your project tag
   (e.g., `#YourProject`) so Smart Searches filter correctly.

4. **Swap in your own dataset**  
   Replace `assets/datasets/sample.csv` with your data. Update your code accordingly.

5. **Multiple scripts?**  
   Create additional targets in `Makefile`, e.g.:

   ```make
   run:clean_data
      @node assets/code/clean_data.mjs
   run:analyze
      @node assets/code/analyze_results.mjs
   ```

## What each key file does

- `assets/code/sample_csv_stats.mjs`  
  Minimal Node script that reads a CSV, computes basic stats, and prints JSON.

- `tools/append_evidence_row.mjs`  
  Appends a Markdown row to the Evidence Log. It includes:

  - Date (YYYY-MM-DD)
  - Type = `Code`
  - Label = your script filename
  - Tags = `#Code #Experiment` and either `#Confirmed` or `#Bug`
  - Output tail (the last lines of the run’s console output)

- `tools/watch_and_log_node.mjs`  
   Watches a single file and, on every save: runs your command, writes a
  `logs/run_….log`, and appends the Evidence Log row.

- `notes/PROJECT_NAME_EvidenceLog.md`  
  Your growing log of runs and outcomes. This is the **heart of the audit trail**.

- `notes/SmartSearch_Index.md` (optional for Bear)  
   A note full of `bear://` search links (Active tasks, Confirmed,
  Datasets, Code, Bugs). It’s a convenience for filtering if you use Bear.

## Typical daily workflow

1. **Pick a task** (research query, learning exercise, or dev change).
2. **Edit your script** in `assets/code/…`.
3. **Run with logging**:
   - `make run:js`, or
   - `make watch:js` while iterating.
4. **Review the output** in the terminal.
5. **Check the Evidence Log** — a row is appended automatically with the result.
6. **Commit your changes** (if using git), including
   `notes/…_EvidenceLog.md` and `logs/run_…` as needed.

## Troubleshooting

- **No `make`**: use the printed Node one-liner (no build tools required).
- **No `fs.watch` events** (rare on network drives):
  save files locally or re-run the watcher from a local path.
- **Noisy logs**: pipe your script output through a formatter,
  or adjust the appender to summarize differently.

## How to “make it your own”

- **Rename Evidence Logs**: in your kit, change
  `notes/PROJECT_NAME_EvidenceLog.md` to match your real project tag;
  update npm scripts accordingly.
- **Point at your own script**: set `JS_FILE` (or update the inline command) to your
  primary script path in `assets/code/`.
- **Customize the Dashboard & Smart Searches**: open
  `notes/Project_Dashboard.md` and `notes/SmartSearch_Index.md`
  and replace `PROJECT_NAME` with your tag used in Bear (e.g., `#DataPipeline2025`).
- **Expand tests**: add more files under `tests/` and call them from `tests/run_tests.mjs`.

---

## What Make actually does

- You define **targets** (named tasks) in a file called `Makefile`.
- Each target has:
  1. A **name** (`run:js`)
  2. An optional **dependency list**
  3. A list of **commands** to run when you call `make run:js`.
- You can run `make run:js` from the terminal just
  like `npm run run:js` — but Make doesn’t require you to prefix commands with `npm`.

## Why it’s useful for Node projects\*\*

- **Shortcuts** → `make watch:js` is faster to type than `npm run watch:js`.
- **No JSON escaping** → You can write commands exactly as you’d type them in Bash,
  without the quotes and backslashes that `package.json` sometimes needs.
- **Shared scripts** → Works for Node, Python, or any language in the same project.
- **Composability** → One Make target can run several other targets in sequence.

## How to use it

Once that file is in your project root:

```bash
# Build your kits (example target)
make kits:build

# Run your Node script → log → append
make run:js

# Watch your file, rerun on save
make watch:js

# Run tests
make run:tests

# View the last run log
make log:tail
```

## Pro tips

- **Variables** (`JS_FILE`, `EVIDENCE`) mean you can override on the fly:

  ```bash
  make run:js JS_FILE=assets/code/my_other_script.mjs
  ```

- You can still **mix with npm scripts**. Some people keep complex commands in Make,
  and let `package.json` scripts just call `make run:js` etc.
- If you’re on **macOS**, Make is already installed.  
  On **Windows**, you can:
  - Use **WSL** (Windows Subsystem for Linux)
  - Or install **make** via Chocolatey: `choco install make`

## How to use it (terminal)

```bash
# From the project root
make help

# Build/refresh both Node-only kits (Project + Demo)
make kits:build

# One-off run → log → append (Project kit by default)
make run:js

# Use the DEMO kit instead (note the KIT_NAME override)
make run:js KIT_NAME=DEMO_JS_AsyncPatterns

# Watch your main script; on every save: run → log → append
make watch:js

# Swap the script being watched/run
make watch:js JS_FILE=assets/code/my_script.mjs

# Run tests → log pass/fail → append
make run:tests

# Tail the newest log
make log:tail
```

## NeoVim: using `:make` and Quickfix (no config required)

NeoVim already knows how to run `make`:

- `:make run:js` — runs the `run:js` target
- `:make run:tests` — runs tests
- `:make watch:js` — starts the watcher (runs in the foreground; quit with `q`/`Ctrl-C`)

Quickfix basics:

- `:copen` — open the quickfix window (errors & output)
- `:cclose` — close quickfix
- `:colder` / `:cnewer` — navigate quickfix lists
- `:make! run:tests` — run without jumping to the first error

Tip: set NeoVim to **auto-save** before build so `:make`
always uses your latest edits:

```
:set autowrite
```

This way, `:make run:js` will save buffers automatically before executing the target.

## Overriding variables from NeoVim

You can pass the same overrides you’d use in the terminal:

- `:make run:js JS_FILE=assets/code/another_script.mjs`
- `:make run:js KIT_NAME=DEMO_JS_AsyncPatterns`

## Optional: run Make targets from a Node script (if you prefer JS everywhere)

If you want a JavaScript helper to trigger Make targets programmatically, add
this **functional** utility (save as `tools/runMakeTarget.mjs`):

```javascript
import { spawn } from "node:child_process";

export const runMake = (target = "help", vars = {}) =>
  new Promise((resolve, reject) => {
    const args = [target, ...Object.entries(vars).map(([k, v]) => `${k}=${v}`)];
    const ps = spawn("make", args, { stdio: "inherit" });
    ps.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`make ${target} exited ${code}`)),
    );
  });

// Example:
// await runMake('run:js', { JS_FILE: 'assets/code/sample_csv_stats.mjs',
KIT_NAME: 'PROJECT_NAME' });
```

This keeps everything JavaScript-centric while still leveraging your Makefile.

## Where this fits in your workflow

- **Research**: every run (analysis script, data extraction, etc.) becomes a logged
  Evidence event in `notes/..._EvidenceLog.md`, with a pointer to the output in `logs/…`.
- **Learning**: the watcher gives you “tight feedback loops.” Save, re-run, and capture
  results automatically — successes are tagged `#Confirmed`, failures `#Bug`.
- **Development**: `run:tests` makes the Evidence Log a lightweight CI trail
  you can grep/browse later (and it works fine inside NeoVim via `:make run:tests`).

If you want, I can **pre-set `JS_FILE` and `KIT_NAME`** to your real main
script and project tag so you never have to override them on the command line.

## How this behaves now

- **No need to pass `KIT_NAME` or `JS_FILE`** every time — they’re locked in here.
- You can still override temporarily if you want:

  ```bash
  make run:js JS_FILE=assets/code/other_script.mjs
  ```

- Inside NeoVim, `:make run:js` just works — it’ll run `sample_csv_stats.mjs` and
  append to `PROJECT_NAME_EvidenceLog.md`.

## Usage examples

### Terminal

```bash
# Using make directly (faster typing)
make run:js

# Using npm scripts (good for Windows CI)
npm run run:js

# Watch file, re-run on save
npm run watch:js

# Build kits
npm run kits:build
```

### NeoVim

- `:make run:js` — still works exactly the same
- Or `:!npm run run:js` — if you want to call via npm without leaving Vim

## Why have both?

- **Makefile** gives you clean Bash-like commands with variables, chaining, and
  overrides.
- **npm scripts** let you run the same tasks on systems without `make` installed
  (or in GitHub Actions without adding a Make install step).

---

## Summary

This project is a **Node.js research toolkit generator** that creates structured
environments for research, learning,
and development projects with built-in evidence logging.

## What it does

**Creates research kits** - The main script `setup_research_kits_node_only_plus.mjs`
generates two ready-to-use Node.js project folders with a complete workflow for
tracking experimental runs and outcomes.

**Evidence logging system** - Every time you run code, it automatically:

- Saves console output to timestamped log files
- Appends a row to a Markdown "Evidence Log" with date,
  status (#Confirmed or #Bug), and output summary
- Creates an audit trail of all your experiments and results

**File watching and auto-logging** - The watcher tool reruns your code on every
file save and logs the results, enabling tight feedback loops during development.

## Key components

- **Project generator** (`setup_research_kits_node_only_plus.mjs`) - Creates
  structured folders with assets, tools, notes, and Makefiles
- **Evidence logger** (`tools/append_evidence_row.mjs`) - Appends structured
  rows to Markdown logs
- **File watcher** (`tools/watch_and_log_node.mjs`) - Monitors files
  and auto-runs code on changes
- **Make targets** - Shortcuts for common tasks like `make run:js`,
  `make watch:js`, `make run:tests`

## Use cases

- **Research projects** - Track data analysis runs, maintain defensible audit trails
- **Learning new tech** - Experiment with small code snippets and save results automatically
- **Development** - Treat every run like a mini-CI step with logged outcomes

The core philosophy is "run → log → append" - every execution becomes
a documented evidence point you can search and reference later.

The project has Bear note integration built in. From the README,
several Bear-specific features:

## Bear note tags mentioned

**Evidence Log tags** - The system automatically tags entries with:

- `#Code #Experiment`
- `#Confirmed` (when code runs successfully, exit code 0)
- `#Bug` (when code fails, non-zero exit code)

**Smart Search system** - Creates `notes/SmartSearch_Index.md`
with pre-built Bear search links (`bear://` URLs) to filter notes by tags like:

- `#Confirmed`
- `#Bug`
- `#Dataset`
- `#Code`
- Active tasks

**Project-specific tags** - The README mentions tagging notes with your project
tag (e.g., `#YourProject`, `#DataPipeline2025`) so the Smart Searches filter correctly.

**Additional suggested tags**:

- `#Snippet #Confirmed` for storing "known good" code snippets
- Custom project tags that get integrated into the Bear search links

The Bear integration is optional but designed to turn your Evidence Log into a
searchable knowledge base where you can quickly filter by outcome type, project,
or content category using Bear's tag-based search system.

The `SmartSearch_Index.md` file appears to be a dashboard of
one-click Bear search links that help you navigate your research findings efficiently.

---

## How `dev` works

When you run:

```bash
make dev
# or
npm run dev
```

You get:

- **Left split**: `PROJECT_NAME_EvidenceLog.md` open in
  normal NeoVim buffer (you can scroll, search, edit tags)
- **Right split**: Terminal buffer running the watcher (`make watch:js`),
  auto-updating as you save your JS file
- Every run appends to the Evidence Log in real time,
  so you can confirm results without leaving NeoVim.

## Bonus NeoVim Tip

If you want **`<leader>d`** to trigger dev mode right from your normal buffers:

Add to your `init.lua` (or equivalent LazyVim keymap config):

```lua
vim.keymap.set("n", "<leader>d", ":!make dev<CR>", { desc = "Start project dev mode" })
```

Now you can just hit `Space d` (if your leader is space) and dev mode launches.

## Three-pane NeoVim “Mission Control” (watcher + Evidence Log + live log tail)

Below is a **drop-in update** to your Makefile that adds a `dev3` target. It launches NeoVim with:

1. **Left pane:** your Evidence Log (editable)
2. **Top-right pane (terminal):** `make watch:js` (re-runs on save → log → append)
3. **Bottom-right pane (terminal):** a refresh loop that shows the **last 60 lines**
   of the newest `logs/run_*.log` (auto-updates every 2s)

> This keeps everything Node-only and functional; no classes anywhere.

## Makefile additions

Append this target to the Makefile I gave you earlier
(you can keep all existing targets):

```makefile
# --- 3-pane NeoVim dev mode ---
.PHONY: dev3
dev3 ## NeoVim: Evidence Log (L), watcher (TR), newest log tail (BR)
  @echo -e "$(YELLOW)▶ Starting 3-pane dev mode$(RESET)"
  @nvim "$(EVIDENCE)" \
    -c "vsplit | terminal make watch:js" \
    -c "wincmd h | botright split | terminal bash -lc 'while true; do f=$$(ls -1t logs/run_*.log 2>/dev/null | head -n1); if [ -n \"$$f\" ]; then clear; echo \"== $$f ==\"; tail -n 60 \"$$f\"; else printf \"(waiting for first log…)\n\"; fi; sleep 2; done'"
```

## Notes on the command

- We start NeoVim with the **Evidence Log** as the initial buffer, then:
  - `vsplit | terminal make watch:js` opens the watcher in a **vertical split** (top-right).
  - `wincmd h | botright split | terminal …` returns to the **left pane**, opens a **bottom split** on the right, and runs a small Bash loop that always shows the newest log’s tail.
- The Bash loop avoids `tail -F` pitfalls when the newest log file changes; it refreshes cleanly every 2 s.

## Usage

```bash
# 3-pane Mission Control
make dev3
# or
npm run dev:3
```

Inside NeoVim:

- Left: edit `$(EVIDENCE)` freely (add tags like `#Confirmed`,
  `#Bug`, `#Dataset`, etc.).
- Top-right: save your JS file to trigger re-runs; results are logged automatically.
- Bottom-right: the newest log tail updates every 2 s.

To stop: close the right-hand terminals (`q` in each terminal buffer) or quit NeoVim.

## Tips

- Change how many lines you tail by editing `tail -n 60` in the loop.
- If you switch your main script, just update `JS_FILE` in the
  Makefile (or override per run):

  ```bash
  make dev3 JS_FILE=assets/code/my_script.mjs
  ```

- Works great with `:set autowrite` in NeoVim so buffers save before runs:
  ```
  :set autowrite
  ```

## Three-pane NeoVim view for tests (`dev:tests`)

Below are **drop-in additions** so you can launch a
3-pane NeoVim layout focused on tests:

- **Left:** Evidence Log (editable)
- **Top-right (terminal):** runs `make run:tests`
- **Bottom-right (terminal):** auto-refreshing tail of the
  newest `logs/run_*.log` (updates every 2 s)

## Notes

- The **top-right** pane runs `make run:tests` once. To re-run tests,
  focus that terminal and press ↑ (history) + Enter, or type `make run:tests` again.
- The **bottom-right** pane always
  shows the last 60 lines of the **newest** log,
  even when a new test run creates a fresh file.

## Usage

```bash
# Launch the 3-pane tests view
make dev:tests
# or
npm run dev:tests
```

Inside NeoVim:

- Edit your code or tests on the left Evidence Log if needed (add tags like `#Confirmed`, `#Bug` after runs).
- In the **top-right** terminal, re-run `make run:tests` whenever you want.
- Watch the last test log update live in the **bottom-right**.

### Tip

Add this to NeoVim to start test mode with a keypress (e.g., `<leader>t`):

```lua
vim.keymap.set("n", "<leader>t", ":!make dev:tests<CR>", { desc = "Start 3-pane test mode" })
```

If you later want **auto-re-run on file save** for tests,
say the word — I can add a
Node-only watcher target (`watch:tests`)
that triggers `run:tests` whenever files under `assets/code/` or `tests/` change,
and still logs/append results to the Evidence Log.
