// ログイン（ID + パスワード）のハンドラとセッション管理。
//
// セッションは HttpOnly Cookie に入れたランダムトークンで表す。
// DB にはトークンそのものではなく SHA-256 ハッシュを置く。

import type { Env, User } from "./types";
import { randomName } from "./types";
import * as db from "./db";
import { hashPassword, newSessionToken, sha256Hex, verifyPassword } from "./crypto";
import { error, json, noContent, optStr, readJson } from "./http";

const COOKIE_NAME = "session";
const SESSION_DAYS = 30;
const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

// ログイン ID は半角英数と _ - のみ。大文字小文字は区別しない
const LOGIN_ID_PATTERN = /^[a-z0-9_-]{3,32}$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;

// ------------------------------------------------------------
// Cookie
// ------------------------------------------------------------
// 静的アセットと Worker が同一オリジンで配信されるので SameSite=Lax で足りる。

/** wrangler dev は http なので、そのときだけ Secure を外す */
function cookieAttributes(request: Request, maxAge: number): string {
  const secure = new URL(request.url).protocol === "https:" ? " Secure;" : "";
  return `Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=${maxAge}`;
}

function sessionCookie(request: Request, token: string): string {
  return `${COOKIE_NAME}=${token}; ${cookieAttributes(request, SESSION_MAX_AGE)}`;
}

function clearCookie(request: Request): string {
  return `${COOKIE_NAME}=; ${cookieAttributes(request, 0)}`;
}

function readSessionToken(request: Request): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;

  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() !== COOKIE_NAME) continue;
    const value = part.slice(index + 1).trim();
    return value || null;
  }
  return null;
}

/** Set-Cookie を付けたレスポンスを作る */
function withCookie(response: Response, cookie: string): Response {
  const headers = new Headers(response.headers);
  headers.append("Set-Cookie", cookie);
  return new Response(response.body, { status: response.status, headers });
}

// ------------------------------------------------------------
// 認証ゲート
// ------------------------------------------------------------

/** Cookie からログイン中のユーザーを復元する。未ログイン・期限切れなら null */
export async function currentUser(request: Request, env: Env): Promise<User | null> {
  const token = readSessionToken(request);
  if (!token) return null;
  return db.findSessionUser(env, await sha256Hex(token));
}

/** ユーザーにセッションを発行し、Cookie 付きのレスポンスを返す */
async function startSession(
  request: Request,
  env: Env,
  user: User,
  status: number,
): Promise<Response> {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();

  await db.createSession(env, {
    tokenHash: await sha256Hex(token),
    userId: user.id,
    expiresAt,
  });

  return withCookie(json({ user }, status), sessionCookie(request, token));
}

// ------------------------------------------------------------
// ハンドラ
// ------------------------------------------------------------

/** POST /api/auth/register */
export async function register(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  if (!body) return error("JSON ボディが必要です", 400);

  const loginId = typeof body.loginId === "string" ? body.loginId.trim().toLowerCase() : "";
  if (!LOGIN_ID_PATTERN.test(loginId)) {
    return error("loginId は半角英数と _ - を使った 3〜32 文字です", 422);
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return error(`password は ${PASSWORD_MIN}〜${PASSWORD_MAX} 文字です`, 422);
  }

  if (await db.findUserByLoginId(env, loginId)) {
    return error("その loginId はすでに使われています", 409);
  }

  const id = await db.createUser(env, {
    loginId,
    // 未指定なら「ゆかいなカワウソ42」のような名前を割り当てる
    displayName: optStr(body.displayName, 20) || randomName(),
    passwordHash: await hashPassword(password),
  });

  const user = await db.findUserById(env, id);
  if (!user) return error("ユーザーの作成に失敗しました", 500);

  // 登録したらそのままログイン状態にする
  return startSession(request, env, user, 201);
}

/** POST /api/auth/login */
export async function login(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  if (!body) return error("JSON ボディが必要です", 400);

  const loginId = typeof body.loginId === "string" ? body.loginId.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const row = loginId ? await db.findUserByLoginId(env, loginId) : null;

  // ID が存在しないのか、パスワードが違うのかを区別させない
  const ok = row ? await verifyPassword(password, row.password_hash) : false;
  if (!row || !ok) return error("loginId かパスワードが違います", 401);

  return startSession(request, env, db.toUser(row), 200);
}

/** POST /api/auth/logout */
export async function logout(request: Request, env: Env): Promise<Response> {
  const token = readSessionToken(request);
  if (token) await db.deleteSession(env, await sha256Hex(token));
  return withCookie(noContent(), clearCookie(request));
}

/** GET /api/auth/me */
export async function me(request: Request, env: Env): Promise<Response> {
  const user = await currentUser(request, env);
  return user ? json({ user }) : error("ログインしていません", 401);
}
