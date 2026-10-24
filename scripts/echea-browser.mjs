// biome-ignore-all lint/performance/useDomNodeTextContent: Inspect the visible learning workflow.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const output = path.resolve(process.argv[2] ?? "/tmp/gonia-echea-browser");
const external = process.argv[3];
await mkdir(output, { recursive: true });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const report = {
  checkedAt: new Date().toISOString(),
  mode: external ? "development server" : "production build",
  buildWorker: hash(await readFile("dist/sw.js")),
  configurations: [],
};
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".json": "application/json",
};
async function serve() {
  let online = true;
  const server = createServer(async (req, res) => {
    if (!online) {
      req.socket.destroy();
      return;
    }
    try {
      const url = new URL(req.url, "http://local"),
        relative = decodeURIComponent(url.pathname).replace(/^\/gonia\//, "") || "index.html";
      if (!url.pathname.startsWith("/gonia/") || relative.includes("..")) throw Error("path");
      res
        .writeHead(200, {
          "Content-Type": types[path.extname(relative)] ?? "text/plain",
          "Cache-Control": "no-store",
        })
        .end(await readFile(path.join("dist", relative)));
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    base: `http://127.0.0.1:${server.address().port}/gonia/`,
    offline: () => {
      online = false;
    },
    close: async () => {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
async function download(page, id, file) {
  const pending = page.waitForEvent("download");
  await page.locator(id).click();
  const d = await pending;
  await d.saveAs(file);
  return readFile(file);
}
async function overflow(page) {
  assert(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    "Horizontal page overflow",
  );
}
for (const [engineName, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await engine.launch();
  try {
    for (const width of [1440, 375]) {
      const server = await serve(),
        base = external ?? server.base,
        folder = path.join(output, `${engineName}-${width}`);
      await mkdir(folder, { recursive: true });
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        acceptDownloads: true,
      });
      const page = await context.newPage(),
        errors = [],
        requests = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("request", (r) => {
        if (/^https?:/.test(r.url()) && !r.url().startsWith(base)) requests.push(r.url());
      });
      await page.addInitScript(() => {
        window.ecAudio = [];
        window.ecStops = 0;
        window.ecCsp = [];
        document.addEventListener("securitypolicyviolation", (event) =>
          window.ecCsp.push(event.violatedDirective),
        );
        const start = AudioBufferSourceNode.prototype.start,
          stop = AudioBufferSourceNode.prototype.stop;
        AudioBufferSourceNode.prototype.start = function (...args) {
          const samples = this.buffer.getChannelData(0),
            pcm = new Uint8Array(samples.length * 2),
            view = new DataView(pcm.buffer);
          for (let i = 0; i < samples.length; i++)
            view.setInt16(i * 2, Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), true);
          const item = { sampleRate: this.buffer.sampleRate, count: samples.length, hash: null };
          window.ecAudio.push(item);
          crypto.subtle.digest("SHA-256", pcm).then((digest) => {
            item.hash = Array.from(new Uint8Array(digest), (n) =>
              n.toString(16).padStart(2, "0"),
            ).join("");
          });
          return start.apply(this, args);
        };
        AudioBufferSourceNode.prototype.stop = function (...args) {
          window.ecStops++;
          return stop.apply(this, args);
        };
      });
      try {
        await page.goto(`${base}echea.html`);
        await page.evaluate(() => document.fonts.ready);
        await overflow(page);
        assert.equal(await page.locator(".ec-vessel").count(), 13);
        assert.equal(await page.locator(".ec-vessel.ec-selected").count(), 2);
        await page.locator('[data-ec-note="4"]').focus();
        await page.keyboard.press("Enter");
        assert.match(await page.locator("#ec-selection").innerText(), /247.50 Hz.*3 and 11/);
        await page.locator('[data-ec-note="3"]').click();
        await page.locator("#ec-ascending-order").click();
        assert.match(await page.locator("#ec-selection").innerText(), /3 and 11/);
        await page.goBack();
        assert.match(await page.locator("#ec-selection").innerText(), /4 and 10/);
        await page.locator("#ec-workshop").scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(folder, "workshop.png") });
        await page.locator("#ec-read-order").click();
        assert.match(await page.locator("#ec-latin").innerText(), /^quarta/);
        assert.equal(await page.locator("#ec-source").inputValue(), "3");
        assert.equal(
          await page.locator("#ec-reading-title").evaluate((el) => el === document.activeElement),
          true,
        );
        await page.locator("#ec-find-source").click();
        await page.waitForFunction(
          () => document.querySelector("#ec-source-image").naturalWidth > 0,
        );
        await page.locator("#ec-zoom").focus();
        await page.keyboard.press("ArrowRight");
        assert.equal(await page.locator("#ec-zoom").inputValue(), "125");
        for (let i = 0; i < 5; i++) {
          await page.locator("#ec-source").selectOption(String(i));
          await page.waitForFunction(
            () =>
              document.querySelector("#ec-source-image").complete &&
              document.querySelector("#ec-source-image").naturalWidth > 0,
          );
        }
        await page.locator("#ec-passage").selectOption("2");
        assert.match(await page.locator("#ec-latin").innerText(), /ponanturque inversa/);
        await page.locator("#ec-reading").scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(folder, "reading.png") });
        await page.locator("#ec-play-row").click();
        await page.waitForFunction(() => window.ecAudio.at(-1)?.hash);
        const liveRow = await page.evaluate(() => window.ecAudio.at(-1));
        assert.equal(liveRow.sampleRate, 24000);
        assert.equal(
          await page.locator("#ec-play-row").evaluate((el) => el === document.activeElement),
          true,
        );
        await page.locator("#ec-reference").selectOption("330");
        assert.equal(await page.locator("#ec-stop").isDisabled(), true);
        assert(await page.evaluate(() => window.ecStops > 0));
        await page.locator("#ec-reference").selectOption("220");
        const row = await download(page, "#ec-save-row", path.join(folder, "row.wav"));
        assert.equal(hash(row.subarray(44)), liveRow.hash);
        await page.locator("#ec-play-response").click();
        await page.waitForFunction(
          () => window.ecAudio.length === 2 && window.ecAudio.at(-1)?.hash,
        );
        const liveResponse = await page.evaluate(() => window.ecAudio.at(-1));
        await page.locator("#ec-stop-response").click();
        const matched = await download(page, "#ec-save-response", path.join(folder, "matched.wav"));
        assert.equal(hash(matched.subarray(44)), liveResponse.hash);
        await page.locator("#ec-miss").click();
        assert.match(await page.locator("#ec-amplitude").innerText(), /^6\.8%$/);
        const detuned = await download(page, "#ec-save-response", path.join(folder, "detuned.wav"));
        assert.notEqual(hash(detuned), hash(matched));
        await page.locator("#ec-detune").focus();
        await page.keyboard.press("ArrowLeft");
        assert.equal(await page.locator("#ec-detune").inputValue(), "99");
        await page.locator("#ec-q").selectOption("360");
        await page.locator("#ec-resonance").scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(folder, "resonance.png") });
        await page.locator("#ec-q").selectOption("120");
        await page.locator("#ec-match").click();
        await download(page, "#ec-save-csv", path.join(folder, "measurements.csv"));
        await download(page, "#ec-save-svg", path.join(folder, "plan.svg"));
        await page.locator("#ec-share").click();
        const share = await page.locator("#ec-share-url").inputValue();
        assert.match(share, /n=3&a=220&o=source&d=0&q=120&r=2/);
        const axe = await new AxeBuilder({ page }).analyze();
        assert.deepEqual(
          axe.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          [],
        );
        if (!external)
          await page.waitForFunction(() =>
            document.querySelector("#ec-offline").textContent.includes("saved offline"),
          );
        // Hold a real resume completion, then cancel before the pending play can start.
        const beforePending = await page.evaluate(() => window.ecAudio.length);
        await page.evaluate(() => {
          const resume = AudioContext.prototype.resume;
          AudioContext.prototype.resume = function () {
            return new Promise((resolve, reject) => {
              window.ecReleaseResume = () => {
                AudioContext.prototype.resume = resume;
                return resume.call(this).then(resolve, reject);
              };
            });
          };
        });
        await page.locator("#ec-play-row").click();
        await page.locator("#ec-stop").click();
        await page.evaluate(() => window.ecReleaseResume());
        assert.equal(await page.evaluate(() => window.ecAudio.length), beforePending);
        const reading = await download(page, "#ec-save-reading", path.join(folder, "reading.html"));
        assert(reading.includes(Buffer.from("data:audio/wav;base64,")));
        const saved = await context.newPage(),
          savedRequests = [];
        saved.on("request", (r) => {
          if (/^https?:/.test(r.url())) savedRequests.push(r.url());
        });
        await saved.goto(pathToFileURL(path.join(folder, "reading.html")).href);
        await saved.evaluate(() => document.fonts.ready);
        await overflow(saved);
        const assets = await saved.evaluate(async () => ({
          images: await Promise.all(
            [...document.images].map(async (image) => {
              const bytes = Uint8Array.from(atob(image.src.split(",")[1]), (c) => c.charCodeAt(0));
              return {
                width: image.naturalWidth,
                hash: Array.from(
                  new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
                  (v) => v.toString(16).padStart(2, "0"),
                ).join(""),
              };
            }),
          ),
          audio: [...document.querySelectorAll("audio")].map((a) => ({
            duration: a.duration,
            ready: a.readyState,
          })),
        }));
        assert.equal(assets.images.length, 5);
        assert(assets.images.every((i) => i.width > 900));
        assert(assets.audio.every((a) => a.duration > 2 && a.ready >= 1));
        assert.equal(savedRequests.length, 0);
        const manifest = JSON.parse(await readFile("public/sources/echea/manifest.json", "utf8"));
        assert.deepEqual(
          assets.images.map((i) => i.hash),
          Object.values(manifest.hashes),
        );
        await saved.screenshot({ path: path.join(folder, "saved-reading.png") });
        if (engineName === "chromium" && width === 1440)
          await saved.pdf({
            path: path.join(folder, "reading.pdf"),
            format: "A4",
            printBackground: true,
          });
        await saved.close();
        const rooms = [
          "index.html",
          "spacing.html",
          "entasis.html",
          "fluting.html",
          "transport.html",
          "colonnade.html",
          "theatre.html",
          "echea.html",
        ];
        if (!external) {
          server.offline();
          await context.setOffline(true);
          for (const room of rooms) {
            await page.goto(base + room);
            await page.locator('nav a[href="./echea.html"]').waitFor();
            await overflow(page);
          }
          await page.locator("#ec-miss").click();
          await download(page, "#ec-save-reading", path.join(folder, "offline-reading.html"));
        }
        await context.setOffline(false);
        // The dead origin remains unavailable. Offline readiness must include every room.
        const rowReport = {
          engine: engineName,
          width,
          liveRow,
          liveResponse,
          sourceImages: assets.images,
          audio: assets.audio,
          externalRequests: requests,
          csp: await page.evaluate(() => window.ecCsp),
          pageErrors: errors,
          offlineRooms: external ? [] : rooms,
          readingBytes: reading.length,
          axeViolations: axe.violations.length,
          cancelledDelayedResume: true,
        };
        assert.deepEqual(rowReport.pageErrors, []);
        assert.deepEqual(rowReport.csp, []);
        assert.deepEqual(requests, []);
        report.configurations.push(rowReport);
        await writeFile(path.join(output, "browser.json"), `${JSON.stringify(report, null, 2)}\n`);
      } finally {
        await context.close();
        await server.close();
      }
    }
  } finally {
    await browser.close();
  }
}
console.log(
  JSON.stringify({
    report: path.join(output, "browser.json"),
    configurations: report.configurations.length,
  }),
);
