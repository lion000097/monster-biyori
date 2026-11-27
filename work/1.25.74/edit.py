from pathlib import Path
import re, sys, zlib
from pack_launcher_html import decode_payload,unbundle_assets,MARKER,pack
def edit(src):
    def rep(a,b,n=1):
        nonlocal src
        assert src.count(a)==n, (str(a)[:100],src.count(a),n)
        src=src.replace(a,b)
    def sub(pattern,value):
        nonlocal src
        src,n=re.subn(pattern,value,src,flags=re.M)
        assert n==1, (pattern,n)
    rep('1.25.73','1.25.74',3)
    rep('たまごから広がる仲間図鑑','モンスター図鑑')
    rep('<br>敵 ${c.enemies.length}/${ENEMIES.length} 種・市民','<br>市民',2)
    rep('>🐾 味方</button><button class="${atlasCategory===\'enemy\'?\'on\':\'\'}" data-action="atlas" data-id="enemy">⚔️ 敵</button>','>🐾 モンスター</button>',2)
    rep("else if(action==='atlas'){atlasCategory=id;renderUI(true)}","else if(action==='atlas'){if(!['friend','citizen','material','equipment'].includes(id))return;atlasCategory=id;renderUI(true)}")
    sub(r"^else if\(atlasCategory==='enemy'\)html\+=ENEMIES\.map[^\n]*\n","")
    sub(r" else if\(atlasCategory==='enemy'\) html \+= ENEMIES\.map[\s\S]*?\.join\(''\); else html"," else html")
    rep(" for(const el of $('tabBody').querySelectorAll('[data-v18-enemy]')){ paintPortrait(el,enemy17(+el.dataset.v18Enemy)); }","")
    rep("let atlasFilter137='all', atlasEnemyArea='all';","let atlasFilter137='all';")
    rep("category==='enemy'?ENEMIES:","")
    rep("category==='enemy'?c.enemies:","")
    rep("category==='material'||category==='enemy'","category==='material'")
    sub(r"^ const area=category==='enemy'\?enemyAtlasAreas\.get\(atlasEnemyArea\):null;\n if\(category==='enemy'\)\{[\s\S]*?^ \}\n","")
    rep("const inArea=!area||area.ids.has(i),fresh=isNew(i);if(fresh&&inArea)news++;","const fresh=isNew(i);if(fresh)news++;")
    rep("match&&inArea","match",2)
    rep("(area?area.ids.size:cards.length)","cards.length")
    rep("(area?'このエリアの':'')+'NEW ","'NEW ")
    rep("  if(area)read.dataset.readArea=atlasEnemyArea;\n","")
    rep(" }else if(el.id==='enemyAtlasArea'&&(el.value==='all'||enemyAtlasAreas.has(el.value))){\n  atlasEnemyArea=el.value;renderUI(true);\n","")
    rep(" const key=button.dataset.v137Read;\n"," const key=button.dataset.v137Read;\n if(!['friend','material','citizen'].includes(key))return;\n")
    rep("key==='enemy'?state.catalog.enemies:","")
    rep(" const group=key==='enemy'&&enemyAtlasAreas.get(button.dataset.readArea);\n state.catalogSeen137[key]=group?[...new Set([...state.catalogSeen137[key],...contents.filter(id=>group.ids.has(id))])]:contents.slice();"," state.catalogSeen137[key]=contents.slice();")
    rep(', #enemyAtlasArea','')
    rep('「図鑑」では味方・敵・市民・素材を見られるよ。敵は出現エリアと発見状況を組み合わせて探せるよ。','「図鑑」ではモンスター・市民・素材・装備を見られるよ。')
    rep('「過去の図鑑記録」の仲間もこの4つの入手先で見つかるよ。','以前のバージョンに登場したモンスターも、この4つの入手先で見つかるよ。')
    return src
if __name__=='__main__':
    source=Path(sys.argv[1]).read_text()
    if not source.startswith('<!doctype html><html lang=ja><meta'):
        data=edit(source).encode()
    else:
        p=re.search(r'id="ranch-payload">(.*?)</script><script id="ranch-inflater">(.*?)</script>',source,re.S)
        size=int(re.search(r'const PACKED_BYTES=(\d+);',source)[1])
        original=unbundle_assets(zlib.decompress(decode_payload(p[1],size))).replace(MARKER,p[2])
        data=pack(edit(original), dense=True,binary_assets=True).encode()
        assert len(data)<=4*1024*1024,len(data)
    Path(sys.argv[2]).write_bytes(data)
    print(f'{len(data):,} bytes')
