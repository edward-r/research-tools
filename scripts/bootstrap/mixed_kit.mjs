import { join } from "node:path";
import { writeText, kitRoot } from "./utils.mjs";
import { writeStandardAssets } from "./assets_setup.mjs";
import { writeNotes } from "./notes_setup.mjs";
import { makefileFor } from "./makefile_tasks.mjs";

export async function bootstrapMixedKit(here, NAME, outBase) {
  const root = kitRoot(here, NAME, outBase);
  await writeStandardAssets(root, NAME);
  await writeNotes(root, NAME);
  await writeText(join(root, "Makefile"), makefileFor(NAME));
  return root;
}
