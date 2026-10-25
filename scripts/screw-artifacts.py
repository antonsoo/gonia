#!/usr/bin/env python3
"""Inspect actual browser downloads, SVG coordinates, embedded bytes and printed PDF.

Run with the same NumPy/SciPy environment as screw-oracle.py. No app imports.
"""
import argparse
import base64
import csv
from functools import lru_cache
import hashlib
from html.parser import HTMLParser
import importlib.util
import io
import json
import math
from pathlib import Path
import re
import subprocess
import tempfile
import unicodedata
from urllib.parse import parse_qs
import xml.etree.ElementTree as ET
from scipy.integrate import quad

spec = importlib.util.spec_from_file_location("radial_oracle", Path(__file__).with_name("screw-oracle.py"))
oracle = importlib.util.module_from_spec(spec)
spec.loader.exec_module(oracle)
P = math.pi
parser = argparse.ArgumentParser()
parser.add_argument("review", help="Real browser review.json; files are resolved beside it")
parser.add_argument("--readings", required=True, help="JSON of the twelve source learning units")
args = parser.parse_args()
review_file = Path(args.review)
review = json.loads(review_file.read_text())
readings = json.loads(Path(args.readings).read_text())
manifest = json.loads(Path("public/sources/screw/manifest.json").read_text())
sha = lambda b: hashlib.sha256(b).hexdigest()
normal = lambda s: " ".join(unicodedata.normalize("NFKC", s).replace("\u00ad", "").split())

def settings(query):
    d = {"units": "digits", "starts": "8", "lead": "100", "angle": "370", "sourceSlope": "true", "turn": "0", "cut": "500"}
    d.update({k: v[0] for k,v in parse_qs(query.removeprefix("?")).items()})
    rho = .5 if d["units"] == "digits" else 2/3
    pitch = 2*P*rho*int(d["lead"])/100
    angle = math.atan2(3,4) if d["sourceSlope"] == "true" else int(d["angle"])*P/1800
    return d, rho, pitch, angle, math.tan(angle)*pitch/(2*P)

@lru_cache(maxsize=100)
def capacity(rho, lam, n):
    first = math.acos(-lam/rho) if lam < rho else P
    if lam >= 1: return first, first, 0.0
    broad_end = first+2*P+2*P/n
    # Find the last wet sample using the independent radial area, then bisect
    # its boundary. This does not reuse the app's piecewise endpoint equations.
    wet = [(i, first+(broad_end-first)*i/512) for i in range(513) if oracle.area(rho,lam,n,first+(broad_end-first)*i/512) > 1e-14]
    assert wet
    i, lo = wet[-1]
    hi = min(broad_end, first+(broad_end-first)*(i+1)/512)
    for _ in range(55):
        mid = (lo+hi)/2
        if oracle.area(rho,lam,n,mid)>1e-15: lo=mid
        else: hi=mid
    last=(lo+hi)/2
    volume=sum(quad(lambda p:oracle.area(rho,lam,n,p), first+(last-first)*i/24,first+(last-first)*(i+1)/24,epsabs=3e-8,limit=150)[0] for i in range(24))
    return first,last,n*volume/(2*P*P)

