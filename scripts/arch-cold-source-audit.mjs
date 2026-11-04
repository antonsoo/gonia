// biome-ignore-all lint/performance/useDomNodeTextContent: Observe the actual cold foreground arch study.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium, firefox } from "playwright";

const sourceRoot = path.resolve(process.argv[2] ?? "dist"),
  out = path.resolve(process.argv[3] ?? "/tmp/gonia-cold-source");
await mkdir(out, { recursive: true });
const root = await mkdtemp(path.join(out, "tested-build-"));
await cp(sourceRoot, root, { recursive: true });
const types = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".jpg": "image/jpeg",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".pdf": "application/pdf",
};
let activePage;
const lifecycle = [];
let online = true,
  sent = 0,
  requests = 0;
const queue = [];
const started = Date.now();
// One shared payload budget for every request, not a separate throttle per file.
const tick = setInterval(() => {
  const job = queue.shift();
  if (!job) return;
  if (job.res.destroyed) return;
  const end = Math.min(job.at + 4096, job.bytes.length);
  job.res.write(job.bytes.subarray(job.at, end));
  sent += end - job.at;
  job.at = end;
  if (end === job.bytes.length) job.res.end();
  else queue.push(job);
}, 32);
const server = createServer(async (req, res) => {
  if (!online) {
    req.socket.destroy();
    return;
  }
  const file = new URL(req.url, "http://review").pathname.replace(/^\/gonia\//, "") || "index.html";
  try {
    if (file.includes("..")) throw Error("path");
    const bytes = await readFile(path.join(root, file));
    requests++;
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] ?? "text/plain",
      "Cache-Control": "no-store",
    });
    res.flushHeaders();
    queue.push({ res, bytes, at: 0 });
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/gonia/`,
  browser = await (process.argv[4] === "firefox" ? firefox : chromium).launch();
const heartbeat = setInterval(async () => {
  console.log(
    `shared transfer: ${Math.round((Date.now() - started) / 1000)} s, ${(sent / 1048576).toFixed(1)} MiB, ${queue.length} bodies active`,
  );
  if (activePage)
    console.log(
      "worker state",
      JSON.stringify(
        await activePage
          .evaluate(async () => {
            const r = await navigator.serviceWorker.getRegistration();
            return {
              status: document.querySelector("#ar-offline").textContent,
              installing: r?.installing?.state,
              active: r?.active?.state,
              waiting: r?.waiting?.state,
              controller: navigator.serviceWorker.controller?.state,
              progress: await (await caches.match("/gonia/.offline-progress"))?.json(),
            };
          })
          .catch((error) => ({ error: String(error) })),
      ),
    );
}, 30000);
try {
  const context = await browser.newContext({
      viewport: { width: 375, height: 1000 },
      acceptDownloads: true,
    }),
    page = await context.newPage(),
    errors = [];
  activePage = page;
  await page.addInitScript(() => {
    globalThis.__workerAudit = [];
    const original = navigator.serviceWorker.register.bind(navigator.serviceWorker),
      seen = new WeakSet();
    let id = 0;
    navigator.serviceWorker.register = async (...args) => {
      const registration = await original(...args);
      const watch = () => {
        for (const worker of [registration.installing, registration.waiting, registration.active]) {
          if (!worker || seen.has(worker)) continue;
          seen.add(worker);
          const number = ++id;
          const record = () =>
            globalThis.__workerAudit.push({
              worker: number,
              state: worker.state,
              atMs: performance.now(),
            });
          record();
          worker.addEventListener("statechange", record);
        }
      };
      registration.addEventListener("updatefound", watch);
      watch();
      return registration;
    };
  });
  context.on("serviceworker", (worker) => {
    lifecycle.push({ atMs: Date.now() - started, event: "worker-created" });
    worker.on("close", () =>
      lifecycle.push({ atMs: Date.now() - started, event: "worker-closed" }),
    );
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("browser", msg.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}arch.html`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator("#ar-threshold-example").click();
  const exportStarted = Date.now(),
    pending = page.waitForEvent("download", { timeout: 240000 });
  await page.locator("#ar-html").click();
  await page.locator("#ar-width").evaluate((node) => {
    node.value = "120";
    node.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const download = await pending;
  await download.saveAs(path.join(out, "cold-reading.html"));
  const exportMs = Date.now() - exportStarted;
  const during = await page.locator("#ar-offline").innerText();
  assert.notEqual(during, "Workshop & source saved offline");
  assert.equal(await page.locator("#ar-width").inputValue(), "120");
  const html = await readFile(path.join(out, "cold-reading.html"), "utf8");
  const encoded = html.match(
    /download="gonia-arch.json" href="data:application\/json;base64,([^"]+)"/,
  );
  assert.ok(encoded);
  const snapshot = JSON.parse(Buffer.from(encoded[1], "base64").toString("utf8"));
  assert.equal(snapshot.state.width, 140);
  assert.match(html, /friction search|Friction search/);
  assert.match(html, /Required Notice: Copyright/);
  console.log(
    `Foreground study completed in ${exportMs} ms; full offline edition is still downloading.`,
  );
  await page.waitForFunction(
    () => document.querySelector("#ar-offline").textContent === "Workshop & source saved offline",
    null,
    { timeout: 600000 },
  );
  const readyMs = Date.now() - started;
  const inventory = await page.evaluate(async () => {
    const channel = new MessageChannel();
    try {
      return await new Promise((resolve) => {
        channel.port1.onmessage = (e) => resolve(e.data);
        navigator.serviceWorker.controller.postMessage({ type: "GONIA_INSPECT" }, [channel.port2]);
      });
    } finally {
      channel.port1.close();
      channel.port2.close();
    }
  });
  assert.equal(inventory.complete, true);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  assert.equal(overflow, false);
  await page.locator("footer").screenshot({ path: path.join(out, "footer-phone.png") });
  const observedWorkerStates = await page.evaluate(() => globalThis.__workerAudit);
  online = false;
  server.closeAllConnections();
  await context.setOffline(true);
  await page.reload();
  await page.locator("#ar-threshold-example").waitFor();
  await page.locator("#ar-threshold-example").click();
  const offlineDownload = page.waitForEvent("download");
  await page.locator("#ar-html").click();
  await (await offlineDownload).saveAs(path.join(out, "offline-reading.html"));
  assert.deepEqual(errors, []);
  await writeFile(
    path.join(out, "review.json"),
    `${JSON.stringify(
      {
        engine: process.argv[4] ?? "chromium",
        checkedAt: new Date().toISOString(),
        browser: browser.version(),
        sharedPayloadBudgetBytesPerSecond: 128000,
        exportMs,
        fullEditionReadyMs: readyMs,
        lifecycle,
        observedWorkerStates,
        foregroundCompletedBeforeOfflineEdition: true,
        statusAtExport: during,
        bytesSent: sent,
        requests,
        completeVerifiedInventory: inventory,
        retainedClickTimeState: true,
        originDisabledReload: true,
        pageErrors: errors,
        workerSha256: createHash("sha256")
          .update(await readFile(path.join(root, "sw.js")))
          .digest("hex"),
      },
      null,
      2,
    )}\n`,
  );
  await context.close();
} finally {
  clearInterval(tick);
  clearInterval(heartbeat);
  await browser.close();
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  await rm(root, { recursive: true, force: true });
}
