from pathlib import Path
import re,sys
p=Path(sys.argv[1]);s=p.read_text()
def change(a,b):
 global s
 if s.count(a)==1:
  s=s.replace(a,b,1);return
 pat=r'\n'.join('[ ]*'+re.escape(v.strip(' ')) for v in a.split('\n'))
 hits=list(re.finditer(pat,s))
 if len(hits)!=1: raise ValueError((len(hits),a))
 m=hits[0];s=s[:m.start()]+b+s[m.end():]
change(".ranch-guide-active { padding-bottom:calc(6rem + env(safe-area-inset-bottom)); }",
       """.ranch-guide-active { padding-bottom:calc(6rem + env(safe-area-inset-bottom)); }
.ranch-guide-active[data-guide-ranch-placement] :is(.layout,.app,.world-shell){overflow-anchor:none}
@media(min-width:781px) {
  html:not([data-mobile-viewport12521]) body[data-guide-ranch-placement="preview"] .world-shell {display:flex;flex-direction:column}
  html:not([data-mobile-viewport12521]) body[data-guide-ranch-placement="preview"] .world-shell #placementFacingDock {order:1}
  html:not([data-mobile-viewport12521]) body[data-guide-ranch-placement="preview"] .world-shell .map-surface {order:2}
  html:not([data-mobile-viewport12521]) body[data-guide-ranch-placement="preview"] .world-shell :is(.map-nav,#buildMode,.map-legend,.canvas-footer) {order:3}
}
@media(min-width:781px) and (max-height:820px) {
  html:not([data-mobile-viewport12521]) body[data-guide-ranch-placement="preview"] .world-shell .map-surface .canvas-frame {
    max-width: min(100%, calc((100vh - 310px) * 1.4667));margin-inline:auto;
  }
}""")
change("  if(!buildingMenu.hidden)menuTools.scrollIntoView({block:'nearest',inline:'nearest'});",
       "  if(!buildingMenu.hidden&&!(state.starterGuide==='inspect'&&b.type==='ranch'))menuTools.scrollIntoView({block:'nearest',inline:'nearest'});")
change("""    body:'冒険に出た仲間は経験値をもらったよ。次は、牧場を見守る世界樹を見にいこう。',
    button:'世界樹を見にいく',next:'findTree'
  },
  treeXp:{""", """    body:'冒険に出た仲間は経験値をもらったよ。次は、仲間の育て方を見てみよう。',
    button:'仲間の育て方へ',next:'training'
  },
  training:{
    title:'仲間を育てよう',
    body:'仲間は牧場で過ごしたり、冒険に勝ったりすると経験値がたまるよ。早く育てたい子は、育成カルテの<strong>「特訓」</strong>を試してね。回数を選んでまとめて特訓できるよ。ごはんとおかねの合計を確認して、経験値となかよし度を上げよう。',
    button:'世界樹を見にいく',next:'findTree'
  },
  treeXp:{""")
change("if(step==='adventure' && (state.adventure.stage>1 || !state.monsters.length))next='世界樹を見にいく';",
       "if(step==='adventure' && (state.adventure.stage>1 || !state.monsters.length))next='仲間の育て方へ';")
change("""  // Saves paused in the old tutorial resume at the next retained lesson.
  if(step==='openTraining'||step==='training'){step='findTree';saveGuideStage(step);}""",
       """  // Older saves skip directly to the text, without opening a monster sheet.
  if(step==='openTraining'){step='training';saveGuideStage(step);}""")
change("step==='adventure'&&(state.adventure.stage>1||!state.monsters.length)?'findTree':guideLessons[step]?.next;",
       "step==='adventure'&&(state.adventure.stage>1||!state.monsters.length)?'training':guideLessons[step]?.next;")
change("  mobileRevealGuide12521(guideTarget);\n  const b=guideMarker?.building", """  mobileRevealGuide12521(guideTarget);
  const placement=document.body.dataset.guideRanchPlacement;
  const mapControl=placement&&(
    guideTarget===canvas||$('placementFacingDock').contains(guideTarget)||buildingMenu.contains(guideTarget)
  );
  // Return from the list to the top of the map, not to the center of a button below it.
  if(mapControl){
    const frame=canvas.closest('.world-shell');
    const bounds=frame.getBoundingClientRect();
    if(mobileMedia12521?.matches)mobileLayout12521.scrollTop=0;
    else if(bounds.top<24)window.scrollTo({top:0,behavior:'instant'});
  }
  const b=guideMarker?.building""")
change("""    const bottom=tile ? 0.5 : 0.76;
    if(sx<.18||sx>.82||sy<.22||sy>bottom||buildingMenu.hidden&&b){
      const offset=tile?VH*.14/zoom:0;""",
       """    const ranchInspect=placement==='inspect'&&b?.type==='ranch';
    const bottom=tile ? .5 : ranchInspect ? .47 : .76;
    if(sx<.18||sx>.82||sy<.22||sy>bottom||buildingMenu.hidden&&b){
      const offset=(tile||ranchInspect)?VH*.14/zoom:0;""")
change("""  if(focus)guideTarget.focus({preventScroll:true});
  guideTarget.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});""",
       """  if(focus)guideTarget.focus({preventScroll:true});
  if(mapControl){
    if(guideTarget!==canvas){
      const r=guideTarget.getBoundingClientRect(), bar=guideBar.getBoundingClientRect().top;
      if(r.bottom>bar){
        // Only nudge enough for the control to clear the fixed tutorial banner.
        const delta=Math.ceil(r.bottom-bar)+8;
        if(mobileMedia12521?.matches)mobileLayout12521.scrollTop+=delta;
        else window.scrollBy({top:delta,behavior:'instant'});
      }
    }
  }else guideTarget.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});""")
change("  document.body.classList.toggle('ranch-guide-active',!!goal);",
       """  document.body.classList.toggle('ranch-guide-active',!!goal);
  const frameMode=goal && (step==='inspect'?'inspect':buildMode==='ranch'&&['ranch','placeRanch'].includes(step)?'preview':'');
  if(frameMode)document.body.dataset.guideRanchPlacement=frameMode;
  else delete document.body.dataset.guideRanchPlacement;""")
change("""      mobileSetPane12521('map');canvas.focus({preventScroll:true});
      canvas.scrollIntoView?.({block:'nearest',inline:'nearest'});""",
       """      mobileSetPane12521('map');canvas.focus({preventScroll:true});
      if(key==='build'&&buildMode==='ranch'&&document.body.dataset.guideRanchPlacement)
        mobileLayout12521.scrollTop=0;
      else canvas.scrollIntoView?.({block:'nearest',inline:'nearest'});""")
change("hint:'地図の下の「'+facingLabels[direction]+'」を押してみて。ほかの向きも選べるよ。'};",
       "hint:'向きボタンの「'+facingLabels[direction]+'」を押してみて。ほかの向きも選べるよ。'};")
p.write_text(s)
