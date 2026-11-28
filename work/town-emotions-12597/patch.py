from pathlib import Path
HERE=Path(__file__).resolve().parent
def patch(s):
 def one(a,b):
  nonlocal s
  assert s.count(a)==1,(a[:100],s.count(a))
  s=s.replace(a,b,1)
 one('<title>もんすたー日和 Ver.1.25.96','<title>もんすたー日和 Ver.1.25.97')
 one('Ver.1.25.96 — 街のモンスターの歩き・飛行・遊泳</footer>','Ver.1.25.97 — モンスターの気持ち</footer>')
 one("GAME_APP_VERSION='1.25.96'","GAME_APP_VERSION='1.25.97'")
 one('function drawMapActor(o,monster,now,star=null,origin=null) {',(HERE/'emotions.js').read_text()+'\nfunction drawMapActor(o,monster,now,star=null,origin=null) {')
 one("if(!eveningPose&&Math.sin(now/1300+o.id*3)>.985)","const feelingShown=!napping&&drawTownFeeling97(o,x+dx,top,now);\n    if(!feelingShown&&!eveningPose&&Math.sin(now/1300+o.id*3)>.985)")
 one('if(icon){drawMapBubble(x+(awningPose?.dx||0)','if(feelingShown){}else if(icon){drawMapBubble(x+(awningPose?.dx||0)')
 one("hop.x=x;hop.y=y;hop.elapsed=0;hop.played=true;","hop.x=x;hop.y=y;hop.elapsed=0;hop.played=true;\n    nearbySplashFeeling97(m,x,y);")
 one("if(play.action==='leap')return false;","nearbySplashFeeling97(m,...play.puddle);\n if(play.action==='leap')return false;")
 one("return !!(m.path?.length||mate.path?.length);","const running=!!(m.path?.length||mate.path?.length);\n  if(!running)showTownFeeling97(m,'joy');\n  return running;")
 one("if(v.elapsed<duration&&inside.length>=min)return;","if(v.elapsed<duration&&inside.length>=min)return;\n  if(kind==='chase'&&v.elapsed>=duration&&inside.length>=min){const finisher=inside.find(m=>m.kind==='monster');if(finisher)showTownFeeling97(finisher.actor,'joy');}")
 one("flow.scene.elapsed+=dt;","flow.scene.elapsed+=dt;\n  if(flow.scene.elapsed>=1.16&&flow.scene.elapsed-dt<1.16&&snackPairValid126(flow.scene))showTownFeeling97(flow.scene.receiver,'fond');")
 return s
