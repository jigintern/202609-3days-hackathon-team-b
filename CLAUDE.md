# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

推し活シェアサービス「オシピ！」。Cloudflare Workers + D1 + R2 + 静的HTML/JS（フレームワークなし）の3日間ハッカソン用リポジトリ。本番: https://intern-b.tekitou.app 、`main` への push で GitHub Actions (`.github/workflows/deploy.yml`) が自動デプロイする。

## Commands

依存パッケージは無い（`package.json` は npm scripts を置くためだけのもので `dependencies` が無い）ので `npx wrangler` がそのまま使える。

```bash
# 初回のみ: D1スキーマをローカルに適用
npm run migrate

# ローカル起動（Workers + D1 + R2 をローカルエミュレート）
npm run dev

# 型を使いたくなったら生成する（現状は生成していない。api/types.ts の Env は any 型で代用）
npx wrangler types
```

**`npx wrangler dev` を直接叩かないこと。** `assets.directory` がリポジトリルートなので、wrangler が `.wrangler/tmp` にバンドルを書くたびにアセット変更として検知され、リロードが無限ループする。`npm run dev` は `scripts/dev-config.mjs` で設定ファイルを `~/.cache/wrangler-dev-team-b/` に書き出して `-c` で渡し、`.wrangler` をリポジトリ外に追い出すことでこれを回避している（`.assetsignore` は配信対象から外すだけで、ファイル監視には効かない）。

ビルド・lint・テストの仕組みは無い（CIも `wrangler-action` でのデプロイのみ）。

## Architecture

### リクエストの振り分け

`wrangler.jsonc` の `assets.directory: "./"` により、`/api/*` 以外は静的ファイルとしてそのまま配信される。`/api/*` だけが `api/index.ts` の Workers ハンドラに渡る。ルーターライブラリは使わず、`api/index.ts` の `route()` がパスを `/` で分割して素直に分岐している（`posts`/`reports`/`images`/`genres`/`prefectures`/`tags`）。

### api/ 内の層分け

- `api/index.ts` — ルーティングのみ。ビジネスロジックは持たない
- `api/posts.ts` / `api/reports.ts` / `api/images.ts` / `api/meta.ts` — リクエストの検証・組み立て（ハンドラ層）
- `api/db.ts` — D1へのSQLはここだけに書く。行↔API型（`PostRow`→`Post`など）の変換もここ
- `api/http.ts` — レスポンス生成（`json`/`error`/`preflight`）と入力パース（`str`/`optInt`/`strArray`など）の共通処理
- `api/types.ts` — `Env`、`GENRES`/`GENRE_KEYS`/`PREFECTURES` などの定数、DBの行型とAPI型

`images`/`steps`/`materials`/`tags` はD1に JSON配列のテキストとして保存され（`api/migrations/0001_init.sql`）、`db.ts` の `toPost()` でパースしてAPI型に変換される。タグ検索は `json_each` でSQLite側で展開して突き合わせている。

### 認証なし・いいねは単純カウンタ

ログイン機能が無いため、投稿者名未指定時は `types.ts` の `randomName()` でランダムな名前を割り当てる。いいねは「誰が押したか」を持たない単純増減カウンタ（`db.ts` の `addPostLike`/`addReportLike`）で、二重押下の防止はフロント側の `localStorage` 管理に委ねている。

### CORS

認証・Cookieを使わない設計のため `Access-Control-Allow-Origin: *` を全レスポンス（プリフライト・エラー含む）に付与している（`api/http.ts` の `CORS_HEADERS`）。Cookie認証を導入する場合はこの前提が崩れるため設計変更が必要。

### フロントエンド（`index.html` / `search/index.html` / `detail/index.html` / `post/index.html`）

各画面は依存なしの単一HTMLファイル（インラインscript）として独立して実装されており、共通処理を切り出す仕組み（`assets/`配下の共通JSなど）は無い。そのため `escapeHtml`/`formatBudget`/`formatDuration`/`formatDate`/`debounce` やいいね済みIDの `localStorage` 管理などが各ファイルに個別実装されており、挙動が食い違っていることがある（修正時は該当ファイルすべてを横断して確認すること）。API接続先は各ファイルで `API_BASE` として本番URL（`https://intern-b.tekitou.app`）に固定している（CORSが `*` のため、どのオリジンから開いても本番APIを直接叩ける前提）。

## 作業ルール

- 作業前は必ず専用ブランチを切ってから着手する。
- 複数人が同時に同じファイル（特に3画面のインラインHTML）を触るため、変更は最小限・影響範囲を最小限にとどめ、無関係なリネーム・整形などを避けてコンフリクトを予防する。
- PRのマージは行わない（責任者がマージする）。PR本文の書き方は `.claude/skills/pr-description/SKILL.md` を参照。
