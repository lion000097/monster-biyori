from pathlib import Path
import hashlib, json, shutil, sys
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
v='1.25.74'
old='1.25.73'
root=Path(sys.argv[1]).resolve()
notesdir=Path(__file__).parent
r=root/'releases'/v
r.mkdir(parents=True,exist_ok=False)
shutil.copy2(root/'draft.html',r/'game.html')
shutil.copy2(root/'draft-launcher.html',r/'launcher-game.html')
shutil.copy2(root/'draft.html',root/'game.html')
cl="""# 1.25.74 モンスター図鑑
- 図鑑の「味方」を「モンスター」に変更し、「敵」タブを削除。
- 全127種と色違いの収集、市民・素材・装備の図鑑は従来通り。戦闘や既存のセーブデータに変更はありません。
"""
testing="""# 1.25.74 動作確認
- Chromium のスマホ幅390pxの通常版・PC幅1280pxの軽量版: 「敵」タブなし、「モンスター」127種、市民・素材・装備タブ、色違い・絞り込み、あそびかたを確認。
- 1.25.73 のセーブを読み込み、図鑑・色違い・遭遇履歴・討伐記録、ボスの出現と実績の進捗が変わらないことを確認。
- JavaScript 構文、配布前検査（通常版の整合、軽量版とZIPの一致、4MiB上限、ZIPのCRC）を確認。実機は未検査。
"""
progress="""# 1.25.74 モンスター図鑑
- 対象バージョン: 1.25.73から1.25.74へ。この更新は図鑑の表示のみ。
- 保存先: 通常版 `game.html`、軽量版とZIP `releases/1.25.74/`、検査 `tests/v1.25.74-monster-dex.cjs`。作業履歴は `build/monster-dex-1.25.74`。
- 完了事項: 「味方」を「モンスター」に変更。「敵」のタブと集計を除き、あそびかたも更新。戦闘・遭遇・討伐記録は従来通り。
- 確認結果: 通常版・軽量版で127種の図鑑と旧セーブの読み込みを確認。詳細は [TESTING.md](TESTING.md)。
- 残作業: 公開URLの配信確認。
- 次の操作: Pagesデプロイ完了後、通常版・軽量版・ZIPのSHA-256と公開画面を確認する。
"""
for name,data in [('CHANGELOG.md',cl),('TESTING.md',testing),('PROGRESS.md',progress)]:
    (r/name).write_text(data)
prior=root/'releases'/old/f'monster-biyori-{old}.zip'
zipped=r/f'monster-biyori-{v}.zip'
changelog='CHANGELOG.md'; test='TESTING.md'
swaps={'game.html':(r/'launcher-game.html').read_bytes(),changelog:cl.encode(),test:testing.encode()}
with ZipFile(prior) as oldz, ZipFile(zipped,'w',compression=ZIP_DEFLATED,compresslevel=9) as newz:
    for origin in oldz.infolist():
        raw=swaps.get(origin.filename)
        newz.writestr(origin,oldz.read(origin) if raw is None else raw,compress_type=origin.compress_type,compresslevel=9)
    for name in (changelog,test):
        newz.writestr(ZipInfo(f'releases/{v}/{name}',(2026,11,27,0,0,0)),swaps[name],compress_type=ZIP_DEFLATED,compresslevel=9)
with ZipFile(prior) as a, ZipFile(zipped) as b:
    keep=set(a.namelist())-swaps.keys()
    assert all(a.getinfo(k).CRC==b.getinfo(k).CRC and a.getinfo(k).file_size==b.getinfo(k).file_size for k in keep)
    print('ZIP unchanged entries:',len(keep))
manifest={'version':v,'min_launcher_version':'1.1.0','html_url':f'https://lion000097.github.io/monster-biyori/releases/{v}/launcher-game.html',
 'sha256':hashlib.sha256(swaps['game.html']).hexdigest()}
(root/'latest.json').write_text(json.dumps(manifest,indent=2)+'\n')
archive=root/'archive.html'
anchor='<ul id="versions">'
row=f'<li data-version="{v}"><a href="releases/{v}/monster-biyori-{v}.zip">Ver. {v} のZIP</a><small>{zipped.stat().st_size/1e6:.2f} MB ・ 現行配布</small></li>\n'
old_archive=archive.read_text()
assert old_archive.count(anchor)==1 and f'data-version="{v}"' not in old_archive
archive.write_text(old_archive.replace(anchor,anchor+row))
p=root/'PROGRESS.md'
p.write_text(progress.replace('(TESTING.md)',f'(releases/{v}/TESTING.md)')+'\n'+p.read_text())
testpath=root/'tests'/f'v{v}-monster-dex.cjs'
testpath.parent.mkdir(exist_ok=True)
s=(notesdir/'dex-test.cjs').read_text().replace("'game.html','utf8'","'releases/1.25.73/game.html','utf8'").replace("'draft.html','utf8'","'game.html','utf8'").replace("'draft-launcher.html','utf8'","'releases/1.25.74/launcher-game.html','utf8'")
testpath.write_text(s)
