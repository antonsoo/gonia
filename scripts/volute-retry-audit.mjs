import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, firefox } from "playwright";

const base = process.argv[2],
  out = process.argv[3];
await mkdir(out, { recursive: true });
const records = [];
for (const [engine, driver] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await driver.launch();
  try {
    for (const width of [1440, 375]) {
      const c = await browser.newContext({
        serviceWorkers: "block",
        viewport: { width, height: 1000 },
      });
      const p = await c.newPage();
      await c.route("**/sources/volute/krohn-071.jpg", (r) =>
        r.fulfill({ status: 200, body: "substituted", contentType: "image/jpeg" }),
      );
      await p.goto(new URL("volute.html", base).href);
      await p.locator("#vo-source-retry").waitFor();
      assert.equal(await p.locator("#vo-source-frame").isVisible(), false);
      assert.equal(await p.locator("#vo-source-image").isVisible(), false);
      assert.equal(await p.locator("#vo-zoom").isDisabled(), true);
      await p.locator(".vo-source").screenshot({ path: `${out}/${engine}-${width}-error.png` });
      await c.unroute("**/sources/volute/krohn-071.jpg");
      await p.locator("#vo-source-retry").focus();
      await p.keyboard.press("Enter");
      await p.waitForFunction(() =>
        document
          .getElementById("vo-source-caption")
          .textContent.includes("Image identity verified"),
      );
      assert.equal(await p.locator("#vo-page").inputValue(), "0");
      assert.equal(await p.locator("#vo-source-retry").isVisible(), false);
      assert.equal(await p.locator("#vo-source-image").isVisible(), true);
      assert.equal(await p.locator("#vo-zoom").isEnabled(), true);
      assert.equal(
        await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      );
      records.push({
        engine,
        width,
        sameSourceKeyboardRetry: true,
        emptyErrorPaneHidden: true,
        unverifiedImageLinkHidden: true,
        verifiedControlsRestored: true,
      });
      await c.close();
    }
  } finally {
    await browser.close();
  }
}
await writeFile(`${out}/receipt.json`, `${JSON.stringify(records, null, 2)}\n`);
console.log(records);
