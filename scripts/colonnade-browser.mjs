// biome-ignore-all lint/performance/useDomNodeTextContent: Review visible browser text.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.resolve(process.argv[2] ?? "/tmp/gonia-colonnade");
await mkdir(output, { recursive: true });
const sha = (b) => createHash("sha256").update(b).digest("hex");
const report = { build: sha(await readFile(path.join(root, "dist/sw.js"))), journeys: [] };
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
};
async function serve() {
  let available = true,
    stoppedRequests = 0;
  const server = createServer(async (req, res) => {
    if (!available) {
      stoppedRequests++;
      req.socket.destroy();
      return;
    }
    try {
      const u = new URL(req.url, "http://local");
      if (!u.pathname.startsWith("/gonia/")) throw new Error("route");
      const file = path.resolve(
        root,
        "dist",
        decodeURIComponent(u.pathname.slice(7)) || "index.html",
      );
      if (!file.startsWith(path.join(root, "dist") + path.sep)) throw new Error("path");
      const b = await readFile(file);
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] ?? "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(b);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return {
    base: `http://127.0.0.1:${server.address().port}/gonia/`,
    stopOrigin: () => {
      available = false;
    },
    requests: () => stoppedRequests,
    close: async () => {
      server.closeAllConnections();
      await new Promise((r) => server.close(r));
    },
  };
}
async function download(page, button, name) {
  const pending = page.waitForEvent("download");
  await page.locator(button).click();
  const file = await pending;
  const target = path.join(output, name);
  await file.saveAs(target);
  return target;
}
async function changeRange(page, id, value) {
  await page.locator(id).evaluate((e, v) => {
    e.value = String(v);
    e.dispatchEvent(new Event("input", { bubbles: true }));
    e.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}
async function geometry(page, width, gap, kind) {
  const actual = await page
    .locator(`${width === 375 ? "#col-plan-portrait" : "#col-plan"} svg`)
    .evaluate((svg) => {
      const matrix = svg.getScreenCTM();
      return {
        ox: Number(svg.dataset.originX),
        oy: Number(svg.dataset.originY),
        scale: Number(svg.dataset.scale),
        horizontalScale: matrix.a,
        verticalScale: matrix.d,
        columns: [...svg.querySelectorAll("g[data-column]")].map((g) => {
          const c = g.querySelector("circle");
          return {
            id: g.dataset.column,
            ring: g.dataset.ring,
            x: Number(c.getAttribute("cx")),
            y: Number(c.getAttribute("cy")),
            r: Number(c.getAttribute("r")),
            dashed: getComputedStyle(c).strokeDasharray !== "none",
          };
        }),
      };
    });
  assert.equal(
    actual.horizontalScale,
    actual.verticalScale,
    "Drawing distorted physical length scales",
  );
  const p = gap + 1;
  for (const [ring, inset] of [
    ["outer", 0],
    ["inner", 1],
  ]) {
    const expected = new Set();
    for (let x = inset; x <= 14 - inset; x++)
      for (let y = inset; y <= 7 - inset; y++)
        if (x === inset || x === 14 - inset || y === inset || y === 7 - inset)
          expected.add(`${x},${y}`);
    const seen = new Set();
    for (const c of actual.columns.filter((c) => c.ring === ring)) {
      const dx = (c.x - actual.ox) / actual.scale / p,
        dy = (c.y - actual.oy) / actual.scale / p;
      const gx = width === 375 ? dy : dx,
        gy = width === 375 ? dx : dy;
      assert(Math.abs(gx - Math.round(gx)) < 1e-10);
      assert(Math.abs(gy - Math.round(gy)) < 1e-10);
      seen.add(`${Math.round(gx)},${Math.round(gy)}`);
      assert.equal(c.r / actual.scale, 0.5);
      assert.equal(c.dashed, ring === "inner" && kind === "pseudo");
    }
    assert.deepEqual([...seen].sort(), [...expected].sort());
  }
  assert.equal(new Set(actual.columns.map((c) => c.id)).size, 76);
  return actual.columns.map((c) => [c.id, c.x, c.y]);
}

for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await engine.launch();
  try {
    for (const width of [1440, 375]) {
      const host = await serve();
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        reducedMotion: width === 375 ? "reduce" : "no-preference",
        acceptDownloads: true,
      });
      try {
        const page = await context.newPage(),
          errors = [],
          external = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("request", (r) => {
          if (/^https?:/.test(r.url()) && !r.url().startsWith(host.base)) external.push(r.url());
        });
        await page.goto(`${host.base}colonnade.html`);
        await page.locator(`${width === 375 ? "#col-plan-portrait" : "#col-plan"} svg`).waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForFunction(
          () => document.querySelector("#col-offline").textContent.includes("saved offline"),
          {},
          { timeout: 60000 },
        );
        assert.equal(await page.locator("#col-pseudo").getAttribute("aria-pressed"), "true");
        assert.match(await page.locator("#col-width-title").textContent(), /5.5 D/);
        await page.keyboard.press("Tab");
        assert.equal(await page.locator(":focus").getAttribute("class"), "skip");
        await page.locator("#col-double").focus();
        await page.keyboard.press("Enter");
        assert.equal(await page.locator("#col-double").getAttribute("aria-pressed"), "true");
        await page.locator("#col-gap").focus();
        await page.keyboard.press("Home");
        assert.equal(await page.locator("#col-gap").inputValue(), "1.5");
        await page.keyboard.press("End");
        assert.equal(await page.locator("#col-gap").inputValue(), "3");
        await page.keyboard.press("ArrowLeft");
        assert.equal(await page.locator("#col-gap").inputValue(), "2.75");
        let renderedCases = 0;
        for (let gap = 1.5; gap <= 3; gap += 0.25) {
          await changeRange(page, "#col-gap", gap);
          await page.locator("#col-double").click();
          const before = await geometry(page, width, gap, "double");
          await page.locator("#col-pseudo").click();
          const after = await geometry(page, width, gap, "pseudo");
          assert.deepEqual(before, after, "Omission moved a shaft position");
          renderedCases += 2;
        }
        await changeRange(page, "#col-gap", 2.25);
        await page.locator("#col-ring").selectOption("outer");
        await page.locator("#col-count-all").click();
        assert.equal(await page.locator("#col-plan .col-traced").count(), 42);
        assert(await page.locator("#col-count-next").isDisabled());
        await page.locator("#col-count-start").click();
        await page.locator("#col-count-next").focus();
        await page.keyboard.press("Enter");
        assert.match(
          await page.locator("#col-count-note").textContent(),
          /outer-01: front, corner counted here/,
        );
        await page.locator("#col-ring").selectOption("inner");
        await page.locator("#col-count-all").click();
        assert.equal(await page.locator("#col-plan .col-traced").count(), 34);
        await page.locator('[data-col-part="inner"]').click();
        assert.match(await page.locator("#col-part-greek").textContent(), /ψευδοδίπτερος/);
        await page.locator('[data-col-word="5"]').click();
        await page.locator('[data-col-word="2"]').click();
        await page.goBack();
        assert.match(await page.locator("#col-word-title").textContent(), /ambulationi/);
        assert.equal(
          await page.locator('.col-reading:has([data-col-word="5"]) #col-word-note').count(),
          1,
        );
        const sourceImages = [];
        for (const [id, file] of [
          ["restored", "humann-043.jpg"],
          ["remains", "humann-041.jpg"],
          ["prescription", "krohn-063.jpg"],
          ["apparatus", "krohn-066.jpg"],
          ["capital", "humann-055.jpg"],
        ]) {
          await page.locator(`button[data-col-source="${id}"]`).click();
          await page.locator("#col-source-image").evaluate((img) => img.decode());
          const response = await context.request.get(`${host.base}sources/colonnade/${file}`);
          assert.equal(response.status(), 200);
          const digest = sha(await response.body());
          assert.equal(
            digest,
            sha(await readFile(path.join(root, "public/sources/colonnade", file))),
          );
          sourceImages.push({ id, file, sha256: digest });
        }
        await page.locator('button[data-col-source="apparatus"]').click();
        await page.locator("#col-source-find").click();
        assert(Number(await page.locator("#col-source-zoom").inputValue()) > 100);
        assert(await page.locator("#col-source-pan").evaluate((e) => e.scrollTop > 0));
        await page.locator("#col-source-pan").scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(output, `${name}-${width}-apparatus.png`) });
        await page.locator("#col-source-top").click();
        assert.equal(await page.locator("#col-source-pan").evaluate((e) => e.scrollTop), 0);
        await page.locator("#col-source-pan").focus();
        await page.keyboard.press("ArrowDown");
        await page.waitForFunction(() => document.querySelector("#col-source-pan").scrollTop > 0);
        await page.locator("#col-share").click();
        await page.waitForFunction(() =>
          /Link copied|Copy the link/.test(
            document.querySelector("#col-action-status").textContent,
          ),
        );
        const fallback = page.locator("#col-share-url");
        if (await fallback.isVisible())
          assert.match(await fallback.inputValue(), /source=apparatus/);
        else assert.match(await page.locator("#col-action-status").textContent(), /Link copied/);
        const csvFile = await download(page, "#col-csv", `${name}-${width}.csv`);
        const csv = await readFile(csvFile, "utf8");
        const rows = csv
          .trim()
          .split("\r\n")
          .map((line) =>
            [...line.matchAll(/"((?:[^"]|"")*)"/g)].map((m) => m[1].replaceAll('""', '"')),
          );
        assert.equal(rows.length, 77);
        assert(rows.every((r) => r.length === 18));
        assert.equal(rows.slice(1).filter((r) => r[11] === "true").length, 42);
        assert.equal(rows.slice(1).filter((r) => r[12] === "true").length, 34);
        const reading = await download(page, "#col-save", `${name}-${width}-reading.html`);
        const html = await readFile(reading, "utf8");
        assert(!html.includes("<script"));
        const embedded = [...html.matchAll(/<img src="data:image\/jpeg;base64,([^"]+)"/g)].map(
          (m) => sha(Buffer.from(m[1], "base64")),
        );
        assert.deepEqual(embedded.sort(), sourceImages.map((r) => r.sha256).sort());
        const savedContext = await browser.newContext({
          viewport: { width, height: 1000 },
          offline: true,
        });
        try {
          const saved = await savedContext.newPage();
          await saved.goto(pathToFileURL(reading).href);
          await saved.locator(".printed-page img").last().waitFor();
          assert(
            await saved.evaluate(async () => {
              await document.fonts.ready;
              await Promise.all([...document.images].map((i) => i.decode()));
              return document.fonts.check('16px "Noto"') && document.images.length === 5;
            }),
          );
          assert.equal(await saved.locator(".plans svg").count(), 2);
          assert.equal(
            await saved.locator("body").evaluate((e) => e.scrollWidth <= innerWidth),
            true,
          );
          if (name === "chromium" && width === 1440)
            await saved.pdf({
              path: path.join(output, "reading.pdf"),
              printBackground: true,
              preferCSSPageSize: true,
            });
        } finally {
          await savedContext.close();
        }
        const accessibility = await new AxeBuilder({ page }).analyze();
        const serious = accessibility.violations.filter((v) =>
          ["critical", "serious"].includes(v.impact),
        );
        assert.deepEqual(
          serious.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          [],
        );
        assert.equal(await page.locator("body").evaluate((e) => e.scrollWidth <= innerWidth), true);
        await page.locator("#col-workshop").evaluate((e) => e.scrollIntoView({ block: "start" }));
        await page.screenshot({ path: path.join(output, `${name}-${width}-workshop.png`) });
        const shared = page.url();
        await page.reload();
        assert.equal(page.url(), shared);
        assert.equal(await page.locator("#col-count").inputValue(), "34");
        host.stopOrigin();
        await page.reload();
        await page.locator("#col-heading").waitFor();
        await page.locator("#col-double").click();
        assert.match(await page.locator("#col-width-title").textContent(), /Two clear lanes/);
        await page.locator('button[data-col-source="remains"]').click();
        await page.locator("#col-source-image").evaluate((img) => img.decode());
        const offlineReading = await download(
          page,
          "#col-save",
          `${name}-${width}-offline-reading.html`,
        );
        assert.match(
          await readFile(offlineReading, "utf8"),
          /Selected arrangement: two perimeter rings/,
        );
        await page.goto(`${host.base}spacing.html`);
        await page.locator("#spacing-title").waitFor();
        await page.locator('nav a[href="./colonnade.html"]').click();
        await page.locator("#col-heading").waitFor();
        assert(host.requests() > 0, "Offline check never reached the stopped origin");
        assert.deepEqual(errors, []);
        assert.deepEqual(external, []);
        report.journeys.push({
          browser: name,
          version: browser.version(),
          width,
          renderedCases,
          sourceImages,
          keyboard: true,
          history: true,
          csvRows: 76,
          offlineHtml: true,
          sourceImagesEmbeddedByteForByte: true,
          originStoppedReloadAndExport: true,
          disabledOriginRequests: host.requests(),
          seriousAccessibilityViolations: 0,
          otherAccessibilityFindings: accessibility.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
          })),
          noHorizontalOverflow: true,
          errors,
          external,
        });
        console.log(
          `${name} ${width}: plan, counting, language, sources, downloads and offline workflow reviewed`,
        );
      } finally {
        await context.close();
        await host.close();
      }
    }
    if (name === "chromium") {
      const host = await serve(),
        context = await browser.newContext({ serviceWorkers: "block", acceptDownloads: true });
      try {
        const page = await context.newPage(),
          downloads = [];
        page.on("download", (d) => downloads.push(d));
        await page.goto(`${host.base}colonnade.html`);
        await page.route("**/sources/colonnade/humann-041.jpg", (route) =>
          route.fulfill({
            status: 200,
            contentType: "image/jpeg",
            body: "substituted source bytes",
          }),
        );
        await page.locator("#col-save").click();
        await page.waitForFunction(() =>
          document.querySelector("#col-action-status").textContent.includes("could not verify"),
        );
        assert.equal(downloads.length, 0);
        assert.equal(await page.locator("#col-save").isDisabled(), false);
        await page.unroute("**/sources/colonnade/humann-041.jpg");
        await download(page, "#col-save", "recovered-reading.html");
        report.exportSubstitutionRejectedAndRetryRecovered = true;
      } finally {
        await context.close();
        await host.close();
      }
    }
  } finally {
    await browser.close();
  }
}
await writeFile(path.join(output, "browser-review.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Retained browser receipt: ${path.join(output, "browser-review.json")}`);
