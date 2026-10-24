// biome-ignore-all lint/performance/useDomNodeTextContent: Verify the visible learning workflow.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const out = path.resolve(process.argv[2] ?? "/tmp/gonia-hoist-browser"),
  external = process.argv[3],
  dev = process.argv.includes("--dev");
await mkdir(out, { recursive: true });
const hash = (b) => createHash("sha256").update(b).digest("hex"),
  report = {
    checkedAt: new Date().toISOString(),
    base: external ?? "origin-disabled local production review",
    development: dev,
    worker: hash(await readFile("dist/sw.js")),
    configurations: [],
  };
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".pdf": "application/pdf",
};
async function serve() {
  let online = true;
  const server = createServer(async (req, res) => {
    if (!online) {
      req.socket.destroy();
      return;
    }
    try {
      const url = new URL(req.url, "http://review"),
        f = decodeURIComponent(url.pathname).replace(/^\/gonia\//, "") || "index.html";
      if (!url.pathname.startsWith("/gonia/") || f.includes("..")) throw Error("path");
      res
        .writeHead(200, {
          "Content-Type": types[path.extname(f)] ?? "text/plain",
          "Cache-Control": "no-store",
        })
        .end(await readFile(path.join("dist", f)));
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return {
    base: `http://127.0.0.1:${server.address().port}/gonia/`,
    offline: () => {
      online = false;
      server.closeAllConnections();
    },
    close: async () => {
      server.closeAllConnections();
      await new Promise((r) => server.close(r));
    },
  };
}
const near = (a, b) => assert(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
async function download(page, id, file) {
  const pending = page.waitForEvent("download");
  await page.locator(id).click();
  const d = await pending;
  await d.saveAs(file);
  return readFile(file);
}
async function check(page, n, rise, rope) {
  const d = await page.locator("#hw-drawing svg").evaluate((e) => ({ ...e.dataset }));
  assert.equal(Number(d.supports), n);
  near(Number(d.rise), rise);
  near(Number(d.rope), rope);
  assert.equal(await page.locator("[data-support]").count(), n);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
}
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await engine.launch();
  try {
    for (const width of [1440, 375]) {
      const server = await serve(),
        base = external ?? server.base,
        folder = path.join(out, `${name}-${width}`);
      await mkdir(folder, { recursive: true });
      const context = await browser.newContext({
          viewport: { width, height: 1000 },
          acceptDownloads: true,
        }),
        page = await context.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      try {
        await page.goto(`${base}hoist.html`);
        await page.evaluate(() => document.fonts.ready);
        if (dev) assert.equal(await page.locator("#hw-offline").innerText(), "Development preview");
        else
          await page.waitForFunction(
            () =>
              document.querySelector("#hw-offline").textContent ===
              "Workshop & source saved offline",
            null,
            { timeout: 60000 },
          );
        await check(page, 3, 1, 3);
        await page.screenshot({ path: path.join(folder, "initial.png"), fullPage: true });
        await page.locator("#hw-anchor").selectOption("fixed");
        await check(page, 2, 1, 2);
        await page.locator("#hw-rig").selectOption("five");
        await check(page, 4, 1, 4);
        await page.locator("#hw-anchor").selectOption("moving");
        await check(page, 5, 1, 5);
        await page.locator("#hw-hold").selectOption("rope");
        await check(page, 5, 0.2, 1);
        await page.locator("#hw-rig").selectOption("three");
        await check(page, 3, 1 / 3, 1);
        await page.locator("#hw-rig").selectOption("single");
        await check(page, 1, 1, 1);
        assert(await page.locator("#hw-anchor").isDisabled());
        assert.match(await page.locator("#hw-anchor option:checked").innerText(), /modern control/);
        await page.locator("#hw-distance").focus();
        await page.keyboard.press("ArrowRight");
        await check(page, 1, 1.05, 1.05);
        assert(await page.locator("#hw-distance").evaluate((e) => e === document.activeElement));
        await page.locator("#hw-rig").selectOption("five");
        await page.locator("#hw-hold").selectOption("rise");
        await page.locator("#hw-distance").fill("1");
        await page.locator("#hw-weight").selectOption("1200");
        await page.locator("#hw-arm").selectOption("4");
        await check(page, 5, 1, 5);
        assert.equal(await page.locator("#hw-hand").innerText(), "60 N");
        assert.equal(await page.locator("#hw-hand-path").innerText(), "20 m");
        assert.match(await page.locator("#hw-work").innerText(), /1,200 J/);
        await page
          .getByRole("link", { name: "Follow the rope and lift the load", exact: true })
          .focus();
        await page.keyboard.press("Enter");
        await check(page, 5, 1, 5);
        assert.equal(await page.locator("#hw-weight").inputValue(), "1200");
        assert.equal(await page.locator("#hw-arm").inputValue(), "4");
        await page.locator("#hw-diagram-zoom").fill("200");
        await page.locator("#hw-diagram-pan").focus();
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(250);
        assert(await page.locator("#hw-diagram-pan").evaluate((e) => e.scrollLeft > 0));
        await page.locator("#hw-diagram-zoom").fill("100");
        const json = await download(page, "#hw-save-json", path.join(folder, "experiment.json"));
        assert.deepEqual(JSON.parse(json).state, {
          rig: "five",
          anchor: "moving",
          hold: "rise",
          distance: 1,
          weight: 1200,
          arm: 4,
        });
        await page.locator("#hw-rig").selectOption("single");
        await page
          .locator("#hw-open-json")
          .setInputFiles({ name: "reopen.json", mimeType: "application/json", buffer: json });
        await page.waitForFunction(() => document.querySelector("#hw-rig").value === "five");
        await check(page, 5, 1, 5);
        await page.locator("#hw-open-json").setInputFiles({
          name: "ambiguous.json",
          mimeType: "application/json",
          buffer: Buffer.from(
            json.toString().replace('"weight": 1200', '"weight": 1200, "weight": 800'),
          ),
        });
        await page.waitForFunction(() =>
          document.querySelector("#hw-save-status").textContent.includes("Repeated JSON"),
        );
        await check(page, 5, 1, 5);
        assert.equal(await page.locator("#hw-weight").inputValue(), "1200");
        await page.locator("#hw-share").click();
        const link = await page.locator("#hw-share-url").inputValue(),
          tab = await context.newPage();
        await tab.goto(link);
        await check(tab, 5, 1, 5);
        await tab.close();
        let notes = 0;
        for (let i = 0; i < 7; i++) {
          await page.locator("#hw-passage").selectOption(String(i));
          const words = page.locator("[data-hw-word]");
          for (let j = 0; j < (await words.count()); j++) {
            await words.nth(j).focus();
            await page.keyboard.press("Enter");
            assert.equal(await words.nth(j).getAttribute("aria-pressed"), "true");
            assert((await page.locator("#hw-word-note").innerText()).length > 50);
            notes++;
          }
        }
        assert.equal(notes, 28);
        const manifest = JSON.parse(await readFile("public/sources/hoist/manifest.json", "utf8")),
          sources = [];
        for (let i = 0; i < 5; i++) {
          await page.locator("#hw-source").selectOption(String(i));
          await page.waitForFunction(
            () =>
              document.querySelector("#hw-source-image").complete &&
              document.querySelector("#hw-source-image").naturalWidth > 0,
          );
          const url = await page.locator("#hw-source-image").getAttribute("src"),
            response = await context.request.get(new URL(url, base).href),
            sha = hash(await response.body()),
            relative = new URL(url, base).pathname.replace(/^\/gonia\//, "");
          assert.equal(sha, manifest.assets[relative]);
          sources.push({ file: relative, sha256: sha });
        }
        await page.locator("#hw-zoom").fill("200");
        await page.locator("#hw-source-pan").focus();
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(250);
        assert(await page.locator("#hw-source-pan").evaluate((e) => e.scrollLeft > 0));
        await page.locator("#hw-zoom").fill("100");
        await page.locator("#hw-passage").selectOption("4");
        await page.locator("[data-hw-word]").nth(2).click();
        assert.match(await page.locator("#hw-word-note").innerText(), /Joc/);
        await page.locator("#hw-reading").screenshot({ path: path.join(folder, "greek.png") });
        const axe = await new AxeBuilder({ page }).analyze();
        assert.deepEqual(axe.violations, []);
        await download(page, "#hw-save-svg", path.join(folder, "diagram.svg"));
        await download(page, "#hw-save-csv", path.join(folder, "measurements.csv"));
        const readingPending = page.waitForEvent("download");
        await page.locator("#hw-save-reading").click();
        await page.locator("#hw-rig").selectOption("single");
        await page.locator("#hw-weight").selectOption("100");
        const reading = await readingPending;
        await reading.saveAs(path.join(folder, "reading.html"));
        const html = await readFile(path.join(folder, "reading.html"), "utf8");
        assert(!/<script\b|\son\w+=/i.test(html));
        assert.match(html, /weight 1,200 N; arm\/drum ratio 4/);
        assert.match(html, /Pentaspaston/);
        const portable = await browser.newContext({ viewport: { width, height: 1000 } }),
          local = await portable.newPage(),
          remote = [];
        local.on("request", (r) => {
          if (/^https?:/.test(r.url())) remote.push(r.url());
        });
        await local.goto(pathToFileURL(path.join(folder, "reading.html")).href);
        await local.evaluate(() => document.fonts.ready);
        assert.equal(await local.locator(".printed img").count(), 5);
        assert(
          await local
            .locator(".printed img")
            .evaluateAll((imgs) => imgs.every((i) => i.complete && i.naturalWidth > 0)),
        );
        assert.deepEqual(remote, []);
        assert(await local.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        const embedded = await local
          .locator(".printed img")
          .evaluateAll((imgs) => imgs.map((i) => i.src.split(",")[1]));
        for (let i = 0; i < embedded.length; i++)
          assert.equal(hash(Buffer.from(embedded[i], "base64")), sources[i].sha256);
        const jsonHref = await local
          .getByRole("link", { name: "Save editable experiment" })
          .getAttribute("href");
        assert.deepEqual(
          JSON.parse(decodeURIComponent(jsonHref.split(",")[1])).state,
          JSON.parse(json).state,
        );
        if (name === "chromium" && width === 1440) {
          await local.pdf({
            path: path.join(folder, "reading.pdf"),
            format: "A4",
            printBackground: true,
          });
          await local.screenshot({ path: path.join(folder, "reading.png"), fullPage: true });
        }
        await portable.close();
        if (!dev) {
          server.offline();
          await context.setOffline(true);
          for (const room of [
            "",
            "spacing.html",
            "entasis.html",
            "fluting.html",
            "transport.html",
            "colonnade.html",
            "theatre.html",
            "echea.html",
            "hoist.html",
          ]) {
            await page.goto(base + room);
            await page.waitForFunction(() =>
              [...document.querySelectorAll('[role="status"]')].some(
                (e) => e.textContent === "Workshop & source saved offline",
              ),
            );
          }
          await page.locator("#hw-rig").selectOption("three");
          await page.locator("#hw-anchor").selectOption("fixed");
          await check(page, 2, 1, 2);
          await download(page, "#hw-save-reading", path.join(folder, "offline-reading.html"));
        }
        assert.deepEqual(errors, []);
        report.configurations.push({
          browser: name,
          version: browser.version(),
          width,
          operations:
            "five routes, same-rise and same-rope controls, windlass force/work, keyboard sliders and panning, strict native JSON, second-tab share, 7 readings and 28 word notes, five hashed full pages, native SVG/CSV and click-time portable HTML",
          sourceFiles: sources,
          axeViolations: 0,
          originDisabled: !dev && !external,
          browserOffline: !dev,
          portableRemoteRequests: remote.length,
        });
        console.log(
          `${name} ${width}: rope routes, force/travel/work, Greek/Latin, native files and ${dev ? "development preview" : "nine-room offline edition"} passed`,
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
