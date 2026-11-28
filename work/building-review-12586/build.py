"""Build the reviewed buildings into both editions of the 1.25.85 game."""

import argparse
import base64
import importlib.util
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
BEFORE = ROOT / 'releases/1.25.85'
DEST = ROOT / 'releases/1.25.86'
ART = ROOT / 'assets/town-axis'
BUILDINGS = {'starChart': 160, 'herbPlot': 128, 'jarHut': 160}


def replace_once(page, old, new):
    if page.count(old) != 1:
        raise ValueError('Unexpected 1.25.85 source: ' + old[:65])
    return page.replace(old, new)


def update_json(page, name, edit):
    m = re.search('^const ' + name + r'=(.+);$', page, re.M)
    data = json.loads(m[1]); edit(data)
    return page[:m.start(1)] + json.dumps(data, separators=(',', ':')) + page[m.end(1):]


def build_page(page, compact):
    assert page.count('1.25.85') == 3 and "GAME_APP_VERSION='1.25.85'" in page
    page = page.replace('1.25.85', '1.25.86')
    page = replace_once(page, '建築の土台と道の接地</footer>', '星図の写し小屋・木の実の薬草園・おやつの瓶詰め小屋</footer>')

    def paintings(bank):
        folder = HERE / 'launcher' if compact else ART / 'painted'
        for kind, size in BUILDINGS.items():
            data = (folder / (kind + '.webp')).read_bytes()
            bank[kind] = [size, 'data:image/webp;base64,' + base64.b64encode(data).decode('ascii')]
    page = update_json(page, 'axisAtlas', paintings)

    def retire_replaced_frames(bank):
        for kind in ('starChart', 'herbPlot'):
            del bank[kind]
    page = update_json(page, 'illustratedTownBank', retire_replaced_frames)
    details = json.loads((ART / 'painted-details.json').read_text())
    page = update_json(page, 'paintedDetails', lambda bank: bank.update(jarHut=details['jarHut']))
    snippet = (ROOT/'assets/town-atelier/illustrated-town.js').read_text()
    first = snippet.index('  if(axisSprites.has(type)){')
    last = snippet.index('  const art=townIllustrations.get(type)', first)
    page = replace_once(page, '  if(axisSprites.has(type))return axisSprite(type,validFacing(facing),phase,exhibition(type,site));\n', snippet[first:last])

    # The floor still occupies the same 256-unit lot. Only the upper painting
    # needs the extra transparent margin for the roof and hanging sign.
    rect = 'return {x:origin.x-m.h*T,y:origin.y-size/2,w:size,h:size};'
    return replace_once(page, rect, '''if(b.type==='starChart'||b.type==='jarHut'){
      const unit=size/256;
      return {x:origin.x-m.h*T-32*unit,y:origin.y-size/2-64*unit,w:320*unit,h:320*unit};
    }
    ''' + rect)


def codec():
    spec = importlib.util.spec_from_file_location('scene_builder',ROOT/'work/scene-camera-12581/build.py')
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    return module


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--edition', choices=['web','launcher','both'], default='both')
    args=parser.parse_args(); DEST.mkdir(parents=True,exist_ok=True)
    if args.edition in ('web','both'):
        result=build_page((BEFORE/'game.html').read_text(),False).encode()
        (DEST/'game.html').write_bytes(result);(ROOT/'game.html').write_bytes(result)
        print('Web',len(result),flush=True)
    if args.edition in ('launcher','both'):
        tool=codec(); old=tool.unpack_launcher((BEFORE/'launcher-game.html').read_text())
        result=tool.pack(build_page(old,True),binary_assets=True,dictionary=True,zstd_pack=True,
                         wide_words=True,zstd_level=22,embedded_inflater=True).encode()
        assert len(result)<=4*1024**2, f'Updater limit exceeded: {len(result):,}'
        (DEST/'launcher-game.html').write_bytes(result)
        print('Launcher',len(result),flush=True)


if __name__=='__main__':
    main()
