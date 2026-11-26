"""Bring the floor edge of the original facility sheets onto the map's 2:1 tile plane."""
import base64
from collections import Counter
import io
import json
import re

from PIL import Image


def palette_index(image, color):
    palette = list(zip(*[iter(image.getpalette())] * 3))
    return min(range(1, len(palette)), key=lambda i: sum((a-b)**2 for a, b in zip(palette[i], color)))


def level_frame(frame, near, tree):
    # The old sheets have their own padding. plotImageRect places this native-pixel
    # ordinate exactly on the near vertex, including the half-size hut and stall.
    size = frame.width
    original = frame.load()
    target = (191, 200, 177) if tree else (224, 202, 166)
    indexed = frame.mode == 'P'
    floor = palette_index(frame, target) if indexed else (*target, 255)
    palette = frame.getpalette() if indexed else None
    def visible(pixel):
        return pixel != 0 if indexed else pixel[3] >= 128
    def surface_distance(pixel):
        rgb = palette[pixel*3:pixel*3+3] if indexed else pixel[:3]
        return sum((a-b)**2 for a,b in zip(rgb,target))
    for x in range(size):
        # Evaluate pixels at their centres, using integer quarters of a pixel.
        dx = abs(2*x + 1-size)
        top = near*4-2*size+dx
        bottom = near*4-dx
        inside = [y for y in range(max(0, top//4), min(size,(bottom+3)//4)) if top <= 4*y+2 < bottom]
        if not inside:
            continue
        last = inside[-1]
        # Follow the local paving when it is visible. Rails, masonry and plants are separate objects.
        count = Counter(original[x,y] for y in inside[-14:-4] if visible(original[x,y]))
        tile = next((index for index, _ in count.most_common() if surface_distance(index) < 900), floor)
        for y in inside:
            if not visible(original[x,y]) or y >= last-1:
                original[x,y] = tile
    return frame


def level_sheets(html):
    frames = json.loads(re.search(r'const facilityFrames = (\{.*?\});', html, re.S)[1])
    crowns = json.loads(re.search(r'const worldTreeFrames = (\[.*?\]);', html)[1])
    # Free-standing decorations expose the underlying terrain. The festival has a separate atlas.
    groundless = {'relicStand','flowerbed211','bench211','lamp211','fountain211'}
    main = [(key, rect) for key,rect in frames.items() if key not in groundless|{'expeditionOffice'}]
    main.extend(('worldtree', rect) for rect in crowns)
    for sheet, entries in [('facilitySheet',main),('expeditionOfficeSheet',[('expeditionOffice',frames['expeditionOffice'])])]:
        pattern = re.compile(r"(" + sheet + r"\.src\s*=\s*'data:image/png;base64,)([^']+)(')")
        def update(match):
            image = Image.open(io.BytesIO(base64.b64decode(match[2])))
            if not (image.mode == 'RGBA' or image.mode == 'P' and image.info.get('transparency') == 0):
                raise ValueError(f'Unexpected source palette in {sheet}')
            for key,(x,y,size) in entries:
                near = size - (4 if key in ('hut','stall') else 12)
                for face in range(4):
                    left = x + face*size
                    tile = image.crop((left,y,left+size,y+size))
                    image.paste(level_frame(tile,near,key=='worldtree'),(left,y))
            output = io.BytesIO()
            image.save(output,'PNG',optimize=True)
            return match[1] + base64.b64encode(output.getvalue()).decode('ascii') + match[3]
        html,count = pattern.subn(update, html)
        if count != 1:
            raise ValueError(f'Expected one embedded {sheet}')
    return html
