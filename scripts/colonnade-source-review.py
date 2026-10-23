"""Reproduce Latin scans and optionally compare all library image responses."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import urllib.request

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--pdf', type=Path, help='Identified original Krohn PDF; downloaded if omitted')
parser.add_argument('--online', action='store_true', help='Also compare current Heidelberg image bytes and rights metadata')
args = parser.parse_args()
m = json.loads((root/'docs/colonnade-source-identities.json').read_text())
sha = lambda b: hashlib.sha256(b).hexdigest()
verified = []
with tempfile.TemporaryDirectory(prefix='gonia-colonnade-source-') as directory:
    tmp = Path(directory)
    original = args.pdf
    if original is None:
        original = tmp/'krohn.pdf'
        urllib.request.urlretrieve(m['latin']['original_url'], original)
    assert sha(original.read_bytes()) == m['latin']['original_sha256'], 'Different original PDF'
    for printed, page in m['latin']['printed_to_pdf_pages'].items():
        out = tmp/f'krohn-{printed}'
        subprocess.run(['pdftoppm', '-f', str(page), '-l', str(page), '-scale-to', '2200',
                        '-jpeg', '-jpegopt', 'quality=86', '-singlefile', str(original), str(out)], check=True)
        digest = sha(out.with_suffix('.jpg').read_bytes())
        assert digest == m['files'][f'sources/colonnade/krohn-{int(printed):03d}.jpg'], ('Renderer or page differs', printed)
        verified.append({'printed': int(printed), 'pdf_page': page, 'sha256': digest})
    for file, digest in m['files'].items():
        assert sha((root/'public'/file).read_bytes()) == digest, ('Bundled file differs', file)
    library = []
    if args.online:
        with urllib.request.urlopen(m['archaeology']['manifest']) as r:
            manifest = json.load(r)
        assert 'publicdomain/mark/1.0' in manifest['license']
        assert any('Heidelberg' in a['@value'] for a in manifest['attribution'])
        for file, url in m['archaeology']['images'].items():
            with urllib.request.urlopen(url) as r:
                digest = sha(r.read())
            assert digest == m['files'][f'sources/colonnade/{file}'], ('Current library response differs', file)
            library.append({'file': file, 'sha256': digest})
print(json.dumps({'latin_pages_reproduced': verified, 'bundled_assets_verified': len(m['files']),
                  'online_library_responses_compared': library,
                  'online_rights_metadata_checked': args.online}, indent=2))
