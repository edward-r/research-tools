import { promises as fs } from "node:fs";
import { resolve } from "node:path";

export const ensureDir = async (p) => fs.mkdir(p, { recursive: true });
export const writeText = async (p, s) => {
  await ensureDir(p.substring(0, p.lastIndexOf("/")));
  await fs.writeFile(p, s, "utf8");
};
export const absPath = (p) => resolve(p);
export const parseKv = (argv) =>
  Object.fromEntries(
    argv
      .map((a, i, arr) =>
        a.startsWith("--") ? [a.slice(2), arr[i + 1]] : null,
      )
      .filter(Boolean),
  );
