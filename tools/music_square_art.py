"""Draw the roofless music square on the same rotating ground plan as the festival."""
from functools import lru_cache
from math import cos, pi, sin
from pathlib import Path

from PIL import Image, ImageFilter
from festival_plaza_art import block

DETAILS = Path(__file__).resolve().parents[1]/'assets/town-details'
WOOD = ('#daa364','#ad7347','#8a5841','#66483b')
TEAL = ('#689e92','#3e7b76','#35706a','#375956')
GOLD = '#bd9252'


def ring(p, u, v, ru, rv, color, z=0, line=None):
    points=[(u+ru*cos(i*pi/24),v+rv*sin(i*pi/24),z) for i in range(48)]
    p.poly(points,color,line)


def paving(p):
    p.floor()
    # A single plane across the road-facing edge, including the open entrance.
    for a in (.07,2.93):
        p.line([(a,.08,0),(a,2.92,0)],'#bb9d77')
        p.line([(.08,a,0),(2.92,a,0)],'#bb9d77')
    for radius,color in [(1.03,'#b09772'),(.98,'#f0d3a3'),(.92,'#58877c'),
                         (.85,'#b3c3a4'),(.80,'#d9c7a5')]:
        ring(p,1.50,1.57,radius,radius,color)
    for i in range(24):
        a=i*pi/12
        p.line([(1.50+.86*cos(a),1.57+.86*sin(a),0),
                (1.50+.92*cos(a),1.57+.92*sin(a),0)],'#efd094')
    # Inlaid pair of notes. Both the stems and noteheads lie in the paving.
    for u,v in [(1.29,1.80),(1.79,1.67)]:
        ring(p,u-.10,v,.145,.106,'#917451')
        ring(p,u-.11,v-.018,.10,.06,'#c39b63')
    p.poly([(1.29,1.80,0),(1.36,1.80,0),(1.36,1.24,0),(1.79,1.12,0),
            (1.79,1.67,0),(1.86,1.67,0),(1.86,.96,0),(1.29,1.12,0)],'#876d50')
    p.line([(1.31,1.14,0),(1.83,1.00,0)],'#f4d89b')


def seat(p,u,v):
    for yy in (v+.07,v+.62):
        block(p,u+.03,yy,u+.18,yy+.09,0,4,TEAL)
    for i in range(3):
        block(p,u+i*.083,v,u+(i+1)*.083,v+.77,4,2,WOOD)
        p.line([(u+i*.083+.023,v+.03,6),(u+i*.083+.023,v+.74,6)],'#edc48a')


def pot(p,u,v):
    block(p,u-.11,v-.11,u+.11,v+.11,0,4,('#dca573','#ba7756','#996046','#785646'))
    block(p,u-.14,v-.14,u+.14,v+.14,4,2,('#e6b784','#bb805f','#a2684f','#785646'))
    x,y=map(round,p.point(u,v,6))
    for dx,dy in [(-4,1),(3,1),(0,0),(-2,-2),(4,-2),(-1,-3)]:
        p.draw.ellipse((x+dx-3,y+dy-3,x+dx+2,y+dy+1),fill=p.color('#517753'))
        p.draw.point((x+dx-1,y+dy-3),fill=p.color('#93aa68'))
    for dx,dy,col in [(-4,-2,'#e9ad8f'),(2,0,'#ffdfad'),(0,-5,'#ce8a81'),(5,-3,'#f2cf9a')]:
        p.draw.rectangle((x+dx-1,y+dy-1,x+dx+1,y+dy),fill=p.color(col))
        p.draw.point((x+dx,y+dy-1),fill=p.color('#ffdeac'))


def lamp(p,u,v):
    block(p,u-.10,v-.10,u+.10,v+.10,0,4,TEAL)
    block(p,u-.034,v-.034,u+.034,v+.034,4,30,WOOD)
    x,y=map(round,p.point(u,v,35))
    draw=p.draw
    draw.polygon([(x-4,y),(x+4,y),(x+3,y+7),(x,y+9),(x-3,y+7)],p.color('#735641'))
    draw.rectangle((x-2,y+1,x+2,y+6),p.color('#f5cb7d'))
    draw.line((x-1,y+2,x-1,y+5),p.color('#fff0b3'))
    draw.polygon([(x-5,y),(x-3,y-3),(x-1,y-4),(x,y-6),(x+2,y-4),(x+4,y-2),(x+5,y)],p.color('#3f6b61'))
    draw.line((x-3,y-2,x,y-4),p.color('#9db29a'))


@lru_cache(maxsize=1)
def harps():
    sheet=Image.open(DETAILS/'concert-harp.png').convert('RGBA')
    n=sheet.height
    return [sheet.crop((i*n,0,(i+1)*n,n)) for i in range(4)]


def harp(p,u,v):
    art=harps()[p.face]
    x,y=map(round,p.point(u,v,0))
    x-=art.width//2
    y-=art.height-1
    for j in range(art.height):
        for i in range(art.width):
            r,g,b,alpha=art.getpixel((i,j))
            if alpha:
                p.draw.point((x+i,y+j),p.color('#%02x%02x%02x'%(r,g,b)))


def music_stand(p,u,v):
    x,y=map(round,p.point(u,v,0))
    for dx,dy in [(-3,1),(3,1),(0,-2)]:
        p.draw.line((x,y-2,x+dx,y+dy),p.color('#665344'))
    p.draw.line((x,y-1,x,y-12),p.color('#796447'),2)
    block(p,u-.12,v-.065,u+.12,v+.065,12,2,WOOD)
    p.poly([(u-.13,v+.05,14),(u+.13,v+.05,14),(u+.13,v-.05,17),(u-.13,v-.05,17)],'#f3ddaf','#957653')
    p.line([(u,v+.05,14),(u,v-.05,17)],'#a38b66')


def draw_music_square(p):
    paving(p)
    # Only the performers stand on the low wooden platform. Audience and
    # paths share the plaza's paved floor and enter through the open front.
    block(p,.48,.13,2.5,.79,0,3,WOOD)
    for i in range(8):
        u=.5+i*.25
        p.line([(u,.16,3),(u,.76,3)],'#b58051')
        p.line([(u+.034,.18,3),(u+.034,.74,3)],'#e6b982')
    objects=[(lamp,.22,.23),(lamp,2.78,.23),(seat,.21,1.23),(seat,2.53,1.23),
             (pot,.27,2.48),(pot,2.73,2.48),(harp,.85,.46),(music_stand,1.91,.47)]
    for fn,u,v in sorted(objects,key=lambda entry:p.point(entry[1],entry[2])[1]):
        fn(p,u,v)


def cut_mushroom_turf(image):
    # These colours are the turf on the source sheet. Cap and stem silhouettes
    # share their dark outline with the turf, so retain outlines next to flesh.
    moss={9,12,13,19,21,26,28}
    contour={6,7,8,14,15,16,18}
    source=image.load()
    core=Image.new('L',image.size)
    core.putdata([255 if i and i not in moss|contour else 0 for i in image.tobytes()])
    body=core.filter(ImageFilter.MaxFilter(3)).load()
    near=core.filter(ImageFilter.MaxFilter(5)).load()
    out=image.copy()
    pixels=out.load()
    for y in range(28,image.height):
        for x in range(image.width):
            c=source[x,y]
            if c in moss:
                pixels[x,y]=16 if body[x,y] and y>38 and not core.getpixel((x,y)) else 0
            elif c in contour and not near[x,y]:
                pixels[x,y]=0
    return out
