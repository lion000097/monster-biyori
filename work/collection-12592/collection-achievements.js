// Ver.1.25.92: collection milestones use the same IDs as the live catalogs.
function registerCollectionAchievements12592(){
  registerRelics192();
  const keys=items=>Array.from(items.keys());
  const count=(ids, seen)=>{
    const found=new Set(seen||[]);
    return ids.reduce((sum,id)=>sum+Number(found.has(id)),0);
  };
  const monsters=keys(SPECIES);
  // Old builds exposed more boss stages. Legacy relics remain in the save but
  // cannot help or block current completion. Current raid relics do count.
  const treasures=Object.entries(TREASURE_ITEMS)
    .filter(([,item])=>!item.bossStage||item.bossStage<=PUBLIC_ADVENTURE_END)
    .map(([id])=>Number(id));
  const materials=keys(MATERIALS211);
  const scenes=Object.keys(observationScenes80);
  const lands=keys(ZONES);
  const specs=[
    ['shiny25','虹を追いかけて','色違いを25種発見','🌈',25,()=>count(monsters,state.catalog.shinies)],
    ['equipment5','装備の目利き','装備を5種入手','🧰',5,()=>equipmentAtlasEntries12513().filter(x=>x.collected).length],
    ['adventureComplete12592','冒険の見届け人','冒険15-5のボスを撃破','⚔️',1,()=>Number(adventureComplete())],
    ['monsterComplete12592','モンスターコンプリート','モンスター図鑑をすべて埋める','🐾',monsters.length,()=>count(monsters,state.catalog.friends)],
    ['shinyComplete12592','色違いコンプリート','すべてのモンスターの色違いを発見','🌈',monsters.length,()=>count(monsters,state.catalog.shinies)],
    ['treasureComplete12592','お宝コンプリート','現在入手できるお宝をすべて発見','💎',treasures.length,()=>count(treasures,state.treasures)],
    ['equipmentComplete12592','装備コンプリート','装備図鑑の装備をすべて入手（型紙だけでは未達成）','🛡️',equipmentOrder12512.length,()=>equipmentAtlasEntries12513().filter(x=>x.collected).length],
    ['materialComplete12592','素材コンプリート','素材図鑑の素材をすべて発見','📦',materials.length,()=>count(materials,state.materialSeen211)],
    ['observationComplete12592','観察手帳コンプリート','牧場の観察手帳の出来事をすべて発見','📖',scenes.length,()=>scenes.reduce((sum,id)=>sum+Number((state.observationDays80?.[id]||0)>0),0)],
    ['ranchComplete12592','牧場コンプリート','世界樹Lv.30に到達し、全区画を開拓','🏡',lands.length+1,()=>count(lands,state.zones)+Number(state.villageLv>=PUBLIC_TREE_MAX)]
  ];
  for(const [id,name,info,icon,goal,progress] of specs){
    ACHIEVEMENTS193.push({id,name,info,icon,goal,progress});
  }
}
registerCollectionAchievements12592();
