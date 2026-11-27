"""Compose the 1.25.76 offline distribution from the prior archive and verified files."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import sys
version='1.25.76'
root=Path('releases')/version
previous=Path('releases/1.25.75/monster-biyori-1.25.75.zip')
target=Path(sys.argv[1]) if len(sys.argv)>1 else root/('monster-biyori-'+version+'.zip')
changes={'game.html':(root/'launcher-game.html').read_bytes(),
         'CHANGELOG.md':(root/'CHANGELOG.md').read_text().replace('(town-art.png)','(releases/'+version+'/town-art.png)').encode(),
         'TESTING.md':(root/'TESTING.md').read_bytes()}
with ZipFile(previous) as source, ZipFile(target,'w',ZIP_DEFLATED,compresslevel=6) as output:
    for info in source.infolist():
        data=changes[info.filename] if info.filename in changes else source.read(info)
        output.writestr(info,data)
    for filename in ['CHANGELOG.md','TESTING.md','town-art.png']:
        info=ZipInfo((root/filename).as_posix(),date_time=(2026,11,27,0,0,0))
        info.compress_type=ZIP_DEFLATED
        info.external_attr=0o100644<<16
        output.writestr(info,(root/filename).read_bytes())
