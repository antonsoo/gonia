// biome-ignore-all lint/performance/useDomNodeTextContent: Check the visible published lesson.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, firefox } from "playwright";

const base = process.argv[2] ?? "https://antonsoo.github.io/gonia/";
const output = process.argv[3] ?? "/tmp/gonia-hosted-entasis/review.json";
await mkdir(path.dirname(output), { recursive: true });
const reviewed = await readFile("examples/entasis-circle-reading.html");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const files = [
  "penrose-039.jpg",
  "penrose-040.jpg",
  "penrose-041.jpg",
  "penrose-Taf_14.jpg",
  "krohn-068.jpg",
];
const expectedHashes = await Promise.all(
  files.map(async (file) => hash(await readFile(`public/sources/entasis/${file}`))),
);
const report = { checkedAt: new Date().toISOString(), base, configurations: [] };
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await engine.launch();
  try {
    for (const width of [1440, 375]) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        acceptDownloads: true,
      });
      const page = await context.newPage();
      const errors = [],
        external = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("request", (request) => {
        if (!request.url().startsWith(base) && !request.url().startsWith("blob:"))
          external.push(request.url());
      });
      const response = await page.goto(
        `${base}entasis.html?station=1&enlarge=200&prediction=circle&units=metric&compare=equal#entasis-workshop`,
      );
      assert.equal(response.status(), 200);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(
        () =>
          document.querySelector("#entasis-offline").textContent ===
          "Workshop & source saved offline",
      );
      const landing = await page.locator("#entasis-title").boundingBox();
      assert(landing.y >= 0 && landing.y < 180);
      assert.equal(await page.locator("#entasis-station").inputValue(), "1");
      assert.match(await page.locator("#entasis-equation").innerText(), /15\.129 mm/);
      assert.match(await page.locator("#prediction-assessment").innerText(), /2\.042 mm/);
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.locator("#entasis-save").click(),
      ]);
      const chunks = [];
      for await (const chunk of await download.createReadStream()) chunks.push(chunk);
      assert.deepEqual(Buffer.concat(chunks), reviewed);
      await page.locator("#inspect-rounding").click();
      assert.equal(await page.locator("#entasis-prediction").inputValue(), "hyperbola");
      assert.equal(await page.locator("#entasis-station").inputValue(), "2");
      assert.match(await page.locator("#entasis-equation").innerText(), /16\.508 mm/);
      await page.locator("#entasis-station").focus();
      await page.keyboard.press("End");
      assert.match(await page.locator("#calculation-note").innerText(), /zero at this endpoint/);
      await page.locator('a[data-source="41"]').click();
      await page.locator("#entasis-scan-window img").evaluate((img) => img.decode());
      await page.locator("#entasis-scan-zoom").click();
      const sourceCenter = await page
        .locator("#entasis-scan-window")
        .evaluate(
          (el) => (el.scrollTop + el.clientHeight / 2) / el.querySelector("img").clientHeight,
        );
      assert(Math.abs(sourceCenter - 0.435) < 0.005, `Source table center: ${sourceCenter}`);
      await context.setOffline(true);
      await page.reload();
      assert.equal(await page.locator("#entasis-station").inputValue(), "4");
      const cachedHashes = await page.evaluate(
        async (files) =>
          Promise.all(
            files.map(async (file) => {
              const bytes = await (await fetch(`./sources/entasis/${file}`)).arrayBuffer();
              return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");
            }),
          ),
        files,
      );
      assert.deepEqual(cachedHashes, expectedHashes);
      await page.getByRole("link", { name: "Doric corner", exact: true }).click();
      assert.equal(await page.locator("#workshop-title").innerText(), "The corner workshop");
      await page.getByRole("link", { name: "Column spacing", exact: true }).click();
      assert.equal(await page.locator("#spacing-title").innerText(), "The space between columns");
      await page.getByRole("link", { name: "Entasis", exact: true }).click();
      assert.match(await page.locator("#entasis-title").innerText(), /five measurements/);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(errors, []);
      assert.deepEqual(external, []);
      report.configurations.push({
        browser: name,
        version: browser.version(),
        width,
        sharedLanding: landing.y,
        readingSha256: hash(reviewed),
        selectedCircleDifferenceMm: 2.042,
        keyboardEndZero: true,
        sourceCenter,
        offlineThreePages: true,
        cachedSourceHashes: cachedHashes,
        pageErrors: errors,
        externalRequests: external,
      });
      await context.close();
      console.log(
        `${name} ${width}: published measurements, reading, scans and three offline workshops passed`,
      );
    }
  } finally {
    await browser.close();
  }
}
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
