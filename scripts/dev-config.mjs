// wrangler dev 用の設定をリポジトリ外に書き出す。
//
// wrangler は .wrangler（バンドル出力の tmp とローカルDBの state）を
// 「設定ファイルのあるディレクトリ」に作る。一方このリポジトリは
// assets.directory がリポジトリルートなので、.wrangler への書き込みを
// アセットの変更として検知してしまい、リロードが無限ループする。
// 設定ファイルだけ外に置けば .wrangler も外に出るのでループしない。

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const repoRoot = process.cwd();
const outDir = path.join(homedir(), ".cache", "wrangler-dev-team-b");

// 行頭の // コメントだけを落とす（文字列中の // は残す）
const jsonc = readFileSync(path.join(repoRoot, "wrangler.jsonc"), "utf8");
const config = JSON.parse(jsonc.replace(/^\s*\/\/.*$/gm, ""));

// 本番のカスタムドメイン設定はローカルには不要
delete config.routes;

// 設定ファイルの場所が変わるので、相対パスはすべて絶対パスに直す
config.main = path.join(repoRoot, "api", "index.ts");
config.assets = { ...config.assets, directory: repoRoot };
for (const db of config.d1_databases ?? []) {
  if (db.migrations_dir) db.migrations_dir = path.join(repoRoot, db.migrations_dir);
}

mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "wrangler.jsonc");
writeFileSync(outPath, JSON.stringify(config, null, 2));
process.stdout.write(outPath);
