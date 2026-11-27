"""Draw the two leisure plazas on the town's native, rotating 32 x 16 grid."""
import math
from functools import lru_cache
from random import Random

from PIL import Image, ImageColor

from align_town_plots import Plot, ROOT, write_sheet
from festival_plaza_art import block
from music_square_art import ring

ART = ROOT / 'assets/town-buildings'
WOOD = ('#ecaa66', '#be7b43', '#97623d', '#593b2b')
TEAL = ('#83aca2', '#4a8378', '#396d68', '#354e44')
BARK = ('#c48a4e', '#a06536', '#88502c', '#51301f')
COPPER = ('#f2c876', '#cb9050', '#a36339', '#71472b')
PALETTE_TONES = """
30261e 503127 69422e 825239 9c603b a67a50 bf8044 c99b6a df9b55 ecaf6b
f1c385 f9d79b ffe9b5 fff2d0 a78f72 bda384 cfaf8b deba99 e6c8a4 f0d4b0
aba783 898964 595d38 394d32 315536 506a3f 668846 788c4c 819e56 96af65
a4b66c b6c987 c5d893 6d8747 4b7b57 729b67 91b683 a6c49b 416d65
357777 5f9a90 78aba1 a4c6af 6d8fa1 5a687e 78698a 97778e b897a9
e3b7ce f8d8dd aa5553 c27668 dd9582 f6b19b f3cdb5 a89878 c8aa79
d9b982 e9d29a dfac61 e38f56 c96b41 966945 e9bf64 f9d776
719056 99ba87 b8dda0 80a13e 779549 80a85e 259193 d25851 eb9e56 79442b 94542e
""".split()


@lru_cache(maxsize=1)
def reference_palette():
    swatches = set()
    for name in ('bench211','flowerbed211','kitchenGarden','picnic257','forestSign',
                 'musicHall','rainPavilion','crystalBowl','glowMushrooms','forestArchive','stargazerScope'):
        raw = Image.open(ART / (name+'.png')).getpalette()
        swatches.update(tuple(raw[i:i+3]) for i in range(3,len(raw),3))
    choices = sorted(swatches)
    palette = [(0,0,0)]
    for value in PALETTE_TONES:
        target = ImageColor.getrgb('#'+value)
        color = min(choices,key=lambda c:sum((a-b)**2 for a,b in zip(c,target)))
        if color not in palette:
            palette.append(color)
    image = Image.new('P',(1,1))
    image.putpalette(bytes(channel for swatch in palette for channel in swatch))
    return image


def stone_path(p,u0,v0,u1,v1):
    colors=['#d6b99b','#e9cba4','#f3d9b7','#dfbd99']
    width,depth=u1-u0,v1-v0
    for k in range(5):
        v=v0+depth*k/5+.017
        for i in range(-1,3):
            a=max(u0,u0+width*(i+(k%2)/2)/2)
            b=min(u1,u0+width*(i+1+(k%2)/2)/2)
            if a>=b:
                continue
            p.poly([(a,v,0),(b,v,0),(b,v+depth/5-.033,0),(a,v+depth/5-.033,0)],colors[(i+k)%4])
            p.line([(a+.015,v,0),(b-.015,v,0)],'#f5d9b4')


@lru_cache(maxsize=24)
def cropped_sprite(name,face,width):
    src=Image.open(ART/(name+'.png')).convert('RGBA')
    n=src.height
    sprite=src.crop((face*n,0,(face+1)*n,n))
    sprite=sprite.crop(sprite.getbbox())
    return sprite.resize((width,round(sprite.height*width/sprite.width)),Image.Resampling.NEAREST)


def prop(p,u,v,name,width,turn=0):
    sprite=cropped_sprite(name,(p.face+turn)%4,width)
    x,y=map(round,p.point(u,v))
    x-=sprite.width//2
    # The source crop ends at the nearest leg or planter edge.
    y-=sprite.height-round(width*.15)
    for j in range(sprite.height):
        for i in range(sprite.width):
            r,g,b,a=sprite.getpixel((i,j))
            if a and 0<=x+i<p.size and 0<=y+j<p.size:
                p.image.putpixel((x+i,y+j),p.color('#%02x%02x%02x'%(r,g,b)))


