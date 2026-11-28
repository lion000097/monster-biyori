// Filters are presentation only: active party membership and the auto-pick rule are untouched.
const partyView94={rarity:'',element:'',sort:'default'};
const partyOrders94=[['default','いつもの順'],['levelHigh','レベルが高い順'],['levelLow','レベルが低い順'],['rarity','レアリティが高い順'],['name','名前順']];
const partyRanks94=m=>rarityRank[SPECIES[m.kind]?.rarity]??-1;
const partyRarity94=m=>SPECIES[m.kind]?.rarity||'';
function partyRow94(m,inParty){
 const equipment=equipmentItem12512(m);
 return `<div class="party-unit ${inParty?'active':''}" data-party-row94="${m.id}">
   <canvas class="party-portrait" width="64" height="64" data-party-kind="${m.kind}" data-party-shiny="${m.shiny?1:0}"></canvas>
   <div class="party-info"><strong>${esc(m.name)} Lv.${m.lv}</strong>
    <div class="entity-sub">${ELEM_ICON[m.element]||'🌿'} ${esc(m.element)} / ${esc(partyRarity94(m))} / ${esc(TRAITS[m.trait||0].name)}
      ${equipment!=='none'?' / 装備：'+equipmentArt12514(equipment)+esc(equipmentStats12512(m).name):''}</div></div>
   <div class="party-actions">
    <button type="button" class="small-button secondary" id="partyDetail-${m.id}" data-action="selectMonster" data-id="${m.id}" aria-haspopup="dialog" aria-label="${esc(m.name)}の詳細（育成カルテ）を開く">詳細</button>
    <button type="button" class="small-button ${inParty?'secondary':''}" id="partyToggle-${m.id}" data-action="toggleParty" data-id="${m.id}" aria-label="${esc(m.name)}を${inParty?'編成から外す':'編成する'}">${inParty?'外す':'編成'}</button>
   </div></div>`;
}
function renderAdventureParty94(content,element) {
 let root=content.querySelector('[data-adventure-party94]');
 if(!root){
   root=document.createElement('section');root.dataset.adventureParty94='';
   const fields=[['rarity','レアリティ',[['','すべて'],...[...new Set(SPECIES.map(s=>s.rarity).filter(Boolean))]
     .sort((a,b)=>(rarityRank[b]??-1)-(rarityRank[a]??-1)).map(v=>[v,v])]],
     ['element','属性',[['','すべて'],...Object.keys(ELEM_ICON).map(v=>[v,ELEM_ICON[v]+' '+v])]],
     ['sort','並べ替え',partyOrders94]];
   const fieldHTML=fields.map(([key,label,options])=>`<label>${label}<select aria-label="${label}" data-party-filter94="${key}">${options
      .map(([id,text])=>`<option value="${esc(id)}">${esc(text)}</option>`).join('')}</select></label>`).join('');
   root.innerHTML='<div class="section-label">出撃編成（3匹まで）</div>'+
     '<p class="help">選択が0匹ならレベル順で自動編成。敵属性：<span data-party-enemy94></span></p>'+
     '<div class="party-group94" data-party-selected94></div>'+
     '<div class="party-tools94" role="group" aria-label="出撃候補を絞り込む">'+fieldHTML+
     '<button type="button" class="small-button secondary" data-party-reset94>リセット</button></div>'+
     '<p class="mini-note" role="status" data-party-count94></p><div data-party-candidates94></div>';
   content.appendChild(root);
 }
 if(element)root.querySelector('[data-party-enemy94]').textContent=(ELEM_ICON[element]||'')+' '+element;
 for(const select of root.querySelectorAll('[data-party-filter94]')){
   const value=partyView94[select.dataset.partyFilter94];
   if(select.value!==value)select.value=value;
 }
 const byId=new Map(state.monsters.map(m=>[m.id,m])),chosen=state.party.map(id=>byId.get(id)).filter(Boolean);
 const active=new Set(chosen.map(m=>m.id));
 const eligible=state.monsters.filter(m=>!active.has(m.id));
 const {rarity,element:attribute,sort}=partyView94;
 const candidates=eligible.filter(m=>(!rarity||partyRarity94(m)===rarity)&&(!attribute||m.element===attribute));
 if(sort==='levelHigh')candidates.sort((a,b)=>b.lv-a.lv);
 if(sort==='levelLow')candidates.sort((a,b)=>a.lv-b.lv);
 if(sort==='rarity')candidates.sort((a,b)=>partyRanks94(b)-partyRanks94(a)||b.lv-a.lv);
 if(sort==='name')candidates.sort((a,b)=>a.name.localeCompare(b.name,'ja'));
 const focused=document.activeElement?.id;
 const previousFocus=focused&&root.contains(document.activeElement)?focused:null;
 function updateRows(node,html){
   if(node.partyHTML94===html)return;
   node.partyHTML94=html;node.innerHTML=html;
   for(const canvas of node.querySelectorAll('[data-party-kind]'))
     paintPortrait(canvas,spriteMonsterHD(+canvas.dataset.partyKind,canvas.dataset.partyShiny==='1'));
 }
 updateRows(root.querySelector('[data-party-selected94]'),
   '<div class="party-label94">編成中 '+chosen.length+' / 3匹</div>'+
   (chosen.length?chosen.map(m=>partyRow94(m,true)).join(''):'<p class="mini-note">未選択（自動編成）</p>'));
 const count='出撃候補 '+candidates.length+' / '+eligible.length+'匹';
 const counter=root.querySelector('[data-party-count94]');if(counter.textContent!==count)counter.textContent=count;
 updateRows(root.querySelector('[data-party-candidates94]'),
   candidates.length?candidates.map(m=>partyRow94(m,false)).join(''):
    '<p class="info-card">'+(eligible.length?'条件に合う仲間がいないよ。':'ほかの出撃候補はいないよ。')+'</p>');
 if(previousFocus&&!root.contains(document.activeElement))
   ($(previousFocus)||root.querySelector('[data-party-filter94=rarity]')).focus({preventScroll:true});
}
$('tabBody').addEventListener('change',e=>{
 const select=e.target.closest('[data-party-filter94]');
 if(!select||tab!=='adventure')return;
 partyView94[select.dataset.partyFilter94]=select.value;
 renderAdventureParty94(select.closest('[data-adventure-content]'));
});
$('tabBody').addEventListener('click',e=>{
 const reset=e.target.closest('[data-party-reset94]');
 if(!reset||tab!=='adventure')return;
 Object.assign(partyView94,{rarity:'',element:'',sort:'default'});
 renderAdventureParty94(reset.closest('[data-adventure-content]'));
});
