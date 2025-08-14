import { promises as fs } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const mkdirp = (p) => fs.mkdir(p, { recursive: true });

export const writeText = async (file, text) => {
  await fs.mkdir(dirname(file), { recursive: true });
  await fs.writeFile(file, text, "utf8");
};

export const chmodx = async (file) => {
  try {
    await fs.chmod(file, 0o755);
  } catch {}
};

// NEW: project root = two levels up from scripts/bootstrap/
export const projectRoot = (here) => resolve(here, "..", "..");

// UPDATED: kits at repo root by default
export const kitRoot = (here, NAME, outBase) =>
  join(outBase ?? projectRoot(here), `${NAME}_NODEONLY`);
