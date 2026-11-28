import hashlib, json, re, runpy, shutil, subprocess, sys
from pathlib import Path
from zipfile import ZipFile
here=Path(__file__).resolve().parent
root=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else here.parents[1]
old=root/'releases/1.25.93'; new=root/'releases/1.25.94'
codec=runpy.run_path(str(root/'work/scene-camera-12581/build.py'))
new.mkdir(parents=True,exist_ok=True)
if old.joinpath('game.html').read_bytes()!=root.joinpath('game.html').read_bytes():
    raise ValueError('Current web game does not match the verified base release')
def patch(src, dest):
    subprocess.run([sys.executable,str(here/'patch.py'),str(src),str(dest)],check=True)
patch(old/'game.html',new/'game.html')
shutil.copyfile(new/'game.html',root/'game.html')
light=codec['unpack_launcher']((old/'launcher-game.html').read_text())
raw=new/'launcher-input.tmp'; temp=new/'launcher-output.tmp'
raw.write_text(light)
patch(raw,temp); light=temp.read_text(); raw.unlink(); temp.unlink()
out=codec['pack'](light,binary_assets=True,dictionary=True,zstd_pack=True,wide_words=True,zstd_level=22,embedded_inflater=True)
assert codec['unpack_launcher'](out)==light
data=out.encode()
if len(data)>4*1024*1024: raise ValueError(f'Launcher exceeds 4 MiB: {len(data)} bytes')
(new/'launcher-game.html').write_bytes(data)
shutil.copyfile(old/'stage-art-1.25.90.js',new/'stage-art-1.25.90.js')
name='monster-biyori-1.25.94.zip'
with ZipFile(old/'monster-biyori-1.25.93.zip') as src,ZipFile(new/name,'w') as dst:
    for info in src.infolist():
        n=info.filename
        payload=data if n=='game.html' else (new/n).read_bytes() if n in ('CHANGELOG.md','TESTING.md') else src.read(n)
        dst.writestr(info,payload)
latest=root/'latest.json'; d=json.loads(latest.read_text())
assert d['version']=='1.25.93'
d.update(version='1.25.94',html_url=d['html_url'].replace('1.25.93','1.25.94'),sha256=hashlib.sha256(data).hexdigest())
latest.write_text(json.dumps(d,indent=2)+'\n')
archive=root/'archive.html'; s=archive.read_text()
assert 'data-version="1.25.94"' not in s
current=re.search('<li data-version="1.25.93">.*?</li>',s)
assert current
a=current[0]
archive.write_text(s.replace(a,re.sub(r'\d+\.\d+ MB',f'{(new/name).stat().st_size/1024**2:.2f} MB',a.replace('1.25.93','1.25.94'))+'\n'+a.replace(' ・ 現行配布',''),1))
