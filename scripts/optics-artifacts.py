"""Inspect actual CSV, HTML, SVG and printed PDF downloads independently."""
import base64, csv, hashlib, json, math, re, subprocess, sys, unicodedata
from pathlib import Path
from xml.etree import ElementTree as ET
root=Path(sys.argv[1]);repo=Path(__file__).resolve().parents[1]
manifest=json.loads((repo/'public/sources/optics/manifest.json').read_text())
fields=json.loads(subprocess.check_output(['node','--import','tsx','--input-type=module','-e',"import {opticsPassages} from './src/optics-content.ts'; console.log(JSON.stringify(opticsPassages.flatMap(p=>[p.latin,p.english,p.note,...p.words.flatMap(w=>[w.word,w.gloss,w.note,...(w.greek?[w.greek]:[])])])));"],cwd=repo))
def norm(s):return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s)).strip()
rows=[]
for folder in sorted(root.glob('*-*')):
    if not (folder/'viewpoint.csv').exists():continue
    data=list(csv.DictReader((folder/'viewpoint.csv').open()))
    assert len(data)==1589
    for row in data:
        d,H,e,L=[float(row[k]) for k in ['horizontal_distance_m','face_centre_height_m','eye_height_m','face_edge_length_m']]
        a=math.radians(float(row['forward_angle_degrees']));v=H-e;R=math.hypot(d,v)
        points=[(d-f*L*math.sin(a),H+f*L*math.cos(a)) for f in [-.5,-.25,0,.25,.5]]
        rays=[math.hypot(x,z-e) for x,z in points]
        image=[]
        for x,z in points:
            t=R*R/(d*x+v*(z-e))
            image.append((-v*(t*x-d)+d*(t*(z-e)-v))/(R*L))
        expected={'upper_ray_m':rays[-1],'lower_ray_m':rays[0],'upper_minus_lower_m':rays[-1]-rays[0],'upper_lower_projected_half_ratio':image[-1]/-image[0]}
        for key,value in expected.items():assert abs(float(row[key])-value)<1e-9,(key,row,value)
        for key,value in zip(['bottom_normalized_image','lower_quarter_normalized_image','centre_normalized_image','upper_quarter_normalized_image','top_normalized_image'],image):assert abs(float(row[key])-value)<1e-10
    svg=ET.fromstring((folder/'viewpoint.svg').read_text());ns={'s':'http://www.w3.org/2000/svg'}
    saved=json.loads(svg.find('s:metadata',ns).text)
    assert saved['settings']=={'distance':300,'height':120,'eye':16,'length':40,'angle':48,'mode':'source','reading':4}
    book=(folder/'reading.html').read_text()
    for field in fields:assert field.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;') in book,field
    image_hashes=[hashlib.sha256(base64.b64decode(s)).hexdigest() for s in re.findall(r'<img[^>]*src="data:image/jpeg;base64,([^"]+)"',book)]
    expected_hashes=[v for k,v in manifest['assets'].items() if k.endswith('.jpg')]
    assert sorted(image_hashes)==sorted(expected_hashes)
    assert 'Permission is hereby granted, free of charge' in book
    assert 'Study edition:' in book
    rows.append({'configuration':folder.name,'actualCSVDataRows':len(data),'CSVGeometryComparisons':len(data)*9,'sourceAndLanguageFieldsInHTML':len(fields),'originalJPEGsInHTML':len(image_hashes),'SVGSettings':saved['settings']})
assert len(rows)==4
pdf=root/'chromium-1440/reading.pdf';txt=subprocess.check_output(['pdftotext','-layout',str(pdf),'-']).decode();text=norm(txt)
for field in fields:assert norm(field) in text,('PDF field missing',field)
assert 'Permission is hereby granted, free of charge' in text
compact=lambda value: ''.join(unicodedata.normalize('NFKC',value).split())
assert compact((repo/'LICENSE').read_text()) in compact(txt)
extracted=root/'pdf-images';extracted.mkdir(exist_ok=True)
subprocess.run(['pdfimages','-j',str(pdf),str(extracted/'image')],check=True)
found=[hashlib.sha256(p.read_bytes()).hexdigest() for p in extracted.glob('*.jpg')]
for h in expected_hashes:assert h in found,('Original JPEG absent from PDF',h)
info=subprocess.check_output(['pdfinfo',str(pdf)]).decode();pages=int(re.search(r'Pages:\s+(\d+)',info)[1])
print(json.dumps({'method':'Python CSV ray/screen calculations; native SVG metadata; complete language fields and original JPEG hashes in actual HTML and Chromium print output.','configurations':rows,'printedPDF':{'pages':pages,'completeLanguageFields':len(fields),'originalJPEGsRecoveredByteForByte':len(expected_hashes)},'scope':'Artifact identity and modern geometry, not historical perception.'},indent=2))
