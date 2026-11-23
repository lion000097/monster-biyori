# 1.25.6 economy / progression check

Inputs are immutable snapshots; each result records the SHA-256 of the exact input game HTML. Run the adapter beside the shipped `harness138.cjs`, `simulate-adventure-1.24.16.cjs`, and `tree-policy-1.24.16.cjs` under `tests/`:

    NODE_PATH=/tmp/qa1255-sim/node_modules node tests/simulate-world-tree-1.25.6.cjs game.html 7 68 25 result.json

Run separately at seed/check-in pairs 23/20, 7/25, 91/30 for matched comparisons. The simulator executes the shipped animate loop at 100 ms and 1× foreground active time, without visual presentation overhead. Fresh-save usual starter placements; legal paid building, road, upgrade and land placement; normal orders when affordable, research capped to Lv3 by benchmark policy; no manual training/boss farming, expeditions and auto adventure normal. Add `--no-orders` to skip both routine and VIP orders; add `--target21` to let the same ordinary policy attempt actual Lv21 (finite max time still applies). `complete` is legacy for both tree and Adventure end; use `tree20Seconds` for the tree target. `23,7,91` are not interchangeable across visit cadence; match seed AND cadence when comparing.

Every hourly snapshot records current holdings and the game's own xp, magic, and coin fee, plus bottom-up price of each required facility build and every remaining mandatory upgrade step. `fullCoins` includes the tree fee plus all the mandatory building work found by the game, **not optional construction, land or roads** (which are nevertheless paid in the simulation). Construction can still be blocked by space, roads, campus/lot rules or building caps even where the cash total is payable. If a first-free facility is absent and two are needed, only the first one is marked free; the production game is not changed. Each snapshot is an observation, not necessarily an entire continuous hour blocked. `nextTwoTreeFees` extrapolates only the downstream tree fees/XP, not subsequent facilities; affordable in that field alone does not establish sustainable post-Lv20 balance. The `--target21` route requires proof under ordinary gameplay, not direct edit of levels, money, inventories or tree experience.

The enhanced adapter also records cumulative sale revenue/units and existing game metrics (e.g. logged earnings and produced food), as well as paid policy action counts and fame at hourly/final snapshots. Historical traces lacking these fields remain valid for common fields; don't infer fame from cash or derive total food use from implementation counters when they omit a source. The exact public 1.25.5 hash is `47b4ebbd72692cb662b9cd42f890864ed8457818f555cef81cd8e3a69fd5b906`, integrated 1.25.6 candidate under test `aa5cc460cb6d721870d887c2fae7a09c07d45285039cfac2441e92eb25597a69`.

## 比較結果

| seed / 確認間隔 | 旧Lv20 | 新Lv10 | 新Lv15 | 新Lv20 | G | ごはん | 素材在庫 | キラキラ | 次のLv21までに必要なG |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 23 / 20分 | 57:00 | 9:00 | 25:40 | 58:20 | 1,789,715 | 4,087 | 28,187 | 1,721 | 2,516,509 |
| 7 / 25分 | 59:10 | 9:10 | 27:05 | 61:15 | 1,944,729 | 4,012 | 29,378 | 1,776 | 2,516,509 |
| 91 / 30分 | 60:00 | 9:30 | 28:00 | 63:00 | 1,875,888 | 3,773 | 26,135 | 1,786 | 2,516,509 |

各値はLv20到達直後。時刻は1倍速の累計時間:分。次のLv21の必要Gには必須の建築・強化・成長費を含む。上の試算はLv20到達で停止し、10-5の突破やLv21以降の進行時間を測ったものではない。

最終候補HTML SHA-256: `d1956144c21738782ad896d6b890f5397e38e311b90503f25a5129b3e16cd35f`。計測した候補からの変更は経営・素材・支援金・まつりの表示のみ。資源・シミュレーションのルールは一致。

## 追加の試算：注文なし

seed 91、確認間隔30分の同条件で注文だけ省いた1回では、世界樹Lv20に73時間00分（通常注文を含む試算では63時間00分）。80時間で打ち切った時点で、Lv21に必要な追加施設の建設と強化63段階を済ませた。所持金2,448,395 Gとキラキラ3,120は成長費395,029 Gとキラキラ1,139を満たし、成長XPが約32不足。Lv21到達は未観測。この結果は単独の試算であり、約60時間は通常注文を含む目安。
