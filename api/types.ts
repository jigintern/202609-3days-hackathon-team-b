// アプリ全体で使う型と定数。
// D1 / R2 の型定義は @cloudflare/workers-types を入れていないため any にしている。
// 必要になったら `npx wrangler types` で worker-configuration.d.ts を生成する。

export interface Env {
  DB: any;      // D1Database
  BUCKET: any;  // R2Bucket
}

// ------------------------------------------------------------
// ランダムな表示名
// ------------------------------------------------------------
// ログイン機能がないため、投稿者名が未指定のときはここから組み合わせて作る。

const NAME_ADJECTIVES = [
  "ゆかいな", "しずかな", "きまぐれな", "ねむたい", "げんきな", "ひかえめな",
  "まじめな", "のんきな", "はしゃぐ", "やさしい", "たそがれの", "はりきる",
  "ほろ酔いの", "ひたむきな", "うたたねの", "そわそわした", "めざめた", "ひなたの",
] as const;

const NAME_ANIMALS = [
  "カワウソ", "ペンギン", "アルパカ", "ハリネズミ", "シマエナガ", "カピバラ",
  "レッサーパンダ", "ウォンバット", "マヌルネコ", "ラッコ", "アザラシ", "フクロウ",
  "コツメカワウソ", "ヤマネ", "モモンガ", "ハクトウワシ", "サーバル", "クアッカ",
] as const;

/** 「ゆかいなカワウソ42」のような表示名を作る */
export function randomName(): string {
  const adjective = NAME_ADJECTIVES[Math.floor(Math.random() * NAME_ADJECTIVES.length)];
  const animal = NAME_ANIMALS[Math.floor(Math.random() * NAME_ANIMALS.length)];
  const number = Math.floor(Math.random() * 100);
  return `${adjective}${animal}${number}`;
}

/** ジャンル。search/index.html の定義に合わせる */
export const GENRES = [
  { key: "pilgrimage", label: "聖地巡礼" },
  { key: "craft", label: "グッズ制作" },
  { key: "live", label: "参戦" },
  { key: "cafe", label: "推しカフェ" },
  { key: "collection", label: "コレクション" },
  { key: "home", label: "自宅推し活" },
] as const;

export const GENRE_KEYS = GENRES.map((g) => g.key) as readonly string[];

export const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県",
  "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
] as const;

/** posts テーブルの行 */
export interface PostRow {
  id: string;
  title: string;
  body: string;
  tip: string;
  genre: string;
  prefecture: string;
  duration_min: number | null;
  budget: number | null;
  author_name: string;
  images: string;     // JSON 配列
  steps: string;      // JSON 配列
  materials: string;  // JSON 配列
  tags: string;       // JSON 配列
  like_count: number;
  created_at: string;
  updated_at: string;
  report_count?: number;
}

/** API が返す投稿 */
export interface Post {
  id: string;
  title: string;
  body: string;
  tip: string;
  genre: string;
  genreLabel: string;
  prefecture: string;
  durationMin: number | null;
  budget: number | null;
  authorName: string;
  images: string[];
  steps: string[];
  materials: string[];
  tags: string[];
  likeCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
}

/** reports テーブルの行 */
export interface ReportRow {
  id: string;
  post_id: string;
  author_name: string;
  body: string;
  image_url: string | null;
  like_count: number;
  created_at: string;
}

/** API が返すレポート */
export interface Report {
  id: string;
  postId: string;
  authorName: string;
  body: string;
  imageUrl: string | null;
  likeCount: number;
  createdAt: string;
}
