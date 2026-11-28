// Cache the ground beneath the camera. Actors, weather animation, selection and
// lot sprites still paint in their usual depth order every frame.
function groundStamp(season){
  return JSON.stringify([season,weatherInfo().name==='雨'?state.day:0,state.zones,state.paths,state.removedDefaultPaths,
    state.stoneTiles,state.ponds,state.clearedPonds,state.clearedScenery,state.buildings.map(b=>[b.type,b.x,b.y,b.w,b.h,b.facing])]);
}
let nearGround=null;
function drawNearGround(season,left,top,right,bottom,objects){
  const stamp=groundStamp(season);
  if(!nearGround||nearGround.stamp!==stamp||left<nearGround.left||top<nearGround.top||
      right>nearGround.right||bottom>nearGround.bottom){
    const pad=3*T,l=Math.floor(left/T)*T-pad,t=Math.floor(top/T)*T-pad;
    const r=Math.ceil(right/T)*T+pad,b=Math.ceil(bottom/T)*T+pad;
    const image=nearGround?.image||document.createElement('canvas');
    if(image.width!==r-l||image.height!==b-t){image.width=r-l;image.height=b-t;}
    const g=image.getContext('2d');g.setTransform(1,0,0,1,-l,-t);g.imageSmoothingEnabled=false;g.clearRect(l,t,r-l,b-t);
    const corners=[[l,t],[r,t],[l,b],[r,b]].map(([x,y])=>unprojectGround(x,y));
    const xs=corners.map(p=>p.x),ys=corners.map(p=>p.y),scenery=[];
    paintGround(g,season,{
      left:l,top:t,right:r,bottom:b,minX:Math.max(MIN_X,Math.floor(Math.min(...xs))-2),minY:Math.max(MIN_Y,Math.floor(Math.min(...ys))-2),
      maxX:Math.min(W,Math.ceil(Math.max(...xs))+3),maxY:Math.min(H,Math.ceil(Math.max(...ys))+3)
    },scenery);
    nearGround={image,scenery,stamp,left:l,top:t,right:r,bottom:b};
  }
  ctx.drawImage(nearGround.image,nearGround.left,nearGround.top);
  objects.push(...nearGround.scenery);
}
