# 1.25.89　旅の建築6種の石縁（公開済み）

- 対象バージョン　公開版1.25.88を基に、承認済みの土台修正版24枚を組み込んだ。
- 保存先　原画アトラスは `assets/town-axis/painted/`、原寸取り込みと組み立ては `work/traveler-art-12589/`。通常版、軽量版、配布ZIP、[4方向の画像](buildings.webp)と[検査記録](TESTING.md)はこのフォルダーにある。
- 完了事項　6棟の石縁を設置マスの四隅に合わせ、原画の下に重ねていた敷石を取り除いた。展示、植木、雨の日の目印を新しい位置に合わせた。
- 確認結果　通常版の24枚は承認済みPNGと画素単位で一致した。両版で全24方向の設置と回転、入口、石縁、旧セーブの再読込と書き出しを確認した。
- 公開結果　[配布検査](https://github.com/lion000097/monster-biyori/actions/runs/46121155007)と[公式サイトへの配信](https://github.com/lion000097/monster-biyori/actions/runs/46121301985)が成功。[配布コミット](https://github.com/lion000097/monster-biyori/commit/f0607adfae17d6bc4c764cfb5adfc3f07472dfee)の9ファイルが公開URLと一致し、ZIP全475項目を照合した。配信された通常版と軽量版で旧牧場の入出力、建築6種の4方向を再確認した。
- 残作業　なし。
- 次の操作　次回は[公開版1.25.89](https://lion000097.github.io/monster-biyori/game.html?v=1.25.89)を起点にする。

承認済みのゲーム用PNG24枚のZIPのSHA-256は `a96970774c0648285e6f894c6894b8fc81943b773f0f0ea08385bbe1db62d9a8`。検査を再実行する際は `verify_assets.py` にこのZIPを渡す。施設メニューとセーブの検査は前版の `verify.cjs` に `GAME_VERSION=1.25.89` と対象・比較元のフォルダーを指定する。
