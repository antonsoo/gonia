// biome-ignore-all lint/performance/useDomNodeTextContent: Observe actual old-tab update status.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, firefox } from "playwright";

const output = path.resolve(process.argv[2] ?? "/tmp/gonia-fluting-upgrade/review.json");
const oldEdition = process.argv[3];
if (!/^[a-f0-9]{64}$/.test(oldEdition ?? ""))
  throw new Error(
    "Supply the current old edition digest; send Enter only after the new public bytes match the build.",
  );
await mkdir(path.dirname(output), { recursive: true });
const base = "https://antonsoo.github.io/gonia/",
  fixtures = [];
const report = {
  startedAt: new Date().toISOString(),
  base,
  oldEdition,
  scope:
    "Existing real public tabs held across deployment; browser networking disabled after a complete new cache is established. Public origin remains running.",
  workflows: [],
};
async function inspect(page) {
  return page.evaluate(async () => {
    const worker = navigator.serviceWorker.controller;
    if (!worker) throw new Error("No controller");
    const channel = new MessageChannel();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Inspection timed out")), 8000);
      channel.port1.onmessage = (e) => {
        clearTimeout(timer);
        channel.port1.close();
        resolve(e.data);
      };
      worker.postMessage({ type: "GONIA_INSPECT" }, [channel.port2]);
    });
  });
}
try {
  for (const [name, engine] of Object.entries({ chromium, firefox })) {
    const browser = await engine.launch(),
      context = await browser.newContext({ viewport: { width: 375, height: 1000 } }),
      page = await context.newPage();
    fixtures.push({ name, browser, context, page });
    await page.goto(`${base}entasis.html`);
    await page.locator("#entasis-offline").filter({ hasText: "saved offline" }).waitFor();
    const old = await inspect(page);
    assert.equal(old.edition, oldEdition);
    assert(old.complete);
    assert.equal(await page.getByRole("link", { name: "Fluting", exact: true }).count(), 0);
    console.log(`${name}: public three-room edition controlled; holding old tab.`);
  }
  console.log("Send Enter after verifying the newly published build.");
  process.stdin.resume();
  await new Promise((r) => process.stdin.once("data", r));
  process.stdin.pause();
  const worker = await readFile("dist/sw.js", "utf8"),
    edition = JSON.parse(/const EDITION = ("[^"]+");/.exec(worker)[1]),
    files = JSON.parse(/const FILES = (\[[^\n]+\]);/.exec(worker)[1]);
  assert.notEqual(edition, oldEdition);
  report.newEdition = edition;
  for (const { name, browser, context, page } of fixtures) {
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration()).update();
    });
    await page
      .locator("#entasis-offline")
      .filter({ hasText: "different offline edition" })
      .waitFor({ timeout: 45000 });
    const transition = await inspect(page);
    assert.equal(transition.edition, edition);
    assert(transition.complete);
    await page.reload();
    await page.locator("#entasis-offline").filter({ hasText: "saved offline" }).waitFor();
    const inventory = await page.evaluate(async () => {
      const names = await caches.keys();
      return Promise.all(
        names.map(async (name) => ({
          name,
          paths: (await (await caches.open(name)).keys())
            .map((r) => new URL(r.url).pathname)
            .sort(),
        })),
      );
    });
    assert.equal(inventory.length, 1);
    assert.equal(inventory[0].name, `gonia-${edition}`);
    assert.deepEqual(inventory[0].paths, [...files].sort());
    await context.setOffline(true);
    await page.getByRole("link", { name: "Fluting", exact: true }).click();
    assert.equal(await page.locator("#cut-depth").innerText(), "20.71 mm");
    await page.locator("#recipe").selectOption("ionic");
    assert.equal(await page.locator("#cut-depth").innerText(), "50.00 mm");
    assert.equal(await page.locator("#edge-angle").innerText(), "90°");
    await page.locator('[data-source="2"]').click();
    await page.locator("#source-window img").evaluate((img) => img.decode());
    for (const file of ["./", "spacing.html", "entasis.html", "fluting.html"]) {
      await page.goto(base + file);
      await page.getByRole("link", { name: "Fluting", exact: true }).waitFor();
    }
    report.workflows.push({
      engine: name,
      version: browser.version(),
      oldPageRejectedNewEditionReadiness: true,
      newCacheComplete: true,
      cacheFiles: files.length,
      obsoleteCacheAbsent: true,
      offlineRooms: 4,
      ionicGaugeFits: true,
      greekSourceDecoded: true,
    });
    console.log(`${name}: actual public upgrade and four offline rooms passed.`);
  }
  report.completedAt = new Date().toISOString();
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
} finally {
  for (const f of fixtures) await f.browser.close();
}
