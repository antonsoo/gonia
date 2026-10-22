"""Package the five reviewed JPEG scans unchanged into a five-page PDF.

No image re-encoding, network access or third-party Python package is needed.
Coordinates fit each complete scan, including the library attribution, on A4.
"""
from hashlib import sha256
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIRECTORY = ROOT / "public/sources/entasis"
PAGES = [
    ("penrose-039.jpg", 2675, 4203, "Penrose (1888), p. 39 - Heidelberg University Library - Public domain", "9fc580752d535a0eb0be60b6aec035c078bab4f69b74aded7f4a90b567024b07"),
    ("penrose-040.jpg", 2675, 4203, "Penrose (1888), p. 40 - Heidelberg University Library - Public domain", "59d088f75181c483300ebb0e3b136148bde990dfee83841a269d96a7aca4c144"),
    ("penrose-041.jpg", 2675, 4203, "Penrose (1888), p. 41 - Heidelberg University Library - Public domain", "7b5dd6ae503603cb99564905004290b01fc4b91015f8326eb5a028aa70dd4c25"),
    ("penrose-Taf_14.jpg", 4013, 2961, "Penrose (1888), plate XIV - Heidelberg University Library - Public domain", "2ed65b3bdba64d8817c4b04676e67eadcc6b5b0fd360c0495f6b6c2df017e227"),
    ("krohn-068.jpg", 1414, 2200, "Vitruvius, Krohn (1912), p. 68 - Internet Archive - Public domain", "4fa9ef64924b677902b225ebc022efb13246151ea16fff2c1f7d60bdc92d0cd2"),
]


def escaped(text):
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


objects = [b"", b"", b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"]
kids = []
for filename, width, height, caption, digest in PAGES:
    image = (DIRECTORY / filename).read_bytes()
    if sha256(image).hexdigest() != digest:
        raise ValueError(f"Unreviewed scan: {filename}")
    landscape = width > height
    page_w, page_h = (842, 595) if landscape else (595, 842)
    factor = min((page_w - 36) / width, (page_h - 54) / height)
    draw_w, draw_h = width * factor, height * factor
    left, bottom = (page_w - draw_w) / 2, 18
    image_id = len(objects) + 1
    objects.append(f"<< /Type /XObject /Subtype /Image /Width {width} /Height {height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length {len(image)} >>\nstream\n".encode() + image + b"\nendstream")
    content = f"BT /F1 9 Tf 18 {page_h - 21} Td ({escaped(caption)}) Tj ET\nq {draw_w:.6f} 0 0 {draw_h:.6f} {left:.6f} {bottom:.6f} cm /Scan Do Q\n".encode()
    content_id = len(objects) + 1
    objects.append(f"<< /Length {len(content)} >>\nstream\n".encode() + content + b"endstream")
    page_id = len(objects) + 1
    objects.append(f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {page_w} {page_h}] /Resources << /Font << /F1 3 0 R >> /XObject << /Scan {image_id} 0 R >> >> /Contents {content_id} 0 R >>".encode())
    kids.append(f"{page_id} 0 R")
objects[0] = b"<< /Type /Catalog /Pages 2 0 R >>"
objects[1] = f"<< /Type /Pages /Count {len(PAGES)} /Kids [{' '.join(kids)}] >>".encode()
objects.append(b"<< /Title (Gonia - Entasis source pages) /Author (Francis Penrose; Vitruvius, edited by F. Krohn) /Subject (Public-domain scans; Heidelberg University Library and Internet Archive) >>")
pdf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
offsets = [0]
for number, obj in enumerate(objects, 1):
    offsets.append(len(pdf))
    pdf.extend(f"{number} 0 obj\n".encode() + obj + b"\nendobj\n")
xref = len(pdf)
pdf.extend(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode())
for offset in offsets[1:]:
    pdf.extend(f"{offset:010} 00000 n \n".encode())
pdf.extend(f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R /Info {len(objects)} 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode())
output = DIRECTORY / "entasis-source-pages.pdf"
output.write_bytes(pdf)
print(f"{output.relative_to(ROOT)}: {len(PAGES)} pages, {len(pdf)} bytes, sha256 {sha256(pdf).hexdigest()}")
