function parseHash() {
  const h = (window.location.hash || '').replace(/^#\/?/, '');
  const path = h.split('?')[0];
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'student' && parts[1]) return {
    name: 'student',
    param: decodeURIComponent(parts[1])
  };
  if (parts[0] === 'shibou' && parts[1]) return {
    name: 'shibou',
    param: decodeURIComponent(parts[1])
  };
  return {
    name: 'students',
    param: null
  };
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
function Header({
  query,
  setQuery,
  onRefresh,
  onHome
}) {
  const [spinning, setSpinning] = React.useState(false);
  const refresh = () => {
    setSpinning(true);
    onRefresh && onRefresh();
    setTimeout(() => setSpinning(false), 700);
  };
  return React.createElement("header", {
    className: "tw-header"
  }, React.createElement("div", {
    className: "tw-brand",
    style: {
      cursor: 'pointer'
    },
    onClick: onHome
  }, React.createElement(Logo, {
    size: 28
  })), React.createElement("div", {
    className: "tw-brand-divider"
  }), React.createElement("div", {
    className: "tw-brand-role"
  }, React.createElement("span", {
    className: "pill"
  }, "Teacher"), "成績ダッシュボード"), React.createElement("div", {
    className: "tw-header-spacer"
  }), React.createElement("div", {
    className: "tw-search"
  }, Icon.search(16), React.createElement("input", {
    value: query,
    placeholder: "生徒名で検索",
    onChange: e => setQuery(e.target.value)
  }), query && React.createElement("button", {
    className: "clr",
    onClick: () => setQuery(''),
    "aria-label": "クリア"
  }, "✕")), React.createElement("button", {
    className: `tw-icon-btn ${spinning ? 'spin' : ''}`,
    onClick: refresh,
    title: "最新データに更新"
  }, Icon.refresh(16), React.createElement("span", {
    className: "tw-refresh-lbl"
  }, "更新")));
}
function AuthScreen({
  variant,
  onSubmit
}) {
  const [token, setToken] = React.useState('');
  const err = variant === 'error';
  const submit = e => {
    e.preventDefault();
    if (token.trim()) onSubmit(token.trim());
  };
  return React.createElement("div", {
    className: "tw-auth"
  }, React.createElement("div", {
    className: "tw-auth-card"
  }, React.createElement("div", {
    className: "tw-auth-brand"
  }, React.createElement(Logo, {
    size: 30
  })), React.createElement("div", {
    className: `tw-auth-ic ${err ? 'err' : ''}`
  }, err ? Icon.alert(24) : Icon.qr(24)), React.createElement("div", {
    className: "tw-auth-t1"
  }, err ? 'パスワードが違います' : '先生用ダッシュボード'), React.createElement("div", {
    className: "tw-auth-t2"
  }, err ? 'パスワードが一致しませんでした。もう一度入力してください。' : 'このダッシュボードを開くにはパスワードが必要です。下に入力してください。'), React.createElement("form", {
    className: "tw-auth-field",
    onSubmit: submit
  }, React.createElement("label", {
    className: "tw-auth-label"
  }, "パスワード"), React.createElement("input", {
    className: "tw-auth-input",
    type: "password",
    value: token,
    onChange: e => setToken(e.target.value),
    placeholder: "パスワードを入力",
    autoComplete: "current-password",
    autoFocus: true
  }), err && React.createElement("div", {
    className: "tw-auth-err"
  }, Icon.alert(14), React.createElement("span", null, "パスワードが一致しませんでした。")), React.createElement("button", {
    className: "btn btn-primary btn-full",
    type: "submit",
    style: {
      marginTop: 16
    }
  }, "ダッシュボードを開く")), React.createElement("div", {
    className: "tw-auth-note"
  }, Icon.info(15), React.createElement("span", null, "パスワードはタブを閉じると破棄されます。アクセスできない場合は管理者にご連絡ください。"))));
}
function SetupScreen() {
  return React.createElement("div", {
    className: "tw-auth"
  }, React.createElement("div", {
    className: "tw-auth-card"
  }, React.createElement("div", {
    className: "tw-auth-brand"
  }, React.createElement(Logo, {
    size: 30
  })), React.createElement("div", {
    className: "tw-auth-ic err"
  }, Icon.alert(24)), React.createElement("div", {
    className: "tw-auth-t1"
  }, "セットアップが未完了です"), React.createElement("div", {
    className: "tw-auth-t2"
  }, React.createElement("code", null, "web/config.js"), " の ", React.createElement("b", null, "GAS_ENDPOINT"), " に、GAS ウェブアプリの", React.createElement("code", null, "/exec"), " URL を設定してください。")));
}
function DetailStateView({
  nav,
  name,
  state
}) {
  return React.createElement("div", {
    className: "tw-main tw-detail"
  }, React.createElement("button", {
    className: "tw-back",
    onClick: () => nav('back')
  }, Icon.chevL(14), " 一覧へ戻る"), React.createElement("h1", {
    className: "tw-detail-title",
    style: {
      marginBottom: 18
    }
  }, name), state === 'loading' && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "tw-detail-grid"
  }, [0, 1].map(i => React.createElement("div", {
    key: i,
    className: "gt-card gt-skel"
  }, React.createElement("div", {
    className: "gt-skel-bar",
    style: {
      width: '44%',
      height: 14
    }
  }), React.createElement("div", {
    className: "gt-skel-plot"
  })))), React.createElement("div", {
    className: "tw-loadwrap"
  }, React.createElement("div", {
    className: "spinner"
  }), React.createElement("span", null, "成績データを読み込み中…"))), state === 'empty' && React.createElement("div", {
    className: "tw-empty"
  }, React.createElement("div", {
    className: "tw-empty-ic"
  }, Icon.chart(26)), React.createElement("div", {
    className: "tw-empty-t1"
  }, "まだ成績データがありません"), React.createElement("div", {
    className: "tw-empty-t2"
  }, "この生徒の点数報告が登録されると、ここに推移が表示されます。"), React.createElement("button", {
    className: "btn btn-primary btn-sm",
    onClick: () => nav('back')
  }, "一覧へ戻る")), state === 'error' && React.createElement("div", {
    className: "tw-empty"
  }, React.createElement("div", {
    className: "tw-empty-ic",
    style: {
      background: 'var(--c-accent-soft)',
      color: '#9A4309'
    }
  }, Icon.alert(26)), React.createElement("div", {
    className: "tw-empty-t1"
  }, "データを取得できませんでした"), React.createElement("div", {
    className: "tw-empty-t2"
  }, "通信環境を確認して、画面右上の「更新」からもう一度お試しください。")));
}
function App() {
  const route = useHashRoute();
  const [query, setQuery] = React.useState('');
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [authed, setAuthed] = React.useState(() => {
    const cfg = window.GV_CONFIG || {};
    if (cfg.AUTH_ENABLED && cfg.ACCESS_TOKEN) return GVApi.getToken() === cfg.ACCESS_TOKEN;
    return GVApi.hasToken();
  });
  const [authError, setAuthError] = React.useState(false);
  const [listState, setListState] = React.useState('loading');
  const [detState, setDetState] = React.useState('loading');
  const [, force] = React.useReducer(x => x + 1, 0);
  const freshRef = React.useRef(false);
  const noConfig = !GVApi.ENDPOINT && !GVApi.SAMPLE;
  const onUnauthorized = () => {
    GVApi.clearToken();
    setAuthError(true);
    setAuthed(false);
  };
  function applyStudents(res) {
    if (res.status === 'ok') {
      window.STUDENTS = res.students || [];
      window.HOMEROOMS = res.homerooms || [];
      setListState(window.STUDENTS.length ? 'normal' : 'empty');
      force();
    } else if (res.status === 'empty') {
      window.STUDENTS = [];
      window.HOMEROOMS = [];
      setListState('empty');
      force();
    } else if (res.status === 'unauthorized') {
      onUnauthorized();
    } else {
      setListState('error');
    }
  }
  function applyDetail(name, res) {
    if (res.status === 'ok') {
      window.DETAIL[name] = res.detail;
      setDetState('normal');
      force();
    } else if (res.status === 'empty') {
      setDetState('empty');
    } else if (res.status === 'unauthorized') {
      onUnauthorized();
    } else {
      setDetState('error');
    }
  }
  React.useEffect(() => {
    if (!authed || noConfig) return;
    let alive = true;
    const fresh = freshRef.current;
    setListState(s => window.STUDENTS && window.STUDENTS.length ? s : 'loading');
    GVApi.fetchStudents({
      fresh,
      onRevalidate: f => {
        if (alive) applyStudents(f);
      }
    }).then(res => {
      if (!alive) return;
      applyStudents(res);
      if (!fresh && res.status === 'ok') {
        GVApi.fetchStudents({
          fresh: true
        }).then(f => {
          if (alive && f.status === 'ok') applyStudents(f);
        }).catch(() => {});
      }
    }).catch(() => {
      if (alive) setListState('error');
    });
    return () => {
      alive = false;
    };
  }, [authed, refreshKey, noConfig]);
  React.useEffect(() => {
    if (route.name !== 'student' || !authed || noConfig) return;
    let alive = true;
    const fresh = freshRef.current;
    setDetState(window.DETAIL[route.param] ? 'normal' : 'loading');
    GVApi.fetchDetail(route.param, {
      fresh,
      onRevalidate: f => {
        if (alive) applyDetail(route.param, f);
      }
    }).then(res => {
      if (alive) applyDetail(route.param, res);
    }).catch(() => {
      if (alive) setDetState('error');
    });
    return () => {
      alive = false;
    };
  }, [route.name, route.param, authed, refreshKey, noConfig]);
  React.useEffect(() => {
    freshRef.current = false;
  }, [refreshKey]);
  const nav = (name, param) => {
    if (name === 'back') {
      window.location.hash = '#/students';
      return;
    }
    if (name === 'student') {
      window.location.hash = `#/student/${encodeURIComponent(param)}`;
      return;
    }
    if (name === 'shibou') {
      window.location.hash = `#/shibou/${encodeURIComponent(param)}`;
      return;
    }
    if (name === 'students') {
      window.location.hash = '#/students';
      return;
    }
  };
  const onRefresh = () => {
    freshRef.current = true;
    GVApi.clearCache();
    setRefreshKey(k => k + 1);
  };
  if (noConfig) return React.createElement("div", {
    className: "gv-root tw-root dens-regular"
  }, React.createElement(SetupScreen, null));
  if (!authed) {
    return React.createElement("div", {
      className: "gv-root tw-root dens-regular"
    }, React.createElement(AuthScreen, {
      variant: authError ? 'error' : 'token',
      onSubmit: tok => {
        const expected = window.GV_CONFIG && window.GV_CONFIG.ACCESS_TOKEN || '';
        if (expected && tok !== expected) {
          setAuthError(true);
          GVApi.clearToken();
          return;
        }
        GVApi.setToken(tok);
        setAuthError(false);
        setAuthed(true);
        setRefreshKey(k => k + 1);
      }
    }));
  }
  const detReady = detState === 'normal' && window.DETAIL[route.param];
  return React.createElement("div", {
    className: "gv-root tw-root dens-regular",
    "data-device": "desktop"
  }, React.createElement(Header, {
    query: query,
    setQuery: setQuery,
    onRefresh: onRefresh,
    onHome: () => nav('students')
  }), React.createElement("div", {
    className: "tw-frame"
  }, route.name === 'shibou' ? React.createElement(ShibouScreen, {
    key: 'shibou:' + route.param + ':' + refreshKey,
    nav: nav,
    name: route.param
  }) : route.name === 'student' ? detReady ? React.createElement(StudentDetailScreen, {
    key: route.param + ':' + refreshKey,
    nav: nav,
    name: route.param,
    state: "normal"
  }) : React.createElement(DetailStateView, {
    nav: nav,
    name: route.param,
    state: detState === 'normal' ? 'loading' : detState
  }) : React.createElement(StudentListScreen, {
    key: 'list:' + refreshKey,
    nav: nav,
    query: query,
    layout: "table",
    state: listState,
    density: "regular",
    showOverview: true
  })));
}
GVApi.captureTokenFromUrl();
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App, null));