"""Build the 1.25.64 offline archive with the tested HTML and previous support files."""
import copy
import hashlib
import json
from pathlib import Path
import sys
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

release=Path('releases/1.25.64')
original=Path('releases/1.25.63/monster-biyori-1.25.63.zip')
output=Path(sys.argv[1]) if len(sys.argv)>1 else release/'monster-biyori-1.25.64.zip'
changes={'game.html':(release/'launcher-game.html').read_bytes()}
for filename in ('CHANGELOG.md','TESTING.md'):
    text=(release/filename).read_bytes()
    changes[filename]=text
    changes[str(release/filename)]=text
with ZipFile(original) as previous,ZipFile(output,'w',ZIP_DEFLATED,compresslevel=9) as result:
    for entry in previous.infolist():
        if entry.filename not in changes:
            result.writestr(copy.copy(entry),previous.read(entry))
    for filename,data in changes.items():
        info=ZipInfo(filename,(2026,11,27,6,21,56))
        info.create_system=3
        info.external_attr=0o600<<16
        result.writestr(info,data,compress_type=ZIP_DEFLATED,compresslevel=9)
expected=json.loads(Path(sys.argv[2] if len(sys.argv)>2 else '.town-qa/checksums.json').read_text())
for filename,digest in expected.items():
    path=output if filename.endswith('.zip') else Path(filename)
    actual=hashlib.sha256(path.read_bytes()).hexdigest()
    print(actual,filename)
    if actual!=digest:raise ValueError(filename+' differs from the verified release')
