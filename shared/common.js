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

/* ============================================================
   ログイン誘導ダイアログ
   書き込み系（いいね・コメント・投稿など）は API 側でログイン必須なので、
   未ログインのまま操作されたらここでログイン画面へ誘導する。
   ログイン画面のパスは画面ごとに階層が違うため引数で受け取る。
   ============================================================ */
let loginDialogEl = null;

function buildLoginDialog() {
  const style = document.createElement("style");
  style.textContent = `
    .login-dialog {
      border: 1px solid var(--line, #E3E3E1);
      border-radius: 16px;
      padding: 24px 20px 20px;
      max-width: 320px;
      width: calc(100% - 32px);
      background: var(--surface, #FFFFFF);
      color: var(--ink, #222222);
      font-family: inherit;
    }
    .login-dialog::backdrop { background: rgba(0, 0, 0, 0.4); }
    .login-dialog__title {
      margin: 0 0 8px;
      font-family: var(--font-display, inherit);
      font-size: 1.05rem;
    }
    .login-dialog__text {
      margin: 0 0 20px;
      font-size: 0.9rem;
      line-height: 1.7;
      color: var(--ink-muted, #6B6B6B);
    }
    .login-dialog__actions { display: flex; gap: 8px; justify-content: flex-end; }
    .login-dialog__actions button {
      border-radius: 999px;
      padding: 8px 18px;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .login-dialog__cancel {
      border: 1px solid var(--line, #E3E3E1);
      background: transparent;
      color: inherit;
    }
    .login-dialog__ok {
      border: none;
      background: var(--accent, #FFEF6C);
      color: var(--ink, #222222);
      font-weight: 700;
    }
  `;
  document.head.append(style);

  const dialog = document.createElement("dialog");
  dialog.className = "login-dialog";
  dialog.innerHTML = `
    <h2 class="login-dialog__title">ログインが必要です</h2>
    <p class="login-dialog__text"></p>
    <div class="login-dialog__actions">
      <button type="button" class="login-dialog__cancel">閉じる</button>
      <button type="button" class="login-dialog__ok">ログインする</button>
    </div>
  `;
  dialog.querySelector(".login-dialog__cancel").addEventListener("click", () => dialog.close());
  document.body.append(dialog);
  return dialog;
}

/** 未ログイン時に出すダイアログ。「ログインする」でログイン画面へ遷移する。
 *  loginUrl は呼び出し元のページから見たログイン画面への相対パス。 */
function showLoginDialog(loginUrl, message = "この操作にはログインが必要です。ログイン画面へ移動しますか？") {
  if (!loginDialogEl) loginDialogEl = buildLoginDialog();
  loginDialogEl.querySelector(".login-dialog__text").textContent = message;

  const ok = loginDialogEl.querySelector(".login-dialog__ok");
  // 連打で複数回リスナーが付かないよう、毎回差し替える
  ok.onclick = () => { location.href = loginUrl; };

  loginDialogEl.showModal();
}
