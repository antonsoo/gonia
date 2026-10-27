import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium, firefox } from "playwright";

const [beforeArg, afterArg, receiptArg] = process.argv.slice(2);
if (!beforeArg || !afterArg || !receiptArg)
  throw new Error("Provide previous dist, new dist and receipt path.");
const before = path.resolve(beforeArg),
  after = path.resolve(afterArg);
let root = before,
  held = false,
  release;
let gate = Promise.resolve();
const types = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1");
    if (!url.pathname.startsWith("/gonia/")) {
      res.writeHead(404);
      res.end();
      return;
    }
    const file = path.resolve(root, decodeURIComponent(url.pathname.slice(7)) || "index.html");
    if (!file.startsWith(`${root}/`)) throw new Error("Outside build");
    if (held && root === after && file.endsWith("sardis-dp144130.jpg")) await gate;
    const bytes = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(bytes);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}/gonia/`;
const records = [];
async function inspect(page) {
  return page.evaluate(async () => {
    const names = (await caches.keys()).filter((n) => n.startsWith("gonia-"));
    const cache = await caches.open(names[0]);
    return { names, files: (await cache.keys()).map((r) => new URL(r.url).pathname) };
  });
}
try {
  for (const [engine, driver] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await driver.launch();
    try {
      root = before;
      held = false;
      const context = await browser.newContext({ viewport: { width: 1100, height: 900 } });
      const page = await context.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      await page.goto(base);
      await page.waitForFunction(
        () => document.getElementById("offline").textContent === "Workshop & source saved offline",
        null,
        { timeout: 60000 },
      );
      const old = await inspect(page);
      assert.equal(old.names.length, 1);
      assert.equal(old.files.includes("/gonia/volute.html"), false);
      root = after;
      held = true;
      gate = new Promise((resolve) => {
        release = resolve;
      });
      await page.goto(new URL("volute.html", base).href);
      await page.locator("#vo-draw").waitFor();
      await page.waitForFunction(() =>
        /Downloading/.test(document.getElementById("vo-offline").textContent),
      );
      const incomplete = await page.locator("#vo-offline").textContent();
      assert.doesNotMatch(incomplete, /saved offline/);
      held = false;
      release();
      await page.waitForFunction(
        () =>
          document.getElementById("vo-offline").textContent === "Workshop & source saved offline",
        null,
        { timeout: 60000 },
      );
      const current = await inspect(page);
      assert.equal(current.names.length, 1);
      assert.notEqual(current.names[0], old.names[0]);
      assert.ok(current.files.includes("/gonia/volute.html"));
      assert.ok(current.files.includes("/gonia/sources/volute/sardis-dp144130.jpg"));
      await context.setOffline(true);
      await page.reload();
      await page.locator("#vo-draw").waitFor();
      await page.getByText("Other starting sheets", { exact: true }).click();
      await page.locator("#vo-complete").click();
      assert.equal(await page.locator("[data-arc]").count(), 12);
      assert.match(await page.locator("#vo-join-note").textContent(), /8\.130102/);
      await page.locator("#vo-page").selectOption("6");
      await page.waitForFunction(() =>
        document
          .getElementById("vo-source-caption")
          .textContent.includes("Image identity verified"),
      );
      const pending = page.waitForEvent("download");
      await page.locator("#vo-save-svg").click();
      const download = await pending;
      assert.equal(await download.failure(), null);
      await page.getByRole("link", { name: "Doric corner", exact: true }).click();
      await page.locator("#beam").waitFor();
      await page.getByRole("link", { name: "Ionic volute", exact: true }).click();
      await page.locator("#vo-draw").waitFor();
      assert.deepEqual(errors, []);
      records.push({
        engine,
        beforeCache: old.names[0],
        beforeFiles: old.files.length,
        blockedAssetStatus: incomplete,
        afterCache: current.names[0],
        afterFiles: current.files.length,
        oldCacheRemoved: true,
        offlineNewPage: true,
        offlineMuseumPhotograph: true,
        offlineDownload: true,
        offlineRootReturn: true,
        pageErrors: errors,
      });
      await context.close();
    } finally {
      held = false;
      release?.();
      await browser.close();
    }
  }
  await writeFile(
    receiptArg,
    `${JSON.stringify({ scope: "Local previous-commit to new-build service-worker replacement", records }, null, 2)}\n`,
  );
  console.log(JSON.stringify(records, null, 2));
} finally {
  held = false;
  release?.();
  await new Promise((resolve) => server.close(resolve));
}
