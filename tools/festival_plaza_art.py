"""Draw the festival square from one 5x5 plan, including its four event views."""
import math
from random import Random


def textured_panel(p, image, target, source):
    """Map the reference pixels into a world-space plane without filtering."""
    a,b,c,d=[p.point(*v) for v in target]
    dx,dy=b[0]-a[0],b[1]-a[1]
    ex,ey=d[0]-a[0],d[1]-a[1]
    det=dx*ey-dy*ex
    if abs(det)<.01:
        return
    dst,src=p.image.load(),image.load()
    for y in range(max(0,math.floor(min(a[1],b[1],c[1],d[1]))),min(p.size,math.ceil(max(a[1],b[1],c[1],d[1])))):
        for x in range(max(0,math.floor(min(a[0],b[0],c[0],d[0]))),min(p.size,math.ceil(max(a[0],b[0],c[0],d[0])))):
            u=((x+.5-a[0])*ey-(y+.5-a[1])*ex)/det
            v=(dx*(y+.5-a[1])-dy*(x+.5-a[0]))/det
            if 0<=u<=1 and 0<=v<=1:
                weights=((1-u)*(1-v),u*(1-v),u*v,(1-u)*v)
                sx,sy=(round(sum(w*q[i] for w,q in zip(weights,source))) for i in range(2))
                color=src[sx,sy]
                if color:
                    dst[x,y]=color


def pavement(p,reference):
    p.floor(kerb=True)
    # All masonry, including the centre mosaic, turns with the property.
    rng=Random(2564)
    p.poly([(0,0,3),(5,0,3),(5,5,3),(0,5,3)],'#b79472')
    colors=['#e4bd8e','#eac79c','#f4d3a6','#ebc397','#dcb689','#edd1ab']
    for row in range(16):
        width=5/15
        for col in range(-1,15):
            left=max(.015,(col+(row%2)/2)*width+.014)
            right=min(4.985,(col+1+(row%2)/2)*width-.012)
            if left>=right:
                continue
            top,bottom=row*5/16+.016,(row+1)*5/16-.015
            bevel=.04+rng.random()*.035
            corners=[(left+bevel,top),(right-bevel,top),(right,top+bevel),
                     (right,bottom-bevel),(right-bevel,bottom),(left+bevel,bottom),
                     (left,bottom-bevel),(left,top+bevel)]
            p.poly([(u,v,3) for u,v in corners],rng.choice(colors))
            p.line([(left,top+bevel,3),(left+bevel,top,3),(right-.08,top,3)],'#f4d6ad')
    # A straight run of lighter setts crosses the centre of the open side.
    for i in range(5):
        y=3.55+i*.29
        p.poly([(1.99,y,3),(3.01,y,3),(3.01,min(5,y+.27),3),(1.99,min(5,y+.27),3)],'#f6d9aa')
        p.line([(2.02,y,3),(2.96,y,3)],'#e4bb89')
    for u in [1.98,3.02]:
        p.line([(u,3.55,3),(u,5,3)],'#b8926c')
    # Recover the original paw and its stone inlay as a ground-plane texture.
    # The circular boundary is in plot units and rotates around the same centre.
    cx,cy,radius=2.5,2.52,1.07
    surface=[(cx-radius,cy-radius,3),(cx+radius,cy-radius,3),
             (cx+radius,cy+radius,3),(cx-radius,cy+radius,3)]
    old=p.image.copy()
    textured_panel(p,reference,surface,[(159,199),(231,240),(159,281),(87,240)])
    center=p.point(cx,cy,3)
    for y in range(max(0,int(center[1]-39)),min(p.size,int(center[1]+40))):
        for x in range(max(0,int(center[0]-73)),min(p.size,int(center[0]+74))):
            du=(x+.5-center[0])/64+(y+.5-center[1])/32
            dv=-(x+.5-center[0])/64+(y+.5-center[1])/32
            if du*du+dv*dv>radius**2:
                p.image.putpixel((x,y),old.getpixel((x,y)))


def block(p,a,b,c,d,z,height,colors):
    corners=[(a,b),(c,b),(c,d),(a,d)]
    edges=list(zip(corners,corners[1:]+corners[:1]))
    for (u,v),(x,y) in sorted(edges,key=lambda e:sum(p.point(*q)[1] for q in e)):
        poly=[(u,v,z),(x,y,z),(x,y,z+height),(u,v,z+height)]
        # Screen-left and screen-right sides have different reflected light.
        slope=(p.point(x,y)[1]-p.point(u,v)[1])*(p.point(x,y)[0]-p.point(u,v)[0])
        p.poly(poly,colors[1 if slope>0 else 2],colors[3])
    p.poly([(u,v,z+height) for u,v in corners],colors[0],colors[3])


STONE=('#f4d6aa','#c6a180','#ab846a','#977453')
TIMBER=('#e1a65f','#b87b42','#966039','#714933')


