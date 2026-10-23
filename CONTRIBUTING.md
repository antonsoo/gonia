# Contributing

Use Node 24 or newer and Python 3. Clone the repository, run `npm ci`, then
`npm run dev`. The workshop opens at `http://127.0.0.1:4328/gonia/`.

Before proposing a change, run:

```sh
npm run check
npm run verify:geometry
npm run verify:spacing
npm run test:browser -- /tmp/gonia-browser-review.json
npm run test:spacing -- /tmp/gonia-spacing-review/browser.json
python3 scripts/spacing-oracle.py /tmp/gonia-spacing-review/browser.json
npm run verify:colonnade
npm run test:colonnade -- /tmp/gonia-colonnade-review
```

The browser review requires Playwright's Chromium and Firefox. If they are not
already installed, run `npx playwright install chromium firefox`. The script
serves the built `dist/` directory itself; do not rebuild it during a review.

For historical content, cite the edition, passage or measured building that
supports the change. Distinguish a source author's claims from modern
interpretation. Do not turn an illustrative ratio into a named-temple preset
without reliable measurement evidence. Link vocabulary to the actual part in
the drawing, and preserve Greek accents and Latin grammatical distinctions.

For geometry, extend the independent positional-constraint check where useful.
For interface changes, inspect real desktop and phone screenshots and exercise
keyboard controls, exports and offline use. Passing assertions alone do not
establish that a drawing teaches the intended relationship.

The temple-plan room's [model and source note](docs/colonnade-model.md) explains
why its ring count does not settle the printed XXXIV / XXXVIII dispute. Source
identity reproduction is available through
`python3 scripts/colonnade-source-review.py --online`; `--pdf path/to/krohn.pdf`
reuses an already downloaded copy of the identified original. Library byte
comparisons and PDF raster reproduction can legitimately fail if an upstream
image response or the local renderer differs; inspect the material before
changing a recorded hash.
