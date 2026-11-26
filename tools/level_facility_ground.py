"""Fit the original village-sheet ground to the same pixel centres as the road tiles."""
import base64
from collections import Counter
from io import BytesIO
import json
from math import ceil
from pathlib import Path
import re

from PIL import Image

# These are free-standing objects through which the underlying terrain is visible.
OBJECTS={'relicStand','flowerbed211','bench211','lamp211','fountain211'}


def level_ground(image,pad):
    size=image.width
    src=image.convert('RGBA')
    pixels=src.load()
    original=src.copy()
    old=original.load()
    # Sample the surface near both sides. This keeps sandstone, dirt and the
    # cool green paving of the World Tree in their own palettes.
    colors=Counter()
    for x in range(3,size-3):
        near=size-pad-abs(x+.5-size/2)/2
        for offset in (5,7,9):
            color=old[x,ceil(near-.5)-offset]
            if color[3]==255 and sum(color[:3])>305:colors[color]+=1
    floor=colors.most_common(1)[0][0]
    for x in range(size):
        slope=abs(x+.5-size/2)/2
        top=ceil(size/2-pad+slope-.5)
        bottom=ceil(size-pad-slope-.5)
        for y in range(max(top,0),min(size,bottom)):
            if not old[x,y][3]:
                pixels[x,y]=floor
        # Where a continuous sill runs along the two outer faces, bring the
        # paving down to the road. Keep isolated upright posts and steps.
        if bottom-top>=9:
            sample=old[x,bottom-5]
            for depth in (1,2):
                y=bottom-depth
                color=old[x,y]
                if not color[3] or color==sample or sample[3]!=255:continue
                if x<4 or x>=size-4:continue
                neighbours=[]
                for nx in (x-3,x+3):
                    end=ceil(size-pad-abs(nx+.5-size/2)/2-.5)
                    if end>depth:neighbours.append(old[nx,end-depth])
                if len(neighbours)==2 and all(c==color for c in neighbours) and old[x,bottom-6]!=color:
                    pixels[x,y]=sample if sample in colors and colors[sample]>3 else floor
        for y in range(max(0,bottom),size):
            pixels[x,y]=(0,0,0,0)
    if image.mode!='P':return src
    # The native palette already contains every selected colour. Preserve index
    # zero for transparency and leave the game's indexed art lossless.
    palette=image.getpalette()
    lookup={tuple(palette[i:i+3]):i//3 for i in range(len(palette)-3,2,-3)}
    out=image.copy()
    dst=out.load()
    for y in range(size):
        for x in range(size):
            if pixels[x,y]!=old[x,y]:
                color=pixels[x,y]
                dst[x,y]=lookup[color[:3]] if color[3] else 0
    return out


def update(source):
    frames=json.loads(re.search(r'const facilityFrames = (\{.*?\});',source,re.S)[1])
    entries={k:v for k,v in frames.items() if k not in OBJECTS and k!='expeditionOffice'}
    for i,y in enumerate((384,768,1152)):entries[f'tree{i}']=(0,y,384)
    for name,spec in [('facilitySheet',entries),('expeditionOfficeSheet',{'expeditionOffice':frames['expeditionOffice']})]:
        pattern=r"(\n"+name+r"\.src = 'data:image/png;base64,)([^']+)(')"
        match=re.search(pattern,source)
        sheet=Image.open(BytesIO(base64.b64decode(match[2])))
        for kind,(x,y,n) in spec.items():
            pad=4 if kind in ('hut','stall') else 12
            for face in range(4):
                left=x+face*n
                raw=sheet.crop((left,y,left+n,y+n))
                if sheet.mode=='P':raw.info['transparency']=0
                sheet.paste(level_ground(raw,pad),(left,y))
        stream=BytesIO()
        sheet.save(stream,'PNG',optimize=True)
        source=source[:match.start(2)]+base64.b64encode(stream.getvalue()).decode()+source[match.end(2):]
    return source


if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('game',type=Path)
    args=parser.parse_args()
    args.game.write_text(update(args.game.read_text()))
