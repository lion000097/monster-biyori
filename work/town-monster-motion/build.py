"""Install or refresh the embedded town sprites in the base game's HTML."""
import argparse
import base64
import json
import zlib
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
ART_BEGIN = '\n/* Town monster motion: generated source begins. */\n'
ART_END = '\n/* Town monster motion: generated source ends. */\n'


def encode_art():
    roster = json.loads((HERE / 'species.json').read_text())
    assets = {}
    for item in roster:
        identity = item['id']
        with Image.open(HERE / 'atlases' / (identity + '.png')) as atlas:
            side = atlas.width // 3
            if atlas.mode != 'P' or atlas.size != (side * 3, side * 4) or atlas.info.get('transparency') != 0:
                raise ValueError(f'Invalid town atlas for {identity}')
            cells = [atlas.crop((x * side, y * side, (x + 1) * side, (y + 1) * side)).tobytes()
                     for y in range(4) for x in range(3)]
            indices = b''.join(cells)
            palette = atlas.getpalette()
            normal = [int.from_bytes(bytes(palette[i:i + 3]), 'big') for i in range(0, (max(indices) + 1) * 3, 3)]
            if len(item['shiny']) != len(normal):
                raise ValueError(f'Shiny palette size mismatch for {identity}')
        assets[identity] = dict(side=side, motion=item['motion'], normal=normal, shiny=item['shiny'],
                                pixels=base64.b64encode(zlib.compress(indices, 9)).decode('ascii'))
    return json.dumps(assets, separators=(',', ':'))


def build(source, destination):
    html = source.read_bytes().decode('utf-8')
    js = (HERE / 'town-motion.js').read_text().replace('__TOWN_MOTION_DATA__', encode_art())
    block = ART_BEGIN + js + ART_END
    if ART_BEGIN in html or ART_END in html:
        if html.count(ART_BEGIN) != 1 or html.count(ART_END) != 1:
            raise ValueError('Expected one complete town motion block')
        left, rest = html.split(ART_BEGIN)
        _, right = rest.split(ART_END)
        destination.write_bytes((left + block + right).encode('utf-8'))
        return
    edits = {
        'let dx=0,dy=Math.round(Math.sin(phase)*1.5);':
            'const motionAsset=monster && townMotionAsset(o);\n  let dx=0,dy=motionAsset?0:Math.round(Math.sin(phase)*1.5);',
        'size*.74+Math.sin(now/850)*1.5': 'size*.74+(motionAsset?0:Math.sin(now/850)*1.5)',
        'size*(.82-.025*Math.sin(now/650+o.id))': 'size*(motionAsset ? .82 : .82-.025*Math.sin(now/650+o.id))',
        'const left=Math.round(x-size/2)+dx,top=foot-height+dy,art=monster?spriteMonsterHD(o.kind,!!o.shiny):citizenArt(o);':
            'const lift=motionAsset?.motion===\'fly\'?Math.round(size*.12):0;\n  '
            'const left=Math.round(x-size/2)+dx,top=foot-height+dy-lift,art=motionAsset?townMotionArt(o,motionAsset):monster?spriteMonsterHD(o.kind,!!o.shiny):citizenArt(o);',
        'const flipped=!!(townPose?.side?townPose.side<0:':
            'if(motionAsset?.motion===\'fish\' && !isPond(Math.round(o.x),Math.round(o.y))){\n    '
            'const pad=Math.max(2,Math.round(size*.07));\n    '
            'ctx.drawImage(townWaterBubble,left-pad,top-pad,size+pad*2,height+pad*2);\n  }\n  '
            'const flipped=!motionAsset && !!(townPose?.side?townPose.side<0:',
        '\nclaimSave12556();\nconst didLoad=': block + 'claimSave12556();\nconst didLoad=',
    }
    for old, new in edits.items():
        if html.count(old) != 1:
            raise ValueError(f'Expected one 1.25.95 integration point: {old[:65]!r}')
        html = html.replace(old, new, 1)
    destination.write_bytes(html.encode('utf-8'))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('destination', type=Path)
    args = parser.parse_args()
    build(args.source, args.destination)
