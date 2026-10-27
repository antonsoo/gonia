#!/usr/bin/env python3
"""Inspect actual native files, source bytes, font notices and printed margins."""
import argparse
import base64
import csv
import hashlib
import json
import re
import subprocess
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote_to_bytes

parser=argparse.ArgumentParser();parser.add_argument('directory',type=Path);args=parser.parse_args()
root=args.directory
manifest=json.loads(Path('public/sources/babylon/manifest.json').read_text())
digest=lambda b:hashlib.sha256(b).hexdigest()
ns={'s':'http://www.w3.org/2000/svg'}

def data(uri):
    header,body=uri.split(',',1)
    return base64.b64decode(body,validate=True) if ';base64' in header else unquote_to_bytes(body)

class Reading(HTMLParser):
    def __init__(self):super().__init__();self.images=[];self.downloads={};self.scripts=0;self.text=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='img':self.images.append(a)
        if tag=='script':self.scripts+=1
        if tag=='a' and 'download' in a:self.downloads[a['download']]=a['href']
    def handle_data(self,value):self.text.append(value)

configurations=[]
for folder in sorted(root.glob('*-*')):
    if not folder.is_dir() or not (folder/'reading.html').exists():continue
    native_bytes=(folder/'reading.html').read_bytes()
    native=native_bytes.decode('utf-8');html=Reading();html.feed(native)
    record=(folder/'record.json').read_bytes();csv_bytes=(folder/'final.csv').read_bytes()
    assert data(html.downloads['gonia-babylon-record.json'])==record
    assert data(html.downloads['gonia-babylon-comparison.csv'])==csv_bytes
    assert (folder/'embedded.json').read_bytes()==record
    assert (folder/'embedded.csv').read_bytes()==csv_bytes
    pdf=data(html.downloads['pedersen2024.pdf'])
    assert digest(pdf)==manifest['files']['pedersen2024.pdf']['sha256']
    jpgs=[i for i in html.images if i['src'].startswith('data:image/jpeg;')]
    pngs=[i for i in html.images if i['src'].startswith('data:image/png;')]
    expected={v['sha256'] for k,v in manifest['files'].items() if k.endswith('.jpg') and k!='stele-texture.jpg'}
    assert len(jpgs)==7 and {digest(data(i['src'])) for i in jpgs}==expected
    assert len(pngs)==1 and data(pngs[0]['src']).startswith(b'\x89PNG\r\n\x1a\n')
    assert html.scripts==0 and 'Total height unresolved' in native
    fonts=re.findall(r"url\('(data:font/[^']+)'\)",native)
    font_hashes={digest(data(f)) for f in fonts}
    expected_fonts={v['sha256'] for k,v in manifest['relatedAssets'].items() if k.endswith(('.ttf','.woff2'))}
    assert font_hashes==expected_fonts
    all_text=''.join(html.text).replace('\r\n','\n')
    for filename in ['LICENSE','public/fonts/IBMPlex-OFL.txt','public/fonts/NotoSerif-OFL.txt']:
        assert Path(filename).read_text() in all_text,filename
    svg=ET.parse(folder/'plate.svg').getroot();meta=json.loads(svg.find('s:metadata',ns).text)
    assert meta['record']==json.loads(record)
    assert meta['license']==Path('LICENSE').read_text()
    assert meta['fontLicense']==Path('public/fonts/IBMPlex-OFL.txt').read_bytes().decode('utf-8-sig')
    svg_text=ET.tostring(svg,encoding='unicode')
    embedded=re.findall(r"url\('(data:font/[^']+)'\)",svg_text)
    assert len(embedded)==1 and digest(data(embedded[0]))==manifest['relatedAssets']['fonts/IBMPlexSans-Regular.woff2']['sha256']
    rows=list(csv.DictReader(csv_bytes.decode().splitlines()))
    groups=svg.findall('.//s:g',ns);assert len(groups)==14
    for g in groups:
        row=rows[int(g.attrib['data-bb-level'])-1]
        for attribute,column in [('width','tablet_length_m' if g.attrib['data-bb-kind']=='tablet' else 'projected_width_m'),('height','tablet_height_m' if g.attrib['data-bb-kind']=='tablet' else 'projected_height_m'),('bottom','tablet_bottom_m' if g.attrib['data-bb-kind']=='tablet' else 'projected_bottom_m')]:
            actual=g.attrib.get('data-bb-'+attribute,'');expect=row[column]
            assert actual==expect,(actual,expect)
    configurations.append({'configuration':folder.name,'htmlBytes':len(native_bytes),'htmlSha256':digest(native_bytes),'sourceJpegs':7,'sourcePdfSha256':digest(pdf),'fonts':len(font_hashes),'scanSnapshot':True,'exactEmbeddedRecordAndCsv':True,'nativeSvgGroupsMatchCsv':14,'fullFontAndCodeNotices':True})
assert len(configurations)==4
pdf_file=root/'chromium-1440/reading.pdf'
info=subprocess.check_output(['pdfinfo',str(pdf_file)],text=True)
plain=subprocess.check_output(['pdftotext','-layout',str(pdf_file),'-'],text=True)
normalized=' '.join(plain.split())
for fragment in ['Your two projections','Total height unresolved','84 m','24 × 22.5','Your inspection of the source scan','The complete retained source images','Attribution and licenses']:
    assert fragment in normalized,fragment
labels=['Scheil 1914, p. 300','Scheil 1914, p. 304','Scheil 1914, p. 305','Thureau-Dangin 1922, plate LIX','Thureau-Dangin 1922, plate LX','Pedersén 2024, figure 1','Pedersén 2024, figure 3']
positions=[normalized.index(label) for label in labels];assert positions==sorted(positions)
boxes=ET.fromstring(subprocess.check_output(['pdftotext','-bbox',str(pdf_file),'-']))
words=0
for page in boxes.iter():
    if page.tag.split('}')[-1]!='page':continue
    w=float(page.attrib['width']);h=float(page.attrib['height'])
    for word in page.iter():
        if word.tag.split('}')[-1]!='word':continue
        a=word.attrib;assert float(a['xMin'])>=25 and float(a['xMax'])<=w-25 and float(a['yMin'])>=25 and float(a['yMax'])<=h-25,(word.text,a)
        words+=1
font_lines=subprocess.check_output(['pdffonts',str(pdf_file)],text=True).splitlines()[2:]
assert font_lines and all(re.search(r'\s+yes\s+yes\s+(?:yes|no)\s+\d+\s+\d+\s*$',line) for line in font_lines),font_lines
assert b'/JavaScript' not in pdf_file.read_bytes()
print(json.dumps({'status':'passed','configurations':configurations,'print':{'pages':int(re.search(r'^Pages:\s+(\d+)',info,re.M).group(1)),'orderedSourceCaptions':7,'wordsInside25ptMargins':words,'embeddedFonts':len(font_lines),'pdfJavaScript':False,'physicalPrinting':'not tested','taggedPdfAccessibility':'not established'}},indent=2))
