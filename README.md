# ようこそハッカソンへ 🎉

3日間ハッカソン チームB のリポジトリです。

## これは何

短期間でアイデアを形にするためのハッカソン用リポジトリです。作りたいものを、動くところまで持っていきましょう。

推し活シェアサービス「オシピ！」を作っています。

- 公開 URL: https://intern-b.tekitou.app
- `main` に push すると GitHub Actions で自動デプロイされます

## はじめかた

```bash
git clone <このリポジトリのURL>
cd 202609-3days-hackathon-team-b
```

ローカルで動かす場合（Cloudflare Workers + D1 + R2 がローカルエミュレートされます）。

```bash
npx wrangler d1 migrations apply hackathon-team-b --local  # 初回のみ
npx wrangler dev
```

## ディレクトリ構成

| パス            | 役割                                     |
| --------------- | ---------------------------------------- |
| `index.html`    | トップ（投稿一覧・キーワード / 予算 / ジャンル絞り込み） |
| `search/`       | 検索画面（予算・ジャンル・タグで絞り込み）   |
| `detail/`       | 投稿詳細（画像・手順・材料・いいね・レポート） |
| `post/`         | 投稿フォーム                               |
| `api/`          | Cloudflare Workers の API と DB 関連コード |
| `api/migrations/` | D1 のスキーマ定義                        |

## スケジュール

| 日程  | やること           |
| ----- | ------------------ |
| Day 1 | アイデア出し・設計 |
| Day 2 | 実装               |
| Day 3 | 仕上げ・発表       |

## 進め方

- ブランチを切って作業し、PR でマージする
- 困ったらすぐチームに共有する
- まずは動くものを優先する

---

# API

`/api/*` へのリクエストは Cloudflare Workers（`api/index.ts`）が処理します。それ以外のパスは静的ファイルとして配信されます。

レスポンスはすべて JSON（`Content-Type: application/json; charset=utf-8`）です。エラー時は `{ "error": "メッセージ" }` を返します。

## 認証について

**認証はありません。** ヘッダーもトークンも不要で、どのエンドポイントもそのまま呼べます。

投稿者名（`authorName`）を省略すると、サーバー側で「ゆかいなカワウソ42」のようなランダムな名前が割り当てられます。名前を入力させたい場合だけ `authorName` を送ってください。

いいねは誰が押したかを記録しない単純なカウンタです。そのため**同じ人が何度も押せば増えます**。二重に押させない制御が必要なら、フロント側で `localStorage` に記録してボタンを無効化してください。

```js
// 押した投稿を覚えておく例
const liked = new Set(JSON.parse(localStorage.getItem("liked") ?? "[]"));

async function toggleLike(postId) {
  const method = liked.has(postId) ? "DELETE" : "POST";
  const res = await fetch(`/api/posts/${postId}/like`, { method });
  const { likeCount } = await res.json();

  liked.has(postId) ? liked.delete(postId) : liked.add(postId);
  localStorage.setItem("liked", JSON.stringify([...liked]));
  return likeCount;
}
```

## エンドポイント一覧

| メソッド | パス                        | 用途                       | 使うページ           |
| -------- | --------------------------- | -------------------------- | -------------------- |
| GET      | `/api/health`               | 死活確認                   | —                    |
| GET      | `/api/posts`                | 投稿一覧・検索・絞り込み   | トップ / 検索        |
| POST     | `/api/posts`                | 投稿の作成                 | 投稿フォーム         |
| GET      | `/api/posts/:id`            | 投稿の詳細                 | 詳細                 |
| PATCH    | `/api/posts/:id`            | 投稿の更新                 | （編集画面を作る場合） |
| DELETE   | `/api/posts/:id`            | 投稿の削除                 | （編集画面を作る場合） |
| POST     | `/api/posts/:id/like`       | 投稿にいいね               | 詳細                 |
| DELETE   | `/api/posts/:id/like`       | 投稿のいいねを取り消し     | 詳細                 |
| GET      | `/api/posts/:id/reports`    | レポート一覧               | 詳細                 |
| POST     | `/api/posts/:id/reports`    | レポートの投稿             | 詳細                 |
| DELETE   | `/api/reports/:id`          | レポートの削除             | 詳細                 |
| POST     | `/api/reports/:id/like`     | レポートにいいね           | 詳細                 |
| DELETE   | `/api/reports/:id/like`     | レポートのいいねを取り消し | 詳細                 |
| POST     | `/api/images`               | 画像を R2 にアップロード   | 投稿フォーム / 詳細  |
| GET      | `/api/images/:key`          | 画像の配信                 | 全ページ             |
| DELETE   | `/api/images/:key`          | 画像の削除                 | —                    |
| GET      | `/api/genres`               | ジャンル一覧               | 全ページ             |
| GET      | `/api/prefectures`          | 都道府県一覧               | 投稿フォーム / 検索  |
| GET      | `/api/tags`                 | タグ一覧（件数つき）       | 検索                 |

## 投稿

### `GET /api/posts`

一覧・検索・絞り込みを 1 本で担います。クエリパラメータはすべて任意です。

