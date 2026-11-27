"""Apply the same egg-source changes to the web and unpacked launcher games."""


def replace_once(text, old, new):
    if text.count(old) != 1:
        raise ValueError(f'Missing or ambiguous patch location: {old[:100]}')
    return text.replace(old, new)


def update_game(html):
    assert html.count('1.25.72') == 3
    html = html.replace('1.25.72', '1.25.73')
    html = replace_once(html, '''function canRepeatBoss(stage,a=state.adventure) {
  return Number.isSafeInteger(stage)&&stage>=5&&stage<=PUBLIC_ADVENTURE_END&&stage%5===0&&stage<a.stage;
}''', '''function isAdventureBossStage(stage) {
  return Number.isSafeInteger(stage)&&stage>=5&&stage<=PUBLIC_ADVENTURE_END&&stage%5===0;
}
function canRepeatBoss(stage,a=state.adventure) {
  return isAdventureBossStage(stage)&&stage<a.stage;
}''')
    html = replace_once(html, "if(frontierAreaForStage(stage))keys.push('egg','shiny');",
                        "if(isAdventureBossStage(stage))keys.push('egg','shiny');")
    html = replace_once(html, 'const frontierBossEggRate = .34, frontierWildEggRate = .08;',
                        'const adventureBossEggRate = .34, frontierWildEggRate = .08;')
    html = replace_once(html, '''function frontierEggEnemy(foes) {
  return ENEMIES[foes[0]?.index];
}
function awardBattleEgg(battle) {
  // Areas 1–6 no longer award random eggs on any boss victory.
  if (battle.boss && battle.stage >= 5 && battle.stage <= 30 && battle.stage % 5 === 0) return;
  if (!frontierAreaForStage(battle.stage)) {
    if (battle.boss && chance(frontierBossEggRate)) newEgg(true);
    return;
  }
  const enemy = frontierEggEnemy(battle.foes);
  if (!enemy || !chance(battle.boss ? frontierBossEggRate : frontierWildEggRate)) return;''',
        '''function adventureEggEnemy(stage, foes) {
  if (!isAdventureBossStage(stage) && !frontierAreaForStage(stage)) return null;
  return ENEMIES[foes[0]?.index];
}
function awardBattleEgg(battle) {
  if (battle.raid) return;
  const enemy = adventureEggEnemy(battle.stage, battle.foes);
  if (!Number.isInteger(enemy?.allyId)) return;
  if (!chance(battle.boss ? adventureBossEggRate : frontierWildEggRate)) return;''')
    html = replace_once(html,
        'const eggFoe=!battle?.raid && frontierAreaForStage(n) && frontierEggEnemy(journey12554.get(battle)?.fullFoes || foes);',
        'const eggFoe=!battle?.raid && adventureEggEnemy(n, journey12554.get(battle)?.fullFoes || foes);')
    html = replace_once(html, 'const ranchWildEggKinds=[];',
        '''// Only bosses that can actually be fought have exclusive victory eggs.
const adventureBossEnemies=new Set(namedEncounterAreas.map(area=>area.boss));
const ranchWildEggKinds=[];''')
    html = replace_once(html, '  const ranchEgg=!frontier;\n', '')
    html = replace_once(html, '  const boss=enemy.boss || repeatEncounterAreas.some(area=>area.boss===index);',
                        '  const boss=enemy.boss || adventureBossEnemies.has(index);')
    html = replace_once(html, "earn:boss?10:ranchEgg?4:6,rarity:boss?'とてもレア':ranchEgg?'めずらしい':'レア'",
                        "earn:boss?10:frontier?6:4,rarity:boss?'とてもレア':frontier?'レア':'めずらしい'")
    html = replace_once(html, '  if(ranchEgg)ranchWildEggKinds.push(kind);',
                        '  if(!adventureBossEnemies.has(index))ranchWildEggKinds.push(kind);')
    html = replace_once(html, '満杯のときに職員の探検や自動遠征、エリア7〜15の戦闘で色違いを見つけると',
                        '満杯のときに市民の探検・自動遠征・冒険で色違いのたまごを見つけると')
    html = replace_once(html,
        'エリア1〜6と「過去の図鑑記録」の敵は、仕入れ・たまごの泉・探検・自動遠征のたまごから生まれるよ。エリア7〜15では、勝つとその面の先頭の敵のたまごを見つけることがあるよ。クリア済みの通常戦は「再訪する」から挑めるよ。ユグルのたまごはレイドで手に入るよ。',
        'エリア7〜15の各2〜4面の27種は、仕入れ・たまごの泉・探検・自動遠征のたまごからも生まれるよ。「過去の図鑑記録」の仲間もこの4つの入手先で見つかるよ。エリア7〜15の通常戦では勝つと${Math.round(frontierWildEggRate*100)}％で先頭の敵のたまごが手に入るよ。クリア済みの面は「再訪する」で選べるよ。</p><p>エリア1〜15の各5面では、ボスを倒すと${Math.round(adventureBossEggRate*100)}％でそのボスのたまごを発見。色違いも生まれるよ。ボス周回の終了条件で「通常のたまご」か「色違いのたまご」を選べるよ。ユグルのたまごはレイドで手に入るよ。')
    return html
