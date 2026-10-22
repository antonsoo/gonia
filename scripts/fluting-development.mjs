// biome-ignore-all lint/performance/useDomNodeTextContent: Check visible development behavior.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { chromium, firefox } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:4329/gonia/",
  output = process.argv[3] ?? "/tmp/gonia-fluting-development.json",
  rows = [];
for (const [name, engine] of Object.entries({ chromium, firefox })) {
  const browser = await engine.launch();
  try {
    for (const width of [1440, 375]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } }),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await page.goto(`${base}fluting.html`);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator("#fluting-offline").innerText(), "Development preview");
      assert.equal(await page.locator("#cut-depth").innerText(), "20.71 mm");
      const styles = await page.evaluate(() => ({
        body: getComputedStyle(document.body).fontFamily,
        plates: getComputedStyle(document.querySelector(".fluting-plates")).display,
        hatch: getComputedStyle(document.querySelector(".cut")).stroke,
        overflow: document.documentElement.scrollWidth > innerWidth,
      }));
      assert(styles.body.startsWith("Plex"));
      assert.equal(styles.plates, "grid");
      assert.equal(styles.hatch, "rgb(64, 90, 67)");
      assert(!styles.overflow);
      await page.locator("#recipe").selectOption("ionic");
      assert.equal(await page.locator("#cut-depth").innerText(), "50.00 mm");
      const [dl] = await Promise.all([
        page.waitForEvent("download"),
        page.locator("#save-template").click(),
      ]);
      assert.match(dl.suggestedFilename(), /ionic-100mm/);
      assert.deepEqual(errors, []);
      rows.push({
        engine: name,
        version: browser.version(),
        width,
        styles,
        ionicGauge: true,
        actualSvgDownload: true,
        pageErrors: errors,
      });
      await page.close();
    }
  } finally {
    await browser.close();
  }
}
await writeFile(
  output,
  `${JSON.stringify({ checkedAt: new Date().toISOString(), base, configurations: rows }, null, 2)}\n`,
);
console.log(`Development workflows passed: ${rows.length}`);