| パラメータ    | 型     | 説明                                                              |
| ------------- | ------ | ----------------------------------------------------------------- |
| `q`           | string | キーワード。`title` / `body` / `tip` / `prefecture` を部分一致検索 |
| `genre`       | string | ジャンルキー。カンマ区切りで複数指定可（`craft,live`）             |
| `prefecture`  | string | 都道府県名の完全一致（`東京都`）                                  |
| `budgetMin`   | number | 予算の下限（円）                                                  |
| `budgetMax`   | number | 予算の上限（円）                                                  |
| `durationMax` | number | 所要時間の上限（分）                                              |
| `tags`        | string | タグ。カンマ区切りで複数指定可（いずれかに一致）                  |
| `sort`        | string | `new`（既定） / `old` / `popular` / `budget_asc` / `budget_desc`  |
| `limit`       | number | 取得件数。既定 20、最大 100                                       |
| `offset`      | number | 取得開始位置。既定 0                                              |

```bash
# 予算1000円以下のグッズ制作を人気順に
curl "https://intern-b.tekitou.app/api/posts?genre=craft&budgetMax=1000&sort=popular"
```

```jsonc
{
  "posts": [ /* Post オブジェクトの配列。形は下の GET /api/posts/:id と同じ */ ],
  "total": 42,
  "limit": 20,
  "offset": 0,
  "hasMore": true
}
```

### `GET /api/posts/:id`

```jsonc
{
  "id": "0f9a...",
  "title": "推しの缶バッジ風アクセサリー作り",
  "body": "推しのイラストを使ったオリジナル缶バッジを手作りしました。",
  "tip": "近くに「手芸センタードリーム 新宿店」があります",
  "genre": "craft",
  "genreLabel": "グッズ制作",
  "prefecture": "東京都",
  "durationMin": 180,
  "budget": 2500,
  "authorName": "みさき",
  "images": ["/api/images/posts/2026-09-15/xxxx.png"],
  "steps": ["イラストを印刷する", "丸く切り抜く"],
  "materials": ["缶バッジキット(38mm) ×5", "コピー用紙"],
  "tags": ["初心者向け", "100均"],
  "likeCount": 128,
  "reportCount": 2,
  "createdAt": "2026-09-15T05:00:00.000Z",
  "updatedAt": "2026-09-15T05:00:00.000Z"
}
```

見つからない場合は `404`。

### `POST /api/posts`

| フィールド    | 型       | 必須 | 制約                                             |
| ------------- | -------- | ---- | ------------------------------------------------ |
| `title`       | string   | ✻    | 1〜60 文字                                       |
| `body`        | string   | ✻    | 1〜1000 文字                                     |
| `genre`       | string   | ✻    | ジャンルキーのいずれか                           |
| `images`      | string[] | ✻    | 1〜5 件。`POST /api/images` が返した URL を入れる |
| `tip`         | string   |      | 200 文字まで                                     |
| `prefecture`  | string   |      | 都道府県名。空文字可                             |
| `durationMin` | number   |      | 0〜10080（分）                                   |
| `budget`      | number   |      | 0〜1000000（円）                                 |
| `authorName`  | string   |      | 20 文字まで。省略時はランダムな名前を自動生成    |
| `steps`       | string[] |      | 30 件まで、各 120 文字まで                       |
| `materials`   | string[] |      | 30 件まで、各 120 文字まで                       |
| `tags`        | string[] |      | 10 件まで、各 20 文字まで                        |

```bash
curl -X POST https://intern-b.tekitou.app/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "100均だけで手作り応援うちわ",
    "body": "文字パネル用のうちわを100均素材だけで自作しました。",
    "genre": "craft",
    "images": ["/api/images/posts/2026-09-15/xxxx.png"],
    "prefecture": "大阪府",
    "durationMin": 90,
    "budget": 750,
    "steps": ["厚紙を台紙にする", "文字を切り抜いて貼る"]
  }'
```

成功すると `201` と作成された投稿を返します。バリデーションエラーは `422`。

### `PATCH /api/posts/:id`

`POST` と同じフィールドを受け取り、**渡されたフィールドだけ**を更新します。`PUT` も同じ動作です。

### `DELETE /api/posts/:id`

投稿とそれに紐づくレポート・いいねをまとめて削除し、`204` を返します。

## いいね

`POST` で +1、`DELETE` で -1 します。0 を下回ることはありません。

```bash
curl -X POST https://intern-b.tekitou.app/api/posts/<id>/like
```

```json
{ "postId": "0f9a...", "likeCount": 129 }
```

レポートへのいいねは `/api/reports/:id/like` で、レスポンスは `reportId` になります。誰が押したかは記録しないので、二重押しの制御はフロント側の担当です。

## レポート（行ってきましたレポート）

### `GET /api/posts/:id/reports`

```jsonc
{
  "reports": [
    {
      "id": "1a2b...",
      "postId": "0f9a...",
      "authorName": "ゆか",
      "body": "実際に作ってみました！30分で完成しました✨",
      "imageUrl": "/api/images/posts/2026-09-15/yyyy.png",
      "likeCount": 12,
      "createdAt": "2026-09-15T06:00:00.000Z"
    }
  ],
  "total": 1
}
```

