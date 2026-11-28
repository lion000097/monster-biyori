"""Measure painted supports against the game's four ground edges in a temporary browser."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[2]
HOOK='claimSave12556();\nconst didLoad=load();'
EXPOSE='window.plotTest=(expression,args)=>eval(expression);\n'
CHECK="""(()=>{
 const [type,f,columns,compact]=args;
 const b={type,x:3,y:4,facing:f,level:1};
 const m=buildingOf(b),rect=plotImageRect(b),ink=townMapArt(b,f,true,0),n=ink.width;
 const rgba=ink.getContext('2d').getImageData(0,0,n,n).data;
 const bottom=new Int32Array(n).fill(-1);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(rgba[(n*y+x)*4+3]>127)bottom[x]=y;
 let contacts=0,farMargin=Infinity,nearMargin=Infinity,skirt=0;
 for(let x=0;x<n;x++){
   if(bottom[x]<0)continue;
   const p=unprojectGround(rect.x+(x+.5)*rect.w/n,rect.y+(bottom[x]+.5)*rect.h/n);
   // Express each signed edge distance in vertical pixels of the registered sprite.
   const unit=n*T/(2*rect.w);
   const back=Math.min(p.x-b.x,p.y-b.y)*unit,front=Math.min(b.x+m.w-p.x,b.y+m.h-p.y)*unit;
   nearMargin=Math.min(nearMargin,front);
   if(columns.some(([a,z])=>a<=x&&x<=z)){
     farMargin=Math.min(farMargin,back);contacts++;
   }
   if(front<1.65)skirt++;
 }
 // An opaque diamond underneath the art would mask a floating plinth.
 const allowance=compact?1.6:.6;
 if(!contacts||farMargin < -allowance||nearMargin < -allowance||skirt>n*.55)
   throw Error(JSON.stringify({type,f,contacts,farMargin,nearMargin,skirt}));
 return [contacts,farMargin,nearMargin];
})()"""


def check(chromium,compact):
    version=ROOT/'releases/1.25.85'
    source=(version/('launcher-game.html' if compact else 'game.html')).read_text()
    spans=json.loads(Path(__file__).with_name('contact-checks.json').read_text())
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=chromium,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':390 if compact else 1240,'height':844})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        if compact:
            page.add_init_script('const original=Document.prototype.write;Document.prototype.write=function(...args){'
              'if(typeof args[0]==="string")args[0]=args[0].replace('+json.dumps(HOOK)+',()=>'
              +json.dumps(EXPOSE+HOOK)+');return original.apply(this,args)}')
        else:
            assert source.count(HOOK)==1
            source=source.replace(HOOK,EXPOSE+HOOK)
        page.route('http://plot.test/**',lambda r:r.fulfill(body=source,content_type='text/html; charset=utf-8')
                   if r.request.url.endswith('/game.html') else r.abort())
        page.goto('http://plot.test/game.html',timeout=90000)
        page.wait_for_function("typeof plotTest==='function'",timeout=65000)
        measurements=[page.evaluate('([code,args])=>plotTest(code,args)',[CHECK,[key,f,ranges,compact]])
                      for key,faces in spans.items() for f,ranges in enumerate(faces)]
        assert len(measurements)==60 and not errors,errors
        print(('Compact' if compact else 'Web'),len(measurements),'views,',
              sum(x[0] for x in measurements),'contact columns, minimum back/front clearance',
              min(x[1] for x in measurements),min(x[2] for x in measurements),flush=True)
        browser.close()


if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--chromium')
    ap.add_argument('--edition',choices=['web','launcher','both'],default='both')
    args=ap.parse_args()
    if args.edition!='launcher':check(args.chromium,False)
    if args.edition!='web':check(args.chromium,True)
