"""Check the release cells against the 24 approved PNGs and the native grid."""
import base64
import hashlib
import json
import re
import sys
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile
import numpy as np
from PIL import Image

here = Path(__file__).resolve().parent
root = here.parents[1]
plots = json.loads((here/'plots.json').read_text())
web = (root/'releases/1.25.89/game.html').read_text()
atlas = json.loads(re.search(r'^const axisAtlas=(.+);$',web,re.M)[1])
assert 'drawTravelerPaving' not in web
count = 0
with ZipFile(sys.argv[1]) as z:
    data = json.loads(z.read('配置情報.json'))['facilities']
    for kind, plot in plots.items():
        size = plot['size']
        left, top = plot['sourceOffset']
        encoded = base64.b64decode(atlas[kind][1].split(',',1)[1],validate=True)
        assert encoded == (root/'assets/town-axis/painted'/(kind+'.webp')).read_bytes()
        tiles = Image.open(BytesIO(encoded)).convert('RGBA')
        assert tiles.size == (size * 4, size)
        for face, view in enumerate(data[kind]):
            raw = z.read(view['file'])
            assert hashlib.sha256(raw).hexdigest() == view['sha256']
            source = Image.open(BytesIO(raw)).convert('RGBA')
            source_box = (left, top, left + size, top + size)
            original = np.asarray(source.crop(source_box))
            art = np.asarray(tiles.crop((size*face,0,size*(face+1),size)))
            assert np.array_equal(art, original) and np.count_nonzero(art[:,:,3]) == np.count_nonzero(np.asarray(source)[:,:,3])
            ax, ay = plot['anchor']
            assert [ax + left, ay + top] == view['anchor']
            span = plot['span']
            assert span == 3*64*view['plot'][0]
            q = [[ax,ay-span//4],[ax+span//2,ay],[ax,ay+span//4],[ax-span//2,ay]]
            assert [[x+left,y+top] for x,y in q] == view['diamond']
            yy,xx = np.indices((size,size))
            dx,dy = xx+.5-ax,yy+.5-ay
            lot = abs(dx)+2*abs(dy)<=span/2
            assert (art[:,:,3][lot]==255).all()
            assert not art[:,:,3][dy+abs(dx)/2>span/4].any()
            count += 1
print(f'{count} approved images, {count*4} projected vertices matched.')
