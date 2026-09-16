// D1 へのアクセスをまとめた層。SQL はこのファイルにだけ書く。

import type { Env, Post, PostRow, Report, ReportRow, User, UserRow } from "./types";
import { GENRES } from "./types";

// ------------------------------------------------------------
// 変換
// ------------------------------------------------------------

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function genreLabel(key: string): string {
  return GENRES.find((g) => g.key === key)?.label ?? key;
}

export function toPost(row: PostRow): Post {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    tip: row.tip,
    genre: row.genre,
    genreLabel: genreLabel(row.genre),
    prefecture: row.prefecture,
    durationMin: row.duration_min,
    budget: row.budget,
    authorName: row.author_name,
    userId: row.user_id ?? null,
    images: parseJsonArray(row.images),
    steps: parseJsonArray(row.steps),
    materials: parseJsonArray(row.materials),
    tags: parseJsonArray(row.tags),
    likeCount: Number(row.like_count ?? 0),
    reportCount: Number(row.report_count ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    loginId: row.login_id,
    displayName: row.display_name,
    createdAt: row.created_at,
  };
}

export function toReport(row: ReportRow): Report {
  return {
    id: row.id,
    postId: row.post_id,
    authorName: row.author_name,
    userId: row.user_id ?? null,
    body: row.body,
    imageUrl: row.image_url,
    likeCount: Number(row.like_count ?? 0),
    createdAt: row.created_at,
  };
}

// ------------------------------------------------------------
// ユーザー / セッション
// ------------------------------------------------------------

export interface UserInput {
  loginId: string;
  displayName: string;
  passwordHash: string;
}

export async function createUser(env: Env, input: UserInput): Promise<string> {
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO users (id, login_id, display_name, password_hash, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(id, input.loginId, input.displayName, input.passwordHash, new Date().toISOString())
    .run();
  return id;
}

/** ログイン照合用。password_hash を含む行をそのまま返す */
export async function findUserByLoginId(env: Env, loginId: string): Promise<UserRow | null> {
  const row = await env.DB.prepare(`SELECT * FROM users WHERE login_id = ?`)
    .bind(loginId)
    .first();
  return (row as UserRow) ?? null;
}

export async function findUserById(env: Env, id: string): Promise<User | null> {
  const row = await env.DB.prepare(`SELECT * FROM users WHERE id = ?`).bind(id).first();
  return row ? toUser(row as UserRow) : null;
}

export async function createSession(
  env: Env,
  input: { tokenHash: string; userId: string; expiresAt: string },
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
  )
    .bind(input.tokenHash, input.userId, new Date().toISOString(), input.expiresAt)
    .run();
}

/** 有効なセッションに紐づくユーザーを返す。期限切れなら null */
export async function findSessionUser(env: Env, tokenHash: string): Promise<User | null> {
  const row = await env.DB.prepare(
    `SELECT u.* FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`,
  )
    .bind(tokenHash, new Date().toISOString())
    .first();
  return row ? toUser(row as UserRow) : null;
}

export async function deleteSession(env: Env, tokenHash: string): Promise<void> {
  await env.DB.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(tokenHash).run();
}

// ------------------------------------------------------------
// 投稿
// ------------------------------------------------------------

export interface ListPostsOptions {
  q?: string;
  genres?: string[];
  prefecture?: string;
  budgetMin?: number;
  budgetMax?: number;
  durationMax?: number;
  tags?: string[];
  sort?: "new" | "old" | "popular" | "budget_asc" | "budget_desc";
  limit: number;
  offset: number;
}

const POST_SELECT = `
  SELECT p.*,
    (SELECT COUNT(*) FROM reports r WHERE r.post_id = p.id) AS report_count
  FROM posts p
`;

