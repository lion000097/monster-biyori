"""Assemble or embed the native adventure artwork stored in assets/adventure."""
import argparse
import base64
from pathlib import Path
import re

from PIL import Image

ART = Path(__file__).resolve().parents[1] / 'assets' / 'adventure'
WIDTH, HEIGHT = 608, 106


def embed(source, launcher=False):
    def uri(name):
        if not name:
            return ''
        raw = (ART / name).read_bytes()
        mime = name.rsplit('.', 1)[1]
        return f'data:image/{mime};base64,' + base64.b64encode(raw).decode('ascii')

    assets = {
        'adventureFallbackURI': 'trail-panoramas-fallback.webp' if launcher else None,
        'adventureArt.src': 'trail-panoramas-compact.avif' if launcher else 'trail-panoramas.webp',
        'adventureGoal.src': 'trail-goal.png',
        'adventureChest.src': 'trail-chest.png'
    }
    for target, name in assets.items():
        pattern = r"^((?:const )?" + re.escape(target) + r"=)'[^']*';$"
        source, changes = re.subn(pattern, lambda m: m[1] + "'" + uri(name) + "';", source, flags=re.M)
        if changes != 1:
            raise ValueError(f'Expected one inline adventure asset for {target}')
    return source


def adventure_atlas():
    """Keep the original export layout: ten areas, sanctuary, flag, then chest frames."""
    with Image.open(ART / 'trail-panoramas.webp') as scenes, Image.open(ART / 'trail-goal.png') as flag, Image.open(ART / 'trail-chest.png') as chest:
        atlas = Image.new('RGBA', (WIDTH, 11 * HEIGHT + flag.height))
        atlas.paste(scenes.crop((0, 0, WIDTH, HEIGHT * 10)), (0, 0))
        atlas.paste(scenes.crop((0, HEIGHT * 15, WIDTH, HEIGHT * 16)), (0, HEIGHT * 10))
        atlas.paste(flag.convert('RGBA'), (0, HEIGHT * 11))
        atlas.paste(chest.convert('RGBA'), (46, HEIGHT * 11))
        return atlas


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('path', type=Path, help='Output PNG, or game HTML when using --embed')
    parser.add_argument('--embed', action='store_true', help='Update the embedded images in an existing HTML')
    parser.add_argument('--launcher', action='store_true', help='Use the offline launcher artwork')
    args = parser.parse_args()
    if args.embed:
        args.path.write_text(embed(args.path.read_text(), launcher=args.launcher))
    else:
        adventure_atlas().save(args.path, optimize=True)
