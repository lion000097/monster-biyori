from pathlib import Path
import re,sys
p=Path(sys.argv[1]); s=p.read_text()
def change(a,b):
 global s
 if s.count(a)==1:
  s=s.replace(a,b,1);return
 pat=r'\n'.join('[ ]*'+re.escape(v.strip(' ')) for v in a.split('\n'))
 hits=list(re.finditer(pat,s))
 if len(hits)!=1: raise ValueError((len(hits),a))
 m=hits[0];s=s[:m.start()]+b+s[m.end():]
change('monsters:[makeMonster(1,0,7,9),makeMonster(2,1,12,9),makeMonster(3,2,15,10)]',
       "monsters:[{...makeMonster(1,shirogaoKind,7,9),name:SPECIES[shirogaoKind].name},makeMonster(2,1,12,9),makeMonster(3,2,15,10)]")
change('catalog:{friends:[0,1,2],shinies:[],enemies:[],defeated:[],citizens:[]}',
       'catalog:{friends:[shirogaoKind,1,2],shinies:[],enemies:[],defeated:[],citizens:[]}')
change("""    body:'冒険に出た仲間は経験値をもらったよ。次は、仲間の育ち具合を見てみよう。',
    button:'育成カルテを見てみる',next:'openTraining'
  },
  training:{
    title:'仲間を育てよう',
    body:'仲間は牧場で過ごしたり、冒険に勝ったりすると経験値がたまるよ。早く育てたい子は、育成カルテの<strong>「特訓」</strong>を試してね。回数を選んでまとめて特訓できるよ。ごはんとおかねの合計を確認して、経験値となかよし度を上げよう。',
    button:'世界樹を見にいく',next:'findTree'
  },""", """    body:'冒険に出た仲間は経験値をもらったよ。次は、牧場を見守る世界樹を見にいこう。',
    button:'世界樹を見にいく',next:'findTree'
  },""")
change("'openAdventure','firstAdventure82','openTraining','findTree','guideHelp'","'openAdventure','firstAdventure82','findTree','guideHelp'")
change("""    body=guideFirstBuilding('ranch')?'ぼくはしろガオ。素材牧場を見ながら、建物の向きを一緒に変えてみよう。':
      'ぼくはしろガオ。まずは<strong>素材牧場</strong>を建てよう。仲間が遊びに来ると、ここで素材がとれるよ。';""",
       """    body='がおの名前はしろガオ！ ひょんなことから、きみはこの街を発展させることになったんだ。一緒にがんばろうね！<br><br>'+
      (guideFirstBuilding('ranch')?'まずは素材牧場を見ながら、建物の向きを変えてみよう。':
        'まずは<strong>素材牧場</strong>を建てよう。仲間が遊びに来ると、ここで素材がとれるよ。');""")
change("if(step==='adventure' && (state.adventure.stage>1 || !state.monsters.length))next='育成カルテを見てみる';",
       "if(step==='adventure' && (state.adventure.stage>1 || !state.monsters.length))next='世界樹を見にいく';")
change("  if(step==='openTraining'&&monsterDetails){saveGuideStage('training');step='training';}",
       """  // Saves paused in the old tutorial resume at the next retained lesson.
  if(step==='openTraining'||step==='training'){step='findTree';saveGuideStage(step);}""")
change("    if(step==='openTraining'&&!state.monsters.length)step='training';\n","")
change("    else if(step==='openAdventure'||(step==='firstAdventure82'&&tab!=='adventure')||(step==='openTraining'&&tab!=='adventure')){",
       "    else if(step==='openAdventure'||(step==='firstAdventure82'&&tab!=='adventure')){")
change("""    }else if(step==='openTraining'){
      goal={key:'open-training',target:$('tabBody').querySelector('.party-unit [data-action="selectMonster"]'),
        title:'仲間の「詳細」で育成カルテを開こう',hint:'経験値や「特訓」を見たら、「閉じる」で案内に戻ってね。'};
    }else if(step==='findTree'){""","""    }else if(step==='findTree'){""")
change("step==='adventure'&&(state.adventure.stage>1||!state.monsters.length)?'openTraining':guideLessons[step]?.next;",
       "step==='adventure'&&(state.adventure.stage>1||!state.monsters.length)?'findTree':guideLessons[step]?.next;")
change("  if(sheet && state.starterGuide==='training')renderStarterGuide();\n","")
assert "starterGuide:'welcome'" in s and "firstShop82" not in s
p.write_text(s)
