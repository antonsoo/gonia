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
    if (held && root === after && file.endsWith("krohn-141.jpg")) await gate;
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
      assert.ok(old.files.includes("/gonia/arch.html"));
      root = after;
      held = true;
      gate = new Promise((resolve) => {
        release = resolve;
      });
      await page.goto(new URL("arch.html", base).href);
      await page.locator("#ar-slide").waitFor();
      await page.waitForFunction(() =>
        /Downloading/.test(document.getElementById("ar-offline").textContent),
      );
      const incomplete = await page.locator("#ar-offline").textContent();
      assert.doesNotMatch(incomplete, /saved offline/);
      held = false;
      release();
      await page.waitForFunction(
        () =>
          document.getElementById("ar-offline").textContent === "Workshop & source saved offline",
        null,
        { timeout: 60000 },
      );
      const current = await inspect(page);
      assert.equal(current.names.length, 1);
      assert.notEqual(current.names[0], old.names[0]);
      assert.ok(current.files.includes("/gonia/arch.html"));
      assert.ok(current.files.includes("/gonia/sources/arch/krohn-141.jpg"));
      await context.setOffline(true);
      await page.reload();
      await page.locator("#ar-drawing").waitFor();
      await page.locator("#ar-slide").click();
      assert.match(
        await page.locator("#ar-verdict").textContent(),
        /contacts fit.*friction does not/,
      );
      await page.locator("#ar-fit-whole").click();
      assert.match(
        await page.locator("#ar-verdict").textContent(),
        /meets the contact and friction/,
      );
      await page.locator("#ar-page").selectOption("0");
      await page.waitForFunction(() =>
        document.getElementById("ar-source-caption").textContent.includes("identity verified"),
      );
      const pending = page.waitForEvent("download");
      await page.locator("#ar-html").click();
      const download = await pending;
      assert.equal(await download.failure(), null);
      await page.getByRole("link", { name: "Doric corner", exact: true }).click();
      await page.locator("#beam").waitFor();
      await page.getByRole("link", { name: "Arch and pier", exact: true }).click();
      await page.locator("#ar-drawing").waitFor();
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
        offlineSourcePage: true,
        finiteFrictionRepair: true,
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
