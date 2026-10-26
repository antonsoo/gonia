// biome-ignore-all lint/performance/useDomNodeTextContent: Review visible learner-facing content.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const out = path.resolve(process.argv[2] ?? "/tmp/gonia-ledger-review");
const external = process.argv[3];
if (external && (!external.startsWith("https://") || !external.endsWith("/")))
  throw new Error("Use a canonical HTTPS base ending in /.");
await mkdir(out, { recursive: true });
const manifest = JSON.parse(await readFile("public/sources/ledger/manifest.json", "utf8"));
const hash = (b) => createHash("sha256").update(b).digest("hex");
const report = {
  checkedAt: new Date().toISOString(),
  source: external ?? "local production build; origin disabled for offline review",
  originDisabledForOfflineReview: !external,
  canonicalIndexChecks: [],
  worker: hash(await readFile("dist/sw.js")),
  configurations: [],
  corruption: [],
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
  ".xml": "application/xml",
};
async function serve() {
  if (external) return { base: external, offline() {}, close: async () => {} };
  let online = true;
  const server = createServer(async (req, res) => {
    if (!online) {
      req.socket.destroy();
      return;
    }
    try {
      const url = new URL(req.url, "http://review");
      const file = decodeURIComponent(url.pathname).replace(/^\/gonia\//, "") || "index.html";
      if (!url.pathname.startsWith("/gonia/") || file.includes("..")) throw Error("path");
      res
        .writeHead(200, {
          "Content-Type": mime[path.extname(file)] ?? "text/plain",
          "Cache-Control": "no-store",
        })
        .end(await readFile(path.join("dist", file)));
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    base: `http://127.0.0.1:${server.address().port}/gonia/`,
    offline() {
      online = false;
      server.closeAllConnections();
    },
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
async function sourceReady(page) {
  await page.waitForFunction(() => {
    const note = document.querySelector("#lg-source-note");
    const error = document.querySelector("#lg-source-error");
    return note?.textContent.startsWith("Verified") || (error && !error.hidden);
  });
  assert.match(
    await page.locator("#lg-source-note").innerText(),
    /^Verified/,
    await page.locator("#lg-source-error").innerText(),
  );
}
async function download(page, selector, filename) {
  const event = page.waitForEvent("download");
  await page.locator(selector).click();
  const item = await event;
  await item.saveAs(path.join(out, filename));
  assert.equal(await item.failure(), null);
  return readFile(path.join(out, filename));
}
async function noOverflow(page) {
  const sizes = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  assert.ok(sizes.scroll <= sizes.width + 1, JSON.stringify(sizes));
}
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await engine.launch({ headless: true });
  try {
    for (const width of [1440, 375]) {
      const server = await serve();
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        acceptDownloads: true,
      });
      const p = await context.newPage();
      const errors = [];
      p.on("pageerror", (error) => errors.push(error.message));
      const prefix = `${name}-${width}`;
      try {
        await p.goto(server.base);
        await p.getByRole("link", { name: "Building accounts", exact: true }).click();
        await sourceReady(p);
        await p.waitForFunction(
          () =>
            document.querySelector("#lg-offline").textContent === "Workshop & source saved offline",
          null,
          { timeout: 60000 },
        );
        await p.evaluate(() => document.fonts.ready);
        assert.equal(await p.locator("[data-lg-extra]:checked").count(), 0);
        assert.match(await p.locator("#lg-result").innerText(), /5 obols remain/);
        await p.locator("#lg-extra-0").focus();
        await p.keyboard.press("Space");
        assert.equal(await p.locator("#lg-extra-0").isChecked(), true);
        for (const i of [1, 2, 3, 4]) await p.locator(`#lg-extra-${i}`).check();
        assert.match(await p.locator("#lg-result").innerText(), /total balances/);
        assert.equal(await p.locator("#lg-record-0").isVisible(), false);
        await p.locator("#lg-reveal").click();
        assert.match(await p.locator("#lg-result").innerText(), /matches the edited record/);
        assert.equal(await p.evaluate(() => document.activeElement.id), "lg-copy");
        assert.deepEqual(await p.locator(".lg-record").allTextContents(), [
          "14 dr. 2 ob.",
          "14 dr. 2 ob.",
          "14 dr. 2 ob.",
          "14 dr. 2 ob.",
          "14 dr. 2 ob.",
          "14 dr. 1 ob.",
          "14 dr. 1 ob.",
        ]);
        await noOverflow(p);
        await p
          .locator("#lg-workshop")
          .evaluate((node) => window.scrollTo(0, node.getBoundingClientRect().top + scrollY - 16));
        await p.screenshot({ path: path.join(out, `${prefix}-workshop.png`) });
        await p.locator("#lg-extra-0").uncheck();
        await p.locator("#lg-extra-6").check();
        assert.match(await p.locator("#lg-result").innerText(), /Balanced, but different/);
        await p.locator("#lg-extra-5").check();
        assert.match(await p.locator("#lg-result").innerText(), /1 obol over/);
        await p.goBack();
        assert.equal(await p.locator("#lg-extra-5").isChecked(), false);
        assert.match(await p.locator("#lg-result").innerText(), /Balanced, but different/);
        await sourceReady(p);
        for (let i = 0; i < 7; i++) {
          await p.locator(`[data-lg-person="${i}"]`).click();
          await p.locator("#lg-find").click();
          await sourceReady(p);
          assert.equal(await p.locator("#lg-source-band").isVisible(), true);
          assert.match(await p.locator("#lg-lines").innerText(), /IG lines/);
          assert.ok(
            await p
              .locator("#lg-source-pan")
              .evaluate((e) => e.scrollHeight <= e.clientHeight || e.scrollTop > 0),
          );
        }
        await p.locator("[data-lg-person='5']").click();
        await p.locator("#lg-find").click();
        await sourceReady(p);
        await p.locator("#lg-zoom").focus();
        await p.keyboard.press("End");
        assert.equal(await p.locator("#lg-zoom").inputValue(), "250");
        await noOverflow(p);
        await p.locator("#lg-zoom").fill("150");
        await p.locator("#lg-find").click();
        await sourceReady(p);
        assert.ok(
          await p.locator("#lg-source-band").evaluate((band) => {
            const b = band.getBoundingClientRect(),
              p = document.querySelector("#lg-source-pan").getBoundingClientRect();
            return b.left >= p.left && b.right <= p.right;
          }),
        );
        await p.locator("#lg-reading").scrollIntoViewIfNeeded();
        await p.screenshot({
          path: path.join(out, `${prefix}-reading.png`),
          fullPage: width === 375,
        });
        await p.locator("#lg-page").selectOption("412");
        await sourceReady(p);
        assert.equal(await p.locator("#lg-source-band").isVisible(), false);
        for (let i = 0; i < 4; i++) {
          await p.locator(`[data-lg-word="${i}"]`).click();
          assert.ok((await p.locator("#lg-word-note").innerText()).length > 100);
        }
        await p.locator("[data-lg-entry='90']").click();
        await p.locator("#lg-copy").click();
        assert.deepEqual(await p.locator(".lg-record").allTextContents(), [
          "13 dr.",
          "12 dr. 5 ob.",
          "12 dr. 5 ob.",
          "12 dr. 5 ob.",
          "12 dr. 5 ob.",
          "12 dr. 5 ob.",
          "12 dr. 5 ob.",
        ]);
        assert.match(await p.locator("#lg-result").innerText(), /matches the edited record/);
        await p.locator("#lg-find").click();
        await sourceReady(p);
        assert.equal(await p.locator("#lg-page").inputValue(), "390");
        await p.locator("#lg-reading").scrollIntoViewIfNeeded();
        if (name === "chromium" && width === 1440)
          await p.screenshot({ path: path.join(out, "chromium-1440-earlier-reading.png") });
        await p.locator("[data-lg-entry='100']").click();
        for (const i of [1, 2, 3, 4, 6]) await p.locator(`#lg-extra-${i}`).check();
        await p.locator("[data-lg-person='6']").click();
        await sourceReady(p);
        await p.locator("#lg-share").click();
        const shared = new URL(await p.locator("#lg-share-url").inputValue());
        assert.equal(shared.searchParams.get("extra"), "94");
        assert.equal(shared.searchParams.get("person"), "6");
        const axe = await new AxeBuilder({ page: p }).analyze();
        const serious = axe.violations.filter((v) => ["serious", "critical"].includes(v.impact));
        assert.deepEqual(serious, []);
        const csvName = `${prefix}.csv`;
        const csv = await download(p, "#lg-csv", csvName);
        const htmlName = `${prefix}-reading.html`;
        const html = await download(p, "#lg-save", htmlName);
        const text = html.toString("utf8");
        assert.equal((text.match(/<figure>/g) ?? []).length, 4);
        assert.ok(text.includes("differs from"));
        const savedContext = await browser.newContext({
          offline: true,
          viewport: { width, height: 1000 },
          acceptDownloads: true,
        });
        const saved = await savedContext.newPage();
        const remoteRequests = [];
        saved.on("request", (r) => {
          if (/^https?:/.test(r.url())) remoteRequests.push(r.url());
        });
        await saved.goto(pathToFileURL(path.join(out, htmlName)).href);
        await saved.evaluate(() => document.fonts.ready);
        const images = await saved
          .locator("figure img")
          .evaluateAll((all) => all.map((i) => ({ loaded: i.complete, width: i.naturalWidth })));
        assert.deepEqual(
          images,
          Array.from({ length: 4 }, () => ({ loaded: true, width: 1600 })),
        );
        await noOverflow(saved);
        const savedCsv = await download(saved, "a[download$='.csv']", `${prefix}-from-study.csv`);
        assert.equal(hash(csv), hash(savedCsv));
        const xml = await download(saved, "a[download$='.xml']", `${prefix}-from-study.xml`);
        assert.equal(hash(xml), manifest.assets["sources/ledger/ig-476-excerpt.xml"]);
        if (name === "chromium" && width === 1440) {
          await saved.pdf({
            path: path.join(out, "ledger-reading.pdf"),
            format: "A4",
            printBackground: true,
            margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
          });
          await saved.evaluate(() => window.scrollTo(0, 0));
          await saved.screenshot({ path: path.join(out, "saved-reading.png") });
        }
        assert.deepEqual(remoteRequests, []);
        await savedContext.close();
        server.offline();
        await context.setOffline(true);
        await p.reload();
        await sourceReady(p);
        assert.match(await p.locator("#lg-result").innerText(), /Balanced, but different/);
        await p.locator("[data-lg-entry='90']").click();
        await p.locator("#lg-copy").click();
        await p.locator("#lg-find").click();
        await sourceReady(p);
        assert.match(await p.locator("#lg-result").innerText(), /matches the edited record/);
        const offlineHtml = await download(p, "#lg-save", `${prefix}-offline-reading.html`);
        assert.ok(offlineHtml.length > 1000000);
        assert.deepEqual(errors, []);
        if (external) {
          const response = await fetch(external);
          assert.equal(response.status, 200);
          const actual = Buffer.from(await response.arrayBuffer());
          const expected = await readFile("dist/index.html");
          assert.equal(hash(actual), hash(expected));
          report.canonicalIndexChecks.push({
            browser: name,
            width,
            matches: true,
            sha256: hash(actual),
          });
        }
        report.configurations.push({
          browser: name,
          width,
          csv: csvName,
          html: htmlName,
          csvSHA256: hash(csv),
          htmlSHA256: hash(html),
          savedStudyOffline: true,
          offline: true,
          sourcePages: images.length,
          seriousAxeViolations: serious.length,
          pageErrors: errors,
        });
      } finally {
        await context.close();
        await server.close();
      }
    }
    if (external) continue;
    const server = await serve();
    try {
      const invalidContext = await browser.newContext();
      const p = await invalidContext.newPage();
      await p.goto(`${server.base}ledger.html?entry=90&entry=100&extra=31`);
      await p.locator("#lg-invalid").waitFor({ state: "visible" });
      assert.equal(await p.locator("[data-lg-extra]:checked").count(), 0);
      await invalidContext.close();
      for (const kind of ["page", "font"]) {
        const context = await browser.newContext({
          serviceWorkers: "block",
          acceptDownloads: true,
        });
        const route =
          kind === "page" ? "**/sources/ledger/caskey-392.jpg" : "**/fonts/NotoSerif-Regular.ttf";
        const wrong =
          kind === "page"
            ? "public/sources/ledger/caskey-390.jpg"
            : "public/fonts/IBMPlexSans-Regular.woff2";
        await context.route(route, (r) =>
          r.fulfill({
            status: 200,
            contentType: kind === "page" ? "image/jpeg" : "font/ttf",
            path: wrong,
          }),
        );
        const p = await context.newPage();
        let downloads = 0;
        p.on("download", () => downloads++);
        await p.goto(`${server.base}ledger.html`);
        if (kind === "page") {
          await p.locator("#lg-source-error").waitFor({ state: "visible" });
          assert.equal(await p.locator("#lg-source-sheet").isVisible(), false);
        }
        await p.locator("#lg-save").click();
        await p.waitForFunction(() =>
          document.querySelector("#lg-save-status").textContent.includes("does not match"),
        );
        assert.equal(downloads, 0);
        await context.unroute(route);
        await download(p, "#lg-save", `${name}-${kind}-retry-reading.html`);
        assert.equal(downloads, 1);
        report.corruption.push({
          browser: name,
          substituted: kind,
          failedClosed: true,
          retrySaved: true,
        });
        await context.close();
      }
    } finally {
      await server.close();
    }
  } finally {
    await browser.close();
  }
}
await writeFile(path.join(out, "browser.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(
  JSON.stringify({
    configurations: report.configurations.length,
    corruptSourcesRejected: report.corruption.length,
    directory: out,
  }),
);
