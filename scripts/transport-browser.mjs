import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.resolve(process.argv[2] ?? "/tmp/gonia-transport");
const external = process.argv[3];
await mkdir(output, { recursive: true });
const report = { base: external ?? "isolated built-site origins", constructions: [], journeys: [] };
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
};
const sha = (b) => createHash("sha256").update(b).digest("hex");
async function serve() {
  const server = createServer(async (req, res) => {
    try {
      const u = new URL(req.url, "http://local");
      if (!u.pathname.startsWith("/gonia/")) throw new Error("route");
      const file = path.resolve(
        root,
        "dist",
        decodeURIComponent(u.pathname.slice(7)) || "index.html",
      );
      if (!file.startsWith(path.resolve(root, "dist") + path.sep)) throw new Error("path");
      const b = await readFile(file);
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)] ?? "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(b);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return {
    base: `http://127.0.0.1:${server.address().port}/gonia/`,
    close: async () => {
      server.closeAllConnections();
      await new Promise((r) => server.close(r));
    },
  };
}
async function range(page, id, value) {
  await page.locator(id).evaluate((e, v) => {
    e.value = String(v);
    e.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}
async function file(page, id, name) {
  const pending = page.waitForEvent("download");
  await page.locator(id).click();
  const d = await pending;
  const dest = path.join(output, name);
  await d.saveAs(dest);
  return { path: dest, bytes: await readFile(dest), suggested: d.suggestedFilename() };
}
async function capture(page, engine, width, name, csv = false) {
  const data = await page.evaluate(() => {
    const svg = document.querySelector("#transport-picture svg"),
      centre = svg.querySelector('[data-shape="centre"]'),
      body = svg.querySelector('[data-shape="stone"]');
    const circle = svg.querySelector('[data-shape="rolling-circle"]');
    const graph = document.querySelector("#transport-height-graph svg");
    return {
      state: {
        kind: document.querySelector("#transport-kind").value,
        width: Number(document.querySelector("#stone-width").value),
        height: Number(document.querySelector("#stone-height").value),
        radius: Number(document.querySelector("#rolling-radius").value),
        angle: Number(document.querySelector("#transport-angle").value),
        unit: new URLSearchParams(location.search).get("unit") ?? "chosen",
      },
      svg: {
        scale: Number(svg.dataset.scale),
        originX: Number(svg.dataset.originX),
        groundY: Number(svg.dataset.groundY),
        worldCentre: { x: Number(svg.dataset.worldCentreX), y: Number(svg.dataset.worldCentreY) },
        centre: { x: Number(centre.getAttribute("cx")), y: Number(centre.getAttribute("cy")) },
        radiusPixels: circle ? Number(circle.getAttribute("r")) : null,
        ruler: [...svg.querySelectorAll("[data-road-mark]")].map((t) => ({
          world: Number(t.dataset.roadMark),
          x: Number(t.getAttribute("x")),
          label: t.textContent,
        })),
        vertices: body
          ? body
              .getAttribute("points")
              .trim()
              .split(/\s+/)
              .map((p) => p.split(",").map(Number))
          : [],
      },
      graph: {
        xOrigin: Number(graph.dataset.graphXOrigin),
        xPerDegree: Number(graph.dataset.graphXPerDegree),
        yOrigin: Number(graph.dataset.graphYOrigin),
        yPerUnit: Number(graph.dataset.graphYPerUnit),
        path: graph
          .querySelector('[data-shape="required-height"]')
          .getAttribute("d")
          .match(/-?[\d.]+(?:e[+-]?\d+)?/gi)
          .map(Number),
      },
      heightText: document.querySelector("#centre-height").textContent,
      advanceText: document.querySelector("#centre-advance").textContent,
      clearanceText: document.querySelector("#full-clearance").textContent,
      verdict: document.querySelector("#transport-verdict").textContent,
    };
  });
  if (csv) {
    const d = await file(page, "#transport-csv", `${engine}-${width}-${name}.csv`);
    data.csv = d.bytes.toString();
  }
  report.constructions.push({ engine, width, name, ...data });
  return data;
}
for (const [engine, launcher] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await launcher.launch();
  try {
    for (const width of [1440, 375]) {
      const server = external ? null : await serve();
      const base = external ?? server.base;
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        acceptDownloads: true,
        reducedMotion: width === 375 ? "reduce" : "no-preference",
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      try {
        await page.goto(`${base}transport.html`);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForFunction(() =>
          document.querySelector("#transport-offline").textContent.includes("saved offline"),
        );
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        );
        await page.keyboard.press("Tab");
        assert.equal(await page.locator(":focus").textContent(), "Skip to the rolling stone");
        await page.keyboard.press("Enter");
        assert.equal(await page.locator("#transport-angle").inputValue(), "0");
        await page.waitForTimeout(250);
        assert.equal(await page.locator("#transport-angle").inputValue(), "0");
        for (const kind of ["shaft", "bare", "wheels"]) {
          await page.locator("#transport-kind").selectOption(kind);
          for (const angle of [0, 45, 90, 180, 360]) {
            await range(page, "#transport-angle", angle);
            await capture(page, engine, width, `${kind}-${angle}`, angle === 45);
          }
        }
        await page.locator("#transport-reset").click();
        await range(page, "#stone-width", 2);
        await range(page, "#stone-height", 2);
        await range(page, "#rolling-radius", 1);
        await range(page, "#transport-angle", 45);
        await capture(page, engine, width, "smallest-section");
        assert.ok(
          await page
            .locator("#transport-height-graph svg")
            .evaluate((svg) =>
              [...svg.querySelectorAll("text")]
                .filter((t) => /^\d+(?:\.\d+)?$/.test(t.textContent))
                .every(
                  (t) => Number(t.getAttribute("y")) >= 35 && Number(t.getAttribute("y")) <= 230,
                ),
            ),
        );
        await page.locator("#transport-reset").click();
        for (const radius of [1, 9]) {
          await range(page, "#stone-width", 12);
          await range(page, "#stone-height", 12);
          await range(page, "#rolling-radius", radius);
          await range(page, "#transport-angle", 45);
          await capture(page, engine, width, `largest-section-radius-${radius}`);
          assert.ok(
            await page.locator("#transport-picture svg").evaluate((svg) => {
              const v = svg.viewBox.baseVal;
              return [
                ...svg.querySelectorAll('[data-shape="stone"],[data-shape="rolling-circle"]'),
              ].every((e) => {
                const b = e.getBBox();
                return (
                  b.x >= v.x &&
                  b.x + b.width <= v.x + v.width &&
                  b.y >= v.y &&
                  b.y + b.height <= v.y + v.height
                );
              });
            }),
          );
        }
        await page.locator("#transport-reset").click();
        await page.locator("#transport-tight").click();
        assert.match(await page.locator("#transport-verdict").textContent(), /too small/);
        await range(page, "#transport-angle", 45);
        assert.equal(await page.locator(".stone-intrusion").count(), 1);
        await capture(page, engine, width, "blocked-45", true);
        await page.locator("#transport-quarter").focus();
        await page.keyboard.press("Enter");
        assert.equal(await page.locator("#transport-angle").inputValue(), "90");
        assert.equal(await page.locator(".stone-intrusion").count(), 0);
        assert.match(await page.locator("#transport-verdict").textContent(), /too small/);
        await capture(page, engine, width, "quarter-clears-but-turn-fails");
        await page.locator("#transport-paconius").click();
        assert.equal(await page.locator("#rolling-radius").inputValue(), "7.5");
        assert.equal(await page.locator("#full-clearance").textContent(), "2.5 source feet");
        assert.match(
          await page.locator("#transport-verdict").textContent(),
          /does not explain the veering/,
        );
        await capture(page, engine, width, "paconius", true);
        await page.bringToFront();
        await page.locator("#transport-play").focus();
        await page.keyboard.press("Enter");
        await page
          .waitForFunction(() => Number(document.querySelector("#transport-angle").value) > 5)
          .catch(async (error) => {
            console.log(
              await page.evaluate(() => ({
                visibility: document.visibilityState,
                focus: document.activeElement?.id,
                angle: document.querySelector("#transport-angle").value,
                play: document.querySelector("#transport-play").textContent,
                pressed: document.querySelector("#transport-play").getAttribute("aria-pressed"),
              })),
            );
            throw error;
          });
        await page.locator("#transport-play").click();
        const stopped = await page.locator("#transport-angle").inputValue();
        await page.waitForTimeout(300);
        assert.equal(await page.locator("#transport-angle").inputValue(), stopped);
        await page.locator("#transport-angle").focus();
        await page.keyboard.press("End");
        assert.equal(await page.locator("#transport-angle").inputValue(), "360");
        await page.keyboard.press("Home");
        assert.equal(await page.locator("#transport-angle").inputValue(), "0");
        await range(page, "#transport-angle", 53);
        const shared = page.url();
        await page.reload();
        assert.equal(await page.locator("#transport-angle").inputValue(), "53");
        assert.equal(page.url(), shared);
        await page.locator('[data-transport-word="armillis"]').click();
        assert.match(await page.locator("#transport-word-note").textContent(), /Ablative plural/);
        assert.ok(
          await page
            .locator("#transport-word-panel")
            .evaluate((e) =>
              Boolean(
                e.closest(".transport-reading")?.querySelector('[data-transport-word="armillis"]'),
              ),
            ),
        );
        assert.equal(await page.locator(".transport-greek h4").count(), 3);
        await page.locator('button[data-transport-page="230"]').click();
        await page.locator("#transport-source-image").evaluate((i) => i.decode());
        await page.locator("#transport-source-start").click();
        await page.waitForFunction(
          () => document.querySelector("#transport-source-pan").scrollTop > 0,
        );
        await page.locator("#transport-page-top").click();
        assert.equal(await page.locator("#transport-source-pan").evaluate((e) => e.scrollTop), 0);
        await range(page, "#transport-source-zoom", 300);
        await page.locator("#transport-source-pan").focus();
        await page.keyboard.press("ArrowRight");
        await page.waitForFunction(
          () => document.querySelector("#transport-source-pan").scrollLeft > 0,
        );
        await page.locator('button[data-transport-page="231"]').click();
        await page.locator("#transport-source-image").evaluate((i) => i.decode());
        assert.match(await page.locator("#transport-page-note").textContent(), /12 × 8 × 6/);
        await page.goBack();
        assert.match(await page.locator("#transport-source-title").textContent(), /230/);
        await page.goForward();
        assert.match(await page.locator("#transport-source-title").textContent(), /231/);
        await range(page, "#transport-zoom", 250);
        await page.locator("#transport-picture").focus();
        await page.keyboard.press("ArrowRight");
        await page.waitForFunction(
          () => document.querySelector("#transport-picture").scrollLeft > 0,
        );
        await range(page, "#transport-zoom", 100);
        await page.locator("#transport-share").click();
        if (await page.locator("#transport-share-fallback").isVisible())
          assert.equal(await page.locator("#transport-share-url").inputValue(), page.url());
        const reading = await file(page, "#transport-save", `${engine}-${width}-reading.html`);
        const html = reading.bytes.toString();
        assert.ok(!/<script\b/i.test(html));
        assert.ok(!/src=["']https?:/i.test(html));
        const images = [...html.matchAll(/src="data:image\/jpeg;base64,([^"]+)"/g)];
        assert.equal(images.length, 2);
        assert.equal([...html.matchAll(/class="grammar-note"/g)].length, 9);
        for (const [i, p] of [230, 231].entries())
          assert.equal(
            sha(Buffer.from(images[i][1], "base64")),
            sha(await readFile(path.join(root, `public/sources/transport/krohn-${p}.jpg`))),
          );
        const fonts = [...html.matchAll(/src:url\('data:font\/[^;]+;base64,([^']+)'/g)];
        assert.equal(fonts.length, 2);
        for (const [i, p] of ["NotoSerif-Regular.ttf", "IBMPlexSans-Regular.woff2"].entries())
          assert.equal(
            sha(Buffer.from(fonts[i][1], "base64")),
            sha(await readFile(path.join(root, "public/fonts", p))),
          );
        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        assert.deepEqual(
          axe.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          [],
        );
        await page
          .locator("#transport-workshop")
          .evaluate((e) => e.scrollIntoView({ block: "start", behavior: "instant" }));
        await page.screenshot({ path: path.join(output, `${engine}-${width}-workshop.png`) });
        await page
          .locator(".transport-language")
          .evaluate((e) => e.scrollIntoView({ block: "start", behavior: "instant" }));
        await page.screenshot({ path: path.join(output, `${engine}-${width}-language.png`) });
        const saved = await context.newPage(),
          network = [];
        saved.on("request", (r) => {
          if (/^https?:/.test(r.url())) network.push(r.url());
        });
        await saved.goto(`file://${reading.path}`);
        await saved.evaluate(() => document.fonts.ready);
        assert.ok(
          await saved.evaluate(() =>
            [...document.images].every((i) => i.complete && i.naturalWidth > 1000),
          ),
        );
        assert.ok(
          await saved.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        );
        assert.deepEqual(network, []);
        assert.equal(
          await saved.locator(".transport-stone").evaluate((e) => getComputedStyle(e).stroke),
          "rgb(64, 90, 67)",
        );
        if (engine === "chromium" && width === 1440)
          await saved.pdf({
            path: path.join(output, "transport-reading.pdf"),
            printBackground: true,
            preferCSSPageSize: true,
          });
        await saved.close();
        await page.goto(`${base}transport.html?kind=bare&kind=wheels`);
        assert.equal(await page.locator("#transport-issue").isVisible(), true);
        assert.equal(await page.locator("#transport-kind").inputValue(), "wheels");
        await page.locator("#transport-share").click();
        assert.deepEqual(new URL(page.url()).searchParams.getAll("kind"), ["wheels"]);
        if (await page.locator("#transport-share-fallback").isVisible()) {
          assert.deepEqual(
            new URL(await page.locator("#transport-share-url").inputValue()).searchParams.getAll(
              "kind",
            ),
            ["wheels"],
          );
        }
        await page.goto(
          `${base}transport.html?kind=bare&w=8&h=6&r=6&angle=45&unit=chosen&page=231`,
        );
        await page.waitForFunction(() =>
          document.querySelector("#transport-offline").textContent.includes("saved offline"),
        );
        const inventory = await page.evaluate(async () =>
          Object.fromEntries(
            await Promise.all(
              (await caches.keys()).map(async (k) => [
                k,
                (await caches.open(k).then((c) => c.keys())).map((r) => new URL(r.url).pathname),
              ]),
            ),
          ),
        );
        if (server) await server.close();
        else await context.setOffline(true);
        await page.reload();
        assert.equal(await page.locator("#transport-kind").inputValue(), "bare");
        assert.equal(await page.locator("#transport-angle").inputValue(), "45");
        await page.locator('button[data-transport-page="230"]').click();
        await page.locator("#transport-source-image").evaluate((i) => i.decode());
        const offlineReading = await file(
          page,
          "#transport-save",
          `${engine}-${width}-offline-reading.html`,
        );
        assert.ok(offlineReading.bytes.length > 1000000);
        const oldRooms = [];
        for (const name of ["Fluting", "Entasis", "Column spacing", "Doric corner"]) {
          await page.getByRole("link", { name, exact: true }).first().click();
          await page.locator("main h1").waitFor();
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          );
          oldRooms.push(await page.locator("main h1").textContent());
          await page.getByRole("link", { name: "Transport", exact: true }).click();
          await page.locator("#transport-picture svg").waitFor();
        }
        assert.deepEqual(errors, []);
        report.journeys.push({
          engine,
          version: browser.version(),
          width,
          reducedMotion: width === 375,
          shared,
          readingSha256: sha(reading.bytes),
          sourceImages: 2,
          fonts: 2,
          axeViolations: axe.violations.length,
          sourceJumpAndKeyboardPan: true,
          explicitPlayPause: true,
          inventory,
          offlineRooms: oldRooms,
          offline:
            "reload, new source page, full reading and all five rooms after local origin closes or external network goes offline",
          errors,
        });
        console.log(
          `${engine} ${width}: transport geometry, readings, native files and offline rooms passed`,
        );
      } finally {
        await context.close();
        if (server)
          try {
            await server.close();
          } catch {}
      }
    }
  } finally {
    await browser.close();
  }
}
await writeFile(path.join(output, "review.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(
  `${report.constructions.length} rendered poses and their native full-turn CSVs retained.`,
);
