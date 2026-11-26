# ブラウザ版とランチャー版の公開手順
1. 通常版とは別に、自己完結するランチャー用 HTML を用意する。新しい大きな絵を入れたら軽量版のみ `python tools/pack_launcher_images.py 入力.html 出力.html` で圧縮できる。Pillow の WebP 対応が必要。圧縮後の全 RGBA が元画像と一致しない場合は PNG を残す。
2. 配信ZIPの `game.html` に軽量版を入れ、`latest.json` の配信URL・SHA-256を軽量版に合わせる。普通のWeb版には軽量化を強制しない。
3. 全成果物を揃えた公開候補で `python tools/release_preflight.py --root <候補フォルダー>` を実行する。4 MiB上限、バージョン、ハッシュ、ZIPのCRC・中身、通常版の一致を検査する。
4. Gitで公開する場合は、公開用コミットを作った後 `python tools/release_preflight.py --commit HEAD --push origin` を使う。検査対象のコミットだけを検査成功後に main へ送る。GitHub APIで配信する場合も、候補ファイルの検査を成功させ、登録したファイルのハッシュが一致してから main を更新する。

GitHub Pagesの既存設定やランチャーEXEには変更なし。ブラウザから直接mainへアップロードするなど、上記の手順を使わない更新に対してサーバー側で検査を強制するものではない。
