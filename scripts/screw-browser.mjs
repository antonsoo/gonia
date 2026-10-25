// biome-ignore-all lint/performance/useDomNodeTextContent: Review actual native learning and file flows.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const output = path.resolve(process.argv[2] ?? "/tmp/gonia-screw-review"),
  external = process.argv[3];
await mkdir(output, { recursive: true });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const report = {
  checkedAt: new Date().toISOString(),
  scope: external
    ? "public origin with browser network disabled for offline replay"
    : "production build with local origin disabled for offline replay",
  base: external ?? "local",
  workerSha256: hash(await readFile("dist/sw.js")),
  configurations: [],
};
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};
async function origin() {
  let online = true;
  const server = createServer(async (request, response) => {
    if (!online) {
      request.socket.destroy();
      return;
    }
    const url = new URL(request.url, "http://local"),
      file = decodeURIComponent(url.pathname).replace(/^\/gonia\//, "") || "index.html";
    try {
      if (!url.pathname.startsWith("/gonia/") || file.includes(".."))
        throw new Error("Invalid path");
      response
        .writeHead(200, {
          "Content-Type": types[path.extname(file)] ?? "application/octet-stream",
          "Cache-Control": "no-store",
        })
        .end(await readFile(path.join("dist", file)));
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    base: `http://127.0.0.1:${server.address().port}/gonia/`,
    disable() {
      online = false;
      server.closeAllConnections();
    },
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
async function ready(page) {
  await page.locator("#sc-offline").waitFor();
  await page.waitForFunction(
    () => document.querySelector("#sc-offline").textContent === "Workshop & source saved offline",
    null,
    { timeout: 60000 },
  );
  await page.waitForFunction(() =>
    document.querySelector("#sc-source-status").textContent.includes("matches"),
  );
  await page.evaluate(() => document.fonts.ready);
}
async function download(page, id, file) {
  const waiting = page.waitForEvent("download");
  await page.locator(id).click();
  const item = await waiting;
  await item.saveAs(file);
  assert.equal(await item.failure(), null);
  const bytes = await readFile(file);
  return { name: path.basename(file), bytes: bytes.length, sha256: hash(bytes) };
}
async function snapshot(page) {
  return page.evaluate(() => {
    const machine = document.querySelector("#sc-machine [data-water-section]"),
      level = document.querySelector("#sc-machine [data-horizontal-water]"),
      section = document.querySelector("#sc-section [data-section-area]");
    const nums = (d) => (d?.match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).map(Number);
    const points = nums(section?.getAttribute("d"));
    let twice = 0;
    for (let i = 0; i < points.length; i += 2) {
      const j = (i + 2) % points.length;
      twice += points[i] * points[j + 1] - points[j] * points[i + 1];
    }
    const waterLine = nums(level?.getAttribute("d"));
    return {
      query: location.search,
      controls: Object.fromEntries(
        ["units", "starts", "lead", "angle", "turn", "cut", "step", "passage", "source"]
          .map((key) => [
            key === "source" ? "page" : key,
            document.querySelector(`#sc-${key}`).value,
          ])
          .concat([
            ["sourceSlope", String(document.querySelector("#sc-slope").value === "source")],
          ]),
      ),
      fractionText: document.querySelector("#sc-fraction").textContent,
      perTurnText: document.querySelector("#sc-volume").textContent,
      cutArea: Number(section?.getAttribute("data-section-area") ?? 0),
      renderedArea: Math.abs(twice) / 2 / 180 ** 2,
      sectionVertices: points.length / 2,
      axis: machine ? Number(machine.getAttribute("data-axis")) : null,
      worldLevel: level ? Number(level.getAttribute("data-horizontal-water")) : null,
      renderedLevel: waterLine,
      netLines: [...document.querySelectorAll("#sc-net [data-net-start]")].map((p) => ({
        start: Number(p.getAttribute("data-net-start")),
        points: nums(p.getAttribute("d")),
      })),
    };
  });
}
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await engine.launch();
  try {
    for (const width of [1440, 375]) {
      const server = await origin(),
        base = external ?? server.base,
        dir = path.join(output, `${name}-${width}`);
      await mkdir(dir, { recursive: true });
      const context = await browser.newContext({
          viewport: { width, height: 1000 },
          acceptDownloads: true,
        }),
        page = await context.newPage(),
        errors = [],
        downloads = [],
        snapshots = [];
      page.on("pageerror", (error) => errors.push(error.message));
      try {
        await page.goto(base);
        await page.locator('nav a[href="./screw.html"]').click();
        await ready(page);
        assert.equal(await page.locator("#sc-fraction").textContent(), "17.03%");
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        snapshots.push(await snapshot(page));
        await page.locator("#sc-lead").focus();
        await page.keyboard.press("ArrowRight");
        assert.equal(await page.locator("#sc-lead").inputValue(), "101");
        await page.goBack();
        assert.equal(await page.locator("#sc-lead").inputValue(), "100");
        await page.goForward();
        assert.equal(await page.locator("#sc-lead").inputValue(), "101");
        await page.locator("#sc-reset").click();
        for (let step = 0; step <= 5; step++) {
          await page.locator("#sc-step").selectOption(String(step));
          if (step < 2) assert.equal(await page.locator("#sc-net circle").count(), 1);
          if (step === 3) assert.equal(await page.locator("#sc-net [data-net-start]").count(), 1);
          if (step === 4)
            assert.equal(await page.locator('#sc-net [data-net-start="7"]').count(), 2);
        }
        await page.locator("#sc-enlarge-net").click();
        const pan = page.locator("#sc-net").locator("..");
        await pan.focus();
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(150);
        assert(await pan.evaluate((e) => e.scrollLeft > 0));
        await page.locator("#sc-enlarge-net").click();
        await page.locator("#sc-slope").selectOption("custom");
        for (const [angle, regime] of [
          [500, "outer pocket"],
          [650, "No retained bucket"],
          [150, "touches the shaft"],
        ]) {
          await page.locator("#sc-angle").fill(String(angle));
          await page.locator("#sc-angle").dispatchEvent("change");
          assert.match(await page.locator("#sc-regime").textContent(), new RegExp(regime));
          snapshots.push(await snapshot(page));
        }
        await page.locator("#sc-units").selectOption("twelfths");
        await page.locator("#sc-starts").selectOption("4");
        await page.locator("#sc-lead").fill("50");
        await page.locator("#sc-lead").dispatchEvent("change");
        snapshots.push(await snapshot(page));
        await page.locator("#sc-reset").click();
        const before = await snapshot(page),
          begin = Date.now();
        await page.locator("#sc-play").click();
        await page.waitForFunction(() => document.querySelector("#sc-turn").value === "360", null, {
          timeout: 20000,
        });
        const elapsed = Date.now() - begin,
          after = await snapshot(page);
        assert(elapsed >= 11800 && elapsed < 18000);
        assert(Math.abs(after.axis - before.axis - Math.PI) < 1e-10);
        assert(Math.abs(after.worldLevel - before.worldLevel - Math.PI * 0.6) < 1e-10);
        assert.equal(await page.locator("#sc-play").textContent(), "Turn once slowly");
        snapshots.push(after);
        await page.locator("#sc-turn-back").click();
        for (let cut = 0; cut <= 1000; cut += 100) {
          await page.locator("#sc-cut").fill(String(cut));
          snapshots.push(await snapshot(page));
        }
        await page.locator("#sc-cut").fill("500");
        await page.locator("#sc-cut").dispatchEvent("change");
        for (let i = 0; i < 12; i++) {
          await page.locator("#sc-passage").selectOption(String(i));
          await page.locator("#sc-words button").last().focus();
          await page.keyboard.press("Enter");
          assert.equal(await page.locator('#sc-words [aria-pressed="true"]').count(), 1);
          assert((await page.locator("#sc-word-note").textContent()).length > 30);
        }
        await page.locator("#sc-find-source").click();
        await ready(page);
        assert.equal(await page.locator("#sc-source").inputValue(), "238");
        for (const key of ["title", "062", "237", "238", "239"]) {
          await page.locator("#sc-source").selectOption(key);
          await ready(page);
          assert(await page.locator("#sc-source-image").evaluate((img) => img.naturalWidth > 1000));
        }
        await page.locator("#sc-source").selectOption("238");
        await ready(page);
        await page.locator("#sc-zoom").fill("200");
        const sourcePan = page.locator("#sc-source-pan");
        await sourcePan.focus();
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(150);
        assert(await sourcePan.evaluate((e) => e.scrollLeft > 0));
        await page.locator("#sc-zoom").fill("100");
        const accessibility = await new AxeBuilder({ page }).analyze();
        assert.deepEqual(
          accessibility.violations.map((v) => v.id),
          [],
        );
        await page.locator("#sc-share").click();
        const shared = await page.locator("#sc-share-url").inputValue();
        assert(shared.includes("passage=11") && shared.includes("page=238"));
        for (const [id, filename] of [
          ["svg", "screw.svg"],
          ["wrap", "wrap.svg"],
          ["csv", "measurements.csv"],
          ["study", "reading.html"],
        ])
          downloads.push(await download(page, `#sc-save-${id}`, path.join(dir, filename)));
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: path.join(dir, "top.png") });
        await page.locator("#sc-water").scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(dir, "water.png") });
        await page.locator("#sc-reading").scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(dir, "reading.png") });
        await page.screenshot({ path: path.join(dir, "full.png"), fullPage: true });
        const cache = await page.evaluate(async () => {
          const keys = await caches.keys(),
            saved = await caches.open(keys[0]);
          return { keys, files: (await saved.keys()).map((r) => new URL(r.url).pathname).sort() };
        });
        if (external) await context.setOffline(true);
        else server.disable();
        await page.reload();
        await ready(page);
        assert.equal(await page.locator("#sc-passage").inputValue(), "11");
        assert.equal(await page.locator("#sc-source").inputValue(), "238");
        await page.locator("#sc-starts").selectOption("2");
        assert((await page.locator("#sc-volume").textContent()).length > 0);
        downloads.push(
          await download(page, "#sc-save-study", path.join(dir, "offline-reading.html")),
        );
        const fileContext = await browser.newContext({
            viewport: { width, height: 1000 },
            offline: true,
          }),
          filePage = await fileContext.newPage(),
          requests = [];
        filePage.on("request", (r) => {
          if (/^https?:/.test(r.url())) requests.push(r.url());
        });
        await filePage.goto(pathToFileURL(path.join(dir, "reading.html")).href);
        assert.equal(await filePage.locator("script").count(), 0);
        assert.equal(await filePage.locator("article").count(), 12);
        assert.equal(await filePage.locator("figure.source img").count(), 5);
        assert(
          await filePage
            .locator("figure.source img")
            .evaluateAll((imgs) => imgs.every((i) => i.complete && i.naturalWidth > 1000)),
        );
        await filePage.evaluate(() => document.fonts.ready);
        assert(
          await filePage.evaluate(
            () => document.fonts.check("16px Noto") && document.fonts.check("16px Plex"),
          ),
        );
        assert.deepEqual(requests, []);
        await filePage.screenshot({ path: path.join(dir, "saved-reading.png") });
        if (name === "chromium" && width === 1440)
          await filePage.pdf({
            path: path.join(dir, "reading.pdf"),
            format: "A4",
            printBackground: true,
          });
        await fileContext.close();
        assert.deepEqual(errors, []);
        report.configurations.push({
          browser: name,
          version: browser.version(),
          width,
          animationElapsedMs: elapsed,
          downloads,
          snapshots,
          cache,
          accessibility: { violations: 0, rules: accessibility.passes.length },
          pageErrors: errors,
          standaloneNetworkRequests: requests,
          offline: "passed",
        });
        console.log(`${name} ${width}: native controls, geometry, Latin, files and offline passed`);
      } finally {
        await context.close();
        await server.close();
      }
    }
  } finally {
    await browser.close();
  }
}
await writeFile(path.join(output, "review.json"), `${JSON.stringify(report, null, 2)}\n`);
