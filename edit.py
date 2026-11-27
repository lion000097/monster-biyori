import sys
from pathlib import Path
p=Path(sys.argv[1])
s=p.read_text()
def edit(a,b,n=1):
 global s
 assert s.count(a)==n,(a,s.count(a))
 s=s.replace(a,b)
edit('1.25.67','1.25.68',3)
edit('— お仕事紹介所とふたつの広場','— モンスターの上限Lv.150')
edit('function monsterExperience(m) {',"""const MONSTER_LEVEL_CAP=150;
function addMonsterXP(m, amount){
  if(m.lv<MONSTER_LEVEL_CAP)m.xp+=amount;
}
function normalizeMonsterLevelCap(save){
  for(const m of [...save.monsters,...save.restingMonsters]){
    if(m.lv>=MONSTER_LEVEL_CAP){m.lv=MONSTER_LEVEL_CAP;m.xp=0;}
  }
}
function monsterExperience(m) {
  if(m.lv>=MONSTER_LEVEL_CAP)return '<span class="monster-xp"><span>経験値 <b>MAX</b></span></span>';""")
edit('i<count;i++){\n  const cost=22','i<count&&lv<MONSTER_LEVEL_CAP;i++){\n  const cost=22')
edit('&&lv-before<200){xp-=monsterLevelNeed135(lv);lv++}', '&&lv<MONSTER_LEVEL_CAP&&lv-before<200){xp-=monsterLevelNeed135(lv);lv++}\n  if(lv===MONSTER_LEVEL_CAP)xp=0;')
edit('gold:count*TRAIN_GOLD_12530','gold:rounds.length*TRAIN_GOLD_12530')
edit("const plan=trainingPlan12530(m,count);","if(m.lv>=MONSTER_LEVEL_CAP)return toast('Lv.'+MONSTER_LEVEL_CAP+'に到達しているよ');\n const plan=trainingPlan12530(m,count);")
edit('${m.name}が特訓${count}回','${m.name}が特訓${plan.rounds.length}回')
edit("const affordable=!!plan&&!missing.length;", "const atCap=m.lv>=MONSTER_LEVEL_CAP;\n  field.disabled=atCap;\n  const affordable=!atCap&&!!plan&&!missing.length;")
edit("const line=plan?'合計：", "const line=atCap?'Lv.'+MONSTER_LEVEL_CAP+'に到達済み':plan?(plan.rounds.length<field.valueAsNumber?'上限まで'+plan.rounds.length+'回 ｜ ':'')+'合計：")
edit('m.xp+=.4','addMonsterXP(m,.4)')
edit('m.xp+=xp;','addMonsterXP(m,xp);',2)
edit('m.xp+=120;','addMonsterXP(m,120);')
edit('m.xp+=1;}','addMonsterXP(m,1);}')
edit('m.xp+=(.39+.38*Math.sqrt(school))*(m.happy/110+.35)*xpBoost*(.72+m.energy/280)*.35*(m.gift212===3?1.20:1);','addMonsterXP(m,(.39+.38*Math.sqrt(school))*(m.happy/110+.35)*xpBoost*(.72+m.energy/280)*.35*(m.gift212===3?1.20:1));')
edit('if(m.xp>=need){m.xp-=need;m.lv++;','if(m.lv<MONSTER_LEVEL_CAP&&m.xp>=need){m.xp-=need;m.lv++;if(m.lv===MONSTER_LEVEL_CAP)m.xp=0;')
edit('loadBarn(state); restoreYuguruEggDiscovery();','loadBarn(state); normalizeMonsterLevelCap(state); restoreYuguruEggDiscovery();')
Path(sys.argv[2]).write_text(s)
