# 映像概論 ―今から、源流へ遡る2年間

講師：蔡本英賛（株式会社リキッドブロック）

## 構成
| パス | 中身 |
|---|---|
| `curriculum/plan.yaml` | 60回＋外伝の一覧（唯一の正）。テーマ、作品、宿題、はしごの段階、ラベル、ファクトチェックの状態 |
| `lessons/NN/blog.md` | 各回の記事（作品データ、作り手、考察、時間割、演習、問い、参照動画、書籍、出典） |
| `gaiden/NN.md` | 外伝5本（ソール・バス、バウハウス、デザインの力、広告の日本と海外、製作委員会） |
| `essays/01-seekbar.md` | はじめに読む「シークバーを、ただ通り過ぎないために」 |
| `pages/` | 60回の地図、分析シート、年表（賞・MVの賞を含む）、スタジオ、用語集、書棚、リンク集、この授業について、外伝の一覧 |
| `figures/` | 図解（SVG） |
| `site-prototype.html` | claude.ai で作った試作サイト（参照用） |
| `docs/HANDOFF.md` | ここまでの経緯、決定事項、残タスク |
| `docs/KICKOFF_PROMPT.md` | Claude Code に最初に渡す指示 |

## サイトの作り方（Astro）
```bash
npm install
npm run dev      # http://localhost:4321/
npm run build    # dist/ に静的サイトを出力
```
- `curriculum/plan.yaml` が一覧・前後ナビ・時代色の元データ。記事は各Markdownから生成
- 表・囲み・動画カードの整形は `src/lib/remark-eizo.mjs`（ビルド時のみ。Markdownの本文は書き換えない）
- 公開先：リポジトリ変数 `SITE_URL` / `BASE_PATH` を設定（独自ドメインなら `BASE_PATH` は `/`）。GitHub Pages のソースは「GitHub Actions」
- 一部だけ非公開にする：記事の front matter に `visibility: internal` を書くとビルドから外れる
- Amazonタグ：`AMAZON_TAG_ENABLED=1` でビルドしたときだけ付く（登録後に使う。表示文と「PR」表記は別途追加が必要）
