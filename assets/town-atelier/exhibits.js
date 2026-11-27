// A shelf shows the selected collection item; changing a display must also
// invalidate its drawing after a save is reopened or a material sheet loads.
function exhibition(type,site){
 if(!site)return {key:''};
 if(type==='eggWatch'){
   const eggs=[...state.eggs].sort((a,b)=>b.time/b.need-a.time/a.need).slice(0,3);
   const bits=eggs.reduce((n,e,i)=>n|(Number(!!e.shiny)<<i),0);return {key:'e'+bits,eggs:bits};
 }
 if(type==='openGallery'||type==='starChart'||type==='nightHide'){
   const picture=type==='openGallery'?site.picture75:site.chart75;
   return {key:'p'+(picture??''),picture};
 }
 if(type==='amberShelf'||type==='stoneStudy'){
   const seen=state.materialSeen211||[];
   const minerals=type==='stoneStudy'?seen.filter(id=>/石|晶|鉱|琥珀|宝玉|かけら/.test(MATERIALS211[id]?.[1])):[];
   const id=type==='amberShelf'?site.material75:minerals[state.day%minerals.length];
   if(!Number.isInteger(id)||!seen.includes(id)||!exhibitMaterialSheet75.naturalWidth)return {key:''};
   const sheet=exhibitMaterialSheet75,cell=sheet.naturalWidth/6;
   return {key:'m'+id,source:[sheet,id%6*cell,Math.floor(id/6)*cell,cell,cell],anchor:type==='amberShelf'?[17,9.4,12.75]:[18.4,26.0,8.9],size:11};
 }
 if(type==='playBill'||type==='maskStall'||type==='backStage'){
   const ids=state.catalog.friends,id=state.buildings.find(b=>b.type==='backStage')?.cast75??ids[state.day%ids.length];
   if(!SPECIES[id])return {key:''};
   const anchor=type==='playBill'?[8.1,8.65,8.25]:type==='maskStall'?[16.8,20.4,9.0]:[35.4,18.25,12.8];
   return {key:'c'+id,source:[spriteMonsterHD(id,false)],anchor,size:type==='maskStall'?9:12};
 }
 return {key:''};
}
