"""Package 1.25.81 without dropping files bundled with the previous release."""
import hashlib
import json
import re
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

root = Path(__file__).resolve().parents[2]
version = '1.25.81'
old = '1.25.80'
folder = root / 'releases' / version
previous = root / 'releases' / old / f'monster-biyori-{old}.zip'
target = folder / f'monster-biyori-{version}.zip'
docs = ['CHANGELOG.md', 'TESTING.md']
compact = (folder / 'launcher-game.html').read_bytes()
updates = {'game.html': compact, **{name:(folder / name).read_bytes() for name in docs}}

with ZipFile(previous) as source, ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=6) as output:
    for entry in source.infolist():
        data = updates[entry.filename] if entry.filename in updates else source.read(entry)
        output.writestr(entry, data)
    for name in docs:
        entry = ZipInfo(f'releases/{version}/{name}', date_time=(2026,11,28,0,0,0))
        entry.compress_type = ZIP_DEFLATED
        entry.external_attr = 0o100644 << 16
        output.writestr(entry, updates[name])

manifest = json.loads((root / 'latest.json').read_text())
manifest.update(version=version, html_url=f'https://lion000097.github.io/monster-biyori/releases/{version}/launcher-game.html',
                sha256=hashlib.sha256(compact).hexdigest())
(root / 'latest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False)+'\n')
archive = root / 'archive.html'
html = archive.read_text()
if f'data-version="{version}"' not in html:
    item = re.search(rf'<li data-version="{re.escape(old)}">.*?</li>',html)[0]
    entry = re.sub(r'\d+\.\d+ MB',f'{target.stat().st_size/1024**2:.2f} MB',item.replace(old,version))
    archive.write_text(html.replace(item,entry+'\n'+item.replace(' ・ 現行配布',''),1))
print('ZIP:', target.stat().st_size,hashlib.sha256(target.read_bytes()).hexdigest(),flush=True)
