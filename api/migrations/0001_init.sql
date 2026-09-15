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
  author_name  TEXT NOT NULL,
  images       TEXT NOT NULL DEFAULT '[]',
  steps        TEXT NOT NULL DEFAULT '[]',
  materials    TEXT NOT NULL DEFAULT '[]',
  tags         TEXT NOT NULL DEFAULT '[]',
  -- 認証がないため、いいねは誰が押したかを持たない単純なカウンタにしている
  like_count   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_genre      ON posts (genre);
CREATE INDEX IF NOT EXISTS idx_posts_budget     ON posts (budget);
CREATE INDEX IF NOT EXISTS idx_posts_prefecture ON posts (prefecture);
CREATE INDEX IF NOT EXISTS idx_posts_like_count ON posts (like_count DESC);

-- 行ってきましたレポート
CREATE TABLE IF NOT EXISTS reports (
  id          TEXT PRIMARY KEY,
  post_id     TEXT NOT NULL REFERENCES posts (id),
  author_name TEXT NOT NULL,
  body        TEXT NOT NULL,
  image_url   TEXT,
  like_count  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_post_id ON reports (post_id, created_at DESC);
