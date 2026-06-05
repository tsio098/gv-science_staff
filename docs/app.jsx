/* app.jsx — 本番シェル：トークン認証 / ハッシュルーティング / データ取得 / 状態管理。
 *   プロトタイプの Tweaks パネル・デバイスプレビュー・モックデータは撤去。
 *   一覧/詳細の各画面（list.jsx / detail.jsx）はそのまま流用し、
 *   App が GAS からデータを取得して window.STUDENTS / window.DETAIL に流し込み、
 *   loading / empty / error / normal の状態を props で渡す。
 *
 * global: React, ReactDOM, Icon, Logo, GVApi,
 *         StudentListScreen, StudentDetailScreen */

// ── hash routing （#/students , #/student/<name>）─────────
function parseHash() {
  const h = (window.location.hash || '').replace(/^#\/?/, '');
  const path = h.split('?')[0];
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'student' && parts[1]) return { name: 'student', param: decodeURIComponent(parts[1]) };
  return { name: 'students', param: null };
}
function useHashRoute() {
  const [route, setRoute] = React.useState(parseHash);
  React.useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

// ── header ────────────────────────────────────────────────
function Header({ query, setQuery, onRefresh, onHome }) {
  const [spinning, setSpinning] = React.useState(false);
  const refresh = () => { setSpinning(true); onRefresh && onRefresh(); setTimeout(() => setSpinning(false), 700); };
  return (
    <header className="tw-header">
      <div className="tw-brand" style={{ cursor: 'pointer' }} onClick={onHome}>
        <Logo size={28} />
      </div>
      <div className="tw-brand-divider" />
      <div className="tw-brand-role"><span className="pill">Teacher</span>成績ダッシュボード</div>
      <div className="tw-header-spacer" />
      <div className="tw-search">
        {Icon.search(16)}
        <input value={query} placeholder="生徒名で検索" onChange={(e) => setQuery(e.target.value)} />
        {query && <button className="clr" onClick={() => setQuery('')} aria-label="クリア">✕</button>}
      </div>
      <button className={`tw-icon-btn ${spinning ? 'spin' : ''}`} onClick={refresh} title="最新データに更新">
        {Icon.refresh(16)}<span className="tw-refresh-lbl">更新</span>
      </button>
    </header>
  );
}

// ── auth gate (token) ─────────────────────────────────────
function AuthScreen({ variant, onSubmit }) {
  const [token, setToken] = React.useState('');
  const err = variant === 'error';
  const submit = (e) => { e.preventDefault(); if (token.trim()) onSubmit(token.trim()); };
  return (
    <div className="tw-auth">
      <div className="tw-auth-card">
        <div className="tw-auth-brand"><Logo size={30} /></div>
        <div className={`tw-auth-ic ${err ? 'err' : ''}`}>{err ? Icon.alert(24) : Icon.qr(24)}</div>
        <div className="tw-auth-t1">{err ? 'アクセスが確認できません' : '先生用ダッシュボード'}</div>
        <div className="tw-auth-t2">
          {err
            ? 'リンクのトークンが無効か期限切れです。配布された最新のURLからアクセスするか、下にトークンを入力してください。'
            : '配布されたトークン付きURLからアクセスすると、自動でログインします。トークンをお持ちの場合は下に入力してください。'}
        </div>
        <form className="tw-auth-field" onSubmit={submit}>
          <label className="tw-auth-label">アクセストークン</label>
          <input className="tw-auth-input" value={token} onChange={(e) => setToken(e.target.value)} placeholder="例：gv-2026-xxxxxxxx" autoComplete="off" autoFocus />
          {err && <div className="tw-auth-err">{Icon.alert(14)}<span>トークンが一致しませんでした。</span></div>}
          <button className="btn btn-primary btn-full" type="submit" style={{ marginTop: 16 }}>ダッシュボードを開く</button>
        </form>
        <div className="tw-auth-note">
          {Icon.info(15)}
          <span>これは限定配布リンクによる簡易認証です。トークンはタブを閉じると破棄されます。アクセスできない場合は管理者にご連絡ください。</span>
        </div>
      </div>
    </div>
  );
}

// ── 設定エラー（GAS_ENDPOINT 未設定 かつ サンプル無効）──────
function SetupScreen() {
  return (
    <div className="tw-auth">
      <div className="tw-auth-card">
        <div className="tw-auth-brand"><Logo size={30} /></div>
        <div className="tw-auth-ic err">{Icon.alert(24)}</div>
        <div className="tw-auth-t1">セットアップが未完了です</div>
        <div className="tw-auth-t2">
          <code>web/config.js</code> の <b>GAS_ENDPOINT</b> に、GAS ウェブアプリの
          <code>/exec</code> URL を設定してください。
        </div>
      </div>
    </div>
  );
}

// ── 詳細の loading / empty / error（データ到着前は App 側で描画）──
function DetailStateView({ nav, name, state }) {
  return (
    <div className="tw-main tw-detail">
      <button className="tw-back" onClick={() => nav('back')}>{Icon.chevL(14)} 一覧へ戻る</button>
      <h1 className="tw-detail-title" style={{ marginBottom: 18 }}>{name}</h1>
      {state === 'loading' && (
        <>
          <div className="tw-detail-grid">
            {[0, 1].map((i) => (
              <div key={i} className="gt-card gt-skel"><div className="gt-skel-bar" style={{ width: '44%', height: 14 }} /><div className="gt-skel-plot" /></div>
            ))}
          </div>
          <div className="tw-loadwrap"><div className="spinner" /><span>成績データを読み込み中…</span></div>
        </>
      )}
      {state === 'empty' && (
        <div className="tw-empty">
          <div className="tw-empty-ic">{Icon.chart(26)}</div>
          <div className="tw-empty-t1">まだ成績データがありません</div>
          <div className="tw-empty-t2">この生徒の点数報告が登録されると、ここに推移が表示されます。</div>
          <button className="btn btn-primary btn-sm" onClick={() => nav('back')}>一覧へ戻る</button>
        </div>
      )}
      {state === 'error' && (
        <div className="tw-empty">
          <div className="tw-empty-ic" style={{ background: 'var(--c-accent-soft)', color: '#9A4309' }}>{Icon.alert(26)}</div>
          <div className="tw-empty-t1">データを取得できませんでした</div>
          <div className="tw-empty-t2">通信環境を確認して、画面右上の「更新」からもう一度お試しください。</div>
        </div>
      )}
    </div>
  );
}

// ── app ───────────────────────────────────────────────────
function App() {
  const route = useHashRoute();
  const [query, setQuery] = React.useState('');
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [authed, setAuthed] = React.useState(() => GVApi.hasToken());
  const [authError, setAuthError] = React.useState(false);
  const [listState, setListState] = React.useState('loading'); // loading|normal|empty|error
  const [detState, setDetState] = React.useState('loading');
  const [, force] = React.useReducer((x) => x + 1, 0);
  const freshRef = React.useRef(false);

  const noConfig = !GVApi.ENDPOINT && !GVApi.SAMPLE;

  const onUnauthorized = () => { GVApi.clearToken(); setAuthError(true); setAuthed(false); };

  function applyStudents(res) {
    if (res.status === 'ok') {
      window.STUDENTS = res.students || [];
      window.HOMEROOMS = res.homerooms || [];
      setListState(window.STUDENTS.length ? 'normal' : 'empty');
      force();
    } else if (res.status === 'empty') {
      window.STUDENTS = []; window.HOMEROOMS = [];
      setListState('empty'); force();
    } else if (res.status === 'unauthorized') {
      onUnauthorized();
    } else {
      setListState('error');
    }
  }
  function applyDetail(name, res) {
    if (res.status === 'ok') { window.DETAIL[name] = res.detail; setDetState('normal'); force(); }
    else if (res.status === 'empty') { setDetState('empty'); }
    else if (res.status === 'unauthorized') { onUnauthorized(); }
    else { setDetState('error'); }
  }

  // students をロード（認証時・更新時）
  React.useEffect(() => {
    if (!authed || noConfig) return;
    let alive = true;
    const fresh = freshRef.current;
    setListState((s) => (window.STUDENTS && window.STUDENTS.length ? s : 'loading'));
    GVApi.fetchStudents({ fresh, onRevalidate: (f) => { if (alive) applyStudents(f); } })
      .then((res) => { if (alive) applyStudents(res); })
      .catch(() => { if (alive) setListState('error'); });
    return () => { alive = false; };
  }, [authed, refreshKey, noConfig]);

  // detail をロード（生徒ページ表示時）
  React.useEffect(() => {
    if (route.name !== 'student' || !authed || noConfig) return;
    let alive = true;
    const fresh = freshRef.current;
    setDetState(window.DETAIL[route.param] ? 'normal' : 'loading');
    GVApi.fetchDetail(route.param, { fresh, onRevalidate: (f) => { if (alive) applyDetail(route.param, f); } })
      .then((res) => { if (alive) applyDetail(route.param, res); })
      .catch(() => { if (alive) setDetState('error'); });
    return () => { alive = false; };
  }, [route.name, route.param, authed, refreshKey, noConfig]);

  // fresh フラグは1回の更新ぶんだけ有効（上記2effectが読んだ後にリセット）
  React.useEffect(() => { freshRef.current = false; }, [refreshKey]);

  const nav = (name, param) => {
    if (name === 'back') { window.location.hash = '#/students'; return; }
    if (name === 'student') { window.location.hash = `#/student/${encodeURIComponent(param)}`; return; }
    if (name === 'students') { window.location.hash = '#/students'; return; }
  };
  const onRefresh = () => { freshRef.current = true; GVApi.clearCache(); setRefreshKey((k) => k + 1); };

  if (noConfig) return <div className="gv-root tw-root dens-regular"><SetupScreen /></div>;

  if (!authed) {
    return (
      <div className="gv-root tw-root dens-regular">
        <AuthScreen variant={authError ? 'error' : 'token'} onSubmit={(tok) => { GVApi.setToken(tok); setAuthError(false); setAuthed(true); freshRef.current = true; setRefreshKey((k) => k + 1); }} />
      </div>
    );
  }

  const detReady = detState === 'normal' && window.DETAIL[route.param];

  return (
    <div className="gv-root tw-root dens-regular" data-device="desktop">
      <Header query={query} setQuery={setQuery} onRefresh={onRefresh} onHome={() => nav('students')} />
      <div className="tw-frame">
        {route.name === 'student'
          ? (detReady
              ? <StudentDetailScreen key={route.param + ':' + refreshKey} nav={nav} name={route.param} state="normal" />
              : <DetailStateView nav={nav} name={route.param} state={detState === 'normal' ? 'loading' : detState} />)
          : <StudentListScreen key={'list:' + refreshKey} nav={nav} query={query} layout="table" state={listState} density="regular" showOverview={true} />}
      </div>
    </div>
  );
}

// トークンを URL から取り込んでから描画
GVApi.captureTokenFromUrl();
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
