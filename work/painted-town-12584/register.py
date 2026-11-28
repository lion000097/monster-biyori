"""Register a four-view painting to the same ground vertices used by projectGround."""
from pathlib import Path
import argparse
import json
import numpy as np
from PIL import Image

TYPES = ('breadShelf','catLedge','breadMarket','maskStall','musicMaker','shoeRepair',
         'umbrellaHut','starTerrace','jarHut','guild212','teaRoom','eggWatch','toyRepair',
         'stoneStudy','specimenHut')
SIZES = {'breadShelf':(2,1),'catLedge':(2,1),'starTerrace':(3,3),'guild212':(3,3)}
ROOT = Path(__file__).resolve().parents[2]

def pavement(n, front):
    # Intersect the existing 2:1 ground plane with the occupied rectangle.
    x,y=np.meshgrid(np.arange(n)+.5,np.arange(n)+.5)
    near=n-1-np.abs(x-front)/2
    back=n/2-1+np.abs(x-(n-front))/2
    unit=n/128
    u=(y-n/2+1+(x-(n-front))/2)/unit
    v=(y-n/2+1-(x-(n-front))/2)/unit
    row=np.floor(v/9).astype(int); col=np.floor((u+row*7)/17).astype(int)
    local_u=(u+row*7)%17;local_v=v%9
    # Low-contrast limestone courses leave the illustrated entrance readable.
    palette=np.array([(184,171,145),(193,180,151),(185,177,151),(202,191,163),(176,165,142),(194,184,157)])
    stone=palette[(col*73+row*47+(col*row)%7)%len(palette)].astype(float)
    edge=np.minimum(local_u,local_v); light=np.where(edge<.8,-21,np.where((local_v<1.8)|(local_u<1.5),10,0))
    light+=np.where(near-y<1.05*unit,-24,0)
    light+=((np.floor(x/unit)*17+np.floor(y/unit)*23)%5).astype(int)-2
    a=np.zeros((n,n,4),dtype=np.uint8);a[:,:,:3]=np.uint8(np.clip(stone+light[:,:,None],0,255))
    a[:,:,3]=np.where((y>=back)&(y<=near),255,0);a[a[:,:,3]==0,:3]=0
    return Image.fromarray(a)

def register(im, points, key, facing):
    w,h=im.size
    width,depth=SIZES.get(key,(2,2));n=(width+depth)*64
    front=(width if facing%2==0 else depth)*n/(width+depth)
    x0,y0,xc,yc,x1,y1=np.asarray(points,dtype=float)/100
    src_x=np.array([x0,xc,x1])*w
    src_y=np.array([y0,yc,y1])*h
    inset=.071 if key in ('starTerrace','guild212') else .075
    # A market counter can be shallower than its square plot. Retain that proportion
    # without rotating either wall away from the two grid axes.
    if key in ('breadShelf','catLedge'):
        corner=front
    else:
        corner=n*np.clip(inset+(1-2*inset)*xc,.35,.65)
    dst_x=np.array([inset*n,corner,(1-inset)*n])
    # The two sides of the foundation run parallel to the tile edges in every view.
    foot=.960*n-abs(corner-front)/2
    tall=min(.925,.92*h/w)
    if key in ('breadShelf','catLedge'):tall=min(.80,.88*h/w)
    if key=='starTerrace':tall=min(.84,.92*h/w)
    # The same x transformation at every height keeps posts, shutters and chimneys upright.
    # Interpolate the vertical scale between the feet while leaving the roof ridge continuous.
    x=np.arange(n)+.5
    sx=np.interp(x,dst_x,src_x)
    for start,end,valid in [(0,1,x<dst_x[0]),(1,2,x>dst_x[2])]:
        sx[valid]=src_x[start]+(x[valid]-dst_x[start])*(src_x[end]-src_x[start])/(dst_x[end]-dst_x[start])
    src_floor=np.interp(sx,src_x,src_y)
    dst_floor=foot-np.abs(x-corner)/2
    for start,end,valid in [(0,1,sx<src_x[0]),(1,2,sx>src_x[2])]:
        src_floor[valid]=src_y[start]+(sx[valid]-src_x[start])*(src_y[end]-src_y[start])/(src_x[end]-src_x[start])
    y=np.arange(n)[:,None]+.5
    # A roof is not on the ground plane. Keep the original elevation and roof
    # drawing intact, then fit the plinth and lower walls to their ground edges.
    scale=tall*n/h
    top=max(.025*n,foot-scale*np.max(src_floor[sx>=0]))
    fraction=np.clip(((y-top)/(dst_floor[None,:]-top)-.47)/.52,0,1)
    blend=fraction*fraction*(3-2*fraction)
    adjustment=dst_floor-top-scale*src_floor
    sy=(y-top-blend*adjustment[None,:])/scale
    # Work in premultiplied colour to keep the alpha edges clean on light and dark terrain.
    from scipy.ndimage import map_coordinates
    arr=np.asarray(im.convert('RGBa')).astype(np.float32)
    indices=np.array([sy-.5,np.broadcast_to(sx-.5,sy.shape)])
    channels=[map_coordinates(arr[:,:,k],indices,order=1,mode='constant',cval=0,prefilter=False) for k in range(4)]
    arr=np.stack(channels,axis=2).clip(0,255).astype(np.uint8)
    arr[y>n-1-np.abs(x-front)/2]=0
    art=Image.fromarray(arr,'RGBa').convert('RGBA')
    if key not in ('breadShelf','catLedge'):
        ground=pavement(n,front)
        ground.alpha_composite(art);art=ground
    return art

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('images',type=Path,help='Isolated four source views, named TYPE-0.png through TYPE-3.png')
    parser.add_argument('--only',nargs='*',choices=TYPES)
    args=parser.parse_args()
    src=args.images
    info=json.loads((Path(__file__).with_name('registration.json')).read_text())
    dest=ROOT/'assets/town-axis/painted'
    dest.mkdir(exist_ok=True,parents=True)
    for key in args.only or TYPES:
        pieces=[register(Image.open(src/f'{key}-{f}.png'),info[key][f],key,f) for f in range(4)]
        n=pieces[0].width; sheet=Image.new('RGBA',(4*n,n))
        for i,piece in enumerate(pieces):sheet.paste(piece,(i*n,0))
        sheet.save(dest/(key+'.webp'),format='WEBP',lossless=True,method=6,exact=True)

if __name__=='__main__':main()
