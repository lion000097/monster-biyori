from pathlib import Path
import sys
src,dst=map(Path,sys.argv[1:3])
s=src.read_bytes().decode()
def sub(a,b):
    global s
    assert s.count(a)==1,a
    s=s.replace(a,b)
for old in ("Ver.1.25.94 |","Ver.1.25.94 —","GAME_APP_VERSION='1.25.94'"):
    sub(old,old.replace('1.25.94','1.25.95'))
sub('冒険の出撃編成に絞り込み</footer>','建築メニューの整理</footer>')
anchor='for(const [id,spec] of Object.entries(townCatalog)){'
sub(anchor,"""// Retired catalog entries remain recognizable in older ranch saves. They are
// removed before building/menu, unlock and world-tree requirements are derived.
const retiredTown12595=Object.freeze({feastTable:5260,memorialGate:6800,laundry:3100,chickStep:110,mossPath:430,shellChannel:740});
for(const type of Object.keys(retiredTown12595)){
 if(townCatalog[type]?.cost!==retiredTown12595[type])throw new Error('Retired building price mismatch: '+type);
 delete townCatalog[type];
}
"""+anchor)
sub('const originalPrices = {waterwheel130:190, lantern250:185, roseArch250:360};',
    'const originalPrices = {waterwheel130:190, lantern250:185, roseArch250:360,...retiredTown12595};')
sub('for(const [type,people] of Object.entries(groups75)){',
    'for(const [type,people] of Object.entries(groups75)){\n if(!Object.hasOwn(B,type))continue;')
dst.write_bytes(s.encode())
