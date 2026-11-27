from pathlib import Path
import sys
p=Path(sys.argv[1])
s=p.read_text()
def edit(old,new):
 global s
 assert s.count(old)==1,old
 s=s.replace(old,new,1)
edit("const guideLessons={","""const guideLessons={
  adventureIntro82:{
    title:'冒険のはじまり',
    body:'次は冒険に行ってみよう！',
    button:'冒険へ',next:'openAdventure'
  },""")
edit("saveGuideStage(guideFirstBuilding('shop')?'openAdventure':'shopIntro');","saveGuideStage(guideFirstBuilding('shop')?'adventureIntro82':'shopIntro');")
edit("if(step==='finish'||(step==='shop'&&guideFirstBuilding('shop')))step='openAdventure';","if(step==='finish'||(step==='shop'&&guideFirstBuilding('shop')))step='adventureIntro82';")
p.write_text(s)
