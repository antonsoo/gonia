#!/usr/bin/env python3
"""Re-render every retained whole source page from the identified original PDF."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile

parser = argparse.ArgumentParser()
parser.add_argument("--pdf", required=True)
args = parser.parse_args()
manifest = json.loads(Path("public/sources/screw/manifest.json").read_text())
pdf = Path(args.pdf)
assert hashlib.sha256(pdf.read_bytes()).hexdigest() == manifest["pdf"]["sha256"]
assert pdf.stat().st_size == manifest["pdf"]["bytes"]
rows = []
with tempfile.TemporaryDirectory() as directory:
    for page in manifest["pages"]:
        target = Path(directory) / page["key"]
        subprocess.run(["pdftoppm", "-f", str(page["pdfPage"]), "-l", str(page["pdfPage"]), "-scale-to", "1700", "-jpeg", "-jpegopt", "quality=88", "-singlefile", str(pdf), str(target)], check=True, capture_output=True)
        actual = target.with_suffix(".jpg").read_bytes()
        retained = Path("public") / page["path"]
        assert actual == retained.read_bytes(), page["key"]
        assert hashlib.sha256(actual).hexdigest() == page["sha256"]
        rows.append({"page": page["key"], "pdfPage": page["pdfPage"], "bytes": len(actual), "identical": True})
print(json.dumps({"pdfSha256": manifest["pdf"]["sha256"], "renderer": subprocess.run(["pdftoppm", "-v"], capture_output=True, text=True).stderr.splitlines()[0], "pages": rows, "passed": True}, indent=2))
