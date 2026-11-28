"""Carry the previous distribution forward with both editions and their confirmation images."""
import hashlib,json,re
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
root=Path(__file__).resolve().parents[2]
folder=root/'releases/1.25.83'
target=folder/'monster-biyori-1.25.83.zip'
base=root/'releases/1.25.82/monster-biyori-1.25.82.zip'
compact=(folder/'launcher-game.html').read_bytes()
replaced={'game.html':compact}
for name in ['CHANGELOG.md','TESTING.md']:replaced[name]=(folder/name).read_bytes()
with ZipFile(base) as prev,ZipFile(target,'w') as out:
    for entry in prev.infolist():
        out.writestr(entry,replaced[entry.filename] if entry.filename in replaced else prev.read(entry),compresslevel=9)
    for name in ('CHANGELOG.md','TESTING.md','town-art.png'):
        item=ZipInfo('releases/1.25.83/'+name,date_time=(2026,11,28,0,0,0));item.compress_type=ZIP_DEFLATED;item.external_attr=0o100644<<16
        out.writestr(item,(folder/name).read_bytes(),compresslevel=9)
manifest=json.loads((root/'latest.json').read_text());manifest.update(version='1.25.83',
    html_url='https://lion000097.github.io/monster-biyori/releases/1.25.83/launcher-game.html',sha256=hashlib.sha256(compact).hexdigest())
(root/'latest.json').write_text(json.dumps(manifest,indent=2)+'\n')
archive=root/'archive.html';html=archive.read_text()
if 'data-version="1.25.83"' not in html:
    before=re.search(r'<li data-version="1\.25\.82">.*?</li>',html)[0]
    entry=re.sub(r'\d+\.\d+ MB',f'{target.stat().st_size/1024**2:.2f} MB',before.replace('1.25.82','1.25.83'))
    archive.write_text(html.replace(before,entry+'\n'+before.replace(' ・ 現行配布',''),1))
