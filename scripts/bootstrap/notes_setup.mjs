// Seeds Evidence Log header + Smart Searches + Project Dashboard + Dataset Scratchpad.
import { join } from "node:path";
import { writeText } from "./utils.mjs";

const evidenceHeader = (NAME) =>
  `# 📜 ${NAME} — Evidence & Source Log
#${NAME} #EvidenceLog

| Date Added | Source Type | Title / Description | Tags | Notes |
|------------|-------------|---------------------|------|-------|
`;

const smartSearch = (NAME) => {
  const enc = encodeURIComponent;
  const mk = (label, query) =>
    `- [${label}](bear://x-callback-url/search?term=${enc(query)}) — \`${query}\``;
  return `# 🔎 Smart Searches — ${NAME}
#${NAME} #SearchIndex

${mk("Active Tasks", `#${NAME} AND #ToDo`)}
${mk("Confirmed Evidence", `#${NAME} AND #Confirmed`)}
${mk("Code", `#${NAME} AND #Code`)}
${mk("Datasets", `#${NAME} AND #Dataset`)}
${mk("Bugs", `#${NAME} AND #Bug`)}
`;
};

const projectDashboard = (NAME) =>
  `# ${NAME} — Project Dashboard
#${NAME} #Dashboard

- Status: #Active
- Focus: Learning loops + ingest tooling
- Shortcuts:
  - \`make run-js\`, \`make watch-js\`, \`make log.tail\`
  - \`make ingest:smoke\`, \`make ingest:smoke:transcript\`
  - \`make pack-context NAME=my_context\`
`;

const datasetScratchpad = `# Dataset Wrangling Scratchpad
#Dataset #Code #Scratchpad

- JSON→CSV quick test:
  \`node tools/json_to_csv.mjs --file assets/metadata/articles_index.jsonl > out.csv\`
`;

export async function seedNotes(root, kitName) {
  await writeText(
    join(root, `notes/${kitName}_EvidenceLog.md`),
    evidenceHeader(kitName),
  );
  await writeText(
    join(root, "notes/SmartSearch_Index.md"),
    smartSearch(kitName),
  );
  await writeText(
    join(root, "notes/Project_Dashboard.md"),
    projectDashboard(kitName),
  );
  await writeText(
    join(root, "notes/Dataset_Wrangling_Scratchpad.md"),
    datasetScratchpad,
  );
}
