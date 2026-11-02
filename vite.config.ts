import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { defineConfig, type Plugin, transformWithOxc } from "vite";

const base = "/gonia/";

async function filesIn(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? filesIn(path.join(directory, entry.name))
        : Promise.resolve([path.join(directory, entry.name)]),
    ),
  );
  return nested.flat();
}

/** One retained JSON file serves Node calculations, browser code and source downloads. */
function retainedSourceJson(file: string): Plugin {
  const sourceFile = path.resolve(file),
    virtualId = `\0retained-source-json:${file}.js`;
  return {
    name: "retained-source-json",
    enforce: "pre",
    resolveId(id, importer) {
      if (id === virtualId) return id;
      if (importer && id.startsWith(".") && path.resolve(path.dirname(importer), id) === sourceFile)
        return virtualId;
    },
    async load(id) {
      if (id !== virtualId) return;
      this.addWatchFile(sourceFile);
      const json = await readFile(sourceFile, "utf8");
      JSON.parse(json);
      // Parsing the retained text preserves JSON's negative zero in both the
      // Node reader and browser. Re-stringifying a parsed object erases it.
      return `export default JSON.parse(${JSON.stringify(json)});`;
    },
  };
}

export default defineConfig(async ({ command }) => {
  const inputFiles = [
    ...(await filesIn("src")),
    ...(await filesIn("public")),
    "index.html",
    "spacing.html",
    "entasis.html",
    "fluting.html",
    "transport.html",
    "colonnade.html",
    "theatre.html",
    "echea.html",
    "hoist.html",
    "optics.html",
    "screw.html",
    "ledger.html",
    "babylon.html",
    "volute.html",
    "arch.html",
    "LICENSE",
    "vite.config.ts",
    "tsconfig.json",
    "package.json",
    "package-lock.json",
  ].sort();
  const inputHash = createHash("sha256");
  for (const file of inputFiles) {
    inputHash.update(file);
    inputHash.update(await readFile(file));
  }
  const edition = command === "build" ? inputHash.digest("hex") : "development";
  return {
    base,
    build: {
      rolldownOptions: {
        input: {
          main: "index.html",
          spacing: "spacing.html",
          entasis: "entasis.html",
          fluting: "fluting.html",
          transport: "transport.html",
          colonnade: "colonnade.html",
          theatre: "theatre.html",
          echea: "echea.html",
          hoist: "hoist.html",
          optics: "optics.html",
          screw: "screw.html",
          ledger: "ledger.html",
          babylon: "babylon.html",
          volute: "volute.html",
          arch: "arch.html",
        },
      },
    },
    define: { __GONIA_EDITION__: JSON.stringify(edition) },
    plugins: [
      retainedSourceJson("public/sources/optics/manifest.json"),
      retainedSourceJson("public/sources/babylon/manifest.json"),
      retainedSourceJson("public/sources/volute/manifest.json"),
      retainedSourceJson("public/sources/arch/manifest.json"),
      {
        name: "offline-workshop",
        apply: "build",
        async closeBundle() {
          const files = (await filesIn("dist")).filter((f) => !f.endsWith("sw.js")).sort();
          const urls = files.map(
            (file) => base + path.relative("dist", file).split(path.sep).join("/"),
          );
          const integrity = Object.fromEntries(
            await Promise.all(
              files.map(async (file, index) => [
                urls[index],
                `sha256-${createHash("sha256")
                  .update(await readFile(file))
                  .digest("base64")}`,
              ]),
            ),
          );
          const sizes = Object.fromEntries(
            await Promise.all(
              files.map(async (file, index) => [urls[index], (await readFile(file)).byteLength]),
            ),
          );
          const worker = await transformWithOxc(
            await readFile("src/offline-worker.ts", "utf8"),
            "offline-worker.ts",
          );
          await writeFile(
            "dist/sw.js",
            `/* Offline edition ${edition}. Generated from the complete build. */
const CACHE = "gonia-${edition}";
const EDITION = ${JSON.stringify(edition)};
const BASE = ${JSON.stringify(base)};
const FILES = ${JSON.stringify(urls)};
const INTEGRITY = ${JSON.stringify(integrity)};
const SIZES = ${JSON.stringify(sizes)};
${worker.code}`,
          );
        },
      },
    ],
  };
});
