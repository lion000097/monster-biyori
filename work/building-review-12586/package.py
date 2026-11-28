"""Advance the updater manifest and distribution archive after both editions exist."""

import hashlib
import json
import re
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

root=Path(__file__).resolve().parents[2]
old='1.25.85'; version='1.25.86'; release=root/'releases'/version
current=release/f'monster-biyori-{version}.zip'
previous=root/'releases'/old/f'monster-biyori-{old}.zip'
launcher=(release/'launcher-game.html').read_bytes()
replacements={name:(release/name).read_bytes() for name in ('CHANGELOG.md','TESTING.md')}
replacements['game.html']=launcher
with ZipFile(previous) as prior,ZipFile(current,'w') as output:
    for entry in prior.infolist():
        content=replacements.get(entry.filename)
        output.writestr(entry,content if content is not None else prior.read(entry),compresslevel=9)
    for name in ('CHANGELOG.md','TESTING.md','buildings.webp'):
        entry=ZipInfo(f'releases/{version}/{name}',date_time=(2026,11,28,0,0,0))
        entry.compress_type=ZIP_DEFLATED;entry.external_attr=0o100644<<16
        output.writestr(entry,(release/name).read_bytes(),compresslevel=9)

manifest=root/'latest.json'; data=json.loads(manifest.read_text())
assert data['version'] in (old,version)
data.update(version=version,html_url=f'https://lion000097.github.io/monster-biyori/releases/{version}/launcher-game.html',
            sha256=hashlib.sha256(launcher).hexdigest())
manifest.write_text(json.dumps(data,indent=2)+'\n')
archive=root/'archive.html'; page=archive.read_text()
if f'data-version="{version}"' not in page:
    prior=re.search(r'<li data-version="1\.25\.85">.*?</li>',page)[0]
    new=re.sub(r'\d+\.\d+ MB',f'{current.stat().st_size/1024**2:.2f} MB',prior.replace(old,version))
    archive.write_text(page.replace(prior,new+'\n'+prior.replace(' ・ 現行配布',''),1))
