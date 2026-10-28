"""Audit actual browser downloads, retained source bytes, equilibrium and PDF.

python3 scripts/arch-artifacts.py /path/to/arch-browser-output
Uses Python's standard library and Poppler command-line tools.
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
import unicodedata
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = json.loads((ROOT / "public/sources/arch/manifest.json").read_text())


def digest(data):
    return hashlib.sha256(data).hexdigest()


def uri(value):
    assert value.startswith("data:") and ";base64," in value
    return base64.b64decode(value.split(",", 1)[1], validate=True)


class Reading(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.images, self.downloads, self.scripts = [], {}, 0
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "script":
            self.scripts += 1
        elif tag == "img":
            self.images.append(uri(attrs["src"]))
        elif tag == "a" and "download" in attrs:
            self.downloads[attrs["download"]] = uri(attrs["href"])


class Text(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.parts = []
        self.feed(text)

    def handle_data(self, data):
        self.parts.append(data)


def words(text):
    return " ".join(unicodedata.normalize("NFKC", text).replace("\u00ad", "").split())


def check_equilibrium(native, rows):
    s = native["state"]
    r = (1 + (s["rise"] / 100)**2) / (2 * s["rise"] / 100)
    ri, ro = r - s["thickness"] / 200, r + s["thickness"] / 200
    cy = s["rise"] / 100 - r
    end = math.acos(1 / r)
    step = (math.pi - 2 * end) / 13
    h = s["thrust"]
    assert native["version"] == 2 and s["friction"] == 0.65
    for index, row in enumerate(rows):
        x, y = float(row["x_half_span"]), float(row["y_half_span"])
        radius = math.hypot(x, y - cy)
        fraction = (radius - ri) / (ro - ri)
        assert math.isclose(fraction, float(row["contact_fraction_from_inner"]), abs_tol=1e-10)
        assert -1e-8 <= fraction <= 1 + 1e-8
        theta = math.pi - end - index * step
        assert math.isclose(x, radius * math.cos(theta), abs_tol=1e-10)
        assert math.isclose(y, cy + radius * math.sin(theta), abs_tol=1e-10)
        assert math.isclose(float(row["normal_W"]), h * math.sin(theta) - float(row["vertical_W"]) * math.cos(theta), abs_tol=1e-10)
        normal=float(row["normal_W"])
        shear=h*math.cos(theta)+float(row["vertical_W"])*math.sin(theta)
        assert math.isclose(shear,float(row["shear_W"]),abs_tol=1e-10)
        required=abs(shear)/normal
        assert math.isclose(required,float(row["required_joint_friction_abs_T_over_N"]),abs_tol=1e-10)
        assert required <= s["friction"] + 1e-10
        assert row["joint_friction_fits"] == "true"
        assert float(row["friction_coefficient_or_ideal"]) == s["friction"]
        base_required=h/((1+s["load"]/100)/2+s["mass"]/100)
        assert math.isclose(base_required,float(row["required_base_friction"]),abs_tol=1e-10)
        assert row["base_friction_fits"] == "true" and base_required <= s["friction"] + 1e-10
    for i in range(13):
        left, right = rows[i:i+2]
        theta = math.pi - end - (i + 0.5) * step
        # Independent Cartesian first-moment integral of the annular sector.
        area = step * (ro**2 - ri**2) / 2
        first_x = ((ro**3 - ri**3) / 3) * (math.sin(theta + step / 2) - math.sin(theta - step / 2))
        xc = first_x / area
        extra = (s["load"] / 100 if i == 6 else 0) if s["loading"] == "crown" else (s["load"] / 200 if i in [3, 9] else 0)
        weight = 1 / 13 + extra
        assert math.isclose(float(left["vertical_W"]) - float(right["vertical_W"]), weight, abs_tol=1e-10)
        moment = lambda j: float(j["x_half_span"]) * float(j["vertical_W"]) - float(j["y_half_span"]) * h
        assert math.isclose(moment(left) - moment(right), weight * xc, abs_tol=1e-10)
    first = rows[0]
    # Moment equilibrium of the left pier about its outer toe, using the
    # actual exported spring contact, rather than the production C formula.
    toe = -1 - s["width"] / 200
    x, y, v = float(first["x_half_span"]), float(first["y_half_span"]), float(first["vertical_W"])
    base_moment = v * (x - toe) - h * (y + 1) + (s["mass"] / 100) * (-1 - toe)
    xb = toe + base_moment / (v + s["mass"] / 100)
    assert math.isclose(-1 - xb, float(first["pier_outward_eccentricity_half_span"]), abs_tol=1e-10)
    assert abs(xb + 1) <= s["width"] / 200 + 1e-8


def check_svg(data, rows):
    root = ET.fromstring(data)
    assert (ROOT / "LICENSE").read_text().strip() in "".join(root.itertext())
    assert len([p for p in root.iter() if p.attrib.get("data-stone")]) == 13
    contacts = [p for p in root.iter() if "ar-contact" in p.attrib.get("class", "").split()]
    assert len(contacts) == 14
    for node, row in zip(contacts, rows):
        assert math.isclose(float(node.attrib["cx"]), 500 + 240 * float(row["x_half_span"]), abs_tol=1e-9)
        assert math.isclose(float(node.attrib["cy"]), 360 - 240 * float(row["y_half_span"]), abs_tol=1e-9)
    assert "not a continuous" in data.decode() or "No tension" in data.decode() or "no tension" in data.decode()


def check_html(text, native, csv_bytes):
    reading = Reading(text)
    assert reading.scripts == 0
    assert len(reading.images) == 3
    for data, page in zip(reading.images, MANIFEST["pages"]):
        assert data == (ROOT / "public/sources/arch" / page["file"]).read_bytes()
        assert digest(data) == page["sha256"]
    fonts = {digest(uri(value)) for value in re.findall(r"data:font/[^'\") ]+", text)}
    for file in ["fonts/NotoSerif-Regular.ttf", "fonts/IBMPlexSans-Regular.woff2"]:
        assert MANIFEST["relatedAssets"][file]["sha256"] in fonts
    plain = unescape(text).replace("\r\n", "\n")
    for file in ["fonts/NotoSerif-OFL.txt", "fonts/IBMPlex-OFL.txt"]:
        assert (ROOT / "public" / file).read_text().strip() in plain
    assert (ROOT / "LICENSE").read_text().strip() in plain
    assert json.loads(reading.downloads["gonia-arch.json"]) == native
    assert reading.downloads["gonia-arch-contacts.csv"] == csv_bytes
    assert json.loads(reading.downloads["gonia-arch-sources.json"]) == MANIFEST
    assert len(reading.downloads) == 4
    check_svg(reading.downloads["gonia-arch.svg"], list(csv.DictReader(io.StringIO(csv_bytes.decode()))))
    assert text.count('class="ar-reading"') == 5
    assert "default-src 'none'" in text
    return {"sourceImagesByteIdentical": 3, "fontsByteIdentical": 2, "licensesComplete": 3,
            "scriptCount": 0, "nativeDownloads": 4}


def main():
    out = Path(sys.argv[1])
    receipts = []
    for folder in sorted(out.glob("*-*")):
        if not folder.is_dir():
            continue
        native = json.loads((folder / "experiment.json").read_text())
        for file in ["linked.json", "retained.json"]:
            assert json.loads((folder / file).read_text()) == native
        csv_bytes = (folder / "contacts.csv").read_bytes()
        rows = list(csv.DictReader(io.StringIO(csv_bytes.decode())))
        assert len(rows) == 14
        check_equilibrium(native, rows)
        check_svg((folder / "section.svg").read_bytes(), rows)
        html = check_html((folder / "reading.html").read_text(), native, csv_bytes)
        check_html((folder / "offline-reading.html").read_text(), native, csv_bytes)
        receipts.append({"case": folder.name, "jointEquilibria": 14, "blockMomentBalances": 13,
                         "baseMomentBalance": True, "jointFrictionBounds":14,"baseFrictionBounds":2, "reading": html, "offlineEquivalent": True})
    pdf = out / "chromium-1440/reading.pdf"
    pdf_text = words(subprocess.check_output(["pdftotext", "-layout", str(pdf), "-"], text=True))
    html = (out / "chromium-1440/reading.html").read_text()
    article_paragraphs = []
    for article in re.findall(r'<article class="ar-reading">(.*?)</article>', html, re.S):
        for p in re.findall(r'<p(?:\s[^>]*)?>(.*?)</p>', article, re.S):
            article_paragraphs.append(words("".join(Text(p).parts)))
    assert len(article_paragraphs) == 15
    for paragraph in article_paragraphs:
        assert paragraph in pdf_text, paragraph
    dl = re.search(r"Words in this passage</h2>(<dl>.*?</dl>)", html, re.S)
    assert dl
    notes = [words("".join(Text(dd).parts)) for dd in re.findall(r"<dd>(.*?)</dd>", dl[1], re.S)]
    assert len(notes) == 8
    for note in notes:
        assert note in pdf_text, note
    bbox = out / "reading-bbox.html"
    subprocess.run(["pdftotext", "-bbox", str(pdf), str(bbox)], check=True)
    tree = ET.fromstring(bbox.read_text())
    for page in tree.iter("{http://www.w3.org/1999/xhtml}page"):
        width, height = float(page.attrib["width"]), float(page.attrib["height"])
        for word in page.iter("{http://www.w3.org/1999/xhtml}word"):
            assert 30 <= float(word.attrib["xMin"]) <= float(word.attrib["xMax"]) <= width - 30, word.attrib
            assert 30 <= float(word.attrib["yMin"]) <= float(word.attrib["yMax"]) <= height - 30, word.attrib
    image_lines = subprocess.check_output(["pdfimages", "-list", str(pdf)], text=True).splitlines()[2:]
    assert len([line for line in image_lines if line.strip()]) == 3
    extracted=out / "pdf-images"
    extracted.mkdir(exist_ok=True)
    subprocess.run(["pdfimages","-j",str(pdf),str(extracted / "source")],check=True)
    jpeg_files=sorted(extracted.glob("*.jpg"))
    assert len(jpeg_files)==3
    for file,page in zip(jpeg_files,MANIFEST["pages"]):
        assert digest(file.read_bytes())==page["sha256"], file
    info = subprocess.check_output(["pdfinfo", str(pdf)], text=True)
    pages = int(re.search(r"Pages:\s+(\d+)", info)[1])
    report = {"browserArtifacts": receipts, "pdf": {"pages": pages, "completeLatinEnglishNotesParagraphs": 15,
              "completeWordNotes": 8, "sourceImages": 3,"sourceJpegsByteIdentical":3, "textWithinMargins": True},
              "boundary": "Local actual browser downloads; no public deployment or physical printer claim"}
    (out / "artifacts.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
