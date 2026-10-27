// biome-ignore-all lint/performance/useDomNodeTextContent: Check actual offline-edition transitions.
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium, firefox } from "playwright";

const previous = process.argv[2];
if (!previous) throw Error("Usage: node scripts/babylon-upgrade.mjs <previous-dist> [report.json]");
const output = process.argv[3] ?? "/tmp/gonia-babylon-upgrade.json";
const expected = JSON.parse((await readFile("dist/sw.js", "utf8")).match(/const FILES = (.*);/)[1]);
const results = [];
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await engine.launch();
  try {
    for (const scenario of ["held", "substituted"]) {
      let current = false,
        bad = scenario === "substituted",
        online = true;
      let release;
      const held = new Promise((resolve) => {
        release = resolve;
      });
      const server = createServer(async (req, res) => {
        if (!online) {
          req.socket.destroy();
          return;
        }
        const url = new URL(req.url, "http://review");
        const file = decodeURIComponent(url.pathname).replace(/^\/gonia\//, "") || "index.html";
        if (!url.pathname.startsWith("/gonia/") || file.includes("..")) {
          res.writeHead(404).end();
          return;
        }
        if (current && scenario === "held" && file === "sources/babylon/scheil-304.jpg") await held;
        const actual =
          current && bad && file === "sources/babylon/scheil-304.jpg"
            ? "sources/babylon/scheil-300.jpg"
            : file;
        try {
          const bytes = await readFile(path.join(current ? "dist" : previous, actual));
          const mime = {
            ".js": "text/javascript",
            ".html": "text/html",
            ".css": "text/css",
            ".jpg": "image/jpeg",
            ".ttf": "font/ttf",
            ".woff2": "font/woff2",
            ".svg": "image/svg+xml",
            ".json": "application/json",
            ".xml": "application/xml",
          };
          res
            .writeHead(200, {
              "Content-Type": mime[path.extname(actual)] ?? "text/plain",
              "Cache-Control": "no-store",
            })
            .end(bytes);
        } catch {
          res.writeHead(404).end();
        }
      });
      await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
      const base = `http://127.0.0.1:${server.address().port}/gonia/`;
      const context = await browser.newContext({
        viewport: { width: 375, height: 1000 },
        acceptDownloads: true,
      });
      try {
        const old = await context.newPage();
        await old.goto(`${base}spacing.html`);
        await old.waitForFunction(
          () => document.querySelector("#spacing-offline")?.textContent.includes("saved offline"),
          null,
          { timeout: 60000 },
        );
        const oldCaches = await old.evaluate(() => caches.keys());
        assert.equal(oldCaches.length, 1);
        current = true;
        const p = await context.newPage();
        await p.goto(`${base}babylon.html`);
        await p.evaluate(async () => {
          const r = await navigator.serviceWorker.getRegistration();
          await r.update();
        });
        if (scenario === "held") {
          await p.waitForFunction(() =>
            /Downloading/.test(document.querySelector("#bb-offline")?.textContent ?? ""),
          );
        } else {
          await p.waitForFunction(async () => {
            const r = await navigator.serviceWorker.getRegistration();
            return (
              !r.installing &&
              !r.waiting &&
              /incomplete|different offline edition|unavailable/.test(
                document.querySelector("#bb-offline")?.textContent ?? "",
              )
            );
          });
        }
        const pendingStatus = await p.locator("#bb-offline").innerText();
        assert.ok(!pendingStatus.includes("saved offline"));
        assert.equal(await p.evaluate((cache) => caches.has(cache), oldCaches[0]), true);
        const downloads = [];
        p.on("download", (d) => downloads.push(d));
        await p.locator("#bb-save").click();
        if (scenario === "held") assert.equal(await p.locator("#bb-save").isDisabled(), true);
        else {
          await p.waitForFunction(() =>
            document.querySelector("#bb-save-status").textContent.includes("does not match"),
          );
          // A failed new edition must leave the actual old room usable offline.
          online = false;
          await context.setOffline(true);
          await old.reload();
          await old.waitForFunction(() =>
            document.querySelector("#spacing-offline")?.textContent.includes("saved offline"),
          );
          await context.setOffline(false);
          online = true;
        }
        assert.equal(downloads.length, 0);
        bad = false;
        release();
        await p.locator("#bb-retry").click();
        await p.evaluate(async () => {
          const r = await navigator.serviceWorker.getRegistration();
          await r.update();
        });
        await p.waitForFunction(
          () =>
            document.querySelector("#bb-offline").textContent === "Workshop & source saved offline",
          null,
          { timeout: 60000 },
        );
        await p.waitForFunction(() =>
          document.querySelector("#bb-source-status").textContent.startsWith("Verified"),
        );
        // The export begun in the held case can now finish. Retry the rejected one.
        if (scenario === "held")
          await p.waitForFunction(() =>
            document
              .querySelector("#bb-save-status")
              .textContent.startsWith("Illustrated reading saved"),
          );
        else {
          const saved = p.waitForEvent("download");
          await p.locator("#bb-save").click();
          await saved;
        }
        const inventory = await p.evaluate(async () => {
          const keys = await caches.keys();
          return {
            keys,
            files: (await (await caches.open(keys[0])).keys())
              .map((r) => new URL(r.url).pathname)
              .sort(),
          };
        });
        assert.equal(inventory.keys.length, 1);
        assert.notEqual(inventory.keys[0], oldCaches[0]);
        assert.deepEqual(inventory.files, [...expected].sort());
        // The old tab has the new controller but still contains the old page's
        // edition constant. Reload it from the new cache with the origin gone.
        online = false;
        await context.setOffline(true);
        await old.reload();
        await old.waitForFunction(() =>
          document.querySelector("#spacing-offline")?.textContent.includes("saved offline"),
        );
        await p.reload();
        await p.waitForFunction(() =>
          document.querySelector("#bb-source-status")?.textContent.startsWith("Verified"),
        );
        await p.locator("#bb-supplied").uncheck();
        assert.match(await p.locator("#bb-total").innerText(), /Total unresolved/);
        await p.locator("#bb-load-scan").click();
        await p.waitForFunction(
          () => document.querySelector("#bb-canvas")?.dataset.triangles === "189027",
        );
        assert.deepEqual(await old.evaluate(() => caches.keys()), inventory.keys);
        results.push({
          browser: name,
          scenario,
          pendingStatus,
          oldCachePreservedUntilRecovery: true,
          previousRoomOffline: true,
          newRoomOffline: true,
          cachedFiles: inventory.files.length,
          offlineScanTriangles: 189027,
          originalCacheRetired: true,
          incompleteDownloads: 0,
        });
      } finally {
        release();
        await context.close();
        await new Promise((resolve) => server.close(resolve));
      }
    }
  } finally {
    await browser.close();
  }
}
await writeFile(
  output,
  `${JSON.stringify({ checkedAt: new Date().toISOString(), previous, results }, null, 2)}\n`,
);
console.log(JSON.stringify({ scenarios: results.length, output }));
