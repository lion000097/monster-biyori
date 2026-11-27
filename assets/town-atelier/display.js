const movingDesigns=new Set(['eggWatch','starDial','birdClock','acornLamp','jarHut','crystalHanger','fossilSand','butterflyPool','seedSwap','returnBell','windSock','openGallery','paintSink','pawStamp','rainHarp','umbrellaHut','leafGutter','mossPath','spiritChime','grainMill','breadShelf','laundry','starLine','scarecrow','pickingBaskets','routeMap','birdScore','traderTent','rugShop','pondWindow','lanternLine','moonBasin','menuWindow']);
const pictures=new Map();
function draw(type,facing,phase=0,site=null){
 const spec=villageAdditions75[type],variation=movingDesigns.has(type)?phase:0;
 const key=type+'/'+facing+'/'+variation;
 const item=exhibition(type,site),cached=pictures.get(key);
 if(cached&&cached.item===item.key)return cached.canvas;
 const k=workshop(spec,facing,variation);
 k.item=item;
 if(spec.role!=='decor'){k.floor();k.r.setScale(1.12,1.24);}
 else if(type!=='shellChannel')k.r.setScale(1.07,1.12);
 const plan=spec.unlock<=13?earlyVillage:spec.unlock<=21?middleVillage:highVillage;
 plan(type,k,furnishings(k));
 k.r.exhibit(item);
 const canvas=k.r.finish();pictures.set(key,{item:item.key,canvas});return canvas;
}
return draw;
