"""Embed the maintained town expansion sources in the standalone game."""
from pathlib import Path
root = Path(__file__).resolve().parent.parent
game = root / 'game.html'
start, end = '// TOWN_EXPANSION_START', '// TOWN_EXPANSION_END'
html = game.read_text()
block = start + '\n' + '\n'.join((root / 'src' / f).read_text() for f in
    ['town-expansion.js', 'town-art.js']) + '\n' + end + '\n\n'
if start in html:
    a, rest = html.split(start, 1)
    _, b = rest.split(end, 1)
    html = a + block + b.lstrip('\n')
else:
    marker = '// Load saved species only after the full roster has been registered.'
    html = html.replace(marker, block + marker)
game.write_text(html)
