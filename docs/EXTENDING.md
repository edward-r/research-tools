# EXTENDING

This document describes how to **safely extend** the Research & Learning Toolkit.  
Each section covers a specific type of extension, with examples, CI integration notes, and debugging guidance.

---

## 1. Adding a New Tool (Example: JSON → CSV Normalizer)

### Steps

1. Create a new script under `scripts/utils/`, e.g.:

```js
// scripts/utils/json_to_csv.mjs
import fs from "fs";

export const jsonToCsv = (inputPath, outputPath) => {
  const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((h) => row[h]));
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  fs.writeFileSync(outputPath, csv);
};
```

2. Add tests under `tests/utils/`.

3. Wire into a Make target:

```make
make json-to-csv
```

---

## 2. Changing Default Entry Points

### Where

- Defaults live in `package.json → bin` and `Makefile`.

### How

- Update `package.json` bin entries to point at your new script.
- Add or replace a `Make` target to map CLI calls cleanly.

---

## 3. Adding a New Dataset + Demo + Test (JS Lane)

### Steps

1. Place dataset in `datasets/my_dataset.csv`.
2. Create demo ingest under `scripts/ingest/my_dataset.mjs`.
3. Add a test under `tests/ingest/my_dataset.test.js`.

### Example Test

```js
import { runIngest } from "../../scripts/ingest/my_dataset.mjs";

test("dataset ingests successfully", () => {
  const output = runIngest("datasets/my_dataset.csv");
  expect(output.length).toBeGreaterThan(0);
});
```

---

## 4. Creating a New Research Ingest (e.g., Blog Imports)

### Steps

1. Copy a template from `scripts/ingest/`.
2. Modify fetch/parse logic for the new source.

Example snippet:

```js
// scripts/ingest/blog_import.mjs
import fetch from "node-fetch";

export const ingestBlog = async (url) => {
  const res = await fetch(url);
  const html = await res.text();
  // parse + normalize
};
```

3. Add a test under `tests/ingest/`.

---

## 5. Keeping Makefile Tabs Intact

- `make` requires **hard tabs** (not spaces).
- Use an editorconfig rule:

```
[Makefile]
indent_style = tab
```

- Always commit Makefile changes with tabs preserved.

---

## 6. CI Integration Patterns

- Add a job in `.github/workflows/node.yml` for the new tool or ingest:

```yaml
- name: Run blog ingest
  run: npm run ingest:blogs
```

- Add dataset validation tests to ensure reproducibility.

---

## 7. Debug Checklist

- **CI fails on dataset ingest?** → check if new dataset path exists.
- **Make target doesn’t run?** → ensure tabs are used.
- **Test not detected?** → confirm filename matches `*.test.js`.
- **CI environment missing deps?** → add to `package.json` + reinstall.

---

## ✅ Best Practices

- Keep each script modular.
- Always add a dataset + test with every new ingest.
- Run `make lint` before pushing.
- Keep CI green: add tests, never comment them out.
