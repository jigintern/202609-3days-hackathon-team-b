-- ログイン（ID + パスワード）のためのテーブル。
-- 書き込み系 API（POST / PATCH / PUT / DELETE）はログイン必須になる。

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  -- ログイン ID。大文字小文字を区別しないよう、小文字化して保存する
  login_id      TEXT NOT NULL UNIQUE,
  -- 投稿者名として使う表示名
  display_name  TEXT NOT NULL,
  -- pbkdf2$<iterations>$<saltBase64>$<hashBase64> 形式
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  -- 生のトークンではなく SHA-256 ハッシュを保存する（DB が漏れても成りすませない）
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users (id),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);

-- 投稿・レポートの所有者。既存データは NULL のままで、本人チェックに通らない
ALTER TABLE posts   ADD COLUMN user_id TEXT REFERENCES users (id);
ALTER TABLE reports ADD COLUMN user_id TEXT REFERENCES users (id);

CREATE INDEX IF NOT EXISTS idx_posts_user_id   ON posts (user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports (user_id);
