// biome-ignore-all lint/performance/useDomNodeTextContent: Inspect the learner's real status and controls.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium, firefox } from "playwright";

const root = path.resolve(process.argv[2] ?? "dist"),
  out = path.resolve(process.argv[3] ?? "/tmp/gonia-offline-audit");
await mkdir(out, { recursive: true });
const report = {
  checkedAt: new Date().toISOString(),
  workerSha256: createHash("sha256")
    .update(await readFile(path.join(root, "sw.js")))
    .digest("hex"),
  configurations: [],
};
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
};
async function serve() {
  const state = {
    worker: "normal",
    entry: "normal",
    asset: "normal",
    online: true,
    activeStalls: 0,
    abortedStalls: 0,
    slowStarted: 0,
    slowFinished: 0,
  };
  const release = [];
  const server = createServer(async (req, res) => {
    if (!state.online) {
      req.socket.destroy();
      return;
    }
    const file =
      decodeURIComponent(new URL(req.url, "http://review").pathname).replace(/^\/gonia\//, "") ||
      "index.html";
    try {
      if (file.includes("..")) throw Error("path");
      let bytes = await readFile(path.join(root, file));
      if (file === "sw.js" && state.worker === "error") {
        res.writeHead(503).end("worker unavailable");
        return;
      }
      if (file === "hoist.html" && ["error", "maintenance"].includes(state.entry)) {
        res
          .writeHead(state.entry === "error" ? 503 : 200, { "Content-Type": "text/html" })
          .end("<!doctype html><html><body>Maintenance screen</body></html>");
        return;
      }
      if (file === "sources/hoist/krohn-226.jpg" && state.asset === "substitute")
        bytes = await readFile(path.join(root, "sources/hoist/krohn-232.jpg"));
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)] ?? "text/plain",
        "Cache-Control": "no-store",
      });
      const stall =
        (file === "hoist.html" && state.entry === "stall") ||
        (file === "sources/hoist/krohn-226.jpg" && state.asset === "stall");
      if (stall) {
        state.activeStalls++;
        res.write(bytes.subarray(0, 128));
        res.on("close", () => {
          state.activeStalls--;
          if (!res.writableEnded) state.abortedStalls++;
        });
        await new Promise((r) => release.push(r));
        if (!res.destroyed) res.end(bytes.subarray(128));
        return;
      }
      if (file === "sources/hoist/krohn-226.jpg" && state.asset === "slow") {
        state.slowStarted++;
        for (let offset = 0; offset < bytes.length; offset += 4096) {
          if (res.destroyed) return;
          res.write(bytes.subarray(offset, offset + 4096));
          await new Promise((r) => setTimeout(r, 200));
        }
        state.slowFinished++;
        res.end();
        return;
      }
      res.end(bytes);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return {
    state,
    base: `http://127.0.0.1:${server.address().port}/gonia/`,
    release() {
      for (const r of release.splice(0)) r();
    },
    async close() {
      for (const r of release.splice(0)) r();
      server.closeAllConnections();
      await new Promise((r) => server.close(r));
    },
  };
}
const ready = (page) =>
  page.waitForFunction(
    () => document.querySelector("#hw-offline")?.textContent === "Workshop & source saved offline",
    null,
    { timeout: 90000 },
  );
