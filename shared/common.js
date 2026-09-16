/* ============================================================
   オシピ！ 3画面（トップ / 検索 / 詳細）で共通して使う処理。

   ES Modules にすると file:// で開いたときに読み込めなくなるため、
   通常のスクリプトとしてグローバルに関数を定義している。
   各ページのインラインscriptより先に読み込むこと。
   ============================================================ */

/* ============================================================
   API
   ============================================================ */
const API_BASE = "https://intern-b.tekitou.app";

/** 画像などの相対パス（/api/images/...）を常にAPI_BASE基準の絶対URLにする。
 *  本番以外のオリジンからページを開いても画像が壊れないようにするため。 */
function resolveUrl(url) {
  if (!url) return url;
  return /^https?:\/\//.test(url) ? url : `${API_BASE}${url}`;
}

async function sendLike(url, liked) {
  // いいねはログイン必須になったので、セッションCookieを載せる
  const res = await fetch(url, { method: liked ? "POST" : "DELETE", credentials: "include" });
  if (!res.ok) throw new Error(`failed to update like: ${res.status}`);
  const { likeCount } = await res.json();
  return likeCount;
}

/** 投稿のいいねを付け外しし、更新後のいいね数を返す */
function setPostLike(postId, liked) {
  return sendLike(`${API_BASE}/api/posts/${encodeURIComponent(postId)}/like`, liked);
}

/** コメントのいいねを付け外しし、更新後のいいね数を返す */
function setReportLike(reportId, liked) {
  return sendLike(`${API_BASE}/api/reports/${encodeURIComponent(reportId)}/like`, liked);
}

/* ============================================================
   いいね済みID
   APIは「誰が押したか」を持たないので、自分が押したかどうかだけ
   localStorageに覚えておく
   ============================================================ */
const LIKED_POSTS_KEY = "oshipi:likedPostIds";
const LIKED_REPORTS_KEY = "oshipi:likedReports";

function getLikedIds(key = LIKED_POSTS_KEY) {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) ?? "[]"));
  } catch {
    return new Set();
  }
}

function saveLikedIds(likedIds, key = LIKED_POSTS_KEY) {
  try {
    localStorage.setItem(key, JSON.stringify([...likedIds]));
  } catch {
    /* プライベートブラウジング等でlocalStorageが使えない場合は諦める */
  }
}

/** いいねボタンの見た目（❤️/🤍・件数）はここだけで組み立てる。
 *  絵文字と件数の間隔は、呼び出し側のCSS（flexのgap）で調整する。 */
function updateLikeButton(btn, liked, likeCount) {
  btn.classList.toggle("is-liked", liked);
  btn.setAttribute("aria-pressed", String(liked));
  btn.setAttribute("aria-label", `いいね ${likeCount}件`);
  btn.innerHTML = `<span aria-hidden="true">${liked ? "❤️" : "🤍"}</span>${likeCount}`;
}

/* ============================================================
   表示フォーマット
   ============================================================ */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

/** 未設定は「予算未設定」、0円は「無料」 */
function formatBudget(yen) {
  if (yen == null) return "予算未設定";
  return yen === 0 ? "無料" : `¥${yen.toLocaleString("ja-JP")}`;
}

/** 未設定は「時間未設定」 */
function formatDuration(minutes) {
  if (minutes == null) return "時間未設定";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}時間${m}分`;
  if (h) return `${h}時間`;
  return `${m}分`;
}

/** 日付をはっきり見せたい場所向け（詳細画面など）: 2026/09/15 */
function formatDate(isoDate) {
  const d = new Date(isoDate);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}/${mm}/${dd}`;
}

/** 省スペースで出す場所向け（カードのフッターなど）: 9/15 */
function formatDateShort(isoDate) {
  const d = new Date(isoDate);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 画像が無い投稿のサムネイルに使う、落ち着いた色のグラデーション（.ph-1〜.ph-5） */
function placeholderClass(index) {
  return `ph-${(index % 5) + 1}`;
}

function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
