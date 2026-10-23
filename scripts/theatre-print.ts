import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { theatrePassages } from "../src/theatre-content.ts";

const file = process.argv[2];
if (!file) throw new Error("Pass the illustrated reading PDF produced by the browser review.");
const normalize = (text: string) => text.normalize("NFC").replace(/\s+/g, "");
const printed = normalize(execFileSync("pdftotext", ["-layout", file, "-"], { encoding: "utf8" }));
const checks = theatrePassages.flatMap((passage, index) =>
  (["latin", "english", "word", "gloss", "grammar"] as const).map((field) => ({
    passage: index + 1,
    field,
    present: printed.includes(normalize(passage[field])),
  })),
);
assert.ok(
  checks.every((check) => check.present),
  JSON.stringify(checks.filter((c) => !c.present)),
);
console.log(
  JSON.stringify(
    {
      method:
        "Poppler text extraction; NFC and whitespace normalization; complete paragraph inclusion",
      pdfSha256: createHash("sha256").update(readFileSync(file)).digest("hex"),
      checks,
    },
    null,
    2,
  ),
);
