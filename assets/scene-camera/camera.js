// Transient targets refer to live facilities. Only the opt-in is part of a ranch save.
let cameraRanch81 = null, cameraScene81 = null, cameraNext81 = null;
let cameraPhases81 = new WeakSet(), cameraLast81 = 0, cameraHold81 = 0;

function clearCameraTargets81() {
  cameraScene81 = cameraNext81 = null;
  cameraLast81 = 0;
}

function syncCameraRanch81() {
  if (cameraRanch81 === state) return;
  cameraRanch81 = state;
  cameraPhases81 = new WeakSet();
  cameraHold81 = 0;
  clearCameraTargets81();
}

function manualCamera81() {
  if (!state?.sceneCamera81) return;
  clearCameraTargets81();
  cameraHold81 = performance.now()+6000;
}

function cameraPause81(now) {
  if (buildMode || moveMode!=null || clearMode || terrainMode || terrainDragging) return '建築・地図編集中';
  if (followedMonster) return '仲間を見守り中';
  if (selectedBuilding!=null) return '施設を選択中';
  if (state.speed<=0) return '牧場を一時停止中';
  if (document.hidden || lostSaveOwner12556 || guideDialog.open || !guideBar.hidden ||
      $('modal').classList.contains('show') || (mobileMedia12521?.matches && mobilePane12521!=='map')) return 'メニュー操作中';
  if (mapPointer || mapPinch1257 || now<cameraHold81) return '地図を操作中';
  return '';
}

function cameraSceneLive81(site) {
  const phase = observationScenes80[site.type]?.phase;
  if (phase!==undefined) return phase75(site)===phase;
  if (site.type==='picnic257') {
    const picnic=picnicFlow257?.scene;
    return picnic?.site===site && picnic.phase==='use';
  }
  if (site.type==='flowerbed211') return ranchRoutines124?.active.some(a=>a.site===site && a.kind==='water' && a.phase==='use');
  const venue=townSceneState(site);
  if (site.type==='rainPavilion') return weatherInfo().name==='雨' && venue?.members.some(m=>m.phase==='use');
  if (site.type==='musicHall' || site.type==='monsterPlayPlaza') return !!venue?.running;
  return site.type==='artHut'; // The completed picture stays on display.
}

function offerCameraScene81(site) {
  if (!state.sceneCamera81 || !site || !Object.hasOwn(observationScenes80,site.type)) return false;
  syncCameraRanch81();
  const now=performance.now();
  if (cameraPause81(now)) return false;
  const priority=observationScenes80[site.type].phase===undefined ? 2 : 1;
  if (cameraScene81?.site===site && now<cameraScene81.until) return true;
  if (!cameraNext81 || now>=cameraNext81.expires || cameraNext81.priority<priority)
    cameraNext81={site,priority,expires:now+1800};
  return true;
}

function renderCameraState81(reason='') {
  const button=$('sceneCamera81'), enabled=state.sceneCamera81===true;
  if (button.getAttribute('aria-pressed')!==String(enabled)) {
    button.setAttribute('aria-pressed',String(enabled));
    $('sceneCameraFlag81').textContent=enabled?'ON':'OFF';
  }
  const label=$('sceneCameraStatus81');
  const caption=!enabled?'':reason?'観察を一時停止 · '+reason:cameraScene81?observationScenes80[cameraScene81.site.type].title:'次の場面を待っています';
  if (label.textContent!==caption) label.textContent=caption;
  label.hidden=!enabled;
}

function updateSceneCamera81(now=performance.now()) {
  syncCameraRanch81();
  if (!state.sceneCamera81) return;
  const reason=cameraPause81(now);
  if (reason) { clearCameraTargets81(); renderCameraState81(reason); return; }
  if (cameraScene81 && (now>=cameraScene81.until || !state.buildings.includes(cameraScene81.site) || !cameraSceneLive81(cameraScene81.site)))
    cameraScene81=null;
  if (cameraNext81 && (now>=cameraNext81.expires || !state.buildings.includes(cameraNext81.site) || !cameraSceneLive81(cameraNext81.site)))
    cameraNext81=null;
  if (cameraNext81 && (!cameraScene81 || (now>=cameraScene81.hold && cameraNext81.priority>cameraScene81.priority))) {
    cameraScene81={site:cameraNext81.site,priority:cameraNext81.priority,hold:now+500,until:now+5500};
    cameraNext81=null;
  }
  if (cameraScene81) {
    const site=cameraScene81.site, size=buildingOf(site), center=cameraCenter();
    const dt=cameraLast81?Math.max(0,Math.min(.12,(now-cameraLast81)/1000)):1/60;
    const portion=walkCameraMotion1257?.matches?1:1-Math.exp(-dt*5);
    const dx=site.x+size.w/2-center.x, dy=site.y+size.h/2-center.y;
    if (Math.abs(dx)+Math.abs(dy)>.005) {
      cameraX+=dx*portion; cameraY+=dy*portion; limitCamera(); hover=null;
    }
  }
  cameraLast81=now;
  renderCameraState81();
}

$('sceneCamera81').addEventListener('click',()=>{
  if (!maySave12556()) return;
  syncCameraRanch81();
  state.sceneCamera81=!state.sceneCamera81;
  clearCameraTargets81();
  cameraHold81=0; cameraPhases81=new WeakSet();
  if (state.sceneCamera81) {
    for (const site of state.buildings) {
      if (site.type!=='artHut' && Object.hasOwn(observationScenes80,site.type) && cameraSceneLive81(site))
        offerCameraScene81(site);
    }
  }
  renderCameraState81(state.sceneCamera81?cameraPause81(performance.now()):'');
  save(true);
});
