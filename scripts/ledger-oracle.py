"""Read the licensed Greek numerals, then independently check every allocation.

No application module or expected-value export is imported. The independent
source is the retained IG excerpt, with brackets treated as editorial supplies.
This verifies arithmetic on an edited reading, not preservation on the stone.
"""
import csv
import hashlib
import io
import itertools
import json
from pathlib import Path
import re
import sys
from xml.etree import ElementTree as ET

root = Path(__file__).resolve().parents[1]
ns = {"t": "http://www.tei-c.org/ns/1.0"}
tree = ET.parse(root / "public/sources/ledger/ig-476-excerpt.xml")
entries = {}
for total, ab in zip((90, 100), tree.findall(".//t:ab", ns), strict=True):
    text = "".join(ab.itertext()).replace("‒", "").replace("[", "").replace("]", "")
    text = text[text.index("Σιμίας"):]
    signs = re.findall("[Δ𐅂Ι]+", text)[:7]
    assert len(signs) == 7
    values = {"Δ": 60, "𐅂": 6, "Ι": 1}
    amounts = [sum(values[c] for c in token) for token in signs]
    assert sum(amounts) == total * 6, (total, signs, amounts)
    entries[total] = amounts
assert entries == {90: [78, 77, 77, 77, 77, 77, 77], 100: [86, 86, 86, 86, 86, 85, 85]}

cases = json.load(sys.stdin)
assert len(cases) == 256
for total in (90, 100):
    shares, remainder = divmod(6 * total, 7)
    combinations = {sum(1 << i for i in choice) for choice in itertools.combinations(range(7), remainder)}
    for row in [r for r in cases if r["entry"] == total]:
        mask = row["extra"]
        chosen = [shares + int(i in {j for j in range(7) if mask & (1 << j)}) for i in range(7)]
        assert row["chosen"] == chosen
        assert row["recorded"] == entries[total]
        assert row["total"] == 6 * total
        assert row["allocated"] == sum(chosen)
        assert row["left"] == 6 * total - sum(chosen)
        assert row["balanced"] == (mask in combinations)
        assert row["matches"] == (chosen == entries[total])
        assert row["alternatives"] == len(combinations)

manifest = json.loads((root / "public/sources/ledger/manifest.json").read_text())
for file, expected in manifest["assets"].items():
    assert hashlib.sha256((root / "public" / file).read_bytes()).hexdigest() == expected, file

downloads = 0
if len(sys.argv) > 1:
    directory = Path(sys.argv[1])
    report = json.loads((directory / "browser.json").read_text())
    assert len(report["configurations"]) == 4
    for config in report["configurations"]:
        csv_text = (directory / config["csv"]).read_text()
        rows = list(csv.reader(io.StringIO(csv_text)))
        values = rows[8:15]
        assert [int(r[3]) for r in values] == entries[100]
        assert [int(r[2]) for r in values] == [85, 86, 86, 86, 86, 85, 86]
        assert sum(int(r[2]) for r in values) == 600
        for r in values:
            assert int(r[4]) * 6 + int(r[5]) == int(r[3])
        assert config["offline"] and config["savedStudyOffline"]
        downloads += 1

print(json.dumps({"source": "IG I3 476 edited Greek numeral excerpt", "entries_obols": entries, "allocations": len(cases), "balanced_choices": {90: 7, 100: 21}, "pinned_assets": len(manifest["assets"]), "browser_CSVs": downloads}, indent=2))
