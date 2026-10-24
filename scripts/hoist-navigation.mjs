import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { chromium, firefox } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:4338/gonia/",
  output = process.argv[3] ?? "/tmp/gonia-hoist-navigation.json",
  cases = [];
for (const [name, type] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const b = await type.launch();
  try {
    const context = await b.newContext({ serviceWorkers: "block" });
    try {
      for (const width of [375, 621, 768, 820, 1024, 1440])
        for (const room of [
          "index.html",
          "spacing.html",
          "entasis.html",
          "fluting.html",
          "transport.html",
          "colonnade.html",
          "theatre.html",
          "echea.html",
          "hoist.html",
        ]) {
          const p = await context.newPage();
          await p.setViewportSize({ width, height: 1000 });
          await p.goto(base + room);
          await p.evaluate(() => document.fonts.ready);
          const box = await p.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            navRight: document.querySelector("nav").getBoundingClientRect().right,
            links: Array.from(document.querySelectorAll("nav a"), (a) => ({
              text: a.textContent,
              left: a.getBoundingClientRect().left,
              right: a.getBoundingClientRect().right,
            })),
          }));
          assert(box.scrollWidth <= width + 1, `${name}/${width}/${room}: page overflow`);
          assert(
            box.links.every((l) => l.left >= 0 && l.right <= width),
            `${name}/${width}/${room}: navigation outside viewport`,
          );
          await p.getByRole("link", { name: "Hoist", exact: true }).focus();
          await Promise.all([p.waitForURL(/hoist\.html/), p.keyboard.press("Enter")]);
          await p.locator("#hw-title").waitFor();
          if (width === 621 && room === "index.html")
            await p.screenshot({ path: `/tmp/gonia-hoist-nav-${name}.png` });
          cases.push({
            browser: name,
            version: b.version(),
            width,
            room,
            ...box,
            keyboardHoistNavigation: true,
          });
          await p.close();
        }
    } finally {
      await context.close();
    }
  } finally {
    await b.close();
  }
}
await writeFile(
  output,
  `${JSON.stringify({ checkedAt: new Date().toISOString(), scope: "Header and document bounds at six widths, plus actual keyboard route from all nine rooms. Service workers blocked in this layout-only review; lifecycle/offline verification is separate.", base, cases }, null, 2)}\n`,
);
console.log(`${cases.length} navigation and viewport configurations passed`);
