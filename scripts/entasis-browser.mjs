// biome-ignore-all lint/performance/useDomNodeTextContent: Check visible learner-facing text.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const output = path.resolve(process.argv[2] ?? "/tmp/gonia-entasis-review/browser.json");
const directory = path.dirname(output);
await mkdir(path.join(directory, "assets"), { recursive: true });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const files = [
  "penrose-039.jpg",
  "penrose-040.jpg",
  "penrose-041.jpg",
  "penrose-Taf_14.jpg",
  "krohn-068.jpg",
];
const sourceHashes = await Promise.all(
  files.map(async (f) => hash(await readFile(`public/sources/entasis/${f}`))),
);
let available = true;
let substitute = false;
let gate = null;
let rejected = 0;
const server = http.createServer(async (req, res) => {
  if (!available) {
    rejected++;
    req.socket.destroy();
    return;
  }
  const url = new URL(req.url, "http://local");
  const file = decodeURIComponent(url.pathname).replace(/^\/gonia\//, "") || "index.html";
  if (!url.pathname.startsWith("/gonia/") || file.includes("..")) {
    res.writeHead(404).end();
    return;
  }
  if (gate && file === "sources/entasis/penrose-039.jpg") await gate;
  try {
    const actual =
      substitute && file === "sources/entasis/krohn-068.jpg"
        ? "sources/entasis/penrose-039.jpg"
        : file;
    const bytes = await readFile(path.join("dist", actual));
    const types = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".jpg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".pdf": "application/pdf",
      ".woff2": "font/woff2",
      ".ttf": "font/ttf",
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
const report = {
  checkedAt: new Date().toISOString(),
  scope:
    "Built site, all native controls, five printed rows and six maxima, rendered geometry, source images, portable readings, all three offline workshops, slow and rejected source installations.",
  configurations: [],
  geometry: [],
  offline: [],
};

async function until(page, selector, fragment) {
  await page.waitForFunction(
    ({ selector, fragment }) => document.querySelector(selector)?.textContent.includes(fragment),
    { selector, fragment },
    { timeout: 30000 },
  );
}
async function overflow(page) {
  const result = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  assert(result.document <= result.viewport, JSON.stringify(result));
}
async function geometry(page) {
  return page.evaluate(() => {
    const p = new URLSearchParams(location.search);
    const state = {
      station: Number(p.get("station")),
      enlargement: Number(p.get("enlarge")),
      prediction: p.get("prediction"),
      units: p.get("units"),
      comparison: p.get("compare"),
    };
    const plates = [...document.querySelectorAll(".entasis-plate")];
    for (const svg of plates) {
      const box = svg.getBoundingClientRect();
      for (const text of svg.querySelectorAll("text")) {
        const r = text.getBoundingClientRect();
        if (
          r.left < box.left - 1 ||
          r.right > box.right + 1 ||
          r.top < box.top - 1 ||
          r.bottom > box.bottom + 1
        )
          throw new Error(`Clipped SVG label: ${text.textContent}`);
      }
    }
    const circles = (svg) =>
      [...svg.querySelectorAll("circle[data-station]")].map((c) => ({
        x: Number(c.getAttribute("cx")),
        y: Number(c.getAttribute("cy")),
      }));
    return {
      state,
      cssScale: plates.map((svg) => svg.getScreenCTM().a),
      edge: circles(plates[0]),
      departure: circles(plates[1]),
      prediction: [...plates[1].querySelectorAll("rect[data-prediction]")].map((r) => ({
        x: Number(r.getAttribute("x")),
        y: Number(r.getAttribute("y")),
      })),
      bars: [...document.querySelectorAll(".maximum-bar")].map((b) =>
        Number.parseFloat(b.style.width),
      ),
    };
  });
}
async function save(page, name) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#entasis-save").click(),
  ]);
  const file = path.join(directory, name);
  await download.saveAs(file);
  const html = await readFile(file, "utf8");
  assert.deepEqual(
    [...html.matchAll(/data:image\/jpeg;base64,([^"\s]+)/g)].map((m) =>
      hash(Buffer.from(m[1], "base64")),
    ),
    sourceHashes,
  );
  return { file, sha256: hash(html), bytes: Buffer.byteLength(html) };
}
try {
  for (const [engineName, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await engine.launch();
    try {
      for (const width of [1440, 375]) {
        available = true;
        const context = await browser.newContext({ viewport: { width, height: 1000 } });
        if (engineName === "chromium")
          await context.grantPermissions(["clipboard-read", "clipboard-write"]);
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (e) => errors.push(String(e)));
        await page.goto(`${base}entasis.html`);
        await page.evaluate(() => document.fonts.ready);
        await until(page, "#entasis-offline", "saved offline");
        assert.equal(
          await page.evaluate(() => navigator.serviceWorker.controller?.state),
          "activated",
        );
        await overflow(page);
        const initial = await save(page, `${engineName}-${width}-default.html`);
        const violations = (await new AxeBuilder({ page }).analyze()).violations;
        assert.deepEqual(
          violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          [],
        );
        await page.locator("#entasis-station").focus();
        await page.keyboard.press("Home");
        for (let station = 0; station < 5; station++) {
          if (station) await page.keyboard.press("ArrowRight");
          assert.equal(await page.locator("#entasis-station").inputValue(), String(station));
          assert.equal(
            await page.locator(`[data-select-station="${station}"]`).getAttribute("aria-pressed"),
            "true",
          );
        }
        for (const units of ["metric", "feet"]) {
          await page.selectOption("#entasis-units", units);
          for (const enlargement of [1, 25, 100, 200]) {
            await page.selectOption("#entasis-enlargement", String(enlargement));
            for (const prediction of ["none", "hyperbola", "circle"]) {
              await page.selectOption("#entasis-prediction", prediction);
              for (let station = 0; station < 5; station++) {
                await page.locator(`[data-select-station="${station}"]`).click();
                assert.equal(
                  await page.evaluate(() => document.activeElement?.dataset.selectStation),
                  String(station),
                );
                report.geometry.push({ engine: engineName, width, ...(await geometry(page)) });
              }
            }
          }
        }
        await page.locator("#compare-circle").click();
        assert.equal(await page.locator("#entasis-prediction").inputValue(), "circle");
        assert.equal(await page.locator("#entasis-station").inputValue(), "1");
        assert.match(await page.locator("#prediction-assessment").innerText(), /2\.042 mm/);
        await page.locator("#inspect-rounding").click();
        assert.equal(await page.locator("#entasis-prediction").inputValue(), "hyperbola");
        assert.match(await page.locator("#prediction-assessment").innerText(), /0\.335 mm/);
        await page.selectOption("#entasis-prediction", "circle");
        await page.selectOption("#entasis-units", "feet");
        await page.locator('[data-comparison="equal"]').click();
        report.geometry.push({ engine: engineName, width, ...(await geometry(page)) });
        const altered = await save(page, `${engineName}-${width}-circle.html`);
        await page.locator("#entasis-share").click();
        let shared;
        if (engineName === "chromium")
          shared = await page.evaluate(() => navigator.clipboard.readText());
        else {
          await until(page, "#entasis-action-status", "Copied");
          await page.evaluate(() => {
            const input = document.createElement("textarea");
            input.id = "clipboard-probe";
            document.body.append(input);
          });
          await page.locator("#clipboard-probe").focus();
          await page.keyboard.press("Control+V");
          shared = await page.locator("#clipboard-probe").inputValue();
          await page.locator("#clipboard-probe").evaluate((input) => input.remove());
        }
        assert.match(
          shared,
          /station=2&enlarge=200&prediction=circle&units=feet&compare=equal#entasis-workshop$/,
        );
        await page.goto(shared);
        await until(page, "#entasis-offline", "saved offline");
        assert.equal(
          await page.locator('[data-comparison="equal"]').getAttribute("aria-pressed"),
          "true",
        );
        const [csvDownload] = await Promise.all([
          page.waitForEvent("download"),
          page.locator("#entasis-csv").click(),
        ]);
        const csvFile = path.join(directory, `${engineName}-${width}.csv`);
        await csvDownload.saveAs(csvFile);
        const csv = await readFile(csvFile, "utf8");
        assert.equal(csv.trim().split(/\r?\n/).length, 6);
        assert.match(csv, /15\.75,0\.2886,0\.2875,0\.2886/);
        for (const id of ["39", "40", "41", "plate", "latin"]) {
          await page.locator(`[data-source-page="${id}"]`).click();
          await page.locator("#entasis-scan-window").scrollIntoViewIfNeeded();
          await page.locator("#entasis-scan-window img").evaluate((i) => i.decode());
          assert(
            await page.locator("#entasis-scan-window img").evaluate((i) => i.naturalWidth > 1000),
          );
          await page.locator("#entasis-scan-zoom").click();
          await overflow(page);
          await page.locator("#entasis-scan-zoom").click();
        }
        await page.locator('[data-source-page="41"]').click();
        await page.locator("#entasis-scan-window img").evaluate((i) => i.decode());
        await page.locator('a[data-source="41"]').click();
        await page.locator("#entasis-scan-window img").evaluate((i) => i.decode());
        await page.locator("#entasis-scan-zoom").click();
        const focusedFraction = await page
          .locator("#entasis-scan-window")
          .evaluate(
            (el) => (el.scrollTop + el.clientHeight / 2) / el.querySelector("img").clientHeight,
          );
        assert(
          Math.abs(focusedFraction - 0.435) < 0.005,
          `The source table moved away during enlargement: ${focusedFraction}`,
        );
        await page.locator("#entasis-scan-zoom").click();
        await page
          .locator("#entasis-workshop")
          .screenshot({ path: path.join(directory, `assets/entasis-${engineName}-${width}.png`) });
        await page
          .locator("#entasis-sources")
          .screenshot({ path: path.join(directory, `assets/source-${engineName}-${width}.png`) });
        const requestsBefore = rejected;
        available = false;
        await page.goto(`${base}?beam=3&treatment=contract#workshop`);
        await page.locator("#beam").focus();
        await page.keyboard.press("End");
        assert.equal(await page.locator("#beam").inputValue(), "3");
        await page.getByRole("link", { name: "Column spacing", exact: true }).click();
        await page.locator('[data-system="diastyle"]').click();
        assert.match(await page.locator("#selected-system").innerText(), /Diastyle/);
        await page.getByRole("link", { name: "Entasis", exact: true }).click();
        await until(page, "#entasis-offline", "saved offline");
        await page.locator("#compare-circle").click();
        assert.equal(await page.locator("#entasis-prediction").inputValue(), "circle");
        await page.locator('[data-source-page="latin"]').click();
        await page.locator("#entasis-scan-window").scrollIntoViewIfNeeded();
        await page.locator("#entasis-scan-window img").evaluate((i) => i.decode());
        const offlineReading = await save(page, `${engineName}-${width}-offline.html`);
        const sourcePdf = await page.evaluate(async () => {
          const r = await fetch("./sources/entasis/entasis-source-pages.pdf");
          const b = await r.arrayBuffer();
          return {
            ok: r.ok,
            bytes: b.byteLength,
            signature: new TextDecoder().decode(b.slice(0, 8)),
          };
        });
        assert(sourcePdf.ok && sourcePdf.signature.startsWith("%PDF-1.4"));
        assert(rejected > requestsBefore, "Navigation did not reach the disabled origin");
        available = true;
        const reader = await context.newPage();
        const external = [];
        await reader.route(/^https?:/, (route) => {
          external.push(route.request().url());
          return route.abort();
        });
        for (const reading of [initial, altered]) {
          await reader.goto(`file://${reading.file}`);
          await reader
            .locator(".source-pages img")
            .evaluateAll((images) => Promise.all(images.map((i) => i.decode())));
          await overflow(reader);
          assert.equal(await reader.locator(".source-pages img").count(), 5);
          if (engineName === "chromium")
            await reader.pdf({
              path: reading.file.replace(/\.html$/, ".pdf"),
              format: "A4",
              printBackground: true,
              margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
            });
        }
        assert.deepEqual(external, []);
        assert.deepEqual(errors, []);
        report.configurations.push({
          engine: engineName,
          version: browser.version(),
          width,
          axeViolations: 0,
          pageErrors: errors,
          initial,
          altered,
          offlineReading,
          shared,
          disabledOriginRequests: rejected - requestsBefore,
          sourcePdf,
          portableNetworkRequests: external,
        });
        console.log(
          `${engineName} ${width}px: controls, source scans, exports and three offline pages reviewed`,
        );
        await context.close();
      }
      // Hold one real installation response beyond the previous eight-second
      // timeout; the page must recover without reload after it is released.
      let release;
      gate = new Promise((resolve) => {
        release = resolve;
      });
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${base}entasis.html`);
      await until(page, "#entasis-offline", "Downloading");
      await new Promise((resolve) => setTimeout(resolve, 8500));
      const held = await page.locator("#entasis-offline").innerText();
      assert.match(held, /Downloading/);
      assert.doesNotMatch(held, /saved offline|unavailable/);
      release();
      gate = null;
      await until(page, "#entasis-offline", "saved offline");
      report.offline.push({
        engine: engineName,
        case: "held source beyond eight seconds",
        held,
        after: await page.locator("#entasis-offline").innerText(),
        reloads: 0,
      });
      await context.close();
      substitute = true;
      const failedContext = await browser.newContext();
      const failedPage = await failedContext.newPage();
      await failedPage.goto(`${base}entasis.html`);
      await until(failedPage, "#entasis-offline", "unavailable");
      assert.equal(
        await failedPage.evaluate(() => Boolean(navigator.serviceWorker.controller)),
        false,
      );
      let downloads = 0;
      failedPage.on("download", () => {
        downloads++;
      });
      await failedPage.locator("#entasis-save").click();
      await until(failedPage, "#entasis-action-status", "could not be verified");
      assert.equal(downloads, 0);
      substitute = false;
      await failedPage.reload();
      await until(failedPage, "#entasis-offline", "saved offline");
      report.offline.push({
        engine: engineName,
        case: "substituted scan rejected, reload after repair",
        falseSuccess: false,
        unverifiedDownloads: downloads,
        recovered: true,
      });
      await failedContext.close();
    } finally {
      await browser.close();
    }
  }
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        output,
        configurations: report.configurations.length,
        renderedViews: report.geometry.length,
        offlineCases: report.offline.length,
      },
      null,
      2,
    ),
  );
} finally {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
