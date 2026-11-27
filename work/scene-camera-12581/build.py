"""Build both 1.25.81 editions from their respective 1.25.80 games."""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
from launcher_utf8_words import decode
from pack_launcher_html import MARKER, pack, unbundle_assets

OLD = ROOT / 'releases/1.25.80'
NEW = ROOT / 'releases/1.25.81'
FEATURE = ROOT / 'assets/scene-camera'


def replace(source, old, new, count=1):
    if source.count(old) != count:
        raise ValueError(f'Expected {count} occurrences of {old[:100]!r}, found {source.count(old)}')
    return source.replace(old, new)


def update(source):
    source = replace(source, '1.25.80', '1.25.81', 3)
    source = replace(source, '牧場の観察手帳と建築検索</footer>', 'おまかせ観察カメラとプレイ時間</footer>')
    source = replace(source, 'version:1,observationDays80:{},','version:1,playMillis81:0,sceneCamera81:false,observationDays80:{},')
    source = replace(source, 'loadObservationDays80(state);','loadObservationDays80(state);normalizePlayTime81(state);state.sceneCamera81=state.sceneCamera81===true;')
    resources = '<div class="resources" id="resources">'
    source = replace(source,resources,'<div class="ranch-time81"><span>累計プレイ時間</span><strong id="ranchPlayTime81">0時間 00分 00秒</strong>'+
                     '<small>牧場を画面に表示している実時間。旧セーブは1.25.81から計測。</small></div>'+resources)
    source = replace(source,'const previousSavedAt=state.savedAt;','accountPlayTime81();const previousSavedAt=state.savedAt;')
    source = replace(source,"if(raw===undefined)raw=JSON.stringify(state);","if(raw===undefined){accountPlayTime81();raw=JSON.stringify(state);}")
    source = replace(source,'const previousState=state;','accountPlayTime81();const previousState=state;')
    source = replace(source,"window.addEventListener('pagehide',()=>save(true));",
                     "window.addEventListener('pagehide',()=>{pageAway81=true;save(true);});")
    weather = '<span class="world-tag" id="weatherTag">'
    source = replace(source, weather, '<button type="button" id="sceneCamera81" aria-pressed="false">📷 おまかせ観察カメラ <span id="sceneCameraFlag81">OFF</span></button>'+weather)
    output = '<output id="terrainRowStatus12527"'
    source = replace(source, output, '<span id="sceneCameraStatus81" role="status" hidden></span>'+output)
    source = replace(source, 'function stopWalkCamera() {','function stopWalkCamera() {\n  manualCamera81();')
    source = replace(source, 'updateWalkCamera();','updateWalkCamera();updateSceneCamera81();')
    source = replace(source, 'function renderUI(full=false){if(!state)return;',
                     'function renderUI(full=false){if(!state)return;\n  renderPlayTime81();syncCameraRanch81();renderCameraState81(state.sceneCamera81?cameraPause81(performance.now()):"");')
    calls = [("recordObservation80('flowerbed211');","recordObservation80('flowerbed211',a.site);"),
             ("recordObservation80('picnic257');","recordObservation80('picnic257',s.site);"),
             ("recordObservation80(type);","recordObservation80(type,site);"),
             ("recordObservation80(v.site.type);","recordObservation80(v.site.type,v.site);"),
             ("recordObservation80(site.type);}","recordObservation80(site.type,site);}")]
    for old,new in calls:
        source = replace(source,old,new)
    source = replace(source,'function recordObservation80(key) {','function recordObservation80(key,site) {\n  if (site) offerCameraScene81(site);')
    start = source.index('function observeTownPhase80(site) {')
    end = source.index('function renderObservationBook80()',start)
    source = source[:start]+"""function observeTownPhase80(site) {
  const phase=observationScenes80[site.type]?.phase;
  if (phase===undefined || (!state.sceneCamera81 && state.observationDays80[site.type])) return;
  if (phase75(site)!==phase) { cameraPhases81.delete(site); return; }
  if (!state.observationDays80[site.type]) recordObservation80(site.type);
  if (state.sceneCamera81 && !cameraPhases81.has(site) && offerCameraScene81(site)) cameraPhases81.add(site);
}

"""+source[end:]
    script = (FEATURE/'camera.js').read_text()+(FEATURE/'play-time.js').read_text()
    styles = (FEATURE/'camera.css').read_text()
    marker = 'claimSave12556();\nconst didLoad=load();'
    source = replace(source, marker, script+'\n'+marker)
    return replace(source, '</head>', '<style>\n'+styles+'</style>\n</head>')


def unpack_launcher(html):
    def script(id_):
        return re.search(f'id="{id_}">(.*?)</script>',html,re.S)[1]
    size = int(re.search(r'const PACKED_BYTES=(\d+);',html)[1])
    compressed = decode(script('ranch-payload'),size)
    raw = subprocess.run(['zstd','-qdc'],input=compressed,capture_output=True,check=True).stdout
    source = unbundle_assets(raw,dictionary=True)
    return source.replace(MARKER,script('ranch-inflater')) if MARKER in source else source


if __name__ == '__main__':
    web = update((OLD/'game.html').read_text()).encode()
    (ROOT/'game.html').write_bytes(web)
    (NEW/'game.html').write_bytes(web)
    if '--web' not in sys.argv:
        game = update(unpack_launcher((OLD/'launcher-game.html').read_text()))
        compact = pack(game,binary_assets=True,dictionary=True,zstd_pack=True,wide_words=True,zstd_level=22,embedded_inflater=True).encode()
        print(f'Offline HTML {len(compact):,} / {4*1024*1024:,} bytes',flush=True)
        if len(compact)>4*1024*1024:
            raise ValueError('Offline HTML is too large')
        (NEW/'launcher-game.html').write_bytes(compact)
