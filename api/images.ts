// R2 への画像アップロードと配信。

import type { Env } from "./types";
import { error, json, noContent } from "./http";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * POST /api/images
 * multipart/form-data の file フィールド、または画像バイナリを直接受け取る。
 */
export async function uploadImage(request: Request, env: Env): Promise<Response> {
  const contentType = request.headers.get("Content-Type") ?? "";

  let bytes: ArrayBuffer;
  let type: string;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return error("file フィールドが必要です", 400);
    bytes = await file.arrayBuffer();
    type = file.type;
  } else {
    bytes = await request.arrayBuffer();
    type = contentType;
  }

  const ext = ALLOWED_TYPES[type];
  if (!ext) {
    return error(`対応していない形式です（${Object.keys(ALLOWED_TYPES).join(" / ")}）`, 415);
  }
  if (bytes.byteLength === 0) return error("空のファイルです", 400);
  if (bytes.byteLength > MAX_BYTES) return error("8MB を超えています", 413);

  const key = `posts/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;

  await env.BUCKET.put(key, bytes, {
    httpMetadata: { contentType: type, cacheControl: "public, max-age=31536000, immutable" },
  });

  return json({ key, url: `/api/images/${key}`, size: bytes.byteLength, contentType: type }, 201);
}

/** GET /api/images/<key> */
export async function serveImage(key: string, env: Env): Promise<Response> {
  const object = await env.BUCKET.get(key);
  if (!object) return error("画像が見つかりません", 404);

  const headers = new Headers();
  object.writeHttpMetadata?.(headers);
  headers.set("ETag", object.httpEtag);
  if (!headers.has("Cache-Control")) {
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
  }

  return new Response(object.body, { headers });
}

/** DELETE /api/images/<key> */
export async function deleteImage(key: string, env: Env): Promise<Response> {
  const object = await env.BUCKET.head(key);
  if (!object) return error("画像が見つかりません", 404);
  await env.BUCKET.delete(key);
  return noContent();
}