### `POST /api/posts/:id/reports`

| フィールド   | 型     | 必須 | 制約                       |
| ------------ | ------ | ---- | -------------------------- |
| `body`       | string | ✻    | 1〜500 文字                |
| `imageUrl`   | string |      | `POST /api/images` の戻り値 |
| `authorName` | string |      | 20 文字まで。省略時はランダムな名前を自動生成 |

### `DELETE /api/reports/:id`

`204` を返します。

## 画像

### `POST /api/images`

`multipart/form-data` の `file` フィールド、または画像バイナリを直接 POST します。

- 対応形式: `image/jpeg` / `image/png` / `image/webp` / `image/gif`
- 上限: 8MB

```bash
curl -X POST https://intern-b.tekitou.app/api/images -F "file=@photo.jpg"
```

```json
{
  "key": "posts/2026-09-15/xxxx.jpg",
  "url": "/api/images/posts/2026-09-15/xxxx.jpg",
  "size": 204800,
  "contentType": "image/jpeg"
}
```

返ってきた `url` を投稿の `images` やレポートの `imageUrl` に入れます。対応外の形式は `415`、サイズ超過は `413`。

### `GET /api/images/:key`

R2 から画像を配信します。`Cache-Control: public, max-age=31536000, immutable` が付きます。

### `DELETE /api/images/:key`

`204` を返します。

## 選択肢データ

フロントでハードコードせずに済むよう用意しています。

```bash
curl https://intern-b.tekitou.app/api/genres
```

```json
{
  "genres": [
    { "key": "pilgrimage", "label": "聖地巡礼" },
    { "key": "craft", "label": "グッズ制作" },
    { "key": "live", "label": "参戦" },
    { "key": "cafe", "label": "推しカフェ" },
    { "key": "collection", "label": "コレクション" },
    { "key": "home", "label": "自宅推し活" }
  ]
}
```

`GET /api/prefectures` は 47 都道府県の配列、`GET /api/tags` は `{ "tags": [{ "tag": "100均", "count": 12 }] }` の形で件数の多い順に返します。

## ステータスコード

| コード | 意味                                             |
| ------ | ------------------------------------------------ |
| 200    | 成功                                             |
| 201    | 作成成功（投稿・レポート・画像アップロード）     |
| 204    | 削除成功（レスポンスボディなし）                 |
| 400    | リクエストが不正（JSON が壊れているなど）        |
| 404    | 対象が存在しない                                 |
| 405    | メソッドが許可されていない（`Allow` ヘッダー参照） |
| 413    | 画像が 8MB を超えている                          |
| 415    | 画像の形式が対応外                               |
| 422    | バリデーションエラー                             |
| 500    | サーバー内部エラー                               |

---

# データベース

D1（SQLite）を使います。スキーマは `api/migrations/` にあります。

| テーブル  | 役割                   |
| --------- | ---------------------- |
| `posts`   | 投稿本体               |
| `reports` | 行ってきましたレポート |

`images` / `steps` / `materials` / `tags` は JSON 配列テキストとして `posts` に持たせています。タグ検索は SQLite の `json_each` で展開して突き合わせます。

いいねは `posts.like_count` / `reports.like_count` のカウンタです。認証がないため、誰が押したかは保持していません。

## 初期データ

`api/migrations/0002_seed.sql` に各ページのモックデータ（投稿20件・レポート2件）が入っています。マイグレーションを適用すると一緒に投入されます。

投稿の `id` は元のモックのまま（`p01`〜`p09` / `p001`〜`p010` / `p100`）なので、`detail/index.html?id=p001` のような既存リンクがそのまま使えます。

デモ用データが不要になったら、このファイルの中身を消してこう片付けられます。

```sql
DELETE FROM reports WHERE post_id LIKE 'p%';
DELETE FROM posts WHERE id LIKE 'p0%' OR id = 'p100';
```

## マイグレーションの適用

```bash
# ローカル（.wrangler 配下のエミュレータ）
npx wrangler d1 migrations apply hackathon-team-b --local

# 本番
npx wrangler d1 migrations apply hackathon-team-b --remote
```

## api/ のファイル構成

| ファイル                    | 役割                                     |
| --------------------------- | ---------------------------------------- |
| `index.ts`                  | ルーティング（`/api/*` の振り分け）      |
| `types.ts`                  | 型定義、ジャンル・都道府県の定数、ランダム名の生成 |
| `db.ts`                     | D1 アクセス層。SQL はこのファイルにだけ書く |
| `http.ts`                   | レスポンス生成と入力値の正規化           |
| `posts.ts`                  | 投稿のハンドラ                           |
| `reports.ts`                | レポートのハンドラ                       |
| `images.ts`                 | R2 への画像アップロードと配信            |
| `meta.ts`                   | ジャンル・都道府県・タグ                 |
| `migrations/0001_init.sql`  | テーブル定義                             |
| `migrations/0002_seed.sql`  | 各ページのモックデータ                   |

Happy Hacking! 🚀
