// biome-ignore-all lint/performance/useDomNodeTextContent: Check the visible published lesson.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, firefox } from "playwright";

const base = process.argv[2] ?? "https://antonsoo.github.io/gonia/";
const output = process.argv[3] ?? "/tmp/gonia-hosted-spacing/review.json";
await mkdir(path.dirname(output), { recursive: true });
const reviewed = await readFile("examples/eustyle-altered-reading.html");
const hash = (data) => createHash("sha256").update(data).digest("hex");
const sourceHashes = await Promise.all(
  [82, 83, 84, 85].map(async (n) => hash(await readFile(`public/sources/spacing/krohn-0${n}.jpg`))),
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
      page.on("request", (r) => {
        if (!r.url().startsWith(base) && !r.url().startsWith("blob:")) external.push(r.url());
      });
      const response = await page.goto(
        `${base}spacing.html?system=eustyle&n=6&hold=diameter&d=1&centre=equal#spacing-workshop`,
      );
      assert.equal(response.status(), 200);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(
        () =>
          document.querySelector("#spacing-offline").textContent ===
          "Workshop & source saved offline",
      );
      assert((await page.locator("#alteration").innerText()).includes("Your alteration"));
      assert((await page.locator("#spacing-numbers").innerText()).includes("17.25 m"));
      const landing = await page.locator("#spacing-title").boundingBox();
      assert(landing.y >= 0 && landing.y < 180);
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.locator("#spacing-save").click(),
      ]);
      const chunks = [];
      for await (const chunk of await download.createReadStream()) chunks.push(chunk);
      assert.deepEqual(Buffer.concat(chunks), reviewed);
      await page.locator("#equal-centre").focus();
      await page.keyboard.press("Space");
      assert((await page.locator("#spacing-numbers").innerText()).includes("18 m"));
      await page.selectOption("#column-count", "8");
      assert((await page.locator("#spacing-numbers").innerText()).includes("24.5 m"));
      await context.setOffline(true);
      await page.reload();
      assert.equal(await page.locator("#column-count").inputValue(), "8");
      const cachedSources = await page.evaluate(async () =>
        Promise.all(
          [82, 83, 84, 85].map(async (n) => {
            const bytes = await (await fetch(`./sources/spacing/krohn-0${n}.jpg`)).arrayBuffer();
            return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("");
          }),
        ),
      );
      assert.deepEqual(cachedSources, sourceHashes);
      await page.locator('nav a[href="./#workshop"]').click();
      assert.equal(await page.locator("#workshop-title").innerText(), "The corner workshop");
      await page.locator('nav a[href="./spacing.html"]').click();
      assert.equal(await page.locator("#spacing-title").innerText(), "The space between columns");
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      assert.deepEqual(errors, []);
      assert.deepEqual(external, []);
      report.configurations.push({
        browser: name,
        version: browser.version(),
        width,
        sharedLanding: landing.y,
        alteredStudyMatchesReviewedExport: hash(reviewed),
        keyboardRestoresPrescribedCentre: true,
        eightColumnTotal: 24.5,
        offlineBothPagesAndSourceHashes: cachedSources,
        pageErrors: errors,
        externalRequests: external,
      });
      await context.close();
      console.log(`${name} ${width}: published geometry, saved reading and offline pages passed`);
    }
  } finally {
    await browser.close();
  }
}
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