async function inspect(page) {
  return page.evaluate(async () => {
    const channel = new MessageChannel();
    try {
      return await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(Error("inspection")), 20000);
        channel.port1.onmessage = (e) => {
          clearTimeout(timer);
          resolve(e.data);
        };
        navigator.serviceWorker.controller.postMessage({ type: "GONIA_INSPECT" }, [channel.port2]);
      });
    } finally {
      channel.port1.close();
      channel.port2.close();
    }
  });
}
async function waitState(predicate) {
  const end = Date.now() + 10000;
  while (!predicate()) {
    assert(Date.now() < end, "Server state did not arrive");
    await new Promise((r) => setTimeout(r, 20));
  }
}
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await engine.launch(),
    server = await serve(),
    folder = path.join(out, name);
  await mkdir(folder, { recursive: true });
  try {
    const context = await browser.newContext({
        viewport: { width: 375, height: 1000 },
        acceptDownloads: true,
      }),
      page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${server.base}hoist.html`);
    await ready(page);
    const tab = await context.newPage();
    await tab.goto(server.base);
    await tab.waitForFunction(
      () =>
        document.querySelector("#offline-status")?.textContent.includes("saved offline") ||
        [...document.querySelectorAll('[role="status"]')].some(
          (e) => e.textContent === "Workshop & source saved offline",
        ),
    );
    await page.evaluate(async () => {
      const key = (await caches.keys()).find((k) => k.startsWith("gonia-")),
        c = await caches.open(key);
      await c.put(
        "/gonia/sources/hoist/krohn-233.jpg",
        await c.match("/gonia/sources/hoist/krohn-232.jpg"),
      );
    });
    await page.getByRole("button", { name: "Check offline files", exact: true }).click();
    await page.getByRole("button", { name: "Repair offline files", exact: true }).waitFor();
    const corrupt = await inspect(page);
    assert.equal(corrupt.complete, false);
    assert.equal(corrupt.corrupt, 1);
    await tab.getByRole("button", { name: "Repair offline files", exact: true }).waitFor();
    await page.screenshot({ path: path.join(folder, "damaged-phone.png"), fullPage: true });
    await page.getByRole("button", { name: "Repair offline files", exact: true }).click();
    await ready(page);
    await tab.getByRole("button", { name: "Check offline files", exact: true }).waitFor();
    assert.equal((await inspect(page)).complete, true);
    await page.evaluate(async () => {
      for (const key of await caches.keys()) if (key.startsWith("gonia-")) await caches.delete(key);
      window.dispatchEvent(new Event("focus"));
    });
    await page.getByRole("button", { name: "Repair offline files", exact: true }).waitFor();
    const empty = await inspect(page);
    assert.equal(empty.complete, false);
    assert(empty.missing > 100);
    await page.getByRole("button", { name: "Repair offline files", exact: true }).click();
    await ready(page);
    await page.locator("#hw-try-loss").click();
    const fallback = [];
    for (const mode of ["error", "maintenance", "stall"]) {
      server.state.entry = mode;
      const start = Date.now();
      await page.reload({ waitUntil: "domcontentloaded", timeout: 8000 });
      await page.locator("#hw-efficiency").waitFor();
      assert.equal(await page.locator("#hw-efficiency").inputValue(), "90");
      assert(!(await page.locator("body").innerText()).includes("Maintenance screen"));
      fallback.push({ mode, milliseconds: Date.now() - start, retainedSelection: true });
      server.state.entry = "normal";
      server.release();
    }
    server.state.online = false;
    await context.setOffline(true);
    await page.reload();
    await ready(page);
    await page.locator("#hw-efficiency").fill("80");
    const offlineDownload = page.waitForEvent("download");
    await page.locator("#hw-save-reading").click();
    await (await offlineDownload).saveAs(path.join(folder, "offline-reading.html"));
    await tab.close();
    await context.close();
    server.state.online = true;
    for (const initialFailure of ["worker", "source"]) {
      server.state.worker = initialFailure === "worker" ? "error" : "normal";
      server.state.asset = initialFailure === "source" ? "substitute" : "normal";
      const firstContext = await browser.newContext({ viewport: { width: 375, height: 1000 } });
      const first = await firstContext.newPage();
      first.on("pageerror", (e) => errors.push(e.message));
      await first.goto(`${server.base}hoist.html`);
      await first
        .getByRole("button", { name: "Retry offline download", exact: true })
        .waitFor({ timeout: 30000 });
      await first.locator("#hw-efficiency").fill("80");
      server.state.online = false;
      await first.getByRole("button", { name: "Retry offline download", exact: true }).click();
      await first.waitForFunction(() => !document.querySelector(".offline-check").disabled);
      assert.notEqual(
        await first.locator("#hw-offline").innerText(),
        "Workshop & source saved offline",
      );
      server.state.online = true;
      server.state.worker = "normal";
      server.state.asset = "normal";
      await first.getByRole("button", { name: "Retry offline download", exact: true }).click();
      await ready(first);
      assert.equal(await first.locator("#hw-efficiency").inputValue(), "80");
      await firstContext.close();
    }
    const cold = await browser.newContext({
        viewport: { width: 375, height: 1000 },
        serviceWorkers: "block",
        acceptDownloads: true,
      }),
      p = await cold.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(`${server.base}hoist.html`);
    await p.locator("#hw-try-loss").click();
    const downloads = [];
    p.on("download", (d) => downloads.push(d.suggestedFilename()));
    server.state.asset = "stall";
    await p.locator("#hw-save-reading").click();
    await waitState(() => server.state.activeStalls > 0);
    await p.locator("#hw-efficiency").fill("80");
    await p.locator("#hw-cancel-reading").focus();
    await p.keyboard.press("Enter");
    await p.waitForFunction(() =>
      document.querySelector("#hw-save-status").textContent.includes("cancelled"),
    );
    assert.equal(await p.locator("#hw-efficiency").inputValue(), "80");
    assert(await p.locator("#hw-save-reading").evaluate((e) => e === document.activeElement));
    assert.equal(downloads.length, 0);
    await waitState(() => server.state.activeStalls === 0);
    server.state.asset = "normal";
    server.release();
    server.state.asset = "stall";
    await p.locator("#hw-save-reading").click();
    await waitState(() => server.state.activeStalls > 0);
    const stalledAt = Date.now();
    await p.waitForFunction(
      () => document.querySelector("#hw-save-status").textContent.includes("stopped arriving"),
      null,
      { timeout: 30000 },
    );
    const idleFailureMs = Date.now() - stalledAt;
    assert(idleFailureMs >= 18000 && idleFailureMs < 26000);
    assert.equal(downloads.length, 0);
    assert(!(await p.locator("#hw-save-reading").isDisabled()));
    server.state.asset = "normal";
    server.release();
    server.state.asset = "substitute";
    await p.locator("#hw-save-reading").click();
    await p.waitForFunction(() =>
      document.querySelector("#hw-save-status").textContent.includes("could not verify"),
    );
    assert.equal(downloads.length, 0);
    server.state.asset = "slow";
    const slowAt = Date.now(),
      slowDownload = p.waitForEvent("download", { timeout: 60000 });
    await p.locator("#hw-save-reading").click();
    const d = await slowDownload;
    await d.saveAs(path.join(folder, "slow-reading.html"));
    const slowMs = Date.now() - slowAt;
    assert(slowMs > 25000);
    assert.equal(server.state.slowFinished, 1);
    server.state.asset = "normal";
    await p.screenshot({ path: path.join(folder, "export-phone.png"), fullPage: true });
    assert.deepEqual(errors, []);
    await cold.close();
    report.configurations.push({
      browser: name,
      version: browser.version(),
      corruptCacheRejected: corrupt.corrupt,
      missingCacheRejected: empty.missing,
      multipleTabsWithdrawReady: true,
      repairVerifiedBytes: true,
      navigationFallback: fallback,
      originDisabledStudy: true,
      firstRegistrationRetry: true,
      firstInstallationRetry: true,
      failedOfflineRetryHandled: true,
      cancelledReadAborted: true,
      idleFailureMs,
      substitutedSourceRejected: true,
      activeTransferMs: slowMs,
      abortedServerStreams: server.state.abortedStalls,
      pageErrors: errors,
    });
    console.log(
      `${name}: corrupt/deleted cache repair, cross-tab status, 503/maintenance/stalled navigation, cancellation, idle expiry and ${slowMs} ms active source transfer passed`,
    );
  } finally {
    await browser.close();
    await server.close();
  }
}
await writeFile(path.join(out, "review.json"), `${JSON.stringify(report, null, 2)}\n`);
