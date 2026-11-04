import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:4328/gonia/";
const out = path.resolve(process.argv[3] ?? "/tmp/claude-1000/gonia-friction-review");
await mkdir(out, { recursive: true });
const receipt = [];
const hash = (b) => createHash("sha256").update(b).digest("hex");
async function download(page, selector, target) {
  const job = page.waitForEvent("download");
  await page.locator(selector).click();
  const file = await job;
  await file.saveAs(target);
  return readFile(target);
}
async function input(page, id, value) {
  await page.locator(`#${id}`).evaluate((node, v) => {
    node.value = String(v);
    node.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}
for (const [engine, driver] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await driver.launch();
  try {
    for (const width of [1440, 375]) {
      const dir = path.join(out, `${engine}-${width}`);
      await mkdir(dir, { recursive: true });
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        acceptDownloads: true,
      });
      const page = await context.newPage(),
        errors = [],
        outside = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      page.on("request", (r) => {
        if (/^https?:/.test(r.url()) && new URL(r.url()).origin !== new URL(base).origin)
          outside.push(r.url());
      });
      await page.goto(base);
      await page.getByRole("link", { name: "Arch and pier", exact: true }).focus();
      await page.keyboard.press("Enter");
      await page
        .getByRole("link", { name: "Can another path need less friction?", exact: true })
        .focus();
      await page.keyboard.press("Enter");
      assert.equal(new URL(page.url()).hash, "#ar-threshold");
      assert.match(
        await page.locator("#ar-threshold-results").textContent(),
        /No contact path exists/,
      );
      await page.locator("#ar-threshold-example").focus();
      await page.keyboard.press("Enter");
      const table = page.locator("#ar-threshold-results");
      assert.equal(await table.locator("tbody tr").count(), 2);
      const searchText = await table.textContent();
      assert.match(searchText, /0\.035843849182128906/);
      assert.match(searchText, /0\.42659950256347656/);
      for (const index of [0, 1]) {
        const feasible = page.locator(`[data-friction-witness="${index}"]`);
        await feasible.focus();
        await page.keyboard.press("Enter");
        const value = Number(await page.locator("#ar-friction").inputValue());
        assert.ok(index ? value > 0.4265 && value < 0.427 : value > 0.0358 && value < 0.036);
        assert.match(await page.locator("#ar-threshold-status").textContent(), /Using μ/);
        assert.match(
          await page.locator("#ar-friction-summary").textContent(),
          /fits at all fourteen joints/,
        );
        if (index)
          assert.match(
            await page.locator("#ar-verdict").textContent(),
            /meets the contact and friction/,
          );
        else
          assert.match(
            await page.locator("#ar-friction-summary").textContent(),
            /Base friction is exceeded/,
          );
        const thrust = await page.locator("#ar-thrust").inputValue();
        await page.locator(`[data-friction-fail="${index}"]`).click();
        assert.equal(await page.locator("#ar-thrust").inputValue(), thrust);
        assert.match(await page.locator("#ar-threshold-status").textContent(), /No path meets/);
        assert.match(
          await page.locator(index ? "#ar-whole-domain" : "#ar-domain").textContent(),
          /no joint-and-base|No H/,
        );
        assert.equal(await table.textContent(), searchText);
      }
      await page.locator('[data-friction-witness="1"]').click();
      await page.locator("#ar-joint").selectOption("12");
      await page.locator("#ar-page").selectOption("2");
      await page.locator('[data-friction-witness="0"]').click();
      assert.equal(await page.locator("#ar-joint").inputValue(), "12");
      assert.equal(await page.locator("#ar-page").inputValue(), "2");
      assert.equal(await table.textContent(), searchText);
      await input(page, "ar-mass", 100);
      assert.notEqual(await table.textContent(), searchText);
      assert.match(await table.locator("tbody tr").first().textContent(), /0\.035843849182128906/);
      await page.locator("#ar-threshold-example").click();
      await page.locator('[data-friction-witness="1"]').click();
      await page.locator(".ar-width-question summary").click();
      await page.locator("#ar-threshold-narrow").click();
      const narrowH = await page.locator("#ar-thrust").inputValue();
      const narrowFriction = await page.locator("#ar-friction").inputValue();
      const fixedRequirement = await page.locator("#ar-friction-summary").textContent();
      assert.match(await table.textContent(), /0\.2967395782470703/);
      await page.locator("#ar-threshold-widen").click();
      assert.equal(await page.locator("#ar-thrust").inputValue(), narrowH);
      assert.equal(await page.locator("#ar-friction").inputValue(), narrowFriction);
      assert.equal(await page.locator("#ar-friction-summary").textContent(), fixedRequirement);
      assert.match(await table.textContent(), /0\.2473735809326172/);
      await page.locator(".ar-width-question summary").click();
      await page.locator("#ar-threshold-example").click();
      await page.locator('[data-friction-witness="1"]').click();
      const csv = await download(page, "#ar-threshold-csv", path.join(dir, "search.csv"));
      assert.match(csv.toString(), /"40","24","0","crown","140","25"/);
      assert.match(csv.toString(), /0\.42659950256347656/);
      const json = await download(page, "#ar-json", path.join(dir, "experiment.json"));
      const state = JSON.parse(json).state;
      assert.equal(state.friction, 0.42659950256347656);
      const htmlPath = path.join(dir, "reading.html");
      const html = await download(page, "#ar-html", htmlPath);
      assert.equal((html.toString().match(/<script\b/gi) ?? []).length, 0);
      const savedContext = await browser.newContext({
        viewport: { width, height: 1000 },
        acceptDownloads: true,
      });
      await savedContext.setOffline(true);
      const saved = await savedContext.newPage();
      const savedErrors = [];
      saved.on("pageerror", (e) => savedErrors.push(String(e)));
      await saved.goto(pathToFileURL(htmlPath).href);
      assert.match(
        await saved.locator(".ar-threshold-table").textContent(),
        /0\.42659950256347656/,
      );
      const embedded = await download(
        saved,
        'a[download="gonia-arch-friction.csv"]',
        path.join(dir, "embedded-search.csv"),
      );
      assert.deepEqual(embedded, csv);
      assert.equal(await saved.locator("img").count(), 3);
      await saved.waitForFunction(() =>
        [...document.images].every((img) => img.complete && img.naturalWidth > 0),
      );
      await saved
        .locator(".ar-threshold-table")
        .screenshot({ path: path.join(dir, "saved-search.png") });
      assert.deepEqual(savedErrors, []);
      await savedContext.close();
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      assert.deepEqual(axe.violations, []);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      );
      await page.locator("#ar-threshold").screenshot({ path: path.join(dir, "threshold.png") });
      if (width === 375) {
        await page.locator(".ar-search-scroll").focus();
        await page.keyboard.press("ArrowRight");
        await page.waitForFunction(
          () => document.querySelector(".ar-search-scroll").scrollLeft > 0,
        );
      }
      console.log(
        engine,
        width,
        "offline status:",
        await page.locator("#ar-offline").textContent(),
      );
      await page.waitForFunction(
        () =>
          document.getElementById("ar-offline").textContent === "Workshop & source saved offline",
        null,
        { timeout: 120000 },
      );
      await page.reload();
      await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
      await context.setOffline(true);
      await page.reload();
      await page.locator("#ar-threshold-example").click();
      await page.locator('[data-friction-witness="1"]').click();
      const offlineCsv = await download(
        page,
        "#ar-threshold-csv",
        path.join(dir, "offline-search.csv"),
      );
      assert.deepEqual(offlineCsv, csv);
      const offlineHtml = await download(page, "#ar-html", path.join(dir, "offline-reading.html"));
      assert.match(offlineHtml.toString(), /0\.42659950256347656/);
      assert.deepEqual(errors, []);
      assert.deepEqual(outside, []);
      receipt.push({
        engine,
        width,
        searchCsvSha256: hash(csv),
        readingBytes: html.length,
        standaloneReading: true,
        embeddedCsvMatches: true,
        offlineSearchAndExport: true,
        keyboardButtonsAndChart: true,
        noHorizontalPageOverflow: true,
        axeViolations: axe.violations.length,
        pageErrors: errors,
        externalRequests: outside,
      });
      await context.close();
    }
  } finally {
    await browser.close();
  }
}
await writeFile(path.join(out, "receipt.json"), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));
