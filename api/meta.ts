// 選択肢などの補助データ。フロントのハードコードを減らすために用意する。

import type { Env } from "./types";
import { GENRES, PREFECTURES } from "./types";
import { json } from "./http";
import * as db from "./db";

/** GET /api/genres */
export function listGenres(): Response {
  return json({ genres: GENRES });
}

/** GET /api/prefectures */
export function listPrefectures(): Response {
  return json({ prefectures: PREFECTURES });
}

/** GET /api/tags */
export async function listTags(env: Env): Promise<Response> {
  return json({ tags: await db.listTags(env) });
}
