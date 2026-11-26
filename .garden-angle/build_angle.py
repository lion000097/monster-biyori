"""Prepare the two 1.25.63 games from the published 1.25.62 standalone builds."""
import re
import sys
import zlib
from pathlib import Path

def transform(source, assets):
    replacements = (
        ("GAME_APP_VERSION='1.25.62'", "GAME_APP_VERSION='1.25.63'"),
        ('Ver.1.25.62', 'Ver.1.25.63'),
        ('— 牧場の装飾4種</footer>', '— 牧場の道と装飾の角度</footer>'),
        ('lamp211:{width:80,pivot:68},...gardenProps250', 'bench211:{width:64,pivot:40},lamp211:{width:80,pivot:68},...gardenProps250'),
        ("type==='lamp211'?frame.size-10:frame.size-24", "frame.size-(type==='lamp211'?10:16)"),
    )
    for old,new in replacements:
        if not source.count(old) or old!='Ver.1.25.62' and source.count(old)!=1:
            raise ValueError(f'Unexpected baseline {old}')
        source=source.replace(old,new)
    return embed(source,assets)

def unpack(wrapper):
    data=re.search(r'id="ranch-payload">([^<]+)</script>',wrapper)[1]
    size=int(re.search(r'const PACKED_BYTES=(\d+);',wrapper)[1])
    inflater=re.search(r'<script id="ranch-inflater">([\s\S]+?)</script>',wrapper)[1]
    return zlib.decompress(decode_payload(data,size)).decode().replace(MARKER,inflater)

if __name__=='__main__':
    root=Path(sys.argv[1]).resolve()
    sys.path.insert(0,str(root/'tools'))
    from embed_town_art import embed
    from pack_launcher_html import MARKER, decode_payload, pack
    old=root/'releases/1.25.62';new=root/'releases/1.25.63';new.mkdir(parents=True,exist_ok=True)
    assets=root/'assets/town-buildings'
    web=transform((old/'game.html').read_text(),assets)
    for path in (root/'game.html',new/'game.html'):
        path.write_text(web)
    compact=pack(transform(unpack((old/'launcher-game.html').read_text()),assets)).encode()
    if len(compact)>4*1024*1024:
        raise ValueError('Launcher exceeds 4 MiB')
    (new/'launcher-game.html').write_bytes(compact)
    print('Browser',len(web.encode()),'launcher',len(compact))
