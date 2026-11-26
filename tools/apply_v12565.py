"""Generate a complete, versioned 1.25.65 test release without overwriting 1.25.64."""
import hashlib
import json
import re
import shutil
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT=Path(__file__).resolve().parents[1]
OLD='1.25.64'
NEW='1.25.65'
game=ROOT/'game.html'
original=game.read_text()
if "GAME_APP_VERSION='1.25.65'" in original:
    print('1.25.65 detected; refresh the embedded native pixel artwork')
    start=original.index('// ==== Ver 1.25.65: flush town plots')
    marker='// ==== End Ver 1.25.65 art update ===='
    end=original.index(marker,start)+len(marker)
    latest_art=(ROOT/'tools/v12565_scene_patch.js').read_text().strip('\n')
    original=original[:start]+latest_art+original[end:]
    game.write_text(original)
else:
    assert original.count('1.25.64') == 3, 'Expected old version in title, footer and constant'
    original=original.replace('1.25.64','1.25.65')
    original=original.replace('— 建物の四隅とおまつり広場の入口','— 広場・花壇・世界樹の描き直し')
    pairs=[
     ("return type!=='acorn250' && !Object.hasOwn(townCatalog,type) && (type === 'relicStand' || isTownDecor(type));",
      "return type!=='acorn250' && ((type==='bubblePot'||type==='glowMushrooms') || (!Object.hasOwn(townCatalog,type) && (type === 'relicStand' || isTownDecor(type))));"),
     ("return !state.buildings.some(b=>b.x===x&&b.y===y&&townCatalog[b.type]?.role==='decor');",
      "return !state.buildings.some(b=>b.x===x&&b.y===y&&townCatalog[b.type]?.role==='decor'&&b.type!=='bubblePot'&&b.type!=='glowMushrooms');")
    ]
    for before,after in pairs:
        assert original.count(before)==1, 'Expected one patch point: '+before
        original=original.replace(before,after)
    marker='// Load saved species only after the full roster has been registered.'
    assert original.count(marker)==1
    art=(ROOT/'tools/v12565_scene_patch.js').read_text()
    assert '1.25.64' in art, 'Keep historical provenance of prior source'
    original=original.replace(marker,art+'\n'+marker)
    game.write_text(original)
from pack_launcher_html import pack
from pack_launcher_images import pack as minimize_embedded_images

destination=ROOT/'releases'/NEW
destination.mkdir(parents=True,exist_ok=True)
shutil.copyfile(game,destination/'game.html')
compressed_source, changed_images=minimize_embedded_images(game.read_bytes())
launcher=pack(compressed_source.decode('utf-8')).encode('utf-8')
print(f'Losslessly optimized {len(changed_images)} embedded images')
assert len(launcher)<4*1024*1024, '4 MiB launcher limit exceeded'
(destination/'launcher-game.html').write_bytes(launcher)
digest=hashlib.sha256(launcher).hexdigest()
manifest={'version':NEW,'min_launcher_version':'1.1.0',
    'html_url':f'https://lion000097.github.io/monster-biyori/releases/{NEW}/launcher-game.html',
    'sha256':digest}
(ROOT/'latest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
# Keep the complete offline bundle and change only the game payload.
prior=ROOT/'releases'/OLD/f'monster-biyori-{OLD}.zip'
future=destination/f'monster-biyori-{NEW}.zip'
with ZipFile(prior) as old, ZipFile(future,'w') as next_zip:
    names=old.namelist()
    assert names.count('game.html')==1
    for info in old.infolist():
        data=launcher if info.filename=='game.html' else old.read(info)
        next_zip.writestr(info,data)
(destination/'CHANGELOG.md').write_text('''# 1.25.65 変更点

- シャボン玉のつぼ、光るきのこの群生：地面の絵を除き、道と石のタイルを下に敷けるようにした。
- 小さな音楽堂：屋根のある施設から、演奏台・腰掛け・ランプのある屋外音楽広場へ変更。
- お祭り広場以外の町施設：接地面の手前側を道と同じ高さに統一。
- まかない菜園：2×3マスの四隅まで、畝と野菜を広げた。
- 世界樹Lv25：深い緑と垂れ下がる花の広がった樹冠へ描き直し。
- 世界樹Lv30：黄金色の枝葉と星花の樹冠へ描き直し。
- 4方向の画像と以前のセーブ内容は保持。1.25.64の施設配置補正は維持。
''')
(destination/'TESTING.md').write_text('''# 1.25.65 自動確認
- 検査実行: tools/release_preflight.py
- ゲームの建物・装飾の追加削除なし。既存セーブキーと施設ID変更なし。
- バージョン、ランチャーの往復復元、4MiB制限、配信ZIP、SHA-256を検査する。
- 実際のブラウザ表示および設置・道の動作は別途ブラウザ試験が必要。
''')
print(f'READY {NEW}: game={len(game.read_bytes())} launcher={len(launcher)} ZIP={len(future.read_bytes())} sha={digest}')
