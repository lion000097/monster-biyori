"""Rebuild the 1.25.61 town art on the ranch's 32-by-16 ground axes.

The immutable 1.25.63 release supplies the original indexed artwork. Pixel
centres and plot bounds use the same convention as projectGround in game.html.
"""
import base64
import json
import math
import re
import zlib
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageColor, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
HALF_TILE = 32
# Left, near and right ground contacts, in the four reference illustrations.
CONTACTS = {
    'aquarium': [((5,259),(158,313),(314,247)), ((5,244),(186,313),(314,257)), ((5,258),(136,314),(314,252)), ((5,250),(163,313),(314,263))],
    'artHut': [((3,103),(73,125),(124,97)), ((2,96),(56,125),(124,102)), ((2,102),(70,125),(124,96)), ((2,98),(52,125),(124,104))],
    'bakery': [((2,105),(70,125),(125,96)), ((2,98),(57,125),(125,102)), ((2,103),(69,125),(125,99)), ((2,96),(58,125),(125,104))],
    'guideOffice': [((4,108),(82,124),(122,98)), ((3,102),(46,125),(122,104)), ((5,108),(76,125),(121,100)), ((4,99),(43,125),(123,108))],
    'kitchenGarden': [((6,120),(69,154),(153,96)), ((6,101),(92,154),(153,119)), ((7,100),(94,154),(151,120)), ((7,120),(67,154),(151,100))],
    'musicHall': [((10,161),(131,187),(182,149)), ((12,148),(67,189),(179,155)), ((12,154),(123,189),(179,146)), ((8,151),(59,187),(183,161))],
    'rainPavilion': [((8,109),(78,125),(118,103)), ((13,108),(60,125),(115,106)), ((12,107),(68,125),(115,103)), ((13,104),(51,125),(116,108))],
    'restaurant': [((3,217),(129,253),(251,201)), ((3,206),(124,253),(251,205)), ((3,208),(130,254),(251,206)), ((3,203),(122,253),(251,217))],
    'starLodge': [((2,129),(109,157),(156,128)), ((2,126),(102,157),(156,130)), ((2,132),(59,158),(156,124)), ((2,129),(52,157),(156,127))],
    'theater': [((5,266),(198,314),(314,258)), ((5,258),(125,315),(314,246)), ((5,245),(196,315),(314,257)), ((5,259),(117,314),(314,266))],
    'townHall': [((2,141),(87,158),(156,123)), ((2,121),(78,158),(156,132)), ((2,132),(81,157),(156,120)), ((2,125),(71,158),(156,140))],
    'tradePost': [((2,126),(79,158),(156,120)), ((2,124),(77,157),(156,118)), ((2,118),(82,158),(156,125)), ((2,122),(77,158),(156,127))]
}
DIMENSIONS = {
    'bubblePot': (1,1), 'artHut': (2,2), 'rainPavilion': (2,2),
    'glowMushrooms': (1,1), 'townHall': (2,3), 'bakery': (2,2),
    'starLodge': (3,2), 'kitchenGarden': (2,3), 'guideOffice': (2,2),
    'musicHall': (3,3), 'tradePost': (2,3), 'aquarium': (6,4),
    'festivalPlaza': (5,5), 'theater': (6,4), 'restaurant': (4,4)
}


def reference_art():
    source = (ROOT/'releases/1.25.63/game.html').read_text()
    entries = json.loads(re.search(r'const townAtlases=(.*?);\n', source)[1])
    for name in DIMENSIONS:
        size, colors, data = entries[name]
        palette = bytes.fromhex(colors)
        strip = Image.frombytes('P', (size, size*4), zlib.decompress(base64.b64decode(data)))
        strip.putpalette(palette)
        yield name, [strip.crop((0,i*size,size,(i+1)*size)) for i in range(4)]


