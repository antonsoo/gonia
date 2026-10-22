// biome-ignore-all lint/performance/useDomNodeTextContent: Observe visible source-language and calculation text.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:4328/gonia/",
  out = path.resolve(process.argv[3] ?? "/tmp/gonia-segments-review");
await mkdir(out, { recursive: true });
let reachable = false;
for (let attempt = 0; attempt < 100 && !reachable; attempt++) {
  try {
    reachable = (await fetch(new URL("fluting.html", base), { signal: AbortSignal.timeout(2000) }))
      .ok;
  } catch {}
  if (!reachable) await new Promise((r) => setTimeout(r, 100));
}
assert(reachable, "The preview server did not become reachable.");
const report = {
  checkedAt: new Date().toISOString(),
  base,
  configurations: [],
  views: [],
  csv: [],
};
async function state(page) {
  return page.evaluate(() => {
    const p = new URLSearchParams(location.search);
    return {
      recipe: p.get("recipe"),
      width: Number(p.get("width")),
      point: Number(p.get("point")),
      fillet: Number(p.get("fillet")),
      gauge: p.get("gauge") === "1",
      compare: p.get("compare") === "1",
    };
  });
}
async function capture(page) {
  const s = await state(page);
  const view = await page.evaluate(() => {
    const svgs = [...document.querySelectorAll(".segment-figures svg")];
    for (const svg of svgs) {
      const m = svg.getScreenCTM();
      if (Math.abs(m.a - m.d) > 1e-8) throw new Error("Unequal diagram scales");
      const box = svg.getBoundingClientRect();
      for (const text of svg.querySelectorAll("text")) {
        const r = text.getBoundingClientRect();
        if (
          r.left < box.left - 1 ||
          r.right > box.right + 1 ||
          r.top < box.top - 1 ||
          r.bottom > box.bottom + 1
        )
          throw new Error(`Clipped segment label: ${text.textContent}`);
      }
    }
    return {
      svg: svgs.map((s) => s.outerHTML),
      baseAngles: [...document.querySelectorAll(".segment-equations strong")].map((el) =>
        parseFloat(el.textContent),
      ),
    };
  });
  assert.equal(view.svg.length, 2);
  report.views.push({ state: s, ...view });
}
async function download(page, selector, file) {
  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator(selector).click()]);
  await dl.saveAs(file);
  return file;
}
for (const [name, engine] of Object.entries({ chromium, firefox })) {
  const browser = await engine.launch();
  try {
    for (const width of [1440, 375]) {
      const id = `${name}-${width}`,
        context = await browser.newContext({
          viewport: { width, height: 1100 },
          acceptDownloads: true,
        });
      if (name === "chromium")
        await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      const page = await context.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`${base}fluting.html#segment-study`);
      await page.evaluate(() => document.fonts.ready);
      for (const recipe of ["doric", "ionic"]) {
        await page.locator(`[data-segment-recipe="${recipe}"]`).click();
        for (const point of [5, 17, 50, 83, 95]) {
          await page.locator("#segment-point").fill(String(point));
          await page.locator("#segment-point").dispatchEvent("change");
          assert.equal(await page.locator("#point").inputValue(), String(point));
          await capture(page);
        }
      }
      await page.locator("#segment-point").focus();
      await page.keyboard.press("Home");
      assert.equal(await page.locator("#point").inputValue(), "5");
      await page.keyboard.press("End");
      assert.equal(await page.locator("#point").inputValue(), "95");
      await page.locator("#width").focus();
      await page.keyboard.press("End");
      assert.equal(await page.locator("#width").inputValue(), "120");
      await capture(page);
      await page.goBack();
      assert.equal(await page.locator("#width").inputValue(), "100");
      await page.goForward();
      assert.equal(await page.locator("#width").inputValue(), "120");
      let csv = await download(page, "#save-segments", path.join(out, `${id}-120mm.csv`));
      report.csv.push({ path: csv, width: 120 });
      await page.locator("#share-segment").click();
      if (name === "chromium") {
        const copied = await page.evaluate(() => navigator.clipboard.readText());
        assert.match(copied, /#segment-study$/);
        assert.equal(new URL(copied).searchParams.get("width"), "120");
      }
      // Exercise the copyable link fallback after a real clipboard rejection.
      await page.evaluate(() =>
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async () => {
              throw new Error("Clipboard denied for review");
            },
          },
        }),
      );
      await page.locator("#share-segment").click();
      const link = await page.locator("#segment-status a").getAttribute("href");
      assert.match(link, /#segment-study$/);
      await page.goto(link);
      assert.equal(await page.locator("#width").inputValue(), "120");
      assert.equal(await page.locator("#segment-point").inputValue(), "95");
      await page.locator("#recipe").selectOption("flat");
      assert.equal(await page.locator(".segment-figures svg").count(), 0);
      assert(await page.locator("#segment-point").isDisabled());
      await page.locator('[data-segment-recipe="doric"]').click();
      assert.equal(await page.locator("#recipe").inputValue(), "doric");
      assert.equal(await page.locator(".segment-figures svg").count(), 2);
      await page.locator("#reset").click();
      await page.locator("#segment-study").evaluate((el) => el.scrollIntoView({ block: "start" }));
      await page.screenshot({ path: path.join(out, `${id}-circles.png`) });
      await page
        .locator(".segment-reading")
        .evaluate((el) => el.scrollIntoView({ block: "start" }));
      await page.screenshot({ path: path.join(out, `${id}-reading.png`) });
      csv = await download(page, "#save-segments", path.join(out, `${id}-100mm.csv`));
      report.csv.push({ path: csv, width: 100 });
      const reading = await download(page, "#save-reading", path.join(out, `${id}-reading.html`));
      assert((await readFile(reading)).length < 5_000_000);
      for (const index of [3, 4]) {
        await page.locator(`[data-source="${index}"]`).click();
        await page.locator("#source-window img").evaluate((i) => i.decode());
        assert.match(
          await page.locator("#source-window img").getAttribute("src"),
          new RegExp(`heiberg-${index === 3 ? 240 : 241}`),
        );
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      assert.deepEqual(
        axe.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
        [],
      );
      await page.locator("#fluting-offline").filter({ hasText: "saved offline" }).waitFor();
      await context.setOffline(true);
      await page.reload();
      await page.locator('[data-segment-recipe="ionic"]').click();
      await page.locator("#segment-point").focus();
      await page.keyboard.press("Home");
      await capture(page);
      await page.locator('[data-source="4"]').click();
      await page.locator("#source-window img").evaluate((i) => i.decode());
      const native = await browser.newContext({
        viewport: { width, height: 1100 },
        acceptDownloads: true,
      });
      await native.setOffline(true);
      const saved = await native.newPage(),
        external = [];
      saved.on("request", (r) => {
        if (/^https?:/.test(r.url())) external.push(r.url());
      });
      await saved.goto(pathToFileURL(reading).href);
      await saved.evaluate(() => document.fonts.ready);
      await saved
        .locator(".printed-pages img")
        .evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
      assert.equal(await saved.locator(".printed-pages img").count(), 5);
      assert.equal(
        await saved.locator("#segment-q-title").textContent(),
        "Q makes 45 degrees in the larger segment",
      );
      const embedded = await download(
        saved,
        'a[download="gonia-segment-angles.csv"]',
        path.join(out, `${id}-embedded.csv`),
      );
      assert.deepEqual(await readFile(embedded), await readFile(csv));
      await saved.locator('a[href="#printed-4"]').click();
      assert.match(saved.url(), /#printed-4$/);
      assert.deepEqual(external, []);
      if (name === "chromium" && width === 1440)
        await saved.pdf({
          path: path.join(out, "segment-reading.pdf"),
          preferCSSPageSize: true,
          printBackground: true,
        });
      await native.close();
      assert.deepEqual(errors, []);
      report.configurations.push({
        engine: name,
        version: browser.version(),
        width,
        keyboard: true,
        linkedControls: true,
        browserHistory: true,
        clipboardReadBack: name === "chromium",
        copyFallbackReopened: true,
        flatDoesNotInventCircle: true,
        heibergPagesDecoded: 2,
        sourcePagesEmbedded: 5,
        nativeEmbeddedCsvIdentical: true,
        offlineComparison: true,
        axeViolations: 0,
        pageErrors: errors,
      });
      await context.close();
    }
  } finally {
    await browser.close();
  }
}
await writeFile(path.join(out, "browser.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(
  `Segment workflows passed: ${report.configurations.length}; actual SVG views: ${report.views.length}`,
);
