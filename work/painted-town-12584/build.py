"""Embed the registered 1.25.84 paintings in the two published editions."""
import argparse
import base64
import importlib.util
import io
import json
import re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT/'assets/town-axis'
OLD = ROOT/'releases/1.25.83'
DEST = ROOT/'releases/1.25.84'
spec = importlib.util.spec_from_file_location('previous_builder', ROOT/'work/scene-camera-12581/build.py')
previous = importlib.util.module_from_spec(spec)
spec.loader.exec_module(previous)
TYPES = ('breadShelf','catLedge','breadMarket','maskStall','musicMaker','shoeRepair',
         'umbrellaHut','starTerrace','jarHut','guild212','teaRoom','eggWatch','toyRepair',
         'stoneStudy','specimenHut')

def sprites(compact):
    result={}
    for key in TYPES:
        with Image.open(ART/'painted'/(key+'.webp')) as im:
            im=im.convert('RGBA')
        hi=im.height
        assert im.width==4*hi and hi in (192,256,384),key
        if compact:
            dim={192:86,256:110,384:148}[hi]
            im=im.resize((4*dim,dim),Image.Resampling.LANCZOS)
            # Cutouts use a crisp pixel edge at native game size in the offline edition.
            im.putalpha(im.getchannel('A').point(lambda x:255 if x>=120 else 0))
        stream=io.BytesIO()
        im.save(stream,'WEBP',quality=68 if compact else 91,method=6)
        result[key]=[hi//2,'data:image/webp;base64,'+base64.b64encode(stream.getvalue()).decode()]
    return json.dumps(result,separators=(',',':'))

def update(source,compact):
    if source.count("GAME_APP_VERSION='1.25.83'")!=1 or source.count('1.25.83')!=3:
        raise ValueError('Expected the published 1.25.83 edition')
    assert source.count('施設の四方向と街の歩きやすさ</footer>')==1
    source=source.replace('1.25.83','1.25.84').replace('施設の四方向と街の歩きやすさ</footer>','建築15種の原画仕上げ</footer>')
    start=source.index('const axisAtlas=')
    end=source.index('// END town illustration preload',start)
    details=json.loads((ART/'painted-details.json').read_text())
    lines=['const axisAtlas='+sprites(compact)+';',
           'const paintedDetails='+json.dumps(details,separators=(',',':'))+';',
           (ART/'painted-state.js').read_text()]
    return source[:start]+'\n'.join(lines)+'\n'+source[end:]

def build(edition):
    DEST.mkdir(exist_ok=True)
    if edition in ('web','both'):
        web=update((OLD/'game.html').read_text(),False)
        (DEST/'game.html').write_text(web)
        (ROOT/'game.html').write_text(web)
        print(f'Web {len(web.encode()):,} bytes',flush=True)
    if edition in ('launcher','both'):
        plain=previous.unpack_launcher((OLD/'launcher-game.html').read_text())
        source=update(plain,True)
        packed=previous.pack(source,binary_assets=True,dictionary=True,zstd_pack=True,wide_words=True,
                             zstd_level=22,embedded_inflater=True).encode()
        print(f'Launcher {len(packed):,} / {4*1024*1024:,} bytes',flush=True)
        if len(packed)>4*1024*1024:raise ValueError('Launcher exceeds the updater limit')
        (DEST/'launcher-game.html').write_bytes(packed)

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--edition',choices=['web','launcher','both'],default='both')
    build(parser.parse_args().edition)
