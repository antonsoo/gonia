// biome-ignore-all lint/performance/useDomNodeTextContent: Review the actual visible interface.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const output = path.resolve(process.argv[2] ?? "/tmp/gonia-theatre-browser");
await mkdir(output, { recursive: true });
const digest = (b) => createHash("sha256").update(b).digest("hex");
const manifest = JSON.parse(await readFile("public/sources/theatre/manifest.json", "utf8"));
const report = {
  checkedAt: new Date().toISOString(),
  worker: digest(await readFile("dist/sw.js")),
  scope:
    "Native controls, drawn geometry, source hashes, saved files, printing, all seven offline rooms",
  configurations: [],
};
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
  ".json": "application/json",
};
async function serve() {
  let available = true,
    substitute = false,
    stopped = 0;
  const server = createServer(async (req, res) => {
    if (!available) {
      stopped++;
      req.socket.destroy();
      return;
    }
    try {
      const url = new URL(req.url, "http://local"),
        rel = decodeURIComponent(url.pathname).replace(/^\/gonia\//, "") || "index.html";
      if (!url.pathname.startsWith("/gonia/") || rel.includes("..")) throw new Error("path");
      const actual =
        substitute && rel === "sources/theatre/krohn-110.jpg"
          ? "sources/theatre/krohn-109.jpg"
          : rel;
      const bytes = await readFile(path.join("dist", actual));
      res
        .writeHead(200, {
          "Content-Type": types[path.extname(rel)] ?? "application/octet-stream",
          "Cache-Control": "no-store",
        })
        .end(bytes);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return {
    base: `http://127.0.0.1:${server.address().port}/gonia/`,
    stop: () => {
      available = false;
    },
    substitute: () => {
      substitute = true;
    },
    stopped: () => stopped,
    close: async () => {
      server.closeAllConnections();
      await new Promise((r) => server.close(r));
    },
  };
}
const near = (a, b, t = 1e-8) =>
  assert.ok(Math.abs(a - b) < t, `${a} differs from ${b} by ${Math.abs(a - b)}`);
async function range(page, id, value) {
  await page.locator(id).evaluate((node, v) => {
    node.value = String(v);
    node.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}
async function save(page, id, name) {
  const pending = page.waitForEvent("download");
  await page.locator(id).click();
  const download = await pending,
    target = path.join(output, name);
  await download.saveAs(target);
  return target;
}
async function sourceReady(page) {
  await page.locator("#th-source-image").scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const im = document.querySelector("#th-source-image");
    return im.complete && im.naturalWidth > 0;
  });
}
async function geometry(page, width, kind, arc, diameter, probe) {
  const selector = width === 375 ? "#th-plan-portrait svg" : "#th-plan svg";
  const actual = await page.locator(selector).evaluate((svg) => {
    const circle = svg.querySelector(".th-initial"),
      region = svg.querySelector('[data-region="orchestra"]'),
      scale = Number(svg.dataset.scale),
      matrix = svg.getScreenCTM();
    const length = region.getTotalLength(),
      points = Array.from({ length: 4096 }, (_, i) => {
        const p = region.getPointAtLength((length * i) / 4096);
        return { x: p.x, y: p.y };
      });
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length];
      area += a.x * b.y - b.x * a.y;
    }
    const probe = svg.querySelector(".th-probe");
    return {
      scale,
      scalex: matrix.a,
      scaley: matrix.d,
      cx: Number(circle.getAttribute("cx")),
      cy: Number(circle.getAttribute("cy")),
      pixelRadius: Number(circle.getAttribute("r")),
      drawnArea: Math.abs(area) / 2 / scale ** 2,
      stage: {
        front: Number(svg.querySelector('[data-line="stage-front"]').getAttribute("y1")),
        back: Number(svg.querySelector('[data-line="scene-front"]').getAttribute("y1")),
      },
      polygons: [...svg.querySelectorAll("polygon")].map((p) =>
        [...p.points].map((v) => ({ x: v.x, y: v.y })),
      ),
      probe: probe
        ? {
            x1: Number(probe.getAttribute("x1")),
            x2: Number(probe.getAttribute("x2")),
            y: Number(probe.getAttribute("y1")),
          }
        : null,
      stairs: svg.querySelectorAll("[data-stair]").length,
    };
  });
  const r = diameter / 2;
  near(actual.scalex, actual.scaley);
  near(actual.pixelRadius / actual.scale, r);
  for (const polygon of actual.polygons) {
    const lengths = polygon.map((p, i) => {
      const q = polygon[(i + 1) % polygon.length];
      // SVGPointList exposes float32 coordinates; the authored attributes retain doubles.
      near(Math.hypot(p.x - actual.cx, p.y - actual.cy) / actual.scale, r, 1e-5);
      return Math.hypot(p.x - q.x, p.y - q.y);
    });
    for (const length of lengths) near(length, lengths[0], 1e-4);
  }
  const depth = kind === "roman" ? r / 2 : r * (1 - 1 / Math.sqrt(2));
  near((actual.stage.back - actual.stage.front) / actual.scale, depth);
  const h = 1 / Math.sqrt(2);
  const expectedArea =
    r *
    r *
    (kind === "roman"
      ? Math.PI / 2
      : arc === "single"
        ? (3 * Math.PI) / 4 + 0.5
        : Math.PI / 2 + h * Math.sqrt(4 - h * h) + 4 * Math.asin(h / 2) - 2 * h);
  // Both engines expose cubic approximations through getPointAtLength: a
  // circle's sampled radius differs by up to 0.028%. The exact SVG arc radii,
  // endpoints and authored measurements are checked separately above/below.
  near(actual.drawnArea, expectedArea, expectedArea * 0.0005);
  assert.equal(actual.stairs, kind === "roman" ? 7 : 8);
  if (kind === "greek") {
    assert.ok(actual.probe);
    const y = (actual.cy - actual.probe.y) / actual.scale;
    near(y, ((-r / Math.sqrt(2)) * probe) / 100);
    const left = (actual.probe.x1 - actual.cx) / actual.scale,
      right = (actual.probe.x2 - actual.cx) / actual.scale;
    near(left, -right);
    near(Math.hypot(right + (arc === "three" ? r : 0), y), arc === "three" ? 2 * r : r);
  }
  return {
    diameter,
    kind,
    arc,
    probe,
    drawnArea: actual.drawnArea,
    expectedArea,
    relativeSampledAreaDiscrepancy: Math.abs(actual.drawnArea - expectedArea) / expectedArea,
    sampledAreaTolerance: 0.0005,
    stairDirections: actual.stairs,
  };
}
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await engine.launch();
  try {
    for (const width of [1440, 375]) {
      const host = await serve(),
        context = await browser.newContext({
          viewport: { width, height: 1000 },
          acceptDownloads: true,
          reducedMotion: "reduce",
        });
      context.setDefaultTimeout(20000);
      try {
        const page = await context.newPage(),
          errors = [],
          external = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("request", (r) => {
          if (/^https?:/.test(r.url()) && !r.url().startsWith(new URL(host.base).origin))
            external.push(r.url());
        });
        await page.goto(`${host.base}theatre.html`);
        await page.waitForFunction(() =>
          document.querySelector("#th-offline").textContent.includes("saved offline"),
        );
        await page.evaluate(() => document.fonts.ready);
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          true,
        );
        const result = {
          browser: name,
          version: browser.version(),
          width,
          geometry: [],
          readings: [],
          sources: [],
          downloads: [],
          offlineRooms: [],
          screenshots: [],
        };
        for (const diameter of [12, 20, 36])
          for (const [kind, arc] of [
            ["greek", "three"],
            ["greek", "single"],
            ["roman", "three"],
          ]) {
            await page.locator(`#th-${kind}`).click();
            await page.locator("#th-diameter").fill(String(diameter));
            if (kind === "greek") await page.locator(`#th-${arc}`).click();
            for (const probe of kind === "greek" ? [0, 25, 50, 75, 100] : [0]) {
              if (kind === "greek") await range(page, "#th-probe", probe);
              result.geometry.push(await geometry(page, width, kind, arc, diameter, probe));
            }
          }
        for (const invalid of ["", "11", "37", "20.5"]) {
          await page.locator("#th-diameter").fill(invalid);
          assert.equal(await page.locator("#th-diameter").getAttribute("aria-invalid"), "true");
          assert.equal(
            await page
              .locator(`${width === 375 ? "#th-plan-portrait" : "#th-plan"} svg`)
              .getAttribute("data-radius"),
            "18",
          );
        }
        await page.locator("#th-diameter").fill("20");
        assert.equal(await page.locator("#th-diameter").getAttribute("aria-invalid"), null);
        for (const kind of ["greek", "roman"]) {
          await page.locator(`#th-${kind}`).click();
          for (let i = 0; i < 5; i++) {
            await page.locator(`[data-th-step="${i}"]`).click();
            assert.equal(
              await page.locator(`[data-th-step="${i}"]`).getAttribute("aria-pressed"),
              "true",
            );
            assert.match(
              await page.locator("#th-step-count").innerText(),
              new RegExp(`Step ${i + 1}`, "i"),
            );
          }
          for (let i = 1; i <= (kind === "greek" ? 3 : 4); i++) {
            await page.locator("#th-polygon").selectOption(String(i));
            assert.equal(
              await page
                .locator(`${width === 375 ? "#th-plan-portrait" : "#th-plan"} .th-selected`)
                .getAttribute("data-polygon"),
              String(i),
            );
          }
        }
        await page.locator("#th-vertex").focus();
        await page.keyboard.press("Home");
        await page.keyboard.press("ArrowRight");
        assert.equal(await page.locator("#th-vertex").inputValue(), "1");
        await page.locator("#th-greek").click();
        await page.locator("#th-three").click();
        await page.locator("#th-probe").focus();
        await page.keyboard.press("Home");
        await page.keyboard.press("ArrowRight");
        assert.equal(await page.locator("#th-probe").inputValue(), "1");
        for (let i = 0; i < 10; i++) {
          await page.locator("#th-passage").selectOption(String(i));
          assert.ok((await page.locator("#th-latin").innerText()).length > 50);
          await page.locator("#th-grammar").evaluate((n) => {
            n.open = true;
          });
          assert.ok((await page.locator("#th-grammar-note").innerText()).length > 60);
          result.readings.push(await page.locator("#th-passage-title").innerText());
        }
        for (let i = 0; i < 7; i++) {
          await page.locator("#th-source").selectOption(String(i));
          await sourceReady(page);
          const source = await page.locator("#th-source-image").getAttribute("src"),
            file = source.split("/").at(-1);
          const bytes = await page
            .locator("#th-source-image")
            .evaluate(async (img) =>
              Array.from(new Uint8Array(await (await fetch(img.src)).arrayBuffer())),
            );
          const entry = manifest.files.find((f) => f.file === file);
          assert.ok(entry);
          assert.equal(digest(Buffer.from(bytes)), entry.sha256);
          result.sources.push({ file, sha256: entry.sha256 });
        }
        await page.locator("#th-source").selectOption("4");
        await sourceReady(page);
        await page.locator("#th-source-zoom").focus();
        await page.keyboard.press("End");
        assert.equal(await page.locator("#th-source-zoom").inputValue(), "250");
        await page.locator("#th-find-passage").click();
        await page.locator("#th-source-zoom").focus();
        await page.keyboard.press("Home");
        await page.locator('[data-th-part="construction"]').click();
        await range(page, "#th-probe", 70);
        await page.locator("#th-passage").selectOption("6");
        for (const [area, selector] of [
          ["workbench", ".th-workbench"],
          ["width", "#th-extension"],
          ["reading", "#th-reading"],
          ["source", "#th-evidence"],
        ]) {
          const file = `${name}-${width}-${area}.png`;
          await page.locator(selector).screenshot({ path: path.join(output, file) });
          result.screenshots.push(file);
        }
        const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
        assert.deepEqual(axe.violations, []);
        await page.locator("#th-share").click();
        const shared = await page.locator("#th-share-url").inputValue();
        await page.goto(shared);
        assert.equal(await page.locator("#th-probe").inputValue(), "70");
        assert.equal(await page.locator("#th-passage").inputValue(), "6");
        const files = {};
        for (const [button, extension] of [
          ["#th-save-reading", "html"],
          ["#th-save-svg", "svg"],
          ["#th-save-csv", "csv"],
        ]) {
          files[extension] = await save(page, button, `${name}-${width}.${extension}`);
          result.downloads.push({
            file: path.basename(files[extension]),
            sha256: digest(await readFile(files[extension])),
          });
        }
        const html = await readFile(files.html, "utf8");
        assert.match(html, /MIT License/);
        assert.match(html, /SIL OPEN FONT LICENSE/);
        assert.match(html, /IBMPlex-OFL/);
        const images = [...html.matchAll(/data:image\/jpeg;base64,([A-Za-z0-9+/=]+)/g)];
        assert.equal(images.length, 7);
        assert.deepEqual(
          images.map((m) => digest(Buffer.from(m[1], "base64"))).sort(),
          manifest.files.map((f) => f.sha256).sort(),
        );
        const artifact = await context.newPage(),
          artifactRequests = [];
        artifact.on("request", (r) => {
          if (/^https?:/.test(r.url())) artifactRequests.push(r.url());
        });
        await artifact.goto(pathToFileURL(files.svg).href);
        assert.equal(await artifact.locator("parsererror").count(), 0);
        assert.equal(await artifact.locator("svg").getAttribute("data-kind"), "greek");
        assert.equal(await artifact.locator(".th-polygon").count(), 3);
        assert.equal(
          await artifact.locator(".th-front").evaluate((e) => getComputedStyle(e).stroke),
          "rgb(35, 79, 62)",
        );
        await artifact.goto(pathToFileURL(files.html).href);
        await artifact.evaluate(() => document.fonts.ready);
        assert.equal(await artifact.locator(".passage .latin").count(), 10);
        for (const image of await artifact.locator("img").all())
          await image.evaluate((im) => im.decode());
        assert.equal(
          await artifact.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          true,
        );
        assert.deepEqual(
          (await new AxeBuilder({ page: artifact }).withTags(["wcag2a", "wcag2aa"]).analyze())
            .violations,
          [],
        );
        if (name === "chromium" && width === 1440)
          await artifact.pdf({
            path: path.join(output, "theatre-reading.pdf"),
            format: "A4",
            printBackground: true,
          });
        assert.deepEqual(artifactRequests, []);
        await artifact.close();
        host.stop();
        for (const file of [
          "index.html",
          "spacing.html",
          "entasis.html",
          "fluting.html",
          "transport.html",
          "colonnade.html",
          "theatre.html",
        ]) {
          await page.goto(`${host.base}${file}`);
          assert.ok((await page.locator("h1").innerText()).length > 5);
          assert.equal(await page.locator('.masthead a[href="./theatre.html"]').count(), 1);
          result.offlineRooms.push(file);
        }
        await page.locator("#th-source").selectOption("4");
        await sourceReady(page);
        const offline = await save(page, "#th-save-reading", `${name}-${width}-offline.html`);
        assert.equal(
          (await readFile(offline, "utf8")).match(/data:image\/jpeg;base64,/g).length,
          7,
        );
        assert.ok(host.stopped() > 0);
        assert.deepEqual(errors, []);
        assert.deepEqual(external, []);
        report.configurations.push(result);
        console.log(
          `${name} ${width}: ${result.geometry.length} rendered cases, ten readings, seven sources and seven offline rooms passed`,
        );
      } finally {
        await context.close();
        await host.close();
      }
    }
    const host = await serve(),
      context = await browser.newContext({ serviceWorkers: "block" });
    try {
      const page = await context.newPage();
      await page.goto(`${host.base}theatre.html`);
      host.substitute();
      let downloads = 0;
      page.on("download", () => {
        downloads++;
      });
      await page.locator("#th-save-reading").click();
      await page.waitForFunction(() =>
        document
          .querySelector("#th-action-status")
          .textContent.includes("does not match this edition"),
      );
      assert.equal(downloads, 0);
      console.log(`${name}: substituted source rejected before download`);
    } finally {
      await context.close();
      await host.close();
    }
  } finally {
    await browser.close();
  }
}
await writeFile(path.join(output, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
