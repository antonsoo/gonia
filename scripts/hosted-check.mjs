// biome-ignore-all lint/performance/useDomNodeTextContent: Verify actual public-page behavior.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { chromium, firefox } from "playwright";

const base = process.argv[2] ?? "https://antonsoo.github.io/gonia/";
const output = process.argv[3] ?? "docs/hosted-review.json";
const reference = await readFile(new URL("../examples/widened-metope.html", import.meta.url));
const report = { url: base, checkedAt: new Date().toISOString(), configurations: [] };
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await engine.launch();
  try {
    for (const width of [1440, 375]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      const response = await page.goto(`${base}?b=2.40&t=contract#workshop`);
      assert.equal(response.status(), 200);
      await page.waitForFunction(
        () => document.querySelector("#offline").textContent === "Workshop & source saved offline",
      );
      assert.equal(await page.locator("#bay-value").innerText(), "4.3 T");
      assert.equal(await page.locator("#offset-value").innerText(), "0.7 T off-axis");
      const box = await page.locator("#workshop-title").boundingBox();
      assert.ok(box.y >= -1 && box.y < 200);
      await page.locator("#beam").focus();
      await page.keyboard.press("Home");
      assert.equal(await page.locator("#comparison-body td.changed").count(), 0);
      await page.selectOption("#term", "beam");
      assert.equal(await page.locator(".word-greek").innerText(), "ἐπιστύλιον");
      await page.locator('[data-treatment="widen"]').click();
      assert.equal(await page.locator("#metope-value").innerText(), "2 T");
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.locator("#save").click(),
      ]);
      const stream = await download.createReadStream();
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      const bytes = Buffer.concat(chunks);
      assert.deepEqual(bytes, reference);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      assert.deepEqual(errors, []);
      report.configurations.push({
        browser: name,
        version: browser.version(),
        width,
        sharedLandingTop: box.y,
        nativeKeyboard: true,
        vocabulary: true,
        sourceToModel: true,
        savedStudyMatchesReviewedExample: true,
        savedStudySha256: createHash("sha256").update(bytes).digest("hex"),
        pageErrors: errors,
      });
      await context.close();
    }
  } finally {
    await browser.close();
  }
}
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Verified ${report.configurations.length} hosted workflows and exact saved studies.`);