export async function listPosts(
  env: Env,
  opts: ListPostsOptions,
): Promise<{ posts: Post[]; total: number }> {
  const where: string[] = [];
  const params: unknown[] = [];

  if (opts.q) {
    where.push(`(p.title LIKE ? OR p.body LIKE ? OR p.tip LIKE ? OR p.prefecture LIKE ?)`);
    const like = `%${opts.q}%`;
    params.push(like, like, like, like);
  }

  if (opts.genres && opts.genres.length > 0) {
    where.push(`p.genre IN (${opts.genres.map(() => "?").join(", ")})`);
    params.push(...opts.genres);
  }

  if (opts.prefecture) {
    where.push(`p.prefecture = ?`);
    params.push(opts.prefecture);
  }

  if (typeof opts.budgetMin === "number") {
    where.push(`p.budget >= ?`);
    params.push(opts.budgetMin);
  }

  if (typeof opts.budgetMax === "number") {
    where.push(`p.budget <= ?`);
    params.push(opts.budgetMax);
  }

  if (typeof opts.durationMax === "number") {
    where.push(`p.duration_min <= ?`);
    params.push(opts.durationMax);
  }

  // tags は JSON 配列なので json_each で展開して突き合わせる
  if (opts.tags && opts.tags.length > 0) {
    where.push(`EXISTS (
      SELECT 1 FROM json_each(p.tags)
      WHERE json_each.value IN (${opts.tags.map(() => "?").join(", ")})
    )`);
    params.push(...opts.tags);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const orderSql = {
    new: "ORDER BY p.created_at DESC",
    old: "ORDER BY p.created_at ASC",
    popular: "ORDER BY p.like_count DESC, p.created_at DESC",
    budget_asc: "ORDER BY p.budget IS NULL, p.budget ASC",
    budget_desc: "ORDER BY p.budget IS NULL, p.budget DESC",
  }[opts.sort ?? "new"];

  const rows = await env.DB.prepare(
    `${POST_SELECT} ${whereSql} ${orderSql} LIMIT ? OFFSET ?`,
  )
    .bind(...params, opts.limit, opts.offset)
    .all();

  const countRow = await env.DB.prepare(
    `SELECT COUNT(*) AS total FROM posts p ${whereSql}`,
  )
    .bind(...params)
    .first();

  return {
    posts: (rows.results as PostRow[]).map(toPost),
    total: Number(countRow?.total ?? 0),
  };
}

export async function getPost(env: Env, id: string): Promise<Post | null> {
  const row = await env.DB.prepare(`${POST_SELECT} WHERE p.id = ?`).bind(id).first();
  return row ? toPost(row as PostRow) : null;
}

export interface PostInput {
  title: string;
  body: string;
  tip: string;
  genre: string;
  prefecture: string;
  durationMin: number | null;
  budget: number | null;
  authorName: string;
  userId: string | null;
  images: string[];
  steps: string[];
  materials: string[];
  tags: string[];
}

export async function createPost(env: Env, input: PostInput): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO posts (
       id, title, body, tip, genre, prefecture, duration_min, budget,
       author_name, user_id, images, steps, materials, tags, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      input.title,
      input.body,
      input.tip,
      input.genre,
      input.prefecture,
      input.durationMin,
      input.budget,
      input.authorName,
      input.userId,
      JSON.stringify(input.images),
      JSON.stringify(input.steps),
      JSON.stringify(input.materials),
      JSON.stringify(input.tags),
      now,
      now,
    )
    .run();

  return id;
}

/** 渡されたフィールドだけ更新する */
export async function updatePost(
  env: Env,
  id: string,
  patch: Partial<PostInput>,
): Promise<boolean> {
  // user_id は所有者なので更新対象から外す
  const columns: Record<Exclude<keyof PostInput, "userId">, string> = {
    title: "title",
    body: "body",
    tip: "tip",
    genre: "genre",
    prefecture: "prefecture",
    durationMin: "duration_min",
    budget: "budget",
    authorName: "author_name",
    images: "images",
    steps: "steps",
    materials: "materials",
    tags: "tags",
  };

  const sets: string[] = [];
  const params: unknown[] = [];

  type UpdatableKey = Exclude<keyof PostInput, "userId">;
  for (const [key, column] of Object.entries(columns) as [UpdatableKey, string][]) {
    if (!(key in patch)) continue;
    const value = patch[key];
    sets.push(`${column} = ?`);
    params.push(Array.isArray(value) ? JSON.stringify(value) : value ?? null);
  }

  if (sets.length === 0) return false;

  sets.push("updated_at = ?");
  params.push(new Date().toISOString(), id);

  const result = await env.DB.prepare(`UPDATE posts SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...params)
    .run();

  return (result.meta?.changes ?? 0) > 0;
}

export async function deletePost(env: Env, id: string): Promise<void> {
  // 参照制約のために、先に子テーブルを消す
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM reports WHERE post_id = ?`).bind(id),
    env.DB.prepare(`DELETE FROM posts WHERE id = ?`).bind(id),
  ]);
}

