function parseHash() {
  const h = (window.location.hash || '').replace(/^#\/?/, '');
  const path = h.split('?')[0];
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'student' && parts[1]) return {
    name: 'student',
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
  }, "Teacher"), "\u6210\u7E3E\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9"), React.createElement("div", {
    className: "tw-header-spacer"
  }), React.createElement("div", {
    className: "tw-search"
  }, Icon.search(16), React.createElement("input", {
    value: query,
    placeholder: "\u751F\u5F92\u540D\u3067\u691C\u7D22",
    onChange: e => setQuery(e.target.value)
  }), query && React.createElement("button", {
    className: "clr",
    onClick: () => setQuery(''),
    "aria-label": "\u30AF\u30EA\u30A2"
  }, "\u2715")), React.createElement("button", {
    className: `tw-icon-btn ${spinning ? 'spin' : ''}`,
    onClick: refresh,
    title: "\u6700\u65B0\u30C7\u30FC\u30BF\u306B\u66F4\u65B0"
  }, Icon.refresh(16), React.createElement("span", {
    className: "tw-refresh-lbl"
  }, "\u66F4\u65B0")));
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
  }, "\u30D1\u30B9\u30EF\u30FC\u30C9"), React.createElement("input", {
    className: "tw-auth-input",
    type: "password",
    value: token,
    onChange: e => setToken(e.target.value),
    placeholder: "\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u5165\u529B",
    autoComplete: "current-password",
    autoFocus: true
  }), err && React.createElement("div", {
    className: "tw-auth-err"
  }, Icon.alert(14), React.createElement("span", null, "\u30D1\u30B9\u30EF\u30FC\u30C9\u304C\u4E00\u81F4\u3057\u307E\u305B\u3093\u3067\u3057\u305F\u3002")), React.createElement("button", {
    className: "btn btn-primary btn-full",
    type: "submit",
    style: {
      marginTop: 16
    }
  }, "\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9\u3092\u958B\u304F")), React.createElement("div", {
    className: "tw-auth-note"
  }, Icon.info(15), React.createElement("span", null, "\u30D1\u30B9\u30EF\u30FC\u30C9\u306F\u30BF\u30D6\u3092\u9589\u3058\u308B\u3068\u7834\u68C4\u3055\u308C\u307E\u3059\u3002\u30A2\u30AF\u30BB\u30B9\u3067\u304D\u306A\u3044\u5834\u5408\u306F\u7BA1\u7406\u8005\u306B\u3054\u9023\u7D61\u304F\u3060\u3055\u3044\u3002"))));
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
  }, "\u30BB\u30C3\u30C8\u30A2\u30C3\u30D7\u304C\u672A\u5B8C\u4E86\u3067\u3059"), React.createElement("div", {
    className: "tw-auth-t2"
  }, React.createElement("code", null, "web/config.js"), " \u306E ", React.createElement("b", null, "GAS_ENDPOINT"), " \u306B\u3001GAS \u30A6\u30A7\u30D6\u30A2\u30D7\u30EA\u306E", React.createElement("code", null, "/exec"), " URL \u3092\u8A2D\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002")));
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
  }, Icon.chevL(14), " \u4E00\u89A7\u3078\u623B\u308B"), React.createElement("h1", {
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
  }), React.createElement("span", null, "\u6210\u7E3E\u30C7\u30FC\u30BF\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026"))), state === 'empty' && React.createElement("div", {
    className: "tw-empty"
  }, React.createElement("div", {
    className: "tw-empty-ic"
  }, Icon.chart(26)), React.createElement("div", {
    className: "tw-empty-t1"
  }, "\u307E\u3060\u6210\u7E3E\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093"), React.createElement("div", {
    className: "tw-empty-t2"
  }, "\u3053\u306E\u751F\u5F92\u306E\u70B9\u6570\u5831\u544A\u304C\u767B\u9332\u3055\u308C\u308B\u3068\u3001\u3053\u3053\u306B\u63A8\u79FB\u304C\u8868\u793A\u3055\u308C\u307E\u3059\u3002"), React.createElement("button", {
    className: "btn btn-primary btn-sm",
    onClick: () => nav('back')
  }, "\u4E00\u89A7\u3078\u623B\u308B")), state === 'error' && React.createElement("div", {
    className: "tw-empty"
  }, React.createElement("div", {
    className: "tw-empty-ic",
    style: {
      background: 'var(--c-accent-soft)',
      color: '#9A4309'
    }
  }, Icon.alert(26)), React.createElement("div", {
    className: "tw-empty-t1"
  }, "\u30C7\u30FC\u30BF\u3092\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F"), React.createElement("div", {
    className: "tw-empty-t2"
  }, "\u901A\u4FE1\u74B0\u5883\u3092\u78BA\u8A8D\u3057\u3066\u3001\u753B\u9762\u53F3\u4E0A\u306E\u300C\u66F4\u65B0\u300D\u304B\u3089\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002")));
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
  }, route.name === 'student' ? detReady ? React.createElement(StudentDetailScreen, {
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