class Study(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.images=[]; self.links=[]; self.text=[]; self.articles=0
        self.feed(text)
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        assert tag not in ["script","iframe","object","embed"]
        assert not any(k.lower().startswith("on") for k in a)
        if tag=="img": self.images.append(a["src"])
        if tag=="a": self.links.append(a)
        if tag=="article": self.articles+=1
    def handle_data(self,text): self.text.append(text)

def check_csv(blob):
    rows=list(csv.reader(io.StringIO(blob.decode())))
    assert b"\r\n" in blob and b"\r\r\n" not in blob
    meta={r[0]:r[1] for r in rows[:19] if len(r)==2}
    d,rho,pitch,angle,lam=settings(meta["settings"]); n=int(d["starts"])
    first,last,fraction=capacity(rho,lam,n)
    assert abs(float(meta["water_fraction"])-fraction)<2e-7
    assert abs(float(meta["water_per_turn"])-fraction*P*pitch)<4e-6
    header=next(i for i,r in enumerate(rows) if r and r[0]=="cut_fraction")
    sections=rows[header+1:]; assert len(sections)==201
    for r in sections:
        cut,phi,x,w,area=map(float,r)
        assert abs(phi-(first+(last-first)*cut))<2e-7
        assert abs(x-pitch*(phi+int(d["turn"])*P/180)/(2*P))<1e-10
        assert abs(area-oracle.area(rho,lam,n,phi))<2e-7
    return len(sections)

rows=[]; snapshots=0; sections=0; max_rendered_error=0.0
for config in review["configurations"]:
    folder=review_file.parent/f'{config["browser"]}-{config["width"]}'
    for item in config["downloads"]:
        b=(folder/item["name"]).read_bytes(); assert len(b)==item["bytes"] and sha(b)==item["sha256"]
    sections+=check_csv((folder/"measurements.csv").read_bytes())
    for name in ["reading.html","offline-reading.html"]:
        text=(folder/name).read_text(); study=Study(text)
        assert study.articles==12 and len(study.images)==5
        image_hashes=[sha(base64.b64decode(u.split(",",1)[1],validate=True)) for u in study.images]
        assert image_hashes==[p["sha256"] for p in manifest["pages"]]
        fonts=re.findall(r"data:font/[^;]+;base64,([A-Za-z0-9+/=]+)",text)
        assert len(fonts)==2
        assert set(sha(base64.b64decode(f)) for f in fonts)=={sha(Path("public/fonts"/Path(f)).read_bytes()) for f in ["IBMPlexSans-Regular.woff2","NotoSerif-Regular.ttf"]}
        plain=normal(" ".join(study.text))
        for p in readings:
            for field in [p["latin"],p["english"],p["note"],*[v for pair in p["words"] for v in pair]]:
                assert normal(field) in plain, (name,field)
        assert normal(Path("LICENSE").read_text()) in plain
        for f in ["NotoSerif-OFL.txt","IBMPlex-OFL.txt"]: assert normal((Path("public/fonts")/f).read_text()) in plain
        for link in study.links:
            if link.get("download")=="screw-measurements.csv": sections+=check_csv(base64.b64decode(link["href"].split(",",1)[1]))
        assert "default-src 'none'" in text
    wrap=ET.fromstring((folder/"wrap.svg").read_text())
    assert wrap.attrib["width"]=="210mm" and wrap.attrib["height"]=="297mm"
    box=wrap.find(".//{http://www.w3.org/2000/svg}rect")
    assert abs(float(box.attrib["width"])-30*P)<1e-10
    assert abs(float(box.attrib["height"])-30*P)<1e-10
    assert any(node.attrib.get("d")=="M20,165h25m-25,-2v4m25,-4v4" for node in wrap.iter())
    for snap in config["snapshots"]:
        d,rho,pitch,angle,lam=settings(snap["query"])
        if "controls" in snap:
            q="&".join(f"{k}={str(v).lower()}" for k,v in snap["controls"].items()); d,rho,pitch,angle,lam=settings(q)
        n=int(d["starts"]); first,last,fraction=capacity(rho,lam,n)
        phi=first+(last-first)*int(d["cut"])/1000
        expected=oracle.area(rho,lam,n,phi)
        assert abs(snap["cutArea"]-expected)<2e-7, (d,snap["cutArea"],expected)
        error=abs(snap["renderedArea"]-expected);max_rendered_error=max(max_rendered_error,error)
        assert error<.001
        assert abs(float(snap["fractionText"].strip("%").replace(",",""))-fraction*100)<.00501
        assert abs(float(snap["perTurnText"].split()[0].replace(",",""))-fraction*P*pitch)<.000006
        if snap["axis"] is not None: assert abs(snap["axis"]-pitch*(phi+int(d["turn"])*P/180)/(2*P))<2e-7
        if snap["worldLevel"] is not None:
            expected_level=math.cos(angle)*(rho*math.sin(first)+lam*first+lam*int(d["turn"])*P/180)
            assert abs(snap["worldLevel"]-expected_level)<1e-10
            assert abs(snap["renderedLevel"][1]-snap["renderedLevel"][3])<1e-10
        for net in snap["netLines"]:
            x1,y1,x2,y2=net["points"]
            assert abs((y2-y1)/(x2-x1)-100/int(d["lead"]))<1e-10
        snapshots+=1
    rows.append({"browser":config["browser"],"width":config["width"],"embeddedReadings":2,"fullSourcePagesPerReading":5,"nativeCsvSections":201,"paperWrapMm":[210,297],"passed":True})

pdf=review_file.parent/"chromium-1440/reading.pdf"
with tempfile.TemporaryDirectory() as directory:
    subprocess.run(["pdfimages","-j",str(pdf),str(Path(directory)/"page")],check=True,capture_output=True)
    extracted={sha(p.read_bytes()) for p in Path(directory).glob("*.jpg")}
    assert {p["sha256"] for p in manifest["pages"]}.issubset(extracted)
    xml=subprocess.check_output(["pdftotext","-bbox",str(pdf),"-"],text=True)
    root=ET.fromstring(xml); ns={"h":"http://www.w3.org/1999/xhtml"}
    words=0; pages=root.findall(".//h:page",ns)
    for page in pages:
        w,h=float(page.attrib["width"]),float(page.attrib["height"])
        for word in page.findall(".//h:word",ns):
            words+=1
            assert float(word.attrib["xMin"])>=-1 and float(word.attrib["yMin"])>=-1
            assert float(word.attrib["xMax"])<=w+1 and float(word.attrib["yMax"])<=h+1
    printed=normal(subprocess.check_output(["pdftotext",str(pdf),"-"],text=True))
    fields=0
    for p in readings:
        for field in [p["latin"],p["english"],p["note"],*[v for pair in p["words"] for v in pair]]:
            assert normal(field) in printed,field
            fields+=1
    info=subprocess.check_output(["pdfinfo",str(pdf)],text=True)
    assert "JavaScript:      no" in info
print(json.dumps({"configurations":rows,"svgSnapshots":snapshots,"csvSections":sections,"maximumRenderedAreaDifference":max_rendered_error,"pdf":{"pages":len(pages),"words":words,"languageFields":fields,"sourceJpegsByteIdentical":5,"noJavaScript":True,"allTextInPageBounds":True},"passed":True},indent=2))
