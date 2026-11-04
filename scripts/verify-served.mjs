import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const base = process.argv[2] ?? "http://127.0.0.1:4328/gonia/",
  out = process.argv[3];
if (!out) throw new Error("Provide a base URL and a receipt file.");
const worker = await readFile("dist/sw.js", "utf8");
const files = [...JSON.parse(/const FILES = (\[[^;]+\]);/.exec(worker)[1]), "/gonia/sw.js"];
const errors = [];
let index = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (index < files.length) {
      const p = files[index++];
      let ok = false;
      for (let n = 0; n < 3 && !ok; n++) {
        try {
          const r = await fetch(new URL(p, base), { signal: AbortSignal.timeout(45000) });
          if (!r.ok) throw Error(`${r.status}`);
          const bytes = Buffer.from(await r.arrayBuffer()),
            local = await readFile(`dist/${p.slice(7)}`);
          if (
            createHash("sha256").update(bytes).digest("hex") !==
            createHash("sha256").update(local).digest("hex")
          )
            throw Error("bytes differ");
          ok = true;
        } catch (e) {
          if (n === 2) errors.push({ path: p, error: String(e) });
        }
      }
    }
  }),
);
const result = {
  checkedAt: new Date().toISOString(),
  origin: base,
  files: files.length,
  matched: files.length - errors.length,
  errors,
  workerSha256: createHash("sha256").update(worker).digest("hex"),
  edition: /const EDITION = "([a-f0-9]+)"/.exec(worker)[1],
};
await writeFile(out, `${JSON.stringify(result, null, 2)}\n`);
console.log(result);
if (errors.length) process.exitCode = 1;
