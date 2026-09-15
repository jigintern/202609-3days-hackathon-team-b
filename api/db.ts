// D1 へのアクセスをまとめた層。SQL はこのファイルにだけ書く。

import type { Env, Post, PostRow, Report, ReportRow } from "./types";
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
    images: parseJsonArray(row.images),
    steps: parseJsonArray(row.steps),
    materials: parseJsonArray(row.materials),
    tags: parseJsonArray(row.tags),
    likeCount: Number(row.like_count ?? 0),
    liked: Boolean(row.liked),
    reportCount: Number(row.report_count ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toReport(row: ReportRow): Report {
  return {
    id: row.id,
    postId: row.post_id,
    authorName: row.author_name,
    body: row.body,
    imageUrl: row.image_url,
    likeCount: Number(row.like_count ?? 0),
    liked: Boolean(row.liked),
    createdAt: row.created_at,
  };
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
  clientId: string;
}

/** いいね数・レポート数・自分がいいね済みかを含む共通の SELECT */
const POST_SELECT = `
  SELECT p.*,
    (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS like_count,
    (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id AND pl.client_id = ?1) AS liked,
    (SELECT COUNT(*) FROM reports r WHERE r.post_id = p.id) AS report_count
  FROM posts p
`;

export async function listPosts(
  env: Env,
  opts: ListPostsOptions,
): Promise<{ posts: Post[]; total: number }> {
  const where: string[] = [];
  const params: unknown[] = [opts.clientId];

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
    popular: "ORDER BY like_count DESC, p.created_at DESC",
    budget_asc: "ORDER BY p.budget IS NULL, p.budget ASC",
    budget_desc: "ORDER BY p.budget IS NULL, p.budget DESC",
  }[opts.sort ?? "new"];

  // ?1 を使うため clientId が先頭。以降の ? は順番に埋まる
  const rows = await env.DB.prepare(
    `${POST_SELECT} ${whereSql} ${orderSql} LIMIT ? OFFSET ?`,
  )
    .bind(...params, opts.limit, opts.offset)
    .all();

  // 件数は clientId を使わないので、WHERE 用のパラメータだけ渡す
  const countParams = params.slice(1);
  const countRow = await env.DB.prepare(
    `SELECT COUNT(*) AS total FROM posts p ${whereSql}`,
  )
    .bind(...countParams)
    .first();

  return {
    posts: (rows.results as PostRow[]).map(toPost),
    total: Number(countRow?.total ?? 0),
  };
}

export async function getPost(env: Env, id: string, clientId: string): Promise<Post | null> {
  const row = await env.DB.prepare(`${POST_SELECT} WHERE p.id = ?`)
    .bind(clientId, id)
    .first();
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
       author_name, images, steps, materials, tags, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
  const columns: Record<keyof PostInput, string> = {
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

  for (const [key, column] of Object.entries(columns) as [keyof PostInput, string][]) {
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

export async function deletePost(env: Env, id: string): Promise<boolean> {
  // ON DELETE CASCADE は D1 の既定で無効なので、子テーブルを明示的に消す
  await env.DB.batch([
    env.DB.prepare(
      `DELETE FROM report_likes WHERE report_id IN (SELECT id FROM reports WHERE post_id = ?)`,
    ).bind(id),
    env.DB.prepare(`DELETE FROM reports WHERE post_id = ?`).bind(id),
    env.DB.prepare(`DELETE FROM post_likes WHERE post_id = ?`).bind(id),
    env.DB.prepare(`DELETE FROM posts WHERE id = ?`).bind(id),
  ]);

  const row = await env.DB.prepare(`SELECT id FROM posts WHERE id = ?`).bind(id).first();
  return row === null;
}

export async function postExists(env: Env, id: string): Promise<boolean> {
  const row = await env.DB.prepare(`SELECT id FROM posts WHERE id = ?`).bind(id).first();
  return row !== null;
}

// ------------------------------------------------------------
// いいね（投稿・レポート共通）
// ------------------------------------------------------------

export async function likePost(env: Env, postId: string, clientId: string): Promise<number> {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO post_likes (post_id, client_id, created_at) VALUES (?, ?, ?)`,
  )
    .bind(postId, clientId, new Date().toISOString())
    .run();
  return countPostLikes(env, postId);
}

export async function unlikePost(env: Env, postId: string, clientId: string): Promise<number> {
  await env.DB.prepare(`DELETE FROM post_likes WHERE post_id = ? AND client_id = ?`)
    .bind(postId, clientId)
    .run();
  return countPostLikes(env, postId);
}

async function countPostLikes(env: Env, postId: string): Promise<number> {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS c FROM post_likes WHERE post_id = ?`,
  )
    .bind(postId)
    .first();
  return Number(row?.c ?? 0);
}

export async function likeReport(env: Env, reportId: string, clientId: string): Promise<number> {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO report_likes (report_id, client_id, created_at) VALUES (?, ?, ?)`,
  )
    .bind(reportId, clientId, new Date().toISOString())
    .run();
  return countReportLikes(env, reportId);
}

export async function unlikeReport(env: Env, reportId: string, clientId: string): Promise<number> {
  await env.DB.prepare(`DELETE FROM report_likes WHERE report_id = ? AND client_id = ?`)
    .bind(reportId, clientId)
    .run();
  return countReportLikes(env, reportId);
}

async function countReportLikes(env: Env, reportId: string): Promise<number> {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS c FROM report_likes WHERE report_id = ?`,
  )
    .bind(reportId)
    .first();
  return Number(row?.c ?? 0);
}

// ------------------------------------------------------------
// レポート
// ------------------------------------------------------------

const REPORT_SELECT = `
  SELECT r.*,
    (SELECT COUNT(*) FROM report_likes rl WHERE rl.report_id = r.id) AS like_count,
    (SELECT COUNT(*) FROM report_likes rl WHERE rl.report_id = r.id AND rl.client_id = ?1) AS liked
  FROM reports r
`;

export async function listReports(
  env: Env,
  postId: string,
  clientId: string,
): Promise<Report[]> {
  const rows = await env.DB.prepare(
    `${REPORT_SELECT} WHERE r.post_id = ? ORDER BY r.created_at DESC`,
  )
    .bind(clientId, postId)
    .all();
  return (rows.results as ReportRow[]).map(toReport);
}

export async function getReport(
  env: Env,
  id: string,
  clientId: string,
): Promise<Report | null> {
  const row = await env.DB.prepare(`${REPORT_SELECT} WHERE r.id = ?`)
    .bind(clientId, id)
    .first();
  return row ? toReport(row as ReportRow) : null;
}

export interface ReportInput {
  postId: string;
  authorName: string;
  body: string;
  imageUrl: string | null;
}

export async function createReport(env: Env, input: ReportInput): Promise<string> {
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO reports (id, post_id, author_name, body, image_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, input.postId, input.authorName, input.body, input.imageUrl, new Date().toISOString())
    .run();
  return id;
}

export async function deleteReport(env: Env, id: string): Promise<boolean> {
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM report_likes WHERE report_id = ?`).bind(id),
    env.DB.prepare(`DELETE FROM reports WHERE id = ?`).bind(id),
  ]);
  const row = await env.DB.prepare(`SELECT id FROM reports WHERE id = ?`).bind(id).first();
  return row === null;
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
