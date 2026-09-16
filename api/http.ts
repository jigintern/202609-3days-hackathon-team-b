// レスポンスとリクエスト解釈の共通処理。

// 読み取り系はどのオリジンからでも呼べるように "*" のままにしている。
// ただしセッション Cookie は "*" では送れないので、自オリジンと開発用の
// localhost からのリクエストだけ Origin をそのまま返して credentials を許可する。
// 各ヘルパはこの既定値を載せ、index.ts の withCors で最終的に上書きする。
export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const LOCALHOST_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/** リクエスト元に応じた CORS ヘッダを組み立てる */
export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin");
  if (!origin) return CORS_HEADERS;

  const sameOrigin = origin === new URL(request.url).origin;
  if (!sameOrigin && !LOCALHOST_ORIGIN.test(origin)) return CORS_HEADERS;

  return {
    ...CORS_HEADERS,
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    // オリジンごとに応答が変わるのでキャッシュを分けさせる
    Vary: "Origin",
  };
}

/** レスポンスに CORS ヘッダを付け直す */
export function withCors(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(request))) {
    headers.set(key, value);
  }
  return new Response(response.body, { status: response.status, headers });
}

/** ブラウザからのプリフライト（OPTIONS）に答える */
export function preflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS },
  });
}

export function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export function noContent(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function intParam(value: string | null, fallback?: number): number | undefined {
  if (value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** カンマ区切りのクエリを配列にする（空要素は捨てる） */
export function listParam(value: string | null): string[] {
  if (!value) return [];
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function str(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max) return null;
  return trimmed;
}

export function optStr(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function optInt(value: unknown, min: number, max: number): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(Math.max(Math.round(n), min), max);
}

export function strArray(value: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .map((v) => v.slice(0, maxLen));
}
