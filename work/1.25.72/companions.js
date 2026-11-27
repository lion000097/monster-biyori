// Positional IDs are saved in eggs, the ranch, the barn and the catalogue.
// Keep this list append-only. Each number is the hue rotation for that species.
const wildEggColors = [
  ['はねバチ',170], ['ドロリン',155], ['草むらキノコ',215], ['トゲまる',255], ['森の大ヌシ',210],
  ['ぬまカエル',230], ['モヤモヤ',145], ['いばらムシ',185], ['ミズヘビ',120], ['沼の女王',270],
  ['溶岩コウモリ',185], ['赤いゴーレム',205], ['炎の主',190], ['星の番人',105],
  ['ふぶきのヒツジ',135], ['氷のキツネ',130], ['スノードロップ',115], ['つららコウモリ',250],
  ['雪原の巨人',145], ['深海クラゲ',125], ['サンゴマジン',165], ['あわスライム',250],
  ['海流ウツボ',255], ['海の王竜',200], ['時計ムシ',178], ['宝箱の精',135],
  ['シロガネの騎士',165], ['夜光の番人',140], ['時の大魔王',190],
  ['ふわふわウサギ',295], ['きりかぶオオカミ',175], ['沼の大蛇',225], ['ようがんサソリ',190],
  ['ひかりのフクロウ',185], ['ほしぞらヘビ',130], ['氷晶ヒドラ',130], ['うみへび',165],
  ['しろがねバット',235], ['時計仕掛けのヘビ',165],
  ['木の葉アゲハ',215], ['松ぼっくりセンザンコウ',135], ['琥珀クワガタ',190],
  ['風切りツバメ',145], ['いなずまヤマネコ',210], ['避雷針ヤマアラシ',155],
  ['かがみサギ',145], ['月灯ホタル',185], ['睡蓮ナマズ',275],
  ['天球ミミズク',125], ['彗星イタチ',160], ['振り子グモ',165],
  ['たねぼうしウズラ',185], ['花びらアゲハ',150], ['ひなぎくコガネ',220],
  ['巻貝ヤドカリ',205], ['珊瑚タツノコ',150], ['夕くちばしパフィン',200],
  ['紫晶ヤモリ',150], ['炭火ガ',195], ['水晶カブト',155],
  ['氷耳ノウサギ',135], ['結晶ツノヤギ',200], ['松ぼっくりライチョウ',140],
  ['雲わたヒツジ',175], ['朝虹トンボ',145], ['星耳フェネック',215]
];
function wildShinySwatch(hex, degrees) {
  const [r,g,b]=hex.match(/../g).map(pair=>parseInt(pair,16));
  const value=Math.max(r,g,b), delta=value-Math.min(r,g,b);
  if(value<40)return hex;
  let hue=0;
  if(delta) {
    if(value===r)hue=(g-b)/delta;
    else if(value===g)hue=(b-r)/delta+2;
    else hue=(r-g)/delta+4;
  }
  hue=(hue+degrees/60+6)%6;
  // Tint pale fur as well as bright markings while keeping the darkest outline.
  const saturation=delta/value;
  const vivid=Math.min(.94, saturation*.90+(1-saturation)*.28);
  function channel(offset) {
    const k=(hue+offset)%6;
    return Math.round(value*(1-vivid*Math.max(0,Math.min(k,4-k,1)))).toString(16).padStart(2,'0');
  }
  return channel(5)+channel(3)+channel(1);
}
const ranchWildEggKinds=[];
for (const [kind,species] of SPECIES.entries()) {
  if (Number.isInteger(species.wildEnemy)) ENEMIES[species.wildEnemy].allyId ??= kind;
}
for (const [name,rotation] of wildEggColors) {
  const index=ENEMIES.findIndex(enemy=>enemy.name===name), enemy=ENEMIES[index];
  const slot=characterArt.enemies[name], cell=characterArt.cells[slot], swatches=cell[1].match(/.{6}/g);
  cell[2]=swatches.map(hex=>wildShinySwatch(hex,rotation)).join('');
  const id='wild_'+name, kind=SPECIES.length;
  const frontier=frontierAreas.find(area=>area.normal.includes(index)||area.boss===index);
  const ranchEgg=!frontier;
  const peerKind=frontier ? ENEMIES[frontier.normal[0]].allyId : ALLY_FROM_ENEMY171;
  const boss=enemy.boss || repeatEncounterAreas.some(area=>area.boss===index);
  // The fallback drawing also uses these colours before the indexed atlas is ready.
  const lightness=hex=>parseInt(hex.slice(0,2),16)*.299+parseInt(hex.slice(2,4),16)*.587+parseInt(hex.slice(4),16)*.114;
  swatches.sort((a,b)=>lightness(a)-lightness(b));
  SPECIES.push({id,name,emoji:enemy.icon,color:'#'+swatches[Math.floor(swatches.length/2)],
    dark:'#'+swatches[0],light:'#'+swatches.at(-1),accent:'#ffe7ab',wildEnemy:index,
    hatchFame:1+Math.floor(peerKind/10),
    earn:boss?10:ranchEgg?4:6,rarity:boss?'とてもレア':ranchEgg?'めずらしい':'レア',large:cell[0]>64});
  KIND_ELEMENTS.push(enemyElement(index));
  enemy.allyId=kind;
  characterArt.friends[id]=slot;
  if(ranchEgg)ranchWildEggKinds.push(kind);
}
