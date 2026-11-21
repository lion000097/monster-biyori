# もんすたー日和 1.24.10

- 対象バージョン　1.24.10（1.24.9から更新、2026年11月21日公開）
- 保存先　GitHub `lion000097/monster-biyori` の `main` と `release/1.24.10`。ゲーム本体は `game.html`、検証は `tests/v1.24.10-ranch.html`、進捗は `PROGRESS.md`。配布物は `releases/1.24.10/`。
- 完了事項　雨の日の性格ごとのしぐさと追いかけっこの誘いを実装し、GitHub Pagesに公開。
- 確認結果　1.24.9のセーブ引き継ぎ、5性格の雨の日の行動、水しぶきへの反応、追いかけっこの接近・接触・時間差のある出発・終了をゲーム本体とCanvasで検証。道や施設の撤去、相手がいなくなった場合、素材の仕事、再読込からの復帰も確認。最終配布版のChrome検証が1366×900・390×844の両方で成功し、公開先の4ファイルが検証済みファイルと一致。
- 残作業　なし。
- 次の操作　次に更新する際は公開済みの1.24.10から始める。

[前版の進捗と公開記録](https://github.com/lion000097/monster-biyori/blob/eb6c94ea7cd11bcd8ebb82b9559f7c16c8fecf62/PROGRESS.md)

## 修正ごとの記録

1. 雨の日の道に水たまりを表示。がんばりやは跳び越え、きらめき・まけずぎらいは飛び込む。おっとり・のんびりは道でつながった建物の軒先で雨宿りし、近くで水しぶきが上がると驚く。通常表示と縮小表示の雨・晴れの描画も確認した。
2. 追いかけっこを始める仲間が近づいて前足で相手をつつき、先に走り出す。相手は少し驚いてから同じ道を追いかける。両者の処理順を変えても誘いのタイミングは同じ。途中の一時停止と再読込でも、所持品や仲間の進行を維持する。
3. 実際のコマを並べて確認し、驚きと雨宿りの吹き出しをドット絵で描いた。「！」と傘が端末の絵文字フォントに左右されず見えるようにした。
4. [Chromeでの検証](https://github.com/lion000097/monster-biyori/actions/runs/44899856317) が1366×900、390×844とも成功。最終版のHTML・配布ZIP・更新内容・検証記録を用意し、ZIPの全186項目を展開照合した。HTMLのSHA-256は `c076327e85bddc8e558063a9547bd9f02e91ba00f290bdf64e645217ff0c8fb7`、ZIPは `9a993064585daebeac2fc660955079d7b13e2dc155c7e8d16cce08a6903d9cc3`。
5. [最終配布版のブラウザ検証](https://github.com/lion000097/monster-biyori/actions/runs/44900129554) で傘と驚きの描画を含めて合格。[公開用コミット](https://github.com/lion000097/monster-biyori/commit/60046fe8a21194aa97ea9ff39a81c89064ad2daa) をmainに反映し、[GitHub Pagesの公開処理](https://github.com/lion000097/monster-biyori/actions/runs/44900166758) が成功。公開中のゲーム本体・版別HTML・配布ZIP・更新情報の4点でHTTP 200とバイト一致を確認した。更新情報は1.24.10とHTMLの正しいSHA-256を示す。

[公開版](https://lion000097.github.io/monster-biyori/game.html) · [検証記録](releases/1.24.10/TESTING.md)
