const adventureHpColors={
 ally:{bright:'#d9f2ae',fill:'#87c78d',shade:'#4c936f',well:'#293e3b'},
 foe:{bright:'#ffd7a0',fill:'#ef997c',shade:'#bc6261',well:'#48363e'}
};
function adventureHpWidth(hp,max,width){
 if(!(max>0&&hp>0))return 0;
 return Math.max(1,Math.round(width*clamp(hp/max,0,1)));
}
function paintAdventureHp(g,x,y,width,hp,max,palette,mini=false){
 const h=mini?5:8, inset=mini?1:2;
 const rect=(color,dx,dy,w,height)=>{g.fillStyle=color;g.fillRect(x+dx,y+dy,w,height)};
 const inner=width-2*inset, filled=adventureHpWidth(hp,max,inner);
 rect('#48393d',1,0,width-2,h);rect('#48393d',0,1,width,h-2);
 if(!mini){rect('#d7ad73',1,1,width-2,h-2);rect('#a37955',1,h-2,width-2,1)}
 rect(palette.well,inset,inset,inner,h-2*inset);
 if(filled){
  rect(palette.fill,inset,inset,filled,h-2*inset);
  rect(palette.bright,inset,inset,filled,1);
  rect(palette.shade,inset,h-inset-1,filled,1);
 }
}
function drawAdventureHpBadge(g,x,label,team,hp,max){
 const p=adventureHpColors[team],y=3;
 const rect=(color,dx,dy,w,h)=>{g.fillStyle=color;g.fillRect(x+dx,y+dy,w,h)};
 // A carved wood plaque with a sprout or flame in its brass end-cap.
 rect('#503e3a',2,0,140,18);rect('#503e3a',0,2,144,14);
 rect('#ad815b',2,1,140,15);rect('#523f3b',3,3,138,13);
 rect('#80614c',4,4,136,1);rect('#795641',3,15,138,1);
 rect('#59433d',1,3,15,13);rect('#cfaa72',3,2,11,13);rect('#f5d99c',3,2,11,1);
 rect('#4e5545',4,4,9,9);
 if(team==='ally'){
  rect('#b4d183',5,6,3,2);rect('#86b87e',6,8,3,2);rect('#ddedab',10,5,2,2);
  rect('#9dcd91',9,7,3,2);rect('#d9dfa6',8,9,1,3);
 }else{
  rect('#e6a377',8,5,2,3);rect('#e2876d',6,8,5,3);rect('#ffe3a1',8,8,2,3);
  rect('#b96d62',7,11,3,1);
 }
 g.font='bold 7px monospace';g.textAlign='left';g.fillStyle='#fff3cf';g.fillText(label,x+19,y+7);
 paintAdventureHp(g,x+17,y+8,124,hp,max,p);
}
