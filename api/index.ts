// Cloudflare Workers の API エントリポイント。
// /api/* へのリクエストがここに届く（それ以外は静的ファイルが配信される）。

export interface Env {
	// wrangler.jsonc の d1_databases / r2_buckets で定義したバインディング。
	// 型は本来 D1Database / R2Bucket。型定義が要るなら
	// `npx wrangler types` で worker-configuration.d.ts を生成する。
	DB: any;
	BUCKET: any;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// 例: GET /api/hello
		if (url.pathname === "/api/hello") {
			return Response.json({ message: "hello" });
		}

		// D1 を使うとき:
		//   const { results } = await env.DB.prepare("SELECT * FROM posts").all();
		// R2 を使うとき:
		//   await env.BUCKET.put(key, request.body);
		//   const object = await env.BUCKET.get(key);

		return new Response("Not Found", { status: 404 });
	},
};
