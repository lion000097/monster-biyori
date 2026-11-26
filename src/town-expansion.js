// Ver.1.26.0 — late-game town. All transient visits are derived, never saved.
const TOWN1260={
 bubblePot1260:{name:'シャボン玉のつぼ',icon:'🫧',unlock:15,w:1,h:1,cost:600,noUpgrade:true,decor:true,desc:'ときどき浮かぶ泡を仲間が鼻先でつつくよ。割れるとびっくり！'},
 artHut1260:{name:'おえかき小屋',icon:'🎨',unlock:16,w:2,h:2,cost:1800,noUpgrade:true,limit:3,desc:'仲間が足跡や世界樹の絵を描くよ。外に飾る絵も入れ替わるよ。'},
 rainGazebo1260:{name:'雨やどりの東屋',icon:'☂️',unlock:17,w:2,h:2,cost:2200,noUpgrade:true,limit:3,desc:'雨の日の待ち合わせ。後から来た子に場所を空け、濡れた体をぷるぷる。'},
 musicHall1260:{name:'ちいさな音楽堂',icon:'♪',unlock:18,w:3,h:3,cost:4200,noUpgrade:true,limit:2,desc:'敷地に4匹以上が集まると、一匹が歌い、みんながリズムを取るよ。'},
 glowMushrooms1260:{name:'光るきのこの群生',icon:'🍄',unlock:19,w:1,h:1,cost:900,noUpgrade:true,decor:true,desc:'夜になると淡く光るきのこ。光がゆっくり揺らぐよ。'},
 forestBakery1260:{name:'森のパン工房',icon:'🥖',unlock:20,w:2,h:2,cost:14000,limit:2,workers:2,upkeep:40,upgrade:2200,desc:'市民2人まで勤務。ごはん2個と普通素材2個でパンを作り、旅人に販売。営業時間7〜19時。'},
 starHouse1260:{name:'星あかりの長屋',icon:'🏘️',unlock:21,w:3,h:2,cost:18000,limit:3,upgrade:2600,desc:'市民5人・モンスター5匹まで。帰宅するたび窓に灯りがつくよ。Lv21・25・30で1軒ずつ。'},
 mealGarden1260:{name:'まかない菜園',icon:'🥬',unlock:22,w:2,h:3,cost:16000,limit:2,upgrade:2400,desc:'収穫を住人の食事1日分まで自動で取り置き。余りは通常のごはんに。Lv22・27で1か所ずつ。'},
 traderPost1260:{name:'旅商人の交易所',icon:'🧳',unlock:23,w:2,h:3,cost:4800,noUpgrade:true,limit:2,desc:'3日ごとの昼、旅商人がやって来て市民や旅人と品物を見せ合うよ。お金は発生しないよ。'},
 townHall1260:{name:'まちの集会所',icon:'🤝',unlock:24,w:2,h:3,cost:5200,noUpgrade:true,limit:2,desc:'仕事のない市民の待ち合わせ場所。おしゃべりした後、一緒におさんぽ。'},
 visitorInfo1260:{name:'旅人案内所',icon:'🗺️',unlock:25,w:2,h:2,cost:6500,noUpgrade:true,limit:2,workers:1,desc:'市民1人が勤務。立ち寄った旅人を、道がつながるお店や観光施設へ案内するよ。'},
 grandTheater1260:{name:'まもの大劇場',icon:'🎭',unlock:26,w:6,h:4,cost:48000,limit:1,upkeep:180,upgrade:6400,desc:'夕方に入口が灯り、みんなでミュージカル鑑賞。営業時間17〜23時。強化で評判アップ。'},
 festivalSquare1260:{name:'おまつり広場',icon:'🏮',unlock:27,w:5,h:5,cost:16000,noUpgrade:true,limit:1,upkeep:35,desc:'4日ごとの夕方に小さなお祭り。普段は憩いの広場。収入ボーナスはないよ。'},
 dropAquarium1260:{name:'しずくの水族館',icon:'🐠',unlock:28,w:6,h:4,cost:52000,limit:1,upkeep:220,upgrade:7000,desc:'波形の青い屋根と大きな水槽。営業時間8〜21時。強化で評判アップ。'},
 starRestaurant1260:{name:'星降るレストラン',icon:'🍽️',unlock:29,w:4,h:4,cost:42000,limit:2,workers:4,upkeep:140,upgrade:5800,desc:'市民4人まで勤務。ごはん6個を使った料理を旅人に提供。営業時間16〜24時、夜は人気。'}
};
for(const [type,spec] of Object.entries(TOWN1260)){
 B[type]={...spec,pixel:(spec.w+spec.h)*32,effect:spec.desc};
 if(spec.decor){DECOR211[type]=0;facilityRoles.decor.types.push(type);}
 else facilityRoles[spec.workers&&type!=='visitorInfo1260'?'trade':type==='mealGarden1260'?'production':type==='starHouse1260'||type==='rainGazebo1260'?'care':'tourism'].types.push(type);
 if(type!=='glowMushrooms1260')facilityActivities[type]=[spec.icon,spec.name+'で過ごしている'];
}
// Dedicated duties below support 4/2/1 workers without stealing the existing one-worker commerce slots.
const townCountBefore1260=facilityCountCap193;
facilityCountCap193=function(type,level=state.villageLv){
 const s=TOWN1260[type];if(!s)return townCountBefore1260(type,level);
 if(level<s.unlock)return 0;
 if(s.decor)return Infinity;
 if(type==='starHouse1260')return level>=30?3:level>=25?2:1;
 if(type==='mealGarden1260')return level>=27?2:1;
 return s.limit;
};
function townLevelCap1260(type,level=state.villageLv){
 const spec=B[type];
 if(spec?.noUpgrade)return 1;
 return spec?.upgrade?Math.min(5,2+Math.floor(Math.max(0,level-spec.unlock)/2)):facilityLevelCap193(level);
}
const townPriceBefore1260=ordinaryConstructionPrice1256;
ordinaryConstructionPrice1256=function(type){return TOWN1260[type]?.cost??townPriceBefore1260(type);};
const townUpgradeBefore1260=standardUpgradeCost;
standardUpgradeCost=function(b,base){return TOWN1260[b.type]?.upgrade?Math.round(TOWN1260[b.type].upgrade*(1+.65*(b.level-1))):townUpgradeBefore1260(b,base);};
const townFrontBefore1260=frontRoadOptional131;
frontRoadOptional131=function(type){return !!TOWN1260[type]?.decor||townFrontBefore1260(type);};
function mealCapacity1260(){return residentFoodPerHour12556(state.monsters.length,state.staff.length)*24+state.monsters.length*.1*3;}
function consumeResidentFood1260(amount){
 const reserved=Math.max(0,state.mealReserve1260||0),fed=reserved+state.food>=amount;
 const used=Math.min(reserved,amount);state.mealReserve1260=reserved-used;
 state.food=Math.max(0,state.food-(amount-used));return fed;
}
function harvestMealGarden1260(){
 const level=buildingLevel('mealGarden1260');if(!level)return;
 const farm=buildingLevel('farm');
 // Exactly the marginal yield of 1.5 ordinary 2x2 fields per 2x3 garden.
 const qty=Math.max(0,foodProduction.field(farm+level*1.5)-foodProduction.field(farm));
 const held=Math.max(0,state.mealReserve1260||0),reserved=Math.min(qty,Math.max(0,mealCapacity1260()-held));
 state.mealReserve1260=held+reserved;state.metrics.food+=reserved;gainFood(qty-reserved);
}
const townFoodMultiplier1260=foodReserveMultiplier1256;
foodReserveMultiplier1256=function(ranch=state){return townFoodMultiplier1260({...ranch,food:ranch.food+(ranch.mealReserve1260||0)});};
const townLoadBefore1260=load;
load=function(){
 const ok=townLoadBefore1260();if(ok){
  state.mealReserve1260=Number.isFinite(state.mealReserve1260)?Math.max(0,state.mealReserve1260):0;
  for(const b of state.buildings)if(TOWN1260[b.type]){
   if(B[b.type].noUpgrade)b.level=1;
   b.townServiceDay1260=Number.isInteger(b.townServiceDay1260)?b.townServiceDay1260:0;
   b.townPaidDay1260=Number.isInteger(b.townPaidDay1260)?b.townPaidDay1260:0;
  }
 }return ok;
};
function townOpen1260(type,hour=state.hour){
 if(type==='grandTheater1260')return hour>=17&&hour<23;
 if(type==='dropAquarium1260')return hour>=8&&hour<21;
 if(type==='starRestaurant1260')return hour>=16;
 if(type==='forestBakery1260')return hour>=7&&hour<19;
 if(type==='visitorInfo1260')return hour>=7&&hour<21;
 return hour>=6&&hour<21;
}
function townFestival1260(){return state.day%4===0&&state.hour>=17&&state.hour<22;}
function townTrader1260(){return state.day%3===0&&state.hour>=10&&state.hour<17;}
function townUpkeep1260(b){return Math.round((TOWN1260[b.type]?.upkeep||0)*(1+.12*(b.level-1)));}
function payTownUpkeep1260(){
 for(const b of state.buildings){
  if(!TOWN1260[b.type]?.upkeep||b.townPaidDay1260===state.day)continue;
  const price=townUpkeep1260(b);
  if(state.coins<price)continue; // Closed until the entire day's operation can be paid, no debt.
  state.coins-=price;bookExpense(price);b.townPaidDay1260=state.day;
 }
}
const townTickBefore1260=tick;
tick=function(silent=false){townTickBefore1260(silent);payTownUpkeep1260();};
function townOperating1260(b){return !TOWN1260[b.type]?.upkeep||b.townPaidDay1260===state.day;}
const townHallWaiting1260=new WeakMap();
const townVisits1260=new Map(),townCooldown1260=new WeakMap(),townConcerts1260=new WeakMap(),townConcertNext1260=new WeakMap();
let townRanch1260=null,townClock1260=0,townPoll1260=0;
function townActors1260(){return [...state.monsters,...state.staff,...state.guests];}
function townPresent1260(b){return townActors1260().filter(a=>plotWalks.get(a)?.site===b&&plotWalks.get(a)?.phase==='use');}
function townWorkers1260(b){return state.staff.filter(w=>townVisits1260.get(w)?.worker&&plotWalks.get(w)?.site===b&&plotWalks.get(w)?.phase==='use');}
function townActorHidden1260(a){
 const walk=plotWalks.get(a);if(walk?.phase!=='use')return false;
 const visit=townVisits1260.get(a),type=walk.site.type;
 return ['grandTheater1260','dropAquarium1260','starRestaurant1260','forestBakery1260'].includes(type)||!!(visit?.worker&&type==='visitorInfo1260');
}
function townFree1260(a){
 if(townVisits1260.has(a)||a.indoorRest||a.expeditionVisit||a.ranchTarget200||a.jobTask212||a.jobTarget211||a.path?.length||plotWalks.has(a)||ranchActors124.has(a)||greetings.has(a)||townClock1260<(townCooldown1260.get(a)||0))return false;
 if(a.kind!==undefined){const t=monsterWalkTimer139(a);if(t.visit||t.pastime||t.needsRanch)return false;}
 if(a.fromOutside101&&!['scenic12549','leave','sightseeing','detour'].includes(a.phase212))return false;
 return residentRoad(Math.round(a.x),Math.round(a.y));
}
function townSeats1260(b){return b.type==='musicHall1260'?6:b.type==='festivalSquare1260'?14:b.type==='rainGazebo1260'?5:b.type==='townHall1260'?6:8;}
function startTownVisit1260(actor,site,worker=false){
 if(!townFree1260(actor)||!townOperating1260(site)||!state.buildings.includes(site))return false;
 if([...townVisits1260.values()].filter(v=>v.site===site&&v.worker===worker).length>=(worker?TOWN1260[site.type].workers:townSeats1260(site)))return false;
 let route=null;
 for(const door of entranceRoads(site)){
  const distance=Math.hypot(actor.x-door[0],actor.y-door[1]);
  const path=pathTo(actor.x,actor.y,...door,true);
  if((distance>.3&&!path.length)||path.length>60)continue;
  if(!route||path.length<route.path.length)route={door,path};
 }
 if(!route)return false;
 const v={site,x:site.x,y:site.y,facing:validFacing(site.facing),door:route.door,route:route.path.slice(),worker,elapsed:0,total:0,served:false};
 townVisits1260.set(actor,v);actor.path=[];actor.facilityDoor=[...v.door];actor.act=site.type==='bubblePot1260'?'泡を見つけた':B[site.type].name+'へ';
 return true;
}
function endTownVisit1260(a,v,cancel=false){
 if(cancel){cancelPlotWalk(a);if(!residentRoad(Math.round(a.x),Math.round(a.y))){const p=nearestResidentRoad(...v.door);if(p)Object.assign(a,p);}}
 townVisits1260.delete(a);delete a.facilityDoor;townCooldown1260.set(a,townClock1260+(v.worker?2:12));
 a.act=a.kind!==undefined?'🐾 おさんぽ':a.job?'待機中':'観光中';
 if(!cancel&&v.site.type==='townHall1260'&&a.job){
  const friend=townHallWaiting1260.get(v.site);
  if(friend&&friend!==a&&state.staff.includes(friend)&&!friend.jobTarget211&&!friend.jobTask212&&!plotWalks.has(friend)){
   const route=monsterRoute139(a,[null],5);
   if(route){const path=pathTo(friend.x,friend.y,...route.pt,true);if(path.length){a.path=route.path;friend.path=path;a.act=friend.act='待ち合わせした友だちとおさんぽ';townCooldown1260.set(friend,townClock1260+20);}}
   townHallWaiting1260.delete(v.site);
  }else{townHallWaiting1260.set(v.site,a);staffPlanWait.set(a,10);}
 }
 if(a.fromOutside101){
  a.arrived211=true;
  if(v.site.type==='visitorInfo1260'&&townWorkers1260(v.site).length){
   const sites=state.buildings.filter(b=>b!==v.site&&(guestDetourTypes.has(b.type)||['shop','tower'].includes(b.type)||
    (TOWN1260[b.type]&&!['starHouse1260','mealGarden1260','glowMushrooms1260','bubblePot1260','townHall1260'].includes(b.type)&&townOpen1260(b.type))));
   townCooldown1260.set(a,0);
   const start=Math.floor(Math.random()*sites.length);
   for(let i=0;i<sites.length;i++){const b=sites[(start+i)%sites.length];if(TOWN1260[b.type]?startTownVisit1260(a,b):planGuestDetour(a,b))return;}
  }
  beginReturn212(a);
 }
}
function townServe1260(a,b){
 if(!a.fromOutside101||a.scenic12549===true||!townOpen1260(b.type)||!townOperating1260(b)||!townCanServe1260(b))return 0;
 // At most one purchase per customer per facility per game day, also after reload.
 const visits=a.townPurchases1260||[];
 const key=state.day+':'+b.id;if(visits.includes(key))return 0;
 let price=0;
 if(b.type==='grandTheater1260')price=100+20*b.level;
 if(b.type==='dropAquarium1260')price=90+20*b.level;
 if(b.type==='starRestaurant1260'){
  if(!townWorkers1260(b).length||state.food<6)return 0;
  price=200+40*b.level;state.food-=6;
 }
 if(b.type==='forestBakery1260'){
  if(!townWorkers1260(b).length||state.food<2)return 0;
  ensureMaterials211();
  const id=MATERIALS211.findIndex((m,i)=>m[3]==='N'&&spendableMaterial(i)>=2);
  if(id<0)return 0;
  // A modest 15% processing premium over selling the same common materials.
  price=Math.round(2*ranchIncome(MATERIALS211[id][4]*shopPriceMultiplier(b.level)*(9+.095*Math.sqrt(Math.max(0,state.fame)))*researchMultiplier('market'))*1.15)+8;
  spendMaterials211(2,id);state.food-=2;
 }
 if(!price)return 0;
 if(b.townServiceDay1260!==state.day){b.townServiceDay1260=state.day;b.townCustomers1260=0;}
 // Bound income independently of visitor count, reroutes and frame rate.
 const limit=b.type==='starRestaurant1260'?8:b.type==='forestBakery1260'?12:10;
 if((b.townCustomers1260||0)>=limit){
  return 0;
 }
 a.townPurchases1260=visits.filter(k=>k.startsWith(state.day+':')).concat(key);
 b.townCustomers1260=(b.townCustomers1260||0)+1;b.townSales1260=(b.townSales1260||0)+price;
 gainCoins(price);return price;
}
function townCanServe1260(b){return b.townServiceDay1260!==state.day||(b.townCustomers1260||0)<(b.type==='starRestaurant1260'?8:b.type==='forestBakery1260'?12:10);}
function townUse1260(a,v){
 const b=v.site,type=b.type;
 if(!v.worker&&townCanServe1260(b))v.served=townServe1260(a,b)>0;
 if(type==='artHut1260'&&a.kind!==undefined)b.townPicture1260=((b.townPicture1260||0)+1)%3;
 a.act=v.worker?B[type].name+'で勤務中':facilityActivities[type]?.[1]||B[type].name;
}
function stepTownVisits1260(dt){
 const actors=new Set(townActors1260());
 for(const [a,v] of townVisits1260){
  const b=v.site;v.total+=dt;
  if(!actors.has(a)||!state.buildings.includes(b)||b.x!==v.x||b.y!==v.y||validFacing(b.facing)!==v.facing||!residentRoad(...v.door)||!townOperating1260(b)){
   endTownVisit1260(a,v,true);continue;
  }
  a.life=a.fromOutside101?Math.max(3,a.life||3):a.life;
  if(v.route.length){
   if(v.total>90||v.route.some(p=>!residentRoad(...p))){endTownVisit1260(a,v,true);continue;}
   walkPlotLeg(a,v.route,dt);continue;
  }
  const walk=plotWalks.get(a);
  if(walk?.phase==='use'){
   v.elapsed+=dt;
   if(v.worker&&townOpen1260(b.type))walk.remaining=2;
   if(b.type==='musicHall1260'){
    const show=townConcerts1260.get(b);
    if(!show&&v.elapsed<35&&townClock1260>=(townConcertNext1260.get(b)||0))walk.remaining=2;
    if(show&&townClock1260-show.start<8)walk.remaining=2;
   }
   if(b.type==='townHall1260'&&v.elapsed<10&&townPresent1260(b).length<2)walk.remaining=2;
   if(v.worker&&!townOpen1260(b.type))walk.remaining=0;
  }
  const phase=stepPlotWalk(a,b,v.door,dt,v.worker?8:b.type==='musicHall1260'?10:b.type==='rainGazebo1260'?14:9,()=>townUse1260(a,v));
  if(phase==='done'||phase==='cancelled')endTownVisit1260(a,v,phase==='cancelled');
 }
 for(const b of state.buildings.filter(b=>b.type==='musicHall1260')){
  const people=townPresent1260(b).filter(a=>areaContains(b,a.x+.5,a.y+.5));
  const show=townConcerts1260.get(b);
  if(show&&(people.length<4||townClock1260-show.start>=10)){townConcerts1260.delete(b);townConcertNext1260.set(b,townClock1260+18);}
  else if(!show&&people.length>=4&&townClock1260>=(townConcertNext1260.get(b)||0)){townConcerts1260.set(b,{start:townClock1260,singer:people.find(a=>a.kind!==undefined)||people[0]});}
 }
}
function townPick1260(site,actors,worker=false,maximum=1){
 const sorted=actors.filter(townFree1260).sort((a,b)=>Math.hypot(a.x-site.x,a.y-site.y)-Math.hypot(b.x-site.x,b.y-site.y));
 let n=0;for(const a of sorted)if(startTownVisit1260(a,site,worker)&&++n>=maximum)break;
 return n;
}
function planTown1260(){
 const sites=state.buildings.filter(b=>TOWN1260[b.type]&&entranceRoads(b).length&&townOperating1260(b));
 for(const b of sites){
  const type=b.type,spec=TOWN1260[type];
  if(spec.workers&&townOpen1260(type)){
   const assigned=[...townVisits1260.values()].filter(v=>v.site===b&&v.worker).length;
   if(assigned<spec.workers)townPick1260(b,state.staff,true,spec.workers-assigned);
  }
  if(type==='glowMushrooms1260'||type==='mealGarden1260'||type==='starHouse1260')continue;
  if(type==='traderPost1260'&&!townTrader1260())continue;
  if(type==='rainGazebo1260'&&weatherInfo().name!=='雨')continue;
  if(['grandTheater1260','dropAquarium1260','forestBakery1260','starRestaurant1260','visitorInfo1260'].includes(type)&&!townOpen1260(type))continue;
  if(phase213(state.hour)==='sleep'&&!['grandTheater1260','starRestaurant1260','festivalSquare1260'].includes(type))continue;
  let actors=type==='townHall1260'?state.staff:type==='bubblePot1260'||type==='artHut1260'?state.monsters:type==='traderPost1260'||type==='visitorInfo1260'?[...state.staff,...state.guests]:townActors1260();
  if(type==='forestBakery1260')actors=state.guests;
  if(type==='starRestaurant1260'&&state.hour>=18)actors=actors.slice().sort((a,b)=>Number(!!b.fromOutside101)-Number(!!a.fromOutside101));
  const capacity=type==='musicHall1260'?6:type==='festivalSquare1260'&&townFestival1260()?12:2;
  if(type==='bubblePot1260'&&Math.floor(townClock1260+b.id)%12>3)continue;
  townPick1260(b,actors,false,capacity);
 }
}
const townStepBefore1260=stepActors;
stepActors=function(dt){
 if(state.speed<=0)return townStepBefore1260(dt);
 if(townRanch1260!==state){townVisits1260.clear();townRanch1260=state;townClock1260=0;townPoll1260=0;}
 townClock1260+=dt;stepTownVisits1260(dt);
 if((townPoll1260-=dt)<=0){townPoll1260=1.5;payTownUpkeep1260();planTown1260();}
 townStepBefore1260(dt);
};
// Drawn activities use the same simulation clock as movement and pause with it.
function townActorPose1260(a,now){
 const v=townVisits1260.get(a),walk=plotWalks.get(a);if(!v||walk?.phase!=='use')return null;
 const type=v.site.type,t=v.elapsed;
 if(type==='bubblePot1260')return {dx:t<2?Math.round(3*Math.sin(t*1.5)):0,dy:t>=2&&t<2.6?-Math.round(6*Math.sin((t-2)*Math.PI/.6)):0};
 if(type==='rainGazebo1260'){
  const arriving=[...townVisits1260].some(([other,r])=>other!==a&&r.site===v.site&&r.elapsed>0&&r.elapsed<2);
  return {dx:t<1.6?Math.round(3*Math.sin(t*22)):arriving?Math.round(5*Math.sin((a.id||0)+1)):0,dy:0};
 }
 if(type==='musicHall1260'&&townConcerts1260.has(v.site)||type==='festivalSquare1260'&&townFestival1260())return {dx:0,dy:-Math.round(4*Math.abs(Math.sin(now/180+(a.id||0))))};
 return null;
}
const townDrawActorBefore1260=drawMapActor;
drawMapActor=function(a,monster,now,star,origin){
 townDrawActorBefore1260(a,monster,now,star,origin);
 const v=townVisits1260.get(a);if(!v||plotWalks.get(a)?.phase!=='use'||townActorHidden1260(a))return;
 const p=projectGround(a.x+.5,a.y+.5),type=v.site.type,show=townConcerts1260.get(v.site);
 let icon=type==='bubblePot1260'&&v.elapsed>=2&&v.elapsed<3.6?'‼️':type==='artHut1260'?'🎨':type==='musicHall1260'&&show?(show.singer===a?'♫':'♪'):type==='festivalSquare1260'&&townFestival1260()?'♪':type==='townHall1260'?'…':type==='rainGazebo1260'&&v.elapsed<2?'💧':type==='traderPost1260'?'📦':null;
 if(icon)drawMapBubble(p.x,p.y-39,icon,now,a.id||0);
};
// Keep the generic monster/guest itinerary from selecting closed or passive lots.
const townChooseBefore1260=chooseFacilityVisit;
chooseFacilityVisit=function(m,timer,phase){
 const activities=Object.fromEntries(Object.keys(TOWN1260).filter(t=>t!=='starHouse1260').map(t=>[t,facilityActivities[t]]));
 for(const t of Object.keys(activities))delete facilityActivities[t];
 try{return townChooseBefore1260(m,timer,phase);}finally{for(const [t,a] of Object.entries(activities))if(a)facilityActivities[t]=a;}
};
const townPlotBefore1260=beginPlotWalk;
beginPlotWalk=function(a,b,door,seconds){
 const v=townPlotBefore1260(a,b,door,seconds);if(!v||!townVisits1260.has(a))return v;
 const used=[...townVisits1260].filter(([other,r])=>other!==a&&r.site===b).map(([other])=>plotWalks.get(other)?.townSeat1260).filter(n=>n!==undefined);
 let seat=0;while(used.includes(seat))seat++;
 v.townSeat1260=seat;
 if(!townActorHidden1260(a)){
  const across=.22+(seat%3)*.28,depth=.55+Math.floor(seat/3)*.55;
  const pt=frontPoint(b.type,b.x,b.y,b.facing,across,-Math.min(depth,(b.facing%2?b.w:b.h)-.25)).map(n=>n-.5);
  v.points.push(pt);v.out=v.points.slice(0,-1).reverse().concat([[...door]]);
 }
 return v;
};
const townPreviewBefore1260=buildingUpgradePreview;
buildingUpgradePreview=function(b){
 const s=TOWN1260[b?.type];if(!s)return townPreviewBefore1260(b);
 const cap=townLevelCap1260(b.type),fee=townUpkeep1260(b),workers=s.workers?'<br>勤務中 '+townWorkers1260(b).length+' / '+s.workers+'人':'';
 return '<p>'+esc(s.desc)+workers+(s.upkeep?'<br>運営費 '+fee.toLocaleString('ja-JP')+'G／日（'+(townOperating1260(b)?'支払済み':'資金不足のため休業')+'）':'')+
  (s.noUpgrade?'<br>強化なし・世界樹の成長条件には入りません。':'<br>強化上限 Lv.'+cap+'。強化ごとに評判と世界樹XPが上がります。')+
  (b.type==='mealGarden1260'?'<br>食事用の取り置き '+Math.floor(state.mealReserve1260||0)+' / '+Math.ceil(mealCapacity1260())+'個。同面積のおやつ畑と同じ生産効率。':'')+
  (s.upkeep&&b.type!=='festivalSquare1260'?'<br>累計売上 '+Math.floor(b.townSales1260||0)+'G。観光専用の旅人は売上を生みません。':'')+'</p>';
};
const townBudgetBefore1260=foodBalanceCard12556;
foodBalanceCard12556=function(){return townBudgetBefore1260()+(buildingLevel('mealGarden1260')||state.mealReserve1260?'<div class="info-card">🥬 食事の取り置き '+Math.floor(state.mealReserve1260||0)+' / '+Math.ceil(mealCapacity1260())+'個<br>住人の食事に先に使います。注文や料理では消費しません。</div>':'');};
