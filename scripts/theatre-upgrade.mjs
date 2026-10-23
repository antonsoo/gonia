// biome-ignore-all lint/performance/useDomNodeTextContent: Inspect visible installation state.
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { chromium, firefox } from "playwright";

const previous = process.argv[2];
if (!previous)
  throw new Error("Usage: node scripts/theatre-upgrade.mjs <previous-six-room-dist> [report.json]");
const output = process.argv[3] ?? "/tmp/gonia-theatre-upgrade.json";
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
        if (current && scenario === "held" && file === "sources/theatre/krohn-110.jpg") await held;
        try {
          const actual =
            current && bad && file === "sources/theatre/krohn-110.jpg"
              ? "sources/theatre/krohn-109.jpg"
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
        await page.goto(`${base}theatre.html`, { waitUntil: "domcontentloaded" });
        await page.evaluate(async () => {
          const r = await navigator.serviceWorker.getRegistration();
          await r.update();
        });
        if (scenario === "held")
          await page.waitForFunction(() =>
            document.querySelector("#th-offline").textContent.match(/Preparing|Downloading/),
          );
        else
          await page.waitForFunction(async () => {
            const registration = await navigator.serviceWorker.getRegistration();
            const status = document.querySelector("#th-offline").textContent;
            return (
              !registration.installing &&
              !registration.waiting &&
              /incomplete|different offline edition|unavailable/.test(status)
            );
          });
        const pendingStatus = await page.locator("#th-offline").innerText();
        assert(!pendingStatus.includes("saved offline"));
        const oldCachePresent = await page.evaluate((old) => caches.has(old), oldCache[0]);
        assert(oldCachePresent);
        const blockedDownloads = [];
        page.on("download", (download) => blockedDownloads.push(download));
        await page.locator("#th-save-reading").click();
        if (scenario === "held") {
          assert.equal(await page.locator("#th-save-reading").isDisabled(), true);
        } else {
          await page.waitForFunction(() =>
            document
              .querySelector("#th-action-status")
              .textContent.includes("does not match this edition"),
          );
          assert.match(await page.locator("#th-action-status").textContent(), /Reload online/);
        }
        assert.equal(blockedDownloads.length, 0);
        if (scenario === "held") {
          const deadline = Date.now() + 10000;
          while (
            !expectedFiles.every(
              (file) => file === "sources/theatre/krohn-110.jpg" || delivered.has(file),
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
          await page.locator('nav a[href="./theatre.html"]').count(),
          0,
          "Incomplete installation replaced the old six-room edition",
        );
        assert(requests > 0);
        available = true;
        bad = false;
        release();
        await page.goto(`${base}theatre.html`, { waitUntil: "domcontentloaded" });
        if (scenario === "substituted")
          await page.evaluate(async () => {
            const r = await navigator.serviceWorker.getRegistration();
            await r.update();
          });
        await page
          .waitForFunction(
            () => document.querySelector("#th-offline").textContent.includes("saved offline"),
            {},
            { timeout: 30000 },
          )
          .catch(async (error) => {
            console.log(
              JSON.stringify(
                await page.evaluate(async () => {
                  const registration = await navigator.serviceWorker.getRegistration();
                  return {
                    status: document.querySelector("#th-offline").textContent,
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
        // A superseded worker's in-flight fetch can leave an empty cache after
        // activation has deleted it. Such caches must contain no old files;
        // the current worker's inspection must be read-only.
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
          ["fluting.html", "#fluting-title"],
          ["transport.html", "#transport-heading"],
          ["colonnade.html", "#col-heading"],
          ["theatre.html", "#th-title"],
        ]) {
          await page.goto(base + entry);
          await page.locator(heading).waitFor();
        }
        await page.locator("#th-roman").click();
        assert.equal(await page.locator("#th-roman").getAttribute("aria-pressed"), "true");
        await page.locator("#th-source").selectOption("4");
        await page.locator("#th-source-image").scrollIntoViewIfNeeded();
        await page.waitForFunction(() => {
          const image = document.querySelector("#th-source-image");
          return image.complete && image.naturalWidth > 0;
        });
        rows.push({
          browser: name,
          version: browser.version(),
          scenario,
          oldCache: oldCache[0],
          pendingStatus,
          oldSixRoomEditionWorkedOffline: true,
          unverifiedReadingNotDownloaded: true,
          newCache: completeCache,
          obsoleteEmptyCaches: obsoleteCaches,
          newSevenRoomEditionWorkedOffline: true,
          disabledOriginRequests: requests,
        });
        console.log(
          `${name}: ${scenario} update preserved old offline pages, then installed all seven`,
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
  `${JSON.stringify({ checkedAt: new Date().toISOString(), previous: "supplied prior six-room build", rows }, null, 2)}\n`,
);
