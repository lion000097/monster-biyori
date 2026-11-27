"""Embed the native-pixel plans for the facilities introduced in 1.25.75."""
import argparse
import base64
import json
import zlib
from pathlib import Path
from struct import iter_unpack

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PARTS = ('raster', 'joinery', 'props', 'levels-06-13', 'levels-14-21', 'levels-22-30', 'exhibits', 'display')
START = '// BEGIN town workshop drawings'
END = '// END town workshop drawings'

def reference_atlas():
    """Keep the reference's exact visible RGB values in the game's native atlas format."""
    with Image.open(ROOT / 'assets/town-atelier/komorebi-house.png') as image:
        source = image.convert('RGBA')
    if source.size != (128, 128):
        raise ValueError('Expected the native Komorebi House frame')
    colors = {}
    pixels = bytearray()
    for red, green, blue, alpha in iter_unpack('4B', source.tobytes()):
        pixels.append(colors.setdefault((red, green, blue), len(colors) + 1) if alpha else 0)
    palette = bytes(3) + b''.join(bytes(color) for color in colors)
    packed = base64.b64encode(zlib.compress(pixels, 9)).decode('ascii')
    return {'komorebiMaterial': [source.width, palette.hex(), packed]}


def embed(source):
    if START in source:
        begin = source.index(START)
        end = source.index(END, begin) + len(END)
    else:
        begin = source.index('const town75Patterns=')
        end = source.index('const sales75=', begin)
    parts = [(ROOT / 'assets' / 'town-atelier' / (name + '.js')).read_text() for name in PARTS]
    atlas = json.dumps(reference_atlas(), separators=(',', ':'))
    module = '\n'.join([START, 'const additionArt75=(()=>{', f'const materialAtlas={atlas};', *parts, '})();', END])
    return source[:begin] + module + '\n' + source[end:].lstrip('\n')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('game', type=Path)
    args = parser.parse_args()
    args.game.write_text(embed(args.game.read_text()))
