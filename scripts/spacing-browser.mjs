// biome-ignore-all lint/performance/useDomNodeTextContent: Verify visible learner-facing text.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const output = process.argv[2] ?? "/tmp/gonia-spacing-review/browser.json";
const assets = path.join(path.dirname(output), "assets");
await mkdir(assets, { recursive: true });
let available = true;
let substitute = false;
let rejected = 0;
const server = http.createServer(async (req, res) => {
  if (!available) {
    rejected++;
    req.socket.destroy();
    return;
  }
  const url = new URL(req.url, "http://localhost");
  const relative = decodeURIComponent(url.pathname).replace(/^\/gonia\//, "") || "index.html";
  if (relative.includes("..") || !url.pathname.startsWith("/gonia/")) {
    res.writeHead(404).end();
    return;
  }
  try {
    const served =
      substitute && relative.endsWith("krohn-082.jpg") ? relative.replace("082", "083") : relative;
    const body = await readFile(path.join("dist", served));
    const types = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".svg": "image/svg+xml",
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".woff2": "font/woff2",
      ".ttf": "font/ttf",
    };
    res
      .writeHead(200, {
        "Content-Type": types[path.extname(relative)] ?? "text/plain",
        "Cache-Control": "no-cache",
      })
      .end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}/gonia/`;
const report = {
  checkedAt: new Date().toISOString(),
  scope:
    "Both built pages; actual rendered SVG geometry, native controls, exact embedded scans, deliberate alteration, failed source substitution and origin-disabled offline journeys. Geometry checked independently by spacing-oracle.py.",
  configurations: [],
};
const systems = ["pycnostyle", "systyle", "eustyle", "diastyle", "araeostyle"];
const hash = (data) => createHash("sha256").update(data).digest("hex");
const sourceHashes = await Promise.all(
  [82, 83, 84, 85].map(async (n) => hash(await readFile(`public/sources/spacing/krohn-0${n}.jpg`))),
);
async function setRange(page, id, value) {
  const range = page.locator(`#${id}`);
  assert.equal(await range.getAttribute("max"), String(value));
  await range.focus();
  await page.keyboard.press("End");
  assert.equal(await range.inputValue(), String(value));
}
async function rendered(page, parameters) {
  const data = await page.locator(".spacing-plate").evaluate((svg) => {
    const circles = [...svg.querySelectorAll(".spacing-plan-column circle")];
    const first = circles[0];
    const radius = Number(first.getAttribute("r"));
    const diameter = Number(svg.querySelector(".spacing-column").dataset.diameterM);
    const scale = (radius * 2) / diameter;
    const origin = Number(first.getAttribute("cx")) - radius;
    return {
      axes: circles.map((c) => (Number(c.getAttribute("cx")) - origin) / scale),
      diameter,
      height: svg.querySelector(".spacing-column path").getBBox().height / scale,
    };
  });
  const labels = await page.locator(".spacing-plate").evaluate((svg) => {
    const box = svg.getBoundingClientRect();
    return [...svg.querySelectorAll("text")].map((text) => {
      const r = text.getBoundingClientRect();
      return {
        text: text.textContent,
        contained:
          r.left >= box.left - 1 &&
          r.right <= box.right + 1 &&
          r.top >= box.top - 1 &&
          r.bottom <= box.bottom + 1,
      };
    });
  });
  assert(
    labels.every((label) => label.contained),
    JSON.stringify(labels),
  );
  return { parameters, ...data };
}
async function save(page, name) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#spacing-save").click(),
  ]);
  const file = path.resolve(path.dirname(output), name);
  await download.saveAs(file);
  const html = await readFile(file, "utf8");
  const images = [...html.matchAll(/data:image\/jpeg;base64,([^"\s]+)/g)];
  assert.equal(images.length, 4);
  assert.deepEqual(
    images.map((match) => hash(Buffer.from(match[1], "base64"))),
    sourceHashes,
  );
  return { file, html, sha256: hash(html) };
}
try {
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await engine.launch();
    try {
      for (const width of [1440, 375]) {
        available = true;
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          acceptDownloads: true,
        });
        const page = await context.newPage();
        const errors = [],
          external = [],
          accessibility = [],
          geometry = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("request", (r) => {
          if (!r.url().startsWith(base) && !r.url().startsWith("blob:")) external.push(r.url());
        });
        await page.goto(
          `${base}spacing.html?system=eustyle&n=6&hold=front&front=18&centre=wide#spacing-workshop`,
        );
        await page.waitForFunction(
          () =>
            document.querySelector("#spacing-offline").textContent ===
            "Workshop & source saved offline",
        );
        await page.evaluate(() => document.fonts.ready);
        const landing = await page.locator("#spacing-title").boundingBox();
        assert(landing.y >= 0 && landing.y < 180);
        assert((await page.locator("#spacing-numbers").innerText()).includes("9.5 m"));
        const audit = async (label) => {
          const result = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze();
          assert.deepEqual(
            result.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
            [],
            label,
          );
          assert(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            label,
          );
          accessibility.push(label);
        };
        await audit("source eustyle");
        if (name === "chromium") {
          await page
            .locator("#spacing-workshop")
            .screenshot({ path: path.join(assets, `spacing-${width}.png`) });
          await page
            .locator("#spacing-drawing-area")
            .screenshot({ path: path.join(assets, `drawing-${width}.png`) });
        }
        const baseline = await save(page, `${name}-${width}-eustyle.html`);
        for (const system of systems) {
          await page.locator(`[data-system="${system}"]`).focus();
          await page.keyboard.press("Space");
          assert.equal(
            await page.locator(`[data-system="${system}"]`).getAttribute("aria-pressed"),
            "true",
          );
          for (const columns of [4, 6, 8]) {
            await page.selectOption("#column-count", String(columns));
            for (const basis of ["front", "diameter"]) {
              await page.locator(`[name="scale-basis"][value="${basis}"]`).check();
              geometry.push(
                await rendered(page, {
                  system,
                  columns,
                  basis,
                  front: 18,
                  diameter: 1,
                  wideGap: 4,
                  equalCentre: false,
                }),
              );
            }
          }
          for (const dimension of ["axis", "diameter", "height", "front", "gap"]) {
            await page.locator(`[data-dimension="${dimension}"]`).click();
            await rendered(page, { system });
          }
        }
        // Actual user alteration: the diameter grows at fixed front, and the front shrinks at fixed diameter.
        await page.locator("#try-eustyle").click();
        await page.locator("#equal-centre").check();
        assert((await page.locator("#alteration").innerText()).includes("Your alteration"));
        assert((await page.locator("#spacing-numbers").innerText()).includes("1.043 m"));
        assert((await page.locator("#module-result").innerText()).includes("0.75 D"));
        geometry.push(
          await rendered(page, {
            system: "eustyle",
            columns: 6,
            basis: "front",
            front: 18,
            diameter: 1,
            wideGap: 4,
            equalCentre: true,
          }),
        );
        await page.locator('[name="scale-basis"][value="diameter"]').check();
        assert((await page.locator("#spacing-numbers").innerText()).includes("17.25 m"));
        geometry.push(
          await rendered(page, {
            system: "eustyle",
            columns: 6,
            basis: "diameter",
            front: 18,
            diameter: 1,
            wideGap: 4,
            equalCentre: true,
          }),
        );
        await page.locator("#spacing-share").click();
        const shared = new URL(page.url());
        assert.equal(shared.searchParams.get("centre"), "equal");
        await page.reload();
        assert(await page.locator("#equal-centre").isChecked());
        const altered = await save(page, `${name}-${width}-altered.html`);
        assert(altered.html.includes("Deliberately altered example"));
        assert(altered.html.includes("17.25 m"));
        await audit("deliberately altered centre");
        if (width === 375) {
          await page.locator("#view-spacing-drawing").click();
          assert.equal(await page.evaluate(() => document.activeElement.id), "selected-system");
          const top = await page.locator("#selected-system").boundingBox();
          assert(top.y >= 0 && top.y < 180);
        }
        await page.locator('[data-system="araeostyle"]').click();
        await page.selectOption("#column-count", "8");
        await setRange(page, "wide-gap", 6);
        await setRange(page, "lower-diameter", 2);
        geometry.push(
          await rendered(page, {
            system: "araeostyle",
            columns: 8,
            basis: "diameter",
            front: 18,
            diameter: 2,
            wideGap: 6,
            equalCentre: false,
          }),
        );
        assert((await page.locator("#alteration").innerText()).includes("no fixed numerical gap"));
        await audit("chosen wide gap");
        for (const sourcePage of [64, 65, 66, 67]) {
          await page.locator(`[data-page="${sourcePage}"]`).click();
          const img = page.locator("#source-figure img");
          await img.scrollIntoViewIfNeeded();
          await img.evaluate((el) => el.decode());
          assert((await img.getAttribute("alt")).includes(`page ${sourcePage}`));
        }
        await page.locator('[data-source-page="66"]').click();
        assert.equal(await page.evaluate(() => document.activeElement.id), "source-title");
        await audit("source page");
        // Drop the real origin sockets: both cached entry points must remain distinct.
        const prior = rejected;
        available = false;
        await page.reload();
        assert(rejected > prior);
        assert((await page.locator("#selected-system").innerText()).includes("Araeostyle"));
        await page.locator('nav a[href="./#workshop"]').click();
        assert.equal(await page.locator("#workshop-title").innerText(), "The corner workshop");
        await page.locator('nav a[href="./spacing.html"]').click();
        assert.equal(await page.locator("#spacing-title").innerText(), "The space between columns");
        const offline = await save(page, `${name}-${width}-offline.html`);
        assert.equal(offline.sha256, baseline.sha256);
        const saved = await context.newPage();
        const requests = [];
        saved.on("request", (r) => {
          if (!r.url().startsWith("file:") && !r.url().startsWith("data:")) requests.push(r.url());
        });
        await saved.goto(`file://${altered.file}`);
        assert.equal(await saved.locator(".source-page").count(), 4);
        for (const img of await saved.locator("img").all()) await img.evaluate((el) => el.decode());
        assert(await saved.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        assert.deepEqual(requests, []);
        if (name === "chromium" && width === 1440)
          await saved.pdf({
            path: path.join(path.dirname(output), "altered-reading.pdf"),
            format: "A4",
            printBackground: true,
          });
        assert.deepEqual(errors, []);
        assert.deepEqual(external, []);
        report.configurations.push({
          browser: name,
          version: browser.version(),
          width,
          sharedLanding: landing.y,
          geometry,
          accessibility,
          alteredSharedState: true,
          sourceImagesExact: true,
          standaloneStudyHash: baseline.sha256,
          alteredStudyHash: altered.sha256,
          offlineBothPagesAndExport: true,
          pageErrors: errors,
          externalRequests: external,
        });
        await context.close();
        console.log(`${name} ${width}: geometry, reading, exports and offline workflows passed`);
      }
      available = true;
      substitute = true;
      const context = await browser.newContext();
      const page = await context.newPage();
      let downloads = 0;
      page.on("download", () => downloads++);
      await page.goto(`${base}spacing.html`);
      await page.locator("#spacing-save").click();
      await page.waitForFunction(() =>
        document
          .querySelector("#spacing-action-status")
          .textContent.includes("could not be verified"),
      );
      assert.equal(downloads, 0);
      await page.waitForFunction(() =>
        document.querySelector("#spacing-offline").textContent.includes("unavailable"),
      );
      await context.close();
      substitute = false;
      report.configurations
        .filter((c) => c.browser === name)
        .forEach((c) => {
          c.wrongSourcePageExportRejected = true;
          c.failedOfflineInstallReported = true;
        });
    } finally {
      await browser.close();
    }
  }
} finally {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  `Verified ${report.configurations.length} workflows; rendered geometry retained for the independent oracle.`,
);
