import hashlib,json,re,sys
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
root,src,base,archive,progress=map(Path,sys.argv[1:])
ver='1.25.82'
r=root/'releases'/ver
digest=lambda f: hashlib.sha256(f.read_bytes()).hexdigest()
assert digest(r/'game.html') == 'ee5fa878daf3be2497e37538d64e92a7721f20482c26600a98cfbe2efa2ee84b'
sha=digest(r/'launcher-game.html')
assert sha=='cd8e8f6001417595c1e679940bf51cf8c6249d15025aaad822cb3a7b3d1e9e3b'
old='ef6a471b9776239ac5fbe038791da5a53e4041fd14a8b59573765e5f8b0feb17'
zpath=r/f'monster-biyori-{ver}.zip'
notes=['CHANGELOG.md','TESTING.md']
with ZipFile(base) as before, ZipFile(zpath,'w',ZIP_DEFLATED,compresslevel=9) as after:
    assert len(before.namelist())==450
    assert hashlib.sha256(before.read('game.html')).hexdigest()==old
    for item in before.infolist():
        if item.filename=='game.html':
            data=(r/'launcher-game.html').read_bytes()
        elif item.filename in notes:
            data=(src/item.filename).read_bytes()
        else:
            data=before.read(item)
        after.writestr(item,data,compress_type=item.compress_type,compresslevel=9)
    for name in notes:
        item=ZipInfo(f'releases/{ver}/{name}',date_time=(2026,11,28,0,0,0))
        after.writestr(item,(src/name).read_bytes(),compress_type=ZIP_DEFLATED,compresslevel=9)
for n in notes+['PROGRESS.md']:
    (r/n).write_bytes((src/n).read_bytes())
latest=dict(version=ver,min_launcher_version='1.1.0',html_url=f'https://lion000097.github.io/monster-biyori/releases/{ver}/launcher-game.html',sha256=sha)
(root/'latest.json').write_text(json.dumps(latest,indent=2)+'\n',encoding='utf-8')
s=archive.read_text(encoding='utf-8')
m='<ul id="versions">'
assert s.count(m)==1 and '<li data-version="1.25.81">' in s
s=re.sub(r'(<li data-version="1\.25\.81">[^\n]*?) ・ 現行配布',r'\1',s,count=1)
size=zpath.stat().st_size/(1024*1024)
s=s.replace(m,m+f'<li data-version="{ver}"><a href="releases/{ver}/monster-biyori-{ver}.zip">Ver. {ver} のZIP</a><small>{size:.2f} MB ・ 現行配布</small></li>\n')
(root/'archive.html').write_text(s,encoding='utf-8')
new=(src/'PROGRESS.md').read_text(encoding='utf-8').replace('同階層の変更履歴と動作確認','[変更履歴](releases/1.25.82/CHANGELOG.md)と[動作確認](releases/1.25.82/TESTING.md)')
(root/'PROGRESS.md').write_text(new+'\n'+progress.read_text(encoding='utf-8'),encoding='utf-8')
print(f'ZIP {zpath.stat().st_size} bytes; SHA-256 {digest(zpath)}')
