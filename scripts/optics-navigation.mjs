// biome-ignore-all lint/performance/useDomNodeTextContent: Inspect native routes and visible document bounds.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { chromium, firefox } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:4353/gonia/",
  output = process.argv[3] ?? "/tmp/gonia-optics-navigation.json",
  cases = [];
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await engine.launch();
  try {
    for (const width of [375, 768, 1024, 1440]) {
      const context = await browser.newContext({
          viewport: { width, height: 1000 },
          serviceWorkers: "block",
        }),
        p = await context.newPage(),
        errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      try {
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
          await p.goto(`${base}${room}.html`, { waitUntil: "domcontentloaded" });
          await p.evaluate(() => document.fonts.ready);
          const dimensions = await p.evaluate(() => ({
            document: document.documentElement.scrollWidth,
            viewport: innerWidth,
            header: document.querySelector(".masthead").getBoundingClientRect().width,
          }));
          assert(dimensions.document <= width, JSON.stringify({ name, width, room, dimensions }));
          const link = p.locator('nav a[href="./optics.html"]');
          assert.equal(await link.count(), 1);
          await link.focus();
          await p.keyboard.press("Enter");
          await p.locator("#vp-title").waitFor();
          assert.equal(await p.locator("#vp-distance").inputValue(), "300");
          cases.push({
            browser: name,
            width,
            room: `${room}.html`,
            documentWidth: dimensions.document,
            nativeKeyboardRoute: true,
          });
        }
        assert.deepEqual(errors, []);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}
await writeFile(
  output,
  `${JSON.stringify({ checkedAt: new Date().toISOString(), base, scope: "Native keyboard route from each of ten rooms at four widths in both browsers; document bounds; service workers blocked for this navigation-only review.", cases }, null, 2)}\n`,
);
console.log(`${cases.length} document-bound and native keyboard routes passed`);
