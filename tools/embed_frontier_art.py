"""Rebuild the 11–15 character bank and backgrounds in the self-contained game."""
import argparse
import base64
import colorsys
import io
import json
from pathlib import Path
import re
import zlib

from PIL import Image
from draw_frontier_relics import relic
from draw_adventure_art import FRONTIER_LANDSCAPES, HEIGHT, WIDTH, panorama

ROOT = Path(__file__).resolve().parents[1]
SIZE = 96
# Rabbit/ram, otter/dragon, mole/armadillo, ermine/owl, swallow/lion.
SHINY_SHIFTS = [(.24, .45), (.44, .22), (.55, .48), (.71, .39), (.40, .57)]


def shiny_rgb(rgb, shift):
    hue, sat, value = colorsys.rgb_to_hsv(*(v / 255 for v in rgb))
    hue = (hue + shift) % 1
    # Keep the outline readable and tint the pale fur of winter species.
    sat = min(.95, sat * .86 + (.16 if value > .45 else .055))
    return tuple(round(c * 255) for c in colorsys.hsv_to_rgb(hue, sat, value))


def encode_sprites(sheet):
    if sheet.size != (SIZE * 5, SIZE * 5):
        raise ValueError('Expected five rows and five columns of 96px cells')
    indices = bytearray(sheet.width * SIZE * 7)
    records = []
    for row in range(7):
        for col in range(5):
            size = SIZE if row < 5 and col == 4 else 64
            x, y = col * SIZE, row * SIZE
            tile = sheet.crop((x, y, x + size, y + size)) if row < 5 else relic(col, row == 6)
            palette = sorted({p[:3] for p in tile.getdata() if p[3]})
            if not palette or len(palette) > 255:
                raise ValueError(f'Invalid palette in cell {row + 1}, {col + 1}')
            ids = {p: i + 1 for i, p in enumerate(palette)}
            for i, (r, g, b, a) in enumerate(tile.getdata()):
                if a:
                    if a != 255:
                        raise ValueError('Expected a hard pixel edge')
                    indices[(y + i // size) * sheet.width + x + i % size] = ids[(r, g, b)]
            entry = [size, bytes(c for rgb in palette for c in rgb).hex()]
            if row < 5 and col in (0, 4):
                shift = SHINY_SHIFTS[row][col == 4]
                entry.append(bytes(c for rgb in palette for c in shiny_rgb(rgb, shift)).hex())
            records.append(entry)
    return records, base64.b64encode(zlib.compress(indices, 9)).decode('ascii')


def embed(html, launcher=False):
    sheet = Image.open(ROOT / 'assets/adventure/frontier-11-15.png').convert('RGBA')
    records, data = encode_sprites(sheet)
    scenes = Image.new('RGB', (WIDTH, HEIGHT * 5))
    for i, palette in enumerate(FRONTIER_LANDSCAPES):
        scenes.paste(panorama(i + 11, palette), (0, i * HEIGHT))
    raster = io.BytesIO()
    if launcher:
        scenes.save(raster, 'WEBP', lossless=True, method=6, exact=True)
        if Image.open(io.BytesIO(raster.getvalue())).convert('RGB').tobytes() != scenes.tobytes():
            raise ValueError('Lossless background conversion failed')
        mime = 'webp'
    else:
        scenes.save(raster, 'PNG', optimize=True)
        mime = 'png'
    render = 'const frontierCells=' + json.dumps(records, separators=(',', ':')) + ';\n'
    render += "const frontierIndexData='" + data + "';\n"
    render += "const frontierPanoramaURI='data:image/" + mime + ";base64," + base64.b64encode(raster.getvalue()).decode('ascii') + "';"
    pattern = r'(/\* FRONTIER_ART_START \*/\n).*?(\n/\* FRONTIER_ART_END \*/)'
    html, count = re.subn(pattern, lambda m: m[1] + render + m[2], html, flags=re.S)
    if count != 1:
        raise ValueError('Missing or ambiguous frontier art markers')
    return html


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('html', type=Path)
    parser.add_argument('--launcher', action='store_true')
    args = parser.parse_args()
    args.html.write_text(embed(args.html.read_text(), args.launcher))
