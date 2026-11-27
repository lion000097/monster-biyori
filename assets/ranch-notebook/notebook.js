// Keys also identify the facility illustration shown after discovery.
const observationScenes80 = {
  flowerbed211: { title: '朝の水やり', hint: '晴れた朝、お花畑のそばに道を通してみよう。', detail: '仲間がお花畑に水をあげた。' },
  picnic257: { title: 'ふたりで分けるおやつ', hint: '晴れたお昼、敷物の近くに二匹が集まるかも。', detail: '二匹がピクニック敷物に集まって、おやつの時間が始まった。' },
  acornLamp: { title: 'どんぐりの灯', hint: '日が暮れたら、木の実の道標を見てみよう。', detail: 'どんぐりの道標灯が夜の道を照らした。', phase: 3 },
  birdClock: { title: '正午を告げる小鳥', hint: '木彫りの時計が昼の十二時を指すころ。', detail: 'からくり小鳥時計から小鳥が顔を出した。', phase: 1 },
  monsterPlayPlaza: { title: '広場の追いかけっこ', hint: '遊び広場の前に仲間がそろうと……。', detail: '仲間がそろい、まものの遊び広場で追いかけっこが始まった。' },
  crystalHanger: { title: '夕映えの水晶', hint: '午後の光が吊り飾りに届くころ。', detail: '西日の中で、吊り飾りの水晶がきらめいた。', phase: 1 },
  butterflyPool: { title: '水辺に来た蝶', hint: '晴れた日の明るい時間、小さな水場をのぞいてみよう。', detail: '温室の蝶の水場に蝶が集まった。', phase: 1 },
  rainHarp: { title: '竹から落ちる雨粒', hint: '雨の日、竹筒とつぼを置いた庭先で。', detail: '雨音の水琴窟に、竹の口からしずくが落ちた。', phase: 1 },
  artHut: { title: '小屋にかかった新作', hint: 'おえかき小屋に来た仲間が筆を置くまで待ってみよう。', detail: '仲間が描き終わり、おえかき小屋の絵が掛け替わった。' },
  rainPavilion: { title: '屋根の下で雨宿り', hint: '雨の日、道沿いの東屋に仲間を迎えよう。', detail: '仲間が雨やどりの東屋の軒下に入った。' },
  musicHall: { title: '牧場の小さな演奏会', hint: '音楽堂に歌い手と聴き手がそろうのを待とう。', detail: 'ちいさな音楽堂で仲間が歌い、みんながリズムを取り始めた。' },
  moonBasin: { title: '水盤に浮かぶ月', hint: '雨の降っていない夜、水面に空が映るよ。', detail: '月映しの水盤に月明かりが映った。', phase: 3 }
};

function loadObservationDays80(ranch) {
  const stored = ranch.observationDays80;
  const days = {};
  for (const key of Object.keys(observationScenes80)) {
    const day = stored?.[key];
    if (Number.isSafeInteger(day) && day >= 1 && day <= ranch.day) days[key] = day;
  }
  ranch.observationDays80 = days;
}

let observationSave80 = null;
function recordObservation80(key) {
  const ranch = state;
  if (ranch.observationDays80[key] || ranch.speed <= 0) return;
  ranch.observationDays80[key] = ranch.day;
  if (observationSave80 === ranch) return;
  observationSave80 = ranch;
  queueMicrotask(() => {
    if (observationSave80 !== ranch) return;
    observationSave80 = null;
    if (state === ranch) save(true);
  });
}

function observeTownPhase80(site) {
  const phase = observationScenes80[site.type]?.phase;
  if (phase !== undefined && !state.observationDays80[site.type] && phase75(site) === phase)
    recordObservation80(site.type);
}

function renderObservationBook80() {
  const days = state.observationDays80;
  const scenes = Object.entries(observationScenes80);
  const rows = scenes.map(([key, scene]) => {
    const day = days[key];
    const picture = day ? facilityThumbnail(key) : '<span aria-hidden="true">?</span>';
    const stamp = day ? '<small>初発見　'+day+'日目</small>' : '';
    return '<li data-observation="'+key+'" class="'+(day?'found':'unseen')+'"><div class="observation-art">'+picture+
      '</div><div><strong>'+(day?scene.title:'未発見')+'</strong>'+stamp+'<p>'+(day?scene.detail:scene.hint)+'</p></div></li>';
  }).join('');
  return '<section class="observation-book" aria-labelledby="observationTitle"><header><h3 id="observationTitle">牧場の観察手帳</h3>'+
    '<span>発見 '+Object.keys(days).length+' / '+scenes.length+'</span></header>'+
    '<p>牧場で起きた場面と、初めて見つけた日を記録するよ。遊んでいる間は、画面の外の出来事も自動で載るよ。</p><ol>'+rows+'</ol></section>';
}
