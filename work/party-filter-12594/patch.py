from pathlib import Path
import re, sys
src,dst=map(Path,sys.argv[1:3]); here=Path(__file__).parent
s=src.read_bytes().decode()
for old in ("Ver.1.25.93 |","Ver.1.25.93 —","GAME_APP_VERSION='1.25.93'"):
    assert s.count(old)==1,old
    s=s.replace(old,old.replace('1.25.93','1.25.94'))
s=s.replace('おまかせ観察カメラの調整</footer>','冒険の出撃編成に絞り込み</footer>')
a=s.index('html+=`<div class="section-label">出撃編成（3匹まで）')
anchor="let content=body.querySelector('[data-adventure-content]');"
b=s.index(anchor,a)
assert 'data-party-kind' in s[a:b]
s=s[:a]+s[b:]
a=s.index('content.innerHTML=html;',s.index(anchor))
b=s.index("}else if(tab==='bestiary')",a)
s=s[:a]+"""let status=content.querySelector('[data-adventure-status94]');
if(!status){
 status=document.createElement('div');status.dataset.adventureStatus94='';content.prepend(status);
}
if(status.adventureHTML94!==html){
 status.adventureHTML94=html;status.innerHTML=html;
 for(const el of status.querySelectorAll('[data-stage-enemy]'))paintPortrait(el,enemy17(+el.dataset.stageEnemy));
}
renderAdventureParty94(content,enemyElement(shownEnemy.index));
"""+s[b:]
old="if(tab==='adventure'){$('tabBody').querySelector('[data-adventure-content]').insertAdjacentHTML('afterbegin',"
new="if(tab==='adventure'&&!$('tabBody').querySelector('[data-v161-action=treasureTab]')){$('tabBody').querySelector('[data-adventure-content]').insertAdjacentHTML('afterbegin',"
assert s.count(old)==1
s=s.replace(old,new)
s=s.replace('</head>','<style>\n'+(here/'party-filter.css').read_text()+'</style>\n</head>',1)
mark='\nclaimSave12556();\nconst didLoad='
assert s.count(mark)==1
s=s.replace(mark,'\n'+(here/'party-filter.js').read_text()+mark)
dst.write_bytes(s.encode())
