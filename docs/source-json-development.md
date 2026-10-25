# Retained source JSON in the development server

The Node 24 development server printed Vite's public-import warning while
loading `public/sources/optics/manifest.json` as a JavaScript module. The page and its operations loaded;
the [before receipt](source-json-before.json) retains the actual `/public/`
module request and reproduced warning.

A small Vite resolver now exposes that same retained JSON as a virtual module.
It reads the file, parses it and returns its default export, while watching the
original source. Node calculations retain their existing JSON import and the
raw public download retains its original bytes. There is one authoritative
file. No dataset, model, source reading or visual treatment changes.
The implementation follows Vite's [virtual-module API](https://v8.vite.dev/guide/api-plugin#virtual-modules-convention).

The [Node 24 development receipt](source-json-development.json) covers native
Chromium and Firefox at 375 pixels, raw-download/module identity, the substantive
experiment and a complete native study download. The server log has no
unsupported-public-import warnings and the browser makes no `/public/` module
request. In a separate temporary clone, the recipe changes one source field,
checks that reload exposes the new value, restores the original bytes and checks
the original value again. The temporary field is a watcher fixture, not a
historical reading or measured frequency.

The [reproducer](../scripts/source-json-development.mjs) requires an isolated
clone under the OS temporary directory. Run its dev server using Node 24, then:

```sh
node scripts/source-json-development.mjs BASE_URL ISOLATED_TEMP_CLONE SERVER_LOG OUTPUT_DIR
```

The supplied clone is edited and restored; the checked-out source dataset is
unchanged. This development check is separate from production build identity,
browser/offline operations and hosted publication records.

## Production review

The [clean Node 24 archive](source-json-build.json) passes `npm ci` and
`npm run check`; all 91 static files are byte identical to the reviewed
Node 26 build. The [native production review](source-json-production.json)
repeats Chromium and Firefox at 1440 and 375 pixels, complete reading/study
downloads, source images, keyboard controls and all rooms browser-offline.
The source corpus and learning model are unchanged.

The [artifact inspection](source-json-artifacts.json) recovers all 74 language
fields and five original JPEGs from the twenty-page PDF.

## Hosted follow-up

The corrected source `87b660981265b6e9bbdec18d951f50177ce939c6` was pushed to public `main`.
Its static output was pushed as Pages commit `e8bcb717ff3790bb926c18258111af63dd8c4fc9`
with normal history preserved. At `2026-10-25T03:22:45.276Z`, the
[canonical hosted receipt](source-json-hosted-files.json) matches all
91 current build files, with the directory entry verified before
and after the pass. The [actual hosted browser receipt](source-json-hosted-browser.json)
repeats the substantive controls, complete studies and browser-offline rooms.
The public origin remains online; browser networking is disabled for that
hosted offline review. The earlier source, model and first-publication records
are retained separately. No registry release or hosted CI run is inferred.

The [hosted study inspection](source-json-hosted-artifacts.json) checks the actual
public download and printed source fields and recovers the original source JPEGs.
