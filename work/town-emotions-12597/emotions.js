const townFeelings97=new WeakMap();
let townFeelingRanch97,townFeelingLast97=-Infinity;
function showTownFeeling97(actor,kind,now=performance.now()){
 if(townFeelingRanch97!==state){townFeelingRanch97=state;townFeelingLast97=-Infinity;}
 const prior=townFeelings97.get(actor);
 if(!actor||!state.monsters.includes(actor)||actor.indoorRest||now-townFeelingLast97<450||
    (prior?.ranch===state&&now-prior.at<9000))return;
 townFeelings97.set(actor,{ranch:state,kind,at:now});townFeelingLast97=now;
}
function nearbySplashFeeling97(jumper,x,y){
 let nearest=null,distance=1.55;
 for(const other of state.monsters){
  if(other===jumper||other.indoorRest||plotWalks.has(other)||other.path?.length)continue;
  const play=monsterWalkTimers139.get(other)?.pastime;
  if(play?.kind==='nap'||play?.phase==='jump')continue;
  const gap=Math.hypot(other.x-x,other.y-y);
  if(gap<=distance){distance=gap;nearest=other;}
 }
 if(nearest)showTownFeeling97(nearest,'startle');
}
const townFeelingPixels97={
 joy:['...###.','...#.##','...#...','...#...','.###...','####...','.##....'],
 fond:['.##.##.','#..#..#','#.....#','.#...#.','..#.#..','...#...'],
 startle:['..##...','..##...','..##...','..##...','.......','..##...']
};
function drawTownFeeling97(o,x,top,now){
 const f=townFeelings97.get(o);
 if(f?.ranch!==state||now-f.at<0||now-f.at>=1050)return false;
 const y=Math.round(top-(o.shiny?31:21));
 ctx.save();ctx.globalAlpha*=Math.min(1,(1050-(now-f.at))/180);
 ctx.fillStyle='#465e55';ctx.fillRect(x-8,y,16,13);ctx.fillRect(x-1,y+13,3,2);
 ctx.fillStyle='#fffaf0';ctx.fillRect(x-7,y+1,14,11);ctx.fillRect(x,y+12,1,2);
 ctx.fillStyle=f.kind==='fond'?'#ba456a':f.kind==='joy'?'#276e65':'#965214';
 townFeelingPixels97[f.kind].forEach((row,j)=>{for(let i=0;i<row.length;i++)if(row[i]==='#')ctx.fillRect(x-3+i,y+3+j,1,1);});
 ctx.restore();return true;
}
