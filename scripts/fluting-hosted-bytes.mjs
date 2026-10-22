import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.argv[2] ?? "https://antonsoo.github.io/gonia/",
  output = process.argv[3] ?? "/tmp/gonia-fluting-hosted/bytes.json";
async function walk(dir) {
  const rows = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      rows.map((e) =>
        e.isDirectory() ? walk(path.join(dir, e.name)) : Promise.resolve([path.join(dir, e.name)]),
      ),
    )
  ).flat();
}
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
let rows = await Promise.all(
  (await walk("dist")).sort().map(async (file) => {
    const bytes = await readFile(file);
    return {
      path: path.relative("dist", file).split(path.sep).join("/"),
      bytes: bytes.length,
      sha256: sha(bytes),
      verified: false,
    };
  }),
);
const startedAt = new Date().toISOString(),
  deadline = Date.now() + 180000;
do {
  rows = await Promise.all(
    rows.map(async (row) => {
      if (row.verified) return row;
      const url = new URL(row.path, base).href;
      try {
        const r = await fetch(url, {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache" },
            signal: AbortSignal.timeout(20000),
          }),
          bytes = Buffer.from(await r.arrayBuffer()),
          observedSha256 = sha(bytes);
        return {
          ...row,
          url,
          httpStatus: r.status,
          observedBytes: bytes.length,
          observedSha256,
          verified: r.status === 200 && bytes.length === row.bytes && observedSha256 === row.sha256,
        };
      } catch (error) {
        return { ...row, url, error: String(error), verified: false };
      }
    }),
  );
  if (rows.every((r) => r.verified) || Date.now() > deadline) break;
  await new Promise((r) => setTimeout(r, 5000));
} while (Date.now() <= deadline);
await mkdir(path.dirname(output), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify({ startedAt, checkedAt: new Date().toISOString(), base, scope: "Canonical public URL bytes against every current build file. Older hashed assets may be retained separately for existing readers.", expectedFiles: rows.length, verifiedFiles: rows.filter((r) => r.verified).length, files: rows }, null, 2)}\n`,
);
assert(
  rows.every((r) => r.verified),
  `Unverified public files: ${rows
    .filter((r) => !r.verified)
    .map((r) => r.path)
    .join(", ")}`,
);
console.log(`Canonical public files verified: ${rows.length}`);
