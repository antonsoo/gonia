"""Prepare complete public-domain source pages and retain the unmodified museum image."""

from hashlib import sha256
import json
from pathlib import Path
import shutil
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
original, photograph, metadata = map(Path, sys.argv[1:4])
expected = "b13a68789a8a1dc567b6f9b47eabe6a37a306329fbfc2c1a027a6c30a90d5139"
assert sha256(original.read_bytes()).hexdigest() == expected
record = json.loads(metadata.read_text())
assert record["objectID"] == 252453 and record["isPublicDomain"] is True
folder = root / "public/sources/optics"
folder.mkdir(parents=True, exist_ok=True)
for printed in [72, 73, 74]:
    prefix = folder / f"krohn-{printed:03}"
    subprocess.run(["pdftoppm", "-f", str(printed + 18), "-l", str(printed + 18), "-scale-to", "2100", "-jpeg", "-jpegopt", "quality=88", "-singlefile", str(original), str(prefix)], check=True)
shutil.copyfile(photograph, folder / "met-252453-DP144130.jpg")
shutil.copyfile(metadata, folder / "met-252453.json")
files = [*(f"sources/optics/krohn-{p:03}.jpg" for p in [72, 73, 74]), "sources/optics/met-252453-DP144130.jpg", "sources/optics/met-252453.json", "sources/optics/NOTICES.txt", "sources/hoist/krohn-title.jpg", "fonts/NotoSerif-Regular.ttf", "fonts/IBMPlexSans-Regular.woff2", "fonts/NotoSerif-OFL.txt", "fonts/IBMPlex-OFL.txt"]
manifest = {
    "edition": "Vitruvii De architectura libri decem, ed. F. Krohn, Leipzig: B. G. Teubner, 1912",
    "originalURL": "https://archive.org/download/vitruviidearchit00vitr_1/vitruviidearchit00vitr_1.pdf",
    "originalSha256": expected,
    "pages": {"title": 5, "72": 90, "73": 91, "74": 92},
    "rendering": "pdftoppm -scale-to 2100 -jpeg -jpegopt quality=88, complete pages; no crop or retouch",
    "photograph": {"objectID": 252453, "accession": "26.59.1", "title": record["title"], "date": record["objectDate"], "credit": record["creditLine"], "source": record["primaryImage"], "objectURL": record["objectURL"], "rights": "The Met Open Access: CC0 public-domain image", "changes": "None. Original 3738 by 3790 JPEG retained."},
    "assets": {name: sha256((root / "public" / name).read_bytes()).hexdigest() for name in files},
}
(folder / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(f"Three complete source pages, original museum image and {len(files)} source/font identities retained.")
