"""Check the 15 four-facing sprites, picker and grid in a temporary browser profile."""
import argparse, json, re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'releases/1.25.83/game.html'
TYPES='breadShelf catLedge breadMarket maskStall musicMaker shoeRepair umbrellaHut starTerrace jarHut guild212 teaRoom eggWatch toyRepair stoneStudy specimenHut'.split()
HOOK='claimSave12556();\nconst didLoad=load();'
INSPECT='window.axisInspect=(expression,args)=>eval(expression);\n'

def test(chrome=None):
    html=SOURCE.read_text();assert html.count(HOOK)==1;html=html.replace(HOOK,INSPECT+HOOK)
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=chrome,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1100,'height':820});errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.route('http://ranch.test/**',lambda r:r.fulfill(content_type='text/html; charset=utf-8',body=html) if r.request.url.endswith('/game.html') else r.abort())
        page.goto('http://ranch.test/game.html');page.wait_for_function("typeof axisInspect==='function'")
        page.locator('#ranchGuideDialog [data-guide-stop]').click()
        evaluate=lambda js,args=None:page.evaluate('([js,args])=>axisInspect(js,args)',[js,args])
        evaluate('state.speed=0')
        # A spare construction preview permits all four choices, even if a real ranch is full.
        for typ in TYPES:
            evaluate("buildMode=args;clearMode=false;terrainMode=null;moveMode=null;selectedBuilding=null;tab='build';placementFacing=0;renderUI(true);true",typ)
            image_set=set()
            for f in range(4):
                page.locator(f'#facilityFacing [data-facing="{f}"]').click()
                result=evaluate("""(()=>{const t=facingSelection();const canvas=spriteBuildingV161(t.type,t.level,t.direction);
                    const menu=townMapArt({type:t.type,level:t.level},t.direction,true,0);
                    return [t.direction,canvas.toDataURL(),canvas.toDataURL()===menu.toDataURL()];})()""")
                assert result[0]==f and result[2],(typ,f);image_set.add(result[1])
            assert len(image_set)==4,typ
        # Exercise equal-length map edits and rotation of a rectangular road decoration.
        report=evaluate("""(()=>{function summarize(){
          const result=[];for(let y=-5;y<=13;y++)for(let x=-4;x<=17;x++)result.push([
            getBuildingAt(x,y)?.id,!!isPath(x,y),!!isPond(x,y),sceneryAt(x,y),!!isWalkable(x,y)]);
          return JSON.stringify(result);
        }function equivalent(){return summarize()===townGrid.run(summarize,[]);}
        const b={id:123456,type:'breadShelf',x:1,y:3,facing:0,level:1};state.buildings.push(b);
        const road=keyXY(1,3);state.paths.push(road);const first=equivalent();
        b.facing=1;b.x=-2;state.paths[state.paths.length-1]=keyXY(-2,3);const second=equivalent();
        try{townGrid.run(()=>{throw Error('interrupt pass')},[]);}catch{}
        state.buildings.pop();state.paths.pop();return [first,second,equivalent()];
        })()""")
        assert all(report),report;assert not errors,errors;browser.close()
    print('15 facilities × four picker buttons; four distinct views; edits and path predicates passed.')

if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--chromium');a=ap.parse_args();test(a.chromium)