class Plot:
    def __init__(self, dimensions, facing, original):
        self.a, self.b = dimensions
        self.face = facing
        self.w, self.h = (self.b,self.a) if facing%2 else dimensions
        self.size = (self.w+self.h)*HALF_TILE
        self.image = Image.new('P', (self.size,self.size))
        self.palette = original.getpalette()
        self.image.putpalette(self.palette)
        self.draw = ImageDraw.Draw(self.image)
        self.rgb = list(zip(*[iter(self.palette)]*3))

    @lru_cache(maxsize=256)
    def color(self, value):
        target = ImageColor.getrgb(value)
        return min(range(1,len(self.rgb)), key=lambda i: sum((a-b)**2 for a,b in zip(self.rgb[i],target)))

    def point(self, u, v, z=0):
        x,y = [(u,v),(self.b-v,u),(self.a-u,self.b-v),(v,self.a-u)][self.face]
        return (self.h*32+(x-y)*32, self.size/2+(x+y)*16-z)

    def poly(self, points, fill, outline=None):
        pts = [(round(x),round(y)) for x,y in (self.point(*p) for p in points)]
        self.draw.polygon(pts,fill=self.color(fill),outline=self.color(outline) if outline else None)

    def line(self, points, color, width=1):
        self.draw.line([tuple(map(round,self.point(*p))) for p in points],self.color(color),width)

    def floor(self, green=False, kerb=False):
        # The outermost sample of each column belongs to a single tile.
        # Invert at pixel centres to get complementary edges on adjoining lots.
        px = self.image.load()
        for x in range(self.size):
            top = self.size/2+abs(x+.5-self.h*32)/2
            bottom = self.size-abs(x+.5-self.w*32)/2
            for y in range(math.ceil(top-.5), math.ceil(bottom-.5)):
                edge = bottom-(y+.5)
                if green:
                    tint = '#a6ac71'
                    if (x*17+y*53)%37<3:
                        tint = '#90945a'
                else:
                    if kerb and edge<1:
                        tint='#795c4c'
                    elif kerb and edge<3:
                        tint='#bd9773' if x<self.w*32 else '#a7826a'
                    else:
                        u=(x+.5-self.h*32)/64+(y+3.5-self.size/2)/32
                        v=(y+3.5-self.size/2)/32-(x+.5-self.h*32)/64
                        row=math.floor(v*3)
                        col=math.floor(u*2+row*.5)
                        fu=(u*2+row*.5)%1
                        fv=(v*3)%1
                        tint=('#d8bb99','#e1c5a1','#e7cba6','#dcbf9c')[(row*31+col*17)%4]
                        if fu<.035 or fv<.06:
                            tint='#b29a80'
                        elif fu<.065 or fv<.12:
                            tint='#f0d8b4'
                px[x,y] = self.color(tint)

    def trim_front(self):
        px = self.image.load()
        for x in range(self.size):
            y0 = math.ceil(self.size-abs(x+.5-self.w*32)/2-.5)
            for y in range(y0,self.size):
                px[x,y] = 0


def lerp(a,b,t):
    return a+(b-a)*t


class Facade:
    """Project the two visible foundation edges separately, keeping walls upright."""
    def __init__(self, plot, image, contacts):
        self.src = contacts
        self.size = plot.size
        inset = 3 if self.size<200 else 5
        self.dst = [inset, plot.w*32, self.size-inset]
        self.near = self.size
        self.lift = 4
        self.scale = 1
        # Steps, planters and flagstones may project past the wall's reference line.
        # Reserve their measured depth *inside* the property, including for the back views.
        bbox = image.getbbox()
        mask = image.load()
        available = []
        for x in range(bbox[0],bbox[2]):
            ys = [y for y in range(bbox[1],bbox[3]) if mask[x,y]]
            if not ys:
                continue
            u = self.map_x(x)
            floor = self.ground(x)
            self.lift=max(self.lift,math.ceil(ys[-1]-floor+3))
            available.append((self.near-abs(u-self.dst[1])/2, floor-ys[0]))
        inset=max(inset,1.7*(self.lift-2))
        self.dst=[inset,plot.w*32,self.size-inset]
        self.scale=min([1]+[(floor-self.lift-3)/height for floor,height in available if height>0])

    def map_x(self, x, inverse=False):
        original = [p[0] for p in self.src]
        source,target = (self.dst,original) if inverse else (original,self.dst)
        side = int(x>source[1])
        return lerp(target[side],target[side+1],(x-source[side])/(source[side+1]-source[side]))

    def ground(self,x):
        j=int(x>self.src[1][0])
        a,b=self.src[j:j+2]
        return lerp(a[1],b[1],(x-a[0])/(b[0]-a[0]))

    def point(self,x,y):
        u=self.map_x(x)
        return u,self.near-abs(u-self.dst[1])/2-self.lift+(y-self.ground(x))*self.scale

    def render(self,plot,image):
        src=image.load()
        out=plot.image.load()
        for x in range(self.size):
            u=self.map_x(x,True)
            sx=round(u)
            if not 0<=sx<self.size:
                continue
            y0=self.point(u,0)[1]
            for y in range(self.size):
                sy=round((y-y0)/self.scale)
                if 0<=sy<self.size and src[sx,sy]:
                    out[x,y]=src[sx,sy]


