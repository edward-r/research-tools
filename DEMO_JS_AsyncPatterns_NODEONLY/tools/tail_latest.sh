#!/usr/bin/env bash
set -euo pipefail
while true; do
  f=$(ls -1t logs/run_*.log 2>/dev/null | head -n1 || true)
  if [[ -n "${f:-}" ]]; then
    clear; echo "== $f =="; tail -n 60 "$f"
  else
    printf '(waiting for first log...)\n'
  fi
  sleep 2
done
