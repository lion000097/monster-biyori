// Rows 0–14 follow adventure areas. Row 15 is the world-tree sanctuary.
const adventureArt=new Image(),adventureGoal=new Image(),adventureChest=new Image();
const adventureSceneWidth=400,adventureSceneHeight=106,adventurePanWidth=608;
const adventureFallbackURI='';
if(adventureFallbackURI)adventureArt.addEventListener('error',()=>{
 adventureArt.src=adventureFallbackURI;
},{once:true});
adventureArt.src='';
adventureGoal.src='';
adventureChest.src='';
function drawAdventureBackground(g,stage,progress=0,raid=false){
 const sheetWidth=adventureArt.naturalWidth;
 if(!sheetWidth){
  g.fillStyle='#dae4c4';g.fillRect(0,0,adventureSceneWidth,adventureSceneHeight);return;
 }
 const row=raid?15:clamp(Math.floor((stage-1)/5),0,14);
 const height=adventureArt.naturalHeight/16;
 const width=Math.round(sheetWidth*adventureSceneWidth/adventurePanWidth);
 const pan=Math.round((sheetWidth-width)*clamp(progress,0,100)/100);
 g.drawImage(adventureArt,pan,row*height,width,height,0,0,adventureSceneWidth,adventureSceneHeight);
}
