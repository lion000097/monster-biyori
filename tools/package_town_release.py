"""Package 1.26.0 while retaining existing launcher/support artwork."""
from pathlib import Path
import json,hashlib
from zipfile import ZipFile,ZIP_DEFLATED
from pack_launcher_images import pack
root=Path(__file__).resolve().parent.parent
release=root/'releases/1.26.0';release.mkdir(exist_ok=True)
web=(root/'game.html').read_bytes()
(release/'game.html').write_bytes(web)
compact,changes=pack(web);(release/'launcher-game.html').write_bytes(compact)
manifest={'version':'1.26.0','min_launcher_version':'1.1.0','html_url':'https://lion000097.github.io/monster-biyori/releases/1.26.0/launcher-game.html','sha256':hashlib.sha256(compact).hexdigest()}
(root/'latest.json').write_text(json.dumps(manifest,indent=2)+'\n')
with ZipFile(root/'releases/1.25.59/monster-biyori-1.25.59.zip') as old,ZipFile(release/'monster-biyori-1.26.0.zip','w',ZIP_DEFLATED) as out:
 for name in old.namelist():
  if name=='game.html':out.writestr(name,compact)
  elif name in ['CHANGELOG.md','TESTING.md']:out.writestr(name,(release/name).read_bytes())
  else:out.writestr(name,old.read(name))
 for name in ['CHANGELOG.md','TESTING.md','BUILDINGS.md']:
  out.write(release/name,'releases/1.26.0/'+name)
 for art in (release/'art').rglob('*.png'):out.write(art,'建物ドット絵/1.26.0/'+str(art.relative_to(release/'art')))
print('Packaged',len(compact),'bytes;',len(changes),'lossless conversions')
