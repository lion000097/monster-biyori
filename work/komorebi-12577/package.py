"""Assemble the ZIP and update manifest from the verified 1.25.77 outputs."""
import hashlib
import json
import re
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

root = Path(__file__).resolve().parents[2]
version = '1.25.77'
folder = root / 'releases' / version
previous = root / 'releases/1.25.76/monster-biyori-1.25.76.zip'
target = folder / f'monster-biyori-{version}.zip'
extras = ['CHANGELOG.md', 'TESTING.md', 'town-art.png']
compact = (folder / 'launcher-game.html').read_bytes()
updates = {'game.html': compact, 'TESTING.md': (folder / 'TESTING.md').read_bytes(),
           'CHANGELOG.md': (folder / 'CHANGELOG.md').read_text().replace('(town-art.png)', f'(releases/{version}/town-art.png)').encode()}
with ZipFile(previous) as source, ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=6) as output:
    for member in source.infolist():
        data = updates[member.filename] if member.filename in updates else source.read(member)
        output.writestr(member, data)
    for filename in extras:
        member = ZipInfo(f'releases/{version}/{filename}', date_time=(2026, 11, 27, 0, 0, 0))
        member.compress_type = ZIP_DEFLATED
        member.external_attr = 0o100644 << 16
        output.writestr(member, (folder / filename).read_bytes())
manifest = json.loads((root / 'latest.json').read_text())
manifest.update(version=version, html_url=f'https://lion000097.github.io/monster-biyori/releases/{version}/launcher-game.html',
                sha256=hashlib.sha256(compact).hexdigest())
(root / 'latest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False)+'\n')
archive = root / 'archive.html'
html = archive.read_text()
if f'data-version="{version}"' not in html:
    item = re.search(r'<li data-version="1\.25\.76">.*?</li>', html)[0]
    entry = re.sub(r'\d+\.\d+ MB', f'{target.stat().st_size/1024**2:.2f} MB', item.replace('1.25.76', version))
    archive.write_text(html.replace(item, entry+'\n'+item, 1))
print(target.stat().st_size, hashlib.sha256(target.read_bytes()).hexdigest(), flush=True)