export async function postExists(env: Env, id: string): Promise<boolean> {
  const row = await env.DB.prepare(`SELECT id FROM posts WHERE id = ?`).bind(id).first();
  return row !== null;
}

// ------------------------------------------------------------
// いいね
// ------------------------------------------------------------
// 認証がないので「誰が押したか」は持たない。
// 二重に押させない制御はフロント側（localStorage など）の担当。

/** delta は +1 か -1。0 を下回らないようにする */
export async function addPostLike(env: Env, postId: string, delta: number): Promise<number> {
  await env.DB.prepare(
    `UPDATE posts SET like_count = MAX(0, like_count + ?) WHERE id = ?`,
  )
    .bind(delta, postId)
    .run();

  const row = await env.DB.prepare(`SELECT like_count FROM posts WHERE id = ?`)
    .bind(postId)
    .first();
  return Number(row?.like_count ?? 0);
}

export async function addReportLike(env: Env, reportId: string, delta: number): Promise<number> {
  await env.DB.prepare(
    `UPDATE reports SET like_count = MAX(0, like_count + ?) WHERE id = ?`,
  )
    .bind(delta, reportId)
    .run();

  const row = await env.DB.prepare(`SELECT like_count FROM reports WHERE id = ?`)
    .bind(reportId)
    .first();
  return Number(row?.like_count ?? 0);
}

// ------------------------------------------------------------
// レポート
// ------------------------------------------------------------

export async function listReports(env: Env, postId: string): Promise<Report[]> {
  const rows = await env.DB.prepare(
    `SELECT * FROM reports WHERE post_id = ? ORDER BY created_at DESC`,
  )
    .bind(postId)
    .all();
  return (rows.results as ReportRow[]).map(toReport);
}

export async function getReport(env: Env, id: string): Promise<Report | null> {
  const row = await env.DB.prepare(`SELECT * FROM reports WHERE id = ?`).bind(id).first();
  return row ? toReport(row as ReportRow) : null;
}

export interface ReportInput {
  postId: string;
  authorName: string;
  userId: string | null;
  body: string;
  imageUrl: string | null;
}

export async function createReport(env: Env, input: ReportInput): Promise<string> {
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO reports (id, post_id, author_name, user_id, body, image_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      input.postId,
      input.authorName,
      input.userId,
      input.body,
      input.imageUrl,
      new Date().toISOString(),
    )
    .run();
  return id;
}

export async function deleteReport(env: Env, id: string): Promise<void> {
  await env.DB.prepare(`DELETE FROM reports WHERE id = ?`).bind(id).run();
}

export async function reportExists(env: Env, id: string): Promise<boolean> {
  const row = await env.DB.prepare(`SELECT id FROM reports WHERE id = ?`).bind(id).first();
  return row !== null;
}

// ------------------------------------------------------------
// タグ
// ------------------------------------------------------------

/** 全投稿のタグを件数の多い順に集計する */
export async function listTags(env: Env): Promise<{ tag: string; count: number }[]> {
  const rows = await env.DB.prepare(
    `SELECT json_each.value AS tag, COUNT(*) AS count
     FROM posts, json_each(posts.tags)
     GROUP BY json_each.value
     ORDER BY count DESC, tag ASC`,
  ).all();
  return (rows.results as { tag: string; count: number }[]).map((r) => ({
    tag: String(r.tag),
    count: Number(r.count),
  }));
}
