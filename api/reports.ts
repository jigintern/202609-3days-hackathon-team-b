// 「行ってきましたレポート」のハンドラ。

import type { Env, User } from "./types";
import * as db from "./db";
import { error, json, noContent, readJson, str } from "./http";

/** GET /api/posts/:id/reports */
export async function listReports(postId: string, env: Env): Promise<Response> {
  if (!(await db.postExists(env, postId))) return error("投稿が見つかりません", 404);
  const reports = await db.listReports(env, postId);
  return json({ reports, total: reports.length });
}

/** POST /api/posts/:id/reports */
export async function createReport(
  postId: string,
  request: Request,
  env: Env,
  user: User,
): Promise<Response> {
  if (!(await db.postExists(env, postId))) return error("投稿が見つかりません", 404);

  const body = await readJson(request);
  if (!body) return error("JSON ボディが必要です", 400);

  const text = str(body.body, 500);
  if (!text) return error("body は 1〜500 文字で必要です", 422);

  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim().slice(0, 2048) : "";

  const id = await db.createReport(env, {
    postId,
    // 投稿者名はログイン中のユーザーの表示名で固定する
    authorName: user.displayName,
    userId: user.id,
    body: text,
    imageUrl: imageUrl || null,
  });

  return json(await db.getReport(env, id), 201);
}

/** DELETE /api/reports/:id */
export async function deleteReport(id: string, env: Env, user: User): Promise<Response> {
  const existing = await db.getReport(env, id);
  if (!existing) return error("レポートが見つかりません", 404);
  if (existing.userId !== user.id) return error("このレポートは削除できません", 403);
  await db.deleteReport(env, id);
  return noContent();
}

/** POST /api/reports/:id/like, DELETE /api/reports/:id/like */
// いいねは投稿と同じく「誰が押したか」を持たない単純なカウンタ
export async function toggleReportLike(id: string, env: Env, like: boolean): Promise<Response> {
  if (!(await db.reportExists(env, id))) return error("レポートが見つかりません", 404);
  const likeCount = await db.addReportLike(env, id, like ? 1 : -1);
  return json({ reportId: id, likeCount });
}
