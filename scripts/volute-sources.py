"""Reproduce complete source pages; never crop or reconstruct a source image.

python3 scripts/volute-sources.py /path/to/original-pdfs
Original files: krohn.pdf, vignola.pdf, met-252453.json and sardis-original.jpg.
"""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/sources/volute"
ORIGINALS = {
    "krohn": {
        "url": "https://archive.org/download/vitruviidearchit00vitr_1/vitruviidearchit00vitr_1.pdf",
        "sha256": "b13a68789a8a1dc567b6f9b47eabe6a37a306329fbfc2c1a027a6c30a90d5139",
    },
    "vignola": {
        "url": "https://archive.org/download/fiveordersofarch00vign/fiveordersofarch00vign.pdf",
        "sha256": "6d0e345c552aa1f67dc093720c57d4b3d1bf84a84aef35d9fe4651fab3e6f7fd",
    },
}
PAGES = [
    ("krohn", 89, "krohn-071", "Vitruvius III.5.5–7 · Krohn 1912, p. 71",
     "Eye proportions, quarter-turn reduction, and Krohn's critical apparatus. Angle brackets mark editorial supplies."),
    ("krohn", 90, "krohn-072", "Vitruvius III.5.7–8 · Krohn 1912, p. 72",
     "The promise of a figure and calculation at the end of the book. No surviving ancient volute plate is supplied here."),
    ("vignola", 68, "vignola-xv", "Juglaris & Locke 1889 · plate XV",
     "The later construction operated on this desk. The plate bears WSL '89. Its enlarged eye labels twelve compass centres."),
    ("vignola", 69, "vignola-xv-text", "Juglaris & Locke 1889 · explanation of plate XV",
     "The English instructions name the 9, 8, 7, 6 axis points, quarters and nested centre divisions. They are not ancient Latin."),
    ("vignola", 64, "vignola-xiv", "Juglaris & Locke 1889 · plate XIV",
     "The Ionic capital in context. This is the later book's drawing, not a photograph or survey of a Greek capital."),
    ("vignola", 5, "vignola-title", "Juglaris & Locke 1889 · title page",
     "The title page identifies the translators and 1889 edition. The downloaded PDF's name must not turn it into a 1562 scan."),
]


def identity(path):
    data = path.read_bytes()
    return {"sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)}


def main():
    original_dir = Path(sys.argv[1])
    OUT.mkdir(parents=True, exist_ok=True)
    for name, source in ORIGINALS.items():
        assert identity(original_dir / f"{name}.pdf")["sha256"] == source["sha256"], name
    pages = []
    for source, page, stem, title, note in PAGES:
        subprocess.run([
            "pdftoppm", "-f", str(page), "-l", str(page), "-singlefile", "-scale-to", "2200",
            "-jpeg", "-jpegopt", "quality=88", str(original_dir / f"{source}.pdf"), str(OUT / stem),
        ], check=True)
        path = OUT / f"{stem}.jpg"
        width, height = Image.open(path).size
        pages.append({
            "file": path.name, "source": source, "pdfPage": page, "title": title, "note": note,
            "width": width, "height": height, **identity(path),
        })
    related = ["fonts/IBMPlexSans-Regular.woff2", "fonts/IBMPlexSans-SemiBold.woff2",
               "fonts/NotoSerif-Regular.ttf", "fonts/IBMPlex-OFL.txt", "fonts/NotoSerif-OFL.txt"]
    museum = json.loads((original_dir / "met-252453.json").read_text())
    assert museum["objectID"] == 252453 and museum["isPublicDomain"] is True
    photo = original_dir / "sardis-original.jpg"
    assert identity(photo)["sha256"] == "2307ca270b7ad3362f5949490eb92357a738f51ba0dbbb7104f04a48b9544827"
    shutil.copyfile(photo, OUT / "sardis-dp144130.jpg")
    width, height = Image.open(photo).size
    pages.append({
        "file": "sardis-dp144130.jpg", "source": "met", "pdfPage": None,
        "title": "A surviving capital · Sardis, The Met 26.59.1",
        "note": "Museum photograph, not a construction plate. Greek, ca. 300 BCE. The displayed column omits most of its shaft; parts of the shaft are restored and the profiled base below the torus is a copy. The capital's original position is uncertain. Our 1889 outline is not fitted to this object.",
        "width": width, "height": height, **identity(photo),
    })
    manifest = {
        "originals": {**ORIGINALS, "met": {
            "url": museum["objectURL"], "imageUrl": museum["primaryImage"],
            "apiUrl": "https://collectionapi.metmuseum.org/public/collection/v1/objects/252453",
            "objectID": 252453, "accession": "26.59.1", "date": museum["objectDate"],
            "creditLine": museum["creditLine"], "isPublicDomain": True,
            "rights": "The Met Open Access, CC0 1.0", "rightsUrl": "https://www.metmuseum.org/policies/image-resources",
            "retrieved": "2026-10-27", **identity(photo),
        }},
        "derivation": "Complete PDF pages; Poppler pdftoppm, longest side 2200 px, JPEG quality 88; no cropping or reconstruction.",
        "photographDerivation": "The Met's complete original DP144130 JPEG, retained byte for byte without cropping, resizing or retouching.",
        "pages": pages,
        "relatedAssets": {name: identity(ROOT / "public" / name) for name in related},
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({"sourcePages": len(pages), "bytes": sum(p["bytes"] for p in pages)}))


if __name__ == "__main__":
    main()
