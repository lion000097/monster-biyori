"""Rebuild the game's four-direction town atlas from the native indexed PNGs."""
import argparse
import base64
import json
from pathlib import Path
import zlib

from PIL import Image

BEGIN = '// BEGIN native town atlas\n'
END = '\n// END native town atlas'

CROWNS_BEGIN = '// BEGIN native world tree crowns\n'
CROWNS_END = '\n// END native world tree crowns'

def atlas_entries(assets):
    entries = {}
    for path in sorted(assets.glob('*.png')):
        with Image.open(path) as sheet:
            size = sheet.height
            if sheet.mode != 'P' or sheet.width != size * 4 or sheet.info.get('transparency') != 0:
                raise ValueError(f'Expected four indexed frames with transparent index zero: {path}')
            pixels = b''.join(sheet.crop((f*size, 0, (f+1)*size, size)).tobytes() for f in range(4))
            colors = bytes(sheet.getpalette()[:3*(max(pixels)+1)])
            entries[path.stem] = [size, colors.hex(), base64.b64encode(zlib.compress(pixels, 9)).decode()]
    return entries

def embed(source, assets):
    entries = atlas_entries(assets)
    if len(entries) != 19 or source.count(BEGIN) != 1 or source.count(END) != 1:
        raise ValueError('Expected nineteen buildings and decorations and one atlas slot')
    a = source.index(BEGIN) + len(BEGIN)
    b = source.index(END, a)
    source = source[:a] + 'const townAtlases=' + json.dumps(entries, separators=(',', ':')) + ';' + source[b:]
    if CROWNS_BEGIN in source:
        crowns = atlas_entries(assets.parent / 'world-tree')
        if set(crowns) != {'crown25', 'crown30'} or source.count(CROWNS_BEGIN) != 1 or source.count(CROWNS_END) != 1:
            raise ValueError('Expected two native World Tree crown sheets and one slot')
        a = source.index(CROWNS_BEGIN) + len(CROWNS_BEGIN)
        b = source.index(CROWNS_END, a)
        source = source[:a] + 'const worldTreeCrowns=' + json.dumps(crowns, separators=(',', ':')) + ';' + source[b:]
    return source

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('game', type=Path)
    parser.add_argument('--assets', type=Path, default=Path(__file__).resolve().parents[1] / 'assets/town-buildings')
    args = parser.parse_args()
    args.game.write_text(embed(args.game.read_text(), args.assets))
