// biome-ignore-all lint/performance/useDomNodeTextContent: Review visible learner outcomes.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const out = path.resolve(process.argv[2] ?? "/tmp/gonia-hoist-loss");
await mkdir(out, { recursive: true });
const report = {
  checkedAt: new Date().toISOString(),
  workerSha256: createHash("sha256")
    .update(await readFile("dist/sw.js"))
    .digest("hex"),
  configurations: [],
};
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
};
async function serve() {
  let online = true;
  const server = createServer(async (req, res) => {
    if (!online) {
      req.socket.destroy();
      return;
    }
    const u = new URL(req.url, "http://review"),
      file = decodeURIComponent(u.pathname).replace(/^\/gonia\//, "") || "index.html";
    try {
      if (!u.pathname.startsWith("/gonia/") || file.includes("..")) throw Error("path");
      res
        .writeHead(200, {
          "Content-Type": types[path.extname(file)] ?? "text/plain",
          "Cache-Control": "no-store",
        })
        .end(await readFile(path.join("dist", file)));
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return {
    base: `http://127.0.0.1:${server.address().port}/gonia/`,
    offline() {
      online = false;
      server.closeAllConnections();
    },
    async close() {
      server.closeAllConnections();
      await new Promise((r) => server.close(r));
    },
  };
}
async function download(page, selector, file) {
  const pending = page.waitForEvent("download");
  await page.locator(selector).click();
  const d = await pending;
  await d.saveAs(file);
  return readFile(file);
}
async function capture(page) {
  return page.evaluate(() => {
    const value = (k) => document.getElementById(`hw-${k}`).value;
    const state = Object.fromEntries(
      ["rig", "anchor", "hold", "distance", "weight", "arm", "efficiency"].map((k) => [
        k,
        ["rig", "anchor", "hold"].includes(k) ? value(k) : Number(value(k)),
      ]),
    );
    const chart = document.querySelector("#hw-work-drawing svg");
    return {
      state,
      supportTensions: [...document.querySelectorAll("#hw-drawing [data-support]")].map((e) =>
        Number(e.dataset.tension),
      ),
      wheels: [...document.querySelectorAll("#hw-loss-ledger [data-wheel]")].map((e) =>
        Object.fromEntries(
          ["before", "after", "travel", "loss"].map((k) => [k, Number(e.dataset[k])]),
        ),
      ),
      work: Object.fromEntries(
        ["input", "useful", "loss", "efficiency"].map((k) => [k, Number(chart.dataset[k])]),
      ),
      blueWidth: Number(chart.querySelector("rect").getAttribute("width")),
    };
  });
}
const legacy = { rig: "five", anchor: "fixed", hold: "rope", distance: 1, weight: 1200, arm: 4 };
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await engine.launch();
  try {
    for (const width of [1440, 375]) {
      const server = await serve(),
        folder = path.join(out, `${name}-${width}`);
      await mkdir(folder, { recursive: true });
      const context = await browser.newContext({
          viewport: { width, height: 1000 },
          acceptDownloads: true,
        }),
        page = await context.newPage(),
        errors = [],
        csp = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (msg) => {
        if (msg.type() === "error" && /Content Security|Refused to/i.test(msg.text()))
          csp.push(msg.text());
      });
      try {
        await page.goto(`${server.base}hoist.html`);
        await page.waitForFunction(
          () =>
            document.querySelector("#hw-offline").textContent === "Workshop & source saved offline",
          null,
          { timeout: 60000 },
        );
        const states = [];
        for (const rig of ["single", "three", "five"]) {
          await page.locator("#hw-rig").selectOption(rig);
          for (const anchor of rig === "single" ? ["moving"] : ["moving", "fixed"]) {
            if (rig !== "single") await page.locator("#hw-anchor").selectOption(anchor);
            for (const efficiency of [50, 70, 90, 99, 100]) {
              await page.locator("#hw-efficiency").fill(String(efficiency));
              states.push(await capture(page));
            }
          }
        }
        await page.locator("#hw-try-loss").focus();
        await page.keyboard.press("Enter");
        assert.match(await page.locator("#hw-loss-finding").innerText(), /81.3%/);
        await page.locator("#hw-efficiency").focus();
        await page.keyboard.press("ArrowLeft");
        assert.equal(await page.locator("#hw-efficiency").inputValue(), "89");
        assert(await page.locator("#hw-efficiency").evaluate((e) => e === document.activeElement));
        await page.keyboard.press("ArrowRight");
        await page.locator("#hw-losses").scrollIntoViewIfNeeded();
        await page.locator("#hw-losses").screenshot({ path: path.join(folder, "losses.png") });
        await page.locator("#hw-workshop").screenshot({ path: path.join(folder, "tensions.png") });
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        const axe = await new AxeBuilder({ page }).analyze();
        assert.deepEqual(axe.violations, []);
        await page.locator("#hw-anchor").selectOption("fixed");
        assert.match(await page.locator("#hw-loss-ledger").innerText(), /does not turn/);
        const first = await capture(page);
        assert.equal(first.wheels[0].loss, 0);
        assert.equal(first.wheels[0].travel, 0);
        await page.locator("#hw-distance").fill("0");
        const zero = await capture(page);
        assert.equal(zero.work.input, 0);
        assert.equal(zero.work.loss, 0);
        states.push(zero);
        assert.match(await page.locator("#hw-work-drawing").innerText(), /No travel, no work/);
        await page.locator("#hw-try-loss").click();
        const json = await download(page, "#hw-save-json", path.join(folder, "experiment.json"));
        assert.equal(JSON.parse(json).format, "gonia-hoist-v2");
        assert.equal(JSON.parse(json).state.efficiency, 90);
        await download(page, "#hw-save-csv", path.join(folder, "measurements.csv"));
        await download(page, "#hw-save-svg", path.join(folder, "diagram.svg"));
        await page.locator("#hw-share").click();
        const link = await page.locator("#hw-share-url").inputValue(),
          tab = await context.newPage();
        await tab.goto(link);
        assert.equal(await tab.locator("#hw-efficiency").inputValue(), "90");
        await tab.close();
        const pending = page.waitForEvent("download");
        await page.evaluate(() => {
          document.getElementById("hw-save-reading").click();
          const input = document.getElementById("hw-efficiency");
          input.value = "50";
          input.dispatchEvent(new Event("input", { bubbles: true }));
        });
        const reading = await pending;
        await reading.saveAs(path.join(folder, "reading.html"));
        assert.equal(await page.locator("#hw-efficiency").inputValue(), "50");
        const portable = await browser.newContext({ viewport: { width, height: 1000 } }),
          local = await portable.newPage(),
          remote = [];
        local.on("request", (r) => {
          if (/^https?:/.test(r.url())) remote.push(r.url());
        });
        await local.goto(pathToFileURL(path.join(folder, "reading.html")).href);
        await local.evaluate(() => document.fonts.ready);
        assert.equal(await local.locator("script").count(), 0);
        assert.match(await local.locator("header").innerText(), /tension transfer 90%/);
        assert(
          Math.abs(
            Number(await local.locator("[data-efficiency]").getAttribute("data-efficiency")) -
              0.813,
          ) < 1e-12,
        );
        assert(
          await local
            .locator(".printed img")
            .evaluateAll(
              (imgs) => imgs.length === 5 && imgs.every((i) => i.complete && i.naturalWidth > 0),
            ),
        );
        assert.deepEqual(remote, []);
        assert(await local.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        const sourceManifest = JSON.parse(
          await readFile("public/sources/hoist/manifest.json", "utf8"),
        );
        const images = await local
          .locator(".printed img")
          .evaluateAll((imgs) => imgs.map((i) => i.src.split(",")[1]));
        for (const [i, key] of ["title", "226", "227", "232", "233"].entries())
          assert.equal(
            createHash("sha256").update(Buffer.from(images[i], "base64")).digest("hex"),
            sourceManifest.assets[`sources/hoist/krohn-${key}.jpg`],
          );
        if (name === "chromium" && width === 1440)
          await local.pdf({
            path: path.join(folder, "reading.pdf"),
            format: "A4",
            printBackground: true,
          });
        await portable.close();
        await page.locator("#hw-open-json").setInputFiles({
          name: "v1.json",
          mimeType: "application/json",
          buffer: Buffer.from(JSON.stringify({ format: "gonia-hoist-v1", state: legacy })),
        });
        await page.waitForFunction(() => document.querySelector("#hw-efficiency").value === "100");
        assert.equal(await page.locator("#hw-rig").inputValue(), "five");
        const legacyQuery = new URLSearchParams(
          Object.entries(legacy).map(([k, v]) => [k, String(v)]),
        );
        await page.goto(`${server.base}hoist.html?${legacyQuery}`);
        assert.equal(await page.locator("#hw-efficiency").inputValue(), "100");
        assert(await page.locator("#hw-invalid").isHidden());
        await page
          .locator("#hw-open-json")
          .setInputFiles({ name: "v2.json", mimeType: "application/json", buffer: json });
        await page.waitForFunction(() => document.querySelector("#hw-efficiency").value === "90");
        await page.locator("#hw-open-json").setInputFiles({
          name: "invalid.json",
          mimeType: "application/json",
          buffer: Buffer.from(
            json.toString().replace('"efficiency": 90', '"efficiency": 90, "efficiency": 50'),
          ),
        });
        await page.waitForFunction(() =>
          document.querySelector("#hw-save-status").textContent.includes("Repeated JSON"),
        );
        assert.equal(await page.locator("#hw-efficiency").inputValue(), "90");
        // A native file read finishing later must not erase a newer experiment.
        await page.evaluate(() => {
          const original = File.prototype.text;
          globalThis.originalFileText = original;
          File.prototype.text = async function () {
            await new Promise((resolve) => {
              globalThis.releaseHoistRead = resolve;
            });
            return original.call(this);
          };
        });
        await page
          .locator("#hw-open-json")
          .setInputFiles({ name: "delayed.json", mimeType: "application/json", buffer: json });
        await page.locator("#hw-efficiency").fill("80");
        await page.evaluate(() => globalThis.releaseHoistRead());
        await page.waitForFunction(() =>
          document.querySelector("#hw-save-status").textContent.includes("settings changed"),
        );
        assert.equal(await page.locator("#hw-efficiency").inputValue(), "80");
        await page.evaluate(() => {
          File.prototype.text = globalThis.originalFileText;
        });
        await page.locator("#hw-ideal").click();
        assert.equal(await page.locator("#hw-efficiency").inputValue(), "100");
        await page.locator("#hw-try-loss").click();
        server.offline();
        await context.setOffline(true);
        await page.reload();
        assert.equal(await page.locator("#hw-efficiency").inputValue(), "90");
        await page.locator("#hw-efficiency").fill("80");
        assert.match(await page.locator("#hw-loss-finding").innerText(), /65.07%/);
        await download(page, "#hw-save-reading", path.join(folder, "offline-reading.html"));
        await writeFile(path.join(folder, "rendered.json"), `${JSON.stringify(states, null, 2)}\n`);
        assert.deepEqual(errors, []);
        assert.deepEqual(csp, []);
        report.configurations.push({
          browser: name,
          version: browser.version(),
          width,
          renderedStates: states.length,
          keyboard: true,
          axeViolations: 0,
          portableRemoteRequests: 0,
          sourceHashes: 5,
          clickTimeSnapshot: true,
          legacyJson: true,
          delayedImportPreservesNewerSettings: true,
          legacyQuery: true,
          originDisabled: true,
          offlineExport: true,
        });
        console.log(
          `${name} ${width}: 26 rendered states, keyboard, native files, legacy records, portable study and origin-disabled offline use passed`,
        );
      } finally {
        await context.close();
        await server.close();
      }
    }
  } finally {
    await browser.close();
  }
}
await writeFile(path.join(out, "review.json"), `${JSON.stringify(report, null, 2)}\n`);
