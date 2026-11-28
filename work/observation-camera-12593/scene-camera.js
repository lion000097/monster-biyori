// Automatic shots use a fixed composition. Never chase actors or sweep across the map.
const SCENE_ZOOM_81=1.78, SCENE_HOLD_81=4600, SCENE_REPEAT_81=18000, SCENE_SCAN_81=220;
let cameraRanch81=null,cameraScene81=null,cameraPhases81=new WeakSet();
let cameraHold81=0,cameraSavedZoom81=null,cameraScan81=0,cameraCut81=-Infinity;
let cameraHints81=new Map(),cameraSeen81=new Map(),cameraSubject81=new WeakMap();

function setCameraShot81(center,z) {
  zoom=z;
  cameraX=center.x-VW/(2*z); cameraY=center.y-VH/(2*z);
  limitCamera();hover=null;
}
function releaseCameraZoom81() {
  if(cameraSavedZoom81===null)return;
  const previous=cameraSavedZoom81;
  cameraSavedZoom81=null;
  if(zoom===SCENE_ZOOM_81&&previous!==zoom)setCameraShot81(cameraCenter(),previous);
}
function clearCameraTargets81() {
  cameraScene81=null;cameraScan81=0;cameraHints81.clear();
}
function syncCameraRanch81() {
  if(cameraRanch81===state)return;
  releaseCameraZoom81();
  cameraRanch81=state;
  clearCameraTargets81();
  cameraPhases81=new WeakSet(); cameraSubject81=new WeakMap(); cameraSeen81.clear();
  cameraHold81=0;cameraCut81=-Infinity;
}
function manualCamera81() {
  if(!state?.sceneCamera81)return;
  // Manual drag, zoom and follow take ownership immediately at the previous scale.
  releaseCameraZoom81();
  clearCameraTargets81();
  cameraHold81=performance.now()+6000;
  cameraCut81=-Infinity;
}
function cameraPause81(now) {
  if(buildMode||moveMode!=null||clearMode||terrainMode||terrainDragging)return '建築・地図編集中';
  if(followedMonster)return '仲間を見守り中';
  if(selectedBuilding!=null)return '施設を選択中';
  if(state.speed<=0)return '牧場を一時停止中';
  if(document.hidden||lostSaveOwner12556||guideDialog.open||!guideBar.hidden||
     $('modal').classList.contains('show')||(mobileMedia12521?.matches&&mobilePane12521!=='map'))return 'メニュー操作中';
  if(mapPointer||mapPinch1257||now<cameraHold81)return '地図を操作中';
  return '';
}
function offerCameraScene81(site) {
  if(!state.sceneCamera81||!site||!Object.hasOwn(observationScenes80,site.type))return false;
  syncCameraRanch81();
  const now=performance.now();
  if(cameraPause81(now))return false;
  cameraHints81.set(site,now+4500);
  return true;
}
function renderCameraState81(reason='') {
  const button=$('sceneCamera81'),enabled=state.sceneCamera81===true;
  if(button.getAttribute('aria-pressed')!==String(enabled)){
    button.setAttribute('aria-pressed',String(enabled));
    $('sceneCameraFlag81').textContent=enabled?'ON':'OFF';
  }
  const label=$('sceneCameraStatus81');
  const caption=!enabled?'':reason?'観察を一時停止 · '+reason:
    '178% · '+(cameraScene81?.title||'次の場面を待っています');
  if(label.textContent!==caption)label.textContent=caption;
  label.hidden=!enabled;
}
function cameraSubjects81(now,walking) {
  const shots=new Map(),roster=state.monsters,actors=new Set(roster);
  const visible=m=>actors.has(m)&&!m.indoorRest&&Number.isFinite(m.x)&&Number.isFinite(m.y);
  const add=(type,key,title,priority,x,y,actor=null)=>{
    const id=type+':'+key;
    if(!title||!Number.isFinite(x)||!Number.isFinite(y)||shots.has(id))return;
    if(cameraScene81?.id===id||(cameraSeen81.get(id)??0)>now)return;
    if(actor&&(cameraSubject81.get(actor)??0)>now&&priority<5)return;
    const lift=unprojectGround(0,-18);
    shots.set(id,{id,title,priority,actor,x:x+lift.x,y:y+lift.y});
  };
  const atActor=(type,key,title,priority,m)=>add(type,key,title,priority,m.x+.5,m.y+.5,m);
  for(const a of ranchRoutines124?.active||[]){
    if(a.phase!=='use'||!visible(a.actor))continue;
    const title=a.kind==='water'?'花に水やり中':a.kind==='sniff'?'花の香りを楽しんでいる':
      a.kind==='warm'||a.kind==='kindle'?'焚き火のそばでひと休み':gardenActs250[a.kind];
    atActor('routine',a.site.id,title,5,a.actor);
  }
  const picnic=picnicFlow257?.scene;
  if(picnic?.phase==='use'){
    const m=picnic.members.find(a=>visible(a.actor))?.actor;
    if(m){const b=picnic.site;const size=buildingOf(b);add('picnic',b.id,'ふたりでおやつ',6,b.x+size.w/2,b.y+size.h/2,m);}
  }
  if(townSceneRanch===state)for(const v of townVenues.values()){
    const m=v.members.find(a=>a.phase==='use'&&visible(a.actor))?.actor;
    if(m){
      const label=v.site.type==='monsterPlayPlaza'&&v.running?'広場で追いかけっこ':
        v.site.type==='musicHall'&&v.running?'牧場の小さな演奏会':m.act;
      atActor('venue',v.site.id,label,v.running?6:4,m);
    }
  }
  for(const m of roster){
    if(!visible(m))continue;
    const timer=monsterWalkTimers139.get(m),play=timer?.pastime,walk=plotWalks.get(m);
    if(play?.kind==='chase'&&play.leader&&visible(play.partner)&&play.chase.phase!=='approach'){
      const mate=play.partner,end=play.chase.trail.at(-1);
      const x=end?(m.x+mate.x+end[0])/3:(m.x+mate.x)/2;
      const y=end?(m.y+mate.y+end[1])/3:(m.y+mate.y)/2;
      add('play',m.id,'追いかけっこ',7,x+.5,y+.5,m);
    }else if(play?.kind==='rain'&&play.phase!=='approach'){
      const tile=play.puddle;
      if(!play.site&&tile)add('rain',m.id,rainActivities[play.action],8,tile[0]+.5,tile[1]+.5,m);
      else atActor('rain',m.id,rainActivities[play.action],5,m);
    }else if(play?.kind==='nap'||play?.kind==='duskSit'){
      if(play.kind==='nap'||play.scene?.remaining>0)atActor('rest',m.id,play.kind==='nap'?'お昼寝中':'夕暮れにひと休み',5,m);
    }
    if(walk?.phase==='use'&&timer?.visit?.site===walk.site){
      const b=walk.site;
      atActor('visit',b.id,facilityActivities[b.type]?.[1],b.type==='onsen130'?5:4,m);
    }
    if(walking&&m.path?.length&&(!m.act||/おさんぽ|素材を作りに|あそびに|朝ごはん/.test(m.act))){
      const next=m.path[0];
      add('walk',m.id,m.ranchTarget200?'素材牧場へおしごと':'おさんぽ中',1,
        (m.x+next[0])/2+.5,(m.y+next[1])/2+.5,m);
    }
  }
  const buildings=new Set(state.buildings);
  for(const [site,until] of cameraHints81){
    if(until<=now||!buildings.has(site)){cameraHints81.delete(site);continue;}
    const scene=observationScenes80[site.type];
    if(scene?.phase!==undefined&&phase75(site)!==scene.phase)continue;
    if(scene?.phase===undefined&&site.type!=='artHut')continue;
    const size=buildingOf(site);
    add('decoration',site.id,scene.title,2,site.x+size.w/2,site.y+size.h/2);
  }
  return [...shots.values()];
}
function updateSceneCamera81(now=performance.now()) {
  syncCameraRanch81();
  if(!state.sceneCamera81)return;
  const reason=cameraPause81(now);
  if(reason){
    // Never change framing while a finger or a menu owns the map.
    if(cameraScene81||cameraHints81.size)clearCameraTargets81();
    renderCameraState81(reason);return;
  }
  if(now-cameraCut81<SCENE_HOLD_81||now<cameraScan81)return;
  cameraScan81=now+SCENE_SCAN_81;
  for(const [key,until] of cameraSeen81)if(until<=now)cameraSeen81.delete(key);
  const entering=cameraSavedZoom81===null;
  if(entering)cameraSavedZoom81=zoom;
  const center=cameraCenter();
  const shots=cameraSubjects81(now,now-cameraCut81>=8500);
  const score=s=>s.priority-Math.min(1,Math.hypot(s.x-center.x,s.y-center.y)/50);
  const next=shots.sort((a,b)=>score(b)-score(a))[0];
  if(next){
    cameraScene81=next;cameraCut81=now;
    cameraSeen81.set(next.id,now+SCENE_REPEAT_81);
    if(next.actor)cameraSubject81.set(next.actor,now+9000);
    // One cut; the coordinates and scale are unchanged between shots.
    setCameraShot81(Math.hypot(next.x-center.x,next.y-center.y)<.55?center:next,SCENE_ZOOM_81);
  }else{
    if(zoom!==SCENE_ZOOM_81)setCameraShot81(center,SCENE_ZOOM_81);
    cameraScene81=null;
  }
  renderCameraState81();
}

$('sceneCamera81').addEventListener('click',()=>{
  if(!maySave12556())return;
  syncCameraRanch81();
  state.sceneCamera81=!state.sceneCamera81;
  clearCameraTargets81();
  cameraHold81=0; cameraCut81=-Infinity;
  cameraPhases81=new WeakSet(); cameraSubject81=new WeakMap();cameraSeen81.clear();
  if(state.sceneCamera81)updateSceneCamera81();
  else {releaseCameraZoom81();renderCameraState81();}
  save(true);
});
