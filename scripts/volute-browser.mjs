import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:4437/gonia/";
const output = path.resolve(process.argv[3] ?? "/tmp/claude-1000/gonia-volute/browser");
await mkdir(output, { recursive: true });
const records = [];
async function download(page, id, dir, name) {
  const pending = page.waitForEvent("download");
  await page.locator(`#${id}`).click();
  const d = await pending;
  assert.equal(await d.failure(), null);
  const file = path.join(dir, name);
  await d.saveAs(file);
  return file;
}
async function caseReview(browser, engine, width) {
  const dir = path.join(output, `${engine}-${width}`);
  await mkdir(dir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width, height: 1000 },
    acceptDownloads: true,
  });
  if (engine === "chromium") await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(base);
  await page.locator("#beam").waitFor();
  const link = page.getByRole("link", { name: "Ionic volute", exact: true });
  await link.focus();
  await page.keyboard.press("Enter");
  await page.locator("#vo-draw").waitFor();
  await page.waitForFunction(() =>
    document.getElementById("vo-source-caption").textContent.includes("Image identity verified"),
  );
  assert.equal(await page.locator("[data-arc]").count(), 4);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: path.join(dir, "opening.png"), fullPage: false });
  await page.getByText("Other starting sheets", { exact: true }).click();
  await page.locator("#vo-empty").click();
  await page.locator('[data-pin="4"]').focus();
  await page.keyboard.press("Enter");
  await page.locator("#vo-draw").focus();
  await page.keyboard.press("Space");
  assert.match(await page.locator("#vo-sequence").textContent(), /Your pins: 4$/);
  await page.locator("#vo-undo").click();
  for (let i = 1; i <= 12; i++) {
    await page.locator(`[data-pin="${i}"]`).focus();
    await page.keyboard.press("Enter");
    await page.locator("#vo-draw").focus();
    await page.keyboard.press("Space");
  }
  assert.equal(await page.locator("[data-arc]").count(), 12);
  assert.match(await page.locator("#vo-result").textContent(), /endpoint is exactly on the eye/);
  assert.match(await page.locator("#vo-join-note").textContent(), /8\.130102°/);
  await page.locator("#vo-join").selectOption("1");
  assert.match(await page.locator("#vo-join-note").textContent(), /0\.447614°/);
  const outline = await page
    .locator("[data-arc]")
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("d")));
  await page.locator("#vo-repair").click();
  assert.match(await page.locator("#vo-repair-note").textContent(), /difference becomes 0°/);
  assert.deepEqual(
    await page.locator("[data-arc]").evaluateAll((nodes) => nodes.map((n) => n.getAttribute("d"))),
    outline,
  );
  assert.equal(await page.locator("#vo-drawing .repair").count(), 1);
  await page.locator("#vo-bench").scrollIntoViewIfNeeded();
  await page.locator("#vo-bench").screenshot({ path: path.join(dir, "bench.png") });
  await page.locator("#vo-page").selectOption("2");
  await page.waitForFunction(() =>
    document.getElementById("vo-source-caption").textContent.includes("plate XV. Whole"),
  );
  await page.locator("#vo-eye").fill("15");
  await page.locator("#vo-eye").press("Tab");
  const addressBeforeCopy = page.url();
  await page.locator("#vo-share").click();
  await page.waitForFunction(() =>
    /copied|Copy this drawing link/.test(document.getElementById("vo-action-status").textContent),
  );
  assert.equal(page.url(), addressBeforeCopy);
  const copied =
    engine === "chromium" ? await page.evaluate(() => navigator.clipboard.readText()) : null;
  if (copied) assert.equal(new URL(copied).searchParams.get("moves"), "1.2.3.4.5.6.7.8.9.10.11.12");
  const json = await download(page, "vo-save-json", dir, "drawing.json");
  await download(page, "vo-save-csv", dir, "measurements.csv");
  await download(page, "vo-save-svg", dir, "compass.svg");
  const html = await download(page, "vo-save-html", dir, "reading.html");
  const native = JSON.parse(await readFile(json, "utf8"));
  assert.deepEqual(
    native.state.moves,
    Array.from({ length: 12 }, (_, i) => i + 1),
  );
  assert.equal(native.state.eye, 15);
  assert.equal(native.state.repair, true);
  await page.locator("#vo-repeat").click();
  assert.match(await page.locator("#vo-result").textContent(), /misses the eye/);
  await page.locator("#vo-open").setInputFiles(json);
  await page.waitForFunction(() =>
    document.getElementById("vo-action-status").textContent.includes("record reopened"),
  );
  assert.equal(await page.locator("#vo-eye").inputValue(), "15");
  assert.equal(await page.locator("#vo-join").inputValue(), "1");
  assert.equal(await page.locator("#vo-repair").getAttribute("aria-pressed"), "true");
  const sequence = await page.locator("#vo-sequence").textContent();
  await page.locator("#vo-open").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"format":"wrong"}'),
  });
  await page.waitForFunction(() =>
    document.getElementById("vo-action-status").textContent.includes("version 1"),
  );
  assert.equal(await page.locator("#vo-sequence").textContent(), sequence);
  for (let i = 0; i < 6; i++) {
    await page.locator("#vo-page").selectOption(String(i));
    await page.waitForFunction(
      (i) =>
        document
          .getElementById("vo-source-caption")
          .textContent.includes("Image identity verified") &&
        document.getElementById("vo-page").value === String(i),
      i,
    );
    assert.equal(
      await page.locator("#vo-source-frame img").evaluate((img) => img.naturalHeight),
      2200,
    );
  }
  await page.locator("#vo-page").selectOption("6");
  await page.waitForFunction(() =>
    document.getElementById("vo-source-caption").textContent.includes("Whole museum photograph"),
  );
  assert.equal(
    await page.locator("#vo-source-frame img").evaluate((img) => img.naturalHeight),
    3790,
  );
  await page.locator("#vo-zoom").click();
  await page.locator("#vo-source-frame").focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(200);
  assert.ok(
    await page.locator("#vo-source-frame").evaluate((e) => e.scrollLeft > 0 && e.scrollTop > 0),
  );
  await page.locator("#vo-zoom").click();
  await page.waitForFunction(
    () => document.getElementById("vo-offline").textContent === "Workshop & source saved offline",
    null,
    { timeout: 60000 },
  );
  const cache = await page.evaluate(async () => {
    const names = await caches.keys(),
      name = names.find((n) => n.startsWith("gonia-"));
    const saved = await caches.open(name);
    return { name, files: (await saved.keys()).map((r) => new URL(r.url).pathname) };
  });
  assert.ok(cache.files.includes("/gonia/volute.html"));
  assert.equal(cache.files.filter((f) => f.startsWith("/gonia/sources/volute/")).length, 8);
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  assert.deepEqual(
    axe.violations.map((v) => ({ id: v.id, nodes: v.nodes.length })),
    [],
  );
  const savedPage = await context.newPage(),
    external = [];
  savedPage.on("request", (r) => {
    if (/^https?:/.test(r.url())) external.push(r.url());
  });
  await savedPage.goto(pathToFileURL(html).href);
  await savedPage.evaluate(() => document.fonts.ready);
  assert.equal(await savedPage.locator("script").count(), 0);
  assert.equal(await savedPage.locator(".source img").count(), 7);
  assert.deepEqual(external, []);
  if (engine === "chromium" && width === 1440) {
    await savedPage.pdf({
      path: path.join(dir, "reading.pdf"),
      format: "A4",
      printBackground: true,
    });
    await savedPage.screenshot({ path: path.join(dir, "portable.png"), fullPage: false });
  }
  const portableLink = await savedPage
    .getByRole("link", { name: "Reopen this sequence online" })
    .getAttribute("href");
  assert.equal(new URL(portableLink).searchParams.get("moves"), native.state.moves.join("."));
  if (copied) assert.equal(new URL(portableLink).search, new URL(copied).search);
  await savedPage.close();
  // Restore through the actual native link embedded in the downloaded reading.
  const shared = new URL(portableLink);
  shared.protocol = new URL(base).protocol;
  shared.host = new URL(base).host;
  await context.setOffline(true);
  await page.goto(shared.href);
  await page.locator("#vo-draw").waitFor();
  assert.equal(await page.locator("[data-arc]").count(), 12);
  assert.match(await page.locator("#vo-result").textContent(), /exactly on the eye/);
  await page.waitForFunction(() =>
    document.getElementById("vo-source-caption").textContent.includes("Image identity verified"),
  );
  await download(page, "vo-save-html", dir, "offline-reading.html");
  await page.getByRole("link", { name: "Doric corner", exact: true }).click();
  await page.locator("#beam").waitFor();
  await page.locator("#beam").fill("2.5");
  assert.match(await page.locator("#delta-value").textContent(), /0\.75/);
  await page.getByRole("link", { name: "Ionic volute", exact: true }).click();
  await page.locator("#vo-draw").waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errors, []);
  records.push({
    engine,
    width,
    keyboardArcs: 12,
    explicitShareWithoutNavigation: true,
    portableLinkReopenedOffline: true,
    downloads: 5,
    printedSourcePages: 6,
    museumPhotographs: 1,
    sourceKeyboardPan: true,
    zeroScriptPortable: true,
    externalPortableRequests: external.length,
    offlineReloadAndDownloads: true,
    rootOfflineNavigation: true,
    axeViolations: axe.violations.length,
    cacheName: cache.name,
    cacheFiles: cache.files.length,
    pageErrors: errors,
  });
  await context.close();
}
const [chrome, fox] = await Promise.all([chromium.launch(), firefox.launch()]);
try {
  for (const [browser, engine] of [
    [chrome, "chromium"],
    [fox, "firefox"],
  ]) {
    await Promise.all([1440, 375].map((width) => caseReview(browser, engine, width)));
  }
  // Network-level evidence must use a context outside the service worker.
  const context = await chrome.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  await context.route("**/sources/volute/krohn-071.jpg", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 650));
    await route.continue();
  });
  await page.goto(new URL("volute.html", base).href);
  await page.locator("#vo-page").selectOption("2");
  await page.waitForFunction(() =>
    document.getElementById("vo-source-caption").textContent.includes("plate XV. Whole"),
  );
  await page.waitForTimeout(900);
  assert.match(await page.locator("#vo-source-caption").textContent(), /plate XV\. Whole/);
  await context.route("**/sources/volute/krohn-072.jpg", (route) =>
    route.fulfill({ status: 200, contentType: "image/jpeg", body: "wrong edition" }),
  );
  await page.locator("#vo-page").selectOption("1");
  await page.waitForFunction(() =>
    document.getElementById("vo-source-caption").textContent.includes("does not match"),
  );
  assert.equal(await page.locator("#vo-source-frame img").count(), 0);
  await context.unroute("**/sources/volute/krohn-072.jpg");
  await page.locator("#vo-page").selectOption("2");
  await page.locator("#vo-page").selectOption("1");
  await page.waitForFunction(() =>
    document.getElementById("vo-source-caption").textContent.includes("Image identity verified"),
  );
  let unexpectedDownload = false;
  page.on("download", () => {
    unexpectedDownload = true;
  });
  await context.route("**/fonts/IBMPlexSans-Regular.woff2", (route) =>
    route.fulfill({ status: 200, contentType: "font/woff2", body: "substituted font" }),
  );
  await page.locator("#vo-save-svg").click();
  await page.waitForFunction(() =>
    document.getElementById("vo-action-status").textContent.includes("does not match"),
  );
  assert.equal(unexpectedDownload, false);
  await context.unroute("**/fonts/IBMPlexSans-Regular.woff2");
  await download(page, "vo-save-svg", output, "retried-compass.svg");
  records.push({
    sourceRace: "late first page cannot replace selected later plate",
    substitutedSource: "rejected with no stale image",
    substitutedFont: "export withheld",
    retry: "same source and export succeed after bytes restored",
  });
  await context.close();
  await writeFile(
    path.join(output, "review.json"),
    `${JSON.stringify({ base, scope: "Local built edition; no public deployment claim", records }, null, 2)}\n`,
  );
  console.log(JSON.stringify(records, null, 2));
} finally {
  await Promise.all([chrome.close(), fox.close()]);
}
