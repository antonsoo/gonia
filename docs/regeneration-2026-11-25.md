# Retained examples regenerated, 2026-11-25

The retained readings, drawings and PDFs that still named the former author
were regenerated on 2026-11-25 for the author-name and license change, from a
local build of commit `f905128` (Chromium 153; the retained files are the
Chromium 1440 px downloads; readings that were gzip-compressed before are stored
with `gzip -9 -n`). Every reading's "open these settings" link names the public
site, as before.

Each room's own browser review produced its files: `browser-check.mjs`
(widened metope), `spacing-browser.mjs` (eustyle and altered eustyle),
`colonnade-browser.mjs`, `theatre-browser.mjs`, `fluting-browser.mjs`,
`transport-browser.mjs`, `echea-browser.mjs`, `hoist-browser.mjs`,
`optics-browser.mjs`, `screw-browser.mjs`, `ledger-browser.mjs`,
`babylon-browser.mjs`, `segments-browser.mjs` and `volute-browser.mjs`. Two
were captured separately because the current review saves a different state:
the entasis reading was downloaded from its original settings link
(`compare=equal`), and `examples/arch/` from the original arch link, which
the current app opens as the no-friction model (see that folder's README).

What changed in every file: the credit names Anthony Mercer and the embedded
code license is the PolyForm Noncommercial text with its required notice.
Readings also carry the current edition identifier. Where the tool grew after
the October capture, the regenerated reading shows it: the fluting reading
includes the segment study (5 to 9 pages), the hoist reading names the chosen
tension transfer (13 to 15), and the arch files use the version 2 format (14 to
17). Longer license text adds a page or two elsewhere: Babylon 17 to 19, ledger
15 to 16, optics 20 to 22, screw 24 to 25, volute 18 to 19. All other PDFs keep
their page counts.

Two review scripts needed repairs to run: `babylon-browser.mjs` compared the
offline cache with the file list exactly and failed on the progress marker the
2026-11-01 offline change adds; it now ignores that marker, as
`arch-browser.mjs` does. It also needs the software-rendering environment its
receipt records (`GALLIUM_DRIVER=llvmpipe`, `LIBGL_ALWAYS_SOFTWARE=true`,
`EGL_PLATFORM=surfaceless`, lavapipe Vulkan ICD) on this machine.
`optics-artifacts.py` still required the MIT text and now checks for the
PolyForm notice. `fluting-browser.mjs` records download paths relative to its
output folder instead of absolute paths.

Checks on the regenerated files: `babylon-artifacts.py`, `ledger-artifacts.py`,
`optics-artifacts.py`, `screw-artifacts.py` (with its SciPy environment),
`volute-artifacts.py`, `hoist-artifact-oracle.py` and `theatre-print.ts`
passed.

Receipts replaced by that day's runs: `spacing-browser.json`,
`fluting-browser.json`, `screw-browser.json`, `screw-artifacts.json`,
`babylon-review/browser.json`, `babylon-review/artifacts.json`,
`ledger-review/browser.json`, `theatre-review/print.json` and
`volute-review/artifacts.json`. Manifests listing the retained files
(`babylon-review/retained-files.json`, `hoist-artifacts.json`,
`colonnade-review/artifacts.json`, `theatre-review/artifacts.json`,
`optics-example-identities.json`) and the hashes quoted in
`screw-review.md` and `transport-review.md` now describe the new files.

Left as October records of the earlier captures: the hosted and publication
receipts (`hosted-review.json`, `entasis-hosted.json`, `spacing-hosted.json`,
`fluting-hosted-browser.json`, `fluting-initial-hosted-browser.json`,
`screw-hosted-browser.json`, `ledger-review/hosted-*.json`,
`transport-review/hosted-browser.json`, `babylon-publication/`,
`evidence/arch-publication/`), the regression and integration receipts
(`entasis-navigation.json`, `entasis-spacing-regression.json`,
`segments-fluting-browser.json`, `fluting-cache-fix-browser.json`,
`transport-review/retained-entasis.json`), and the arch review receipts in
`evidence/arch/` and `evidence/arch-author-edition/`. Page counts quoted in
the dated review and publication documents describe those captures.
