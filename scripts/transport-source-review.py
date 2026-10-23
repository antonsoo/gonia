"""Reproduce the complete JPEG pages from both the identified original and bundled PDF."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import urllib.request

root=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser();parser.add_argument('--pdf',type=Path);args=parser.parse_args()
m=json.loads((root/'docs/transport-source-identities.json').read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
with tempfile.TemporaryDirectory(prefix='gonia-transport-source-') as directory:
    tmp=Path(directory);original=args.pdf
    if original is None:
        original=tmp/'krohn.pdf';urllib.request.urlretrieve(m['original_url'],original)
    assert sha(original)==m['original_sha256'],'Different original PDF edition'
    verified=[]
    for i,(printed,page) in enumerate(m['printed_to_pdf_pages'].items(),1):
        expected=m['files'][f'sources/transport/krohn-{printed}.jpg']
        for label,pdf,n in [('original',original,page),('bundled',root/'public/sources/transport/vitruvius-230-231.pdf',i)]:
            out=tmp/f'{label}-{printed}'
            subprocess.run(['pdftoppm','-f',str(n),'-l',str(n),'-scale-to','2000','-jpeg','-jpegopt','quality=85','-singlefile',str(pdf),str(out)],check=True)
            assert sha(out.with_suffix('.jpg'))==expected,(label,printed,'Different renderer or page content')
        verified.append({'printed':int(printed),'original_pdf_page':page,'bundled_pdf_page':i,'sha256':expected})
    for file,digest in m['files'].items():assert sha(root/'public'/file)==digest,('Bundled asset differs',file)
print(json.dumps({'original_pdf_sha256':m['original_sha256'],'pages_reproduced_from_original_and_bundled_pdf':verified,'bundled_assets_verified':len(m['files'])},indent=2))
