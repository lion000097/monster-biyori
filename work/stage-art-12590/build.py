"""Rebuild the approved eight-building release from the published 1.25.89 editions."""
import argparse,base64,hashlib,importlib.util,json,re,shutil,sys
from pathlib import Path
from zipfile import ZipFile,ZipInfo,ZIP_DEFLATED
here=Path(__file__).resolve().parent
root=here.parents[1]
version='1.25.90'; previous='1.25.89'
release=root/'releases'/version
source=root/'releases'/previous
assets=root/'assets/town-axis'
frames=json.loads((here/'frames.json').read_text())
base_url='https://lion000097.github.io/monster-biyori'
companion='stage-art-1.25.90.js'
def read(p):return p.read_text(encoding='utf8')
def digest(b):return hashlib.sha256(b).hexdigest()
def once(html,a,b):
    if html.count(a)!=1:raise ValueError(a[:80])
    return html.replace(a,b,1)
def edit_table(html,key,fn):
    m=re.search('^const '+key+'=(.+);$',html,re.M)
    bank=json.loads(m[1]);fn(bank)
    return html[:m.start(1)]+json.dumps(bank,separators=(',',':'))+html[m.end(1):]
def uri(p):return 'data:image/'+p.suffix[1:]+';base64,'+base64.b64encode(p.read_bytes()).decode()
def make_companion():
    data={k:uri(assets/'painted'/(k+'.png')) for k in frames}
    return ('globalThis.MBStagePaint12590='+json.dumps(data,separators=(',',':'))+';\n').encode()
def page(html,compact):
    if html.count(previous)!=3:raise ValueError('Unexpected source game')
    html=html.replace(previous,version)
    html=once(html,'旅の建築6種の石縁と設置マスの四隅</footer>','森の楽器工房から星空のテラス席まで、建築8種の原画を更新</footer>')
    def update(bank):
        for k,dirs in frames.items():
            p=here/'launcher'/(k+'-color.webp') if compact else assets/'painted'/(k+'.png')
            bank[k]=[dirs[0]['size'],uri(p)]
    def plots(bank):
        for k,dirs in frames.items():bank[k]={field:dirs[0][field] for field in ('size','span','anchor')}
    def retired(bank):
        for k in frames:bank.pop(k,None)
    details=json.loads(read(assets/'painted-details.json'))
    html=edit_table(html,'axisAtlas',update)
    html=edit_table(html,'travelerPlots',plots)
    html=edit_table(html,'illustratedTownBank',retired)
    html=edit_table(html,'paintedDetails',lambda d:d.update({k:details[k] for k in ('backStage','maskStall','rugShop')}))
    html=once(html,"const exhibit=type==='stoneStudy'||type==='maskStall';","const exhibit=type==='stoneStudy'||type==='maskStall'||type==='backStage';")
    html=once(html,"}else if(type==='jarHut'){",read(here/'display-paint.js').strip()+"\n  }else if(type==='jarHut'){")
    if compact:
        st=html.index('const axisSprites=new Map();')
        en=html.index('\nfunction axisSprite(',st)
        recipe=read(here/'launcher-art.js').replace('__STAGE_HASH__',digest(make_companion()))
        recipe=recipe.replace('__STAGE_MASKS__',json.dumps({k:uri(here/'launcher'/(k+'-mask.webp')) for k in frames},separators=(',',':')))
        html=html[:st]+recipe+'\n'+html[en:]
    return html
def codec():
    spec=importlib.util.spec_from_file_location('previous_codec',root/'work/scene-camera-12581/build.py')
    mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);return mod
def build_web():
    raw=(source/'game.html').read_bytes()
    if digest(raw)!='f27d87217d278f7c78099ff8084677885275819f9ec16b2c616be73ee89799c7':raise ValueError('Unexpected base game')
    html=page(raw.decode(),False).encode()
    (release/'game.html').write_bytes(html);(root/'game.html').write_bytes(html)
    (release/companion).write_bytes(make_companion())
def build_light():
    cr=codec(); base=cr.unpack_launcher(read(source/'launcher-game.html'))
    html=page(base,True)
    packed=cr.pack(html,binary_assets=True,dictionary=True,zstd_pack=True,wide_words=True,zstd_level=22,embedded_inflater=True)
    assert cr.unpack_launcher(packed)==html
    raw=packed.encode();print('Offline HTML',len(raw),'of',4*1024**2,flush=True)
    if len(raw)>4*1024**2:raise ValueError('Updater size limit')
    (release/'launcher-game.html').write_bytes(raw)
def package():
    small=(release/'launcher-game.html').read_bytes()
    name='monster-biyori-'+version+'.zip'
    docs=('CHANGELOG.md','TESTING.md')
    replacements={'game.html':small,**{n:(release/n).read_bytes() for n in docs}}
    with ZipFile(source/('monster-biyori-'+previous+'.zip')) as old,ZipFile(release/name,'w') as z:
        for item in old.infolist():
            z.writestr(item,replacements[item.filename] if item.filename in replacements else old.read(item),compresslevel=9)
        extras={companion:release/companion,**{'releases/'+version+'/'+n:release/n for n in (*docs,'buildings.webp','terrace.jpg')}}
        for arc,p in extras.items():
            entry=ZipInfo(arc,(2026,11,28,0,0,0));entry.compress_type=ZIP_DEFLATED;entry.external_attr=0o100644<<16
            z.writestr(entry,p.read_bytes(),compresslevel=9)
    latest=root/'latest.json';d=json.loads(read(latest));assert d['version'] in (previous,version)
    d.update(version=version,html_url=f'{base_url}/releases/{version}/launcher-game.html',sha256=digest(small));latest.write_text(json.dumps(d,indent=2)+'\n')
    archive=root/'archive.html';text=read(archive)
    if f'data-version="{version}"' not in text:
        entry=re.search(f'<li data-version="{re.escape(previous)}">.*?</li>',text)[0]
        new=re.sub(r'\d+\.\d+ MB',f'{(release/name).stat().st_size/1024**2:.2f} MB',entry.replace(previous,version))
        archive.write_text(once(text,entry,new+'\n'+entry.replace(' ・ 現行配布','')))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('step',choices=['web','light','package','all']);s=parser.parse_args().step
    release.mkdir(parents=True,exist_ok=True)
    if s in ('web','all'):build_web()
    if s in ('light','all'):build_light()
    if s in ('package','all'):package()
