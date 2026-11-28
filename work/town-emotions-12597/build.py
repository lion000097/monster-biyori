from pathlib import Path
import sys, json, hashlib, re, runpy, os
from zipfile import ZipFile
from patch import patch
HERE=Path(__file__).resolve().parent
OLD='1.25.96'; NEW='1.25.97'
def build(base,out,codec_path):
 old=base
 new=out/'releases'/NEW
 new.mkdir(parents=True,exist_ok=True)
 codec=runpy.run_path(str(codec_path))
 web=patch((old/'game.html').read_bytes().decode())
 (out/'game.html').write_bytes(web.encode())
 (new/'game.html').write_bytes(web.encode())
 raw=patch(codec['unpack_launcher']((old/'launcher-game.html').read_bytes().decode()))
 packed=codec['pack'](raw,binary_assets=True,dictionary=True,zstd_pack=True,wide_words=True,zstd_level=22,embedded_inflater=True)
 assert codec['unpack_launcher'](packed)==raw
 launcher=packed.encode()
 assert len(launcher)<=4*1024*1024,len(launcher)
 (new/'launcher-game.html').write_bytes(launcher)
 name=f'monster-biyori-{NEW}.zip'
 with ZipFile(old/f'monster-biyori-{OLD}.zip') as src,ZipFile(new/name,'w') as dst:
  for e in src.infolist():
   n=e.filename
   data=launcher if n=='game.html' else (HERE/n).read_bytes() if n in ('CHANGELOG.md','TESTING.md') else src.read(n)
   dst.writestr(e,data)
   if n in ('stage-art-1.25.90.js','town-motion-1.25.96.js'):
    (new/n).write_bytes(data)
 for n in ('CHANGELOG.md','TESTING.md'):(new/n).write_bytes((HERE/n).read_bytes())
 m=json.loads((old/'latest.json').read_text())
 assert m['version']==OLD
 m.update(version=NEW,html_url=m['html_url'].replace(OLD,NEW),sha256=hashlib.sha256(launcher).hexdigest())
 (out/'latest.json').write_text(json.dumps(m,indent=2)+'\n')
 s=(old/'archive.html').read_text()
 line=re.search(f'<li data-version="{re.escape(OLD)}">.*?</li>',s)[0]
 line_new=re.sub(r'\d+\.\d+ MB',f'{(new/name).stat().st_size/1024**2:.2f} MB',line.replace(OLD,NEW))
 line_new=line_new.replace(f'releases/{NEW}/{name}',f'https://github.com/lion000097/monster-biyori/releases/download/v{NEW}/{name}')
 (out/'archive.html').write_text(s.replace(line,line_new+'\n'+line.replace(' ・ 現行配布',''),1))
 print(NEW,len(launcher),m['sha256'],flush=True)
if __name__=='__main__':
 build(*map(lambda p: Path(p).resolve(),sys.argv[1:]))
