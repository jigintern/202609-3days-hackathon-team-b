// 「行ってきましたレポート」のハンドラ。

import type { Env } from "./types";
import * as db from "./db";
import { clientId, error, json, noContent, optStr, readJson, str } from "./http";

/** GET /api/posts/:id/reports */
export async function listReports(postId: string, request: Request, env: Env): Promise<Response> {
  if (!(await db.postExists(env, postId))) return error("投稿が見つかりません", 404);
  const reports = await db.listReports(env, postId, clientId(request));
  return json({ reports, total: reports.length });
}

/** POST /api/posts/:id/reports */
export async function createReport(postId: string, request: Request, env: Env): Promise<Response> {
  if (!(await db.postExists(env, postId))) return error("投稿が見つかりません", 404);

  const body = await readJson(request);
  if (!body) return error("JSON ボディが必要です", 400);

  const text = str(body.body, 500);
  if (!text) return error("body は 1〜500 文字で必要です", 422);

  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim().slice(0, 2048) : "";

  const id = await db.createReport(env, {
    postId,
    authorName: optStr(body.authorName, 20) || "匿名",
    body: text,
    imageUrl: imageUrl || null,
  });

  return json(await db.getReport(env, id, clientId(request)), 201);
}

/** DELETE /api/reports/:id */
export async function deleteReport(id: string, env: Env): Promise<Response> {
  if (!(await db.reportExists(env, id))) return error("レポートが見つかりません", 404);
  await db.deleteReport(env, id);
  return noContent();
}

/** POST /api/reports/:id/like, DELETE /api/reports/:id/like */
export async function toggleReportLike(
  id: string,
  request: Request,
  env: Env,
  like: boolean,
): Promise<Response> {
  const cid = clientId(request);
  if (!cid) return error("X-Client-Id ヘッダーが必要です", 400);
  if (!(await db.reportExists(env, id))) return error("レポートが見つかりません", 404);

  const likeCount = like
    ? await db.likeReport(env, id, cid)
    : await db.unlikeReport(env, id, cid);

  return json({ reportId: id, likeCount, liked: like });
}
