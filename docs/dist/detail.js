function AttMini({
  det
}) {
  const abs = det.absence || {};
  const keys = SUBJECT_ORDER.filter(k => abs[k] != null);
  if (!keys.length) return null;
  return React.createElement("div", {
    className: "tw-att-mini"
  }, React.createElement("div", {
    className: "tw-att-mini-h"
  }, React.createElement("span", {
    className: "t"
  }, "\u6388\u696D\u306E\u6B20\u5E2D\u7387"), React.createElement("span", {
    className: "aux"
  }, "ATTENDANCE")), React.createElement("div", {
    className: "tw-att-mini-row"
  }, keys.map(k => {
    const m = SUBJECT_META[k];
    return React.createElement("span", {
      key: k,
      className: `tw-att-pill ${absLevel(abs[k])}`
    }, React.createElement("span", {
      className: "sdot",
      style: {
        background: m.color
      }
    }), React.createElement("span", {
      className: "lbl"
    }, m.label), React.createElement("b", {
      className: "gv-num"
    }, absFmt(abs[k]), React.createElement("small", null, "%")));
  })));
}
const FIELD_COLORS = ['#5F8159', '#C77A3D', '#6E8FA6', '#B0593F', '#8A9B5A', '#9C6F94', '#3F7E72', '#C29A3A', '#7A6BA6', '#B85C6E', '#5E8C6A', '#A9743B', '#4F7E96', '#A85C4A', '#7C8C4E', '#8C6486', '#3E7468', '#B08A33', '#6E5F96', '#A85262'];
const METRICS = [{
  key: 'rate',
  label: '得点率',
  unit: '%'
}, {
  key: 'avgRate',
  label: '平均得点率',
  unit: '%'
}, {
  key: 'hensachi',
  label: '偏差値',
  unit: ''
}];
function colorForField(det, subject, field) {
  const idx = det.data[subject].fields.indexOf(field);
  return FIELD_COLORS[(idx % FIELD_COLORS.length + FIELD_COLORS.length) % FIELD_COLORS.length];
}
function latestPair(arr) {
  let last = null,
    prev = null,
    lastIdx = -1;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] != null) {
      if (last == null) {
        last = arr[i];
        lastIdx = i;
      } else {
        prev = arr[i];
        break;
      }
    }
  }
  return {
    last,
    prev,
    lastIdx
  };
}
function defaultFields(det, subject) {
  const d = det.data[subject];
  const ranked = d.fields.map(f => ({
    f,
    v: latestPair(d.rate[f]).last
  })).filter(x => x.v != null).sort((a, b) => b.v - a.v);
  const top = ranked.slice(0, 3).map(x => x.f);
  const bot = ranked.slice(-3).map(x => x.f);
  return [...top, ...bot].filter((v, i, a) => a.indexOf(v) === i);
}
function swCount(subject) {
  return subject === 'chemistry' || subject === 'biology' ? 5 : 3;
}
function Delta2({
  v,
  unit
}) {
  if (v == null) return React.createElement("span", {
    className: "gt-sw-d flat gv-num"
  }, "\u2013");
  const dv = Math.round(v * 10) / 10;
  const cls = dv > 0.05 ? 'up' : dv < -0.05 ? 'down' : 'flat';
  return React.createElement("span", {
    className: `gt-sw-d ${cls} gv-num`
  }, dv > 0 ? '+' : '', dv);
}
const MOCK_FULL_MARKS = 1000;
function Num({
  v,
  sub,
  strong
}) {
  if (v == null) return React.createElement("span", {
    className: "mk-na"
  }, "\u2013");
  return React.createElement("span", {
    className: `gv-num ${strong ? 'mk-strong' : ''}`
  }, v, sub ? React.createElement("small", null, sub) : null);
}
function SubjCell({
  name
}) {
  const na = !name || name === '受験していない';
  return React.createElement("span", {
    className: `mk-subj ${na ? 'mk-na' : ''}`
  }, name || '–');
}
function MockExamCard({
  det
}) {
  const mock = det.mock;
  if (!mock || !mock.exams.length) {
    return React.createElement("div", {
      className: "gt-card mk-card",
      style: {
        margin: '0 0 30px'
      }
    }, React.createElement("div", {
      className: "gt-card-head"
    }, React.createElement("div", {
      className: "gt-card-title"
    }, "\u6A21\u8A66\u306E\u6210\u7E3E\u63A8\u79FB", React.createElement("span", {
      className: "gt-card-title-sub"
    }, "\u5171\u901A\u30C6\u30B9\u30C8\u578B\u30DE\u30FC\u30AF\u6A21\u8A66"))), React.createElement("div", {
      className: "gt-note gt-note-soft"
    }, "\u30DE\u30FC\u30AF\u6A21\u8A66\u306E\u8A18\u9332\u304C\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002"));
  }
  const rows = [...mock.exams].reverse();
  const latest = mock.exams[mock.exams.length - 1];
  const prevFull = [...mock.exams].reverse().slice(1).find(e => e.full);
  const latestForDelta = latest.full ? latest : [...mock.exams].reverse().find(e => e.full);
  const delta = latestForDelta && prevFull && latestForDelta !== prevFull ? latestForDelta.total - prevFull.total : null;
  const best = mock.exams.reduce((m, e) => Math.max(m, e.total), 0);
  return React.createElement("div", {
    className: "gt-card mk-card",
    style: {
      lineHeight: "1.4",
      margin: "0px 0px 30px"
    }
  }, React.createElement("div", {
    className: "gt-card-head"
  }, React.createElement("div", {
    className: "gt-card-title"
  }, "\u6A21\u8A66\u306E\u6210\u7E3E\u63A8\u79FB", React.createElement("span", {
    className: "gt-card-title-sub"
  }, "\u5171\u901A\u30C6\u30B9\u30C8\u578B\u30DE\u30FC\u30AF\u6A21\u8A66")), React.createElement("div", {
    className: "gt-card-aux gv-en"
  }, mock.exams.length, " \u56DE\u53D7\u9A13")), React.createElement("div", {
    className: "mk-top"
  }, React.createElement("div", {
    className: "mk-asp"
  }, React.createElement("div", {
    className: "mk-asp-k"
  }, "\u5FD7\u671B\u6821 ", React.createElement("span", {
    className: "mk-asp-note"
  }, "\u6700\u65B0")), React.createElement("div", {
    className: "mk-asp-v"
  }, mock.aspiration), mock.aspHistory.length > 1 && React.createElement("div", {
    className: "mk-asp-hist"
  }, "\u5C65\u6B74\uFF1A", mock.aspHistory.map((h, i) => React.createElement("span", {
    key: i
  }, i > 0 ? ' → ' : '', React.createElement("span", {
    className: i === mock.aspHistory.length - 1 ? 'cur' : ''
  }, h.school))))), React.createElement("div", {
    className: "mk-sumrow"
  }, React.createElement("div", {
    className: "mk-sum"
  }, React.createElement("div", {
    className: "mk-sum-k"
  }, "\u76F4\u8FD1 \u5408\u8A08\u70B9"), React.createElement("div", {
    className: "mk-sum-v"
  }, React.createElement("span", {
    className: "gv-num"
  }, latestForDelta ? latestForDelta.total : latest.total), React.createElement("span", {
    className: "mk-sum-u"
  }, "/ ", MOCK_FULL_MARKS)), delta != null && React.createElement("div", {
    className: `mk-sum-d ${delta >= 0 ? 'up' : 'down'} gv-num`
  }, delta >= 0 ? '▲' : '▼', " ", Math.abs(delta), React.createElement("small", null, "\u524D\u56DE\u6BD4"))), React.createElement("div", {
    className: "mk-sum"
  }, React.createElement("div", {
    className: "mk-sum-k"
  }, "\u81EA\u5DF1\u30D9\u30B9\u30C8"), React.createElement("div", {
    className: "mk-sum-v"
  }, React.createElement("span", {
    className: "gv-num"
  }, best), React.createElement("span", {
    className: "mk-sum-u"
  }, "/ ", MOCK_FULL_MARKS))))), React.createElement("div", {
    className: "mk-tablewrap"
  }, React.createElement("table", {
    className: "mk-table"
  }, React.createElement("thead", null, React.createElement("tr", {
    className: "mk-grp"
  }, React.createElement("th", {
    rowSpan: "2",
    className: "mk-sticky mk-date"
  }, "\u8A18\u5165\u65E5"), React.createElement("th", {
    rowSpan: "2",
    className: "mk-sticky mk-name"
  }, "\u8A66\u9A13\u540D"), React.createElement("th", {
    colSpan: "4",
    className: "mk-g-ko"
  }, "\u56FD\u8A9E"), React.createElement("th", {
    colSpan: "3",
    className: "mk-g-en"
  }, "\u82F1\u8A9E"), React.createElement("th", {
    colSpan: "2",
    className: "mk-g-ma"
  }, "\u6570\u5B66"), React.createElement("th", {
    colSpan: "6",
    className: "mk-g-ri"
  }, "\u7406\u79D1"), React.createElement("th", {
    colSpan: "4",
    className: "mk-g-sh"
  }, "\u793E\u4F1A"), React.createElement("th", {
    rowSpan: "2",
    className: "mk-g-jo"
  }, "\u60C5\u5831"), React.createElement("th", {
    rowSpan: "2",
    className: "mk-tot"
  }, "\u5408\u8A08\u70B9")), React.createElement("tr", {
    className: "mk-sub"
  }, React.createElement("th", null, "\u73FE\u4EE3\u6587"), React.createElement("th", null, "\u53E4\u6587"), React.createElement("th", null, "\u6F22\u6587"), React.createElement("th", {
    className: "mk-subtot"
  }, "\u5408\u8A08"), React.createElement("th", null, "\u7B46\u8A18"), React.createElement("th", null, "L"), React.createElement("th", {
    className: "mk-subtot"
  }, "\u5408\u8A08"), React.createElement("th", null, "\u2160A"), React.createElement("th", null, "\u2161B"), React.createElement("th", {
    className: "mk-subjcol"
  }, "\u7B2C\u4E00\u89E3\u7B54"), React.createElement("th", null, "\u70B9"), React.createElement("th", {
    className: "mk-subjcol"
  }, "\u7B2C\u4E8C\u89E3\u7B54"), React.createElement("th", null, "\u70B9"), React.createElement("th", {
    className: "mk-subjcol"
  }, "\u7B2C\u4E09\u89E3\u7B54"), React.createElement("th", null, "\u70B9"), React.createElement("th", {
    className: "mk-subjcol"
  }, "\u7B2C\u4E00\u89E3\u7B54"), React.createElement("th", null, "\u70B9"), React.createElement("th", {
    className: "mk-subjcol"
  }, "\u7B2C\u4E8C\u89E3\u7B54"), React.createElement("th", null, "\u70B9"))), React.createElement("tbody", null, rows.map((e, i) => React.createElement("tr", {
    key: i,
    className: e.full ? '' : 'mk-partial'
  }, React.createElement("td", {
    className: "mk-sticky mk-date gv-num"
  }, e.date.slice(5)), React.createElement("td", {
    className: "mk-sticky mk-name"
  }, e.name, !e.full && React.createElement("span", {
    className: "mk-pill"
  }, "\u82F1\u6570")), React.createElement("td", null, React.createElement(Num, {
    v: e.kokugo && e.kokugo.gendai
  })), React.createElement("td", null, React.createElement(Num, {
    v: e.kokugo && e.kokugo.koten
  })), React.createElement("td", null, React.createElement(Num, {
    v: e.kokugo && e.kokugo.kanbun
  })), React.createElement("td", {
    className: "mk-subtot"
  }, React.createElement(Num, {
    v: e.kokugo && e.kokugo.total,
    strong: true
  })), React.createElement("td", null, React.createElement(Num, {
    v: e.eigo && e.eigo.w
  })), React.createElement("td", null, React.createElement(Num, {
    v: e.eigo && e.eigo.l
  })), React.createElement("td", {
    className: "mk-subtot"
  }, React.createElement(Num, {
    v: e.eigo && e.eigo.total,
    strong: true
  })), React.createElement("td", null, React.createElement(Num, {
    v: e.math && e.math.ia
  })), React.createElement("td", null, React.createElement(Num, {
    v: e.math && e.math.iib
  })), React.createElement("td", {
    className: "mk-subjcol"
  }, React.createElement(SubjCell, {
    name: e.rika[0].name
  })), React.createElement("td", null, React.createElement(Num, {
    v: e.rika[0].score
  })), React.createElement("td", {
    className: "mk-subjcol"
  }, React.createElement(SubjCell, {
    name: e.rika[1].name
  })), React.createElement("td", null, React.createElement(Num, {
    v: e.rika[1].score
  })), React.createElement("td", {
    className: "mk-subjcol"
  }, React.createElement(SubjCell, {
    name: e.rika[2].name
  })), React.createElement("td", null, React.createElement(Num, {
    v: e.rika[2].score
  })), React.createElement("td", {
    className: "mk-subjcol"
  }, React.createElement(SubjCell, {
    name: e.shakai[0].name
  })), React.createElement("td", null, React.createElement(Num, {
    v: e.shakai[0].score
  })), React.createElement("td", {
    className: "mk-subjcol"
  }, React.createElement(SubjCell, {
    name: e.shakai[1].name
  })), React.createElement("td", null, React.createElement(Num, {
    v: e.shakai[1].score
  })), React.createElement("td", null, React.createElement(Num, {
    v: e.joho
  })), React.createElement("td", {
    className: "mk-tot gv-num"
  }, e.total)))))), React.createElement("div", {
    className: "mk-cards"
  }, rows.map((e, i) => {
    const items = [];
    if (e.full) items.push({
      k: '国語',
      v: e.kokugo && e.kokugo.total
    });
    items.push({
      k: '英語',
      v: e.eigo && e.eigo.total
    });
    items.push({
      k: '数学ⅠA',
      v: e.math && e.math.ia
    });
    items.push({
      k: '数学ⅡB',
      v: e.math && e.math.iib
    });
    if (e.full) {
      e.rika.forEach(r => {
        if (r.name && r.name !== '受験していない') items.push({
          k: r.name,
          v: r.score,
          tag: '理'
        });
      });
      e.shakai.forEach(r => {
        if (r.name && r.name !== '受験していない') items.push({
          k: r.name,
          v: r.score,
          tag: '社'
        });
      });
      items.push({
        k: '情報',
        v: e.joho
      });
    }
    return React.createElement("div", {
      key: i,
      className: `mk-xcard ${e.full ? '' : 'mk-xcard-partial'}`
    }, React.createElement("div", {
      className: "mk-xcard-head"
    }, React.createElement("span", {
      className: "mk-xcard-date gv-num"
    }, e.date.slice(5)), React.createElement("span", {
      className: "mk-xcard-name"
    }, e.name, !e.full && React.createElement("span", {
      className: "mk-pill"
    }, "\u82F1\u6570")), React.createElement("span", {
      className: "mk-xcard-tot gv-num"
    }, e.total, React.createElement("small", null, "/ ", MOCK_FULL_MARKS))), React.createElement("div", {
      className: "mk-xcard-grid"
    }, items.map((it, j) => React.createElement("div", {
      key: j,
      className: "mk-xcell"
    }, React.createElement("span", {
      className: "mk-xcell-k"
    }, it.tag && React.createElement("i", {
      className: "mk-xtag"
    }, it.tag), it.k), React.createElement("span", {
      className: "mk-xcell-v"
    }, React.createElement(Num, {
      v: it.v
    }))))));
  })), React.createElement("div", {
    className: "gt-note gt-note-soft"
  }, "\u30DE\u30FC\u30AF\u6A21\u8A66(\u30D5\u30A9\u30FC\u30E0) \u30B7\u30FC\u30C8\u306E\u8A18\u9332\u3092\u65B0\u3057\u3044\u9806\u306B\u8868\u793A\u3002\u300C\u82F1\u6570\u300D\u306F\u56FD\u8A9E\u30FB\u7406\u79D1\u30FB\u793E\u4F1A\u3092\u542B\u307E\u306A\u3044\u6821\u5185\u30DE\u30FC\u30AF\u6A21\u8A66\u3067\u3059\u3002\u5FD7\u671B\u6821\u306F\u30D5\u30A9\u30FC\u30E0 I\u5217\u306E\u6700\u65B0\u56DE\u7B54\u3092\u63A1\u7528\u3057\u3066\u3044\u307E\u3059\u3002"));
}
function StudentDetailScreen({
  nav,
  name,
  state = 'normal'
}) {
  const det = DETAIL[name];
  const subjects = det ? det.subjects : [];
  const [subject, setSubject] = React.useState(subjects[0]);
  const [metric, setMetric] = React.useState('rate');
  const [sel, setSel] = React.useState(() => new Set());
  const [fv, setFv] = React.useState('lines');
  const [range, setRange] = React.useState('all');
  React.useEffect(() => {
    setSel(new Set());
  }, [subject, name]);
  React.useEffect(() => {
    setRange('all');
  }, [subject]);
  if (!det) return null;
  const meta = SUBJECT_META[subject];
  const d = det.data[subject];
  const months = det.months;
  const tt = d.totalTrend;
  const view = range === 'all' ? tt : tt.slice(-range);
  const latest = tt[tt.length - 1];
  const prev = tt[tt.length - 2];
  const delta = prev ? latest.total - prev.total : 0;
  const curMetric = METRICS.find(m => m.key === metric);
  const order = d.fields.filter(f => sel.has(f));
  const fieldSeries = order.map(f => ({
    name: f,
    color: colorForField(det, subject, f),
    rate: d.rate[f],
    avgRate: d.avgRate[f],
    hensachi: d.hensachi[f]
  }));
  const toggleField = f => setSel(s => {
    const n = new Set(s);
    n.has(f) ? n.delete(f) : n.add(f);
    return n;
  });
  const onPrintPDF = () => {
    setFv('strengths');
    setMetric('rate');
    let st = document.getElementById('gv-print-page');
    if (!st) {
      st = document.createElement('style');
      st.id = 'gv-print-page';
      document.head.appendChild(st);
    }
    st.textContent = '@page { size: B4 landscape; margin: 7mm; }';
    setTimeout(() => window.print(), 220);
  };
  const swMetricKey = metric === 'avgRate' ? 'rate' : metric;
  const swMetric = METRICS.find(m => m.key === swMetricKey);
  const ranked = d.fields.map(f => {
    const {
      last,
      prev
    } = latestPair(d[swMetricKey][f]);
    return {
      f,
      v: last,
      prev
    };
  }).filter(x => x.v != null).sort((a, b) => b.v - a.v);
  const cnt = swCount(subject);
  const strong = ranked.slice(0, cnt);
  const weak = ranked.slice(-cnt).reverse().filter(w => !strong.some(s => s.f === w.f));
  const subjectUI = subjects.length <= 2 ? 'segmented' : 'chips';
  if (state !== 'normal') {
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
    }, name, React.createElement("span", {
      className: "grade"
    }, det.grade)), state === 'loading' && React.createElement("div", {
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
    })))), state === 'loading' && React.createElement("div", {
      className: "tw-loadwrap"
    }, React.createElement("div", {
      className: "spinner"
    }), React.createElement("span", null, "\u6210\u7E3E\u30C7\u30FC\u30BF\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026")), state === 'empty' && React.createElement("div", {
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
    }, "\u901A\u4FE1\u74B0\u5883\u3092\u78BA\u8A8D\u3057\u3066\u3001\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002"), React.createElement("button", {
      className: "btn btn-quiet btn-sm",
      onClick: () => {}
    }, Icon.refresh(16), React.createElement("span", {
      style: {
        marginLeft: 6
      }
    }, "\u3082\u3046\u4E00\u5EA6\u8A66\u3059"))));
  }
  return React.createElement("div", {
    className: "tw-main tw-detail"
  }, React.createElement("div", {
    className: "tw-detail-topbar"
  }, React.createElement("button", {
    className: "tw-back",
    onClick: () => nav('back')
  }, Icon.chevL(14), " \u4E00\u89A7\u3078\u623B\u308B"), React.createElement("div", {
    className: "gv-print-bar"
  }, React.createElement("button", {
    className: "gv-print-btn",
    onClick: onPrintPDF
  }, "PDF\u51FA\u529B\uFF08B4\u30FB\u6A2A\uFF09"))), React.createElement("div", {
    className: "tw-detail-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "tw-eyebrow"
  }, "REPORT \xB7 \u6210\u7E3E\u63A8\u79FB"), React.createElement("h1", {
    className: "tw-detail-title"
  }, name, React.createElement("span", {
    className: "grade"
  }, det.grade)), React.createElement("div", {
    className: "tw-detail-meta"
  }, React.createElement("span", {
    className: "tw-hr-chip"
  }, "\u62C5\u4EFB ", det.homeroom, " \u5148\u751F"), det.mock && det.mock.aspiration && React.createElement("span", {
    className: "tw-asp-inline"
  }, Icon.flag ? Icon.flag(13) : null, "\u5FD7\u671B\u6821 ", React.createElement("b", null, det.mock.aspiration)))), React.createElement("div", {
    className: "tw-detail-right"
  }, React.createElement("div", {
    className: "tw-detail-en"
  }, meta.en), React.createElement(AttMini, {
    det: det
  }))), React.createElement(MockExamCard, {
    det: det
  }), React.createElement("div", {
    className: "tw-subject-section"
  }, React.createElement("div", {
    className: "tw-eyebrow tw-subject-eyebrow"
  }, "\u79D1\u76EE\u5225\u306E\u6210\u7E3E\u63A8\u79FB"), React.createElement("div", {
    className: subjectUI === 'segmented' ? 'gt-seg' : 'tw-subjtabs',
    style: subjectUI === 'segmented' ? {
      maxWidth: 360,
      marginBottom: 12
    } : {
      marginBottom: 12
    },
    role: "tablist"
  }, subjects.map(s => subjectUI === 'segmented' ? React.createElement("button", {
    key: s,
    role: "tab",
    "aria-selected": s === subject,
    className: `gt-seg-btn ${s === subject ? 'on' : ''}`,
    onClick: () => setSubject(s)
  }, SUBJECT_META[s].label) : React.createElement("button", {
    key: s,
    role: "tab",
    "aria-selected": s === subject,
    className: `gt-chip-sub ${s === subject ? 'on' : ''}`,
    onClick: () => setSubject(s)
  }, s === subject && React.createElement("span", {
    className: "gt-chip-dot",
    style: {
      background: SUBJECT_META[s].color
    }
  }), SUBJECT_META[s].label))), React.createElement("div", {
    key: subject,
    className: "gt-fade tw-detail-grid"
  }, React.createElement("div", {
    className: "gt-card",
    style: {
      margin: "-5px 0px 0px"
    }
  }, React.createElement("div", {
    className: "gt-card-head"
  }, React.createElement("div", {
    className: "gt-card-title"
  }, "\u5408\u8A08\u70B9\u306E\u63A8\u79FB"), React.createElement("div", {
    className: "gt-card-aux gv-en"
  }, tt.length, " TESTS")), React.createElement("div", {
    className: "gt-summary"
  }, React.createElement("div", {
    className: "gt-sum-main"
  }, React.createElement("div", {
    className: "gt-sum-k"
  }, "\u76F4\u8FD1"), React.createElement("div", {
    className: "gt-sum-v"
  }, React.createElement("span", {
    className: "gv-num"
  }, latest.total), React.createElement("span", {
    className: "gt-sum-u"
  }, "\u70B9")), prev && React.createElement("div", {
    className: `gt-sum-delta ${delta >= 0 ? 'up' : 'down'}`
  }, delta >= 0 ? '▲' : '▼', " ", React.createElement("span", {
    className: "gv-num"
  }, Math.abs(delta)))), React.createElement("div", {
    className: "gt-sum-sub"
  }, React.createElement("div", {
    className: "gt-sum-cell"
  }, React.createElement("span", {
    className: "k"
  }, "\u5E73\u5747"), React.createElement("span", {
    className: "v gv-num"
  }, latest.avg)), React.createElement("div", {
    className: "gt-sum-cell acc"
  }, React.createElement("span", {
    className: "k"
  }, "\u504F\u5DEE\u5024"), React.createElement("span", {
    className: "v gv-num"
  }, latest.hensachi)))), tt.length > 14 && React.createElement("div", {
    className: "gt-range"
  }, [['直近12', 12], ['直近30', 30], ['全期間', 'all']].map(([lb, v]) => React.createElement("button", {
    key: lb,
    className: `gt-range-btn ${range === v ? 'on' : ''}`,
    onClick: () => setRange(v)
  }, lb)), React.createElement("span", {
    className: "gt-range-count gv-num"
  }, view.length, " / ", tt.length, " \u4EF6")), view.length >= 2 ? React.createElement(React.Fragment, null, React.createElement(Measured, {
    h: 220
  }, w => React.createElement(TotalTrendChart, {
    points: view,
    width: w
  })), React.createElement("div", {
    className: "gt-legend"
  }, React.createElement("span", {
    className: "gt-leg"
  }, React.createElement("span", {
    className: "gt-leg-line main"
  }), "\u5408\u8A08\u70B9"), React.createElement("span", {
    className: "gt-leg"
  }, React.createElement("span", {
    className: "gt-leg-line dash"
  }), "\u5E73\u5747\u70B9"), React.createElement("span", {
    className: "gt-leg"
  }, React.createElement("span", {
    className: "gt-leg-line acc"
  }), "\u504F\u5DEE\u5024 ", React.createElement("span", {
    className: "gv-en",
    style: {
      opacity: .6
    }
  }, "(\u53F3\u8EF8)")))) : React.createElement("div", {
    className: "gt-note"
  }, "\u30C7\u30FC\u30BF\u304C ", view.length, " \u4EF6\u306E\u305F\u3081\u3001\u63A8\u79FB\u30B0\u30E9\u30D5\u306F2\u4EF6\u4EE5\u4E0A\u3067\u8868\u793A\u3055\u308C\u307E\u3059\u3002"), React.createElement("div", {
    className: "gt-tests"
  }, React.createElement("div", {
    className: "gt-tests-h"
  }, React.createElement("span", null, "\u30C6\u30B9\u30C8\u3054\u3068\u306E\u8A18\u9332"), React.createElement("span", {
    className: "gt-tests-count gv-num"
  }, "\u5168 ", tt.length, " \u4EF6")), React.createElement("div", {
    className: "gt-scroll"
  }, [...tt].reverse().map((p, i) => React.createElement("div", {
    key: i,
    className: "gt-test-row"
  }, React.createElement("span", {
    className: "gt-test-date gv-num"
  }, p.date.slice(5)), React.createElement("span", {
    className: "gt-test-name"
  }, p.test), React.createElement("span", {
    className: "gt-test-score gv-num"
  }, p.total, React.createElement("small", null, "\u70B9")), React.createElement("span", {
    className: "gt-test-hen gv-num"
  }, "\u504F ", p.hensachi)))))), React.createElement("div", {
    className: "gt-card"
  }, React.createElement("div", {
    className: "gt-card-head"
  }, React.createElement("div", {
    className: "gt-card-title"
  }, "\u5206\u91CE\u5225\u306E\u63A8\u79FB", React.createElement("span", {
    className: "gt-card-title-sub"
  }, "\u6708\u6B21\u5E73\u5747")), React.createElement("div", {
    className: "gt-card-aux gv-en"
  }, d.fields.length, " \u5206\u91CE")), React.createElement("div", {
    className: "gt-vchips"
  }, [['lines', '折れ線'], ['strengths', '得点傾向']].map(([v, lb]) => React.createElement("button", {
    key: v,
    className: `gt-chip-sub ${fv === v ? 'on' : ''}`,
    onClick: () => setFv(v)
  }, fv === v && React.createElement("span", {
    className: "gt-chip-dot"
  }), lb))), fv === 'lines' && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "gt-presets"
  }, React.createElement("button", {
    className: "gt-preset",
    onClick: () => setSel(new Set(defaultFields(det, subject)))
  }, "\u5F37\u5F316"), React.createElement("button", {
    className: "gt-preset",
    onClick: () => setSel(new Set(d.fields))
  }, "\u5168\u3066"), React.createElement("button", {
    className: "gt-preset",
    onClick: () => setSel(new Set())
  }, "\u30AF\u30EA\u30A2"), React.createElement("span", {
    className: "gt-presets-count gv-num"
  }, sel.size, "/", d.fields.length)), React.createElement(Measured, {
    h: 220
  }, w => React.createElement(FieldMultiChart, {
    months: months,
    fields: fieldSeries,
    width: w
  })), React.createElement("div", {
    className: "gt-legend"
  }, React.createElement("span", {
    className: "gt-leg"
  }, React.createElement("span", {
    style: {
      display: 'inline-block',
      width: 16,
      borderTop: '2.6px solid var(--c-text-sub)',
      marginRight: 6,
      verticalAlign: 'middle'
    }
  }), "\u5F97\u70B9\u7387"), React.createElement("span", {
    className: "gt-leg"
  }, React.createElement("span", {
    style: {
      display: 'inline-block',
      width: 16,
      borderTop: '2px dashed var(--c-text-sub)',
      marginRight: 6,
      verticalAlign: 'middle'
    }
  }), "\u5E73\u5747\u5F97\u70B9\u7387"), React.createElement("span", {
    className: "gt-leg"
  }, React.createElement("span", {
    style: {
      display: 'inline-block',
      width: 16,
      borderTop: '1.5px solid var(--c-text-mute)',
      marginRight: 6,
      verticalAlign: 'middle'
    }
  }), "\u504F\u5DEE\u5024 ", React.createElement("span", {
    className: "gv-en",
    style: {
      opacity: .6
    }
  }, "(\u53F3\u8EF8)")), React.createElement("span", {
    className: "gt-leg",
    style: {
      color: 'var(--c-text-mute)'
    }
  }, "\u7DDA\u306E\u8272\uFF1D\u5206\u91CE")), React.createElement("div", {
    className: "gt-fieldchips"
  }, d.fields.map(f => {
    const on = sel.has(f);
    const c = colorForField(det, subject, f);
    const hasData = d.rate[f].some(v => v != null);
    return React.createElement("button", {
      key: f,
      className: `gt-fchip ${on ? 'on' : ''}`,
      onClick: () => toggleField(f),
      style: on ? {
        borderColor: c,
        color: c,
        background: c + '14'
      } : hasData ? undefined : {
        opacity: 0.5
      }
    }, React.createElement("span", {
      className: "gt-fchip-dot",
      style: {
        background: on ? c : 'var(--c-text-mute)'
      }
    }), f);
  })), React.createElement("div", {
    className: "gt-fd"
  }, React.createElement("div", {
    className: "gt-tests-h"
  }, React.createElement("span", null, "\u5206\u91CE\u3054\u3068\u306E\u6708\u6B21"), React.createElement("span", {
    className: "gt-tests-count gv-num"
  }, "\u5F97\u70B9\u7387 \xB7 \u504F\u5DEE\u5024 / ", order.length, " \u5206\u91CE")), order.length ? React.createElement("div", {
    className: "gt-scroll"
  }, order.map(f => {
    const c = colorForField(det, subject, f);
    const present = months.map((m, i) => ({
      m,
      i
    })).filter(({
      i
    }) => d.rate[f][i] != null);
    return React.createElement("div", {
      key: f,
      className: "gt-fd-group"
    }, React.createElement("div", {
      className: "gt-fd-name"
    }, React.createElement("span", {
      className: "gt-fchip-dot",
      style: {
        background: c
      }
    }), f), present.map(({
      m,
      i
    }) => React.createElement("div", {
      key: i,
      className: "gt-fd-row"
    }, React.createElement("span", {
      className: "gt-fd-month gv-num"
    }, monthShort(m)), React.createElement("span", {
      className: "gt-fd-rate gv-num"
    }, d.rate[f][i], React.createElement("small", null, "%")), React.createElement("span", {
      className: "gt-fd-hen gv-num"
    }, "\u504F ", d.hensachi[f][i]))));
  })) : React.createElement("div", {
    className: "gt-note gt-note-soft"
  }, "\u5206\u91CE\u3092\u9078\u629E\u3059\u308B\u3068\u3001\u6708\u6BCE\u306E\u5F97\u70B9\u7387\u30FB\u504F\u5DEE\u5024\u304C\u4E00\u89A7\u8868\u793A\u3055\u308C\u307E\u3059\u3002")), React.createElement("div", {
    className: "gt-note gt-note-soft"
  }, "\u30C1\u30C3\u30D7\u3092\u30AF\u30EA\u30C3\u30AF\u3067\u5206\u91CE\u306E\u7DDA\u3092\u8868\u793A\uFF0F\u975E\u8868\u793A\u3002\u521D\u671F\u306F\u76F4\u8FD1\u6708\u306E\u4E0A\u4F4D3\u30FB\u4E0B\u4F4D3\u5206\u91CE\u3002")), fv === 'strengths' && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "gt-seg gt-seg-sm"
  }, METRICS.filter(m => m.key !== 'avgRate').map(m => React.createElement("button", {
    key: m.key,
    className: `gt-seg-btn ${m.key === swMetricKey ? 'on' : ''}`,
    onClick: () => setMetric(m.key)
  }, m.label))), React.createElement("div", {
    className: "tw-sw-grid"
  }, React.createElement("div", {
    className: "gt-sw-col"
  }, React.createElement("div", {
    className: "gt-sw-h"
  }, React.createElement("span", {
    className: "gt-sw-badge strong"
  }, "\u5F97\u610F"), "\u76F4\u8FD1\u306E\u4E0A\u4F4D", cnt), strong.map(({
    f,
    v,
    prev
  }) => React.createElement("div", {
    key: f,
    className: "gt-sw-row"
  }, React.createElement("span", {
    className: "gt-sw-bar",
    style: {
      background: 'var(--c-primary)',
      width: `${Math.max(8, swMetric.unit === '%' ? v : v)}%`
    }
  }), React.createElement("span", {
    className: "gt-sw-name"
  }, f), React.createElement("span", {
    className: "gt-sw-v gv-num"
  }, v, swMetric.unit), React.createElement(Delta2, {
    v: prev != null ? v - prev : null
  })))), React.createElement("div", {
    className: "gt-sw-col"
  }, React.createElement("div", {
    className: "gt-sw-h"
  }, React.createElement("span", {
    className: "gt-sw-badge weak"
  }, "\u82E6\u624B"), "\u76F4\u8FD1\u306E\u4E0B\u4F4D", cnt), weak.map(({
    f,
    v,
    prev
  }) => React.createElement("div", {
    key: f,
    className: "gt-sw-row"
  }, React.createElement("span", {
    className: "gt-sw-bar",
    style: {
      background: 'var(--c-accent)',
      width: `${Math.max(8, v)}%`
    }
  }), React.createElement("span", {
    className: "gt-sw-name"
  }, f), React.createElement("span", {
    className: "gt-sw-v gv-num"
  }, v, swMetric.unit), React.createElement(Delta2, {
    v: prev != null ? v - prev : null
  })))))), fv === 'strengths' && React.createElement("div", {
    className: "gt-note gt-note-soft",
    style: {
      marginTop: 14
    }
  }, "\u5F97\u70B9\u50BE\u5411\u306F\u300C\u76F4\u8FD1\u306E\u5024\u304C\u3042\u308B\u6708\u300D\u3067\u5224\u5B9A\u3002\u5E73\u5747\u5F97\u70B9\u7387\u306F\u30AF\u30E9\u30B9\u96E3\u6613\u5EA6\u306E\u6307\u6A19\u306E\u305F\u3081\u3001\u3053\u306E\u8868\u793A\u3067\u306F\u9664\u5916\u3057\u3066\u3044\u307E\u3059\u3002")))));
}
Object.assign(window, {
  StudentDetailScreen
});