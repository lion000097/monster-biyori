from pathlib import Path

HERE = Path(__file__).resolve().parent


def replace_once(text, old, new):
    if text.count(old) != 1:
        raise ValueError(f'Missing or ambiguous patch location: {old[:100]}')
    return text.replace(old, new)


def update_game(html):
    assert html.count('1.25.71') == 3
    html = html.replace('1.25.71', '1.25.72')
    html = replace_once(html, '花鈴の丘から暁の空庭へ</footer>', 'たまごから広がる仲間図鑑</footer>')
    anchor = 'characterArt.cells.push(...frontierCells.slice(frontierRelicSlot-frontierFirstSlot));'
    html = replace_once(html, anchor, anchor + '\n\n' + (HERE / 'companions.js').read_text())
    html = replace_once(html,
        '  if (Math.random() < .22) kind = ALLY_FROM_ENEMY171 + Math.floor(Math.random()*ALLY_FROM_ENEMY_META171.length);',
        '''  const wildRoll = Math.random();
  if (wildRoll < .22) kind = ALLY_FROM_ENEMY171 + Math.floor(Math.random()*ALLY_FROM_ENEMY_META171.length);
  else if (wildRoll < .42) kind = rnd(ranchWildEggKinds);''')
    html = replace_once(html,
        '  return foes.map(foe => ENEMIES[foe.index]).find(enemy => enemy?.allyId >= firstFrontierKind);',
        '  return ENEMIES[foes[0]?.index];')
    html = replace_once(html, '&& frontierEggEnemy(foes);', '&& frontierEggEnemy(journey12554.get(battle)?.fullFoes || foes);')
    html = replace_once(html, 'const frontierFriendIds=originalFrontierAreas.flatMap(area=>[...area.normal,area.boss])',
        'const frontierFriendIds=originalFrontierAreas.flatMap(area=>[area.normal[0],area.boss])')
    html = replace_once(html, 'エリア7〜10で仲間になる8種をすべて発見', 'エリア7〜10の各1面とボスで仲間になる8種をすべて発見')
    html = replace_once(html, 'エリア7〜10で仲間になる種の色違いを1種発見', 'エリア7〜10の各1面かボスの仲間で色違いを1種発見')
    html = replace_once(html,
        'エリア7〜15には、倒すとその種のたまごを残す敵がいるよ。各エリアのボスも仲間にできるよ。',
        'エリア1〜6と「過去の図鑑記録」の敵は、仕入れ・たまごの泉・探検・自動遠征のたまごから生まれるよ。エリア7〜15では、勝つとその面の先頭の敵のたまごを見つけることがあるよ。クリア済みの通常戦は「再訪する」から挑めるよ。ユグルのたまごはレイドで手に入るよ。')
    return html
