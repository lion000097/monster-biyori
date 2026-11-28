"""Apply the Shirogao town-only pilot to a web or unpacked launcher HTML."""
import argparse
import base64
import json
import zlib
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent


def encode_art():
    with Image.open(HERE / 'shirogao-town.png') as source:
        atlas = source.convert('RGBA')
    if atlas.size != (192, 256):
        raise ValueError('Expected 4 rows of three authored 64×64 tiles')
    palette = {None: 0}
    indices = bytearray()
    for row in range(4):
        for frame in range(3):
            left, top = frame * 64, row * 64
            tile = atlas.crop((left, top, left + 64, top + 64))
            data = tile.tobytes()
            for at in range(0, len(data), 4):
                red, green, blue, alpha = data[at:at + 4]
                if alpha not in (0, 255):
                    raise ValueError('Non-indexed alpha in the town sprite')
                color = ((red << 16) | (green << 8) | blue) if alpha else None
                indices.append(palette.setdefault(color, len(palette)))
    colors = [value or 0 for value in palette]
    return json.dumps(colors, separators=(',', ':')), base64.b64encode(zlib.compress(indices, 9)).decode('ascii')


def build(source, destination):
    html = source.read_bytes().decode('utf-8')
    js = (HERE / 'town-walk.js').read_text(encoding='utf-8')
    palette, pixels = encode_art()
    js = js.replace('__SHIROGAO_PALETTE__', palette).replace('__SHIROGAO_PIXELS__', pixels)
    edits = {
        'let dx=0,dy=Math.round(Math.sin(phase)*1.5);':
            'const shirogaoOnMap=monster && o.kind===shirogaoKind;\n  let dx=0,dy=shirogaoOnMap?0:Math.round(Math.sin(phase)*1.5);',
        'size*.74+Math.sin(now/850)*1.5':
            'size*.74+(shirogaoOnMap ? 0 : Math.sin(now/850)*1.5)',
        'size*(.82-.025*Math.sin(now/650+o.id))':
            'size*(shirogaoOnMap ? .82 : .82-.025*Math.sin(now/650+o.id))',
        'art=monster?spriteMonsterHD(o.kind,!!o.shiny):citizenArt(o);':
            'art=shirogaoOnMap?shirogaoTownArt(o):monster?spriteMonsterHD(o.kind,!!o.shiny):citizenArt(o);',
        'const flipped=!!(townPose?.side?townPose.side<0:':
            'const flipped=!shirogaoOnMap && !!(townPose?.side?townPose.side<0:',
        '\nclaimSave12556();\nconst didLoad=': '\n' + js + '\nclaimSave12556();\nconst didLoad=',
    }
    for old, new in edits.items():
        if html.count(old) != 1:
            raise ValueError(f'Expected one town integration point: {old[:65]!r}')
        html = html.replace(old, new, 1)
    destination.write_bytes(html.encode('utf-8'))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('destination', type=Path)
    args = parser.parse_args()
    build(args.source, args.destination)
