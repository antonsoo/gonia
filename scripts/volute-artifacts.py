"""Check actual browser downloads against independent geometry and source bytes.

python3 scripts/volute-artifacts.py /path/to/browser-output [receipt.json]
"""
import base64
import csv
import hashlib
from html import unescape
from html.parser import HTMLParser
import io
import json
import math
from pathlib import Path
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = json.loads((ROOT / "public/sources/volute/manifest.json").read_text())


def sha(data):
    return hashlib.sha256(data).hexdigest()


def decode_uri(value):
    assert value.startswith("data:") and ";base64," in value
    return base64.b64decode(value.split(",", 1)[1], validate=True)


class Reading(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.images = []
        self.downloads = {}
        self.scripts = 0
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "script":
            self.scripts += 1
        if tag == "img":
            self.images.append(decode_uri(attrs["src"]))
        if tag == "a" and "download" in attrs:
            self.downloads[attrs["download"]] = decode_uri(attrs["href"])


def check_svg(data, rows, eye):
    root = ET.fromstring(data)
    assert root.attrib["width"].endswith("mm") and root.attrib["height"].endswith("mm")
    size = [float(root.attrib[k][:-2]) for k in ["width", "height"]]
    assert size[0] >= 210 and size[1] >= 297
    arcs = [p for p in root.iter("{http://www.w3.org/2000/svg}path") if " A" in p.attrib.get("d", "")]
    assert len(arcs) == len(rows)
    for arc, row in zip(arcs, rows):
        radii = re.search(r"A([\d.e+-]+) ([\d.e+-]+)", arc.attrib["d"])
        assert radii
        expected = math.sqrt(int(row["radius_squared_in_twelfths_e_squared"])) * eye / 12
        assert math.isclose(float(radii[1]), expected, abs_tol=1e-10)
        assert math.isclose(float(radii[2]), expected, abs_tol=1e-10)
    calibration = root.find(".//*[@id='calibration']")
    assert calibration is not None and "h50" in calibration.attrib["d"]
    return {"sheetMm": size, "eyeMm": eye, "physicalRadii": len(arcs), "calibrationMm": 50}


def check_reading(text, native, rows):
    reading = Reading(text)
    assert reading.scripts == 0
    assert len(reading.images) == len(MANIFEST["pages"])
    for data, page in zip(reading.images, MANIFEST["pages"]):
        original = (ROOT / "public/sources/volute" / page["file"]).read_bytes()
        assert data == original and sha(data) == page["sha256"]
    font_hashes = {sha(decode_uri(m)) for m in re.findall(r"data:font/[^'\") ]+", text)}
    for name, expected in MANIFEST["relatedAssets"].items():
        source = (ROOT / "public" / name).read_bytes()
        assert sha(source) == expected["sha256"]
        if name.endswith(("ttf", "woff2")):
            assert expected["sha256"] in font_hashes
        else:
            assert source.decode().replace("\r\n", "\n").strip() in unescape(text)
    assert json.loads(reading.downloads["gonia-volute.json"]) == native
    assert list(csv.DictReader(io.StringIO(reading.downloads["gonia-volute.csv"].decode()))) == rows
    assert json.loads(reading.downloads["volute-source-manifest.json"]) == MANIFEST
    stencil = check_svg(reading.downloads["gonia-volute-compass.svg"], rows, native["state"]["eye"])
    assert "⟨conlocetur⟩" in text and "⟨schema volutae⟩" in text
    assert "Krohn" in text and "1889" in text and "CC0" in text
    assert "default-src 'none'" in text
    return {"sourceImagesByteIdentical": len(reading.images), "fontsVerified": 3, "licensesVerified": 2, "nativeFiles": len(reading.downloads), "scriptCount": reading.scripts, **stencil}


def main():
    output = Path(sys.argv[1])
    records = []
    for folder in sorted(output.glob("*-*")):
        if not folder.is_dir():
            continue
        native = json.loads((folder / "drawing.json").read_text())
        rows = list(csv.DictReader((folder / "measurements.csv").open()))
        assert len(rows) == 12 and native["state"]["moves"] == list(range(1, 13))
        # The first guide turn names 9 above, 8 right, 7 below, 6 left in
        # parts where the eye diameter is 2. These are independent axis targets.
        targets = [(48, 0), (0, -42), (-36, 0), (0, 30)]
        for row, end in zip(rows, targets):
            assert (int(row["end_x_twelfths_e"]), int(row["end_y_twelfths_e"])) == end
        assert int(rows[-1]["end_x_twelfths_e"]) == 0
        assert int(rows[-1]["end_y_twelfths_e"]) == 6
        assert math.isclose(float(rows[0]["next_join_degrees"]), math.degrees(math.atan(1 / 128)), abs_tol=1e-12)
        assert math.isclose(float(rows[-1]["next_join_degrees"]), math.degrees(math.atan(1 / 7)), abs_tol=1e-12)
        for row in rows:
            # An independent circle invariant: both endpoint distances to the
            # selected centre have the recorded exact squared radius.
            cx, cy = int(row["cx_twelfths_e"]), int(row["cy_twelfths_e"])
            for where in ["start", "end"]:
                x, y = int(row[f"{where}_x_twelfths_e"]), int(row[f"{where}_y_twelfths_e"])
                assert (x - cx) ** 2 + (y - cy) ** 2 == int(row["radius_squared_in_twelfths_e_squared"])
        stencil = check_svg((folder / "compass.svg").read_bytes(), rows, native["state"]["eye"])
        reading = check_reading((folder / "reading.html").read_text(), native, rows)
        # The offline file may show a different source-page selection. Its pin
        # sequence, measurements and retained source assets must still agree.
        offline = Reading((folder / "offline-reading.html").read_text())
        offline_native = json.loads(offline.downloads["gonia-volute.json"])
        assert offline_native == native
        check_reading((folder / "offline-reading.html").read_text(), native, rows)
        records.append({"case": folder.name, "independentAxisAndCircleChecks": 12, "stencil": stencil, "reading": reading, "offlineEquivalent": True})
    pdf = output / "chromium-1440/reading.pdf"
    info = subprocess.check_output(["pdfinfo", str(pdf)], text=True)
    image_list = subprocess.check_output(["pdfimages", "-list", str(pdf)], text=True)
    sizes = [(int(p.split()[3]), int(p.split()[4])) for p in image_list.splitlines()[2:] if p.strip()]
    assert sizes == [(p["width"], p["height"]) for p in MANIFEST["pages"]]
    text = subprocess.check_output(["pdftotext", "-layout", str(pdf), "-"], text=True)
    assert "The compass changes centre." in text and "8.130102" in text
    assert "Sardis" in text and "CC0" in text
    assert "JavaScript:      no" in info
    receipt = {"scope": "Actual local browser downloads, not published artifacts", "records": records, "pdf": {"pages": int(re.search(r"Pages:\s+(\d+)", info)[1]), "preservedImageDimensions": sizes, "javascript": False, "sha256": sha(pdf.read_bytes())}}
    if len(sys.argv) > 2:
        Path(sys.argv[2]).write_text(json.dumps(receipt, indent=2) + "\n")
    print(json.dumps(receipt, indent=2))


if __name__ == "__main__":
    main()
