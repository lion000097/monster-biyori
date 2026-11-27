"""Embed the native-pixel plans for the facilities introduced in 1.25.75."""
import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PARTS = ('raster', 'joinery', 'props', 'levels-06-13', 'levels-14-21', 'levels-22-30', 'exhibits', 'display')
START = '// BEGIN town workshop drawings'
END = '// END town workshop drawings'

def embed(source):
    if START in source:
        begin = source.index(START)
        end = source.index(END, begin) + len(END)
    else:
        begin = source.index('const town75Patterns=')
        end = source.index('const sales75=', begin)
    parts = [(ROOT / 'assets' / 'town-atelier' / (name + '.js')).read_text() for name in PARTS]
    module = '\n'.join([START, 'const additionArt75=(()=>{', *parts, '})();', END])
    return source[:begin] + module + '\n' + source[end:].lstrip('\n')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('game', type=Path)
    args = parser.parse_args()
    args.game.write_text(embed(args.game.read_text()))
