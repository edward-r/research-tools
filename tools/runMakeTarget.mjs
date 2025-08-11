import { spawn } from "node:child_process";

export const runMake = (target = "help", vars = {}) =>
  new Promise((resolve, reject) => {
    const args = [target, ...Object.entries(vars).map(([k, v]) => `${k}=${v}`)];
    const ps = spawn("make", args, { stdio: "inherit" });
    ps.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`make ${target} exited ${code}`)),
    );
  });

// Example:
// await runMake('run:js', { JS_FILE: 'assets/code/sample_csv_stats.mjs', KIT_NAME: 'PROJECT_NAME' });
