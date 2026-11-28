"""Apply the art and spatial lookup fixes to both official 1.25.82 editions."""
import argparse, importlib.util, json, re, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'releases/1.25.82'
TARGET=ROOT/'releases/1.25.83'
ART=ROOT/'assets/town-axis'
m=importlib.util.spec_from_file_location('scene_builder',ROOT/'work/scene-camera-12581/build.py')
previous=importlib.util.module_from_spec(m);m.loader.exec_module(previous)

def once(text,needle,new):
    if text.count(needle)!=1:raise ValueError('Missing or ambiguous integration point: '+needle[:80])
    return text.replace(needle,new)

def update(text):
    for prefix in ['<title>もんすたー日和 Ver.','© もんすたー日和 Ver.',"const GAME_APP_VERSION='"]:
        text=once(text,prefix+'1.25.82',prefix+'1.25.83')
    text=once(text,'チュートリアルではじめての冒険</footer>','施設の四方向と街の歩きやすさ</footer>')
    bank=json.loads((ART/'atlas.json').read_text())
    match=re.search(r'const illustratedTownBank=([^\n]+);\n',text)
    old=json.loads(match[1])
    if not set(bank)-{'guild212'}<=set(old): raise ValueError('Incomplete source illustrations')
    trimmed={k:v for k,v in old.items() if k not in bank}
    text=text[:match.start(1)]+json.dumps(trimmed,separators=(',',':'))+text[match.end(1):]
    tag='// END town illustration preload'
    init='const axisAtlas='+json.dumps(bank,separators=(',',':'))+';\n'+(ART/'sprites.js').read_text()
    text=once(text,tag,init+'\n'+tag)
    hook='return function draw(type,facing,phase=0,site=null){'
    text=once(text,hook,hook+"\n  if(axisSprites.has(type))return axisSprite(type,validFacing(facing),phase,exhibition(type,site));")
    hook='function townBuildingArt(type,level,facing,visual={}){'
    text=once(text,hook,hook+"\n  if(type==='guild212')return axisSprite(type,validFacing(facing),level>=4?2:level>=2?1:0);")
    text=once(text,"if(villageAdditions75[type]||Object.hasOwn(townAtlases,type))return townBuildingArt","if(type==='guild212'||villageAdditions75[type]||Object.hasOwn(townAtlases,type))return townBuildingArt")
    text,n=re.subn(r"(function plotImageRect\(b,m=buildingOf\(b\)\) \{\s*)if\(townCatalog\[b.type\]\)",
                   r"\1if(townCatalog[b.type]||b.type==='guild212')",text)
    if n!=1: raise ValueError('Missing plot rectangle')
    start=text.index("const stamp=JSON.stringify([season,weatherInfo().name==='雨'?state.day:0")
    end=text.index(']);',start)+3
    text=text[:start]+'const stamp=groundStamp(season);'+text[end:]
    text=once(text,'paintGround(ctx,season,{minX,minY,maxX,maxY,left,top,right,bottom},objects);',
              'drawNearGround(season,left,top,right,bottom,objects);')
    text=once(text,'let cachedOverview=null;',(ART/'ground.js').read_text()+'\nlet cachedOverview=null;')
    hook='claimSave12556();\nconst didLoad=load();'
    return once(text,hook,(ART/'grid.js').read_text()+'\n'+hook)

def build(full=True):
    TARGET.mkdir(exist_ok=True)
    web=update((BASE/'game.html').read_text());(TARGET/'game.html').write_text(web)
    (ROOT/'game.html').write_text(web)
    if full:
        source=update(previous.unpack_launcher((BASE/'launcher-game.html').read_text()))
        output=previous.pack(source,binary_assets=True,dictionary=True,zstd_pack=True,wide_words=True,zstd_level=22,embedded_inflater=True).encode()
        print(f'Launcher {len(output):,} bytes',flush=True)
        if len(output)>4194304:raise ValueError('4 MiB launcher limit exceeded')
        (TARGET/'launcher-game.html').write_bytes(output)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--web',action='store_true');build(not parser.parse_args().web)
