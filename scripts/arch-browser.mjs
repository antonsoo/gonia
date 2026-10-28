import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:4446/gonia/";
const out = path.resolve(process.argv[3] ?? "/tmp/gonia-arch-review");
await mkdir(out, { recursive: true });
const manifest = JSON.parse(await readFile("public/sources/arch/manifest.json", "utf8"));
const results = [];
const hash = (data) => createHash("sha256").update(data).digest("hex");
async function observeImages(context) {
  await context.addInitScript(() => {
    window.__archImageBlobs = new Map();
    const original = URL.createObjectURL;
    URL.createObjectURL = (blob) => {
      const url = original.call(URL, blob);
      window.__archImageBlobs.set(url, blob);
      return url;
    };
  });
}
async function range(page, id, value) {
  await page.locator(`#${id}`).evaluate((node, v) => {
    node.value = String(v);
    node.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}
async function download(page, selector, file) {
  const event = page.waitForEvent("download");
  await page.locator(selector).click();
  const d = await event;
  assert.equal(await d.failure(), null);
  await d.saveAs(file);
  return file;
}
async function sourceIdentity(page, index) {
  await page.waitForFunction(() =>
    document.getElementById("ar-source-caption").textContent.includes("identity verified"),
  );
  await page.locator("#ar-source-image").evaluate((img) => img.decode());
  const actual = await page.locator("#ar-source-image").evaluate(async (img) => {
    const data = await window.__archImageBlobs.get(img.src).arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  });
  assert.equal(actual, manifest.pages[index].sha256);
}
async function review(browser, engine, width) {
  const dir = path.join(out, `${engine}-${width}`);
  await mkdir(dir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width, height: 1000 },
    acceptDownloads: true,
  });
  await observeImages(context);
  if (engine === "chromium") await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  else
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: async () => {
            throw new Error("Exercise the visible copy fallback");
          },
        },
      });
    });
  const page = await context.newPage(),
    errors = [],
    outside = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("request", (r) => {
    if (/^https?:/.test(r.url()) && new URL(r.url()).origin !== new URL(base).origin)
      outside.push(r.url());
  });
  await page.goto(base);
  await page.locator("#beam").waitFor();
  await page.getByRole("link", { name: "Arch and pier", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.locator("#ar-title").waitFor();
  await sourceIdentity(page, 0);
  assert.match(await page.locator("#ar-verdict").textContent(), /bases need more restraint/);
  assert.equal(await page.locator(".ar-outside").count(), 0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(dir, "opening.png") });
  await page.locator(".ar-bench").screenshot({ path: path.join(dir, "section.png") });
  await page.locator("#ar-bench").screenshot({ path: path.join(dir, "bench.png") });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  // Native keyboard operation, including the complete unchanged-weight repair.
  await page.locator("#ar-width").focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.locator("#ar-width-value").textContent(), "0.51");
  await range(page, "ar-width", 100);
  assert.equal(await page.locator("#ar-mass-value").textContent(), "1");
  assert.match(await page.locator("#ar-verdict").textContent(), /fits the arch and the bases/);
  await page.locator("#ar-fit-whole").focus();
  await page.keyboard.press("Enter");
  assert.match(await page.locator("#ar-status").textContent(), /Found one path/);
  // Every joint is inspectable without relying on the small diagram labels.
  for (let j = 0; j < 14; j++) {
    await page.locator("#ar-joint").selectOption(String(j));
    assert.match(
      await page.locator("#ar-contact-note").textContent(),
      new RegExp(`Joint ${j}: contact inside`),
    );
  }
  await page.locator('[data-joint="3"]').focus();
  await page.keyboard.press("Space");
  assert.equal(await page.locator("#ar-joint").inputValue(), "3");
  await page.locator("#ar-enlarge").click();
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(() => document.getElementById("ar-section-frame").scrollLeft > 0);
  assert.ok((await page.locator("#ar-section-frame").evaluate((node) => node.scrollLeft)) > 0);
  await page.locator("#ar-enlarge").click();
  for (let i = 0; i < 8; i++) {
    const button = page.locator(`[data-word="${i}"]`);
    await button.focus();
    await page.keyboard.press("Enter");
    assert.equal(await button.getAttribute("aria-pressed"), "true");
    assert.ok((await page.locator("#ar-word").textContent()).length > 100);
  }
  for (let i = 0; i < 3; i++) {
    await page.locator("#ar-page").selectOption(String(i));
    await sourceIdentity(page, i);
  }
  await page.locator("#ar-source-zoom").click();
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(() => document.getElementById("ar-source-frame").scrollLeft > 0);
  assert.ok((await page.locator("#ar-source-frame").evaluate((node) => node.scrollLeft)) > 0);
  await page.locator("#ar-source-zoom").click();
  await page.getByText("Other starting experiments", { exact: true }).click();
  await page.locator("#ar-thin").click();
  assert.match(await page.locator("#ar-verdict").textContent(), /No path fits/);
  await page.locator("#ar-fit-arch").click();
  assert.match(await page.locator("#ar-status").textContent(), /No path fits/);
  await range(page, "ar-rise", 30);
  await range(page, "ar-thickness", 40);
  assert.match(await page.locator("#ar-domain").textContent(), /unbounded/);
  await page.locator("#ar-fit-arch").click();
  assert.equal(await page.locator(".ar-outside").count(), 0);
  await page.locator("#ar-reset").click();
  await page.locator("#ar-thrust").fill("");
  await page.locator("#ar-thrust").press("Tab");
  assert.equal(await page.locator("#ar-thrust").inputValue(), "0.655");
  await range(page, "ar-width", 100);
  await page.locator("#ar-fit-whole").click();
  await page.locator("#ar-joint").selectOption("4");
  await sourceIdentity(page, 0);
  const nativeFile = await download(page, "#ar-json", path.join(dir, "experiment.json"));
  await download(page, "#ar-csv", path.join(dir, "contacts.csv"));
  await download(page, "#ar-svg", path.join(dir, "section.svg"));
  const htmlFile = await download(page, "#ar-html", path.join(dir, "reading.html"));
  const native = JSON.parse(await readFile(nativeFile, "utf8"));
  assert.equal(native.state.width, 100);
  assert.equal(native.state.mass, 100);
  const currentURL = page.url();
  await page.locator("#ar-share").click();
  assert.equal(page.url(), currentURL);
  const link =
    engine === "chromium"
      ? await page.evaluate(() => navigator.clipboard.readText())
      : await page.locator("#ar-share-link").inputValue();
  await page.goto(link);
  await page.locator("#ar-title").waitFor();
  const copied = await download(page, "#ar-json", path.join(dir, "linked.json"));
  assert.deepEqual(JSON.parse(await readFile(copied, "utf8")), native);
  const bad = { ...native, state: { ...native.state, thrust: null } };
  await page.locator("#ar-open").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(bad)),
  });
  assert.match(await page.locator("#ar-save-status").textContent(), /valid settings/);
  await page.locator("#ar-reset").click();
  await page.locator("#ar-open").setInputFiles(nativeFile);
  await page.waitForFunction(() =>
    document.getElementById("ar-save-status").textContent.includes("reopened"),
  );
  assert.match(await page.locator("#ar-save-status").textContent(), /reopened/);
  assert.equal(await page.locator("#ar-width").inputValue(), "100");
  await page.waitForFunction(
    () => document.getElementById("ar-offline").textContent === "Workshop & source saved offline",
    null,
    { timeout: 60000 },
  );
  const inventory = await page.evaluate(async () => {
    const keys = await caches.keys();
    return Promise.all(
      keys
        .filter((k) => k.startsWith("gonia-"))
        .map(async (k) => ({ name: k, files: (await (await caches.open(k)).keys()).length })),
    );
  });
  await context.setOffline(true);
  await page.reload();
  await page.locator("#ar-title").waitFor();
  // The copied query carries the saved values through an offline reload.
  assert.equal(await page.locator("#ar-width").inputValue(), "100");
  for (let i = 0; i < 3; i++) {
    await page.locator("#ar-page").selectOption(String(i));
    await sourceIdentity(page, i);
  }
  await page.locator("#ar-page").selectOption("0");
  await sourceIdentity(page, 0);
  await download(page, "#ar-html", path.join(dir, "offline-reading.html"));
  const rooms = [
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
    "screw",
    "ledger",
    "babylon",
    "volute",
    "arch",
  ];
  for (const room of rooms) {
    await page.goto(`${base}${room}.html`);
    await page.locator("h1").waitFor();
    assert.ok((await page.locator("h1").textContent()).length > 5);
  }
  await context.setOffline(false);
  await page.goto(`${base}arch.html`);
  await page.locator("#ar-title").waitFor();
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  assert.deepEqual(axe.violations, []);
  await page.locator("#ar-reading").screenshot({ path: path.join(dir, "reading-screen.png") });
  // Reopen the real downloaded file with script execution disabled.
  const retained = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width, height: 1000 },
    acceptDownloads: true,
  });
  const filePage = await retained.newPage(),
    remote = [];
  filePage.on("request", (r) => {
    if (/^https?:/.test(r.url())) remote.push(r.url());
  });
  await filePage.goto(pathToFileURL(htmlFile).href);
  assert.equal(await filePage.locator("img").count(), 3);
  assert.equal(await filePage.locator(".ar-reading").count(), 5);
  assert.equal(await filePage.locator(".ar-latin").count(), 5);
  await download(filePage, 'a[download="gonia-arch.json"]', path.join(dir, "retained.json"));
  assert.deepEqual(JSON.parse(await readFile(path.join(dir, "retained.json"), "utf8")), native);
  if (engine === "chromium" && width === 1440)
    await filePage.pdf({
      path: path.join(dir, "reading.pdf"),
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
  assert.deepEqual(remote, []);
  assert.deepEqual(errors, []);
  assert.deepEqual(outside, []);
  await retained.close();
  await context.close();
  return {
    engine,
    width,
    allJoints: 14,
    wordNotes: 8,
    sourceImagesVerified: 3,
    offlineRooms: rooms.length,
    inventory,
    axeViolations: 0,
    pageErrors: errors,
    externalRequests: outside,
    downloadedRecordSha256: hash(await readFile(nativeFile)),
  };
}

async function integrityReview(browser) {
  const context = await browser.newContext({ serviceWorkers: "block" }),
    page = await context.newPage();
  await observeImages(context);
  const wrong = await readFile("public/sources/arch/krohn-140.jpg");
  await context.route("**/sources/arch/krohn-141.jpg", (route) =>
    route.fulfill({ status: 200, contentType: "image/jpeg", body: wrong }),
  );
  await page.goto(`${base}arch.html`);
  await page.locator("#ar-title").waitFor();
  await page.waitForFunction(() =>
    document.getElementById("ar-source-caption").textContent.includes("does not match"),
  );
  assert.equal(await page.locator("#ar-source-image").isVisible(), false);
  const downloads = [];
  page.on("download", (d) => downloads.push(d.suggestedFilename()));
  await page.locator("#ar-html").click();
  await page.waitForFunction(() =>
    document.getElementById("ar-save-status").textContent.includes("does not match"),
  );
  assert.deepEqual(downloads, []);
  await context.unroute("**/sources/arch/krohn-141.jpg");
  await page.locator("#ar-source-retry").click();
  await sourceIdentity(page, 0);
  await context.close();
  // An older image response cannot overwrite a later page selection.
  const race = await browser.newContext({ serviceWorkers: "block" }),
    p = await race.newPage();
  await observeImages(race);
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  await race.route("**/sources/arch/krohn-141.jpg", async (route) => {
    await held;
    await route.continue();
  });
  await p.goto(`${base}arch.html`);
  await p.locator("#ar-title").waitFor();
  await p.locator("#ar-page").selectOption("2");
  await sourceIdentity(p, 2);
  release();
  await p.waitForLoadState("networkidle");
  await sourceIdentity(p, 2);
  // Export captures the settings at click time even while later source pages
  // are being fetched and the learner starts a different experiment.
  let releaseExport, enterExport;
  const exportHeld = new Promise((resolve) => {
    releaseExport = resolve;
  });
  const exportEntered = new Promise((resolve) => {
    enterExport = resolve;
  });
  await race.route("**/sources/arch/krohn-140.jpg", async (route) => {
    enterExport();
    await exportHeld;
    await route.continue();
  });
  const exported = p.waitForEvent("download");
  await p.locator("#ar-html").click();
  await exportEntered;
  await range(p, "ar-width", 120);
  await p.locator("#ar-page").selectOption("0");
  releaseExport();
  const snapshotFile = path.join(out, `snapshot-${browser.browserType().name()}.html`);
  await (await exported).saveAs(snapshotFile);
  const snapshotText = await readFile(snapshotFile, "utf8");
  const encoded = snapshotText.match(
    /download="gonia-arch.json" href="data:application\/json;base64,([^"]+)"/,
  );
  assert.ok(encoded);
  const snapshotRecord = JSON.parse(Buffer.from(encoded[1], "base64").toString("utf8"));
  assert.equal(snapshotRecord.state.width, 50);
  assert.equal(snapshotRecord.state.page, 2);
  await race.close();
  return {
    wrong200ImageRefused: true,
    wrongImageExportRefused: true,
    retryWorked: true,
    lateSourceDidNotReplaceSelectedPage: true,
    exportKeptClickTimeSnapshot: true,
  };
}
for (const [engine, type] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await type.launch({ headless: true });
  try {
    for (const width of [1440, 375]) {
      const r = await review(browser, engine, width);
      results.push(r);
      console.log(JSON.stringify(r));
    }
    results.push({ engine, integrity: await integrityReview(browser) });
  } finally {
    await browser.close();
  }
}
await writeFile(path.join(out, "browser.json"), `${JSON.stringify(results, null, 2)}\n`);
