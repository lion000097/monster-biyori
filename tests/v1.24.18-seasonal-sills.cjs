'use strict';
const {open,wait,assert}=require('./harness138.cjs');

const hook=`
window.qaSeasonalSills={
 ready:()=>facilitySheetReady,
 verify(){
  const check=(value,label)=>{if(!value)throw Error(label);};
  const home=state.buildings.find(b=>b.type==='home');
  check(home,'初期のハウス');
  const seasons=['春','夏','秋','冬'],art=seasons.map(homeSillArt);
  check(art.every((image,i)=>image===homeSillArt(seasons[i])),'絵は再利用する');
  check(!homeSillArt('未定義'),'未知の季節は描画しない');
  const points=[];
  ctx.save();
  try{
    ctx.setTransform(1,0,0,1,0,0);
    for(let face=0;face<4;face++){
      const images=new Set();
      for(const season of seasons){
        ctx.clearRect(0,0,128,128);
        drawHomeSill({x:0,y:0,w:128,h:128},face,season);
        const pixels=ctx.getImageData(0,0,128,128).data;
        let opaque=0;
        for(let i=3;i<pixels.length;i+=4)if(pixels[i])opaque++;
        check(opaque>=20&&opaque<=110,'窓辺だけに小さく表示：'+face+season);
        images.add(String(pixels));points.push(opaque);
      }
      check(images.size===4,'四季で異なる絵：'+face);
    }
  }finally{ctx.restore();}
  const original=ctx.drawImage,picked=[];
  ctx.drawImage=function(image,...args){
    if(art.includes(image))picked.push(seasons[art.indexOf(image)]);
    return original.call(this,image,...args);
  };
  const [oldDay,oldHour]=[state.day,state.hour];
  try{
    state.hour=12;
    for(const [day,expected] of [[1,'春'],[8,'夏'],[15,'秋'],[22,'冬'],[29,'春']]){
      state.day=day;picked.length=0;
      const serialized=JSON.stringify(state);
      drawLot(home,home.facing,home.level);
      check(picked.join()===expected,'カレンダー境界で切り替え：'+day);
      check(JSON.stringify(state)===serialized,'描画後もセーブ用状態が同じ');
    }
    picked.length=0;
    drawLot(home,home.facing,home.level,true);
    drawLot({id:9001,type:'inn',x:home.x,y:home.y,facing:0},0,1);
    check(!picked.length,'新築プレビューと宿には出ない');
  }finally{ctx.drawImage=original;state.day=oldDay;state.hour=oldHour;}
  return points;
 }
};
`;

(async()=>{
 const game=await open('working',{},hook);
 try{
  for(let i=0;i<80&&!game.w.qaSeasonalSills.ready();i++)await wait(25);
  assert(game.w.qaSeasonalSills.ready(),'building atlas decoded');
  const points=game.w.qaSeasonalSills.verify();
  console.log('PASS 4 seasons × 4 directions, calendar cycle, house-only layer, no save mutations',JSON.stringify(points));
 }finally{game.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
