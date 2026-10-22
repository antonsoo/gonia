// biome-ignore-all lint/performance/useDomNodeTextContent: Verify visible learner-facing text.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const output = process.argv[2] ?? "docs/browser-review.json";
const assets = path.join(path.dirname(output), "assets");
await mkdir(assets, { recursive: true });
let available = true;
let rejected = 0;
const server = http.createServer(async (req, res) => {
  if (!available) {
    rejected++;
    req.socket.destroy();
    return;
  }
  const url = new URL(req.url, "http://localhost");
  const relative = decodeURIComponent(url.pathname).replace(/^\/gonia\//, "") || "index.html";
  if (relative.includes("..") || !url.pathname.startsWith("/gonia/")) {
    res.writeHead(404).end();
    return;
  }
  try {
    const body = await readFile(path.join("dist", relative));
    const types = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".svg": "image/svg+xml",
      ".pdf": "application/pdf",
      ".woff2": "font/woff2",
      ".ttf": "font/ttf",
    };
    res
      .writeHead(200, {
        "Content-Type": types[path.extname(relative)] ?? "text/plain",
        "Cache-Control": "no-cache",
      })
      .end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}/gonia/`;
const report = {
  checkedAt: new Date().toISOString(),
  scope:
    "Built app; native controls, linked source, saved HTML, actual offline origin failures. No historical accuracy certification.",
  configurations: [],
};
const scan = await readFile("dist/sources/vitruvius-82-83.pdf");
const scanHash = createHash("sha256").update(scan).digest("hex");
try {
  for (const [engineName, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await engine.launch();
    try {
      for (const width of [1440, 375]) {
        available = true;
        const context = await browser.newContext({
          viewport: { width, height: 950 },
          acceptDownloads: true,
        });
        const page = await context.newPage();
        const errors = [],
          external = [],
          accessibility = [];
        page.on("pageerror", (e) => errors.push(String(e)));
        page.on("request", (req) => {
          if (!req.url().startsWith(base) && !req.url().startsWith("blob:"))
            external.push(req.url());
        });
        await page.goto(`${base}?b=2.40&t=contract#workshop`);
        await page.waitForFunction(
          () =>
            document.querySelector("#offline").textContent === "Workshop & source saved offline",
        );
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.locator("#bay-value").innerText(), "4.3 T");
        assert.equal(await page.locator("#offset-value").innerText(), "0.7 T off-axis");
        assert.equal(await page.locator("#beam").inputValue(), "2.4");
        const initialTop = await page.locator("#workshop-title").boundingBox();
        assert.ok(initialTop.y >= -1 && initialTop.y < 200, `Shared view landing: ${initialTop.y}`);
        const audit = async (label) => {
          const result = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze();
          assert.deepEqual(
            result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
            [],
            label,
          );
          accessibility.push(label);
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            label,
          );
        };
        await audit("shared contracted corner");
        // Native keyboard input, including the exact geometric limiting case.
        await page.locator("#beam").focus();
        await page.keyboard.press("Home");
        assert.equal(await page.locator("#delta-value").innerText(), "0 T");
        assert.equal(await page.locator("#comparison-body td.changed").count(), 0);
        await page.keyboard.press("End");
        assert.equal(await page.locator("#delta-value").innerText(), "1 T");
        for (const [t, metope, bay, offset] of [
          ["align", "1.5 T", "5 T", "0 T off-axis"],
          ["widen", "2.5 T", "5 T", "1 T off-axis"],
          ["contract", "1.5 T", "4 T", "1 T off-axis"],
        ]) {
          await page.locator(`[name=treatment][value=${t}]`).check();
          assert.equal(await page.locator("#metope-value").innerText(), metope);
          assert.equal(await page.locator("#bay-value").innerText(), bay);
          assert.equal(await page.locator("#offset-value").innerText(), offset);
          await audit(`${t} at B=3`);
        }
        for (const [id, greek, latin] of [
          ["corner", "γωνία", "angulus"],
          ["triglyph", "τρίγλυφος", "triglyphus"],
          ["metope", "μετόπη", "metopa"],
          ["beam", "ἐπιστύλιον", "epistylium"],
          ["column", "κίων", "columna"],
        ]) {
          await page.selectOption("#term", id);
          assert.equal(await page.locator(".word-greek").innerText(), greek);
          assert.equal(await page.locator("#word-detail [lang=la]").innerText(), latin);
          if (id !== "corner") assert.ok((await page.locator("#elevation .selected").count()) > 0);
        }
        await audit("highlighted vocabulary");
        await page.locator("nav a[href='#reading']").click();
        assert.equal(await page.locator("#beam").inputValue(), "3");
        assert.equal(new URL(page.url()).searchParams.get("t"), "contract");
        await page.locator('[data-treatment="widen"]').click();
        assert.equal(await page.locator("#metope-value").innerText(), "2 T");
        assert.equal(await page.locator("#beam").inputValue(), "2");
        assert.equal(
          await page.locator("#beam").evaluate((e) => e === document.activeElement),
          true,
        );
        await page.selectOption("#term", "triglyph");
        await page.locator("#workshop").scrollIntoViewIfNeeded();
        await page.evaluate(() => document.querySelector("#workshop").scrollIntoView());
        await page.screenshot({ path: path.join(assets, `${engineName}-${width}-workshop.png`) });
        await page.evaluate(() => document.querySelector("#elevation").scrollIntoView());
        await page.screenshot({ path: path.join(assets, `${engineName}-${width}-drawing.png`) });
        const [download] = await Promise.all([
          page.waitForEvent("download"),
          page.locator("#save").click(),
        ]);
        const saved = path.join(path.dirname(output), `${engineName}-${width}-study.html`);
        await download.saveAs(saved);
        const html = await readFile(saved, "utf8");
        assert.match(html, /intercolumnia extrema contrahunt/);
        assert.match(html, /b=2\.00&amp;t=widen#workshop/);
        const exported = await context.newPage();
        const exportRequests = [];
        exported.on("request", (req) => {
          if (!req.url().startsWith("file:")) exportRequests.push(req.url());
        });
        await exported.goto(`file://${path.resolve(saved)}`);
        assert.equal(await exported.locator("svg").count(), 2);
        assert.match(await exported.locator("body").innerText(), /ἐπιστύλιον/);
        assert.deepEqual(exportRequests, []);
        if (engineName === "chromium" && width === 1440)
          await exported.pdf({
            path: path.join(path.dirname(output), "saved-study.pdf"),
            format: "A4",
            printBackground: true,
          });
        await exported.close();
        // Disable the actual origin, not just the page's network context.
        available = false;
        const beforeRejected = rejected;
        await page.reload();
        await page.waitForFunction(
          () =>
            document.querySelector("#offline").textContent === "Workshop & source saved offline",
        );
        assert.equal(await page.locator("#metope-value").innerText(), "2 T");
        await page.locator("#beam").focus();
        await page.keyboard.press("ArrowRight");
        assert.equal(await page.locator("#beam").inputValue(), "2.01");
        assert.equal(await page.locator("#metope-value").innerText(), "2.005 T");
        const offlineHash = await page.evaluate(async () => {
          const response = await fetch("./sources/vitruvius-82-83.pdf");
          const bytes = await response.arrayBuffer();
          return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
            .map((v) => v.toString(16).padStart(2, "0"))
            .join("");
        });
        assert.equal(offlineHash, scanHash);
        assert.ok(rejected > beforeRejected);
        assert.deepEqual(errors, []);
        assert.deepEqual(external, []);
        report.configurations.push({
          browser: engineName,
          version: browser.version(),
          width,
          nativeKeyboard: true,
          treatments: 3,
          vocabulary: 5,
          accessibility,
          savedStudy: true,
          savedStudyExternalRequests: 0,
          sourceSha256: offlineHash,
          offlineRejectedOriginRequests: rejected - beforeRejected,
          pageErrors: errors,
          externalRequests: external,
        });
        available = true;
        await context.close();
        console.log(
          `${engineName} ${width}: geometry, vocabulary, source, export and offline passed`,
        );
      }
    } finally {
      await browser.close();
    }
  }
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
} finally {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
