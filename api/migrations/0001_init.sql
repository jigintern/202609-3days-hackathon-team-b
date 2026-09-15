-- 投稿本体
-- images / steps / materials / tags は JSON 配列テキストとして保持する
CREATE TABLE IF NOT EXISTS posts (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  tip          TEXT NOT NULL DEFAULT '',
  genre        TEXT NOT NULL,
  prefecture   TEXT NOT NULL DEFAULT '',
  duration_min INTEGER,
  budget       INTEGER,
  author_name  TEXT NOT NULL DEFAULT '匿名',
  images       TEXT NOT NULL DEFAULT '[]',
  steps        TEXT NOT NULL DEFAULT '[]',
  materials    TEXT NOT NULL DEFAULT '[]',
  tags         TEXT NOT NULL DEFAULT '[]',
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_genre      ON posts (genre);
CREATE INDEX IF NOT EXISTS idx_posts_budget     ON posts (budget);
CREATE INDEX IF NOT EXISTS idx_posts_prefecture ON posts (prefecture);

-- 投稿へのいいね
-- 認証がないため client_id（ブラウザ側で生成した匿名ID）で重複を防ぐ
CREATE TABLE IF NOT EXISTS post_likes (
  post_id    TEXT NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  client_id  TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (post_id, client_id)
);

-- 行ってきましたレポート
CREATE TABLE IF NOT EXISTS reports (
  id          TEXT PRIMARY KEY,
  post_id     TEXT NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT '匿名',
  body        TEXT NOT NULL,
  image_url   TEXT,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_post_id ON reports (post_id, created_at DESC);

-- レポートへのいいね
CREATE TABLE IF NOT EXISTS report_likes (
  report_id  TEXT NOT NULL REFERENCES reports (id) ON DELETE CASCADE,
  client_id  TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (report_id, client_id)
);
