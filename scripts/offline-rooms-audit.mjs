// biome-ignore-all lint/performance/useDomNodeTextContent: Verify visible offline-room interactions.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium, firefox } from "playwright";

const root = path.resolve(process.argv[2] ?? "dist"),
  out = path.resolve(process.argv[3] ?? "/tmp/gonia-rooms-audit"),
  hosted = process.argv[4];
await mkdir(out, { recursive: true });
const rooms = [
  ["", "#beam"],
  ["spacing.html", "#front-width"],
  ["entasis.html", "#entasis-station"],
  ["fluting.html", "#width"],
  ["transport.html", "#stone-width"],
  ["colonnade.html", "#col-gap"],
  ["theatre.html", "#th-diameter"],
  ["echea.html", "#ec-reference"],
  ["hoist.html", "#hw-efficiency"],
  ["optics.html", "#vp-distance"],
  ["screw.html", "#sc-lead"],
  ["ledger.html", "#lg-extra-0"],
  ["babylon.html", "#bb-supplied"],
  ["volute.html", "#vo-draw"],
  ["arch.html", "#ar-rise"],
];
const report = { checkedAt: new Date().toISOString(), hosted: hosted ?? null, configurations: [] };
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
};
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await engine.launch();
  try {
    for (const width of [1440, 375]) {
      let online = true;
      const server = createServer(async (req, res) => {
        if (!online) {
          req.socket.destroy();
          return;
        }
        const f =
          new URL(req.url, "http://review").pathname.replace(/^\/gonia\//, "") || "index.html";
        try {
          if (f.includes("..")) throw Error("path");
          res
            .writeHead(200, {
              "Content-Type": types[path.extname(f)] ?? "text/plain",
              "Cache-Control": "no-store",
            })
            .end(await readFile(path.join(root, f)));
        } catch {
          res.writeHead(404).end();
        }
      });
      await new Promise((r) => server.listen(0, "127.0.0.1", r));
      const base = hosted ?? `http://127.0.0.1:${server.address().port}/gonia/`,
        context = await browser.newContext({ viewport: { width, height: 1000 } }),
        p = await context.newPage(),
        folder = path.join(out, `${name}-${width}`),
        errors = [];
      await mkdir(folder, { recursive: true });
      p.on("pageerror", (e) => errors.push(e.message));
      try {
        await p.goto(`${base}hoist.html`);
        await p.waitForFunction(
          () =>
            document.querySelector("#hw-offline").textContent === "Workshop & source saved offline",
          null,
          { timeout: 90000 },
        );
        online = false;
        await context.setOffline(true);
        const records = [];
        for (const [room, selector] of rooms) {
          await p.goto(base + room);
          await p.waitForFunction(
            () =>
              [...document.querySelectorAll('[role="status"]')].some(
                (e) => e.textContent === "Workshop & source saved offline",
              ),
            null,
            { timeout: 30000 },
          );
          const input = p.locator(selector);
          await input.waitFor();
          const before = await p
            .locator("main")
            .evaluate(
              (e) =>
                e.innerText + [...e.querySelectorAll("svg")].map((svg) => svg.outerHTML).join(""),
            );
          const kind = await input.evaluate((e) => (e.tagName === "SELECT" ? "select" : e.type));
          await input.focus();
          if (kind === "button") await p.keyboard.press("Enter");
          else if (kind === "checkbox") await p.keyboard.press("Space");
          else if (kind === "select") {
            const opts = await input.locator("option").evaluateAll((os) => os.map((o) => o.value));
            const current = await input.inputValue();
            await input.selectOption(opts.find((v) => v !== current));
          } else {
            const key = await input.evaluate((e) =>
              Number(e.value) >= Number(e.max) ? "ArrowLeft" : "ArrowRight",
            );
            await p.keyboard.press(key);
            if (kind === "number") {
              await p.keyboard.press("ArrowUp");
              await p.keyboard.press("Tab");
            }
          }
          const after = await p
            .locator("main")
            .evaluate(
              (e) =>
                e.innerText + [...e.querySelectorAll("svg")].map((svg) => svg.outerHTML).join(""),
            );
          assert(before !== after, `${room} control changed no rendered measurements`);
          assert.equal(await p.locator(".offline-check").count(), 1);
          await p.getByRole("button", { name: "Check offline files", exact: true }).click();
          await p.waitForFunction(() =>
            [...document.querySelectorAll('[role="status"]')].some(
              (e) => e.textContent === "Workshop & source saved offline",
            ),
          );
          const bounds = await p.locator(".offline-check").boundingBox();
          assert(bounds.width >= 44 && bounds.height >= 44);
          assert(
            await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            `${room} overflows ${width}`,
          );
          await p.locator("footer").screenshot({
            path: path.join(folder, `${room.replace(".html", "") || "corner"}-footer.png`),
          });
          records.push({
            room: room || "index.html",
            control: selector,
            changedRenderedMeasurements: true,
            offlineCheckWorked: true,
            pageOverflow: false,
            buttonWidth: bounds.width,
            buttonHeight: bounds.height,
          });
        }
        assert.deepEqual(errors, []);
        report.configurations.push({
          browser: name,
          version: browser.version(),
          width,
          rooms: records,
          originRefused: !hosted,
          browserOffline: true,
          pageErrors: errors,
        });
        console.log(
          `${name} ${width}: fifteen offline rooms, operated controls, checked inventories and footer layout passed`,
        );
      } finally {
        await context.close();
        server.closeAllConnections();
        await new Promise((r) => server.close(r));
      }
    }
  } finally {
    await browser.close();
  }
}
await writeFile(path.join(out, "review.json"), `${JSON.stringify(report, null, 2)}\n`);
