import { writeText } from "./utils.mjs";
import { join } from "node:path";

const evidenceLogHeader = (NAME) => `# 📜 ${NAME} — Evidence & Source Log
#${NAME} #EvidenceLog

| Date Added | Source Type | Title / Description | Tags | Notes |
|------------|-------------|---------------------|------|-------|
`;

const smartSearchNotes = (NAME) => {
  const enc = (s) => encodeURIComponent(s);
  const link = (label, q) =>
    `- [${label}](bear://x-callback-url/search?term=${enc(q)}) — \`${q}\``;
  return `# 🔎 Smart Searches — ${NAME}
#${NAME} #SearchIndex

${link("Active Tasks", `#${NAME} AND #ToDo`)}
${link("Confirmed Evidence", `#${NAME} AND #Confirmed`)}
${link("Code", `#${NAME} AND #Code`)}
${link("Datasets", `#${NAME} AND #Dataset`)}
${link("Bugs", `#${NAME} AND #Bug`)}
`;
};

const projectDashboard = (NAME) => `# 📊 Project Dashboard — ${NAME}
#${NAME} #Dashboard

## Quick Commands
\`\`\`bash
make run-js
make run-tests
make watch-js
make dev-3
make run-py
make run-tests-py
make watch-py
\`\`\`

## Core Notes
- [Evidence Log](bear://x-callback-url/search?term=%23${NAME}%20AND%20%23EvidenceLog)
- [Smart Search Index](bear://x-callback-url/open-note?title=SmartSearch_Index)
`;

const datasetScratchpad = `# 🛠 Dataset Wrangling Scratchpad
#Dataset #CodeRecipes

## CSV → Array of Objects (JS)
\`\`\`javascript
const parseCsv = (text) => {
  const [header, ...rows] = text.trim().split(/\\r?\\n/).map(r => r.split(','));
  return rows.map(r => Object.fromEntries(r.map((v, i) => [header[i], v])));
};
\`\`\`
`;

export async function writeNotes(root, NAME) {
  await writeText(
    join(root, `notes/${NAME}_EvidenceLog.md`),
    evidenceLogHeader(NAME),
  );
  await writeText(
    join(root, "notes/SmartSearch_Index.md"),
    smartSearchNotes(NAME),
  );
  await writeText(
    join(root, "notes/Project_Dashboard.md"),
    projectDashboard(NAME),
  );
  await writeText(
    join(root, "notes/Dataset_Wrangling_Scratchpad.md"),
    datasetScratchpad,
  );
}
