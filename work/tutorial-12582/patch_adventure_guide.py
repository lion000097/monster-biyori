from pathlib import Path
import re,sys
p=Path(sys.argv[1])
s=p.read_text()
def change(a,b):
 global s
 matches=list(re.finditer(r'\n'.join('[ ]*'+re.escape(line.lstrip(' ')) for line in a.split('\n')),s)) if '\n' in a or a.startswith(' ') else []
 if s.count(a)==1:
  s=s.replace(a,b,1)
 elif len(matches)==1:
  m=matches[0]
  s=s[:m.start()]+b+s[m.end():]
 else:
  raise ValueError((s.count(a),len(matches),a))
change('<title>もんすたー日和 Ver.1.25.81','<title>もんすたー日和 Ver.1.25.82')
change("GAME_APP_VERSION='1.25.81'","GAME_APP_VERSION='1.25.82'")
change('Ver.1.25.81 — おまかせ観察カメラとプレイ時間','Ver.1.25.82 — チュートリアルではじめての冒険')
change("    button:'育成カルテを見てみる',next:'openTraining'\n  },\n  training:{", """    button:'1-1に挑戦する',next:'firstAdventure82'
  },
  firstAdventureClear82:{
    title:'1-1をクリアしたよ！',
    body:'冒険に出た仲間は経験値をもらったよ。次は、仲間の育ち具合を見てみよう。',
    button:'育成カルテを見てみる',next:'openTraining'
  },
  training:{""")
change('冒険では<strong>通常戦の勝利で18.2 XP</strong>、<strong>各ボスの初勝利で61.75 XP</strong>もらえるよ。','')
change('heading=lesson.title;body=lesson.body;next=lesson.button;',"""heading=lesson.title;body=lesson.body;next=lesson.button;
    if(step==='adventure' && (state.adventure.stage>1 || !state.monsters.length))next='育成カルテを見てみる';""")
change("'openAdventure','openTraining','findTree','guideHelp',...Object.keys(guideLessons)", "'openAdventure','firstAdventure82','openTraining','findTree','guideHelp',...Object.keys(guideLessons)")
change("    if(step==='openAdventure'&&tab==='adventure')step='adventure';", """    if(step==='openAdventure'&&tab==='adventure')step='adventure';
    const showingFirstFinish=lastJourney12554?.ranch===state && lastJourney12554.stage===1
      && lastJourney12554.phase==='clear' && performance.now()<lastJourney12554.mapUntil
      && !journeyWindowClosed12554;
    if(step==='firstAdventure82'&&state.adventure.stage>1&&!showingFirstFinish)step='firstAdventureClear82';""")
change("    else if(step==='openAdventure'||(step==='openTraining'&&tab!=='adventure')){", """    else if(step==='firstAdventure82'&&(state.battle||showingFirstFinish)){
      const paused=state.battle&&state.speed===0;
      goal={key:paused?'first-adventure-paused':'first-adventure-watch',
        title:showingFirstFinish?'1-1をクリアしたよ！':paused?'冒険は一時停止中':'1-1の冒険を見守ろう',
        hint:showingFirstFinish?'仲間が戻ってきたよ。':paused?(mobileMedia12521?.matches
          ?'「ほか」→「地図の道具・速度」で再開できるよ。':'画面上の「1×」で再開できるよ。')
          :'地図の小窓で、出会いや自動戦闘のようすを見られるよ。'};
    }else if(step==='firstAdventure82'&&tab==='adventure'){
      goal={key:'first-adventure-start',target:$('tabBody').querySelector('[data-action="adventureStart"]'),
        title:'1-1「はらっぱ」に出発しよう',hint:'「1-1 に出発する」を押してね。'};
    }
    else if(step==='openAdventure'||(step==='firstAdventure82'&&tab!=='adventure')||(step==='openTraining'&&tab!=='adventure')){""")
change("    if(changed)revealGuideTarget(true);","""    if(changed){
      revealGuideTarget(true);
      if(goal.key==='first-adventure-watch'&&state.battle)
        requestAnimationFrame(()=>{
          if(state.starterGuide==='firstAdventure82'&&state.battle&&!mapJourney12554.hidden)
            mapJourney12554.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
        });
    }""")
change("  const next=step==='welcome'?(guideFirstBuilding('ranch')?'inspect':'facilities'):step==='shopIntro'?'shop':guideLessons[step]?.next;", """  const next=step==='welcome'?(guideFirstBuilding('ranch')?'inspect':'facilities'):step==='shopIntro'?'shop':
    step==='adventure'&&(state.adventure.stage>1||!state.monsters.length)?'openTraining':guideLessons[step]?.next;""")
# Reopen the actual menu when coming back from the mobile journey view.
assert "starterGuide:'welcome'" in s and "firstShop82" not in s and "通常戦の勝利で18.2 XP" not in s
p.write_text(s)
