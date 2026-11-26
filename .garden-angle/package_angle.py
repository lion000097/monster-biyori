"""Package the new game with the existing offline support files."""
import argparse
import copy
import hashlib
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

def package(root):
    version='1.25.63'
    out=root/'releases'/version
    compact=(out/'launcher-game.html').read_bytes()
    manifest=json.loads((root/'latest.json').read_text())
    manifest.update(version=version, html_url=f'https://lion000097.github.io/monster-biyori/releases/{version}/launcher-game.html',
                    sha256=hashlib.sha256(compact).hexdigest())
    (root/'latest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    old=root/'releases/1.25.62/monster-biyori-1.25.62.zip'
    new=out/f'monster-biyori-{version}.zip'
    with ZipFile(old) as prev,ZipFile(new,'w') as dest:
        for info in prev.infolist():
            if info.filename=='game.html':data=compact
            elif info.filename=='CHANGELOG.md':data=(out/'CHANGELOG.md').read_bytes()
            else:data=prev.read(info)
            dest.writestr(copy.copy(info),data,compress_type=info.compress_type,compresslevel=9)
        for name in ('CHANGELOG.md','TESTING.md'):
            info=ZipInfo(f'releases/{version}/{name}',(2026,11,27,0,0,0));info.create_system=3;info.external_attr=0o600<<16
            dest.writestr(info,(out/name).read_bytes(),compress_type=ZIP_DEFLATED,compresslevel=9)
    with ZipFile(old) as prev,ZipFile(new) as dest:
        kept=[n for n in prev.namelist() if n not in ('game.html','CHANGELOG.md')]
        if len(kept)!=407 or len(dest.namelist())!=411 or dest.testzip() is not None:raise ValueError('ZIP manifest or CRC')
        for name in kept:
            if prev.read(name)!=dest.read(name):raise ValueError(name)
        if dest.read('game.html')!=compact:raise ValueError('ZIP game')
    print(f'{new.name}: 411 entries, 407 original support files matched')
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('root',type=Path);package(parser.parse_args().root)
