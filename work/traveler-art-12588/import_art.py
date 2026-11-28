"""Import the four registered, unscaled PNGs for each reviewed building."""
import argparse
import hashlib
import json
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile

from PIL import Image, ImageChops

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
KINDS = ('footBath', 'seedSwap', 'shoeRepair', 'specimenHut', 'openGallery', 'umbrellaHut')
DIRECTIONS = ('下', '左', '上', '右')


def import_sheet(archive, views, kind, compact_size, quality):
    if [v['direction'] for v in views] != list(DIRECTIONS):
        raise ValueError(f'Unexpected orientation order for {kind}')
    side = views[0]['native'][0]
    canvas = Image.new('RGBA', (side * 4, side))
    compact = Image.new('RGBA', (compact_size * 4, compact_size))
    positions = []
    for index, view in enumerate(views):
        raw = archive.read(view['file'])
        if hashlib.sha256(raw).hexdigest() != view['sha256']:
            raise ValueError(view['file'])
        image = Image.open(BytesIO(raw)).convert('RGBA')
        if image.size != (side, side) or view['native'] != [side, side]:
            raise ValueError(f'Unexpected canvas size for {kind}')
        canvas.paste(image, (side * index, 0))
        thumb = image.resize((compact_size, compact_size), Image.Resampling.LANCZOS)
        compact.paste(thumb, (compact_size * index, 0))
        positions.append([*view['anchor'], view['plotWidth']])
    art = ROOT / 'assets/town-axis/painted' / f'{kind}.webp'
    canvas.save(art, lossless=True, exact=True, method=4)
    with Image.open(art) as result:
        if ImageChops.difference(canvas, result.convert('RGBA')).getbbox(alpha_only=False):
            raise ValueError(f'Lossless image mismatch for {kind}')
    target = HERE / 'launcher' / f'{kind}.webp'
    compact.save(target, quality=quality, alpha_quality=100, method=6, exact=True)
    return {'size': side, 'views': positions}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path)
    parser.add_argument('--compact-size', type=int, default=144)
    parser.add_argument('--quality', type=int, default=66)
    args = parser.parse_args()
    (HERE / 'launcher').mkdir(exist_ok=True)
    with ZipFile(args.archive) as archive:
        data = json.loads(archive.read('配置情報.json'))['facilities']
        if set(data) != set(KINDS):
            raise ValueError('The handoff must contain exactly the six buildings')
        plots = {kind: import_sheet(archive, data[kind], kind, args.compact_size, args.quality)
                 for kind in KINDS}
    (HERE / 'plots.json').write_text(json.dumps(plots, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
