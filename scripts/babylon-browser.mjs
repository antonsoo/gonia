// biome-ignore-all lint/performance/useDomNodeTextContent: Inspect actual visible learner content.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const out = path.resolve(process.argv[2] ?? "/tmp/gonia-babylon");
const external = process.argv[3];
if (external && (!external.startsWith("https://") || !external.endsWith("/")))
  throw new Error("Use a canonical HTTPS base ending in /.");
await mkdir(out, { recursive: true });
const manifest = JSON.parse(await readFile("public/sources/babylon/manifest.json", "utf8"));
const sha = (b) => createHash("sha256").update(b).digest("hex");
const worker = await readFile("dist/sw.js", "utf8");
const edition = worker.match(/const EDITION = "([a-f0-9]+)";/)[1];
const inventory = JSON.parse(worker.match(/const FILES = (\[.*\]);/)[1]);
const report = {
  checkedAt: new Date().toISOString(),
  scope: external
    ? "Public HTTPS workflows; browser networking disabled for offline review"
    : "Local production; actual origin stopped for offline review",
  base: external ?? null,
  edition,
  graphicsEnvironment: Object.fromEntries(
    [
      "VK_DRIVER_FILES",
      "VK_ICD_FILENAMES",
      "EGL_PLATFORM",
      "LIBGL_ALWAYS_SOFTWARE",
      "GALLIUM_DRIVER",
    ]
      .filter((key) => process.env[key] !== undefined)
      .map((key) => [key, process.env[key]]),
  ),
  configurations: [],
  guards: [],
};
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".pdf": "application/pdf",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".mesh": "application/octet-stream",
};
async function serve() {
  if (external) return { base: external, offline() {}, close: async () => {} };
  let online = true;
  const server = createServer(async (req, res) => {
    if (!online) {
      req.socket.destroy();
      return;
    }
    try {
      const u = new URL(req.url, "http://review"),
        f = decodeURIComponent(u.pathname).replace(/^\/gonia\//, "") || "index.html";
      if (!u.pathname.startsWith("/gonia/") || f.includes("..")) throw Error("path");
      res
        .writeHead(200, {
          "Content-Type": mime[path.extname(f)] ?? "application/octet-stream",
          "Cache-Control": "no-store",
        })
        .end(await readFile(path.join("dist", f)));
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    base: `http://127.0.0.1:${server.address().port}/gonia/`,
    offline() {
      online = false;
      server.closeAllConnections();
    },
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
async function ready(p) {
  await p.locator("#bb-source-status").waitFor();
  await p.waitForFunction(() =>
    /^Verified source/.test(document.querySelector("#bb-source-status").textContent),
  );
}
async function sourceHash(p, selector) {
  const data = await p.locator(selector).evaluate(async (img) => {
    const bytes = await (await fetch(img.src)).arrayBuffer();
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (v) =>
      v.toString(16).padStart(2, "0"),
    ).join("");
    return {
      file: img.dataset.source,
      bytes: bytes.byteLength,
      hash,
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
  });
  assert.equal(data.hash, manifest.files[data.file].sha256);
  assert.equal(data.bytes, manifest.files[data.file].bytes);
  assert.ok(data.width > 0 && data.height > 0);
  return data;
}
async function download(p, selector, file) {
  const event = p.waitForEvent("download");
  await p.locator(selector).click();
  const d = await event;
  await d.saveAs(path.join(out, file));
  assert.equal(await d.failure(), null);
  return readFile(path.join(out, file));
}
async function stateOf(p) {
  return p.evaluate(() => ({
    supplied: document.querySelector("#bb-supplied").checked,
    width: Number(document.querySelector("#bb-width").value),
    height: Number(document.querySelector("#bb-height").value),
    base: Number(document.querySelector("#bb-base").value),
    ruler: document.querySelector("#bb-ruler").value,
    selected: Number(
      document.querySelector('[data-bb-select][aria-pressed="true"]').dataset.bbSelect,
    ),
    page: document.querySelector("#bb-page").value,
  }));
}
async function geometry(p) {
  return p.locator("[data-bb-level]").evaluateAll((groups) =>
    groups.map((g) => ({
      level: Number(g.dataset.bbLevel),
      kind: g.dataset.bbKind,
      status: g.dataset.bbStatus,
      width: g.hasAttribute("data-bb-width") ? Number(g.dataset.bbWidth) : null,
      height: g.hasAttribute("data-bb-height") ? Number(g.dataset.bbHeight) : null,
      bottom: g.hasAttribute("data-bb-bottom") ? Number(g.dataset.bbBottom) : null,
      rectWidth: Number(g.querySelector("rect").getAttribute("width")),
      rectHeight: Number(g.querySelector("rect").getAttribute("height")),
    })),
  );
}
async function overflow(p) {
  assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
}
async function fontsReady(p) {
  // Firefox with page JavaScript disabled does not settle page promises even
  // after its fonts are loaded. Poll synchronous browser state from Node.
  const until = Date.now() + 15000;
  while (Date.now() < until) {
    if (await p.evaluate(() => document.fonts.status === "loaded")) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("The native document's fonts did not finish loading.");
}
async function scanReady(p) {
  await p.locator("#bb-load-scan").click();
  await p.waitForFunction(
    () =>
      !document.querySelector("#bb-scan-controls").disabled ||
      /needs WebGL|does not match|failed|unavailable/.test(
        document.querySelector("#bb-scan-status").textContent,
      ),
  );
  assert.equal(
    await p.locator("#bb-turn").isEnabled(),
    true,
    await p.locator("#bb-scan-status").innerText(),
  );
  assert.equal(await p.locator("#bb-canvas").getAttribute("data-triangles"), "189027");
  assert.equal(await p.evaluate(() => document.activeElement.id), "bb-turn");
}
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await engine.launch({ headless: true });
  try {
    for (const width of [1440, 375]) {
      const server = await serve(),
        prefix = `${name}-${width}`;
      await mkdir(path.join(out, prefix), { recursive: true });
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        acceptDownloads: true,
      });
      const p = await context.newPage(),
        errors = [],
        csp = [],
        samples = [],
        sources = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await context.addInitScript(() =>
        document.addEventListener("securitypolicyviolation", (e) => {
          window.__csp ??= [];
          window.__csp.push({ directive: e.violatedDirective, blocked: e.blockedURI });
        }),
      );
      const sample = async (label) => {
        const csv = `${prefix}/${label}.csv`;
        await download(p, "#bb-csv", csv);
        samples.push({ label, state: await stateOf(p), csv, geometry: await geometry(p) });
      };
      try {
        await p.goto(server.base);
        await p.getByRole("link", { name: "Babylon", exact: true }).click();
        await ready(p);
        await p.waitForFunction(
          () =>
            document.querySelector("#bb-plan-image").dataset.sourceVerified === "true" &&
            document.querySelector("#bb-scan-poster").dataset.sourceVerified === "true",
        );
        await p.evaluate(() => document.fonts.ready);
        await overflow(p);
        assert.match(await p.locator("#bb-level-detail").innerText(), /18 m/);
        assert.match(await p.locator("#bb-level-detail").innerText(), /9.52 m/);
        await sample("initial");
        await p.locator("#bb-bench").screenshot({ path: path.join(out, prefix, "comparison.png") });
        await p.locator("#bb-supplied").focus();
        await p.keyboard.press("Space");
        await p.locator('[data-bb-select="5"]').click();
        assert.match(await p.locator("#bb-total").innerText(), /Total unresolved/);
        assert.match(await p.locator("#bb-level-detail").innerText(), /Unknown/);
        assert.equal(await p.locator("#bb-height").isDisabled(), true);
        await sample("unknown");
        await p.locator("#bb-supplied").check();
        await p.locator("#bb-width").focus();
        await p.keyboard.press("End");
        await p.locator("#bb-height").focus();
        await p.keyboard.press("End");
        assert.match(await p.locator("#bb-total").innerText(), /^102 m/);
        await sample("tall");
        await p.locator("#bb-height").focus();
        await p.keyboard.press("Home");
        assert.match(await p.locator("#bb-total").innerText(), /^85.5 m/);
        await sample("short");
        await p.locator("#bb-base").selectOption("900");
        await p.locator("#bb-ruler").selectOption("terrace");
        await sample("different-ruler");
        await p.locator("#bb-conventional").click();
        await p.locator('[data-bb-select="6"]').click();
        await p.locator(".bb-table-details summary").click();
        assert.match(await p.locator("#bb-table").innerText(), /24 × 22.5 × 15/);
        await sample("sanctuary");
        const before = await stateOf(p);
        await p.locator("#bb-base").selectOption("915");
        await p.goBack();
        await ready(p);
        assert.deepEqual(await stateOf(p), before);
        await p.locator("#bb-base").selectOption("915");
        await p.locator("#bb-ruler").selectOption("overall");
        await p.locator('[data-bb-select="1"]').click();
        await p.locator('[data-bb-plan="1"]').click();
        assert.match(await p.locator("#bb-plan-result").innerText(), /80% wider/);
        await p.locator('[data-bb-plan="1.8"]').focus();
        await p.keyboard.press("Enter");
        assert.match(await p.locator("#bb-plan-result").innerText(), /not independent proof/);
        const readings = [];
        for (let i = 0; i < 5; i++) {
          await p.locator("#bb-reading").selectOption(String(i));
          readings.push(await p.locator("#bb-reading-text").innerText());
        }
        const words = [];
        for (let i = 0; i < 8; i++) {
          await p.locator(`[data-bb-word="${i}"]`).click();
          words.push(await p.locator("#bb-word-note").innerText());
        }
        sources.push(await sourceHash(p, "#bb-plan-image"), await sourceHash(p, "#bb-scan-poster"));
        for (const id of [
          "scheil-300",
          "scheil-304",
          "scheil-305",
          "tcl6-lix",
          "tcl6-lx",
          "stele-photo",
          "stele-drawing",
        ]) {
          await p.locator("#bb-page").selectOption(id);
          await ready(p);
          sources.push(await sourceHash(p, "#bb-source-image"));
        }
        await p.locator("#bb-page-zoom").focus();
        await p.keyboard.press("End");
        assert.equal(await p.locator("#bb-page-zoom").inputValue(), "250");
        await p.locator("#bb-source-pan").focus();
        await p.keyboard.press("ArrowRight");
        await p.waitForFunction(() => document.querySelector("#bb-source-pan").scrollLeft > 0);
        await overflow(p);
        await scanReady(p);
        const pixels = async () =>
          p.locator("#bb-canvas").evaluate((c) => c.toDataURL("image/png"));
        const first = await pixels();
        await p.locator("#bb-turn").focus();
        await p.keyboard.press("ArrowRight");
        assert.equal(await p.locator("#bb-turn").inputValue(), "1");
        assert.notEqual(await pixels(), first);
        await p.locator("#bb-front").click();
        await p.locator("#bb-upper").click();
        const textured = await pixels();
        await p.locator("#bb-texture").focus();
        await p.keyboard.press("Space");
        const plain = await pixels();
        assert.notEqual(plain, textured);
        await p.locator("#bb-light").fill("60");
        assert.notEqual(await pixels(), plain);
        await p.locator("#bb-texture").check();
        await p
          .locator("#bb-canvas")
          .screenshot({ path: path.join(out, prefix, "source-scan.png") });
        await p.locator("#bb-page").selectOption("tcl6-lx");
        await ready(p);
        await p.locator("#bb-supplied").uncheck();
        await p.locator('[data-bb-select="5"]').click();
        await sample("final");
        const record = JSON.parse(await download(p, "#bb-json", `${prefix}/record.json`));
        assert.deepEqual(record.state, await stateOf(p));
        await p.locator("#bb-conventional").click();
        await p.locator("#bb-file").setInputFiles(path.join(out, prefix, "record.json"));
        await p.waitForFunction(
          () =>
            document.querySelector("#bb-save-status").textContent ===
            "Saved tower comparison restored.",
        );
        await ready(p);
        assert.deepEqual(await stateOf(p), record.state);
        const bad = path.join(out, prefix, "invalid.json");
        await writeFile(bad, JSON.stringify({ ...record, state: { ...record.state, height: 0 } }));
        await p.locator("#bb-file").setInputFiles(bad);
        await p.waitForFunction(() =>
          document.querySelector("#bb-save-status").textContent.startsWith("Record left unchanged"),
        );
        assert.deepEqual(await stateOf(p), record.state);
        await p.locator("#bb-share").click();
        const link = await p.locator("#bb-share-url").inputValue();
        const linked = await context.newPage();
        await linked.goto(link);
        await ready(linked);
        assert.deepEqual(await stateOf(linked), record.state);
        await linked.close();
        // The original tab keeps its independent inspection controls.
        await p.locator("#bb-upper").click();
        await p.locator("#bb-texture").uncheck();
        await p.locator("#bb-light").fill("-35");
        const svg = await download(p, "#bb-svg", `${prefix}/plate.svg`);
        assert(svg.includes(Buffer.from("gonia-babylon-1")));
        const html = await download(p, "#bb-save", `${prefix}/reading.html`);
        assert(html.includes(Buffer.from("Your inspection of the source scan")));
        const saved = await browser.newContext({
          javaScriptEnabled: false,
          viewport: { width, height: 1000 },
          acceptDownloads: true,
        });
        const automatic = [];
        await saved.route(/^https?:/, (route) => {
          automatic.push(route.request().url());
          return route.abort();
        });
        const q = await saved.newPage();
        await q.goto(pathToFileURL(path.join(out, prefix, "reading.html")).href);
        await fontsReady(q);
        assert.equal(await q.locator(".source img").count(), 7);
        assert.equal(await q.locator(".scan img").count(), 1);
        assert.equal(await q.locator("script").count(), 0);
        assert.equal(
          await q
            .locator(".source img")
            .evaluateAll((imgs) => imgs.every((i) => i.complete && i.naturalWidth > 0)),
          true,
        );
        assert.deepEqual(automatic, []);
        await q.screenshot({ path: path.join(out, prefix, "saved-reading.png") });
        await download(q, 'a[download="gonia-babylon-comparison.csv"]', `${prefix}/embedded.csv`);
        await download(q, 'a[download="gonia-babylon-record.json"]', `${prefix}/embedded.json`);
        const sourcePdf = await download(
          q,
          'a[download="pedersen2024.pdf"]',
          `${prefix}/embedded-source.pdf`,
        );
        assert.equal(sha(sourcePdf), manifest.files["pedersen2024.pdf"].sha256);
        if (name === "chromium" && width === 1440)
          await q.pdf({
            path: path.join(out, prefix, "reading.pdf"),
            printBackground: true,
            preferCSSPageSize: true,
          });
        await q.goto(pathToFileURL(path.join(out, prefix, "plate.svg")).href);
        await fontsReady(q);
        assert.equal(await q.locator("svg").count(), 3);
        await q.screenshot({ path: path.join(out, prefix, "saved-plate.png") });
        await saved.close();
        const violations = (
          await new AxeBuilder({ page: p })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
            .analyze()
        ).violations;
        assert.deepEqual(
          violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          [],
        );
        await overflow(p);
        await p.waitForFunction(
          () =>
            document.querySelector("#bb-offline").textContent === "Workshop & source saved offline",
          null,
          { timeout: 60000 },
        );
        const cache = await p.evaluate(
          async ({ edition, inventory }) => {
            const worker = navigator.serviceWorker.controller;
            if (!worker) throw Error("No controller");
            const c = await caches.open(`gonia-${edition}`),
              keys = (await c.keys()).map((r) => new URL(r.url).pathname).sort();
            if (JSON.stringify(keys) !== JSON.stringify([...inventory].sort()))
              throw Error("Incomplete current inventory");
            return { controller: worker.scriptURL, cache: `gonia-${edition}`, files: keys.length };
          },
          { edition, inventory },
        );
        csp.push(...(await p.evaluate(() => window.__csp ?? [])));
        assert.deepEqual(csp, []);
        assert.deepEqual(errors, []);
        if (external) await context.setOffline(true);
        else server.offline();
        await p.reload();
        await ready(p);
        await scanReady(p);
        await p.locator("#bb-turn").fill("30");
        await p.locator("#bb-page").selectOption("scheil-304");
        await ready(p);
        await sourceHash(p, "#bb-source-image");
        await download(p, "#bb-csv", `${prefix}/offline.csv`);
        await download(p, "#bb-svg", `${prefix}/offline.svg`);
        await download(p, "#bb-save", `${prefix}/offline.html`);
        await p.getByRole("link", { name: /^Gonia/ }).click();
        await p.locator("#workshop").waitFor();
        await p.getByRole("link", { name: "Babylon", exact: true }).click();
        await ready(p);
        assert.deepEqual(errors, []);
        report.configurations.push({
          engine: name,
          version: browser.version(),
          width,
          samples,
          sources,
          readings,
          words,
          cache,
          record: record.state,
          savedHtmlSha256: sha(html),
          savedHtmlBytes: html.length,
          svgSha256: sha(svg),
          scan: {
            triangles: 189027,
            textureAndLightAndCameraChangePixels: true,
            reflection: "source orientation manually compared with figure 1",
          },
          offline: true,
          applicationErrors: errors,
          csp,
        });
        await writeFile(
          path.join(out, "progress.json"),
          `${JSON.stringify({ ...report, partial: true }, null, 2)}\n`,
        );
        console.log(
          `${name} ${width}: controls, real scan, complete sources, native files and offline journey passed`,
        );
      } finally {
        await context.close();
        await server.close();
      }
    }
    // Source guards run without a worker so injected responses reach the actual
    // source verifier rather than a previously verified cache entry.
    const server = await serve(),
      context = await browser.newContext({ serviceWorkers: "block", acceptDownloads: true }),
      p = await context.newPage();
    try {
      await p.goto(`${server.base}babylon.html`);
      await ready(p);
      let release;
      const held = new Promise((resolve) => {
        release = resolve;
      });
      let started;
      const arrived = new Promise((resolve) => {
        started = resolve;
      });
      await p.route("**/sources/babylon/scheil-305.jpg", async (route) => {
        started();
        await held;
        await route.continue();
      });
      await p.locator("#bb-page").selectOption("scheil-305");
      await arrived;
      await p.locator("#bb-page").selectOption("tcl6-lix");
      await ready(p);
      release();
      await p.waitForTimeout(300);
      assert.equal((await sourceHash(p, "#bb-source-image")).file, "tcl6-lix.jpg");
      const wrong = await readFile("public/sources/babylon/tcl6-lix.jpg");
      await p.route("**/sources/babylon/tcl6-lx.jpg", (route) =>
        route.fulfill({ status: 200, contentType: "image/jpeg", body: wrong }),
      );
      await p.locator("#bb-page").selectOption("tcl6-lx");
      await p.waitForFunction(() =>
        /does not match/.test(document.querySelector("#bb-source-status").textContent),
      );
      assert.equal(await p.locator("#bb-source-image").isHidden(), true);
      let downloads = 0;
      p.on("download", () => downloads++);
      await p.locator("#bb-save").click();
      await p.waitForFunction(() =>
        /does not match/.test(document.querySelector("#bb-save-status").textContent),
      );
      assert.equal(downloads, 0);
      await p.unroute("**/sources/babylon/tcl6-lx.jpg");
      await p.locator("#bb-retry").click();
      await ready(p);
      assert.equal((await sourceHash(p, "#bb-source-image")).file, "tcl6-lx.jpg");
      await p.route("**/sources/babylon/stele.mesh", (route) =>
        route.fulfill({ status: 200, body: Buffer.from("substituted mesh") }),
      );
      await p.locator("#bb-load-scan").click();
      await p.waitForFunction(() =>
        /does not match/.test(document.querySelector("#bb-scan-status").textContent),
      );
      assert.equal(await p.locator("#bb-turn").isDisabled(), true);
      assert.equal(await p.locator("#bb-canvas").isHidden(), true);
      await p.unroute("**/sources/babylon/stele.mesh");
      await scanReady(p);
      report.guards.push({
        engine: name,
        lateSourceCannotReplaceSelection: true,
        validWrongJpegRefused: true,
        illustratedSaveRefused: true,
        sourceRetry: true,
        wrongMeshRefusedBeforeDisplay: true,
        meshRetry: true,
      });
    } finally {
      await context.close();
      await server.close();
    }
    const fallbackServer = await serve(),
      fallback = await browser.newContext({ serviceWorkers: "block", acceptDownloads: true });
    await fallback.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (type === "webgl2") return null;
        return original.call(this, type, ...args);
      };
    });
    try {
      const p = await fallback.newPage();
      await p.goto(`${fallbackServer.base}babylon.html?supplied=0`);
      await ready(p);
      await p.locator("#bb-load-scan").click();
      assert.match(await p.locator("#bb-scan-status").innerText(), /needs WebGL 2/);
      assert.equal(await p.locator("#bb-scan-poster").isVisible(), true);
      assert.match(await p.locator("#bb-total").innerText(), /Total unresolved/);
      await download(p, "#bb-save", `${name}-without-webgl.html`);
      report.guards.push({
        engine: name,
        webglUnavailable:
          "Numerical workshop, verified photograph and actual illustrated reading still work",
      });
    } finally {
      await fallback.close();
      await fallbackServer.close();
    }
  } finally {
    await browser.close();
  }
}
await writeFile(path.join(out, "review.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Review: ${out}/review.json`);
