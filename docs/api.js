/* api.js — GAS バックエンドとの通信層（本番）。
 *   - トークン: URL の ?token=... を sessionStorage に保存し、URL からは消す
 *   - SWR: 直前レスポンスを sessionStorage にキャッシュし即描画、裏で再取得
 *   - リトライ: 429 / 5xx / ネットワーク失敗は指数バックオフで再試行
 *   - サンプル: GAS_ENDPOINT 未設定なら window.__SAMPLE__（sample-data.js）で動作
 *
 * window.GVApi として公開。
 * global: window
 */
(function () {
  const C = window.GV_CONFIG || {};
  const ENDPOINT = (C.GAS_ENDPOINT || '').trim();
  const TOKEN_PARAM = C.TOKEN_PARAM || 'token';
  const VER = C.CACHE_VERSION || 'v1';
  const TOKEN_KEY = 'gv-teacher-token';
  const SAMPLE = !ENDPOINT && C.ALLOW_SAMPLE_WHEN_UNSET !== false;
  const AUTH_ENABLED = C.AUTH_ENABLED === true; // 既定 false＝トークン不要（誰でも閲覧可）

  // ── token ───────────────────────────────────────────────
  // URL（クエリ または ハッシュ内クエリ）からトークンを拾い、保存して URL から除去。
  function captureTokenFromUrl() {
    try {
      let tok = '';
      const sp = new URLSearchParams(window.location.search);
      if (sp.get(TOKEN_PARAM)) tok = sp.get(TOKEN_PARAM);
      // ハッシュ内 "#/students?token=xxx" にも対応
      const h = window.location.hash || '';
      const qi = h.indexOf('?');
      if (!tok && qi >= 0) {
        const hp = new URLSearchParams(h.slice(qi + 1));
        if (hp.get(TOKEN_PARAM)) tok = hp.get(TOKEN_PARAM);
      }
      if (tok) {
        sessionStorage.setItem(TOKEN_KEY, tok);
        // URL からトークンを消す（履歴・共有画面に残さない）
        if (sp.get(TOKEN_PARAM)) {
          sp.delete(TOKEN_PARAM);
          const qs = sp.toString();
          const clean = window.location.pathname + (qs ? '?' + qs : '') + cleanHash(h);
          window.history.replaceState(null, '', clean);
        } else if (qi >= 0) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search + cleanHash(h));
        }
      }
    } catch (e) { /* sessionStorage 不可など。無視して続行 */ }
  }
  function cleanHash(h) {
    const qi = h.indexOf('?');
    if (qi < 0) return h;
    const hp = new URLSearchParams(h.slice(qi + 1));
    hp.delete(TOKEN_PARAM);
    const rest = hp.toString();
    return h.slice(0, qi) + (rest ? '?' + rest : '');
  }
  function getToken() { try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } }
  function setToken(t) { try { sessionStorage.setItem(TOKEN_KEY, t || ''); } catch (e) {} }
  function clearToken() { try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {} }
  // 認証オフ時は常に通過（トークン入力画面を出さない）。
  function hasToken() { return !AUTH_ENABLED || SAMPLE || !!getToken(); }

  // ── SWR cache (sessionStorage) ──────────────────────────
  function ckey(k) { return `scores:${VER}:${k}`; }
  function cacheGet(k) {
    try { const raw = sessionStorage.getItem(ckey(k)); return raw ? JSON.parse(raw) : null; }
    catch (e) { return null; }
  }
  function cacheSet(k, val) {
    try { sessionStorage.setItem(ckey(k), JSON.stringify(val)); } catch (e) { /* 容量超過などは無視 */ }
  }

  // ── fetch with exponential backoff ──────────────────────
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function fetchJSON(url, tries) {
    tries = tries || 4;
    let lastErr;
    for (let i = 0; i < tries; i++) {
      try {
        const res = await fetch(url, { method: 'GET', redirect: 'follow' });
        if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
          lastErr = new Error('HTTP ' + res.status);
        } else if (!res.ok) {
          throw new Error('HTTP ' + res.status);
        } else {
          return await res.json();
        }
      } catch (e) { lastErr = e; }
      await sleep(400 * Math.pow(2, i) + Math.random() * 200); // 0.4s,0.8s,1.6s… + jitter
    }
    throw lastErr || new Error('fetch failed');
  }

  function buildUrl(action, params) {
    const u = new URL(ENDPOINT);
    u.searchParams.set('action', action);
    if (AUTH_ENABLED) u.searchParams.set(TOKEN_PARAM, getToken());
    Object.keys(params || {}).forEach((k) => { if (params[k] != null) u.searchParams.set(k, params[k]); });
    return u.toString();
  }

  // 返却を正規化: { status:'ok'|'empty'|'unauthorized'|'error', ... }
  function normErr(j) {
    const e = j && j.error;
    if (e === 'NEEDS_PAIRING' || e === 'UNAUTHORIZED') return 'unauthorized';
    if (e === 'NO_DATA') return 'empty';
    return e ? 'error' : null;
  }

  // ── students (一覧サマリー) ──────────────────────────────
  async function fetchStudents(opts) {
    opts = opts || {};
    if (SAMPLE) {
      const s = (window.__SAMPLE__ || {});
      return { status: 'ok', students: s.students || [], homerooms: s.homerooms || [], sample: true };
    }
    const cacheK = 'students';
    const cached = !opts.fresh ? cacheGet(cacheK) : null;

    const run = async () => {
      const j = await fetchJSON(buildUrl('students', opts.fresh ? { fresh: 1 } : {}));
      const err = normErr(j);
      if (err === 'unauthorized') return { status: 'unauthorized' };
      if (err === 'empty') return { status: 'empty', students: [], homerooms: [] };
      if (err) return { status: 'error', message: j.error };
      const students = j.students || [];
      const homerooms = j.homerooms || Array.from(new Set(students.map((x) => x.homeroom).filter(Boolean)));
      const out = { status: 'ok', students, homerooms };
      cacheSet(cacheK, out);
      return out;
    };

    if (cached && !opts.fresh) {
      // stale を即返しつつ、裏で更新（呼び出し側が onRevalidate で差し替え）
      if (opts.onRevalidate) run().then((fresh) => { if (fresh.status === 'ok') opts.onRevalidate(fresh); }).catch(() => {});
      return Object.assign({ stale: true }, cached);
    }
    return run();
  }

  // ── detail (生徒1人) ────────────────────────────────────
  async function fetchDetail(name, opts) {
    opts = opts || {};
    if (SAMPLE) {
      const d = (window.__SAMPLE__ || {}).detail || {};
      return d[name] ? { status: 'ok', detail: d[name], sample: true } : { status: 'empty' };
    }
    const cacheK = 'detail:' + name;
    const cached = !opts.fresh ? cacheGet(cacheK) : null;

    const run = async () => {
      const j = await fetchJSON(buildUrl('scores', Object.assign({ name }, opts.fresh ? { fresh: 1 } : {})));
      const err = normErr(j);
      if (err === 'unauthorized') return { status: 'unauthorized' };
      if (err === 'empty') return { status: 'empty' };
      if (err) return { status: 'error', message: j.error };
      const detail = j.detail || j;
      const out = { status: 'ok', detail };
      cacheSet(cacheK, out);
      return out;
    };

    if (cached && !opts.fresh) {
      if (opts.onRevalidate) run().then((fresh) => { if (fresh.status === 'ok') opts.onRevalidate(fresh); }).catch(() => {});
      return Object.assign({ stale: true }, cached);
    }
    return run();
  }

  // ── shibou (おすすめ志望校・生徒1人) ────────────────────
  //   fetchDetail と同じSWR/リトライ方針。GAS `shibouResults`（氏名→USERIDはGAS内で解決）。
  async function fetchShibou(name, opts) {
    opts = opts || {};
    if (SAMPLE) {
      const d = (window.__SAMPLE__ || {}).shibou || {};
      return d[name] ? { status: 'ok', results: d[name], sample: true } : { status: 'empty', results: [] };
    }
    const cacheK = 'shibou:' + name;
    const cached = !opts.fresh ? cacheGet(cacheK) : null;

    const run = async () => {
      const j = await fetchJSON(buildUrl('shibouResults', Object.assign({ name }, opts.fresh ? { fresh: 1 } : {})));
      const err = normErr(j);
      if (err === 'unauthorized') return { status: 'unauthorized' };
      if (err === 'empty') return { status: 'empty', results: [] };
      if (err) return { status: 'error', message: j.error };
      const out = { status: 'ok', results: j.results || [] };
      cacheSet(cacheK, out);
      return out;
    };

    if (cached && !opts.fresh) {
      if (opts.onRevalidate) run().then((fresh) => { if (fresh.status === 'ok') opts.onRevalidate(fresh); }).catch(() => {});
      return Object.assign({ stale: true }, cached);
    }
    return run();
  }

  function clearCache() {
    try {
      const rm = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.indexOf('scores:' + VER + ':') === 0) rm.push(k);
      }
      rm.forEach((k) => sessionStorage.removeItem(k));
    } catch (e) {}
  }

  window.GVApi = {
    SAMPLE, ENDPOINT,
    captureTokenFromUrl, getToken, setToken, clearToken, hasToken,
    fetchStudents, fetchDetail, fetchShibou, clearCache,
  };
})();
