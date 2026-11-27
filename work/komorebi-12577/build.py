"""Build the two 1.25.77 games from the published web and offline editions."""
import re
import sys
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
from embed_town_atelier import embed
from pack_launcher_html import MARKER, decode_payload, pack, unbundle_assets

old = ROOT / 'releases/1.25.76'
release = ROOT / 'releases/1.25.77'

def retarget(source):
    if source.count("GAME_APP_VERSION='1.25.76'") != 1:
        raise ValueError('Expected the published 1.25.76 game')
    source = source.replace('1.25.76', '1.25.77').replace('施設と装飾73種の描き直し</footer>', 'こもれびハウスの建築意匠</footer>')
    return embed(source)

def unpack_previous():
    html = (old / 'launcher-game.html').read_text()
    payload = re.search(r'id="ranch-payload">(.*?)</script>', html, re.S)[1]
    inflater = re.search(r'id="ranch-inflater">(.*?)</script>', html, re.S)[1]
    size = int(re.search(r'const PACKED_BYTES=(\d+);', html)[1])
    bundle = zlib.decompress(decode_payload(payload, size))
    return unbundle_assets(bundle, dictionary=True).replace(MARKER, inflater)

web = retarget((old / 'game.html').read_text()).encode()
(ROOT / 'game.html').write_bytes(web)
(release / 'game.html').write_bytes(web)
launcher = pack(retarget(unpack_previous()), dense=True, binary_assets=True, dictionary=True).encode()
if not 0 < len(launcher) <= 4 * 1024 * 1024:
    raise ValueError(f'Compact game size {len(launcher)}')
(release / 'launcher-game.html').write_bytes(launcher)
print(f'Web {len(web):,}, offline {len(launcher):,}', flush=True)
