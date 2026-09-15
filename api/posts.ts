// 投稿のハンドラ。

import type { Env } from "./types";
import { GENRE_KEYS, PREFECTURES, randomName } from "./types";
import * as db from "./db";
import {
  error, intParam, json, listParam, noContent,
  optInt, optStr, readJson, str, strArray,
} from "./http";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

/** GET /api/posts */
export async function listPosts(request: Request, env: Env): Promise<Response> {
  const p = new URL(request.url).searchParams;

  const limit = Math.min(Math.max(intParam(p.get("limit"), DEFAULT_LIMIT)!, 1), MAX_LIMIT);
  const offset = Math.max(intParam(p.get("offset"), 0)!, 0);

  const genres = listParam(p.get("genre")).filter((g) => GENRE_KEYS.includes(g));

  const sortParam = p.get("sort") ?? "new";
  const sort = (["new", "old", "popular", "budget_asc", "budget_desc"].includes(sortParam)
    ? sortParam
    : "new") as db.ListPostsOptions["sort"];

  const { posts, total } = await db.listPosts(env, {
    q: p.get("q")?.trim() || undefined,
    genres: genres.length > 0 ? genres : undefined,
    prefecture: p.get("prefecture")?.trim() || undefined,
    budgetMin: intParam(p.get("budgetMin")),
    budgetMax: intParam(p.get("budgetMax")),
    durationMax: intParam(p.get("durationMax")),
    tags: listParam(p.get("tags")),
    sort,
    limit,
    offset,
  });

  return json({ posts, total, limit, offset, hasMore: offset + posts.length < total });
}

/** GET /api/posts/:id */
export async function getPost(id: string, env: Env): Promise<Response> {
  const post = await db.getPost(env, id);
  return post ? json(post) : error("投稿が見つかりません", 404);
}

/** POST /api/posts */
export async function createPost(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  if (!body) return error("JSON ボディが必要です", 400);

  const title = str(body.title, 60);
  if (!title) return error("title は 1〜60 文字で必要です", 422);

  const text = str(body.body, 1000);
  if (!text) return error("body は 1〜1000 文字で必要です", 422);

  const genre = typeof body.genre === "string" ? body.genre : "";
  if (!GENRE_KEYS.includes(genre)) {
    return error(`genre は ${GENRE_KEYS.join(" / ")} のいずれかです`, 422);
  }

  const images = strArray(body.images, 5, 2048);
  if (images.length === 0) return error("images は 1 枚以上必要です", 422);

  const prefecture = optStr(body.prefecture, 8);
  if (prefecture && !(PREFECTURES as readonly string[]).includes(prefecture)) {
    return error("prefecture が都道府県名として不正です", 422);
  }

  const id = await db.createPost(env, {
    title,
    body: text,
    tip: optStr(body.tip, 200),
    genre,
    prefecture,
    durationMin: optInt(body.durationMin, 0, 10080),
    budget: optInt(body.budget, 0, 1000000),
    // 未指定なら「ゆかいなカワウソ42」のような名前を割り当てる
    authorName: optStr(body.authorName, 20) || randomName(),
    images,
    steps: strArray(body.steps, 30, 120),
    materials: strArray(body.materials, 30, 120),
    tags: strArray(body.tags, 10, 20),
  });

  return json(await db.getPost(env, id), 201);
}

/** PATCH /api/posts/:id */
export async function updatePost(id: string, request: Request, env: Env): Promise<Response> {
  if (!(await db.postExists(env, id))) return error("投稿が見つかりません", 404);

  const body = await readJson(request);
  if (!body) return error("JSON ボディが必要です", 400);

  const patch: Partial<db.PostInput> = {};

  if ("title" in body) {
    const title = str(body.title, 60);
    if (!title) return error("title は 1〜60 文字です", 422);
    patch.title = title;
  }

  if ("body" in body) {
    const text = str(body.body, 1000);
    if (!text) return error("body は 1〜1000 文字です", 422);
    patch.body = text;
  }

  if ("genre" in body) {
    const genre = typeof body.genre === "string" ? body.genre : "";
    if (!GENRE_KEYS.includes(genre)) return error("genre が不正です", 422);
    patch.genre = genre;
  }

  if ("images" in body) {
    const images = strArray(body.images, 5, 2048);
    if (images.length === 0) return error("images は 1 枚以上必要です", 422);
    patch.images = images;
  }

  if ("prefecture" in body) {
    const prefecture = optStr(body.prefecture, 8);
    if (prefecture && !(PREFECTURES as readonly string[]).includes(prefecture)) {
      return error("prefecture が都道府県名として不正です", 422);
    }
    patch.prefecture = prefecture;
  }

  if ("tip" in body) patch.tip = optStr(body.tip, 200);
  if ("authorName" in body) patch.authorName = optStr(body.authorName, 20) || randomName();
  if ("durationMin" in body) patch.durationMin = optInt(body.durationMin, 0, 10080);
  if ("budget" in body) patch.budget = optInt(body.budget, 0, 1000000);
  if ("steps" in body) patch.steps = strArray(body.steps, 30, 120);
  if ("materials" in body) patch.materials = strArray(body.materials, 30, 120);
  if ("tags" in body) patch.tags = strArray(body.tags, 10, 20);

  const updated = await db.updatePost(env, id, patch);
  if (!updated) return error("更新するフィールドがありません", 400);

  return json(await db.getPost(env, id));
}

/** DELETE /api/posts/:id */
export async function deletePost(id: string, env: Env): Promise<Response> {
  if (!(await db.postExists(env, id))) return error("投稿が見つかりません", 404);
  await db.deletePost(env, id);
  return noContent();
}

/** POST /api/posts/:id/like, DELETE /api/posts/:id/like */
export async function togglePostLike(id: string, env: Env, like: boolean): Promise<Response> {
  if (!(await db.postExists(env, id))) return error("投稿が見つかりません", 404);
  const likeCount = await db.addPostLike(env, id, like ? 1 : -1);
  return json({ postId: id, likeCount });
}
