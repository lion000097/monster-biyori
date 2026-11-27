from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
from shutil import copyfile
import hashlib, json, subprocess, re
root=Path('.')
v='1.25.68'
release=Path('releases')/v
prior=Path('releases/1.25.67')
release.mkdir(exist_ok=True)
def run(*args): subprocess.run(args,check=True)
def digest(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()
assert digest('game.html')=='61b2c47ea88afab626f6cdcd03a0fba16879c9498c3d3e6b643c6d51e2525b20'
copyfile('game.html','baseline.html')
with ZipFile(prior/'monster-biyori-1.25.67.zip') as z:
    Path('baseline-compact.html').write_bytes(z.read('game.html'))
assert digest('baseline-compact.html')=='a1ebcc9dfa4777e22f545f93ad1ca272dca4e7a9293bfc211e685af48224de67'
run('python3','unpack.py','baseline-compact.html','baseline-unpacked.html')
run('python3','edit.py','baseline.html','game.html')
run('python3','edit.py','baseline-unpacked.html','launcher-source.html')
run('python3','tools/pack_launcher_html.py','launcher-source.html',str(release/'launcher-game.html'),'--dense')
copyfile('game.html',release/'game.html')
for name in ('CHANGELOG.md','TESTING.md'): copyfile('release-'+name,release/name)
manifest=json.loads(Path('latest.json').read_text())
manifest.update(version=v,html_url=f'https://lion000097.github.io/monster-biyori/releases/{v}/launcher-game.html',sha256=digest(release/'launcher-game.html'))
Path('latest.json').write_text(json.dumps(manifest,indent=2)+'\n')
updates={'game.html': release/'launcher-game.html'}
for name in ('CHANGELOG.md','TESTING.md'):
    updates[name]=release/name
    updates[str(release/name)]=release/name
target=release/f'monster-biyori-{v}.zip'
with ZipFile(prior/'monster-biyori-1.25.67.zip') as source,ZipFile(target,'w',compression=ZIP_DEFLATED,compresslevel=9) as out:
    for info in source.infolist():
        if info.filename not in updates: out.writestr(info, source.read(info))
    for name, origin in updates.items():
        info=ZipInfo(name,(2026,11,27,0,0,0))
        info.compress_type=ZIP_DEFLATED
        info.external_attr=0o100644<<16
        out.writestr(info,origin.read_bytes(),compresslevel=9)
with ZipFile(prior/'monster-biyori-1.25.67.zip') as source,ZipFile(target) as out:
    unchanged=set(source.namelist())-updates.keys()
    assert set(out.namelist())==unchanged|updates.keys()
    assert all(source.read(name)==out.read(name) for name in unchanged)
    assert all(out.read(name)==origin.read_bytes() for name,origin in updates.items())
    print('Preserved',len(unchanged),'previous package entries')
archive=Path('archive.html')
html=archive.read_text()
anchor='<ul id="versions">'
assert html.count(anchor)==1
size=target.stat().st_size
item=f'<li data-version="{v}"><a href="{target.as_posix()}">Ver. {v} のZIP</a><small>{size/1e6:.2f} MB ・ 現行配布</small></li>\n'
archive.write_text(html.replace(anchor,anchor+item))
progress=Path('PROGRESS.md')
progress.write_text(Path('release-PROGRESS.md').read_text()+'\n'+progress.read_text())
for path in ['baseline.html','game.html','launcher-source.html']:
    js=re.findall(r'<script>(.*?)</script>',Path(path).read_text(),re.S)
    assert js
    for body in js: subprocess.run(['node','--check'],input=body,text=True,check=True)
run('python3','tools/release_preflight.py','--root','.')
for path in ['game.html','latest.json','archive.html','PROGRESS.md',*(str(f) for f in release.iterdir())]:
    print(digest(path),path)
