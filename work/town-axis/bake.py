"""Bake all four native orientations and their in-game states with the ranch renderer."""
import argparse
import base64
import io
import json
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
ATELIER = ROOT / 'assets/town-atelier'
MODELS = ROOT / 'assets/town-axis'
TYPES = 'breadShelf catLedge breadMarket maskStall musicMaker shoeRepair umbrellaHut starTerrace jarHut guild212 teaRoom eggWatch toyRepair stoneStudy specimenHut'.split()
SIZES = {'breadShelf':(2,1),'catLedge':(2,1),'starTerrace':(3,3),'guild212':(3,3)}

def spec(name):
    w,h=SIZES.get(name,(2,2))
    return {'w':w,'h':h,'role':'decor' if name in ('breadShelf','catLedge') else 'facility'}

def frames(name):
    if name=='eggWatch':
        return [(phase,bits) for phase in range(4) for bits in range(1<<phase)]
    counts={'guild212':3,'breadShelf':2,'umbrellaHut':2,'jarHut':4}
    return [(p,0) for p in range(counts.get(name,1))]

def bake(target, chrome=None):
    target.mkdir(parents=True,exist_ok=True)
    modeljs='\n'.join((ATELIER/(name+'.js')).read_text() for name in ('raster','joinery','props','craft-details','levels-06-13','levels-14-21','levels-22-30'))
    modeljs+='\n'+(MODELS/'models.js').read_text()+'\n'+(MODELS/'finishes.js').read_text()
    modeljs=modeljs.replace('const rafters=Math.max', 'tileCourses(stroke,at,mat,d,w*.65);\n      const rafters=Math.max')
    material={name:'data:image/png;base64,'+base64.b64encode((ATELIER/file).read_bytes()).decode()
              for name,file in [('komorebiMaterial','komorebi-house.png'),('paintedSigns','painted-signs.png')]}
    for name in TYPES:
        path=ATELIER/'illustrations'/f'{name}.png'
        if path.is_file():
            with Image.open(path) as src:
                buf=io.BytesIO();src.crop((0,0,src.height,src.height)).save(buf,format='PNG')
            material[name]='data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode()
    js="""async inputs=>{
      const materialAtlas={};
      for(const [id,uri] of Object.entries(inputs)){
        const img=new Image();img.src=uri;await img.decode();
        const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
        const g=canvas.getContext('2d');g.drawImage(img,0,0);
        materialAtlas[id]={size:img.width,rgba:g.getImageData(0,0,img.width,img.height).data};
      }
      const townNativeFrame=(id)=>materialAtlas[id];
    """+modeljs+"""
      window.paint=([type,s,phase,eggs])=>{
        const strip=document.createElement('canvas'),size=(s.w+s.h)*32;
        strip.width=size*4;strip.height=size;const g=strip.getContext('2d'),slides=[];
        for(let f=0;f<4;f++){
          const k=workshop(s,f,phase);k.item={eggs};
          if(s.role!=='decor')k.floor();
          k.r.setScale(s.role==='decor'?1.04:1.115,s.role==='decor'?1.27:1.31);
          const furnishingsForType=furnishings(k),p={...furnishingsForType,...craftDetails(k,furnishingsForType)};
          const custom={breadShelf:coolingShelf,umbrellaHut:umbrellaShop,starTerrace,teaRoom:teaHouse,guild212:guildHall};
          if(custom[type])custom[type](k,p,phase);
          else {
            const plan=['eggWatch','toyRepair','stoneStudy','jarHut'].includes(type)?earlyVillage:
              ['catLedge','breadMarket','shoeRepair','specimenHut'].includes(type)?middleVillage:highVillage;
            plan(type,k,p);
          }
          buildingFinishes(type,k,p);
          const canvas=k.r.finish();g.drawImage(canvas,size*f,0);
          if(type==='stoneStudy'||type==='maskStall'){
            const n=type==='maskStall'?9:11,anchor=type==='maskStall'?[16.8,24.2,11.6]:[18.4,26.0,8.9];
            const [cx,cy]=k.r.project(anchor),ix=Math.round(cx-n/2),iy=Math.round(cy-n);
            const test=document.createElement('canvas');test.width=test.height=n;
            const tc=test.getContext('2d');tc.fillStyle='#ff00ff';tc.fillRect(0,0,n,n);
            k.r.exhibit({source:[test],anchor,size:n});const data=k.r.finish().getContext('2d').getImageData(ix,iy,n,n).data;
            const rows=Array.from({length:n},(_,y)=>{let mask=0;for(let x=0;x<n;x++){
              const i=(y*n+x)*4;
              if(data[i]>64&&data[i+1]<24&&data[i+2]>64)mask|=1<<x;
            }return mask});
            slides.push([ix,iy,rows]);
          }
        }
        return {uri:strip.toDataURL(),slides};
      }
    }"""
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=chrome,args=['--no-sandbox','--disable-dev-shm-usage'])
        page=browser.new_page();page.evaluate(js,material);masks={}
        for name in TYPES:
            for phase,bits in frames(name):
                out=page.evaluate('s=>window.paint(s)',[name,spec(name),phase,bits])
                (target/f'{name}-{phase}-{bits}.png').write_bytes(base64.b64decode(out['uri'].partition(',')[2]))
                if out['slides']:masks[name]=out['slides']
        browser.close()
    (target/'masks.json').write_text(json.dumps(masks,separators=(',',':')))

if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('directory',type=Path);ap.add_argument('--chromium');ns=ap.parse_args();bake(ns.directory,ns.chromium)
