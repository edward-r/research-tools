.PHONY: help kits demo
help:
	@echo "Targets:"
	@echo "  kits   - build kits at repo root"
	@echo "  demo   - run watcher CI demo locally"

kits:
	@node scripts/bootstrap/index.mjs

demo:
	@npm run watcher:demo
