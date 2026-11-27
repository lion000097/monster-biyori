from pathlib import Path

HERE = Path(__file__).resolve().parent


def once(source, old, new):
    if source.count(old) != 1:
        raise ValueError(f'Unexpected number of anchors for {old[:90]}')
    return source.replace(old, new, 1)


def update_health(source):
    source = once(source, '</head>', (HERE / 'hp.css').read_text() + '</head>')
    source = once(source, 'function drawAdventureLabel(g,text,x,y){',
                  (HERE / 'hp.js').read_text() + 'function drawAdventureLabel(g,text,x,y){')
    start = source.index(" box('#684c3d',11,9,141,10)")
    end = source.index(" g.textAlign='center'", start)
    source = source[:start] + """ const foeNow=live.reduce((sum,f)=>sum+f.hp,0),foeMax=foes.reduce((sum,f)=>sum+f.maxHp,0);
 drawAdventureHpBadge(g,8,'ALLY','ally',b?b.ourHp:1,b?b.ourMax:1);
 drawAdventureHpBadge(g,248,boss?'BOSS':'ENEMY','foe',foeNow,foeMax);
""" + source[end:]
    source = once(source, " drawAdventureLabel(g,'ALLY',14,8);drawAdventureLabel(g,boss?'BOSS':'ENEMY',351,8);\n", '')
    source = once(source, "box('#634a4a',cx+2,cy-5,sz-3,4);box('#e78b74',cx+3,cy-4,Math.max(1,(sz-5)*f.hp/f.maxHp),2);",
                  "paintAdventureHp(g,cx+2,b?.raid?cy+sz:cy-6,sz-3,f.hp,f.maxHp,adventureHpColors.foe,true);")
    source = once(source, '<div class="battle-track"><div style="width:${clamp(battle.ourHp/battle.ourMax*100,0,100)}%;background:#59ac8c">',
                  '<div class="battle-track ally-hp"><div style="width:${clamp(battle.ourHp/battle.ourMax*100,0,100)}%">')
    source = once(source, '味方 HP</span><b></b></div><progress></progress>',
                  '味方 HP</span><b></b></div><progress class="ally-hp"></progress>')
    return source
