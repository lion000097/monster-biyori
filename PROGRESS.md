# もんすたー日和 1.24.29「牧場のアイコン」

対象：1.24.29。基準は公開済み 1.24.28（`9c5ab203`）。本人よりしろガオ版の公開承認を受領。

保存先：本体 `game.html`、アプリ情報 `app.webmanifest`、画像 `app-icons/`、版別HTML・配布ZIP・Windows向けICO入りZIP・見本 `releases/1.24.29/`、自動更新情報 `latest.json`、公開ブラウザー検証 `tests/v1.24.29-icon.html`。

完了事項：ゲームの通常色のしろガオと世界樹のドット絵を、タブとインストールしたWebアプリに設定。ICOは16/24/32/48/64/128/256 px、透明PNGは512 px。公開URL・セーブ・既存Windows更新先は変更なし。WindowsのEXEは変更しない。

確認結果：ゲームとセーブのコードは1.24.28とバイト単位で同一。ルートと版別HTMLで同じインストール先、オフライン用HTMLの内蔵アイコン、透過・画像サイズ・ZIP内HTMLと自動更新の一致を確認。Windowsの実機表示は未確認。

本体 SHA-256：`8af4f6f7ea0e20f37373910e6c8e6a86a58498a9f11b69526672b65126d8e9e2`。
配布ZIP SHA-256：`ceaca584b6282d08ffc27d2668669ced293425cc468e05a6f0b8a7d59e12bfca`。

公開確認：公開コミット `4b0e732e6a59f1129a36a328a78a72cf08df70ec` を main と release/1.24.29 に反映。実際の公開先で本体の完全一致、自動更新情報、タブ用16・32px画像とWebアプリ用192・512px画像を確認。Chromium（幅1366pxと390px）で1.24.28セーブの引き継ぎ、ゲーム画面描画、再保存・再読み込みに成功。

公開先：https://lion000097.github.io/monster-biyori/game.html
動作確認：https://lion000097.github.io/monster-biyori/tests/v1.24.29-icon.html

残作業：公開は完了。Windows実機のタスクバーと公開URLからのZIP再取得は未確認。配布ZIPは公開コミットに収録、公開前に全239項目のCRCと同梱本体を照合済み。
次の操作：Windowsでは同じブラウザーのプロファイルでゲームをアプリとしてインストール・ピン留めする。従来のローカル版から切り替える場合はセーブの書き出し・読み込み。
