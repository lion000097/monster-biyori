"""Build version 1.25.79 using the corresponding published 1.25.78 editions."""
import base64
import io
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
from embed_town_atelier import embed
from pack_launcher_html import MARKER, decode_payload, pack, unbundle_assets

old = ROOT / 'releases/1.25.78'
release = ROOT / 'releases/1.25.79'

def retarget(source):
    if source.count("GAME_APP_VERSION='1.25.78'") != 1:
        raise ValueError('Expected the published 1.25.78 game')
    source = source.replace('1.25.78', '1.25.79').replace('施設と装飾73種の細工</footer>', '施設と装飾73種の新原画</footer>')
    return embed(source)

def unpack_previous():
    html = (old / 'launcher-game.html').read_text()
    payload = re.search(r'id="ranch-payload">(.*?)</script>', html, re.S)[1]
    inflater = re.search(r'id="ranch-inflater">(.*?)</script>', html, re.S)[1]
    size = int(re.search(r'const PACKED_BYTES=(\d+);', html)[1])
    raw = decode_payload(payload, size)
    bundle = subprocess.run(['zstd', '-q', '-d', '-c'], input=raw, capture_output=True, check=True).stdout
    return unbundle_assets(bundle, dictionary=True).replace(MARKER, inflater)

def compact_bath_sheet(source):
    # The original offline bath sheet has only 280 colors. Store its exact four
    # RGBA channels as 9-bit indices with a shared palette.
    pattern = r"(ranchSheets130\.onsen130\.img\.src=)'data:image/webp;base64,([^']+)'"
    m = re.search(pattern, source)
    if not m:
        raise ValueError('Expected the old offline bath sheet')
    image = Image.open(io.BytesIO(base64.b64decode(m[2]))).convert('RGBA')
    pixels = np.asarray(image).reshape(-1,4).copy().view('uint32').ravel()
    colors, ids, popularity = np.unique(pixels,return_inverse=True,return_counts=True)
    order = np.argsort(-popularity,kind='stable')
    palette = colors[order]
    if len(palette)>512:
        raise ValueError('Too many bath pigments')
    ids=np.argsort(order)[ids].ravel()
    low = ids.astype('uint8')
    high = np.packbits(ids>255,bitorder='little')
    recovered = low.astype('uint16')|np.unpackbits(high,bitorder='little')[:len(low)].astype('uint16')<<8
    if not np.array_equal(palette[recovered], pixels):
        raise ValueError('Offline bath pixels changed')
    b64=lambda data:base64.b64encode(data).decode()
    script="""(()=>{
const tile=document.createElement('canvas');tile.width=WIDTH;tile.height=HEIGHT;
const ctx=tile.getContext('2d'),frame=ctx.createImageData(tile.width,tile.height),out=frame.data;
const palette=Uint8Array.from(atob('COLORS'),c=>c.charCodeAt(0)),lo=atob('LOW'),hi=atob('HIGH');
for(let i=0;i<lo.length;i++){
 const index=lo.charCodeAt(i)|((hi.charCodeAt(i>>3)>>(i&7))&1)<<8,j=index*4,k=i*4;
 out[k]=palette[j];out[k+1]=palette[j+1];out[k+2]=palette[j+2];out[k+3]=palette[j+3];
}
ctx.putImageData(frame,0,0);return tile.toDataURL('image/png');
})()""".replace('WIDTH',str(image.width)).replace('HEIGHT',str(image.height)).replace('COLORS',b64(palette.tobytes())).replace('LOW',b64(low)).replace('HIGH',b64(high))
    return source[:m.start()]+m[1]+script+source[m.end():]

if __name__=='__main__':
    web=retarget((old/'game.html').read_text()).encode()
    (ROOT/'game.html').write_bytes(web)
    (release/'game.html').write_bytes(web)
    print(f'Web {len(web):,}',flush=True)
    if '--web' not in sys.argv:
        launcher=pack(compact_bath_sheet(retarget(unpack_previous())), binary_assets=True,dictionary=True,zstd_pack=True,wide_words=True).encode()
        print(f'Offline {len(launcher):,} / {4*1024*1024:,}',flush=True)
        if not 0<len(launcher)<=4*1024*1024:
            raise ValueError('Offline game exceeds the launcher limit')
        (release/'launcher-game.html').write_bytes(launcher)
