#!/usr/bin/env python3
"""Check every rendered triangle and UV against the original deposited OBJ.

Independent reader; no converter imports. The audit checks retained positions,
triangle order, texture correspondences, normals and raw source identities.
"""
import argparse
import array
import gzip
import hashlib
import json
import math
import re
import struct
from pathlib import Path

parser=argparse.ArgumentParser();parser.add_argument('obj',type=Path);parser.add_argument('texture',type=Path);args=parser.parse_args()
manifest=json.loads(Path('public/sources/babylon/manifest.json').read_text())
raw=args.obj.read_bytes();original=raw.decode('ascii',errors='replace')
assert hashlib.md5(raw).hexdigest()=='a26002ffd015f721920ee07f2d57a675'
texture=args.texture.read_bytes();assert hashlib.md5(texture).hexdigest()=='529dbaa4b503904fe9f8641e84c86179'
positions=[tuple(map(float,x.split())) for x in re.findall(r'^v (.+)$',original,re.M)]
uv=[tuple(map(float,x.split())) for x in re.findall(r'^vt (.+)$',original,re.M)]
faces=re.findall(r'^f (.+)$',original,re.M)
decoded=gzip.decompress(Path('public/sources/babylon/stele.mesh').read_bytes())
assert decoded[:8]==b'GONIAS01'
n,m=struct.unpack_from('<II',decoded,8)
assert n==len(positions)==103234 and m==len(faces)*3==189027*3
assert len(decoded)==16+n*32+m*4
vertices=list(struct.iter_unpack('<8f',decoded[16:16+32*n]))
indices=struct.unpack_from(f'<{m}I',decoded,16+32*n)
used=set();error=0.;uv_error=0.;smallest=2.;largest=0.
for index,face in enumerate(faces):
    pairs=[tuple(int(i)-1 for i in item.split('/')) for item in face.split()]
    assert len(pairs)==3
    for corner,(v,t) in enumerate(pairs):
        rendered=vertices[indices[index*3+corner]];used.add(v)
        expected=positions[v]
        for actual,value in zip(rendered[:3],expected):
            assert actual==array.array('f',[value])[0]
            error=max(error,abs(actual-value))
        for actual,value in zip(rendered[6:],uv[t]):
            assert actual==array.array('f',[value])[0]
            uv_error=max(uv_error,abs(actual-value))
for v in vertices:
    norm=math.hypot(*v[3:6]);smallest=min(smallest,norm);largest=max(largest,norm)
assert len(used)==len(positions) and smallest>.9999999 and largest<1.0000001
for name,item in manifest['files'].items():
    b=(Path('public/sources/babylon')/name).read_bytes()
    assert len(b)==item['bytes'] and hashlib.sha256(b).hexdigest()==item['sha256'],name
print(json.dumps({'status':'passed','sourceObjMd5':hashlib.md5(raw).hexdigest(),'sourceTextureMd5':hashlib.md5(texture).hexdigest(),'positionsAllRetained':len(used),'trianglesCheckedInSourceOrder':len(faces),'vertexTextureCorrespondencesChecked':m,'maximumCoordinateFloat32Rounding':error,'maximumUvFloat32Rounding':uv_error,'normalLengthRange':[smallest,largest],'sourceAssetsMatchManifest':len(manifest['files']),'method':'Independent OBJ regex reader and binary struct reader; every triangle corner compared'},indent=2))
