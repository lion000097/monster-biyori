from pathlib import Path
import re,sys
p=Path(sys.argv[1]);s=p.read_text()
def change(a,b):
 global s
 if s.count(a)==1:
  s=s.replace(a,b,1);return
 pat=r'\n'.join('[ ]*'+re.escape(v.strip(' ')) for v in a.split('\n'))
 hits=list(re.finditer(pat,s))
 if len(hits)!=1:raise ValueError((len(hits),a))
 m=hits[0];s=s[:m.start()]+b+s[m.end():]
change('.ranch-guide-dialog button:focus-visible,.ranch-guide-goal button:focus-visible', '''#guideSpotlight82{position:fixed;z-index:979;pointer-events:none;border:2px solid #ffe8a0;border-radius:9px;
  box-shadow:0 0 0 1px #70542f,0 0 12px 2px #ffcf73b0,0 0 0 160vmax #18242064}
#guideSpotlight82[hidden]{display:none}
@media(forced-colors:active){#guideSpotlight82{border-color:Highlight;box-shadow:none}}
.ranch-guide-dialog button:focus-visible,.ranch-guide-goal button:focus-visible''')
change('<div class="toast-area" id="toasts"', '<div id="guideSpotlight82" aria-hidden="true" hidden></div>\n<div class="toast-area" id="toasts"')
change("let guideOwner=null, guideKey='', guideTarget=null, guideMarker=null, guidePlot=null;", """let guideOwner=null, guideKey='', guideTarget=null, guideMarker=null, guidePlot=null;
let guideCameraOrigin82=null, guideCameraMotion82=null, guideSpotlightBox82='';
const guideSpotlight82=$('guideSpotlight82'), guideReducedMotion82=matchMedia('(prefers-reduced-motion: reduce)');

function guideCameraSet82(x,y,z) {
  zoom=z;
  cameraX=x-VW/(2*z);cameraY=y-VH/(2*z);
  limitCamera();positionBuildingMenu();
}

function guideCameraMove82(x,y,z) {
  const c=cameraCenter();
  if(Math.abs(c.x-x)+Math.abs(c.y-y)+Math.abs(zoom-z)<.001){guideCameraMotion82=null;return;}
  if(guideReducedMotion82.matches){guideCameraMotion82=null;guideCameraSet82(x,y,z);return;}
  guideCameraMotion82={from:{...c,z:zoom},to:{x,y,z},start:performance.now(),ranch:state};
}

function guideMapZoom82(x,y,givenBuilding,tile) {
  if(!guideCameraOrigin82)guideCameraOrigin82={...cameraCenter(),z:zoom};
  const base=guideCameraOrigin82.z;
  const z=clamp(Math.max(base,Math.min(givenBuilding?.type==='worldtree'?1.25:1.48,base*1.43)),MIN_MAP_ZOOM,MAX_MAP_ZOOM);
  const offset=unprojectGround(0,-VH*T*(tile?.x!=null?.07:.09)/z);
  stopWalkCamera();
  guideCameraMove82(x-offset.x,y-offset.y,z);
}

function guideMapReturn82() {
  if(!guideCameraOrigin82)return;
  const c=guideCameraOrigin82;guideCameraOrigin82=null;
  guideCameraMove82(c.x,c.y,c.z);
}

// A moving target must not slide out from under the player's first tap.
function stopGuideMapMotion82(event) {
  if(event.target!==canvas&&!event.target.closest?.('[data-action="pan"],[data-action^="zoom"]'))return;
  guideCameraMotion82=null;
  if(event.type==='wheel'||(event.target!==canvas))guideCameraOrigin82=null;
}
document.addEventListener('pointerdown',stopGuideMapMotion82,true);
document.addEventListener('wheel',stopGuideMapMotion82,{capture:true,passive:true});

function guideFocusFrame82(now) {
  if(guideCameraMotion82){
    const m=guideCameraMotion82;
    if(state!==m.ranch)guideCameraMotion82=null;
    else{
      const t=guideReducedMotion82.matches?1:clamp((now-m.start)/320,0,1), f=1-(1-t)**3;
      guideCameraSet82(m.from.x+(m.to.x-m.from.x)*f,m.from.y+(m.to.y-m.from.y)*f,m.from.z+(m.to.z-m.from.z)*f);
      if(t>=1)guideCameraMotion82=null;
    }
  }
  const target=!guideBar.hidden&&guideTarget!==canvas?guideTarget:null;
  if(!target?.isConnected||guideDialog.open){if(!guideSpotlight82.hidden)guideSpotlight82.hidden=true;return;}
  const r=target.getBoundingClientRect();
  if(r.width<=0||r.height<=0||r.bottom<=0||r.top>=innerHeight||
    !target.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))){
    if(!guideSpotlight82.hidden)guideSpotlight82.hidden=true;return;
  }
  const left=Math.max(1,r.left-3),top=Math.max(1,r.top-3);
  const box='left:'+left+'px;top:'+top+'px;width:'+Math.min(innerWidth-left-1,r.right+3-left)+'px;height:'+Math.min(innerHeight-top-1,r.bottom+3-top)+'px';
  if(guideSpotlightBox82!==box){guideSpotlightBox82=box;guideSpotlight82.style.cssText=box;}
  if(guideSpotlight82.hidden)guideSpotlight82.hidden=false;
}""".replace("tile?.x!=null?.07:.09","tile ? .07 : .09"))
change(" const quiet=powerModeActive12550();"," guideFocusFrame82(now);\n const quiet=powerModeActive12550();")
change("    if(sx<.18||sx>.82||sy<.22||sy>bottom||buildingMenu.hidden&&b){", """    if(guideTarget===canvas)guideMapZoom82(x,y,b,tile);
    else if(sx<.18||sx>.82||sy<.22||sy>bottom||buildingMenu.hidden&&b){
      guideCameraMotion82=null;""")
change("if(guideOwner!==state){guideOwner=state;guideKey='';guidePlot=null;}","if(guideOwner!==state){guideOwner=state;guideKey='';guidePlot=null;guideCameraOrigin82=null;guideCameraMotion82=null;}")
change("  if(active&&!goal)showGuideSpeech(step);", """  if(!guideMarker && !(target&&buildingMenu.contains(target)))guideMapReturn82();
  if(active&&!goal)showGuideSpeech(step);""")
change("    cameraX-=drag.x;cameraY-=drag.y;limitCamera();hover=null;entranceTap1258=null;", "    guideCameraOrigin82=null;cameraX-=drag.x;cameraY-=drag.y;limitCamera();hover=null;entranceTap1258=null;")
change("    if(mapTouches1257.size>1||mapPinch1257){", "    if(mapTouches1257.size>1||mapPinch1257){\n      guideCameraOrigin82=null;")
p.write_text(s)
