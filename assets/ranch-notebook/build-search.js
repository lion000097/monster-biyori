function normalizeBuildName80(value) {
  return value.normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0)-0x60));
}

const buildSpecs80 = new Map(Object.entries(B).map(([type, spec]) => {
  const {w,h} = buildingMeta(type);
  return [type, {name:normalizeBuildName80(spec.name), size:[Math.min(w,h),Math.max(w,h)]}];
}));
const sizes80 = [...new Set([...buildSpecs80.values()].map(spec=>spec.size.join('×')))];
sizes80.sort((a,b)=>{
  const [aw,ah]=a.split('×').map(Number), [bw,bh]=b.split('×').map(Number);
  return aw-bw || ah-bh;
});
for (const size of sizes80) $('buildSize80').add(new Option(size+' マス',size));

let buildWords80 = [];
function matchesBuildFilters80(type) {
  const spec = buildSpecs80.get(type);
  if (!spec) return false;
  return buildWords80.every(word=>spec.name.includes(word)) &&
    (!$('buildSize80').value || spec.size.join('×')===$('buildSize80').value) &&
    (!$('buildRoad80').checked || acceptsRoadFloor130(type)) &&
    (!$('buildUnplaced80').checked || !state.buildings.some(site=>site.type===type));
}

function clearBuildFilters80() {
  $('buildName80').value = '';
  $('buildSize80').value = '';
  $('buildRoad80').checked = $('buildUnplaced80').checked = false;
  buildWords80 = [];
}

function refreshBuildFilters80() {
  buildWords80 = normalizeBuildName80($('buildName80').value).trim().split(/\s+/).filter(Boolean);
  if (buildMode && !matchesBuildFilters80(buildMode)) buildMode = null;
  renderUI(true);
  $('tabBody').scrollTop = 0;
}

const search80 = $('buildName80');
search80.addEventListener('input',event=>{if (!event.isComposing) refreshBuildFilters80();});
search80.addEventListener('compositionend',refreshBuildFilters80);
for (const id of ['buildSize80','buildRoad80','buildUnplaced80']) $(id).addEventListener('change',refreshBuildFilters80);
$('buildReset80').addEventListener('click',()=>{
  clearBuildFilters80();
  facilityRole = 'all';
  refreshBuildFilters80();
});

function renderBuildFilters80() {
  const tools = $('buildFilters80');
  tools.hidden = tab!=='build';
  if (tools.hidden) return;
  const panel = $('tabBody');
  const cards = panel.querySelectorAll('.worldtree-panel193, .build-option');
  const label = cards.length ? cards.length+' 種類' : '一致する施設はありません';
  if ($('buildCount80').textContent!==label) $('buildCount80').textContent = label;
  if (buildWords80.length || $('buildSize80').value || $('buildRoad80').checked || $('buildUnplaced80').checked) {
    const results = document.createDocumentFragment();
    for (const card of cards) results.append(card);
    $('facilityRoles').after(results);
  }
}
