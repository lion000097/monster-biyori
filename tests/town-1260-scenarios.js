// Executed inside the game closure by the browser harness, never distributed.
const check=(ok,label)=>{if(!ok)throw new Error(label);};
const close=(a,b,label)=>check(Math.abs(a-b)<1e-7,label+': '+a+' / '+b);
function fixture(type='musicHall1260',facing=0){
 state=initial();state.starterGuide='done';state.buildings=[];state.monsters=[];state.staff=[];state.guests=[];
 state.villageLv=30;state.worldTreeLevel=30;state.coins=1e8;state.food=100;state.fame=100;state.day=12;state.hour=18;state.speed=1;
 state.zones=ZONES.map((_,i)=>i);state.paths=[];state.removedDefaultPaths=[...DEFAULT_PATH_KEYS];state.clearedPonds=[...DEFAULT_POND_KEYS];state.ponds=[];
 state.clearedScenery=[];for(let x=MIN_X;x<W;x++)for(let y=MIN_Y;y<H;y++)state.clearedScenery.push(keyXY(x,y));
 ensureAdvanced();townVisits1260.clear();townRanch1260=state;townClock1260=0;townPoll1260=99999;
 const spec=B[type],site={id:100,type,x:7,y:4,w:spec.w,h:spec.h,level:1,facing};state.buildings.push(site);
 for(let x=2;x<24;x++)for(let y=1;y<16;y++)if(!areaContains(site,x+.5,y+.5))state.paths.push(keyXY(x,y));
 return site;
}
const tests=[];
// Real placement and serialization at all facings, including rectangular large footprints.
for(const [type,spec] of Object.entries(TOWN1260))for(let f=0;f<4;f++){
 const b=fixture(type,f);state.buildings=[];placementFacing=f;
 const before=state.coins;place(type,b.x,b.y);
 const built=state.buildings.find(b=>b.type===type);
 check(built&&built.facing===f&&built.w===spec.w&&built.h===spec.h,'placement '+type+'/'+f);
 close(before-state.coins,spec.cost,'construction price');
 check(entranceRoads(built).length>0||spec.decor,'entrance '+type);
}
tests.push('60 placements, four facings and exact construction prices');
for(let level=20;level<30;level++){
 fixture();state.villageLv=level;state.worldTreeLevel=level;
 const req=treeRequirements193(level+1);
 check(req.every(r=>!B[r.type].noUpgrade&&r.count<=facilityCountCap193(r.type,level)&&r.minLevel<=townLevelCap1260(r.type,level)),'reachable requirements '+level);
 state.buildings=[{id:1,type:'worldtree',x:20,y:15,level,w:6,h:6}];
 for(const r of req)for(let i=0;i<r.count;i++)state.buildings.push({id:state.nextId++,type:r.type,x:0,y:0,level:r.minLevel});
 state.villageXp=1e9;state.magic=1e9;
 check(treeGrowthStatus1257().ready,'ready at '+level);growWorldTree193();check(state.villageLv===level+1,'grow '+level);
}
check(treeGrowthStatus1257().capped,'max30');tests.push('World Tree Lv20 through Lv30 reachable; optional lots never required');
let b=fixture('artHut1260');const level=b.level,coins=state.coins;upgrade(b.id);check(b.level===level&&state.coins===coins,'no-upgrade gate');
b=fixture('starHouse1260');state.villageLv=21;upgrade(b.id);check(b.level===2,'new upgrade');upgrade(b.id);check(b.level===2,'new cap');
tests.push('No-upgrade enforcement and per-facility upgrade cap');
// Protected meals are consumed by residents, not a restaurant.
b=fixture('mealGarden1260');state.monsters=Array.from({length:10},(_,i)=>makeMonster(i+1,0,3,3));state.staff=[makeStaff(90,'gather',3,3)];state.food=0;
const ordinary=foodProduction.field(1.5);harvestMealGarden1260();close(state.mealReserve1260,ordinary,'garden equal-area production');check(state.food===0,'reserved first');
state.mealReserve1260=10;state.food=20;consumeResidentFood1260(12);check(state.mealReserve1260===0&&state.food===18,'resident reserve first');
state.mealReserve1260=mealCapacity1260();const held=state.mealReserve1260;harvestMealGarden1260();check(state.mealReserve1260===held&&state.food>18,'overflow to food');
save(true);const savedReserve=state.mealReserve1260;check(load()&&state.mealReserve1260===savedReserve,'reserve reload');
tests.push('Garden same-area yield, reserve consumption, overflow and save/reload');
// Real entrance/use/exit for all groups and hidden interiors.
for(const type of ['grandTheater1260','dropAquarium1260','starRestaurant1260','forestBakery1260']){
 b=fixture(type);state.hour=type==='forestBakery1260'?12:18;payTownUpkeep1260();
 const door=entranceRoads(b)[0],m=makeMonster(1,0,...door);state.monsters=[m];check(startTownVisit1260(m,b),'start monster '+type);
 for(let i=0;i<200&&plotWalks.get(m)?.phase!=='use';i++)stepTownVisits1260(.1);
 check(plotWalks.get(m)?.phase==='use'&&townActorHidden1260(m),'indoor hidden '+type);
 for(let i=0;i<300&&townVisits1260.has(m);i++)stepTownVisits1260(.1);
 check(!townVisits1260.has(m)&&!townActorHidden1260(m)&&residentRoad(Math.round(m.x),Math.round(m.y)),'exit '+type);
}
tests.push('Entrance, hidden interior and return to road in four commercial buildings');
// Staff slots and actual staffed purchases. Reroutes/caps never consume free materials.
b=fixture('starRestaurant1260');payTownUpkeep1260();let door=entranceRoads(b)[0];
state.staff=Array.from({length:5},(_,i)=>makeStaff(20+i,'sell',...door));
for(const w of state.staff)startTownVisit1260(w,b,true);
check([...townVisits1260.values()].filter(v=>v.worker).length===4,'restaurant worker limit');
for(let i=0;i<200;i++)stepTownVisits1260(.1);
check(townWorkers1260(b).length===4&&state.staff.slice(0,4).every(townActorHidden1260),'four indoor workers');
const guest={name:'客',fromOutside101:true,entered211:true,x:door[0],y:door[1],phase212:'leave',life:20};state.guests=[guest];
const food=state.food;check(townServe1260(guest,b)===240&&state.food===food-6,'meal purchase');
check(townServe1260(guest,b)===0&&state.food===food-6,'duplicate purchase');
state.mealReserve1260=100;state.food=0;check(townServe1260({...guest,townPurchases1260:[]},b)===0&&state.mealReserve1260===100,'reserve cannot be sold');
state.food=100;b.townCustomers1260=8;check(townServe1260({...guest,townPurchases1260:[]},b)===0&&state.food===100,'service cap stock protection');
state.hour=8;for(let i=0;i<200;i++)stepTownVisits1260(.1);check(townWorkers1260(b).length===0,'shift ends');
b=fixture('forestBakery1260');state.hour=12;payTownUpkeep1260();door=entranceRoads(b)[0];state.staff=Array.from({length:3},(_,i)=>makeStaff(30+i,'sell',...door));
for(const w of state.staff)startTownVisit1260(w,b,true);for(let i=0;i<200;i++)stepTownVisits1260(.1);
check(townWorkers1260(b).length===2,'bakery worker limit');state.materialStock211=MATERIALS211.map((_,i)=>i===0?6:0);ensureMaterials211();
const breadGuest={...guest,townPurchases1260:[]};const money=townServe1260(breadGuest,b);check(money>0&&state.materialStock211[0]===4&&state.food===98,'bread processing');
check(townServe1260({...guest,scenic12549:true,townPurchases1260:[]},b)===0,'scenic no revenue');
const beforeExpense=state.economy.expense;payTownUpkeep1260();check(state.economy.expense===beforeExpense,'once daily upkeep');state.day++;state.coins=0;payTownUpkeep1260();check(!townOperating1260(b),'no funds closes facility');
tests.push('4/2-worker shifts, meals/materials, no double sales, daily caps, upkeep and scenic visitors');
// A three-participant concert must never begin. The fourth must physically enter.
b=fixture('musicHall1260');door=entranceRoads(b)[0];state.monsters=Array.from({length:4},(_,i)=>makeMonster(40+i,0,...door));
for(const m of state.monsters.slice(0,3))startTownVisit1260(m,b);
for(let i=0;i<100;i++)stepTownVisits1260(.1);
check(townPresent1260(b).length===3&&!townConcerts1260.has(b),'no show for three');
startTownVisit1260(state.monsters[3],b);check(!townConcerts1260.has(b),'no show on reservation');
for(let i=0;i<100&&!townConcerts1260.has(b);i++)stepTownVisits1260(.1);
check(townConcerts1260.has(b)&&townPresent1260(b).every(a=>areaContains(b,a.x+.5,a.y+.5)),'four inside starts concert');
b.x++;stepTownVisits1260(.1);check(townVisits1260.size===0&&state.monsters.every(m=>!plotWalks.has(m)),'move cancels visit');
tests.push('Concert requires four actual arrivals; moving a facility releases all visitors');
// Longhouse reserves 5 separate places per species group and survives a sleeping reload.
b=fixture('starHouse1260');state.hour=22;door=entranceRoads(b)[0];
state.monsters=Array.from({length:6},(_,i)=>makeMonster(100+i,0,...door));
state.staff=Array.from({length:6},(_,i)=>makeStaff(120+i,'keeper',...door));
for(const m of state.monsters.slice(0,5)){check(startFacilityVisit(m,b,{pt:door,path:[]}),'house reservation');for(let i=0;i<100&&!m.indoorRest;i++)advanceFacilityVisit(m,.1);}
check(!homeHasRoom12545(state.monsters[5],b)&&homeHasRoom12545(state.staff[0],b),'separate five-place quotas');
for(const w of state.staff.slice(0,5)){w.jobTarget211={id:b.id,job:w.job,goal:door,rest:true};beginStaffWork212(w,b);for(let i=0;i<100&&!w.indoorRest;i++)progressStaffWork212(.1);}
check(!homeHasRoom12545(state.staff[5],b),'five citizen quota');
check(townActors1260().filter(a=>a.indoorRest?.buildingId===b.id).length===10,'ten lit arrivals');
save(true);check(load(),'sleeping reload');check(state.monsters.filter(a=>a.indoorRest).length===5&&state.staff.filter(a=>a.indoorRest).length===5,'sleeping residents restored');
check(facilityCountCap193('mealGarden1260',26)===1&&facilityCountCap193('mealGarden1260',27)===2,'second garden at27');
tests.push('Longhouse 5+5 seats, night arrivals and sleeping save/reload; garden unlock count');
b=fixture('visitorInfo1260');state.hour=12;door=entranceRoads(b)[0];state.staff=[makeStaff(150,'keeper',...door),makeStaff(151,'keeper',...door)];
state.staff.forEach(w=>startTownVisit1260(w,b,true));for(let i=0;i<100;i++)stepTownVisits1260(.1);check(townWorkers1260(b).length===1,'information worker cap');
const destination={id:200,type:'artHut1260',x:12,y:4,level:1,facing:0};state.buildings.push(destination);state.paths=state.paths.filter(k=>{const [x,y]=k.split(',').map(Number);return !areaContains(destination,x+.5,y+.5);});
const traveler={name:'案内を聞く旅人',fromOutside101:true,entered211:true,arrived211:true,x:door[0],y:door[1],phase212:'leave',life:20};state.guests=[traveler];check(startTownVisit1260(traveler,b),'information visitor');
for(let i=0;i<250&&townVisits1260.get(traveler)?.site!==destination;i++)stepTownVisits1260(.1);
check(townVisits1260.get(traveler)?.site===destination,'guided to new attraction');
tests.push('One information worker and real routed visit to a new attraction');
// Full scheduler smoke test, with the original roster retained during saves.
b=fixture('starRestaurant1260');payTownUpkeep1260();door=entranceRoads(b)[0];state.staff=Array.from({length:6},(_,i)=>makeStaff(50+i,'sell',...door));state.monsters=Array.from({length:6},(_,i)=>makeMonster(70+i,0,...door));
townPoll1260=0;for(let i=0;i<400;i++){stepActors(.1);if(i%60===0)save(true);}
check(state.staff.length===6&&state.monsters.length===6,'full scheduler preserves roster');
check(JSON.parse(readRanchSave12556()).staff.length===6,'saved roster complete');
check(townWorkers1260(b).length<=4,'integrated workforce cap');
save(true);check(load()&&state.staff.length===6&&state.monsters.length===6,'reload after active visits');
tests.push('Integrated scheduler and active-visit save/reload retain every resident');
state.speed=0;({tests});
