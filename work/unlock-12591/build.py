import base64, hashlib, json, re, runpy, shutil
from pathlib import Path
from zipfile import ZipFile
here=Path(__file__).resolve().parent
root=here.parents[1]
old=root/'releases/1.25.90'
new=root/'releases/1.25.91'
codec=runpy.run_path(str(root/'work/scene-camera-12581/build.py'))
def patch(s):
    s=re.sub(r'(Ver\.|GAME_APP_VERSION=\u0027)1\.25\.90',r'\g<1>1.25.91',s)
    s=s.replace('森の楽器工房から星空のテラス席まで、建築8種の原画を更新</footer>','世界樹の成長と施設のお披露目</footer>')
    anchor='save(true);renderUI(true);\n}\nconst placeBefore193'
    assert s.count(anchor)==1
    s=s.replace(anchor,'save(true);renderUI(true);\n  celebrateFacilities91(state.villageLv);\n}\nconst placeBefore193')
    s=s.replace('function growWorldTree193(){', (here/'unlock.js').read_text()+'\nfunction growWorldTree193(){')
    css=(here/'unlock.css').read_text().replace('__STAGE__','data:image/webp;base64,'+base64.b64encode((here/'stage.webp').read_bytes()).decode())
    return s.replace('</head>','<style>'+css+'</style></head>',1)
new.mkdir(exist_ok=True)
web=patch((old/'game.html').read_text())
(root/'game.html').write_text(web);(new/'game.html').write_text(web)
light=patch(codec['unpack_launcher']((old/'launcher-game.html').read_text()))
out=codec['pack'](light,binary_assets=True,dictionary=True,zstd_pack=True,wide_words=True,zstd_level=22,embedded_inflater=True)
assert codec['unpack_launcher'](out)==light
(new/'launcher-game.html').write_text(out)
shutil.copyfile(old/'stage-art-1.25.90.js',new/'stage-art-1.25.90.js')
name='monster-biyori-1.25.91.zip'
with ZipFile(old/'monster-biyori-1.25.90.zip') as src,ZipFile(new/name,'w') as dst:
    for info in src.infolist():
        n=info.filename
        data=out.encode() if n=='game.html' else (new/n).read_bytes() if n in ('CHANGELOG.md','TESTING.md') else src.read(n)
        dst.writestr(info,data)
latest=root/'latest.json'; d=json.loads(latest.read_text());d.update(version='1.25.91',html_url=d['html_url'].replace('1.25.90','1.25.91'),sha256=hashlib.sha256(out.encode()).hexdigest());latest.write_text(json.dumps(d,indent=2)+'\n')
archive=root/'archive.html';s=archive.read_text()
if 'data-version="1.25.91"' not in s:
    a=re.search('<li data-version="1.25.90">.*?</li>',s)[0]
    archive.write_text(s.replace(a,re.sub(r'\d+\.\d+ MB',f'{(new/name).stat().st_size/1024**2:.2f} MB',a.replace('1.25.90','1.25.91'))+'\n'+a.replace(' ・ 現行配布','')))
