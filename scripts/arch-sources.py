"""Reproduce the complete public-domain printed pages. Requires Poppler.

python3 scripts/arch-sources.py /path/to/krohn.pdf
The source URL and original PDF identity are retained in the output manifest.
"""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/sources/arch"
ORIGINAL = {
    "url": "https://archive.org/download/vitruviidearchit00vitr_1/vitruviidearchit00vitr_1.pdf",
    "sha256": "b13a68789a8a1dc567b6f9b47eabe6a37a306329fbfc2c1a027a6c30a90d5139",
    "edition": "Vitruvii De architectura libri decem, ed. F. Krohn, Leipzig: Teubner, 1912",
    "rights": "Public domain. Complete printed pages, including critical apparatus.",
}
PAGES = [
    (159, "krohn-141", "Vitruvius VI.8.1-6, Krohn 1912, p. 141",
     "Radial wedges, relieving arches and wider outer piers. The complete apparatus remains below the text."),
    (158, "krohn-140", "Vitruvius VI.7-8.1, Krohn 1912, p. 140",
     "The chapter's opening and preceding context. Chapter VI.8 begins near the foot of this page."),
    (5, "krohn-title", "Krohn 1912, title page",
     "Identifies the printed edition. This is a twentieth-century edition of an ancient work."),
]


def identity(path):
    data = path.read_bytes()
    return {"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}


def main():
    pdf = Path(sys.argv[1])
    if identity(pdf)["sha256"] != ORIGINAL["sha256"]:
        raise ValueError("The PDF does not match the retained original identity")
    OUT.mkdir(parents=True, exist_ok=True)
    pages = []
    for page, stem, title, note in PAGES:
        subprocess.run(["pdftoppm", "-f", str(page), "-l", str(page), "-singlefile",
                        "-scale-to", "2200", "-jpeg", "-jpegopt", "quality=88",
                        str(pdf), str(OUT / stem)], check=True)
        pages.append({"file": f"{stem}.jpg", "pdfPage": page, "title": title,
                      "note": note, **identity(OUT / f"{stem}.jpg")})
    related = ["fonts/IBMPlexSans-Regular.woff2", "fonts/IBMPlexSans-SemiBold.woff2",
               "fonts/NotoSerif-Regular.ttf", "fonts/IBMPlex-OFL.txt", "fonts/NotoSerif-OFL.txt"]
    manifest = {"original": ORIGINAL, "retrieved": "2026-10-27", "pages": pages,
                "derivation": "Poppler pdftoppm, complete page at longest edge 2200 px, JPEG quality 88. No cropping, retouching or reconstruction.",
                "relatedAssets": {p: identity(ROOT / "public" / p) for p in related}}
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({"pages": len(pages), "bytes": sum(p["bytes"] for p in pages)}))


if __name__ == "__main__":
    main()
