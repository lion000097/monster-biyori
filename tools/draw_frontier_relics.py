"""Read the native 64px boss treasures for adventure areas 11 through 15."""
from functools import lru_cache
from pathlib import Path

from PIL import Image

ATLAS = Path(__file__).resolve().parents[1] / 'assets/adventure/frontier-treasures-11-15.png'
SIZE = 64


@lru_cache(maxsize=1)
def treasure_atlas():
    with Image.open(ATLAS) as source:
        if source.size != (5 * SIZE, 2 * SIZE):
            raise ValueError('The treasure atlas must have five columns and two 64px rows')
        return source.convert('RGBA')


def relic(area, ultra):
    if not 0 <= area < 5:
        raise ValueError('Expected one of the five frontier areas')
    x, y = area * SIZE, int(ultra) * SIZE
    return treasure_atlas().crop((x, y, x + SIZE, y + SIZE))
