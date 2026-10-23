// biome-ignore-all lint/performance/useDomNodeTextContent: Review the visible public application.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, firefox } from "playwright";

const base = "https://antonsoo.github.io/gonia/";
const output = resolve(process.argv[2] ?? "/tmp/gonia-theatre-hosted");
await mkdir(output, { recursive: true });
const digest = (b) => createHash("sha256").update(b).digest("hex");
const expected = JSON.parse(await readFile("docs/theatre-review/build.json", "utf8"));
const report = {
  checkedAt: new Date().toISOString(),
  base,
  runtimeCommit: expected.runtimeCommit,
  files: [],
  configurations: [],
};
for (const file of expected.files) {
  const response = await fetch(`${base}${file.file}?review=${Date.now()}`);
  assert.equal(response.status, 200, file.file);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(digest(bytes), file.sha256, file.file);
  report.files.push(file);
}
console.log(`All ${report.files.length} public files match the reviewed build`);
for (const [name, engine] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await engine.launch();
  try {
    for (const width of [1440, 375]) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        acceptDownloads: true,
      });
      try {
        const page = await context.newPage(),
          errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto(`${base}theatre.html`);
        await page.waitForFunction(
          () => document.querySelector("#th-offline").textContent.includes("saved offline"),
          null,
          { timeout: 60000 },
        );
        await page.locator("#th-roman").click();
        assert.equal(await page.locator("#th-roman-depth").innerText(), "5 m");
        await page.locator("#th-greek").click();
        assert.equal(await page.locator("#th-greek-depth").innerText(), "2.93 m");
        await page.locator("#th-single").click();
        assert.match(await page.locator("#th-arc-note").innerText(), /Your alteration/);
        await page.locator("#th-three").click();
        await page.locator("#th-probe").focus();
        await page.keyboard.press("Home");
        await page.keyboard.press("ArrowRight");
        assert.equal(await page.locator("#th-probe").inputValue(), "1");
        await page.locator("#th-source").selectOption("4");
        await page.locator("#th-source-image").scrollIntoViewIfNeeded();
        await page.locator("#th-source-image").evaluate((im) => im.decode());
        const downloads = [];
        for (const [button, extension] of [
          ["#th-save-reading", "html"],
          ["#th-save-svg", "svg"],
          ["#th-save-csv", "csv"],
        ]) {
          const pending = page.waitForEvent("download");
          await page.locator(button).click();
          const download = await pending,
            file = join(output, `${name}-${width}.${extension}`);
          await download.saveAs(file);
          const bytes = await readFile(file);
          if (extension === "html")
            assert.equal(bytes.toString().match(/data:image\/jpeg;base64,/g).length, 7);
          downloads.push({ file: file.split("/").at(-1), sha256: digest(bytes) });
        }
        const artifact = await context.newPage();
        await artifact.goto(pathToFileURL(join(output, `${name}-${width}.html`)).href);
        const pending = artifact.waitForEvent("download");
        await artifact.locator("a[download]").click();
        const embedded = await pending,
          embeddedFile = join(output, `${name}-${width}-embedded.csv`);
        await embedded.saveAs(embeddedFile);
        assert.equal(
          digest(await readFile(embeddedFile)),
          digest(await readFile(join(output, `${name}-${width}.csv`))),
        );
        await artifact.close();
        await context.setOffline(true);
        await page.reload();
        assert.equal(await page.locator("#th-probe").inputValue(), "1");
        const offlineRooms = [];
        for (const entry of [
          "index.html",
          "spacing.html",
          "entasis.html",
          "fluting.html",
          "transport.html",
          "colonnade.html",
          "theatre.html",
        ]) {
          await page.goto(`${base}${entry}`);
          assert.ok((await page.locator("h1").innerText()).length > 5);
          offlineRooms.push(entry);
        }
        await page.locator("#th-source").selectOption("4");
        await page.locator("#th-source-image").scrollIntoViewIfNeeded();
        await page.locator("#th-source-image").evaluate((im) => im.decode());
        assert.deepEqual(errors, []);
        report.configurations.push({
          browser: name,
          version: browser.version(),
          width,
          downloads,
          embeddedCsvMatches: true,
          offlineRooms,
          sourceOffline: true,
        });
        console.log(
          `${name} ${width}: public controls, native downloads and seven offline rooms passed`,
        );
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}
await writeFile(join(output, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
