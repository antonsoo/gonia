"""Inspect actual native browser downloads, embedded sources and printed PDF."""
import base64
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import sys
import unicodedata
from urllib.parse import unquote

root = Path(__file__).resolve().parents[1]
directory = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/gonia-ledger-review")
manifest = json.loads((root / "public/sources/ledger/manifest.json").read_text())
report = json.loads((directory / "browser.json").read_text())

class Study(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images = []
        self.downloads = {}

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "img":
            self.images.append(base64.b64decode(a["src"].split(",", 1)[1]))
        if tag == "a" and "download" in a:
            href = a["href"]
            head, data = href.split(",", 1)
            self.downloads[a["download"]] = base64.b64decode(data) if ";base64" in head else unquote(data).encode()

expected_images = {p["sha256"] for p in manifest["pages"]}
html_results = []
for config in report["configurations"]:
    text = (directory / config["html"]).read_text()
    parsed = Study()
    parsed.feed(text)
    assert {sha256(b).hexdigest() for b in parsed.images} == expected_images
    assert len(parsed.images) == 4
    for font in re.findall(r"url\('(data:font/[^']+)'\)", text):
        decoded = base64.b64decode(font.split(",", 1)[1])
        assert sha256(decoded).hexdigest() in set(manifest["assets"].values())
    assert len(re.findall(r"url\('(data:font/[^']+)'\)", text)) == 3
    assert parsed.downloads["ig-476-excerpt.xml"] == (root / "public/sources/ledger/ig-476-excerpt.xml").read_bytes()
    assert parsed.downloads["gonia-ledger-100.csv"] == (directory / config["csv"]).read_bytes()
    for license_file in ["IBMPlex-OFL.txt", "NotoSerif-OFL.txt"]:
        # HTMLParser.unescape is implicit for text; normalize escaped source.
        from html import unescape
        assert (root / "public/fonts" / license_file).read_text() in unescape(text)
    assert "CC BY 4.0" in text and "restored" in text and "personally received" in text
    html_results.append({"file": config["html"], "sourceImages": 4, "fonts": 3, "exactCSV": True, "exactEditedXML": True})

pdf = directory / "ledger-reading.pdf"
pdf_text = subprocess.check_output(["pdftotext", "-layout", str(pdf), "-"], text=True)
pdf_text = unicodedata.normalize("NFC", pdf_text)
for name in ["Simias", "Kerdon", "Sindron", "Sokles", "Sannion", "Epieikes", "Sosandros"]:
    assert name in pdf_text, name
for note in ["Earlier: 90", "Later: 100", "100 dr.", "14 dr. 2 ob.", "14 dr. 1 ob.", "21 distributions", "IG lines", "CC BY 4.0", "SIL OPEN FONT LICENSE"]:
    assert note in pdf_text, note
for page in ["p. 390", "p. 392", "p. 412", "Title page"]:
    assert page in pdf_text, page
for word in ["ῥαβδόσεος", "οἰκῶν", "Σιμίο", "ἑχσῆς"]:
    assert word in pdf_text, word
bounds = subprocess.check_output(["pdftotext", "-bbox", str(pdf), "-"], text=True)
from xml.etree import ElementTree as ET
doc = ET.fromstring(bounds)
text_words = 0
for page in doc.findall(".//{*}page"):
    width, height = float(page.attrib["width"]), float(page.attrib["height"])
    for word in page.findall(".//{*}word"):
        assert 0 <= float(word.attrib["xMin"]) <= float(word.attrib["xMax"]) <= width, word.text
        assert 0 <= float(word.attrib["yMin"]) <= float(word.attrib["yMax"]) <= height, word.text
        text_words += 1
images_dir = directory / "pdf-images"
images_dir.mkdir(exist_ok=True)
subprocess.run(["pdfimages", "-j", str(pdf), str(images_dir / "source")], check=True)
pdf_image_hashes = {sha256(p.read_bytes()).hexdigest() for p in images_dir.glob("*.jpg")}
assert expected_images <= pdf_image_hashes, {"missingOriginalJPEGs": sorted(expected_images - pdf_image_hashes)}
pages = int(re.search(r"Pages:\s+(\d+)", subprocess.check_output(["pdfinfo", str(pdf)], text=True))[1])
result = {"HTML": html_results, "PDF": {"file": pdf.name, "pages": pages, "completeSourceJPEGsRecovered": len(expected_images), "names": 7, "GreekNotesAndLicensesPresent": True, "wordsWithinPageBounds": text_words}}
(directory / "artifacts.json").write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps(result, indent=2))
