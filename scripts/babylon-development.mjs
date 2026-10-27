// A controlled provenance edit in an isolated checkout must affect the real
// source verifier, the virtual module and the downloadable JSON together.
import assert from "node:assert/strict";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium, firefox } from "playwright";

const [base, fixture, output] = process.argv.slice(2);
assert(
  base && fixture && output,
  "Usage: node scripts/babylon-development.mjs BASE ISOLATED_CHECKOUT OUTPUT_DIR",
);
const root = await realpath(fixture),
  relative = path.relative(await realpath(tmpdir()), root);
assert(
  relative && !relative.startsWith("..") && !path.isAbsolute(relative),
  "Only edit an isolated temporary checkout.",
);
assert(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
const file = path.join(root, "public/sources/babylon/manifest.json"),
  original = await readFile(file, "utf8"),
  record = JSON.parse(original);
assert.equal(original, await readFile("public/sources/babylon/manifest.json", "utf8"));
await mkdir(output, { recursive: true });
const results = [];
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await engine.launch(),
    context = await browser.newContext(),
    page = await context.newPage(),
    errors = [],
    imports = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (new URL(r.url()).pathname.includes("/public/")) imports.push(r.url());
  });
  const moduleURL = `${base}@id/__x00__retained-source-json:public/sources/babylon/manifest.json.js`;
  try {
    await page.goto(`${base}babylon.html`);
    await page.locator("#bb-source-image").waitFor();
    assert.deepEqual(
      await page.evaluate(async (url) => (await import(url)).default, moduleURL),
      record,
    );
    const changed = structuredClone(record);
    changed.files["scheil-300.jpg"].sha256 = "0".repeat(64);
    const reloaded = page.waitForEvent("load");
    await writeFile(file, `${JSON.stringify(changed, null, 2)}\n`);
    await reloaded;
    await page.locator("#bb-source-status").waitFor();
    await page.waitForFunction(() =>
      /does not match/.test(document.querySelector("#bb-source-status").textContent),
    );
    assert.equal(await page.locator("#bb-source-image").isHidden(), true);
    assert.deepEqual(
      await page.evaluate(async (url) => (await import(url)).default, moduleURL),
      changed,
    );
    assert.deepEqual(
      await (await page.request.get(`${base}sources/babylon/manifest.json`)).json(),
      changed,
    );
    let downloads = 0;
    page.on("download", () => downloads++);
    await page.locator("#bb-save").click();
    await page.waitForFunction(() =>
      /does not match/.test(document.querySelector("#bb-save-status").textContent),
    );
    assert.equal(downloads, 0);
    const restored = page.waitForEvent("load");
    await writeFile(file, original);
    await restored;
    await page.locator("#bb-source-status").waitFor();
    await page.waitForFunction(() =>
      /^Verified source/.test(document.querySelector("#bb-source-status").textContent),
    );
    assert.deepEqual(
      await page.evaluate(async (url) => (await import(url)).default, moduleURL),
      record,
    );
    assert.deepEqual(
      await (await page.request.get(`${base}sources/babylon/manifest.json`)).json(),
      record,
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(imports, []);
    results.push({
      engine: name,
      version: browser.version(),
      sourceEditRefusesImageAndIllustratedSave: true,
      restorationRecoversImage: true,
      virtualAndPublicJsonStayIdentical: true,
      directPublicImports: imports,
      applicationErrors: errors,
    });
  } finally {
    await writeFile(file, original);
    await browser.close();
  }
}
await writeFile(
  path.join(output, "development.json"),
  `${JSON.stringify({ fixture: root, base, configurations: results }, null, 2)}\n`,
);
console.log(
  "Both development browsers follow the single retained source identity and recover after restoration.",
);