def project_garden(plot, image, contacts):
    # The open ground is a plane, so include the rear corner in the projection.
    left,near,right=contacts
    back=(left[0]+right[0]-near[0],left[1]+right[1]-near[1])
    margin=0
    px=plot.image.load()
    source=image.load()
    for y in range(plot.size):
        for x in range(plot.size):
            dx=(x+.5-plot.h*32)/32
            dy=(y+.5-plot.size/2)/16
            u=((dy+dx)/2-margin)/(plot.w-2*margin)
            v=((dy-dx)/2-margin)/(plot.h-2*margin)
            sx=round(back[0]+u*(near[0]-left[0])+v*(near[0]-right[0]))
            sy=round(back[1]+u*(near[1]-left[1])+v*(near[1]-right[1]))
            if 0<=sx<plot.size and 0<=sy<plot.size and source[sx,sy]:
                px[x,y]=source[sx,sy]


def make_frames(name, refs):
    from festival_plaza_art import draw_plaza
    from music_square_art import draw_music_square, cut_mushroom_turf
    frames,anchors=[],[]
    for face in range(4):
        # In the old sheets the two back views of these long structures were interchanged.
        index = [0,2,1,3][face] if name in ('aquarium','starLodge') else face
        image=refs[index]
        plot=Plot(DIMENSIONS[name],face,image)
        if name=='festivalPlaza':
            draw_plaza(plot,refs[0])
        elif name in ('bubblePot','glowMushrooms'):
            # Reuse the original four views, removing the turf around the stems.
            if name=='glowMushrooms':
                image=cut_mushroom_turf(image)
            art=image.resize((52,52),Image.Resampling.NEAREST)
            plot.image.paste(art,(6,3),art.point([0]+[255]*255, 'L'))
        elif name=='musicHall':
            draw_music_square(plot)
        else:
            plot.floor(name=='kitchenGarden')
            if name=='kitchenGarden':
                contacts=CONTACTS[name][index]
                if face>=2:
                    image=image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                    contacts=[(plot.size-1-x,y) for x,y in reversed(contacts)]
                project_garden(plot,image,contacts)
            else:
                fit=Facade(plot,image,CONTACTS[name][index])
                fit.render(plot,image)
                anchors.append((index,fit))
        plot.trim_front()
        frames.append(plot.image)
    return frames,anchors


def write_sheet(name,frames):
    size=frames[0].width
    strip=Image.new('P',(size*4,size))
    strip.putpalette(frames[0].getpalette())
    for i,frame in enumerate(frames):
        strip.paste(frame,(i*size,0))
    strip.save(ROOT/'assets/town-buildings'/f'{name}.png',transparency=0,optimize=True)


def overlay_data(ref,base,face,mode):
    from festival_plaza_art import draw_plaza
    p=Plot(DIMENSIONS['festivalPlaza'],face,ref)
    draw_plaza(p,ref,night=bool(mode&1),festival=bool(mode&2))
    p.trim_front()
    pixels=bytes(b if a!=b else 0 for a,b in zip(base.tobytes(),p.image.tobytes()))
    return base64.b64encode(zlib.compress(pixels,9)).decode()


def rebuild():
    old=(ROOT/'releases/1.25.63/game.html').read_text()
    windows=json.loads(re.search(r'const townWindowCenters=(.*?);',old,re.S)[1])
    easels=[[58,100],None,None,[110,92]]
    lamps=[[[54,224],[150,244]],[],[],[[172,244],[266,223]]]
    streams=[[.155,.62,.825],[.20,.43],[.57,.80],[.175,.38,.845]]
    data={}
    for name,refs in reference_art():
        frames,anchors=make_frames(name,refs)
        write_sheet(name,frames)
        def at(fit,p):
            return [round(k) for k in fit.point(*p)]
        if name=='starLodge':
            data['townWindowCenters']=[[at(fit,p) for p in windows[i]] for i,fit in anchors]
        elif name=='artHut':
            data['townEaselCenters']=[at(fit,easels[i]) if easels[i] else None for i,fit in anchors]
        elif name=='theater':
            data['townTheaterLamps']=[[at(fit,p) for p in lamps[i]] for i,fit in anchors]
        elif name=='aquarium':
            data['townTankStreams']=[[[*at(fit,(f*fit.size,.86*fit.size)),at(fit,(f*fit.size,.64*fit.size))[1]]
                                      for f in streams[i]] for i,fit in anchors]
        elif name=='festivalPlaza':
            data['townFestivalOverlays']=[[overlay_data(refs[0],base,f,mode) for mode in (1,2,3)]
                                         for f,base in enumerate(frames)]
    game=ROOT/'game.html'
    source=game.read_text()
    begin='// BEGIN projected town effects\n'
    end='\n// END projected town effects'
    a=source.index(begin)+len(begin)
    b=source.index(end,a)
    code='\n'.join('const '+key+'='+json.dumps(value,separators=(',',':'))+';' for key,value in sorted(data.items()))
    game.write_text(source[:a]+code+source[b:])


if __name__=='__main__':
    rebuild()
