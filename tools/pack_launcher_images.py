"""Re-encode large embedded PNGs only when WebP losslessly reduces file size.

Run on the self-contained launcher HTML; keep source artwork in its original format.
Pillow with WebP support is required. Refuse every conversion with changed RGBA.
"""
import argparse
import base64
import io
import hashlib
from pathlib import Path
import re
from PIL import Image, features

# Some indexed PNGs composite differently in Chromium even if decoded RGBA matches.
KEEP_PNG = {'e10229bb54dce1994b451ce1d40031e449515ce283662e31ad0ced9b39ef3a9c'}
# The character decoder reads the PNG byte stream directly, including its filters.
PNG = re.compile(
    rb'''(?P<character>(?:indexImage|lionImage)\.src\s*=\s*['"])?'''
    rb'data:image/png;base64,(?P<data>[A-Za-z0-9+/=]{20000,})'
)

def pack(blob):
    if not features.check('webp'):
        raise RuntimeError('Pillow WebP support is required')
    changes = []
    def lossless(match):
        if match['character']:
            return match[0]
        raw = base64.b64decode(match['data'], validate=True)
        if hashlib.sha256(raw).hexdigest() in KEEP_PNG:
            return match[0]
        image = Image.open(io.BytesIO(raw))
        if any(key in image.info for key in ('icc_profile','gamma','chromaticity','srgb')):
            return match[0]
        original = image.convert('RGBA')
        buffer = io.BytesIO()
        original.save(buffer, 'WEBP', lossless=True, method=6, exact=True)
        decoded = Image.open(io.BytesIO(buffer.getvalue())).convert('RGBA')
        result = b'data:image/webp;base64,' + base64.b64encode(buffer.getvalue())
        saved = len(match[0]) - len(result)
        if saved < 1024 or original.size != decoded.size or original.tobytes() != decoded.tobytes():
            return match[0]
        changes.append((*original.size, saved))
        return result
    return PNG.sub(lossless, blob), changes

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('destination', type=Path)
    args = parser.parse_args()
    source = args.source.read_bytes()
    data, changes = pack(source)
    args.destination.write_bytes(data)
    for w,h,saved in changes:
        print(f'{w}x{h}: saved {saved:,} bytes')
    print(f'{len(changes)} images: {len(source):,} -> {len(data):,} bytes')
