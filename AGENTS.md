# AGENTS.md - Coding Agent Guidelines

## Build/Test/Lint Commands
- `npm run kits:build` - Build/refresh Node-only kits + augment
- `make run-tests` - Run all tests
- `node tests/run_tests.mjs` - Run a single test (JS only)
- `make run-js` - Run main JS demo
- `make watch-js` - Watch and auto-run JS on file changes
- `make dev` - Development mode with NeoVim + watcher
- No linting commands configured

## Code Style
- **Module Type**: ES modules only (`type: "module"` in package.json)
- **File Extensions**: Use `.mjs` for all JavaScript files
- **Imports**: Use Node.js built-in imports (`import { readFile } from 'node:fs/promises'`)
- **Formatting**: Compact style with minimal whitespace, no semicolons at line end
- **Functions**: Arrow functions preferred, one-liners when possible
- **Variables**: Use `const` by default, destructuring for objects/arrays
- **Error Handling**: Use `.catch()` with `process.exit(1)` for failures
- **Naming**: camelCase for functions/variables, PascalCase for constants
- **Comments**: Minimal inline comments, prefer descriptive function names
- **Console Output**: Use `console.log()` for normal output, `console.error()` for errors
- **File Structure**: Single purpose files, avoid large monolithic modules