def bulb(p,u,v,z,reference,night=False,red=True,r=7):
    x,y=map(round,p.point(u,v,z))
    paint=p.draw
    # Original paper lantern, including its one-pixel outline and ribs.
    ox=137 if red else 181
    for dy in range(-r-2,r+4):
        for dx in range(-r-1,r+2):
            if (dx/(r+.3))**2+((dy+.3)/(r+1.2))**2>1:
                continue
            i=reference.getpixel((round(ox+dx*1.30),round(114+dy*1.26)))
            if i:
                if night:
                    cr,cg,cb=p.rgb[i]
                    i=p.color('#fff2af') if cr>222 and cg>136 else p.color('#ffc66a') if cr>172 and cg>79 else i
                paint.point((x+dx,y+dy),i)
    paint.rectangle((x-2,y-r-2,x+2,y-r-1),fill=p.color('#956842'))
    paint.rectangle((x-2,y+r+1,x+2,y+r+2),fill=p.color('#80563b'))


def post(p,u,v,tall,gate=False):
    block(p,u-.115,v-.115,u+.115,v+.115,3,5,STONE)
    block(p,u-.05,v-.05,u+.05,v+.05,8,tall-8,TIMBER)
    x,y=map(round,p.point(u,v,tall))
    p.draw.ellipse((x-4,y-5,x+4,y+3),fill=p.color('#c98b49'),outline=p.color('#7f5433'))
    p.draw.rectangle((x-1,y-3,x+1,y-2),fill=p.color('#f8cd77'))
    if gate:
        side=-1 if u<2.5 else 1
        outer=u+side*.56
        p.line([(u,v,tall-4),(outer,v,tall-4)],'#764c35',3)
        p.line([(u,v,tall-5),(outer,v,tall-5)],'#d59b59')
        left,right=u+side*.08,outer-side*.025
        p.poly([(left,v,tall-5),(right,v,tall-5),(right,v,tall-19),(left,v,tall-22)],'#b95b44','#7e4c38')
        p.line([(left,v,tall-8),(right,v,tall-8)],'#eca967')
        # Gold paw, embroidered into each gate banner.
        mid=(left+right)/2
        x,y=map(round,p.point(mid,v,tall-13))
        p.draw.ellipse((x-2,y,x+2,y+2),fill=p.color('#ffe0a6'))
        for dx,dy in [(-3,-1),(-1,-3),(2,-2)]:
            p.draw.point((x+dx,y+dy),fill=p.color('#ffe6b3'))


