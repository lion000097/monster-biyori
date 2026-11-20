# もんすたー日和 開発・公開進捗

最終更新: 2026-11-20 23:48 JST

## 現在の状態

- 対象バージョン: **1.24.3**
- 状態: **公開完了・公開先確認済み**
- 今回の未完了作業: **なし**
- 追加改善は次のバージョンで扱う。
- 公開URL: https://lion000097.github.io/monster-biyori/releases/1.24.3/game.html
- 共通入口: https://lion000097.github.io/monster-biyori/game.html
- 自動更新情報: https://lion000097.github.io/monster-biyori/latest.json
- 配布ZIP: https://lion000097.github.io/monster-biyori/releases/1.24.3/monster-biyori-1.24.3.zip

## 完了した修正と成果

| 修正 | 状態 | 保存済み検証 |
| --- | --- | --- |
| 戦闘中の編成変更・HP維持 | 完了 | tests/v1.24.3-party.cjs |
| 不正セーブ読込時の保護・旧セーブ互換 | 完了 | tests/v1.24.3-save-validation.cjs |
| 職員の疲労0の保持 | 完了 | tests/v1.24.3-save-validation.cjs |
| 並べ替え・選択後の一覧自動更新 | 完了 | tests/v1.24.3-selects.cjs |
| 道・地形編集の終了操作 | 完了 | tests/v1.24.3-terrain.cjs |

変更内容は [CHANGELOG](releases/1.24.3/CHANGELOG.md)、既存の回帰確認・互換性検証は [TESTING](releases/1.24.3/TESTING.md) を参照。専用テスト4本の合格記録を引き継いだ。今回、同じ実装や完了済みテストのやり直しは行っていない。

## 公開証拠

- 公開ソースコミット: `f00332f4906cb3b30f2284eb1fb37a0190829a14`
- ソースツリー: `d6e9d2a41db8d026abbce1d0254403057493af9d`
- GitHub Pages の公開処理: [44754973555](https://github.com/lion000097/monster-biyori/actions/runs/44754973555) — completed / success
- 共通入口HTML、1.24.3のHTML、配布ZIP、自動更新情報を公開URLから取得し、全てHTTP 200を確認。
- 公開HTMLは1,995,720 bytes、SHA256 `9fbaac1721a6c92a0485cc3622c823a718635949135ba86470623fe2cb925806`。共通入口・版別HTML・ZIP内HTML・latest.json指定値・保存済み完成データが一致。
- 配布ZIPは3,309,727 bytes、SHA256 `84726f68d68ac8e3683a1ae2671a233e579cb145711d52e2b94cfa7645a50385`。完成済みZIPと一致。
- 公開ページを実ブラウザで開き、タイトルとフッターのVer.1.24.3、既存セーブの読込、牧場とキャラクターの描画を確認。取得したエラーログにゲーム由来のエラーはなかった。
- 今回の実ブラウザ確認は起動・描画のスモーク確認。WindowsランチャーとiPhone実機での操作、未実行と記録されているローカルPlaywrightの全操作テストは実施していない。

## 再開時の手順

1. 最初にこのメモ、対象版のCHANGELOG・TESTING、リモートmainと公開先の状態を確認する。
2. 状態が完了なら同じ修正・アップロード・公開を繰り返さない。今回の1.24.3には残作業がない。
3. 新たな依頼は次版として扱い、対象版・未完了項目を先に記録する。
4. 修正を一つ終えるごとに、変更ファイル・成果・確認結果・未完了項目を保存し、ソースと進捗メモをリポジトリへ同期する。
5. 中断前には最後に保存したコミットと、公開の成否または残っている手順を残す。再開時は保存済み状態から未完了だけ進める。

## 引き継ぎ上の注意

旧ローカル公開準備コミット `debf541e7452e79fe40ba6fc489e7859543d98ae` は公開コミットとSHAが異なるが、ツリーが完全一致する。古いローカルorigin/mainの「ahead」表示だけで未公開と判断しない。2026-11-20 23:48 JST時点で、完成データのGitHub反映とPages公開は既に成功している。
