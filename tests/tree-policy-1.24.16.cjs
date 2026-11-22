'use strict';

// Inject this function into the game's IIFE. Every purchase and progression
// change goes through the shipped game functions; no resources are granted.
function createTreeManager(s, options = {}) {
  const milestones = [], actions = {build:0,upgrade:0,roads:0,land:0,hires:0,orders:0,research:0};
  const maxTree = options.maxTree || 20;
  const cells=[];
  for(let y=MIN_Y+1;y<H-1;y++)for(let x=MIN_X+1;x<W-1;x++)cells.push([x,y]);
  cells.sort((a,b)=>Math.hypot(a[0]-10,a[1]-8)-Math.hypot(b[0]-10,b[1]-8));

  function roadRoute(x,y,size) {
    const inside=(px,py)=>px>=x&&px<x+size.w&&py>=y&&py<y+size.h;
    const frontage=[
      Array.from({length:size.w},(_,i)=>[x+i,y+size.h]),
      Array.from({length:size.h},(_,i)=>[x-1,y+i]),
      Array.from({length:size.w},(_,i)=>[x+i,y-1]),
      Array.from({length:size.h},(_,i)=>[x+size.w,y+i])
    ];
    // Prefer existing front roads; all generated roads join this network.
    for(let facing=0;facing<4;facing++)if(frontage[facing].some(p=>residentRoad(...p)))return {facing,path:[]};
    const pass=(px,py)=>px>MIN_X&&py>MIN_Y&&px<W-1&&py<H-1&&unlocked(px,py)&&
      !inside(px,py)&&!getBuildingAt(px,py)&&!blockedScenery(px,py)&&!isPond(px,py);
    const queue=[],seen=new Set();
    for(let facing=0;facing<4;facing++)for(const [px,py] of frontage[facing])if(pass(px,py)){
      const key=px+','+py;if(seen.has(key))continue;seen.add(key);queue.push({x:px,y:py,facing,parent:-1});
    }
    for(let i=0;i<queue.length;i++){
      const node=queue[i];
      if(residentRoad(node.x,node.y)){
        const path=[];
        for(let n=i;n>=0;n=queue[n].parent)path.push([queue[n].x,queue[n].y]);
        return {facing:node.facing,path};
      }
      for(const [px,py] of [[node.x-1,node.y],[node.x+1,node.y],[node.x,node.y-1],[node.x,node.y+1]]){
        const key=px+','+py;
        if(!seen.has(key)&&pass(px,py)){seen.add(key);queue.push({x:px,y:py,facing:node.facing,parent:i});}
      }
    }
    return null;
  }

  function build(type,expand=true) {
    const spec=B[type];
    if(!spec||s.villageLv<spec.unlock||s.coins<constructionCost(type)||
      s.buildings.filter(b=>b.type===type).length>=facilityCountCap193(type))return false;
    const size=buildingMeta(type);
    // Existing roads first, then a short legal connection. No scenery is erased
    // or actor teleported to make an otherwise illegal placement succeed.
    let candidate=null;
    for(const [x,y] of cells){
      if(!canBuildBefore195(x,y,null,false,type))continue;
      for(let facing=0;facing<4;facing++)if(frontRoads(type,x,y,facing).length){candidate={x,y,facing,path:[]};break;}
      if(candidate)break;
    }
    if(!candidate){
      for(const [x,y] of cells){
        if(!canBuildBefore195(x,y,null,false,type))continue;
        const route=roadRoute(x,y,size);
        if(route){candidate={x,y,...route};break;}
      }
    }
    if(candidate){
      for(const [x,y] of candidate.path)if(!residentRoad(x,y)){
        putTerrain('road',x,y);if(residentRoad(x,y))actions.roads++;
      }
      placementFacing=candidate.facing;
      if(!canBuild(candidate.x,candidate.y,null,false,type))return false;
      const before=s.buildings.length;
      place(type,candidate.x,candidate.y);
      if(s.buildings.length>before){actions.build++;return true;}
    }
    if(expand){
      const choices=ZONES.map((_,id)=>id).filter(zoneOpenable).sort((a,b)=>zonePrice(a)-zonePrice(b));
      const choice=choices.find(id=>s.coins>=zonePrice(id)+constructionCost(type));
      if(choice!==undefined){
        const before=s.zones.length;unlockZone(choice);
        if(s.zones.length>before){actions.land++;return build(type,false);}
      }
    }
    return false;
  }

  function develop() {
    for(const req of treeRequirementStatus193(s.villageLv+1)){
      if(req.ok)continue;
      const same=s.buildings.filter(b=>b.type===req.type);
      const unfinished=same.filter(b=>b.level<req.minLevel).sort((a,b)=>b.level-a.level)[0];
      if(unfinished){
        if(s.coins<costUpgrade(unfinished))continue;
        const before=unfinished.level;upgrade(unfinished.id);
        if(unfinished.level>before){actions.upgrade++;return true;}
      }
      if(same.length<req.count&&build(req.type))return true;
    }
    return false;
  }

  function stats() {
    return {
      seconds:s.ticks*16,level:s.villageLv,coins:Math.floor(s.coins),food:Math.floor(s.food),
      magic:+s.magic.toFixed(2),xp:+s.villageXp.toFixed(2),allies:s.monsters.length,
      employees:s.staff.length,buildings:s.buildings.length,zones:s.zones.length,
      partyLevels:crewParty().map(m=>m.lv),stage:s.adventure.stage,clears:s.adventure.clears,
      aidsPerDay:ranchAid(s.villageLv).daily,actions:{...actions}
    };
  }

  function manage() {
    tab='build';
    const guild=s.buildings.find(b=>b.type==='guild212');
    if(options.orders!==false&&guild){
      selectedBuilding=guild.id;
      const order=currentMarketOrder();
      if(spendableStock()>=order.stock&&s.food>=order.food){
        const before=s.economy.ordersDone;completeOrder(before);actions.orders+=s.economy.ordersDone-before;
      }
      if(s.vipOrder211&&s.materialStock211[s.vipOrder211.id]>=s.vipOrder211.qty)deliverVIP211();
    }

    // Fill development requirements before discretionary spending. The modest
    // roster is assigned once per visit, with the lab workers unlocked at Lv.5.
    let guard=0;
    while(s.villageLv<maxTree&&guard++<120&&develop()){}
    if(s.villageLv<maxTree){
      const cost=treeCost193();
      if(s.villageXp>=villageThreshold(s.villageLv)&&s.coins>=cost.coins&&s.magic>=cost.magic&&
        treeRequirementStatus193(s.villageLv+1).every(r=>r.ok)){
        growWorldTree193();milestones.push(stats());
        guard=0;while(s.villageLv<maxTree&&guard++<120&&develop()){}
      }
    }
    const roles=['keeper','gather','explore','study','sell','study','explore','study'];
    const wanted=Math.min(roles.length,2+Math.floor(s.villageLv/2),staffLimit());
    if(s.staff.length<wanted&&s.coins>=800+s.staff.length*140){
      const before=s.staff.length;hire();actions.hires+=s.staff.length-before;
    }
    s.staff.forEach((w,i)=>{
      const role=roles[i%roles.length];
      const next=role==='study'&&!s.buildings.some(b=>b.type==='lab')?'gather':
        role==='explore'&&!s.buildings.some(b=>b.type==='expeditionOffice')?'keeper':role;
      if(w.job===next)return;
      // Use the actual delegated UI handler so interrupted jobs, paths and
      // expedition visits are cancelled exactly as a player's selection is.
      const selector=document.createElement('select');
      selector.className='staff-select';selector.dataset.staff=String(w.id);
      selector.innerHTML='<option value="'+next+'">'+next+'</option>';
      document.body.appendChild(selector);
      selector.dispatchEvent(new Event('change',{bubbles:true}));selector.remove();
    });

    if(options.research!==false&&s.buildings.some(b=>b.type==='lab')){
      const target=Math.min(3,1+Math.floor(Math.max(0,s.villageLv-5)/5));
      for(const type of ['train','battle','market','quest','farm']){
        const current=s.research[type]||0,cost=researchCost(type,current);
        if(current<target&&s.coins>=treeCost193().coins+cost.coins+2000&&s.magic>=treeCost193().magic+cost.magic){
          doResearch(type);if((s.research[type]||0)>current)actions.research++;break;
        }
      }
    }
    if(s.buildings.some(b=>b.type==='expeditionOffice'))chooseExpedition(reachedExpeditionStage()-1);
    selectedBuilding=null;
  }
  return {manage,build,milestones,actions,stats};
}

module.exports={createTreeManager};
