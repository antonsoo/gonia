import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { chromium, firefox } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:4328/gonia/";
const output = process.argv[3] ?? "/tmp/gonia-development.json";
const checks = [];
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await engine.launch();
  try {
    for (const width of [1440, 375]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const errors = [];
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      page.on("pageerror", (e) => errors.push(e.message));
      for (const entry of ["", "spacing.html"]) {
        await page.goto(`${base}${entry}`);
        await page.evaluate(() => document.fonts.ready);
        const result = await page.evaluate(async () => {
          const response = await fetch(document.querySelector('link[rel="icon"]').href);
          return {
            background: getComputedStyle(document.documentElement).backgroundColor,
            fonts: document.fonts.status,
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            iconType: response.headers.get("content-type"),
            iconIsSvg: (await response.text()).includes("<svg"),
          };
        });
        assert.equal(result.background, "rgb(244, 241, 232)");
        assert.equal(result.overflow, false);
        assert.equal(result.iconIsSvg, true);
        assert(result.iconType.includes("image/svg+xml"));
        assert.deepEqual(errors, []);
        checks.push({ browser: name, width, entry, ...result, errors: [...errors] });
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
}
await writeFile(output, `${JSON.stringify({ checks }, null, 2)}\n`);
console.log(`${checks.length} development pages styled, with working icons and no CSP errors`);
