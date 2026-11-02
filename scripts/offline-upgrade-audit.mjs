// biome-ignore-all lint/performance/useDomNodeTextContent: Audit the visible upgrade boundary.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium, firefox } from "playwright";

const previous = path.resolve(process.argv[2] ?? ""),
  current = path.resolve(process.argv[3] ?? "dist"),
  out = path.resolve(process.argv[4] ?? "/tmp/gonia-upgrade-audit");
if (!process.argv[2]) throw Error("Supply the previous built edition.");
await mkdir(out, { recursive: true });
const report = { checkedAt: new Date().toISOString(), configurations: [] };
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".pdf": "application/pdf",
};
const ready = (p) =>
  p.waitForFunction(
    () => document.querySelector("#hw-offline").textContent === "Workshop & source saved offline",
    null,
    { timeout: 90000 },
  );
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  if (process.env.GONIA_AUDIT_ENGINE && process.env.GONIA_AUDIT_ENGINE !== name) continue;
  const browser = await engine.launch();
  try {
    for (const mode of ["held", "substituted"]) {
      let upgraded = false,
        online = true,
        bad = true,
        hits = 0;
      let release;
      const hold = new Promise((r) => {
        release = r;
      });
      const server = createServer(async (req, res) => {
        if (!online) {
          req.socket.destroy();
          return;
        }
        const file =
          new URL(req.url, "http://review").pathname.replace(/^\/gonia\//, "") || "index.html";
        try {
          if (file.includes("..")) throw Error("path");
          if (upgraded && file === "sources/hoist/krohn-233.jpg") {
            hits++;
            if (mode === "held" && bad) await hold;
          }
          const actual =
            upgraded && bad && mode === "substituted" && file === "sources/hoist/krohn-233.jpg"
              ? "sources/hoist/krohn-232.jpg"
              : file;
          const bytes = await readFile(path.join(upgraded ? current : previous, actual));
          res
            .writeHead(200, {
              "Content-Type": types[path.extname(file)] ?? "text/plain",
              "Cache-Control": "no-store",
            })
            .end(bytes);
        } catch {
          if (!res.headersSent) res.writeHead(404);
          res.end();
        }
      });
      await new Promise((r) => server.listen(0, "127.0.0.1", r));
      const base = `http://127.0.0.1:${server.address().port}/gonia/`;
      const context = await browser.newContext({ viewport: { width: 375, height: 1000 } }),
        page = await context.newPage();
      try {
        await page.goto(`${base}hoist.html`);
        await ready(page);
        const oldCache = await page.evaluate(() => caches.keys());
        const oldTab = await context.newPage();
        await oldTab.goto(`${base}hoist.html`);
        await ready(oldTab);
        upgraded = true;
        await page.reload();
        await page.evaluate(async () => {
          void (await navigator.serviceWorker.getRegistration()).update().catch(() => {});
        });
        const requestedBy = Date.now() + 15000;
        while (hits === 0) {
          assert(Date.now() < requestedBy, "The candidate source was not requested");
          await new Promise((resolve) => setTimeout(resolve, 25));
        }
        if (mode === "held") {
          await page.waitForFunction(
            () =>
              document.querySelector("#hw-offline").textContent !==
              "Workshop & source saved offline",
          );
          await page.waitForTimeout(5000);
        } else {
          await page.waitForFunction(async () => {
            const r = await navigator.serviceWorker.getRegistration();
            return (
              !r.installing &&
              !r.waiting &&
              document.querySelector("#hw-offline").textContent !==
                "Workshop & source saved offline"
            );
          });
        }
        const pendingStatus = await page.locator("#hw-offline").innerText();
        assert(hits > 0);
        assert.notEqual(
          await page.locator("#hw-offline").innerText(),
          "Workshop & source saved offline",
        );
        assert(await page.evaluate((key) => caches.has(key), oldCache[0]));
        online = false;
        await page.reload();
        await page.locator("#hw-rig").waitFor();
        assert.equal(await page.locator("#hw-cancel-reading").count(), 0);
        await page.locator("#hw-try-loss").click();
        await page.locator("#hw-efficiency").fill("80");
        assert.match(await page.locator("#hw-loss-finding").innerText(), /65.07%/);
        online = true;
        bad = false;
        release();
        await page.reload();
        await page.evaluate(async () => {
          void (await navigator.serviceWorker.getRegistration()).update().catch(() => {});
        });
        await ready(page);
        assert.equal(await page.locator("#hw-cancel-reading").count(), 1);
        assert.equal(await page.locator("#hw-efficiency").inputValue(), "80");
        await oldTab.waitForFunction(
          () =>
            document.querySelector("#hw-offline").textContent !== "Workshop & source saved offline",
        );
        const oldTabStatus = await oldTab.locator("#hw-offline").innerText();
        assert.match(oldTabStatus, /different|updated|Downloading/);
        const finalCaches = await page.evaluate(() => caches.keys());
        assert(!finalCaches.includes(oldCache[0]));
        online = false;
        await context.setOffline(true);
        await page.reload();
        await ready(page);
        await page.locator("#hw-efficiency").fill("90");
        assert.match(await page.locator("#hw-loss-finding").innerText(), /81.3%/);
        await oldTab.close();
        report.configurations.push({
          browser: name,
          version: browser.version(),
          mode,
          heldOrSubstitutedRequests: hits,
          pendingStatus,
          priorEditionRetainedWhileIncomplete: true,
          currentSelectionRetained: true,
          oldTabWithdrewReady: true,
          oldTabStatus,
          oldCacheRemovedAfterSuccess: true,
          upgradedEditionWorkedWithOriginRefused: true,
        });
        console.log(
          `${name} ${mode}: old offline edition survived; complete upgrade preserved settings and withdrew the old tab's ready claim`,
        );
      } finally {
        release();
        await context.close();
        server.closeAllConnections();
        await new Promise((r) => server.close(r));
      }
    }
  } finally {
    await browser.close();
  }
}
await writeFile(path.join(out, "review.json"), `${JSON.stringify(report, null, 2)}\n`);
