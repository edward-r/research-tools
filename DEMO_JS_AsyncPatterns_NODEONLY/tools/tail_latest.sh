#!/usr/bin/env bash
while true; do
  f=$(ls -1t logs/run_*.log 2>/dev/null | head -n1)
  if [ -n "$f" ]; then clear; echo "== $f =="; tail -n 60 "$f"; else echo "(waiting for first log…)"; fi
  sleep 2
done
