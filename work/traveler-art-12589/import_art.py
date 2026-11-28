"""Import the approved PNGs into square atlas cells using only transparent padding."""
import argparse
import hashlib
import json
import math
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile

import numpy as np
from PIL import Image, ImageChops

HERE = Path(__file__).resolve().parent
ART = HERE.parents[1] / 'assets/town-axis/painted'
DIRECTIONS = ('下', '左', '上', '右')
# All display densities divide both the square canvas and its diamond exactly.
COMPACT = {
    'footBath': (3, 42), 'seedSwap': (4, 49), 'shoeRepair': (3, 44),
    'specimenHut': (4, 49), 'openGallery': (4, 48), 'umbrellaHut': (4, 49),
}


def load_views(archive, views):
    if [v['facing'] for v in views] != list(DIRECTIONS):
        raise ValueError('Unexpected rotation order')
    pictures = []
    for view in views:
        raw = archive.read(view['file'])
        if hashlib.sha256(raw).hexdigest() != view['sha256']:
            raise ValueError(view['file'])
        image = Image.open(BytesIO(raw)).convert('RGBA')
        if image.size != (view['width'], view['height']):
            raise ValueError(view['file'])
        pictures.append(image)
    return pictures


def compact_view(frame, center, span, divisor):
    side = frame.width // divisor
    compact = frame.resize((side, side), Image.Resampling.LANCZOS)
    alpha = np.asarray(compact.getchannel('A')).astype(float)
    alpha = (np.rint(alpha * 7 / 255) * 255 / 7).astype(np.uint8)
    yy, xx = np.indices(alpha.shape)
    dx = (xx + .5) * divisor - center[0]
    dy = (yy + .5) * divisor - center[1]
    front = span / 4 - abs(dx) / 2
    alpha[dy > front] = 0
    alpha[(abs(dx) + 2 * abs(dy)) <= span / 2] = 255
    # Remove resampling spill at the stone's two vertical outer edges.
    alpha[(abs(dx) >= span / 2) & (dy > -16)] = 0
    compact.putalpha(Image.fromarray(alpha))
    return compact


def import_building(archive, kind, views):
    pictures = load_views(archive, views)
    ax, ay = views[0]['anchor']
    span = views[0]['plotWidth']
    if any(v['anchor'] != [ax, ay] or v['plotWidth'] != span for v in views):
        raise ValueError(f'Inconsistent ground frame for {kind}')
    bounds = [p.getchannel('A').getbbox() for p in pictures]
    bottom = ay + span // 4 + 12
    extent = max(max(2 * max(ax - x0, x1 - ax) + 2, bottom - y0 + 2)
                 for x0, y0, x1, _ in bounds)
    side = 24 * math.ceil(extent / 24)
    left, top = ax - side // 2, bottom - side
    box = (left, top, left + side, bottom)
    anchor = [ax - left, ay - top]
    divisor, quality = COMPACT[kind]
    small = side // divisor
    full_atlas = Image.new('RGBA', (4 * side, side))
    compact_atlas = Image.new('RGBA', (4 * small, small))
    for idx, (image, bounds_) in enumerate(zip(pictures, bounds)):
        if not (left <= bounds_[0] and top <= bounds_[1] and bounds_[2] <= box[2] and bounds_[3] <= bottom):
            raise ValueError(f'Clipped artwork {kind} {idx}')
        frame = image.crop(box)
        full_atlas.paste(frame, (idx * side, 0))
        compact_atlas.paste(compact_view(frame, anchor, span, divisor), (idx * small, 0))

    full = ART / (kind + '.webp')
    full_atlas.save(full, lossless=True, exact=True, method=6)
    with Image.open(full) as output:
        if ImageChops.difference(output.convert('RGBA'), full_atlas).getbbox(alpha_only=False):
            raise ValueError(f'Lossless atlas mismatch for {kind}')
    dest = HERE / 'launcher' / (kind + '.webp')
    # Keep the geometrically registered alpha channel lossless.
    compact_atlas.save(dest, quality=quality, alpha_quality=100, method=6, exact=True)
    with Image.open(dest) as output:
        if ImageChops.difference(output.convert('RGBA').getchannel('A'), compact_atlas.getchannel('A')).getbbox():
            raise ValueError(f'Compact outline mismatch for {kind}')
    print(kind, side, small, left, top, anchor, dest.stat().st_size, flush=True)
    return {'size': side, 'anchor': anchor, 'span': span, 'sourceOffset': [left, top]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('approved', type=Path)
    args = parser.parse_args()
    (HERE / 'launcher').mkdir(exist_ok=True)
    with ZipFile(args.approved) as archive:
        facilities = json.loads(archive.read('配置情報.json'))['facilities']
        if set(facilities) != set(COMPACT):
            raise ValueError('Expected exactly the six approved facilities')
        plots = {k: import_building(archive, k, facilities[k]) for k in COMPACT}
    (HERE / 'plots.json').write_text(json.dumps(plots, ensure_ascii=False, indent=2)+'\n')


if __name__ == '__main__':
    main()
