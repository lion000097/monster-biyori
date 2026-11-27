"""Embed the four illustrated views of each 1.25.75 addition."""
import argparse
import base64
import io
import json
from functools import lru_cache
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'assets/town-atelier'
START = '// BEGIN town workshop drawings'
END = '// END town workshop drawings'
PRELOAD = '// BEGIN town illustration preload'
PRELOADED = '// END town illustration preload'

def data_url(data, kind):
    return f'data:image/{kind};base64,' + base64.b64encode(data).decode('ascii')

@lru_cache(maxsize=1)
def illustration_bank():
    entries = {}
    for file in sorted((ART / 'illustrations').glob('*.png')):
        with Image.open(file) as source:
            size = source.height
            if source.width != 4 * size or source.mode != 'P':
                raise ValueError(f'Invalid four-direction image: {file}')
            colors = source.getpalette()[3:3 * (max(source.getdata()) + 1)]
            strip = source.convert('RGBA')
        bounds = []
        for i in range(4):
            mask = strip.crop((size*i, 0, size*(i+1), size)).getchannel('A')
            x, y, right, bottom = mask.getbbox()
            bounds.append([x, y, right-x, bottom-y])
        # Retain every native pixel on small ornaments, especially fine cords and lettering.
        encoded = size if size <= 96 else round(size * .90)
        stream = io.BytesIO()
        strip.resize((encoded*4, encoded), Image.Resampling.BOX).save(stream, 'WEBP', method=5, quality=62)
        entries[file.stem] = [size, bytes(colors).hex(), bounds, data_url(stream.getvalue(), 'webp')]
    if len(entries) != 73:
        raise ValueError('Expected all 73 illustrated additions')
    return json.dumps(entries, separators=(',', ':'))

def embed(source):
    begin = source.index(START)
    end = source.index(END, begin) + len(END)
    parts = [(ART / f'{name}.js').read_text() for name in ('exhibits', 'illustrated-state', 'illustrated-town')]
    module = '\n'.join([START, 'const additionArt75=(()=>{', *parts, '})();', END])
    source = source[:begin] + module + source[end:]
    block = '\n'.join([PRELOAD, 'const illustratedTownBank='+illustration_bank()+';',
        "const illustratedSigns=new Image();illustratedSigns.src='"+data_url((ART/'painted-signs.png').read_bytes(),'png')+"';",
        (ART / 'illustrated-preload.js').read_text(), PRELOADED])
    if PRELOAD in source:
        a = source.index(PRELOAD)
        b = source.index(PRELOADED, a) + len(PRELOADED)
        return source[:a]+block+source[b:]
    entry = "<script>\n(()=>{'use strict';\nconst facilityRoles ="
    if source.count(entry) != 1:
        raise ValueError('Expected one main game script')
    return source.replace(entry, "<script>\n(async()=>{'use strict';\n"+block+"\nconst facilityRoles =", 1)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('game', type=Path)
    args = parser.parse_args()
    args.game.write_text(embed(args.game.read_text()))
