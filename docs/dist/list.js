function Delta({
  v,
  suffix = ''
}) {
  const cls = v > 0.05 ? 'up' : v < -0.05 ? 'down' : 'flat';
  const arrow = v > 0.05 ? '▲' : v < -0.05 ? '▼' : '－';
  const num = v === 0 ? '0' : `${Math.abs(v)}`;
  return React.createElement("span", {
    className: `tw-delta ${cls} gv-num`
  }, arrow, cls !== 'flat' ? num : '', suffix);
}
function SubjStat({
  subj,
  s
}) {
  const m = SUBJECT_META[subj];
  return React.createElement("div", {
    className: "tw-sstat"
  }, React.createElement("div", {
    className: "tw-sstat-top"
  }, React.createElement("span", {
    className: "tw-sstat-lbl"
  }, React.createElement("span", {
    className: "sdot",
    style: {
      background: m.color
    }
  }), m.label)), React.createElement("div", {
    className: "tw-sstat-mid"
  }, React.createElement("span", {
    className: "tw-sstat-hen gv-num"
  }, React.createElement("small", null, "\u504F"), s.lastHensachi), React.createElement(Delta, {
    v: s.deltaHensachi
  })), React.createElement("div", {
    className: "tw-sstat-bot"
  }, "\u76F4\u8FD1 ", React.createElement("b", null, s.lastTotal), "\u70B9"), s.absence != null && React.createElement("div", {
    className: `tw-sstat-abs ${absLevel(s.absence)}`
  }, React.createElement("span", {
    className: "k"
  }, "\u6B20\u5E2D\u7387"), React.createElement("b", {
    className: "gv-num"
  }, absFmt(s.absence), React.createElement("small", null, "%"))));
}
function FlagBadges({
  flags
}) {
  return React.createElement(React.Fragment, null, flags.declining && React.createElement("span", {
    className: "tw-flag declining"
  }, React.createElement("span", {
    className: "fdot"
  }), "\u8981\u6CE8\u76EE \xB7 \u4E0B\u964D"), flags.stale && React.createElement("span", {
    className: "tw-flag stale"
  }, React.createElement("span", {
    className: "fdot"
  }), "\u9577\u671F\u672A\u53D7\u9A13"));
}
function Avatar({
  name
}) {
  return React.createElement("div", {
    className: "tw-name-av"
  }, name.replace(/\s/g, '').slice(0, 1));
}
function NameMain({
  st
}) {
  return React.createElement("div", {
    className: "tw-name-main"
  }, React.createElement("div", {
    className: "tw-name-t"
  }, st.name, React.createElement("span", {
    className: "tw-name-grade"
  }, st.grade)), React.createElement("div", {
    className: "tw-name-flags"
  }, React.createElement("span", {
    className: "tw-hr-chip"
  }, "\u62C5\u4EFB ", st.homeroom), React.createElement(FlagBadges, {
    flags: st.flags
  })));
}
const GRADE_ORDER = {
  '既卒': -1,
  '高3': 0,
  'H3': 0,
  '高2': 1,
  'H2': 1,
  '高1': 2,
  'H1': 2
};
const gradeRank = g => GRADE_ORDER[g] != null ? GRADE_ORDER[g] : 99;
const SORTS = [{
  key: 'name',
  label: '名前順'
}, {
  key: 'homeroom',
  label: '担任順'
}, {
  key: 'grade',
  label: '学年順（高3→高1）'
}, {
  key: 'subject',
  label: '科目順'
}, {
  key: 'hensachi',
  label: '直近偏差値が高い順'
}, {
  key: 'drop',
  label: '前回比 · 落ち込み順'
}, {
  key: 'recent',
  label: '最終受験が新しい順'
}];
function bestHensachi(st) {
  return Math.max(...st.subjects.map(s => st.perSubject[s].lastHensachi));
}
function firstSubjectIdx(st) {
  return Math.min(...st.subjects.map(s => SUBJECT_ORDER.indexOf(s)));
}
function sortStudents(list, key) {
  const arr = [...list];
  const byName = (a, b) => a.name.localeCompare(b.name, 'ja');
  if (key === 'name') return arr.sort(byName);
  if (key === 'homeroom') return arr.sort((a, b) => a.homeroom.localeCompare(b.homeroom, 'ja') || byName(a, b));
  if (key === 'grade') return arr.sort((a, b) => gradeRank(a.grade) - gradeRank(b.grade) || byName(a, b));
  if (key === 'subject') return arr.sort((a, b) => firstSubjectIdx(a) - firstSubjectIdx(b) || byName(a, b));
  if (key === 'hensachi') return arr.sort((a, b) => bestHensachi(b) - bestHensachi(a));
  if (key === 'drop') return arr.sort((a, b) => a.worstDelta - b.worstDelta);
  if (key === 'recent') return arr.sort((a, b) => b.daysSince - a.daysSince ? a.daysSince - b.daysSince : 0);
  return arr;
}
function ClassOverview({
  subject,
  students
}) {
  const m = SUBJECT_META[subject];
  const vals = students.filter(s => s.subjects.includes(subject)).map(s => s.perSubject[subject].lastHensachi);
  if (!vals.length) return null;
  const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10;
  const max = Math.max(...vals),
    min = Math.min(...vals);
  const rising = students.filter(s => s.subjects.includes(subject) && s.perSubject[subject].deltaHensachi > 0.05).length;
  return React.createElement("div", {
    className: "tw-overview"
  }, React.createElement("div", {
    className: "tw-overview-head"
  }, React.createElement("span", {
    className: "sdot",
    style: {
      background: m.color
    }
  }), React.createElement("span", {
    className: "t1"
  }, m.label, " \xB7 \u30AF\u30E9\u30B9\u4FEF\u77B0"), React.createElement("span", {
    className: "aux gv-num"
  }, vals.length, " \u540D \xB7 \u76F4\u8FD1\u504F\u5DEE\u5024\u306E\u5206\u5E03")), React.createElement("div", {
    className: "tw-overview-grid"
  }, React.createElement(Measured, {
    h: 132
  }, w => React.createElement(ClassHistogram, {
    values: vals,
    width: w,
    highlight: avg
  })), React.createElement("div", null, React.createElement("div", {
    className: "tw-overview-stats"
  }, React.createElement("div", {
    className: "tw-ostat"
  }, React.createElement("div", {
    className: "k"
  }, "\u5E73\u5747\u504F\u5DEE\u5024"), React.createElement("div", {
    className: "v acc gv-num"
  }, avg)), React.createElement("div", {
    className: "tw-ostat"
  }, React.createElement("div", {
    className: "k"
  }, "\u6700\u9AD8 / \u6700\u4F4E"), React.createElement("div", {
    className: "v gv-num"
  }, max, React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--c-text-mute)'
    }
  }, " / ", min))), React.createElement("div", {
    className: "tw-ostat"
  }, React.createElement("div", {
    className: "k"
  }, "\u524D\u56DE\u6BD4 \u4E0A\u6607"), React.createElement("div", {
    className: "v gv-num"
  }, rising, React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--c-text-mute)'
    }
  }, " \u540D")))), React.createElement("div", {
    className: "tw-overview-hint"
  }, "\u30AA\u30EC\u30F3\u30B8\u306E\u5E2F\uFF1D\u30AF\u30E9\u30B9\u5E73\u5747\u504F\u5DEE\u5024\u306E\u4F4D\u7F6E\u3002\u500B\u5225\u306E\u63A8\u79FB\u306F\u751F\u5F92\u3092\u30AF\u30EA\u30C3\u30AF\u3057\u3066\u78BA\u8A8D\u3067\u304D\u307E\u3059\u3002"))));
}
function TableView({
  students,
  onOpen
}) {
  return React.createElement("div", {
    className: "tw-tablecard"
  }, React.createElement("div", {
    className: "tw-tablescroll"
  }, React.createElement("table", {
    className: "tw-table"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "\u751F\u5F92"), React.createElement("th", null, "\u5C65\u4FEE\u79D1\u76EE"), React.createElement("th", null, "\u79D1\u76EE\u5225 \xB7 \u76F4\u8FD1\u504F\u5DEE\u5024 / \u524D\u56DE\u6BD4 / \u5408\u8A08\u70B9"), React.createElement("th", null, "\u6700\u7D42\u53D7\u9A13"), React.createElement("th", null))), React.createElement("tbody", null, students.map(st => {
    const flagged = st.flags.declining || st.flags.stale;
    return React.createElement("tr", {
      key: st.name,
      className: flagged ? 'flagged' : '',
      onClick: () => onOpen(st.name)
    }, React.createElement("td", null, React.createElement("div", {
      className: "tw-name"
    }, React.createElement(Avatar, {
      name: st.name
    }), React.createElement(NameMain, {
      st: st
    }))), React.createElement("td", null, React.createElement("div", {
      className: "tw-subjchips"
    }, st.subjects.map(s => React.createElement("span", {
      key: s,
      className: "tw-subjchip"
    }, React.createElement("span", {
      className: "sdot",
      style: {
        background: SUBJECT_META[s].color
      }
    }), SUBJECT_META[s].label)))), React.createElement("td", null, React.createElement("div", {
      className: "tw-stats-cell"
    }, st.subjects.map(s => React.createElement(SubjStat, {
      key: s,
      subj: s,
      s: st.perSubject[s]
    })))), React.createElement("td", null, React.createElement("div", {
      className: "tw-lastdate gv-num"
    }, dateMD(st.lastExamDate), React.createElement("span", {
      className: "ago"
    }, daysAgoLabel(st.daysSince)))), React.createElement("td", {
      className: "tw-chevcell"
    }, Icon.chevR(14)));
  })))));
}
function CardView({
  students,
  onOpen
}) {
  return React.createElement("div", {
    className: "tw-cards"
  }, students.map(st => {
    const flagged = st.flags.declining || st.flags.stale;
    return React.createElement("div", {
      key: st.name,
      className: `tw-card ${flagged ? 'flagged' : ''}`,
      onClick: () => onOpen(st.name)
    }, React.createElement("div", {
      className: "tw-card-head"
    }, React.createElement(Avatar, {
      name: st.name
    }), React.createElement(NameMain, {
      st: st
    })), React.createElement("div", {
      className: "tw-card-subjects"
    }, st.subjects.map(s => {
      const ss = st.perSubject[s];
      const m = SUBJECT_META[s];
      return React.createElement("div", {
        key: s,
        className: "tw-card-srow"
      }, React.createElement("span", {
        className: "lbl"
      }, React.createElement("span", {
        className: "sdot",
        style: {
          background: m.color
        }
      }), m.label), React.createElement("span", {
        className: "mid"
      }, React.createElement("span", {
        className: "hen gv-num",
        style: {
          color: m.color
        }
      }, React.createElement("small", null, "\u504F"), ss.lastHensachi), React.createElement(Delta, {
        v: ss.deltaHensachi
      }), React.createElement("span", {
        className: "tot"
      }, "\u76F4\u8FD1 ", React.createElement("b", null, ss.lastTotal), "\u70B9"), ss.absence != null && React.createElement("span", {
        className: `tw-card-abs ${absLevel(ss.absence)}`
      }, "\u6B20\u5E2D ", React.createElement("b", {
        className: "gv-num"
      }, absFmt(ss.absence), React.createElement("small", null, "%")))), React.createElement("span", {
        className: "spark"
      }, React.createElement(MiniSparkline, {
        values: ss.spark,
        color: m.color
      })));
    })), React.createElement("div", {
      className: "tw-card-foot"
    }, React.createElement("span", {
      className: "gv-num"
    }, "\u6700\u7D42\u53D7\u9A13 ", dateMD(st.lastExamDate), " \xB7 ", daysAgoLabel(st.daysSince)), React.createElement("span", {
      className: "open"
    }, "\u63A8\u79FB\u3092\u898B\u308B ", Icon.chevR(12))));
  }));
}
function HybridView({
  students,
  onOpen
}) {
  return React.createElement("div", {
    className: "tw-hybrid"
  }, students.map(st => {
    const flagged = st.flags.declining || st.flags.stale;
    return React.createElement("div", {
      key: st.name,
      className: `tw-hrow ${flagged ? 'flagged' : ''}`,
      onClick: () => onOpen(st.name)
    }, React.createElement("div", {
      className: "tw-hrow-id"
    }, React.createElement(Avatar, {
      name: st.name
    }), React.createElement(NameMain, {
      st: st
    })), React.createElement("div", {
      className: "tw-hrow-stats"
    }, st.subjects.map(s => React.createElement(SubjStat, {
      key: s,
      subj: s,
      s: st.perSubject[s]
    }))), React.createElement("div", {
      className: "tw-hrow-meta"
    }, React.createElement("div", {
      className: "tw-lastdate gv-num"
    }, dateMD(st.lastExamDate), React.createElement("span", {
      className: "ago"
    }, daysAgoLabel(st.daysSince))), React.createElement("span", {
      className: "tw-chevcell"
    }, Icon.chevR(14))));
  }));
}
function ListSkeleton({
  layout
}) {
  if (layout === 'cards') {
    return React.createElement("div", {
      className: "tw-cards"
    }, Array.from({
      length: 6
    }).map((_, i) => React.createElement("div", {
      key: i,
      className: "tw-skel-card"
    }, React.createElement("div", {
      style: {
        display: 'flex',
        gap: 11,
        alignItems: 'center'
      }
    }, React.createElement("div", {
      className: "tw-skel-row",
      style: {
        width: 34,
        height: 34,
        borderRadius: 10
      }
    }), React.createElement("div", {
      className: "tw-skel-row",
      style: {
        width: '50%'
      }
    })), React.createElement("div", {
      className: "tw-skel-row",
      style: {
        height: 38
      }
    }), React.createElement("div", {
      className: "tw-skel-row",
      style: {
        height: 38
      }
    }))));
  }
  return React.createElement("div", {
    className: "tw-tablecard",
    style: {
      padding: 16
    }
  }, Array.from({
    length: 8
  }).map((_, i) => React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 16,
      alignItems: 'center',
      padding: '12px 4px'
    }
  }, React.createElement("div", {
    className: "tw-skel-row",
    style: {
      width: 34,
      height: 34,
      borderRadius: 10,
      flex: 'none'
    }
  }), React.createElement("div", {
    className: "tw-skel-row",
    style: {
      width: '20%'
    }
  }), React.createElement("div", {
    className: "tw-skel-row",
    style: {
      width: '24%'
    }
  }), React.createElement("div", {
    className: "tw-skel-row",
    style: {
      flex: 1
    }
  }), React.createElement("div", {
    className: "tw-skel-row",
    style: {
      width: 56,
      flex: 'none'
    }
  }))));
}
const LIST_PREF = {
  get(k, d) {
    try {
      const v = sessionStorage.getItem('gv-listpref:' + k);
      return v == null ? d : v;
    } catch (e) {
      return d;
    }
  },
  set(k, v) {
    try {
      sessionStorage.setItem('gv-listpref:' + k, v);
    } catch (e) {}
  }
};
function StudentListScreen({
  nav,
  query,
  layout = 'table',
  state = 'normal',
  density,
  showOverview = true
}) {
  const [subjectFilter, setSubjectFilter] = React.useState(() => LIST_PREF.get('subjectFilter', 'all'));
  const [homeroomFilter, setHomeroomFilter] = React.useState(() => LIST_PREF.get('homeroomFilter', 'all'));
  const [sort, setSort] = React.useState(() => LIST_PREF.get('sort', 'name'));
  React.useEffect(() => {
    LIST_PREF.set('subjectFilter', subjectFilter);
  }, [subjectFilter]);
  React.useEffect(() => {
    LIST_PREF.set('homeroomFilter', homeroomFilter);
  }, [homeroomFilter]);
  React.useEffect(() => {
    LIST_PREF.set('sort', sort);
  }, [sort]);
  const q = (query || '').trim();
  let list = STUDENTS.filter(st => {
    if (subjectFilter !== 'all' && !st.subjects.includes(subjectFilter)) return false;
    if (homeroomFilter !== 'all' && st.homeroom !== homeroomFilter) return false;
    if (q && !st.name.replace(/\s/g, '').includes(q.replace(/\s/g, ''))) return false;
    return true;
  });
  list = sortStudents(list, sort);
  const flaggedCount = list.filter(s => s.flags.declining || s.flags.stale).length;
  return React.createElement("div", {
    className: "tw-main"
  }, React.createElement("div", {
    className: "tw-pagehead"
  }, React.createElement("div", {
    className: "tw-eyebrow"
  }, "REPORT \xB7 \u751F\u5F92\u4E00\u89A7"), React.createElement("div", {
    className: "tw-pagehead-row"
  }, React.createElement("h1", {
    className: "tw-title"
  }, "\u6210\u7E3E", React.createElement("span", {
    className: "accent"
  }, "\u4E00\u89A7")), React.createElement("div", {
    className: "tw-subtitle gv-num"
  }, STUDENTS.length, " \u540D\u3092\u62C5\u5F53", flaggedCount > 0 && React.createElement("span", null, " \xB7 ", React.createElement("span", {
    style: {
      color: 'var(--c-accent)',
      fontWeight: 600
    }
  }, flaggedCount, " \u540D \u8981\u6CE8\u76EE"))))), React.createElement("div", {
    className: "tw-toolbar"
  }, React.createElement("div", {
    className: "tw-filters"
  }, React.createElement("button", {
    className: `tw-fchip ${subjectFilter === 'all' ? 'on' : ''}`,
    onClick: () => setSubjectFilter('all')
  }, "\u5168\u79D1\u76EE"), SUBJECT_ORDER.map(s => {
    const m = SUBJECT_META[s];
    const on = subjectFilter === s;
    return React.createElement("button", {
      key: s,
      className: `tw-fchip subj ${on ? 'on' : ''}`,
      style: on ? {
        ['--sc']: m.color
      } : undefined,
      onClick: () => setSubjectFilter(on ? 'all' : s)
    }, React.createElement("span", {
      className: "sdot",
      style: {
        background: m.color
      }
    }), m.label);
  })), React.createElement("div", {
    className: "tw-toolbar-right"
  }, React.createElement("span", {
    className: "tw-count gv-num"
  }, list.length, " \u4EF6\u8868\u793A"), React.createElement("div", {
    className: "tw-sort"
  }, React.createElement("span", null, "\u62C5\u4EFB"), React.createElement("select", {
    value: homeroomFilter,
    onChange: e => setHomeroomFilter(e.target.value)
  }, React.createElement("option", {
    value: "all"
  }, "\u5168\u62C5\u4EFB"), HOMEROOMS.map(h => React.createElement("option", {
    key: h,
    value: h
  }, h, " \u5148\u751F")))), React.createElement("div", {
    className: "tw-sort"
  }, React.createElement("span", null, "\u4E26\u3079\u66FF\u3048"), React.createElement("select", {
    value: sort,
    onChange: e => setSort(e.target.value)
  }, SORTS.map(o => React.createElement("option", {
    key: o.key,
    value: o.key
  }, o.label)))))), showOverview && subjectFilter !== 'all' && state === 'normal' && React.createElement(ClassOverview, {
    subject: subjectFilter,
    students: STUDENTS
  }), state === 'loading' && React.createElement(React.Fragment, null, React.createElement(ListSkeleton, {
    layout: layout
  }), React.createElement("div", {
    className: "tw-loadwrap"
  }, React.createElement("div", {
    className: "spinner"
  }), React.createElement("span", null, "\u751F\u5F92\u30C7\u30FC\u30BF\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026"))), state === 'empty' && React.createElement("div", {
    className: "tw-empty"
  }, React.createElement("div", {
    className: "tw-empty-ic"
  }, Icon.user(28)), React.createElement("div", {
    className: "tw-empty-t1"
  }, "\u62C5\u5F53\u751F\u5F92\u304C\u307E\u3060\u3044\u307E\u305B\u3093"), React.createElement("div", {
    className: "tw-empty-t2"
  }, "\u751F\u5F92\u304C\u70B9\u6570\u5831\u544A\u3092\u59CB\u3081\u308B\u3068\u3001\u3053\u3053\u306B\u4E00\u89A7\u3067\u8868\u793A\u3055\u308C\u307E\u3059\u3002", React.createElement("br", null), "\u914D\u5E03\u30EA\u30F3\u30AF\u30FB\u30C8\u30FC\u30AF\u30F3\u306E\u72B6\u6CC1\u306F\u7BA1\u7406\u8005\u306B\u3054\u78BA\u8A8D\u304F\u3060\u3055\u3044\u3002")), state === 'error' && React.createElement("div", {
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
  }, "\u3082\u3046\u4E00\u5EA6\u8A66\u3059"))), state === 'normal' && (list.length === 0 ? React.createElement("div", {
    className: "tw-empty"
  }, React.createElement("div", {
    className: "tw-empty-ic",
    style: {
      background: 'var(--c-bg-warm)',
      color: 'var(--c-text-mute)'
    }
  }, Icon.search(26)), React.createElement("div", {
    className: "tw-empty-t1"
  }, "\u8A72\u5F53\u3059\u308B\u751F\u5F92\u304C\u3044\u307E\u305B\u3093"), React.createElement("div", {
    className: "tw-empty-t2"
  }, "\u691C\u7D22\u6761\u4EF6\u30FB\u79D1\u76EE\u30D5\u30A3\u30EB\u30BF\u3092\u5909\u3048\u3066\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002")) : React.createElement(React.Fragment, null, layout === 'table' && React.createElement(TableView, {
    students: list,
    onOpen: n => nav('student', n)
  }), layout === 'cards' && React.createElement(CardView, {
    students: list,
    onOpen: n => nav('student', n)
  }), layout === 'hybrid' && React.createElement(HybridView, {
    students: list,
    onOpen: n => nav('student', n)
  }))));
}
Object.assign(window, {
  StudentListScreen
});