import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, firefox } from "playwright";

const base = process.argv[2],
  output = process.argv[3],
  expected = process.argv[4];
if (!base || !output || !["creates-empty", "read-only"].includes(expected))
  throw new Error(
    "Usage: node scripts/fluting-cache-lookup.mjs <base> <report.json> <creates-empty|read-only>",
  );
const rows = [];
for (const [name, engine] of Object.entries({ chromium, firefox })) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${base}fluting.html`);
    await page.locator("#fluting-offline").filter({ hasText: "saved offline" }).waitFor();
    const result = await page.evaluate(async () => {
      const before = await caches.keys();
      for (const name of before) await caches.delete(name);
      const afterDelete = await caches.keys();
      const r = await fetch("./fonts/IBMPlexSans-Regular.woff2");
      const afterFetch = await caches.keys();
      const files = await Promise.all(
        afterFetch.map(async (name) => ({
          name,
          count: (await (await caches.open(name)).keys()).length,
        })),
      );
      return { before, afterDelete, afterFetch, files, fontStatus: r.status };
    });
    assert.equal(result.afterDelete.length, 0);
    assert.equal(result.fontStatus, 200);
    assert.equal(result.afterFetch.length, expected === "read-only" ? 0 : 1);
    assert(result.files.every((f) => f.count === 0));
    rows.push({ engine: name, version: browser.version(), ...result });
  } finally {
    await browser.close();
  }
}
await mkdir(path.dirname(output), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify({ checkedAt: new Date().toISOString(), base, expected, scope: "Deleting this profile's offline cache then making an ordinary font request. A lookup should not create an empty edition cache.", configurations: rows }, null, 2)}\n`,
);
