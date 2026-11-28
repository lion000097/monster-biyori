"""Make a lossless sprite strip and small replacement rectangles for changed game states."""
import base64
import io
import json
from pathlib import Path
import numpy as np
from PIL import Image
from bake import TYPES,frames

def prepare_frames(images):
    # A shared palette makes unchanged pixels identical in the base and all variants.
    strips=[np.asarray(image.convert('RGBA')).copy() for image in images]
    sample=np.concatenate([a[a[:,:,3]>0,:3][::8] for a in strips])
    sample=np.resize(sample,((len(sample)+255)//256*256,3)).reshape(-1,256,3)
    palette=Image.fromarray(sample).quantize(colors=127,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
    colors=palette.getpalette()[:127*3]
    # The game's house has strong inks. Apply the tonal adjustment to the palette,
    # identically for a shelf, its morning state and its reflections in all four views.
    table=np.array(colors,float).reshape(-1,3)
    table=np.where(table<135,135+(table-135)*1.11,135+(table-135)*1.06)
    table=np.vstack([np.zeros((1,3)),np.clip(table,0,255)]).astype('uint8').ravel().tolist()
    result=[]
    for a in strips:
        q=np.asarray(Image.fromarray(a[:,:,:3]).quantize(palette=palette,dither=Image.Dither.NONE),dtype=np.uint16)
        q=np.where(a[:,:,3]>0,q+1,0).astype('uint8')
        out=Image.fromarray(q,'P');out.putpalette(table);out.info['transparency']=0;result.append(out)
    return result

def make_bank(source,output):
    masks=json.loads((source/'masks.json').read_text());bank={}
    for name in TYPES:
        states=frames(name);images=[Image.open(source/f'{name}-{p}-{b}.png') for p,b in states]
        cooked=prepare_frames(images);base=cooked[0];n=base.height;width=4*n
        tiles=[];mapping={};cy=n;cx=0;line=0
        for (p,b),im in zip(states[1:],cooked[1:]):
            row=[]
            for f in range(4):
                start=f*n;a=np.asarray(base)[:,start:start+n];v=np.asarray(im)[:,start:start+n]
                ys,xs=np.nonzero(a!=v)
                if not len(xs):row.append(None);continue
                x,y=int(xs.min()),int(ys.min());w,h=int(xs.max())+1-x,int(ys.max())+1-y
                if cx+w>width:cy+=line;cx=0;line=0
                tiles.append((im.crop((start+x,y,start+x+w,y+h)),cx,cy))
                row.append([cx,cy,x,y,w,h]);cx+=w;line=max(line,h)
            mapping[f'{p}-{b}']=row
        sheet=Image.new('P',(width,cy+line),0);sheet.putpalette(base.getpalette());sheet.info['transparency']=0;sheet.paste(base)
        for tile,x,y in tiles:sheet.paste(tile,(x,y))
        buf=io.BytesIO();sheet.convert('RGBA').save(buf,format='WEBP',lossless=True,method=6)
        bank[name]=[n,'data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode(),mapping,masks.get(name)]
    output.write_text(json.dumps(bank,separators=(',',':'))+'\n')

if __name__=='__main__':
    import sys
    make_bank(Path(sys.argv[1]),Path(sys.argv[2]))
