// biome-ignore-all lint/performance/useDomNodeTextContent: Exercise visible native learning workflows.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const out = path.resolve(process.argv[2] ?? "/tmp/gonia-optics-browser"),
  external = process.argv[3],
  dev = process.argv.includes("--dev");
await mkdir(out, { recursive: true });
const hash = (b) => createHash("sha256").update(b).digest("hex"),
  manifest = JSON.parse(await readFile("public/sources/optics/manifest.json", "utf8"));
const report = {
  checkedAt: new Date().toISOString(),
  base: external ?? "origin-disabled local production",
  development: dev,
  worker: hash(await readFile("dist/sw.js")),
  configurations: [],
};
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".svg": "image/svg+xml",
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
      const u = new URL(req.url, "http://review"),
        file = decodeURIComponent(u.pathname).replace(/^\/gonia\//, "") || "index.html";
      if (!u.pathname.startsWith("/gonia/") || file.includes("..")) throw Error("path");
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
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return {
    base: `http://127.0.0.1:${server.address().port}/gonia/`,
    offline() {
      online = false;
      server.closeAllConnections();
    },
    close: () => new Promise((r) => server.close(r)),
  };
}
async function ready(p) {
  if (!dev)
    await p.waitForFunction(
      () => document.querySelector("#vp-offline").textContent === "Workshop & source saved offline",
      null,
      { timeout: 60000 },
    );
  await p.evaluate(() => document.fonts.ready);
}
async function save(p, id, file) {
  const download = p.waitForEvent("download");
  await p.locator(id).click();
  const item = await download;
  await item.saveAs(file);
  assert.equal(await item.failure(), null);
  return readFile(file);
}
async function geometry(p) {
  const result = await p.evaluate(() => {
    const d = Number(document.querySelector("#vp-distance").value) / 10,
      H = Number(document.querySelector("#vp-height").value) / 10,
      e = Number(document.querySelector("#vp-eye").value) / 10,
      L = Number(document.querySelector("#vp-length").value) / 10;
    const mode = document.querySelector("input[name=vp-mode]:checked").value,
      alpha =
        mode === "vertical"
          ? 0
          : mode === "source"
            ? Math.atan(1 / 12)
            : mode === "normal"
              ? Math.atan2(H - e, d)
              : (Number(document.querySelector("#vp-angle").value) * Math.PI) / 1800;
    const R = Math.hypot(d, H - e),
      points = [...document.querySelectorAll("#vp-scene [data-fraction]")],
      marks = [...document.querySelectorAll("#vp-projection [data-image-fraction]")];
    return points.map((c, i) => {
      const f = Number(c.dataset.fraction),
        x = d - f * L * Math.sin(alpha),
        z = H + f * L * Math.cos(alpha),
        t = (R * R) / (d * x + (H - e) * (z - e)),
        normal = (-(H - e) * (t * x - d) + d * (t * (z - e) - (H - e))) / (R * L),
        mark = marks[i];
      return {
        f,
        x,
        z,
        actualX: Number(c.dataset.worldX),
        actualZ: Number(c.dataset.worldZ),
        normal,
        actualNormal: Number(mark.dataset.imageCoordinate),
        renderedY: Number(mark.getAttribute("d").match(/M[\d.-]+ ([\d.eE+-]+)/)[1]),
        expectedY: 170 - 215 * normal,
      };
    });
  });
  for (const v of result) {
    assert(Math.abs(v.x - v.actualX) < 1e-10);
    assert(Math.abs(v.z - v.actualZ) < 1e-10);
    assert(Math.abs(v.normal - v.actualNormal) < 1e-10);
    assert(Math.abs(v.renderedY - v.expectedY) < 1e-8);
  }
  return result;
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
        await page.goto(`${base}optics.html`);
        await ready(page);
        assert.match(await page.locator("#vp-finding").innerText(), /upper ray is longer/);
        await geometry(page);
        await page.locator("#vp-find").focus();
        await page.keyboard.press("Enter");
        assert.equal(await page.locator("#vp-distance").inputValue(), "1248");
        assert.match(await page.locator("#vp-finding").innerText(), /equal lengths/);
        assert.match(await page.locator("#vp-spacing").innerText(), /half-length: 1\./);
        await geometry(page);
        await page.locator("#vp-distance").focus();
        await page.keyboard.press("ArrowRight");
        assert.equal(await page.locator("#vp-distance").inputValue(), "1249");
        assert(await page.locator("#vp-distance").evaluate((e) => e === document.activeElement));
        assert.match(await page.locator("#vp-finding").innerText(), /upper ray is shorter/);
        await page.goBack();
        assert.equal(await page.locator("#vp-distance").inputValue(), "1248");
        await page.goForward();
        assert.equal(await page.locator("#vp-distance").inputValue(), "1249");
        await page.locator("#vp-distance").fill("2500");
        assert.match(await page.locator("#vp-finding").innerText(), /upper ray is shorter/);
        await geometry(page);
        await page.locator("input[value=normal]").check();
        assert.match(await page.locator("#vp-finding").innerText(), /equal lengths/);
        await geometry(page);
        await page.locator("input[value=vertical]").check();
        assert.match(await page.locator("#vp-finding").innerText(), /upper ray is longer/);
        await page.locator("input[value=custom]").check();
        assert(await page.locator("#vp-angle").isEnabled());
        await page.locator("#vp-angle").fill("850");
        await geometry(page);
        await page.locator("#vp-height").fill("300");
        await page.locator("#vp-length").fill("60");
        await page.locator("#vp-eye").fill("25");
        await page.locator("#vp-distance").fill("50");
        await geometry(page);
        await page.goto(
          `${base}optics.html?d=300&h=120&e=16&l=40&a=48&mode=source&read=4#vp-workshop`,
        );
        await ready(page);
        await page.locator('a[href="#vp-reading"]').focus();
        await page.keyboard.press("Enter");
        assert.equal(await page.locator("#vp-reading-select").inputValue(), "4");
        assert.equal(await page.locator("#vp-distance").inputValue(), "300");
        let notes = 0,
          greek = 0;
        for (let i = 0; i < 6; i++) {
          await page.locator("#vp-reading-select").selectOption(String(i));
          const words = page.locator("[data-word]");
          assert.equal(await words.count(), 3);
          for (let j = 0; j < 3; j++) {
            await words.nth(j).focus();
            await page.keyboard.press("Enter");
            assert.equal(await words.nth(j).getAttribute("aria-pressed"), "true");
            assert(await words.nth(j).evaluate((e) => e === document.activeElement));
            assert((await page.locator("#vp-word-note").innerText()).length > 80);
            greek += await page.locator("#vp-word-note [lang=grc]").count();
            notes++;
          }
        }
        assert.equal(notes, 18);
        assert.equal(greek, 2);
        const scans = [];
        for (let i = 0; i < 4; i++) {
          await page.locator("#vp-source").selectOption(String(i));
          await page.waitForFunction(() => {
            const i = document.querySelector("#vp-source-image");
            return i.complete && i.naturalWidth > 0;
          });
          const src = await page.locator("#vp-source-image").getAttribute("src"),
            relative = new URL(src, base).pathname.replace(/^\/gonia\//, "");
          const bytes = await (await context.request.get(new URL(src, base).href)).body();
          assert.equal(hash(bytes), manifest.assets[relative]);
          scans.push(relative);
        }
        await page.locator("#vp-zoom").fill("200");
        await page.locator("#vp-source-pan").focus();
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(250);
        assert(await page.locator("#vp-source-pan").evaluate((e) => e.scrollLeft > 0));
        await page.locator("#vp-zoom").fill("100");
        await page.locator(".vp-object img").scrollIntoViewIfNeeded();
        await page.waitForFunction(() => {
          const i = document.querySelector(".vp-object img");
          return i.complete && i.naturalWidth === 3738;
        });
        await page.locator("#vp-reading-select").selectOption("4");
        await page.locator('[data-word="1"]').click();
        await page.locator("#vp-share").click();
        const link = await page.locator("#vp-share-url").inputValue(),
          tab = await context.newPage();
        await tab.goto(link);
        assert.equal(await tab.locator("#vp-reading-select").inputValue(), "4");
        assert.equal(await tab.locator("#vp-distance").inputValue(), "300");
        await tab.close();
        const svg = await save(page, "#vp-save-svg", path.join(folder, "viewpoint.svg"));
        assert.match(svg.toString(), /data-world-x/);
        const csv = await save(page, "#vp-save-csv", path.join(folder, "viewpoint.csv"));
        assert.equal(csv.toString().trim().split(/\r?\n/).length, 1590);
        const book = await save(page, "#vp-save-book", path.join(folder, "reading.html"));
        assert(!book.toString().includes("<script"));
        const fields = await page.evaluate(() => ({
          latin: document.querySelector("#vp-latin").textContent,
          english: document.querySelector("#vp-english").textContent,
        }));
        assert(book.toString().includes(fields.latin));
        const print = await context.newPage(),
          requests = [];
        print.on("request", (r) => {
          if (/^https?:/.test(r.url())) requests.push(r.url());
        });
        await print.goto(pathToFileURL(path.join(folder, "reading.html")).href);
        await print.evaluate(() => document.fonts.ready);
        await print.waitForFunction(() =>
          [...document.images].every((i) => i.complete && i.naturalWidth > 0),
        );
        assert.deepEqual(requests, []);
        assert.equal(await print.locator("img").count(), 5);
        const axebook = await new AxeBuilder({ page: print }).analyze();
        assert.deepEqual(axebook.violations, []);
        if (name === "chromium" && width === 1440) {
          await print.pdf({
            path: path.join(folder, "reading.pdf"),
            printBackground: true,
            preferCSSPageSize: true,
          });
          await print.screenshot({ path: path.join(folder, "reading.png"), fullPage: true });
        }
        await print.close();
        await page.locator("#vp-workshop").scrollIntoViewIfNeeded();
        const axe = await new AxeBuilder({ page }).analyze();
        assert.deepEqual(axe.violations, []);
        assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)));
        await page.screenshot({ path: path.join(folder, "workshop.png"), fullPage: true });
        if (!dev) {
          if (!external) server.offline();
          await context.setOffline(true);
          for (const room of [
            "index",
            "spacing",
            "entasis",
            "fluting",
            "transport",
            "colonnade",
            "theatre",
            "echea",
            "hoist",
            "optics",
          ]) {
            await page.goto(`${base}${room}.html`);
            assert((await page.locator("h1").innerText()).length > 5);
          }
          await ready(page);
          await page.locator("#vp-find").click();
          assert.match(await page.locator("#vp-finding").innerText(), /equal lengths/);
          const offlinebook = await save(
            page,
            "#vp-save-book",
            path.join(folder, "offline-reading.html"),
          );
          assert(offlinebook.length > 4000000);
          await context.setOffline(false);
        }
        assert.deepEqual(errors, []);
        report.configurations.push({
          browser: name,
          width,
          geometry: "DOM world points and actual projected mark paths",
          nativeControls: true,
          equalRaysAt1248: true,
          reversalAndHistory: true,
          readings: 6,
          wordNotes: notes,
          greekCompanions: greek,
          sourcePages: scans,
          museumImageDecoded: true,
          downloads: ["SVG", "1590-row CSV including header", "self-contained HTML"],
          scriptfreeBookImages: 5,
          automaticBookNetworkRequests: 0,
          axeViolations: 0,
          pageOverflow: false,
          offlineRooms: dev ? 0 : 10,
          offlineNewReading: !dev,
          errors,
        });
        console.log(
          `${name} ${width}: geometry, reversal, history, eighteen word notes, actual files, ten offline rooms`,
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
if (!external && !dev) {
  const server = await serve(),
    browser = await chromium.launch();
  try {
    const c = await browser.newContext({ serviceWorkers: "block" }),
      p = await c.newPage();
    await p.route("**/sources/optics/krohn-074.jpg", (route) =>
      route.fulfill({ status: 200, contentType: "image/jpeg", body: Buffer.from("wrong edition") }),
    );
    await p.goto(`${server.base}optics.html`);
    let downloads = 0;
    p.on("download", () => downloads++);
    await p.locator("#vp-save-book").click();
    await p.waitForFunction(() =>
      document.querySelector("#vp-save-status").textContent.includes("could not verify"),
    );
    assert.equal(downloads, 0);
    report.changedAssetRejected = true;
    await c.close();
  } finally {
    await browser.close();
    await server.close();
  }
}
await writeFile(path.join(out, "review.json"), `${JSON.stringify(report, null, 2)}\n`);
