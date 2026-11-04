import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium, firefox } from "playwright";

const volute = process.env.GONIA_TRANSFER_ROOM === "volute";
const room = volute ? "volute" : "arch";
const source = volute ? "sardis-dp144130.jpg" : "krohn-141.jpg";
const sourceBytes = volute ? 2337058 : 611151;
const pageIndex = volute ? "6" : "0";
const ids = volute
  ? {
      caption: "vo-source-caption",
      image: "vo-source-frame img",
      save: "vo-save-html",
      status: "vo-action-status",
      page: "vo-page",
    }
  : {
      caption: "ar-source-caption",
      image: "ar-source-image",
      save: "ar-html",
      status: "ar-save-status",
      page: "ar-page",
    };
const root = path.resolve(process.argv[2] ?? "dist");
const out = path.resolve(process.argv[3] ?? "/tmp/claude-1000/gonia-arch-transfer");
await mkdir(out, { recursive: true });
let mode = "normal",
  target = source,
  nextId = 0;
const jobs = [];
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".json": "application/json",
};
const server = createServer(async (req, res) => {
  const relative = new URL(req.url, "http://review").pathname.replace(/^\/gonia\//, "");
  const file = path.resolve(root, relative || "index.html");
  if (!file.startsWith(`${root}/`)) {
    res.writeHead(404).end();
    return;
  }
  try {
    let bytes = await readFile(file);
    const selected = file.endsWith(target) ? mode : "normal";
    const job = {
      id: ++nextId,
      path: relative,
      mode: selected,
      sent: 0,
      closed: false,
      complete: false,
      release: () => {},
    };
    jobs.push(job);
    res.on("close", () => {
      job.closed = true;
    });
    if (selected === "truncated") bytes = bytes.subarray(0, 4096);
    if (selected === "wrong-hash") {
      bytes = Buffer.from(bytes);
      bytes[100] ^= 1;
    }
    if (selected === "oversize") bytes = Buffer.concat([bytes, Buffer.alloc(2 * 1024 * 1024)]);
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.flushHeaders();
    const finish = () => {
      if (!res.destroyed) {
        job.sent = bytes.length;
        job.complete = true;
        res.end(bytes.subarray(at));
      }
    };
    let at = 0;
    job.release = finish;
    if (selected === "stall") {
      res.write(bytes.subarray(0, 1600));
      at = 1600;
      job.sent = at;
      return;
    }
    if (["slow", "deadline", "oversize"].includes(selected)) {
      const timer = setInterval(
        () => {
          if (res.destroyed) {
            clearInterval(timer);
            return;
          }
          const end = Math.min(
            at +
              (selected === "slow"
                ? volute
                  ? 4096
                  : 1600
                : selected === "deadline"
                  ? volute
                    ? 1200
                    : 325
                  : 32768),
            bytes.length,
          );
          res.write(bytes.subarray(at, end));
          job.sent = end;
          at = end;
          if (at === bytes.length) {
            job.complete = true;
            res.end();
            clearInterval(timer);
          }
        },
        selected === "oversize" ? 5 : 100,
      );
      res.on("close", () => clearInterval(timer));
    } else finish();
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}/gonia/`;
const results = [];
async function verified(page) {
  await page.waitForFunction(
    (id) => document.getElementById(id).textContent.includes("identity verified"),
    ids.caption,
    { timeout: 65000 },
  );
  await page.locator(`#${ids.image}`).evaluate((img) => img.decode());
}
async function retry(page) {
  if (volute) {
    await page.getByRole("button", { name: "Retry selected source", exact: true }).click();
  } else await page.locator("#ar-source-retry").click();
}
async function waitFor(check) {
  const end = Date.now() + 5000;
  while (!check()) {
    if (Date.now() > end) throw Error("Native request did not settle");
    await new Promise((r) => setTimeout(r, 20));
  }
}
try {
  for (const [engine, driver] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await driver.launch();
    try {
      for (const scenario of process.env.ARCH_CANCEL_ONLY === "1"
        ? []
        : [
            "slow",
            "stall",
            "truncated",
            "oversize",
            "wrong-hash",
            ...(process.env.ARCH_TOTAL_DEADLINE === "1" ? ["deadline"] : []),
          ]) {
        mode = scenario;
        target = source;
        const first = nextId,
          started = Date.now();
        const context = await browser.newContext({ serviceWorkers: "block" });
        const page = await context.newPage(),
          errors = [],
          downloads = [];
        page.on("pageerror", (e) => errors.push(String(e)));
        page.on("download", (d) => downloads.push(d.suggestedFilename()));
        await page.goto(`${base}${room}.html`);
        if (volute) await page.locator(`#${ids.page}`).selectOption(pageIndex);
        if (scenario === "deadline") {
          await page.waitForFunction(
            (id) => document.getElementById(id).textContent.includes("three-minute"),
            ids.caption,
            { timeout: 195000 },
          );
          assert.ok(Date.now() - started >= 175000 && Date.now() - started < 195000);
          const job = jobs.find((j) => j.id > first && j.path.endsWith(target));
          await waitFor(() => job.closed);
          assert.ok(job.sent > (volute ? 2000000 : 500000) && job.sent < sourceBytes);
          mode = "normal";
          await retry(page);
          await verified(page);
        } else if (scenario === "slow") {
          let packet;
          if (volute) {
            packet = page.waitForEvent("download", { timeout: 80000 });
            await page.locator(`#${ids.save}`).click();
            await page.locator("#vo-eye").fill("15");
            await page.locator("#vo-eye").dispatchEvent("change");
          }
          await verified(page);
          if (packet) {
            const download = await packet;
            assert.equal(await download.failure(), null);
            const file = path.join(out, `${engine}-slow-reading.html`);
            await download.saveAs(file);
            const html = await readFile(file, "utf8");
            const record =
              /download="gonia-volute.json" href="data:application\/json;base64,([^"]+)"/.exec(
                html,
              );
            assert.ok(record, "Slow reading must retain its editable record");
            assert.equal(JSON.parse(Buffer.from(record[1], "base64").toString()).state.eye, 12);
            assert.equal(await page.locator("#vo-eye").inputValue(), "15");
          }
          assert.ok(Date.now() - started > 35000);
        } else {
          await page.waitForFunction(
            (id) =>
              /stopped arriving|recorded size|does not match/.test(
                document.getElementById(id).textContent,
              ),
            ids.caption,
            { timeout: 35000 },
          );
          assert.equal(await page.locator(`#${ids.image}`).isVisible(), false);
          const job = jobs.find((j) => j.id > first && j.path.endsWith(target));
          await waitFor(() => job.closed);
          if (scenario === "stall")
            assert.ok(Date.now() - started > 19000 && Date.now() - started < 35000);
          if (scenario === "oversize")
            assert.ok(job.sent < sourceBytes + 512 * 1024, `Read too much: ${job.sent}`);
          // Bad bytes must also refuse export and never enter the verified memo.
          if (scenario !== "stall") {
            await page.locator(`#${ids.save}`).click();
            await page.waitForFunction(
              (id) => /recorded size|does not match/.test(document.getElementById(id).textContent),
              ids.status,
            );
            assert.deepEqual(downloads, []);
          }
          mode = "normal";
          await retry(page);
          await verified(page);
        }
        assert.deepEqual(errors, []);
        results.push({
          engine,
          scenario,
          elapsedSeconds: (Date.now() - started) / 1000,
          verifiedAfterRetry: scenario !== "slow",
          refusedBadDownloads: scenario === "slow" ? null : downloads.length === 0,
          ...(volute && scenario === "slow" ? { slowPacketSnapshotPreserved: true } : {}),
        });
        console.log(JSON.stringify(results.at(-1)));
        await context.close();
      }
      mode = "normal";
      const context = await browser.newContext({
        serviceWorkers: "block",
        viewport: { width: engine === "chromium" ? 1440 : 375, height: 1000 },
      });
      const page = await context.newPage(),
        downloads = [];
      page.on("download", (d) => downloads.push(d.suggestedFilename()));
      await page.goto(`${base}${room}.html`);
      await verified(page);
      mode = "stall";
      target = volute ? "sardis-dp144130.jpg" : "krohn-140.jpg";
      const first = nextId;
      await page.locator(`#${ids.save}`).click();
      await waitFor(() => jobs.some((j) => j.id > first && j.path.endsWith(target)));
      const exportJob = jobs.find((j) => j.id > first && j.path.endsWith(target));
      await page.locator(`#${ids.page}`).selectOption(volute ? "6" : "1");
      await waitFor(() => jobs.filter((j) => j.id > first && j.path.endsWith(target)).length === 2);
      const viewerJob = jobs.filter((j) => j.id > first && j.path.endsWith(target))[1];
      await page
        .locator(`#${ids.save}`)
        .screenshot({ path: path.join(out, `${engine}-cancel.png`) });
      await page.getByRole("button", { name: "Cancel reading save", exact: true }).click();
      await page.waitForFunction(
        (id) => document.getElementById(id).textContent.includes("Saving cancelled"),
        ids.status,
      );
      try {
        await waitFor(() => exportJob.closed);
      } catch (error) {
        console.log(
          engine,
          "cancel sockets",
          JSON.stringify(jobs.filter((j) => j.id > first && j.path.endsWith(target))),
        );
        throw error;
      }
      assert.equal(viewerJob.closed, false);
      assert.deepEqual(downloads, []);
      mode = "normal";
      viewerJob.release();
      await verified(page);
      const downloaded = page.waitForEvent("download");
      await page.locator(`#${ids.save}`).click();
      await (await downloaded).saveAs(path.join(out, `${engine}-retry-reading.html`));
      assert.equal(downloads.length, 1);
      await context.close();
      // Replacing a stalled viewer must stop its own transfer immediately.
      mode = "stall";
      target = source;
      const replacement = await browser.newContext({ serviceWorkers: "block" });
      const p = await replacement.newPage(),
        before = nextId;
      await p.goto(`${base}${room}.html`);
      if (volute) await p.locator(`#${ids.page}`).selectOption(pageIndex);
      await waitFor(() => jobs.some((j) => j.id > before && j.path.endsWith(target)));
      const old = jobs.find((j) => j.id > before && j.path.endsWith(target));
      await p.locator(`#${ids.page}`).selectOption("2");
      await verified(p);
      await waitFor(() => old.closed);
      await replacement.close();
      results.push({
        engine,
        cancellationStoppedExport: true,
        cancellationPreservedViewer: true,
        retryExportWorked: true,
        supersededViewerStopped: true,
      });
      console.log(JSON.stringify(results.at(-1)));
    } finally {
      await browser.close();
    }
  }
  await writeFile(path.join(out, "receipt.json"), `${JSON.stringify(results, null, 2)}\n`);
} finally {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
