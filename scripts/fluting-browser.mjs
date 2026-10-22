// biome-ignore-all lint/performance/useDomNodeTextContent: Inspect visible learning outcomes.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const directory = path.resolve(process.argv[2] ?? "/tmp/gonia-fluting-review");
await mkdir(directory, { recursive: true });
const hosted = process.argv[3];
let available = true,
  substitute = false,
  gate = null;
const server = http.createServer(async (req, res) => {
  if (!available) {
    req.socket.destroy();
    return;
  }
  const url = new URL(req.url, "http://local");
  const file = decodeURIComponent(url.pathname).replace(/^\/gonia\//, "") || "index.html";
  if (!url.pathname.startsWith("/gonia/") || file.includes("..")) {
    res.writeHead(404).end();
    return;
  }
  if (gate && file === "sources/fluting/krohn-085.jpg") await gate;
  try {
    const bytes = await readFile(
      path.join(
        "dist",
        substitute && file === "sources/fluting/krohn-085.jpg"
          ? "sources/fluting/bywater-205.jpg"
          : file,
      ),
    );
    res
      .writeHead(200, {
        "Content-Type":
          {
            ".html": "text/html",
            ".js": "text/javascript",
            ".css": "text/css",
            ".jpg": "image/jpeg",
            ".svg": "image/svg+xml",
            ".ttf": "font/ttf",
            ".woff2": "font/woff2",
          }[path.extname(file)] ?? "application/octet-stream",
        "Cache-Control": "no-store",
      })
      .end(bytes);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = hosted ?? `http://127.0.0.1:${server.address().port}/gonia/`;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const names = [
  "krohn-085.jpg",
  "krohn-074.jpg",
  "bywater-205.jpg",
  "heiberg-240.jpg",
  "heiberg-241.jpg",
];
const expected = await Promise.all(
  names.map(async (f) => hash(await readFile(`public/sources/fluting/${f}`))),
);
const report = {
  checkedAt: new Date().toISOString(),
  base: hosted ?? "local production build",
  configurations: [],
  geometry: [],
  files: [],
  adversarial: [],
};
const until = (page, id, text) =>
  page.waitForFunction(
    ({ id, text }) => document.getElementById(id)?.textContent.includes(text),
    { id, text },
    { timeout: 45000 },
  );
async function snapshot(page) {
  return page.evaluate(() => {
    const q = new URLSearchParams(location.search);
    return {
      recipe: q.get("recipe"),
      width: Number(q.get("width")),
      fillet: Number(q.get("fillet")),
      point: Number(q.get("point")),
      gauge: q.get("gauge") === "1",
      compare: q.get("compare") === "1",
    };
  });
}
async function geometry(page) {
  return page.evaluate(() => {
    const q = new URLSearchParams(location.search);
    const svg = document.querySelector("#flute-profile");
    const matrix = svg.getScreenCTM();
    if (Math.abs(matrix.a - matrix.d) > 1e-8) throw new Error("Unequal profile scales");
    const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
    if (new Set(ids).size !== ids.length) throw new Error("Duplicate IDs");
    const point = document.querySelector("#gauge-point");
    return {
      state: {
        recipe: q.get("recipe"),
        width: Number(q.get("width")),
        fillet: Number(q.get("fillet")),
        point: Number(q.get("point")),
        gauge: q.get("gauge") === "1",
        compare: q.get("compare") === "1",
      },
      point: point ? [Number(point.getAttribute("cx")), Number(point.getAttribute("cy"))] : null,
      sectionPath: document.querySelector("#drum-outline").getAttribute("d"),
      depth: parseFloat(document.querySelector("#cut-depth").textContent),
      angle: parseFloat(document.querySelector("#edge-angle").textContent),
      miss: parseFloat(document.querySelector("#gauge-miss").textContent),
    };
  });
}
async function save(page, kind, id) {
  const state = await snapshot(page);
  const [dl] = await Promise.all([
    page.waitForEvent("download"),
    page.locator(`#save-${kind}`).click(),
  ]);
  const file = path.join(
    directory,
    `${id}-${state.recipe}-${state.width}mm-${dl.suggestedFilename()}`,
  );
  await dl.saveAs(file);
  const bytes = await readFile(file);
  report.files.push({ kind, state, path: file, bytes: bytes.length, sha256: hash(bytes) });
  return file;
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
        const id = `${engineName}-${width}`;
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          acceptDownloads: true,
        });
        const page = await context.newPage();
        const errors = [],
          external = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("request", (r) => {
          if (
            !r.url().startsWith(base) &&
            !r.url().startsWith("blob:") &&
            !r.url().startsWith("data:") &&
            !r.url().startsWith("file:")
          )
            external.push(r.url());
        });
        await page.goto(`${base}fluting.html#fluting-workshop`);
        await page.evaluate(() => document.fonts.ready);
        await until(page, "fluting-offline", "saved offline");
        assert.equal(await page.locator("#cut-depth").innerText(), "20.71 mm");
        assert.equal(await page.locator("#edge-angle").innerText(), "135°");
        assert.equal(await page.locator("#gauge-miss").innerText(), "41.42 mm");
        report.geometry.push(await geometry(page));
        await page.locator("#point").focus();
        await page.keyboard.press("End");
        assert.equal(await page.locator("#point").inputValue(), "95");
        report.geometry.push(await geometry(page));
        await page.keyboard.press("Home");
        report.geometry.push(await geometry(page));
        await page.keyboard.press("ArrowRight");
        assert.equal(await page.locator("#point").inputValue(), "6");
        // Drag the visible point; keyboard and pointer operate the same state.
        await page.locator("#point").fill("50");
        await page.locator("#point").dispatchEvent("change");
        await page.locator("#gauge-point").scrollIntoViewIfNeeded();
        const p = await page.locator("#gauge-point").boundingBox();
        const target = await page.locator("#flute-profile").evaluate((svg) => {
          const p = new DOMPoint(82, 10).matrixTransform(svg.getScreenCTM());
          return { x: p.x, y: p.y };
        });
        await page.mouse.move(p.x + p.width / 2, p.y + p.height / 2);
        await page.mouse.down();
        await page.mouse.move(target.x, target.y, { steps: 8 });
        await page.mouse.up();
        assert(Number(await page.locator("#point").inputValue()) > 70);
        report.geometry.push(await geometry(page));
        await page.locator("#compare").check();
        assert.equal(await page.locator(".other-profile").count(), 1);
        await page.locator("#gauge").uncheck();
        assert.equal(await page.locator("#norma").count(), 0);
        await page.locator("#gauge").check();
        await page.locator("#recipe").selectOption("ionic");
        assert.equal(await page.locator("#edge-angle").innerText(), "90°");
        assert.equal(await page.locator("#gauge-miss").innerText(), "0.00 mm");
        await page.locator("#fillet").focus();
        await page.keyboard.press("End");
        report.geometry.push(await geometry(page));
        await page.locator("#width").focus();
        await page.keyboard.press("End");
        assert.equal(await page.locator("#cut-depth").innerText(), "60.00 mm");
        report.geometry.push(await geometry(page));
        await page.goBack();
        assert.equal(await page.locator("#width").inputValue(), "100");
        await page.goForward();
        assert.equal(await page.locator("#width").inputValue(), "120");
        const ionic = await save(page, "template", id);
        await save(page, "csv", id);
        await page.screenshot({ path: path.join(directory, `${id}-ionic.png`), fullPage: true });
        await page.locator("#recipe").selectOption("flat");
        assert(await page.locator("#point").isDisabled());
        assert.equal(await page.locator("#edge-angle").innerText(), "—");
        report.geometry.push(await geometry(page));
        await save(page, "template", id);
        await save(page, "csv", id);
        await page.locator("#reset").click();
        await save(page, "template", id);
        const csvFile = await save(page, "csv", id);
        const reading = await save(page, "reading", id);
        const text = await readFile(reading, "utf8");
        assert.deepEqual(
          [...text.matchAll(/data:image\/jpeg;base64,([^"\s]+)/g)].map((m) =>
            hash(Buffer.from(m[1], "base64")),
          ),
          expected,
        );
        assert(!text.includes("<script"));
        for (let i = 0; i < 5; i++) {
          await page.locator(`[data-page="${i}"]`).click();
          await page.locator("#source-window img").evaluate((img) => img.decode());
          assert.equal(
            await page.locator("#source-window img").evaluate((img) => img.naturalHeight),
            2200,
          );
        }
        await page.locator("#source-zoom").click();
        assert.equal(await page.locator("#source-zoom").getAttribute("aria-pressed"), "true");
        await page.locator("#source-window").evaluate((el) => {
          el.scrollTop = el.scrollHeight;
          el.scrollLeft = 200;
        });
        assert((await page.locator("#source-window").evaluate((el) => el.scrollTop)) > 0);
        await page.locator('[data-source="0"]').click();
        assert.equal(await page.locator('[data-page="0"]').getAttribute("aria-pressed"), "true");
        await page
          .locator("#fluting-workshop")
          .evaluate((el) => el.scrollIntoView({ block: "start" }));
        await page.screenshot({
          path: path.join(directory, `${id}-workshop.png`),
          fullPage: false,
        });
        await page
          .locator("#greek-fluting")
          .evaluate((el) => el.scrollIntoView({ block: "start" }));
        await page.screenshot({ path: path.join(directory, `${id}-greek.png`), fullPage: false });
        const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
        assert.deepEqual(
          axe.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          [],
        );
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        assert.deepEqual(errors, []);
        assert.deepEqual(external, []);
        await context.setOffline(true);
        if (!hosted) available = false;
        await page.reload();
        for (const [room, selector] of [
          ["./", "#workshop"],
          ["spacing.html", "#spacing-workshop"],
          ["entasis.html", "#entasis-workshop"],
          ["fluting.html", "#fluting-workshop"],
        ]) {
          await page.goto(`${base}${room}`);
          await page.locator(selector).waitFor();
          await page.locator('nav a[href="./fluting.html"]').count();
        }
        // Real native file, disconnected from the web server, with real downloads inside it.
        const native = await browser.newContext({
          viewport: { width, height: 1000 },
          acceptDownloads: true,
        });
        await native.setOffline(true);
        const saved = await native.newPage();
        const network = [];
        saved.on("request", (r) => {
          if (/^https?:/.test(r.url())) network.push(r.url());
        });
        await saved.goto(pathToFileURL(reading).href);
        await saved.evaluate(() => document.fonts.ready);
        await saved
          .locator(".printed-pages img")
          .evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
        assert.equal(await saved.locator(".printed-pages img").count(), 5);
        await saved.locator('a[href="#printed-2"]').click();
        assert.match(saved.url(), /#printed-2$/);
        const [csv] = await Promise.all([
          saved.waitForEvent("download"),
          saved.locator('a[download="gonia-fluting.csv"]').click(),
        ]);
        const nativeCsv = path.join(directory, `${id}-native.csv`);
        await csv.saveAs(nativeCsv);
        assert.deepEqual(await readFile(nativeCsv), await readFile(csvFile));
        assert.deepEqual(network, []);
        if (engineName === "chromium" && width === 1440) {
          await saved.pdf({
            path: path.join(directory, "reading.pdf"),
            preferCSSPageSize: true,
            printBackground: true,
          });
          const print = await native.newPage();
          await print.setContent(
            `<style>@page{size:190mm 277mm;margin:0}body{margin:0}svg{display:block}</style>${await readFile(ionic, "utf8")}`,
          );
          await print.pdf({ path: path.join(directory, "template.pdf"), preferCSSPageSize: true });
        }
        await native.close();
        report.configurations.push({
          engine: engineName,
          width,
          keyboard: true,
          drag: true,
          history: true,
          sourcePages: 5,
          offlineRooms: 4,
          nativeReading: true,
          embeddedCsvEqual: true,
          axeViolations: 0,
          documentOverflow: false,
          pageErrors: errors,
        });
        await context.close();
        available = true;
      }
      if (!hosted) {
        // Substituted HTTP-200 source bytes must prevent a misleading portable reading.
        substitute = true;
        const context = await browser.newContext({
          serviceWorkers: "block",
          acceptDownloads: true,
        });
        const page = await context.newPage();
        await page.goto(`${base}fluting.html`);
        await page.locator("#save-reading").click();
        await until(page, "action-status", "differs from this edition");
        substitute = false;
        await save(page, "reading", `${engineName}-recovered`);
        await context.close();
        const malformed = await browser.newPage();
        await malformed.goto(`${base}fluting.html?width=120&width=50&recipe=ionic`);
        assert.equal(await malformed.locator("#width").inputValue(), "100");
        assert.equal(await malformed.locator("#recipe").inputValue(), "doric");
        await until(malformed, "fluting-warning", "complete view has been reset");
        await malformed.close();
        // Snapshot before the first source read completes; subsequent controls must not alter it.
        const slow = await browser.newContext({ serviceWorkers: "block", acceptDownloads: true });
        const tab = await slow.newPage();
        await tab.goto(`${base}fluting.html`);
        let release;
        gate = new Promise((r) => {
          release = r;
        });
        const pending = tab.waitForEvent("download");
        await tab.locator("#save-reading").click();
        await tab.locator("#recipe").selectOption("ionic");
        await tab.locator("#width").fill("120");
        await tab.locator("#width").dispatchEvent("change");
        release();
        gate = null;
        const dl = await pending;
        const file = path.join(directory, `${engineName}-snapshot.html`);
        await dl.saveAs(file);
        assert((await readFile(file, "utf8")).includes("Chosen groove width 100 mm."));
        await slow.close();
        report.adversarial.push({
          engine: engineName,
          substituted200SourceRejected: true,
          recovery: true,
          duplicateSettingsResetWholeState: true,
          exportSnapshotHeld: true,
        });
      }
    } finally {
      await browser.close();
    }
  }
  await writeFile(path.join(directory, "browser.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    JSON.stringify({
      status: "passed",
      configurations: report.configurations.length,
      views: report.geometry.length,
      exports: report.files.length,
      output: path.join(directory, "browser.json"),
    }),
  );
} finally {
  server.closeAllConnections();
  server.close();
}
