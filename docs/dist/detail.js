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
  }, "授業の欠席率"), React.createElement("span", {
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
function fmt1(v) {
  if (v == null || Number.isNaN(+v)) return '–';
  return (Math.round(+v * 10) / 10).toFixed(1);
}
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
function rankFields(d, key) {
  return d.fields.map(f => {
    const {
      last,
      prev
    } = latestPair(d[key][f]);
    return {
      f,
      v: last,
      prev
    };
  }).filter(x => x.v != null).sort((a, b) => b.v - a.v);
}
function Delta2({
  v,
  unit
}) {
  if (v == null) return React.createElement("span", {
    className: "gt-sw-d flat gv-num"
  }, "–");
  const dv = Math.round(v * 10) / 10;
  const cls = dv > 0.05 ? 'up' : dv < -0.05 ? 'down' : 'flat';
  return React.createElement("span", {
    className: `gt-sw-d ${cls} gv-num`
  }, dv > 0 ? '+' : '', dv.toFixed(1));
}
const MOCK_FULL_MARKS = 1000;
function Num({
  v,
  sub,
  strong
}) {
  if (v == null) return React.createElement("span", {
    className: "mk-na"
  }, "–");
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
    }, "模試の成績推移", React.createElement("span", {
      className: "gt-card-title-sub"
    }, "共通テスト型マーク模試"))), React.createElement("div", {
      className: "gt-note gt-note-soft"
    }, "マーク模試の記録がまだありません。"));
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
  }, "模試の成績推移", React.createElement("span", {
    className: "gt-card-title-sub"
  }, "共通テスト型マーク模試")), React.createElement("div", {
    className: "gt-card-aux gv-en"
  }, mock.exams.length, " 回受験")), React.createElement("div", {
    className: "mk-top"
  }, React.createElement("div", {
    className: "mk-asp"
  }, React.createElement("div", {
    className: "mk-asp-k"
  }, "志望校 ", React.createElement("span", {
    className: "mk-asp-note"
  }, "最新")), React.createElement("div", {
    className: "mk-asp-v"
  }, mock.aspiration), mock.aspHistory.length > 1 && React.createElement("div", {
    className: "mk-asp-hist"
  }, "履歴：", mock.aspHistory.map((h, i) => React.createElement("span", {
    key: i
  }, i > 0 ? ' → ' : '', React.createElement("span", {
    className: i === mock.aspHistory.length - 1 ? 'cur' : ''
  }, h.school))))), React.createElement("div", {
    className: "mk-sumrow"
  }, React.createElement("div", {
    className: "mk-sum"
  }, React.createElement("div", {
    className: "mk-sum-k"
  }, "直近 合計点"), React.createElement("div", {
    className: "mk-sum-v"
  }, React.createElement("span", {
    className: "gv-num"
  }, latestForDelta ? latestForDelta.total : latest.total), React.createElement("span", {
    className: "mk-sum-u"
  }, "/ ", MOCK_FULL_MARKS)), delta != null && React.createElement("div", {
    className: `mk-sum-d ${delta >= 0 ? 'up' : 'down'} gv-num`
  }, delta >= 0 ? '▲' : '▼', " ", Math.abs(delta), React.createElement("small", null, "前回比"))), React.createElement("div", {
    className: "mk-sum"
  }, React.createElement("div", {
    className: "mk-sum-k"
  }, "自己ベスト"), React.createElement("div", {
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
  }, "記入日"), React.createElement("th", {
    rowSpan: "2",
    className: "mk-sticky mk-name"
  }, "試験名"), React.createElement("th", {
    colSpan: "4",
    className: "mk-g-ko"
  }, "国語"), React.createElement("th", {
    colSpan: "3",
    className: "mk-g-en"
  }, "英語"), React.createElement("th", {
    colSpan: "2",
    className: "mk-g-ma"
  }, "数学"), React.createElement("th", {
    colSpan: "6",
    className: "mk-g-ri"
  }, "理科"), React.createElement("th", {
    colSpan: "4",
    className: "mk-g-sh"
  }, "社会"), React.createElement("th", {
    rowSpan: "2",
    className: "mk-g-jo"
  }, "情報"), React.createElement("th", {
    rowSpan: "2",
    className: "mk-tot"
  }, "合計点")), React.createElement("tr", {
    className: "mk-sub"
  }, React.createElement("th", null, "現代文"), React.createElement("th", null, "古文"), React.createElement("th", null, "漢文"), React.createElement("th", {
    className: "mk-subtot"
  }, "合計"), React.createElement("th", null, "筆記"), React.createElement("th", null, "L"), React.createElement("th", {
    className: "mk-subtot"
  }, "合計"), React.createElement("th", null, "ⅠA"), React.createElement("th", null, "ⅡB"), React.createElement("th", {
    className: "mk-subjcol"
  }, "第一解答"), React.createElement("th", null, "点"), React.createElement("th", {
    className: "mk-subjcol"
  }, "第二解答"), React.createElement("th", null, "点"), React.createElement("th", {
    className: "mk-subjcol"
  }, "第三解答"), React.createElement("th", null, "点"), React.createElement("th", {
    className: "mk-subjcol"
  }, "第一解答"), React.createElement("th", null, "点"), React.createElement("th", {
    className: "mk-subjcol"
  }, "第二解答"), React.createElement("th", null, "点"))), React.createElement("tbody", null, rows.map((e, i) => React.createElement("tr", {
    key: i,
    className: e.full ? '' : 'mk-partial'
  }, React.createElement("td", {
    className: "mk-sticky mk-date gv-num"
  }, e.date.slice(5)), React.createElement("td", {
    className: "mk-sticky mk-name"
  }, e.name, !e.full && React.createElement("span", {
    className: "mk-pill"
  }, "英数")), React.createElement("td", null, React.createElement(Num, {
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
    }, "英数")), React.createElement("span", {
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
  }, "マーク模試(フォーム) シートの記録を新しい順に表示。「英数」は国語・理科・社会を含まない校内マーク模試です。志望校はフォーム I列の最新回答を採用しています。"));
}
const PRINT_RECENT_TESTS = 10;
const PRINT_CHART_W = 400;
function PrintSubjectBlock({
  det,
  subject
}) {
  const meta = SUBJECT_META[subject];
  const d = det.data[subject];
  const tt = d.totalTrend;
  if (!tt.length) return null;
  const latest = tt[tt.length - 1];
  const prev = tt[tt.length - 2];
  const delta = prev ? latest.total - prev.total : 0;
  const recent = tt.slice(-PRINT_RECENT_TESTS).reverse();
  const ranked = rankFields(d, 'hensachi');
  const cnt = swCount(subject);
  const strong = ranked.slice(0, cnt);
  const weak = ranked.slice(-cnt).reverse().filter(w => !strong.some(s => s.f === w.f));
  return React.createElement("section", {
    className: "pr-subject"
  }, React.createElement("div", {
    className: "pr-subject-h"
  }, React.createElement("span", {
    className: "pr-subject-dot",
    style: {
      background: meta.color
    }
  }), React.createElement("span", {
    className: "pr-subject-name"
  }, meta.label), React.createElement("span", {
    className: "pr-subject-en gv-en"
  }, meta.en), React.createElement("span", {
    className: "pr-subject-aux gv-en"
  }, tt.length, " TESTS")), React.createElement("div", {
    className: "pr-grid"
  }, React.createElement("div", {
    className: "gt-card"
  }, React.createElement("div", {
    className: "gt-card-head"
  }, React.createElement("div", {
    className: "gt-card-title"
  }, "合計点の推移")), React.createElement("div", {
    className: "gt-summary"
  }, React.createElement("div", {
    className: "gt-sum-main"
  }, React.createElement("div", {
    className: "gt-sum-k"
  }, "直近"), React.createElement("div", {
    className: "gt-sum-v"
  }, React.createElement("span", {
    className: "gv-num"
  }, fmt1(latest.total)), React.createElement("span", {
    className: "gt-sum-u"
  }, "点")), prev && React.createElement("div", {
    className: `gt-sum-delta ${delta >= 0 ? 'up' : 'down'}`
  }, delta >= 0 ? '▲' : '▼', " ", React.createElement("span", {
    className: "gv-num"
  }, fmt1(Math.abs(delta))))), React.createElement("div", {
    className: "gt-sum-sub"
  }, React.createElement("div", {
    className: "gt-sum-cell"
  }, React.createElement("span", {
    className: "k"
  }, "平均"), React.createElement("span", {
    className: "v gv-num"
  }, fmt1(latest.avg))), React.createElement("div", {
    className: "gt-sum-cell acc"
  }, React.createElement("span", {
    className: "k"
  }, "偏差値"), React.createElement("span", {
    className: "v gv-num"
  }, fmt1(latest.hensachi))))), tt.length >= 2 && React.createElement(React.Fragment, null, React.createElement(TotalTrendChart, {
    points: tt,
    width: PRINT_CHART_W
  }), React.createElement("div", {
    className: "gt-legend"
  }, React.createElement("span", {
    className: "gt-leg"
  }, React.createElement("span", {
    className: "gt-leg-line main"
  }), "合計点"), React.createElement("span", {
    className: "gt-leg"
  }, React.createElement("span", {
    className: "gt-leg-line dash"
  }), "平均点"), React.createElement("span", {
    className: "gt-leg"
  }, React.createElement("span", {
    className: "gt-leg-line acc"
  }), "偏差値 ", React.createElement("span", {
    className: "gv-en",
    style: {
      opacity: .6
    }
  }, "(右軸)"))))), React.createElement("div", {
    className: "gt-card"
  }, React.createElement("div", {
    className: "gt-card-head"
  }, React.createElement("div", {
    className: "gt-card-title"
  }, "テストごとの記録"), React.createElement("div", {
    className: "gt-card-aux gv-num"
  }, "直近", recent.length, "件 / 全", tt.length, "件")), React.createElement("div", {
    className: "pr-tests"
  }, recent.map((p, i) => React.createElement("div", {
    key: i,
    className: "gt-test-row"
  }, React.createElement("span", {
    className: "gt-test-date gv-num"
  }, p.date.slice(5)), React.createElement("span", {
    className: "gt-test-name"
  }, p.test), React.createElement("span", {
    className: "gt-test-score gv-num"
  }, fmt1(p.total), React.createElement("small", null, "点")), React.createElement("span", {
    className: "gt-test-hen gv-num"
  }, "偏 ", fmt1(p.hensachi)))))), React.createElement("div", {
    className: "gt-card"
  }, React.createElement("div", {
    className: "gt-card-head"
  }, React.createElement("div", {
    className: "gt-card-title"
  }, "分野別の得点傾向", React.createElement("span", {
    className: "gt-card-title-sub"
  }, "直近の偏差値")), React.createElement("div", {
    className: "gt-card-aux gv-en"
  }, d.fields.length, " 分野")), React.createElement("div", {
    className: "gt-sw"
  }, React.createElement("div", {
    className: "gt-sw-col"
  }, React.createElement("div", {
    className: "gt-sw-h"
  }, React.createElement("span", {
    className: "gt-sw-badge strong"
  }, "得意"), "偏差値 上位", cnt), strong.map(({
    f,
    v,
    prev: pv
  }) => React.createElement("div", {
    key: f,
    className: "gt-sw-row"
  }, React.createElement("span", {
    className: "gt-sw-bar",
    style: {
      background: 'var(--c-primary)',
      width: `${Math.max(8, Math.min(100, v))}%`
    }
  }), React.createElement("span", {
    className: "gt-sw-name"
  }, f), React.createElement("span", {
    className: "gt-sw-v gv-num"
  }, fmt1(v)), React.createElement(Delta2, {
    v: pv != null ? v - pv : null
  })))), React.createElement("div", {
    className: "gt-sw-col"
  }, React.createElement("div", {
    className: "gt-sw-h"
  }, React.createElement("span", {
    className: "gt-sw-badge weak"
  }, "苦手"), "偏差値 下位", cnt), weak.map(({
    f,
    v,
    prev: pv
  }) => React.createElement("div", {
    key: f,
    className: "gt-sw-row"
  }, React.createElement("span", {
    className: "gt-sw-bar",
    style: {
      background: 'var(--c-accent)',
      width: `${Math.max(8, Math.min(100, v))}%`
    }
  }), React.createElement("span", {
    className: "gt-sw-name"
  }, f), React.createElement("span", {
    className: "gt-sw-v gv-num"
  }, fmt1(v)), React.createElement(Delta2, {
    v: pv != null ? v - pv : null
  }))))), React.createElement("div", {
    className: "pr-foot"
  }, "※ 分野別は「直近に値がある月」の偏差値（月次平均ベース）で判定。"))));
}
function PrintReport({
  det
}) {
  return React.createElement("div", {
    className: "gv-print-report",
    "aria-hidden": "true"
  }, det.subjects.map(s => React.createElement(PrintSubjectBlock, {
    key: s,
    det: det,
    subject: s
  })));
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
    let st = document.getElementById('gv-print-page');
    if (!st) {
      st = document.createElement('style');
      st.id = 'gv-print-page';
      document.head.appendChild(st);
    }
    st.textContent = '@page { size: B4 landscape; margin: 7mm; }';
    window.print();
  };
  const swMetricKey = metric === 'avgRate' ? 'rate' : metric;
  const swMetric = METRICS.find(m => m.key === swMetricKey);
  const ranked = rankFields(d, swMetricKey);
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
    }, Icon.chevL(14), " 一覧へ戻る"), React.createElement("h1", {
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
    }), React.createElement("span", null, "成績データを読み込み中…")), state === 'empty' && React.createElement("div", {
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
    }, "通信環境を確認して、もう一度お試しください。"), React.createElement("button", {
      className: "btn btn-quiet btn-sm",
      onClick: () => {}
    }, Icon.refresh(16), React.createElement("span", {
      style: {
        marginLeft: 6
      }
    }, "もう一度試す"))));
  }
  return React.createElement("div", {
    className: "tw-main tw-detail"
  }, React.createElement("div", {
    className: "tw-detail-topbar"
  }, React.createElement("button", {
    className: "tw-back",
    onClick: () => nav('back')
  }, Icon.chevL(14), " 一覧へ戻る"), React.createElement("div", {
    className: "gv-print-bar"
  }, React.createElement("button", {
    className: "sb-open-btn",
    onClick: () => nav('shibou', name)
  }, Icon.flag ? Icon.flag(14) : null, React.createElement("span", null, "おすすめ志望校")), React.createElement("button", {
    className: "gv-print-btn",
    onClick: onPrintPDF
  }, "PDF出力（B4・横）"))), React.createElement("div", {
    className: "tw-detail-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "tw-eyebrow"
  }, "REPORT · 成績推移"), React.createElement("h1", {
    className: "tw-detail-title"
  }, name, React.createElement("span", {
    className: "grade"
  }, det.grade)), React.createElement("div", {
    className: "tw-detail-meta"
  }, React.createElement("span", {
    className: "tw-hr-chip"
  }, "担任 ", det.homeroom, " 先生"), det.mock && det.mock.aspiration && React.createElement("span", {
    className: "tw-asp-inline"
  }, Icon.flag ? Icon.flag(13) : null, "志望校 ", React.createElement("b", null, det.mock.aspiration)))), React.createElement("div", {
    className: "tw-detail-right"
  }, React.createElement("div", {
    className: "tw-detail-en"
  }, meta.en), React.createElement(AttMini, {
    det: det
  }))), React.createElement(MockExamCard, {
    det: det
  }), React.createElement(PrintReport, {
    det: det
  }), React.createElement("div", {
    className: "tw-subject-section"
  }, React.createElement("div", {
    className: "tw-eyebrow tw-subject-eyebrow"
  }, "科目別の成績推移"), React.createElement("div", {
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
  }, "合計点の推移"), React.createElement("div", {
    className: "gt-card-aux gv-en"
  }, tt.length, " TESTS")), React.createElement("div", {
    className: "gt-summary"
  }, React.createElement("div", {
    className: "gt-sum-main"
  }, React.createElement("div", {
    className: "gt-sum-k"
  }, "直近"), React.createElement("div", {
    className: "gt-sum-v"
  }, React.createElement("span", {
    className: "gv-num"
  }, fmt1(latest.total)), React.createElement("span", {
    className: "gt-sum-u"
  }, "点")), prev && React.createElement("div", {
    className: `gt-sum-delta ${delta >= 0 ? 'up' : 'down'}`
  }, delta >= 0 ? '▲' : '▼', " ", React.createElement("span", {
    className: "gv-num"
  }, fmt1(Math.abs(delta))))), React.createElement("div", {
    className: "gt-sum-sub"
  }, React.createElement("div", {
    className: "gt-sum-cell"
  }, React.createElement("span", {
    className: "k"
  }, "平均"), React.createElement("span", {
    className: "v gv-num"
  }, fmt1(latest.avg))), React.createElement("div", {
    className: "gt-sum-cell acc"
  }, React.createElement("span", {
    className: "k"
  }, "偏差値"), React.createElement("span", {
    className: "v gv-num"
  }, fmt1(latest.hensachi))))), tt.length > 14 && React.createElement("div", {
    className: "gt-range"
  }, [['直近12', 12], ['直近30', 30], ['全期間', 'all']].map(([lb, v]) => React.createElement("button", {
    key: lb,
    className: `gt-range-btn ${range === v ? 'on' : ''}`,
    onClick: () => setRange(v)
  }, lb)), React.createElement("span", {
    className: "gt-range-count gv-num"
  }, view.length, " / ", tt.length, " 件")), view.length >= 2 ? React.createElement(React.Fragment, null, React.createElement(Measured, {
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
  }), "合計点"), React.createElement("span", {
    className: "gt-leg"
  }, React.createElement("span", {
    className: "gt-leg-line dash"
  }), "平均点"), React.createElement("span", {
    className: "gt-leg"
  }, React.createElement("span", {
    className: "gt-leg-line acc"
  }), "偏差値 ", React.createElement("span", {
    className: "gv-en",
    style: {
      opacity: .6
    }
  }, "(右軸)")))) : React.createElement("div", {
    className: "gt-note"
  }, "データが ", view.length, " 件のため、推移グラフは2件以上で表示されます。"), React.createElement("div", {
    className: "gt-tests"
  }, React.createElement("div", {
    className: "gt-tests-h"
  }, React.createElement("span", null, "テストごとの記録"), React.createElement("span", {
    className: "gt-tests-count gv-num"
  }, "全 ", tt.length, " 件")), React.createElement("div", {
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
  }, fmt1(p.total), React.createElement("small", null, "点")), React.createElement("span", {
    className: "gt-test-hen gv-num"
  }, "偏 ", fmt1(p.hensachi))))))), React.createElement("div", {
    className: "gt-card"
  }, React.createElement("div", {
    className: "gt-card-head"
  }, React.createElement("div", {
    className: "gt-card-title"
  }, "分野別の推移", React.createElement("span", {
    className: "gt-card-title-sub"
  }, "月次平均")), React.createElement("div", {
    className: "gt-card-aux gv-en"
  }, d.fields.length, " 分野")), React.createElement("div", {
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
  }, "強弱6"), React.createElement("button", {
    className: "gt-preset",
    onClick: () => setSel(new Set(d.fields))
  }, "全て"), React.createElement("button", {
    className: "gt-preset",
    onClick: () => setSel(new Set())
  }, "クリア"), React.createElement("span", {
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
    className: "gt-leg-line solid-n"
  }), "得点率"), React.createElement("span", {
    className: "gt-leg"
  }, React.createElement("span", {
    className: "gt-leg-line dash-n"
  }), "平均得点率"), React.createElement("span", {
    className: "gt-leg"
  }, React.createElement("span", {
    className: "gt-leg-line thin-n"
  }), "偏差値 ", React.createElement("span", {
    className: "gv-en",
    style: {
      opacity: .6
    }
  }, "(右軸)")), React.createElement("span", {
    className: "gt-leg gt-leg-note"
  }, "線の色＝分野")), React.createElement("div", {
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
  }, React.createElement("span", null, "分野ごとの月次"), React.createElement("span", {
    className: "gt-tests-count gv-num"
  }, "得点率 · 偏差値 / ", order.length, " 分野")), order.length ? React.createElement("div", {
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
    }, fmt1(d.rate[f][i]), React.createElement("small", null, "%")), React.createElement("span", {
      className: "gt-fd-hen gv-num"
    }, "偏 ", fmt1(d.hensachi[f][i])))));
  })) : React.createElement("div", {
    className: "gt-note gt-note-soft"
  }, "分野を選択すると、月毎の得点率・偏差値が一覧表示されます。")), React.createElement("div", {
    className: "gt-note gt-note-soft"
  }, "チップをクリックで分野の線を表示／非表示。初期は直近月の上位3・下位3分野。")), fv === 'strengths' && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "gt-seg gt-seg-sm"
  }, METRICS.filter(m => m.key !== 'avgRate').map(m => React.createElement("button", {
    key: m.key,
    className: `gt-seg-btn ${m.key === swMetricKey ? 'on' : ''}`,
    onClick: () => setMetric(m.key)
  }, m.label))), React.createElement("div", {
    className: "gt-sw"
  }, React.createElement("div", {
    className: "gt-sw-col"
  }, React.createElement("div", {
    className: "gt-sw-h"
  }, React.createElement("span", {
    className: "gt-sw-badge strong"
  }, "得意"), "直近の上位", cnt), strong.map(({
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
  }, fmt1(v), swMetric.unit), React.createElement(Delta2, {
    v: prev != null ? v - prev : null
  })))), React.createElement("div", {
    className: "gt-sw-col"
  }, React.createElement("div", {
    className: "gt-sw-h"
  }, React.createElement("span", {
    className: "gt-sw-badge weak"
  }, "苦手"), "直近の下位", cnt), weak.map(({
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
  }, fmt1(v), swMetric.unit), React.createElement(Delta2, {
    v: prev != null ? v - prev : null
  })))))), fv === 'strengths' && React.createElement("div", {
    className: "gt-note gt-note-soft",
    style: {
      marginTop: 14
    }
  }, "得点傾向は「直近の値がある月」で判定。平均得点率はクラス難易度の指標のため、この表示では除外しています。")))));
}
function sbBandMeta(raw) {
  const b = raw || '';
  if (b.indexOf('安全') >= 0) return {
    label: '安全',
    sub: '合格圏',
    accent: '#4e9b73',
    soft: 'rgba(78,155,115,0.14)',
    ink: '#2f7d52'
  };
  if (b.indexOf('適正') >= 0) return {
    label: '適正',
    sub: '実力相応',
    accent: '#7aa84a',
    soft: 'rgba(120,170,90,0.16)',
    ink: '#5a7d2a'
  };
  if (b.indexOf('挑戦') >= 0) return {
    label: '挑戦',
    sub: 'やや上',
    accent: '#e0883c',
    soft: 'rgba(224,136,60,0.16)',
    ink: '#b5642a'
  };
  if (b.indexOf('再考') >= 0) return {
    label: '要再考',
    sub: '現状は厳しい',
    accent: '#c95b5b',
    soft: 'rgba(201,91,91,0.14)',
    ink: '#a13b3b'
  };
  if (b.indexOf('推薦') >= 0) return {
    label: '推薦',
    sub: '別ルート',
    accent: '#5b7fa1',
    soft: 'rgba(91,127,161,0.14)',
    ink: '#3f6088'
  };
  return {
    label: '判定保留',
    sub: '模試成績が未登録',
    accent: '#a7a79c',
    soft: 'rgba(120,120,110,0.12)',
    ink: '#777'
  };
}
function sbNum(v) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}
function SbBar({
  you,
  line,
  accent
}) {
  if (you == null) return null;
  const c = n => Math.max(0, Math.min(100, n));
  return React.createElement("div", {
    className: "sb-bar"
  }, React.createElement("div", {
    className: "sb-track"
  }, React.createElement("div", {
    className: "sb-fill",
    style: {
      width: c(you) + '%',
      background: accent
    }
  }), line != null && React.createElement("div", {
    className: "sb-linemark",
    style: {
      left: c(line) + '%'
    }
  })), React.createElement("div", {
    className: "sb-barlab"
  }, React.createElement("span", {
    style: {
      color: accent,
      fontWeight: 700
    }
  }, "本人 ", you, "%"), line != null && React.createElement("span", {
    className: "sb-linelab"
  }, "合格ライン ", line, "%")));
}
function ShibouScreen({
  nav,
  name
}) {
  const [st, setSt] = React.useState('loading');
  const [rows, setRows] = React.useState([]);
  React.useEffect(() => {
    let alive = true;
    setSt('loading');
    const apply = res => {
      if (!alive) return;
      if (res.status === 'ok') {
        setRows(res.results || []);
        setSt((res.results || []).length ? 'ok' : 'empty');
      } else if (res.status === 'empty') {
        setRows([]);
        setSt('empty');
      } else if (res.status === 'error') {
        setSt('error');
      } else setSt('error');
    };
    GVApi.fetchShibou(name, {
      onRevalidate: apply
    }).then(apply).catch(() => {
      if (alive) setSt('error');
    });
    return () => {
      alive = false;
    };
  }, [name]);
  return React.createElement("div", {
    className: "tw-main tw-detail"
  }, React.createElement("div", {
    className: "tw-detail-topbar"
  }, React.createElement("button", {
    className: "tw-back",
    onClick: () => nav('student', name)
  }, Icon.chevL(14), " 成績へ戻る")), React.createElement("div", {
    className: "tw-detail-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "tw-eyebrow"
  }, "RECOMMEND · おすすめ志望校"), React.createElement("h1", {
    className: "tw-detail-title"
  }, name), React.createElement("div", {
    className: "tw-detail-meta"
  }, React.createElement("span", {
    className: "tw-hr-chip"
  }, "生徒アプリに表示中の調査結果と同じ内容")))), st === 'loading' && React.createElement("div", {
    className: "tw-loadwrap"
  }, React.createElement("div", {
    className: "spinner"
  }), React.createElement("span", null, "志望校の調査結果を読み込み中…")), st === 'error' && React.createElement("div", {
    className: "tw-empty"
  }, React.createElement("div", {
    className: "tw-empty-ic",
    style: {
      background: 'var(--c-accent-soft)',
      color: '#9A4309'
    }
  }, Icon.alert(26)), React.createElement("div", {
    className: "tw-empty-t1"
  }, "取得できませんでした"), React.createElement("div", {
    className: "tw-empty-t2"
  }, "通信環境を確認して、もう一度お試しください。"), React.createElement("button", {
    className: "btn btn-quiet btn-sm",
    onClick: () => nav('shibou', name)
  }, Icon.refresh(16), React.createElement("span", {
    style: {
      marginLeft: 6
    }
  }, "もう一度試す"))), st === 'empty' && React.createElement("div", {
    className: "tw-empty"
  }, React.createElement("div", {
    className: "tw-empty-ic"
  }, Icon.flag ? Icon.flag(24) : Icon.chart(26)), React.createElement("div", {
    className: "tw-empty-t1"
  }, "まだ調査結果がありません"), React.createElement("div", {
    className: "tw-empty-t2"
  }, "この生徒が生徒用アプリで「志望校調査を依頼」し、エージェントの調査が完了すると、ここに表示されます。"), React.createElement("button", {
    className: "btn btn-primary btn-sm",
    onClick: () => nav('student', name)
  }, "成績へ戻る")), st === 'ok' && React.createElement("div", {
    className: "sb-list"
  }, rows.map((r, i) => {
    const m = sbBandMeta(String(r['判定'] || ''));
    const you = sbNum(r['傾斜後得点率']);
    const line = sbNum(r['ボーダー']);
    const dept = r['学部学科/日程'] || r['学部学科・日程'] || r['学部学科'] || '';
    return React.createElement("div", {
      key: i,
      className: "sb-card",
      style: {
        borderLeft: '5px solid ' + m.accent
      }
    }, React.createElement("div", {
      className: "sb-top"
    }, React.createElement("div", {
      className: "sb-rank"
    }, r['順位'] != null && r['順位'] !== '' ? r['順位'] : i + 1), React.createElement("div", {
      className: "sb-titles"
    }, React.createElement("div", {
      className: "sb-school"
    }, r['大学']), React.createElement("div", {
      className: "sb-dept"
    }, dept)), React.createElement("div", {
      className: "sb-band",
      style: {
        background: m.accent
      }
    }, React.createElement("div", {
      className: "sb-band-l"
    }, m.label), React.createElement("div", {
      className: "sb-band-s"
    }, m.sub))), React.createElement(SbBar, {
      you: you,
      line: line,
      accent: m.accent
    }), r['研究適合'] && React.createElement("div", {
      className: "sb-block"
    }, React.createElement("div", {
      className: "sb-block-h"
    }, "研究内容"), React.createElement("div", {
      className: "sb-block-b"
    }, r['研究適合'])), r['注意'] && React.createElement("div", {
      className: "sb-block",
      style: {
        background: m.soft
      }
    }, React.createElement("div", {
      className: "sb-block-h",
      style: {
        color: m.ink
      }
    }, "注意"), React.createElement("div", {
      className: "sb-block-b"
    }, r['注意'])));
  }), React.createElement("p", {
    className: "sb-foot"
  }, "※ 生徒用アプリに表示されているものと同じ内容です。研究内容を最優先に選定し、判定（得点の目安）は参考値です。")));
}
Object.assign(window, {
  StudentDetailScreen
});