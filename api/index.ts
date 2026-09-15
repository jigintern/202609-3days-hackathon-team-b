// Cloudflare Workers のエントリポイント。
// /api/* だけがここに届き、それ以外は静的ファイルが配信される。
//
// ルーティングはパスを "/" で分割して素直に分岐している。
// ルーターライブラリを入れていないのは、依存なしで完結させるため。

import type { Env } from "./types";
import { CORS_HEADERS, error, json, preflight } from "./http";
import * as posts from "./posts";
import * as reports from "./reports";
import * as images from "./images";
import * as meta from "./meta";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await route(request, env);
    } catch (e) {
      // 実装上の不具合をそのまま外に出さない
      console.error("unhandled error", e);
      return error("サーバー内部エラー", 500);
    }
  },
};

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  // プリフライトはルーティングより先に返す
  if (method === "OPTIONS") return preflight();

  // "/api/posts/abc/like" -> ["posts", "abc", "like"]
  const segments = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);

  if (segments.length === 0) return error("Not Found", 404);

  const [resource, id, sub] = segments;

  switch (resource) {
    // ------------------------------------------------------------
    case "health":
      if (method !== "GET") return methodNotAllowed("GET");
      return json({ ok: true, time: new Date().toISOString() });

    // ------------------------------------------------------------
    case "posts":
      // /api/posts
      if (!id) {
        if (method === "GET") return posts.listPosts(request, env);
        if (method === "POST") return posts.createPost(request, env);
        return methodNotAllowed("GET, POST");
      }

      // /api/posts/:id
      if (!sub) {
        if (method === "GET") return posts.getPost(id, env);
        if (method === "PATCH" || method === "PUT") return posts.updatePost(id, request, env);
        if (method === "DELETE") return posts.deletePost(id, env);
        return methodNotAllowed("GET, PATCH, DELETE");
      }

      // /api/posts/:id/like
      if (sub === "like") {
        if (method === "POST") return posts.togglePostLike(id, env, true);
        if (method === "DELETE") return posts.togglePostLike(id, env, false);
        return methodNotAllowed("POST, DELETE");
      }

      // /api/posts/:id/reports
      if (sub === "reports") {
        if (method === "GET") return reports.listReports(id, env);
        if (method === "POST") return reports.createReport(id, request, env);
        return methodNotAllowed("GET, POST");
      }

      return error("Not Found", 404);

    // ------------------------------------------------------------
    case "reports":
      if (!id) return error("Not Found", 404);

      // /api/reports/:id
      if (!sub) {
        if (method === "DELETE") return reports.deleteReport(id, env);
        return methodNotAllowed("DELETE");
      }

      // /api/reports/:id/like
      if (sub === "like") {
        if (method === "POST") return reports.toggleReportLike(id, env, true);
        if (method === "DELETE") return reports.toggleReportLike(id, env, false);
        return methodNotAllowed("POST, DELETE");
      }

      return error("Not Found", 404);

    // ------------------------------------------------------------
    case "images":
      // /api/images
      if (!id) {
        if (method === "POST") return images.uploadImage(request, env);
        return methodNotAllowed("POST");
      }

      // /api/images/<key> — key は "posts/2026-09-15/uuid.png" のようにスラッシュを含む
      {
        const key = segments.slice(1).join("/");
        if (method === "GET") return images.serveImage(key, env);
        if (method === "DELETE") return images.deleteImage(key, env);
        return methodNotAllowed("GET, DELETE");
      }

    // ------------------------------------------------------------
    case "genres":
      if (method !== "GET") return methodNotAllowed("GET");
      return meta.listGenres();

    case "prefectures":
      if (method !== "GET") return methodNotAllowed("GET");
      return meta.listPrefectures();

    case "tags":
      if (method !== "GET") return methodNotAllowed("GET");
      return meta.listTags(env);

    // ------------------------------------------------------------
    default:
      return error("Not Found", 404);
  }
}

function methodNotAllowed(allow: string): Response {
  return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
    status: 405,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Allow: allow,
      ...CORS_HEADERS,
    },
  });
}
