"""Prepare the 1.25.62 release using the previous verified standalone documents."""
import argparse
import base64
import re
import sys
import zlib
from pathlib import Path

def transform(s,assets):
    def swap(a,b):
        nonlocal s
        if s.count(a)!=1:raise ValueError('Missing unique baseline: '+a[:90])
        s=s.replace(a,b)
    def cut(start,end):
        nonlocal s
        a=s.index(start);b=s.index(end,a)
        s=s[:a]+s[b:]
    if s.count("GAME_APP_VERSION='1.25.61'")!=1:raise ValueError('Unexpected baseline game')
    s=s.replace('Ver.1.25.61', 'Ver.1.25.62').replace("GAME_APP_VERSION='1.25.61'","GAME_APP_VERSION='1.25.62'")
    swap('— 牧場の建物と飾り15種</footer>', '— 牧場の装飾4種</footer>')
    swap("cost:175,width:57,pivot:37", "cost:175,width:64,pivot:42")
    swap("shirovane130:{width:64,pivot:59},...gardenProps250","shirovane130:{width:64,pivot:59},lamp211:{width:80,pivot:68},...gardenProps250")
    cut('const picnicArtCache257=new Map();','function picnicPose257(')
    cut('function passiveFlowerbedSprite124(','// .30: a whitewashed carved')
    swap("  if (type === 'picnic257')return picnicSprite257(direction);\n","")
    swap("  if (type === 'flowerbed211') return passiveFlowerbedSprite124(direction);\n","")
    swap('if (Object.hasOwn(gardenProps250,type))return ranchFrame130','if (ranchSheets130[type] && Object.hasOwn(gardenProps250,type))return ranchFrame130')
    # Keep the pre-existing one- and two-star upgrade cues on benches and streetlights.
    a=s.index('    // Keep an upgrade cue at the edge');b=s.index('\n  });',a)
    loop=s[a:b];s=s[:a]+'    drawVillageUpgradeMarks(g,size,upgradeMarks);'+s[b:]
    loop='\n'.join(x[2:] for x in loop.splitlines()).replace(', top = size-24;', ';')
    swap('function villageSprite(frame,', 'function drawVillageUpgradeMarks(g,size,upgradeMarks,top=size-24){\n'+loop+'\n}\n\nfunction villageSprite(frame,')
    swap('  let variant=0;\n  if(type===\'artHut\'', "  let variant=0;\n  if(type==='bench211'||type==='lamp211')variant=level>=4?2:level>=2?1:0;\n  if(type==='artHut'")
    swap("  if(type==='artHut')townPaintEasel", "  if(type==='bench211'||type==='lamp211')drawVillageUpgradeMarks(g,frame.size,variant,type==='lamp211'?frame.size-10:frame.size-24);\n  if(type==='artHut')townPaintEasel")
    swap('if(Object.hasOwn(townCatalog,type))return townBuildingArt(type,level,validFacing(facing));', 'if(Object.hasOwn(townAtlases,type))return townBuildingArt(type,level,validFacing(facing));')
    return embed(s,assets)

def unpack(previous):
    data = re.search(r'id="ranch-payload">([^<]+)</script>',previous)[1]
    inflater = re.search(r'<script id="ranch-inflater">([\s\S]+?)</script>',previous)[1]
    return zlib.decompress(base64.b85decode(data.replace(',', '<'))).decode().replace('@@LAUNCHER_INFLATER_SOURCE@@',inflater)

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('root',type=Path);ns=ap.parse_args()
    root=ns.root.resolve();sys.path.insert(0,str(root/'tools'))
    from embed_town_art import embed
    from pack_launcher_html import pack
    old=root/'releases/1.25.61';out=root/'releases/1.25.62';out.mkdir(parents=True,exist_ok=True)
    assets=root/'assets/town-buildings'
    web=transform((old/'game.html').read_text(),assets)
    for dest in (root/'game.html',out/'game.html'):dest.write_text(web)
    compact=pack(transform(unpack((old/'launcher-game.html').read_text()),assets)).encode()
    print('Launcher:', len(compact),'of',4*1024*1024,flush=True)
    if len(compact)>4*1024*1024:raise SystemExit('Launcher exceeds limit')
    (out/'launcher-game.html').write_bytes(compact)
