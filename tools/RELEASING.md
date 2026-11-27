# ブラウザ版とランチャー版の公開手順
1. 通常版とは別に、自己完結するランチャー用 HTML を用意する。新しい大きな絵を入れたら軽量版のみ `python tools/pack_launcher_images.py 入力.html 出力.html` で圧縮できる。Pillow の WebP 対応が必要。圧縮後の全 RGBA が元画像と一致しない場合は PNG を残す。
   1.25.61以降の町の建物は `assets/town-buildings/` の原寸PNGを編集し、`python tools/embed_town_art.py game.html` で4方向の絵を埋め込む。画像を軽量化した自己完結HTMLに `python tools/pack_launcher_html.py 入力.html launcher-game.html` を実行すると、全ゲームデータがオフラインで読める軽量版になる。1.25.67では同コマンドに `--dense` を追加し、ビルド環境のlibdeflateで通常のzlib形式に可逆圧縮する。
   1.25.69以降の冒険モンスター原画は `assets/adventure/frontier-11-15.png`。1.25.70以降の同エリアのお宝は `assets/adventure/frontier-treasures-11-15.png`（64px角、左から11〜15面、上段SSR・下段UR）。通常版には `python tools/embed_frontier_art.py game.html` で埋め込み、軽量版の入力では同じコマンドに `--launcher` を追加する。最終HTMLを `tools/pack_launcher_html.py --dense --binary-assets` でパックすると、埋め込みデータを可逆圧縮し、起動時に元の画像とゲームを復元する。
2. 配信ZIPの `game.html` に軽量版を入れ、`latest.json` の配信URL・SHA-256を軽量版に合わせる。普通のWeb版には軽量化を強制しない。
3. 全成果物を揃えた公開候補で `python tools/release_preflight.py --root <候補フォルダー>` を実行する。4 MiB上限、バージョン、ハッシュ、ZIPのCRC・中身、通常版の一致を検査する。
4. Gitで公開する場合は、公開用コミットを作った後 `python tools/release_preflight.py --commit HEAD --push origin` を使う。検査対象のコミットだけを検査成功後に main へ送る。GitHub APIで配信する場合も、候補ファイルの検査を成功させ、登録したファイルのハッシュが一致してから main を更新する。

GitHub Pagesの既存設定やランチャーEXEには変更なし。ブラウザから直接mainへアップロードするなど、上記の手順を使わない更新に対してサーバー側で検査を強制するものではない。
