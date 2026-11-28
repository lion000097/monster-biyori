"""Rebuild the 1.25.85 editions from the published 1.25.84 editions."""
import argparse
import importlib.util
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
OLD=ROOT/'releases/1.25.84'
DEST=ROOT/'releases/1.25.85'
spec=importlib.util.spec_from_file_location('painted',ROOT/'work/painted-town-12584/build.py')
painted=importlib.util.module_from_spec(spec)
spec.loader.exec_module(painted)


def update(text,compact):
    assert text.count('1.25.84')==3 and text.count("GAME_APP_VERSION='1.25.84'")==1
    text=text.replace('1.25.84','1.25.85')
    text=text.replace('建築15種の原画仕上げ</footer>','建築の土台と道の接地</footer>')
    start=text.index('const axisAtlas=')
    end=text.index('// Registered paintings use a common logical canvas',start)
    details=json.loads((ROOT/'assets/town-axis/painted-details.json').read_text())
    return (text[:start]+'const axisAtlas='+painted.sprites(compact)+';\nconst paintedDetails='
            +json.dumps(details,separators=(',',':'))+';\n'+text[end:])


def build(edition):
    DEST.mkdir(exist_ok=True)
    if edition in ('web','both'):
        web=update((OLD/'game.html').read_text(),False)
        (ROOT/'game.html').write_text(web)
        (DEST/'game.html').write_text(web)
        print('Web',len(web.encode()),flush=True)
    if edition in ('launcher','both'):
        codec=painted.previous
        source=codec.unpack_launcher((OLD/'launcher-game.html').read_text())
        packed=codec.pack(update(source,True),binary_assets=True,dictionary=True,zstd_pack=True,
                          wide_words=True,zstd_level=22,embedded_inflater=True).encode()
        assert len(packed)<=4*1024**2, f'Updater limit exceeded: {len(packed):,}'
        (DEST/'launcher-game.html').write_bytes(packed)
        print('Launcher',len(packed),'/',4*1024**2,flush=True)

if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--edition',choices=['web','launcher','both'],default='both')
    build(ap.parse_args().edition)