def stall(p,origin,turn,yellow,reference):
    length,depth=1.61,.83
    def coord(x,y,z):
        if turn:
            return origin[0]+y,origin[1]-x,z
        return origin[0]+x,origin[1]+y,z
    def poly(vertices,color,edge=None):
        p.poly([coord(*q) for q in vertices],color,edge)
    def line(vertices,color,n=1):
        p.line([coord(*q) for q in vertices],color,n)
    colors=['#f4c466','#d7903e','#ffe6a0'] if yellow else ['#db7957','#b95644','#f8b18b']
    # Sort the four elevations, then the canopy. The shop signs live on
    # the counter face, and disappear naturally in the two rear views.
    sides=[((0,depth),(length,depth),'counter'),((length,0),(0,0),'back'),
           ((0,0),(0,depth),'side'),((length,depth),(length,0),'side')]
    for a,b,kind in sorted(sides,key=lambda wall:sum(p.point(*coord(*q,0))[1] for q in wall[:2])):
        def pos(t,z):
            return a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,z
        def panel(lo,hi,bot,top,color,edge=None):
            poly([pos(lo,bot),pos(hi,bot),pos(hi,top),pos(lo,top)],color,edge)
        if kind=='counter':
            panel(0,1,5,35,'#925d3e','#6e4935')
            panel(.06,.94,17,32,'#b77c45')
            shutter=[pos(.06,32),pos(.94,32),pos(.94,17),pos(.06,17)]
            textured_panel(p,reference,[coord(*q) for q in shutter],[(81,178),(119,163),(119,178),(81,194)])
            for j in range(18,33,5):
                line([pos(.07,j),pos(.93,j)],'#9d6b46')
            panel(0,1,5,15,'#f4c991','#744a32')
            panel(.05,.95,8,14,'#ffe0ab')
            sign=[pos(.04,15),pos(.96,15),pos(.96,5),pos(.04,5)]
            textured_panel(p,reference,[coord(*q) for q in sign],[(80,201),(120,184),(120,192),(80,210)])
            center=pos(.50,11)
            x,y=map(round,p.point(*coord(*center)))
            p.draw.ellipse((x-3,y-1,x+2,y+2),fill=p.color('#9a5837'))
            for dx,dy in [(-4,-3),(-1,-4),(2,-4),(4,-2)]:
                p.draw.point((x+dx,y+dy),fill=p.color('#9a5837'))
            panel(-.04,1.04,15,18,'#d79b58','#7f5137')
            line([pos(-.03,18),pos(1.03,18)],'#f9c881')
        else:
            panel(0,1,4,36,'#bc844c' if kind=='side' else '#aa7346','#704a35')
            for j in range(1,8):
                t=j/8
                line([pos(t,6),pos(t,34)],'#996540')
                line([pos(t+.013,9+(j%3)*2),pos(t+.013,29)],'#c9945b')
            for z in [8,25]:
                panel(0,1,z,z+2,'#ca9559','#8d603b')
            if kind=='back':
                line([pos(.1,10),pos(.85,28)],'#96613d',3)
                line([pos(.1,11),pos(.85,29)],'#d09b60')
        for t in [0,1]:
            line([pos(t,5),pos(t,36)],'#754c36',4)
            line([pos(t,6),pos(t,36)],'#dda263',2)
    # Referenced fabric colours and the original fine weave are sampled in
    # panel space, so the canopy stripes turn with the stall in every view.
    x0,x1=-.11,length+.11
    for i in range(8):
        lo=x0+(x1-x0)*i/8; hi=x0+(x1-x0)*(i+1)/8
        c=colors[i%2]
        poly([(lo,-.09,44),(hi,-.09,44),(hi,.28,47),(lo,.28,47)],c,'#a26c42' if i==0 else None)
        poly([(lo,.28,47),(hi,.28,47),(hi,depth+.15,35),(lo,depth+.15,35)],c)
        line([(lo,.29,47),(lo,depth+.14,35)],colors[2])
        mid=(lo+hi)/2
        poly([(lo,depth+.15,35),(hi,depth+.15,35),(hi,depth+.15,32),(mid,depth+.15,29),(lo,depth+.15,32)],'#ffe2ab','#b8875b')
    # The ridgeline and the scalloped edge are square to the occupied tiles.
    corners=[(x0,.28,47),(x1,.28,47),(x1,depth+.15,35),(x0,depth+.15,35)]
    fabric=([(199,136),(244,153),(235,165),(192,149)] if yellow else
            [(68,150),(115,135),(129,147),(82,164)])
    textured_panel(p,reference,[coord(*q) for q in corners],fabric)
    line([(x0,-.09,44),(x1,-.09,44)],'#895c40',2)
    line([(x0,.28,47),(x1,.28,47)],'#f3c782',2)
    for x in (x0,x1):
        line([(x,-.09,44),(x,.28,47),(x,depth+.15,35)],'#805338',2)


def draw_plaza(p,reference,night=False,festival=False):
    pavement(p,reference)
    queue=[]
    def enqueue(u,v,fn,*args):
        queue.append((p.point(u,v)[1],fn,args))
    for side in range(4):
        for j in range(15):
            if side==0 and 6<=j<=8:
                continue
            lo,hi=j/3+.012,(j+1)/3-.012
            bounds=[(lo,4.50,hi,4.65),(.02,lo,.17,hi),(lo,.02,hi,.17),(4.83,lo,4.98,hi)][side]
            a,b,c,d=bounds
            enqueue((a+c)/2,(b+d)/2,block,p,a,b,c,d,3,5,STONE)
    enqueue(.68,1.86,stall,p,(.24,2.60),True,False,reference)
    enqueue(3.18,.69,stall,p,(2.42,.25),False,True,reference)
    for u,v in [(.45,2.97),(1.03,2.71),(4.32,.83),(4.23,1.20)]:
        enqueue(u,v,block,p,u-.14,v-.14,u+.14,v+.14,3,9,TIMBER)
    poles=[(.19,3.98,48),(.19,2.18,61),(.19,.19,80),(2.30,.19,61),(4.78,.19,48)]
    for u,v,z in poles:
        enqueue(u,v,post,p,u,v,z)
    for i,(a,b) in enumerate(zip(poles,poles[1:])):
        def string(a=a,b=b,i=i):
            def at(t):
                return (a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,
                        a[2]+(b[2]-a[2])*t-2-7*math.sin(t*math.pi))
            points=[at(j/12) for j in range(13)]
            p.line(points,'#70503b',2)
            p.line([(u,v,z+1) for u,v,z in points],'#d9a16d')
            if festival:
                for j in [2,4,8,10]:
                    u,v,z=at(j/12)
                    p.poly([at((j-.65)/12),at((j+.65)/12),(u,v,z-6)],
                           ['#cc6c55','#e6bc65','#76a298'][(i+j)%3],'#96684d')
            u,v,z=at(.5)
            p.line([(u,v,z),(u,v,z-3)],'#76503b')
            bulb(p,u,v,z-10,reference,night,i%2==0)
        enqueue((a[0]+b[0])/2,(a[1]+b[1])/2,string)
    for u in (1.88,3.12):
        enqueue(u,4.57,post,p,u,4.57,36,True)
    for _,fn,args in sorted(queue,key=lambda item:item[0]):
        fn(*args)
