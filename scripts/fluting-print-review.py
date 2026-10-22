# /// script
# requires-python = ">=3.10"
# dependencies = ["pymupdf==1.28.2"]
# ///
"""Inspect the browser's real vector PDF; does not establish physical printing."""
import json,sys
from pathlib import Path
import pymupdf
root=Path(sys.argv[1])
template=pymupdf.open(root/'template.pdf')
assert len(template)==1
page=template[0]
width=page.rect.width*25.4/72
height=page.rect.height*25.4/72
assert abs(width-190)<.27 and abs(height-277)<.27
bars=[]
for drawing in page.get_drawings():
 for item in drawing['items']:
  if item[0]!='l':continue
  a,b=item[1:]
  length=abs(a.x-b.x)*25.4/72
  if abs(a.y-b.y)<.001 and abs(length-25)<.01:bars.append(length)
assert len(bars)==1,bars
reading=pymupdf.open(root/'reading.pdf')
text='\n'.join(page.get_text() for page in reading)
assert 'κίονος' in text and 'circini' in text and 'Jocundus' in text
assert 'in medio quadrato' in text
assert 'τμήματι' in text and 'segmento maiore' in text.replace('\n',' ')
# All five unchanged JPEG byte streams must survive the PDF export.
import hashlib
expected={hashlib.sha256((Path('public/sources/fluting')/f).read_bytes()).hexdigest() for f in ['krohn-085.jpg','krohn-074.jpg','bywater-205.jpg','heiberg-240.jpg','heiberg-241.jpg']}
observed=set()
for page in reading:
 for img in page.get_images():
  observed.add(hashlib.sha256(reading.extract_image(img[0])['image']).hexdigest())
assert expected<=observed
print(json.dumps(dict(status='passed',pdf_engine=pymupdf.VersionBind,page_width_mm=width,page_height_mm=height,calibration_bar_mm=bars[0],reading_pages=len(reading),unchanged_source_jpegs=5,greek_and_latin_extractable=True,scope='Native browser PDF vector dimensions and source streams; physical printer scaling unverified'),indent=2))
