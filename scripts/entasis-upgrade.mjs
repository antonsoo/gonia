// biome-ignore-all lint/performance/useDomNodeTextContent: Inspect visible installation state.
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { chromium, firefox } from "playwright";

const previous = process.argv[2];
if (!previous)
  throw new Error("Usage: node scripts/entasis-upgrade.mjs <previous-two-page-dist> [report.json]");
const output = process.argv[3] ?? "/tmp/gonia-entasis-upgrade.json";
const rows = [];
const workerText = await readFile("dist/sw.js", "utf8");
const expectedFiles = JSON.parse(workerText.match(/const FILES = (.*);/)[1]).map((url) =>
  url.replace(/^\/gonia\//, ""),
);
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await engine.launch();
  try {
    for (const scenario of ["held", "substituted"]) {
      let current = false,
        available = true,
        bad = scenario === "substituted",
        requests = 0;
      let release;
      const held = new Promise((resolve) => {
        release = resolve;
      });
      const delivered = new Set();
      const server = http.createServer(async (req, res) => {
        if (!available) {
          requests++;
          req.socket.destroy();
          return;
        }
        const url = new URL(req.url, "http://local");
        const file = decodeURIComponent(url.pathname).replace(/^\/gonia\//, "") || "index.html";
        if (!url.pathname.startsWith("/gonia/") || file.includes("..")) {
          res.writeHead(404).end();
          return;
        }
        if (current && scenario === "held" && file === "sources/entasis/penrose-039.jpg")
          await held;
        try {
          const actual =
            current && bad && file === "sources/entasis/penrose-039.jpg"
              ? "sources/entasis/penrose-040.jpg"
              : file;
          const bytes = await readFile(path.join(current ? "dist" : previous, actual));
          if (current) res.on("finish", () => delivered.add(file));
          const types = {
            ".html": "text/html",
            ".js": "text/javascript",
            ".css": "text/css",
            ".jpg": "image/jpeg",
            ".svg": "image/svg+xml",
            ".pdf": "application/pdf",
            ".ttf": "font/ttf",
            ".woff2": "font/woff2",
          };
          res
            .writeHead(200, {
              "Content-Type": types[path.extname(file)] ?? "text/plain",
              "Cache-Control": "no-store",
            })
            .end(bytes);
        } catch {
          res.writeHead(404).end();
        }
      });
      await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
      const base = `http://127.0.0.1:${server.address().port}/gonia/`;
      const context = await browser.newContext();
      try {
        const page = await context.newPage();
        await page.goto(`${base}spacing.html`);
        await page.waitForFunction(() =>
          document.querySelector("#spacing-offline").textContent.includes("saved offline"),
        );
        const oldCache = await page.evaluate(() => caches.keys());
        assert.equal(oldCache.length, 1);
        current = true;
        await page.goto(`${base}entasis.html`);
        await page.evaluate(async () => {
          const r = await navigator.serviceWorker.getRegistration();
          await r.update();
        });
        if (scenario === "held")
          await page.waitForFunction(() =>
            document.querySelector("#entasis-offline").textContent.includes("Downloading"),
          );
        else
          await page.waitForFunction(async () => {
            const registration = await navigator.serviceWorker.getRegistration();
            const status = document.querySelector("#entasis-offline").textContent;
            return (
              !registration.installing &&
              !registration.waiting &&
              /incomplete|different offline edition/.test(status)
            );
          });
        const pendingStatus = await page.locator("#entasis-offline").innerText();
        assert(!pendingStatus.includes("saved offline"));
        const oldCachePresent = await page.evaluate((old) => caches.has(old), oldCache[0]);
        assert(oldCachePresent);
        if (scenario === "held") {
          const deadline = Date.now() + 10000;
          while (
            !expectedFiles.every(
              (file) => file === "sources/entasis/penrose-039.jpg" || delivered.has(file),
            )
          ) {
            if (Date.now() > deadline)
              throw new Error(
                `Other update responses still pending: ${expectedFiles.filter((file) => !delivered.has(file)).join(", ")}`,
              );
            await new Promise((resolve) => setTimeout(resolve, 25));
          }
        }
        available = false;
        await page.goto(`${base}spacing.html`);
        await page.locator('[data-system="eustyle"]').click();
        await page.locator("#equal-centre").check();
        assert.match(await page.locator("#alteration").innerText(), /Your alteration/);
        assert.equal(
          await page.locator('nav a[href="./entasis.html"]').count(),
          0,
          "Incomplete installation replaced the old two-page edition",
        );
        assert(requests > 0);
        available = true;
        bad = false;
        release();
        await page.goto(`${base}entasis.html`);
        if (scenario === "substituted")
          await page.evaluate(async () => {
            const r = await navigator.serviceWorker.getRegistration();
            await r.update();
          });
        await page
          .waitForFunction(
            () => document.querySelector("#entasis-offline").textContent.includes("saved offline"),
            {},
            { timeout: 30000 },
          )
          .catch(async (error) => {
            console.log(
              JSON.stringify(
                await page.evaluate(async () => {
                  const registration = await navigator.serviceWorker.getRegistration();
                  return {
                    status: document.querySelector("#entasis-offline").textContent,
                    installing: registration?.installing?.state,
                    waiting: registration?.waiting?.state,
                    active: registration?.active?.state,
                    controller: navigator.serviceWorker.controller?.state,
                    sameController: navigator.serviceWorker.controller === registration?.active,
                    caches: await Promise.all(
                      (await caches.keys()).map(async (key) => ({
                        key,
                        files: (await (await caches.open(key)).keys()).map(
                          (r) => new URL(r.url).pathname,
                        ),
                      })),
                    ),
                  };
                }),
                null,
                2,
              ),
            );
            throw error;
          });
        const newCache = await page.evaluate(() => caches.keys());
        const completeCache = workerText.match(/const CACHE = "([^"]+)"/)[1];
        assert(newCache.includes(completeCache));
        assert.notEqual(completeCache, oldCache[0]);
        // The published old worker's inspection uses caches.open and can leave
        // an empty cache after activation has deleted it. It must contain no
        // old files; the new worker's inspection is read-only.
        const obsoleteCaches = await page.evaluate(
          async (current) =>
            Promise.all(
              (await caches.keys())
                .filter((key) => key !== current)
                .map(async (key) => ({
                  key,
                  files: (await (await caches.open(key)).keys()).length,
                })),
            ),
          completeCache,
        );
        assert(obsoleteCaches.every((cache) => cache.files === 0));
        available = false;
        for (const [entry, heading] of [
          ["", "#workshop-title"],
          ["spacing.html", "#spacing-title"],
          ["entasis.html", "#entasis-title"],
        ]) {
          await page.goto(base + entry);
          await page.locator(heading).waitFor();
        }
        await page.locator("#compare-circle").click();
        assert.equal(await page.locator("#entasis-prediction").inputValue(), "circle");
        rows.push({
          browser: name,
          version: browser.version(),
          scenario,
          oldCache: oldCache[0],
          pendingStatus,
          oldTwoPageEditionWorkedOffline: true,
          newCache: completeCache,
          obsoleteEmptyCaches: obsoleteCaches,
          newThreePageEditionWorkedOffline: true,
          disabledOriginRequests: requests,
        });
        console.log(
          `${name}: ${scenario} update preserved old offline pages, then installed all three`,
        );
      } finally {
        release();
        await context.close();
        server.closeAllConnections();
        await new Promise((resolve) => server.close(resolve));
      }
    }
  } finally {
    await browser.close();
  }
}
await writeFile(
  output,
  `${JSON.stringify({ checkedAt: new Date().toISOString(), previous: path.resolve(previous), rows }, null, 2)}\n`,
);