def post(p,u,v,height,stone=False):
    if stone:
        block(p,u-.105,v-.105,u+.105,v+.105,0,4,('#dac39b','#bc9d78','#a78869','#7b6049'))
    block(p,u-.048,v-.048,u+.048,v+.048,4 if stone else 0,height-(4 if stone else 0),BARK)
    p.line([(u-.042,v-.034,5),(u-.042,v-.034,height-1)],'#e4b47c')
    for start,end in ((8,12),(14,18),(21,28)):
        p.line([(u+.048,v+.009,start),(u+.048,v+.01,end)],'#865237')
        p.line([(u-.013,v+.048,start-1),(u-.016,v+.048,end-2)],'#9f673e')
    for z in (height-5,height-3):
        block(p,u-.059,v-.059,u+.059,v+.059,z,1,COPPER)


def pergola_top(p):
    # The pair of long rails and their open rafters keep the seated guests visible.
    for v in (.25,.78):
        block(p,.17,v-.045,1.99,v+.045,33,4,WOOD)
        p.line([(.18,v+.05,34),(1.98,v+.05,34)],'#a56d43')
    for i in range(8):
        u=.21+i*.247
        block(p,u-.041,.13,u+.041,.90,37,3,TEAL)
        p.line([(u-.034,.14,40),(u-.034,.88,40)],'#adbe9a')

    # Ground-space vine clumps and hanging rose clusters turn with the timberwork.
    rng=Random(497)
    foliage=[]
    for v,count in ((.21,19),(.80,14)):
        for k in range(count):
            u=.19+1.80*k/(count-1)
            foliage.append((u,v+rng.uniform(-.06,.06),39+rng.randint(-1,1),rng.random()))
    for u in (.27,.51,1.49,1.74):
        for k in range(4):
            foliage.append((u+rng.uniform(-.05,.05),.30+.12*k,40,rng.random()))
    for u,v,z,seed in sorted(foliage,key=lambda o:p.point(*o[:2])[1]):
        x,y=map(round,p.point(u,v,z))
        for dx,dy,c,w in [(0,1,'#385839',4),(-1,0,'#557a47',4),(-2,-1,'#88a85e',3),
                            (-2,-2,'#aac98b',2),(3,0,'#688c4b',2)]:
            p.draw.line((x+dx-w//2,y+dy,x+dx+w//2,y+dy),p.color(c),2)
        if seed<.40:
            p.draw.line((x-2,y+2,x+2,y+2),p.color('#b97989'),2)
            p.draw.line((x-1,y+1,x+1,y+1),p.color('#f5becb'))
            for dx,dy,c in [(0,2,'#976b76'),(-1,2,'#e8b4bd'),(1,4,'#bb8597'),
                            (0,5,'#eab8c8'),(0,7,'#a67988')]:
                p.draw.line((x+dx,y+dy,x+dx+1,y+dy),p.color(c))


def satchel(p,u,v):
    block(p,u-.14,v-.10,u+.13,v+.10,0,8,BARK)
    block(p,u-.14,v-.115,u+.13,v+.115,7,3,WOOD)
    for a in (-.087,.080):
        p.line([(u+a,v+.119,2),(u+a,v+.119,10),(u+a,v-.11,10)],'#634933',2)
        p.line([(u+a-.012,v+.119,4),(u+a+.022,v+.119,4)],'#efd091',2)
    block(p,u-.17,v-.10,u+.16,v+.06,10,4,TEAL)
    for a in (-.1,.1):
        p.line([(u+a,v+.06,10),(u+a,v+.06,14),(u+a,v-.09,14)],'#efd19b',2)


def compass(p,u,v):
    for r,c in [(.47,'#ac9774'),(.445,'#f4dba3'),(.40,'#6a8d83'),(.36,'#b8c4a0'),(.32,'#d1bb91')]:
        ring(p,u,v,r,r,c)
    for j in range(8):
        a=math.pi*j/4-math.pi/2
        reach=.30 if j%2==0 else .21
        left=(u+.083*math.cos(a-.9),v+.083*math.sin(a-.9),0)
        right=(u+.083*math.cos(a+.9),v+.083*math.sin(a+.9),0)
        tip=(u+reach*math.cos(a),v+reach*math.sin(a),0)
        p.poly([(u,v,0),left,tip],'#745c45')
        p.poly([(u,v,0),tip,right],'#ffdf9a')
    ring(p,u,v,.06,.06,'#b47e45')


def rest_area(p):
    p.floor()
    for a in (.085,2.915):
        p.line([(a,.085,0),(a,2.915,0)],'#b59671')
        p.line([(.085,a,0),(2.915,a,0)],'#b59671')
    stone_path(p,1.08,1.9,1.92,2.94)
    compass(p,1.39,1.81)
    # Beds and flowers live outside the routes between the entrance and benches.
    for u,v,w,h in [(.12,.105,1.90,.30),(.10,1.37,.31,1.13),(2.62,.4,.29,1.84)]:
        p.poly([(u,v,0),(u+w,v,0),(u+w,v+h,0),(u,v+h,0)],'#aec18a','#8b9770')
    objects=[]
    def add(u,v,fn,*args):
        objects.append((p.point(u,v)[1],fn,args))
    for u in (.29,1.87):
        for v in (.25,.77):
            add(u,v,post,p,u,v,34,True)
    add(1.10,.53,prop,p,1.10,.53,'bench211',50)
    add(2.54,1.73,prop,p,2.54,1.73,'bench211',50,1)
    add(.46,2.46,prop,p,.46,2.46,'flowerbed211',32)
    add(2.49,2.56,prop,p,2.49,2.56,'flowerbed211',30,1)
    add(2.57,.52,prop,p,2.57,.52,'flowerbed211',25,2)
    add(.40,1.43,satchel,p,.40,1.43)
    add(.33,1.80,prop,p,.33,1.80,'forestSign',16,0)
    for _,fn,args in sorted(objects,key=lambda row:row[0]):
        fn(*args)
    pergola_top(p)


def grass(p):
    p.floor(green=True)
    px=p.image.load()
    tones=['#a1b276','#a3b979','#9caf69','#9bb271']
    for y in range(p.size//2,p.size):
        for x in range(p.size):
            if not px[x,y]:
                continue
            dx=(x+.5-p.h*32)/64
            dy=(y+.5-p.size/2)/32
            xx,yy=dy+dx,dy-dx
            u,v=[(xx,yy),(yy,4-xx),(4-xx,4-yy),(4-yy,xx)][p.face]
            tone=tones[(int(u*3)//2+int(v*4)//3)%4]
            if min(u,v,4-u,4-v)<.035:
                tone='#87985d'
            px[x,y]=p.color(tone)


def on_course(u,v):
    return math.hypot((u-2)/1.28,(v-2.08)/1.16)


def paw(p,u,v):
    # One pad and four toes, cut flush into the turf.
    def mark(x,y,a,b):
        ring(p,u+x,v+y,a+.025,b+.025,'#82975c')
        ring(p,u+x,v+y,a,b,'#d7c084')
        ring(p,u+x-.014,v+y-.015,a*.78,b*.78,'#edd59b')
    mark(0,.05,.30,.21)
    for x,y,a,b in [(-.34,-.19,.10,.14),(-.13,-.37,.11,.145),
                    (.13,-.37,.11,.145),(.34,-.19,.10,.14)]:
        mark(x,y,a,b)


def chase_floor(p):
    grass(p)
    for ru,rv,c in [(1.57,1.43,'#8f965b'),(1.535,1.395,'#e2bb83'),(1.46,1.32,'#d8a76e'),
                    (1.42,1.28,'#e4ba84'),(1.09,.97,'#eac98f'),(1.035,.915,'#8b9c5c'),
                    (1.005,.885,'#aabe76')]:
        ring(p,2,2.08,ru,rv,c)
    rng=Random(792)
    for _ in range(710):
        u,v=rng.uniform(.065,3.935),rng.uniform(.065,3.935)
        r=on_course(u,v)
        x,y=map(round,p.point(u,v))
        if .85<r<1.17:
            if rng.random()<.7:
                p.draw.point((x,y),p.color(rng.choice(['#d5ad7e','#f0c992','#bc996c'])))
        elif r>1.26 or r<.73:
            color=rng.choice(['#8da368','#91a66a','#bfd294','#a4b97f'])
            p.draw.line((x,y,x+1,y),p.color(color))
            if rng.random()<.19:
                p.draw.line((x-1,y-1,x,y),p.color('#849956'))
                p.draw.line((x,y,x+2,y-1),p.color('#91aa63'))
                p.draw.point((x+2,y-2),p.color('#b4c78a'))
            if r>1.34 and rng.random()<.035:
                p.draw.line((x-1,y-1,x+1,y-2),p.color('#f9dfb1'))
                p.draw.point((x,y-3),p.color('#e6b56e'))
    for a in (0,math.pi/2,math.pi,math.pi*1.5):
        for step in (-.08,0,.08):
            angle=a+step
            p.line([(2+1.39*math.cos(angle),2.08+1.27*math.sin(angle),0),
                    (2+1.46*math.cos(angle),2.08+1.34*math.sin(angle),0)],'#fce8af')
    stone_path(p,1.61,3.45,2.39,3.995)
    paw(p,2,2.16)


def play_log(p,u,v):
    # Bark wraps a hollow log. Cut end rings follow the actual rotated end planes.
    radius=.26
    def rim(end,rad=1):
        return [(u+end,v+radius*rad*math.cos(i*math.tau/16),
                 9+9*rad*math.sin(i*math.tau/16)) for i in range(16)]
    sides=[rim(-.48),rim(.48)]
    colors=['#9e6538','#b57b47','#c78c50','#dcaa69','#d09a59','#be8149',
            '#bc8146','#9f683e','#8e5932','#835233','#745035','#644329',
            '#704426','#805330','#965d32','#9e6033']
    near=.48 if p.point(u+.48,v)[1]>p.point(u-.48,v)[1] else -.48
    def end_cap(end):
        for rad,color in [(1,'#63432b'),(.93,'#e3af6c'),(.83,'#efc583'),(.73,'#9b672f'),
                          (.66,'#7d4b2b'),(.57,'#553928'),(.48,'#3a3021')]:
            p.poly(rim(end,rad),color)
        for i in (1,4,12):
            p.line([rim(end,.98)[i],rim(end,.80)[i]],'#9e6d3d')
    end_cap(-near)
    order=sorted(range(16),key=lambda i:p.point(sides[0][i][0],sides[0][i][1])[1]+.6*sides[0][i][2])
    for i in order:
        j=(i+1)%16
        poly=[sides[0][i],sides[1][i],sides[1][j],sides[0][j]]
        p.poly(poly,colors[i])
        angle=(i+.35)*math.tau/16
        def along(dist,offset=0):
            a=angle+offset
            return u+dist,v+radius*math.cos(a),9+9*math.sin(a)
        for start,end in [(-.43,-.30+(i%5)*.055),(.14-(i%3)*.12,.41)]:
            p.line([along(start,.02),along((start+end)/2,-.05),along(end)],'#99643a')
            p.line([along(start+.035,.12),along((start+end)/2,.13)],'#dca46a')
    end_cap(near)
    # Ragged broken twig and a strip of dark moss on the upper face.
    block(p,u-.12,v-.105,u-.015,v-.03,17,4,BARK)
    for t in range(12):
        x,y=map(round,p.point(u-.40+t*.066,v+.018*math.sin(t),19))
        p.draw.line((x-2,y,x+2,y),p.color('#647a43'),2)
        p.draw.line((x-2,y-1,x+1,y-1),p.color('#88a557'))
        if t%3==1:
            p.draw.point((x-1,y-2),p.color('#bfd187'))


def stepping_log(p,u,v,height):
    sides=12
    def edge(scale,z):
        return [(u+.13*scale*math.cos(i*math.tau/sides),v+.13*scale*math.sin(i*math.tau/sides),z) for i in range(sides)]
    bottom,top=edge(1,0),edge(.94,height)
    for i in sorted(range(sides),key=lambda k:p.point(*bottom[k])[1]):
        j=(i+1)%sides
        p.poly([bottom[i],bottom[j],top[j],top[i]],['#91603b','#875835','#ae7745'][i%3])
    for r,c in [(1,'#704b32'),(.83,'#e6b273'),(.59,'#c18c58'),(.42,'#eac084')]:
        p.poly(edge(r,height),c)


def ball(p,u,v,scale=1):
    x,y=map(round,p.point(u,v))
    rr=round(8*scale)
    p.draw.ellipse((x-rr,y-2*rr,x+rr,y),fill=p.color('#df9c6b'),outline=p.color('#754e3a'))
    p.draw.pieslice((x-rr+1,y-2*rr+1,x+rr-1,y-1),160,245,fill=p.color('#d25851'))
    p.draw.pieslice((x-rr+1,y-2*rr+1,x+rr-1,y-1),45,115,fill=p.color('#259193'))
    p.draw.arc((x-rr+1,y-2*rr+1,x+rr-1,y-1),20,155,fill=p.color('#b77a4c'))
    p.draw.line((x-rr//2,y-rr-rr//2,x-rr//2+3,y-rr-rr//2-1),p.color('#fff0c8'),2)


def pennant_line(p):
    def coord(t):
        return (.61+2.44*t,.34,34-8*math.sin(t*math.pi))
    p.line([coord(i/20) for i in range(21)],'#644732',2)
    p.line([(u,v,z+1) for u,v,z in (coord(i/20) for i in range(21))],'#d8ad73')
    for i in range(7):
        t=(i+.55)/7
        a,b=coord(t-.055),coord(t+.055)
        u,v,z=coord(t)
        color=['#d25851','#259193','#ecad56','#80a13e'][i%4]
        p.poly([a,b,(u+.019,v,z-9)],color,'#795c45')
        p.line([a,b],'#f6d598')
        p.line([(a[0]+.045,v,a[2]-2),(u+.016,v,z-6)],'#f0be7d')
    for u in (.61,3.05):
        x,y=map(round,p.point(u,.34,35))
        p.draw.ellipse((x-2,y-3,x+2,y+1),fill=p.color('#e8b969'),outline=p.color('#956537'))


def seesaw(p,u,v):
    block(p,u-.21,v-.15,u+.21,v+.15,0,3,TEAL)
    p.poly([(u+.19,v-.15,3),(u+.19,v,12),(u+.19,v+.15,3)],'#b77742','#66452f')
    p.poly([(u-.19,v-.15,3),(u-.19,v,12),(u-.19,v+.15,3)],'#d39550','#66452f')
    def pos(x,t,z=0):
        return u+x,v+t,10-8*t+z
    for x in (-.12,.12):
        p.poly([pos(x,-.63),pos(x,.63),pos(x,.63,3),pos(x,-.63,3)],'#815433','#634329')
    p.poly([pos(-.12,-.63,3),pos(.12,-.63,3),pos(.12,.63,3),pos(-.12,.63,3)],'#dea266','#6e4931')
    for t,sgn,color in ((-.62,1,'#257d78'),(.62,-1,'#cb6550')):
        p.poly([pos(-.10,t,3),pos(.10,t,3),pos(.10,t+sgn*.19,3),pos(-.10,t+sgn*.19,3)],color)
        t+=sgn*.25
        for x in (-.08,.08):
            p.line([pos(x,t,3),pos(x,t,8)],'#594537',2)
        p.line([pos(-.08,t,8),pos(.08,t,8)],'#e4ba78',2)
    p.line([pos(-.09,-.20,3),pos(-.09,.25,3)],'#f7ca8b')


def play_area(p):
    chase_floor(p)
    objects=[]
    def add(u,v,fn,*args):
        objects.append((p.point(u,v)[1],fn,args))
    for u,v in ((.61,.34),(3.05,.34)):
        add(u,v,post,p,u,v,34,True)
    add(1.83,.34,pennant_line,p)
    add(.80,.86,play_log,p,.80,.86)
    add(3.67,1.42,seesaw,p,3.67,1.42)
    for u,v,h in [(3.69,2.81,7),(3.60,3.10,10),(3.39,3.40,7)]:
        add(u,v,stepping_log,p,u,v,h)
    add(.39,2.99,ball,p,.39,2.99,.9)
    add(.54,3.17,ball,p,.54,3.17,.65)
    for u,v,n,t in ((.32,3.64,26,0),(3.55,.52,24,2),(3.60,3.68,22,1),(.26,1.84,19,3)):
        add(u,v,prop,p,u,v,'flowerbed211',n,t)
    for _,fn,args in sorted(objects,key=lambda row:row[0]):
        fn(*args)


if __name__=='__main__':
    for name,size,draw in [('travelerRestPlaza',3,rest_area),('monsterPlayPlaza',4,play_area)]:
        frames=[]
        for facing in range(4):
            plot=Plot((size,size),facing,reference_palette())
            draw(plot)
            plot.trim_front()
            frames.append(plot.image)
        write_sheet(name,frames)
