from pathlib import Path
import re, sys
src, dst=map(Path,sys.argv[1:3])
s=src.read_bytes().decode('utf-8')
def sub(old,new):
    global s
    if s.count(old)==1:
        s=s.replace(old,new,1)
        return
    lines=old.splitlines()
    pattern=r'(?m)^'+r'\n'.join(r'[ \t]*'+re.escape(line.lstrip()) for line in lines)
    if old.endswith('\n'): pattern+=r'\n'
    s,n=re.subn(pattern,lambda _:new,s)
    assert n==1,(n,old[:150])
sub("const GAME_APP_VERSION='1.25.91';","const GAME_APP_VERSION='1.25.92';")
sub("Ver.1.25.91 |", "Ver.1.25.92 |")
sub("Ver.1.25.91 — 世界樹の成長と施設のお披露目", "Ver.1.25.92 — コレクション実績と施設メニュー")
pop=""" if(tab==='build'){
  $('tabBody').insertAdjacentHTML('afterbegin','<div class="info-card"><strong>🌷 街の人気度：'+Math.floor(townPopularity211())+'</strong><br>装飾が増えると旅人が増え、珍しい旅人も来やすくなるよ。</div>');
 }
"""
sub(pop,"")
start=re.search(r'(?m)^[ \t]*const progress=treeGrowthStatus1257\(\),\{level:lvl,cost\}=progress;',s).start()
end=re.search(r"(?m)^[ \t]*for\(const el of panel.querySelectorAll\('\.build-option'\)\)",s[start:]).start()+start
sub(s[start:end],"""    // Keep placement recovery for older ranches without a tree. All normal
    // World Tree controls and growth information remain on the map selection.
    if(!tree&&roleIncludes('worldtree')&&matchesBuildFilters80('worldtree')){
      const recovery=document.createElement('div');
      recovery.className='info-card worldtree-panel193';
      recovery.innerHTML='<button class="small-button" data-v193="placeTree">🌳 6×6の土地に世界樹を置く</button>'+
        (buildMode==='worldtree'?facingShortcut(placementFacing):'');
      panel.prepend(recovery);
    }
""")
sub("function trophyHtml193(){\n  const unlocked=", """function trophyHtml193(){
  const before=Array.isArray(state.achievements)?state.achievements.length:0;
  checkAchievements193(true);
  if(state.achievements.length!==before)save(true);
  const unlocked=""")
sub("function trophyProgress(achievement) {\n", "function trophyProgress(achievement) {\n  if(achievement.progress)return achievement.progress();\n")
sub("const mobileTabs12521=new Set(['build','management','adventure','raid','monster','staff','research','bestiary']);",
    "const mobileTabs12521=new Set(['build','management','adventure','raid','monster','staff','research','bestiary','achievements']);")
sub('  <button type="button" data-mobile-open12521="bestiary">📚 図鑑</button>',
    '  <button type="button" data-mobile-open12521="bestiary">📚 図鑑</button>\n  <button type="button" data-mobile-open12521="achievements">🏆 実績</button>')
insert_file=Path(__file__).with_name('collection-achievements.js')
sub("\nclaimSave12556();\nconst didLoad=", "\n"+insert_file.read_text()+"\nclaimSave12556();\nconst didLoad=")
dst.write_bytes(s.encode('utf-8'))
